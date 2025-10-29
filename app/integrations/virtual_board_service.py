import os
import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel
from fastapi import HTTPException
import logging
from enum import Enum

logger = logging.getLogger(__name__)


class BoardElementType(str, Enum):
    """Types of elements that can be added to a virtual board."""
    TEXT = "text"
    IMAGE = "image"
    DRAWING = "drawing"
    STICKY_NOTE = "sticky_note"
    SHAPE = "shape"
    ARROW = "arrow"
    MEDICAL_IMAGE = "medical_image"
    DIAGNOSIS_CARD = "diagnosis_card"
    PATIENT_INFO = "patient_info"
    TREATMENT_PLAN = "treatment_plan"


class BoardPermission(str, Enum):
    """Board permission levels."""
    VIEW = "view"
    COMMENT = "comment"
    EDIT = "edit"
    ADMIN = "admin"


class BoardElement(BaseModel):
    """Individual element on a virtual board."""
    element_id: str
    element_type: BoardElementType
    position_x: float
    position_y: float
    width: float
    height: float
    content: Dict[str, Any]  # Element-specific content
    style: Dict[str, Any] = {}  # Styling properties
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    layer: int = 0  # Z-index for layering
    locked: bool = False
    visible: bool = True


class BoardComment(BaseModel):
    """Comment on a board element or general board."""
    comment_id: str
    element_id: Optional[str] = None  # None for general board comments
    author_id: str
    author_name: str
    content: str
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved: bool = False
    replies: List['BoardComment'] = []


class BoardParticipant(BaseModel):
    """Participant in a virtual board session."""
    user_id: str
    name: str
    email: str
    role: str  # doctor, specialist, nurse, student
    permission: BoardPermission
    avatar_url: Optional[str] = None
    cursor_position: Optional[Dict[str, float]] = None
    last_active: datetime
    is_online: bool = False


class VirtualBoard(BaseModel):
    """Virtual collaborative board model."""
    board_id: str
    board_name: str
    description: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    case_id: Optional[str] = None  # Associated medical case
    patient_id: Optional[str] = None  # Associated patient
    board_type: str = "general"  # general, case_review, consultation, teaching
    status: str = "active"  # active, archived, locked
    participants: List[BoardParticipant] = []
    elements: List[BoardElement] = []
    comments: List[BoardComment] = []
    settings: Dict[str, Any] = {}
    template_id: Optional[str] = None
    tags: List[str] = []
    is_public: bool = False
    max_participants: int = 20


class BoardTemplate(BaseModel):
    """Template for creating standardized boards."""
    template_id: str
    template_name: str
    description: str
    category: str  # case_review, diagnosis, treatment_planning, teaching
    elements: List[BoardElement]
    settings: Dict[str, Any]
    created_by: str
    created_at: datetime
    is_public: bool = True
    usage_count: int = 0


class BoardSession(BaseModel):
    """Active board session tracking."""
    session_id: str
    board_id: str
    participant_id: str
    join_time: datetime
    leave_time: Optional[datetime] = None
    actions_count: int = 0
    last_action: Optional[datetime] = None


class VirtualBoardService:
    """Service for managing virtual collaborative boards."""
    
    def __init__(self):
        self.provider = os.getenv("BOARD_PROVIDER", "custom")  # custom, miro, figma, conceptboard
        
        # Miro configuration
        self.miro_client_id = os.getenv("MIRO_CLIENT_ID")
        self.miro_client_secret = os.getenv("MIRO_CLIENT_SECRET")
        self.miro_access_token = os.getenv("MIRO_ACCESS_TOKEN")
        
        # Figma configuration
        self.figma_access_token = os.getenv("FIGMA_ACCESS_TOKEN")
        
        # Custom board settings
        self.max_board_size = 10000  # pixels
        self.max_elements_per_board = 1000
        self.auto_save_interval = 30  # seconds
        
        # In-memory storage for development (use database in production)
        self.boards: Dict[str, VirtualBoard] = {}
        self.templates: Dict[str, BoardTemplate] = {}
        self.active_sessions: Dict[str, List[BoardSession]] = {}
        
        # Initialize default templates
        self._create_default_templates()
    
    async def create_board(
        self,
        board_name: str,
        created_by: str,
        board_type: str = "general",
        template_id: Optional[str] = None,
        case_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        settings: Dict[str, Any] = None
    ) -> VirtualBoard:
        """Create a new virtual board."""
        try:
            board_id = f"board_{uuid.uuid4().hex[:8]}"
            
            # Start with empty board or template
            elements = []
            if template_id and template_id in self.templates:
                template = self.templates[template_id]
                elements = [self._clone_element(elem, created_by) for elem in template.elements]
                template.usage_count += 1
            
            board = VirtualBoard(
                board_id=board_id,
                board_name=board_name,
                created_by=created_by,
                created_at=datetime.now(),
                case_id=case_id,
                patient_id=patient_id,
                board_type=board_type,
                elements=elements,
                settings=settings or {},
                template_id=template_id
            )
            
            # Add creator as admin participant
            creator_participant = BoardParticipant(
                user_id=created_by,
                name="Board Creator",  # This should come from user service
                email="creator@example.com",
                role="doctor",
                permission=BoardPermission.ADMIN,
                last_active=datetime.now(),
                is_online=True
            )
            board.participants.append(creator_participant)
            
            self.boards[board_id] = board
            
            logger.info(f"Created board {board_id} by user {created_by}")
            return board
            
        except Exception as e:
            logger.error(f"Failed to create board: {e}")
            raise HTTPException(status_code=500, detail="Failed to create board")
    
    async def get_board(self, board_id: str, user_id: str) -> VirtualBoard:
        """Get board information."""
        if board_id not in self.boards:
            raise HTTPException(status_code=404, detail="Board not found")
        
        board = self.boards[board_id]
        
        # Check if user has access
        if not self._has_board_access(board, user_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return board
    
    async def join_board(self, board_id: str, participant: BoardParticipant) -> VirtualBoard:
        """Add participant to board."""
        if board_id not in self.boards:
            raise HTTPException(status_code=404, detail="Board not found")
        
        board = self.boards[board_id]
        
        # Check if user is already a participant
        existing_participant = next(
            (p for p in board.participants if p.user_id == participant.user_id),
            None
        )
        
        if existing_participant:
            existing_participant.is_online = True
            existing_participant.last_active = datetime.now()
        else:
            if len(board.participants) >= board.max_participants:
                raise HTTPException(status_code=400, detail="Board is full")
            
            participant.last_active = datetime.now()
            participant.is_online = True
            board.participants.append(participant)
        
        # Create session
        session = BoardSession(
            session_id=f"session_{uuid.uuid4().hex[:8]}",
            board_id=board_id,
            participant_id=participant.user_id,
            join_time=datetime.now()
        )
        
        if board_id not in self.active_sessions:
            self.active_sessions[board_id] = []
        self.active_sessions[board_id].append(session)
        
        logger.info(f"User {participant.user_id} joined board {board_id}")
        return board
    
    async def leave_board(self, board_id: str, user_id: str) -> bool:
        """Remove participant from board."""
        if board_id not in self.boards:
            return False
        
        board = self.boards[board_id]
        
        # Update participant status
        for participant in board.participants:
            if participant.user_id == user_id:
                participant.is_online = False
                participant.last_active = datetime.now()
                break
        
        # End session
        if board_id in self.active_sessions:
            for session in self.active_sessions[board_id]:
                if session.participant_id == user_id and not session.leave_time:
                    session.leave_time = datetime.now()
                    break
        
        logger.info(f"User {user_id} left board {board_id}")
        return True
    
    async def add_element(
        self,
        board_id: str,
        element_type: BoardElementType,
        position_x: float,
        position_y: float,
        width: float,
        height: float,
        content: Dict[str, Any],
        created_by: str,
        style: Dict[str, Any] = None
    ) -> BoardElement:
        """Add element to board."""
        if board_id not in self.boards:
            raise HTTPException(status_code=404, detail="Board not found")
        
        board = self.boards[board_id]
        
        if not self._has_edit_permission(board, created_by):
            raise HTTPException(status_code=403, detail="No edit permission")
        
        if len(board.elements) >= self.max_elements_per_board:
            raise HTTPException(status_code=400, detail="Board element limit reached")
        
        element = BoardElement(
            element_id=f"elem_{uuid.uuid4().hex[:8]}",
            element_type=element_type,
            position_x=position_x,
            position_y=position_y,
            width=width,
            height=height,
            content=content,
            style=style or {},
            created_by=created_by,
            created_at=datetime.now(),
            layer=len(board.elements)  # Add to top layer
        )
        
        board.elements.append(element)
        board.updated_at = datetime.now()
        
        # Update session activity
        self._update_session_activity(board_id, created_by)
        
        logger.info(f"Added {element_type} element to board {board_id}")
        return element
    
    async def update_element(
        self,
        board_id: str,
        element_id: str,
        updates: Dict[str, Any],
        updated_by: str
    ) -> BoardElement:
        """Update board element."""
        if board_id not in self.boards:
            raise HTTPException(status_code=404, detail="Board not found")
        
        board = self.boards[board_id]
        
        if not self._has_edit_permission(board, updated_by):
            raise HTTPException(status_code=403, detail="No edit permission")
        
        element = next(
            (elem for elem in board.elements if elem.element_id == element_id),
            None
        )
        
        if not element:
            raise HTTPException(status_code=404, detail="Element not found")
        
        if element.locked and element.created_by != updated_by:
            raise HTTPException(status_code=403, detail="Element is locked")
        
        # Apply updates
        for key, value in updates.items():
            if hasattr(element, key):
                setattr(element, key, value)
        
        element.updated_at = datetime.now()
        board.updated_at = datetime.now()
        
        self._update_session_activity(board_id, updated_by)
        
        logger.info(f"Updated element {element_id} on board {board_id}")
        return element
    
    async def delete_element(
        self,
        board_id: str,
        element_id: str,
        deleted_by: str
    ) -> bool:
        """Delete board element."""
        if board_id not in self.boards:
            raise HTTPException(status_code=404, detail="Board not found")
        
        board = self.boards[board_id]
        
        if not self._has_edit_permission(board, deleted_by):
            raise HTTPException(status_code=403, detail="No edit permission")
        
        element_index = next(
            (i for i, elem in enumerate(board.elements) if elem.element_id == element_id),
            None
        )
        
        if element_index is None:
            raise HTTPException(status_code=404, detail="Element not found")
        
        element = board.elements[element_index]
        
        if element.locked and element.created_by != deleted_by:
            raise HTTPException(status_code=403, detail="Element is locked")
        
        board.elements.pop(element_index)
        board.updated_at = datetime.now()
        
        self._update_session_activity(board_id, deleted_by)
        
        logger.info(f"Deleted element {element_id} from board {board_id}")
        return True
    
    async def add_comment(
        self,
        board_id: str,
        content: str,
        author_id: str,
        author_name: str,
        element_id: Optional[str] = None,
        position_x: Optional[float] = None,
        position_y: Optional[float] = None
    ) -> BoardComment:
        """Add comment to board or element."""
        if board_id not in self.boards:
            raise HTTPException(status_code=404, detail="Board not found")
        
        board = self.boards[board_id]
        
        if not self._has_comment_permission(board, author_id):
            raise HTTPException(status_code=403, detail="No comment permission")
        
        comment = BoardComment(
            comment_id=f"comment_{uuid.uuid4().hex[:8]}",
            element_id=element_id,
            author_id=author_id,
            author_name=author_name,
            content=content,
            position_x=position_x,
            position_y=position_y,
            created_at=datetime.now()
        )
        
        board.comments.append(comment)
        board.updated_at = datetime.now()
        
        self._update_session_activity(board_id, author_id)
        
        logger.info(f"Added comment to board {board_id}")
        return comment
    
    async def create_medical_case_board(
        self,
        case_id: str,
        patient_id: str,
        created_by: str,
        case_data: Dict[str, Any]
    ) -> VirtualBoard:
        """Create specialized board for medical case review."""
        board_name = f"Case Review - {case_data.get('patient_name', 'Unknown Patient')}"
        
        board = await self.create_board(
            board_name=board_name,
            created_by=created_by,
            board_type="case_review",
            template_id="case_review_template",
            case_id=case_id,
            patient_id=patient_id
        )
        
        # Add patient information element
        await self.add_element(
            board_id=board.board_id,
            element_type=BoardElementType.PATIENT_INFO,
            position_x=50,
            position_y=50,
            width=300,
            height=200,
            content={
                "patient_id": patient_id,
                "name": case_data.get("patient_name"),
                "age": case_data.get("age"),
                "gender": case_data.get("gender"),
                "chief_complaint": case_data.get("chief_complaint"),
                "medical_history": case_data.get("medical_history", [])
            },
            created_by=created_by
        )
        
        # Add diagnosis card if available
        if case_data.get("diagnosis"):
            await self.add_element(
                board_id=board.board_id,
                element_type=BoardElementType.DIAGNOSIS_CARD,
                position_x=400,
                position_y=50,
                width=300,
                height=150,
                content={
                    "diagnosis": case_data["diagnosis"],
                    "confidence": case_data.get("confidence"),
                    "ai_generated": case_data.get("ai_generated", False)
                },
                created_by=created_by
            )
        
        # Add medical images if available
        if case_data.get("images"):
            x_offset = 50
            for i, image in enumerate(case_data["images"][:3]):  # Max 3 images
                await self.add_element(
                    board_id=board.board_id,
                    element_type=BoardElementType.MEDICAL_IMAGE,
                    position_x=x_offset,
                    position_y=300,
                    width=200,
                    height=200,
                    content={
                        "image_url": image.get("url"),
                        "image_type": image.get("type"),
                        "description": image.get("description")
                    },
                    created_by=created_by
                )
                x_offset += 250
        
        return board
    
    async def get_board_templates(self, category: Optional[str] = None) -> List[BoardTemplate]:
        """Get available board templates."""
        templates = list(self.templates.values())
        
        if category:
            templates = [t for t in templates if t.category == category]
        
        return sorted(templates, key=lambda x: x.usage_count, reverse=True)
    
    async def export_board(self, board_id: str, format: str = "json") -> Dict[str, Any]:
        """Export board data."""
        if board_id not in self.boards:
            raise HTTPException(status_code=404, detail="Board not found")
        
        board = self.boards[board_id]
        
        if format == "json":
            return board.dict()
        elif format == "pdf":
            # Implementation for PDF export
            return {"message": "PDF export not implemented yet"}
        else:
            raise HTTPException(status_code=400, detail="Unsupported export format")
    
    # Helper methods
    def _has_board_access(self, board: VirtualBoard, user_id: str) -> bool:
        """Check if user has access to board."""
        if board.is_public:
            return True
        
        return any(p.user_id == user_id for p in board.participants)
    
    def _has_edit_permission(self, board: VirtualBoard, user_id: str) -> bool:
        """Check if user has edit permission."""
        participant = next(
            (p for p in board.participants if p.user_id == user_id),
            None
        )
        
        if not participant:
            return False
        
        return participant.permission in [BoardPermission.EDIT, BoardPermission.ADMIN]
    
    def _has_comment_permission(self, board: VirtualBoard, user_id: str) -> bool:
        """Check if user has comment permission."""
        participant = next(
            (p for p in board.participants if p.user_id == user_id),
            None
        )
        
        if not participant:
            return False
        
        return participant.permission in [
            BoardPermission.COMMENT,
            BoardPermission.EDIT,
            BoardPermission.ADMIN
        ]
    
    def _clone_element(self, element: BoardElement, created_by: str) -> BoardElement:
        """Clone element for template usage."""
        return BoardElement(
            element_id=f"elem_{uuid.uuid4().hex[:8]}",
            element_type=element.element_type,
            position_x=element.position_x,
            position_y=element.position_y,
            width=element.width,
            height=element.height,
            content=element.content.copy(),
            style=element.style.copy(),
            created_by=created_by,
            created_at=datetime.now(),
            layer=element.layer
        )
    
    def _update_session_activity(self, board_id: str, user_id: str):
        """Update session activity."""
        if board_id in self.active_sessions:
            for session in self.active_sessions[board_id]:
                if session.participant_id == user_id and not session.leave_time:
                    session.actions_count += 1
                    session.last_action = datetime.now()
                    break
    
    def _create_default_templates(self):
        """Create default board templates."""
        # Case Review Template
        case_review_template = BoardTemplate(
            template_id="case_review_template",
            template_name="Medical Case Review",
            description="Template for reviewing medical cases with team",
            category="case_review",
            elements=[
                BoardElement(
                    element_id="template_title",
                    element_type=BoardElementType.TEXT,
                    position_x=50,
                    position_y=20,
                    width=400,
                    height=50,
                    content={"text": "Case Review Session", "font_size": 24, "font_weight": "bold"},
                    created_by="system",
                    created_at=datetime.now()
                ),
                BoardElement(
                    element_id="template_patient_section",
                    element_type=BoardElementType.SHAPE,
                    position_x=30,
                    position_y=80,
                    width=340,
                    height=240,
                    content={"shape": "rectangle", "fill": "#f0f8ff", "stroke": "#4169e1"},
                    created_by="system",
                    created_at=datetime.now()
                ),
                BoardElement(
                    element_id="template_diagnosis_section",
                    element_type=BoardElementType.SHAPE,
                    position_x=400,
                    position_y=80,
                    width=340,
                    height=180,
                    content={"shape": "rectangle", "fill": "#f0fff0", "stroke": "#32cd32"},
                    created_by="system",
                    created_at=datetime.now()
                )
            ],
            settings={"background_color": "#ffffff", "grid_enabled": True},
            created_by="system",
            created_at=datetime.now()
        )
        
        self.templates["case_review_template"] = case_review_template
        
        # Teaching Template
        teaching_template = BoardTemplate(
            template_id="teaching_template",
            template_name="Medical Teaching Session",
            description="Template for medical education and training",
            category="teaching",
            elements=[
                BoardElement(
                    element_id="teaching_title",
                    element_type=BoardElementType.TEXT,
                    position_x=50,
                    position_y=20,
                    width=500,
                    height=60,
                    content={"text": "Medical Teaching Session", "font_size": 28, "font_weight": "bold"},
                    created_by="system",
                    created_at=datetime.now()
                )
            ],
            settings={"background_color": "#fffef7", "grid_enabled": True},
            created_by="system",
            created_at=datetime.now()
        )
        
        self.templates["teaching_template"] = teaching_template


# Global instance
virtual_board_service = VirtualBoardService()
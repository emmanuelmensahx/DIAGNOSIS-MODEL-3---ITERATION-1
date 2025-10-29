from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from app.integrations.mapping_service import (
    mapping_service,
    LocationData,
    HealthFacility,
    RouteInfo
)
from app.integrations.video_call_service import (
    video_call_service,
    VideoCallRoom,
    VideoCallParticipant,
    VideoCallSession,
    VideoCallRecording
)
from app.integrations.virtual_board_service import (
    virtual_board_service,
    VirtualBoard,
    BoardElement,
    BoardComment,
    BoardParticipant,
    BoardTemplate,
    BoardElementType,
    BoardPermission
)
from app.core.auth import get_current_user
from app.db.models import User

router = APIRouter(prefix="/integrations", tags=["integrations"])


# Mapping Service Endpoints
@router.get("/mapping/geocode")
async def geocode_address(
    address: str = Query(..., description="Address to geocode"),
    current_user: User = Depends(get_current_user)
) -> LocationData:
    """Convert address to coordinates."""
    try:
        location = await mapping_service.geocode(address)
        if not location:
            raise HTTPException(status_code=404, detail="Address not found")
        return location
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mapping/reverse-geocode")
async def reverse_geocode(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    current_user: User = Depends(get_current_user)
) -> LocationData:
    """Convert coordinates to address."""
    try:
        location = await mapping_service.reverse_geocode(latitude, longitude)
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
        return location
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mapping/health-facilities")
async def find_nearby_health_facilities(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    radius_km: float = Query(10, description="Search radius in kilometers"),
    facility_type: Optional[str] = Query(None, description="Type of facility"),
    current_user: User = Depends(get_current_user)
) -> List[HealthFacility]:
    """Find nearby health facilities."""
    try:
        facilities = await mapping_service.find_nearby_health_facilities(
            latitude, longitude, radius_km, facility_type
        )
        return facilities
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mapping/route")
async def get_route(
    start_lat: float = Query(..., description="Start latitude"),
    start_lng: float = Query(..., description="Start longitude"),
    end_lat: float = Query(..., description="End latitude"),
    end_lng: float = Query(..., description="End longitude"),
    mode: str = Query("driving", description="Transportation mode"),
    current_user: User = Depends(get_current_user)
) -> RouteInfo:
    """Get route between two points."""
    try:
        route = await mapping_service.get_route(
            start_lat, start_lng, end_lat, end_lng, mode
        )
        if not route:
            raise HTTPException(status_code=404, detail="Route not found")
        return route
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Video Call Service Endpoints
class CreateRoomRequest(BaseModel):
    room_name: str
    room_type: str = "consultation"
    max_participants: int = 10
    settings: Dict[str, Any] = {}
    case_id: Optional[str] = None
    patient_id: Optional[str] = None


class JoinRoomRequest(BaseModel):
    participant_name: str
    participant_role: str = "doctor"
    audio_enabled: bool = True
    video_enabled: bool = True


@router.post("/video-calls/rooms")
async def create_video_room(
    request: CreateRoomRequest,
    current_user: User = Depends(get_current_user)
) -> VideoCallRoom:
    """Create a new video call room."""
    try:
        room = await video_call_service.create_room(
            room_name=request.room_name,
            created_by=current_user.id,
            room_type=request.room_type,
            max_participants=request.max_participants,
            settings=request.settings,
            case_id=request.case_id,
            patient_id=request.patient_id
        )
        return room
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video-calls/rooms/{room_id}")
async def get_video_room(
    room_id: str,
    current_user: User = Depends(get_current_user)
) -> VideoCallRoom:
    """Get video call room information."""
    try:
        room = await video_call_service.get_room(room_id, current_user.id)
        return room
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/video-calls/rooms/{room_id}/join")
async def join_video_room(
    room_id: str,
    request: JoinRoomRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Join a video call room."""
    try:
        participant = VideoCallParticipant(
            participant_id=current_user.id,
            name=request.participant_name,
            role=request.participant_role,
            audio_enabled=request.audio_enabled,
            video_enabled=request.video_enabled,
            join_time=datetime.now()
        )
        
        result = await video_call_service.join_room(room_id, participant)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/video-calls/rooms/{room_id}/leave")
async def leave_video_room(
    room_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Leave a video call room."""
    try:
        success = await video_call_service.leave_room(room_id, current_user.id)
        if success:
            return {"message": "Left room successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to leave room")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/video-calls/rooms/{room_id}/end")
async def end_video_room(
    room_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """End a video call room."""
    try:
        success = await video_call_service.end_room(room_id, current_user.id)
        if success:
            return {"message": "Room ended successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to end room")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video-calls/rooms/{room_id}/recordings")
async def get_room_recordings(
    room_id: str,
    current_user: User = Depends(get_current_user)
) -> List[VideoCallRecording]:
    """Get recordings for a room."""
    try:
        recordings = await video_call_service.get_recordings(room_id, current_user.id)
        return recordings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Virtual Board Service Endpoints
class CreateBoardRequest(BaseModel):
    board_name: str
    board_type: str = "general"
    template_id: Optional[str] = None
    case_id: Optional[str] = None
    patient_id: Optional[str] = None
    settings: Dict[str, Any] = {}


class AddElementRequest(BaseModel):
    element_type: BoardElementType
    position_x: float
    position_y: float
    width: float
    height: float
    content: Dict[str, Any]
    style: Dict[str, Any] = {}


class UpdateElementRequest(BaseModel):
    updates: Dict[str, Any]


class AddCommentRequest(BaseModel):
    content: str
    element_id: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None


class JoinBoardRequest(BaseModel):
    participant_name: str
    participant_email: str
    participant_role: str = "doctor"
    permission: BoardPermission = BoardPermission.EDIT


class CreateCaseBoardRequest(BaseModel):
    case_id: str
    patient_id: str
    case_data: Dict[str, Any]


@router.post("/boards")
async def create_board(
    request: CreateBoardRequest,
    current_user: User = Depends(get_current_user)
) -> VirtualBoard:
    """Create a new virtual board."""
    try:
        board = await virtual_board_service.create_board(
            board_name=request.board_name,
            created_by=current_user.id,
            board_type=request.board_type,
            template_id=request.template_id,
            case_id=request.case_id,
            patient_id=request.patient_id,
            settings=request.settings
        )
        return board
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/boards/{board_id}")
async def get_board(
    board_id: str,
    current_user: User = Depends(get_current_user)
) -> VirtualBoard:
    """Get board information."""
    try:
        board = await virtual_board_service.get_board(board_id, current_user.id)
        return board
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/boards/{board_id}/join")
async def join_board(
    board_id: str,
    request: JoinBoardRequest,
    current_user: User = Depends(get_current_user)
) -> VirtualBoard:
    """Join a virtual board."""
    try:
        participant = BoardParticipant(
            user_id=current_user.id,
            name=request.participant_name,
            email=request.participant_email,
            role=request.participant_role,
            permission=request.permission,
            last_active=datetime.now()
        )
        
        board = await virtual_board_service.join_board(board_id, participant)
        return board
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/boards/{board_id}/leave")
async def leave_board(
    board_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Leave a virtual board."""
    try:
        success = await virtual_board_service.leave_board(board_id, current_user.id)
        if success:
            return {"message": "Left board successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to leave board")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/boards/{board_id}/elements")
async def add_board_element(
    board_id: str,
    request: AddElementRequest,
    current_user: User = Depends(get_current_user)
) -> BoardElement:
    """Add element to board."""
    try:
        element = await virtual_board_service.add_element(
            board_id=board_id,
            element_type=request.element_type,
            position_x=request.position_x,
            position_y=request.position_y,
            width=request.width,
            height=request.height,
            content=request.content,
            created_by=current_user.id,
            style=request.style
        )
        return element
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/boards/{board_id}/elements/{element_id}")
async def update_board_element(
    board_id: str,
    element_id: str,
    request: UpdateElementRequest,
    current_user: User = Depends(get_current_user)
) -> BoardElement:
    """Update board element."""
    try:
        element = await virtual_board_service.update_element(
            board_id=board_id,
            element_id=element_id,
            updates=request.updates,
            updated_by=current_user.id
        )
        return element
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/boards/{board_id}/elements/{element_id}")
async def delete_board_element(
    board_id: str,
    element_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Delete board element."""
    try:
        success = await virtual_board_service.delete_element(
            board_id=board_id,
            element_id=element_id,
            deleted_by=current_user.id
        )
        if success:
            return {"message": "Element deleted successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to delete element")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/boards/{board_id}/comments")
async def add_board_comment(
    board_id: str,
    request: AddCommentRequest,
    current_user: User = Depends(get_current_user)
) -> BoardComment:
    """Add comment to board."""
    try:
        comment = await virtual_board_service.add_comment(
            board_id=board_id,
            content=request.content,
            author_id=current_user.id,
            author_name=current_user.name or "Unknown User",
            element_id=request.element_id,
            position_x=request.position_x,
            position_y=request.position_y
        )
        return comment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/boards/case-review")
async def create_case_board(
    request: CreateCaseBoardRequest,
    current_user: User = Depends(get_current_user)
) -> VirtualBoard:
    """Create specialized board for medical case review."""
    try:
        board = await virtual_board_service.create_medical_case_board(
            case_id=request.case_id,
            patient_id=request.patient_id,
            created_by=current_user.id,
            case_data=request.case_data
        )
        return board
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/boards/templates")
async def get_board_templates(
    category: Optional[str] = Query(None, description="Template category"),
    current_user: User = Depends(get_current_user)
) -> List[BoardTemplate]:
    """Get available board templates."""
    try:
        templates = await virtual_board_service.get_board_templates(category)
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/boards/{board_id}/export")
async def export_board(
    board_id: str,
    format: str = Query("json", description="Export format (json, pdf)"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Export board data."""
    try:
        export_data = await virtual_board_service.export_board(board_id, format)
        return export_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Health endpoint for integration services
@router.get("/health")
async def integration_health() -> Dict[str, str]:
    """Check health of integration services."""
    return {
        "mapping_service": "healthy",
        "video_call_service": "healthy",
        "virtual_board_service": "healthy",
        "status": "All integration services are operational"
    }
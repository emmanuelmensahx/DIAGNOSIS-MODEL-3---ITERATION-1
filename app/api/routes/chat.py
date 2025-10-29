import json
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func

from app.db.database import get_db
from app.db.models import ChatRoom, ChatMessage, ChatParticipant, User, Diagnosis, ChatRoomStatus, MessageType, Notification, NotificationType, UserRole
from app.api.schemas import (
    ChatRoomCreate, ChatRoomUpdate, ChatRoomResponse, ChatRoomListResponse,
    ChatMessageCreate, ChatMessageUpdate, ChatMessageResponse, ChatMessageListResponse,
    ChatParticipantCreate, ChatParticipantResponse,
    UnreadMessageCount, ChatNotification
)
from app.core.auth import get_current_user
from app.websocket_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()

# Chat Room endpoints
@router.post("/rooms", response_model=ChatRoomResponse)
async def create_chat_room(
    chat_room: ChatRoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat room for specialist consultation"""
    
    # Validate diagnosis exists if provided
    if chat_room.diagnosis_id:
        diagnosis = db.query(Diagnosis).filter(Diagnosis.id == chat_room.diagnosis_id).first()
        if not diagnosis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Diagnosis not found"
            )
    
    # Create chat room
    db_chat_room = ChatRoom(
        title=chat_room.title,
        description=chat_room.description,
        diagnosis_id=chat_room.diagnosis_id,
        created_by_id=current_user.id,
        is_emergency=chat_room.is_emergency
    )
    db.add(db_chat_room)
    db.flush()  # Get the ID
    
    # Add creator as participant
    creator_participant = ChatParticipant(
        chat_room_id=db_chat_room.id,
        user_id=current_user.id
    )
    db.add(creator_participant)
    
    # Add other participants
    for participant_id in chat_room.participant_ids:
        if participant_id != current_user.id:  # Don't add creator twice
            participant = ChatParticipant(
                chat_room_id=db_chat_room.id,
                user_id=participant_id
            )
            db.add(participant)
    
    db.commit()
    db.refresh(db_chat_room)
    
    # Return response with participant count
    participant_count = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == db_chat_room.id,
        ChatParticipant.is_active == True
    ).count()
    
    response = ChatRoomResponse(
        **db_chat_room.__dict__,
        participant_count=participant_count,
        unread_messages=0,
        last_message=None,
        last_message_at=None
    )
    
    return response

@router.get("/rooms", response_model=ChatRoomListResponse)
async def get_chat_rooms(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[ChatRoomStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat rooms for the current user"""
    
    # Base query for rooms where user is a participant
    query = db.query(ChatRoom).join(ChatParticipant).filter(
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    )
    
    if status_filter:
        query = query.filter(ChatRoom.status == status_filter)
    
    # Get total count
    total_count = query.count()
    
    # Get rooms with pagination
    chat_rooms = query.order_by(desc(ChatRoom.updated_at)).offset(skip).limit(limit).all()
    
    # Prepare response with additional data
    room_responses = []
    total_unread = 0
    
    for room in chat_rooms:
        # Get participant count
        participant_count = db.query(ChatParticipant).filter(
            ChatParticipant.chat_room_id == room.id,
            ChatParticipant.is_active == True
        ).count()
        
        # Get last message
        last_message = db.query(ChatMessage).filter(
            ChatMessage.chat_room_id == room.id
        ).order_by(desc(ChatMessage.created_at)).first()
        
        # Get unread count for this user
        participant = db.query(ChatParticipant).filter(
            ChatParticipant.chat_room_id == room.id,
            ChatParticipant.user_id == current_user.id
        ).first()
        
        unread_count = 0
        if participant and participant.last_read_message_id:
            unread_count = db.query(ChatMessage).filter(
                ChatMessage.chat_room_id == room.id,
                ChatMessage.id > participant.last_read_message_id
            ).count()
        elif participant:
            unread_count = db.query(ChatMessage).filter(
                ChatMessage.chat_room_id == room.id
            ).count()
        
        total_unread += unread_count
        
        room_response = ChatRoomResponse(
            **room.__dict__,
            participant_count=participant_count,
            unread_messages=unread_count,
            last_message=last_message.content[:100] + "..." if last_message and len(last_message.content) > 100 else last_message.content if last_message else None,
            last_message_at=last_message.created_at if last_message else None
        )
        room_responses.append(room_response)
    
    return ChatRoomListResponse(
        chat_rooms=room_responses,
        total_count=total_count,
        unread_total=total_unread
    )

@router.get("/rooms/{room_id}", response_model=ChatRoomResponse)
async def get_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific chat room"""
    
    # Check if user is participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this chat room"
        )
    
    chat_room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not chat_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat room not found"
        )
    
    # Get additional data
    participant_count = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.is_active == True
    ).count()
    
    unread_count = 0
    if participant.last_read_message_id:
        unread_count = db.query(ChatMessage).filter(
            ChatMessage.chat_room_id == room_id,
            ChatMessage.id > participant.last_read_message_id
        ).count()
    else:
        unread_count = db.query(ChatMessage).filter(
            ChatMessage.chat_room_id == room_id
        ).count()
    
    return ChatRoomResponse(
        **chat_room.__dict__,
        participant_count=participant_count,
        unread_messages=unread_count,
        last_message=None,
        last_message_at=None
    )

@router.put("/rooms/{room_id}", response_model=ChatRoomResponse)
async def update_chat_room(
    room_id: int,
    chat_room_update: ChatRoomUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a chat room (only creator can update)"""
    
    chat_room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not chat_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat room not found"
        )
    
    if chat_room.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator can update this chat room"
        )
    
    # Update fields
    update_data = chat_room_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(chat_room, field, value)
    
    if chat_room_update.status == ChatRoomStatus.CLOSED:
        chat_room.closed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(chat_room)
    
    participant_count = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.is_active == True
    ).count()
    
    return ChatRoomResponse(
        **chat_room.__dict__,
        participant_count=participant_count,
        unread_messages=0,
        last_message=None,
        last_message_at=None
    )

# Chat Message endpoints
@router.post("/rooms/{room_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    room_id: int,
    message: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to a chat room"""
    
    # Check if user is participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this chat room"
        )
    
    # Check if chat room is active
    chat_room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not chat_room or chat_room.status != ChatRoomStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send message to inactive chat room"
        )
    
    # Create message
    db_message = ChatMessage(
        chat_room_id=room_id,
        sender_id=current_user.id,
        content=message.content,
        message_type=message.message_type,
        diagnosis_reference_id=message.diagnosis_reference_id,
        reply_to_message_id=message.reply_to_message_id
    )
    db.add(db_message)
    
    # Update chat room's updated_at
    chat_room.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_message)
    
    # Send real-time notification to room participants
    try:
        await manager.send_message_notification(db_message, db)
    except Exception as e:
        logger.error(f"Failed to send WebSocket notification: {e}")
    
    # Send notification to healthcare workers when specialist responds
    try:
        await send_specialist_response_notification(db_message, chat_room, current_user, db)
    except Exception as e:
        logger.error(f"Failed to send specialist response notification: {e}")
    
    # Get reply content if replying to a message
    reply_to_content = None
    if message.reply_to_message_id:
        reply_message = db.query(ChatMessage).filter(
            ChatMessage.id == message.reply_to_message_id
        ).first()
        if reply_message:
            reply_to_content = reply_message.content[:100] + "..." if len(reply_message.content) > 100 else reply_message.content
    
    return ChatMessageResponse(
        id=db_message.id,
        chat_room_id=db_message.chat_room_id,
        sender_id=db_message.sender_id,
        content=db_message.content,
        message_type=db_message.message_type,
        diagnosis_reference_id=db_message.diagnosis_reference_id,
        reply_to_message_id=db_message.reply_to_message_id,
        file_url=db_message.file_url,
        file_name=db_message.file_name,
        file_size=db_message.file_size,
        is_edited=db_message.is_edited,
        edited_at=db_message.edited_at,
        created_at=db_message.created_at,
        sender_name=current_user.full_name or current_user.username,
        sender_role=current_user.role,
        reply_to_content=reply_to_content
    )

@router.get("/rooms/{room_id}/messages", response_model=ChatMessageListResponse)
async def get_messages(
    room_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages from a chat room"""
    
    # Check if user is participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this chat room"
        )
    
    # Get total count
    total_count = db.query(ChatMessage).filter(ChatMessage.chat_room_id == room_id).count()
    
    # Get messages with sender info
    messages = db.query(ChatMessage).options(
        joinedload(ChatMessage.sender)
    ).filter(
        ChatMessage.chat_room_id == room_id
    ).order_by(desc(ChatMessage.created_at)).offset(skip).limit(limit).all()
    
    # Prepare response
    message_responses = []
    for msg in messages:
        reply_to_content = None
        if msg.reply_to_message_id:
            reply_message = db.query(ChatMessage).filter(
                ChatMessage.id == msg.reply_to_message_id
            ).first()
            if reply_message:
                reply_to_content = reply_message.content[:100] + "..." if len(reply_message.content) > 100 else reply_message.content
        
        message_response = ChatMessageResponse(
            id=msg.id,
            chat_room_id=msg.chat_room_id,
            sender_id=msg.sender_id,
            content=msg.content,
            message_type=msg.message_type,
            diagnosis_reference_id=msg.diagnosis_reference_id,
            reply_to_message_id=msg.reply_to_message_id,
            file_url=msg.file_url,
            file_name=msg.file_name,
            file_size=msg.file_size,
            is_edited=msg.is_edited,
            edited_at=msg.edited_at,
            created_at=msg.created_at,
            sender_name=msg.sender.full_name or msg.sender.username,
            sender_role=msg.sender.role,
            reply_to_content=reply_to_content
        )
        message_responses.append(message_response)
    
    # Update last read message for current user
    if messages:
        participant.last_read_message_id = messages[0].id  # Most recent message
        db.commit()
    
    return ChatMessageListResponse(
        messages=list(reversed(message_responses)),  # Reverse to show oldest first
        total_count=total_count,
        has_more=skip + limit < total_count
    )

@router.put("/messages/{message_id}", response_model=ChatMessageResponse)
async def edit_message(
    message_id: int,
    message_update: ChatMessageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit a message (only sender can edit)"""
    
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the sender can edit this message"
        )
    
    # Update message
    if message_update.content:
        message.content = message_update.content
        message.is_edited = True
        message.edited_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    return ChatMessageResponse(
        id=message.id,
        chat_room_id=message.chat_room_id,
        sender_id=message.sender_id,
        content=message.content,
        message_type=message.message_type,
        diagnosis_reference_id=message.diagnosis_reference_id,
        reply_to_message_id=message.reply_to_message_id,
        file_url=message.file_url,
        file_name=message.file_name,
        file_size=message.file_size,
        is_edited=message.is_edited,
        edited_at=message.edited_at,
        created_at=message.created_at,
        sender_name=current_user.full_name or current_user.username,
        sender_role=current_user.role,
        reply_to_content=None
    )

# Participant management endpoints
@router.post("/rooms/{room_id}/participants", response_model=ChatParticipantResponse)
async def add_participant(
    room_id: int,
    participant_data: ChatParticipantCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a participant to a chat room"""
    
    # Check if current user is participant (only participants can add others)
    current_participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not current_participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this chat room"
        )
    
    # Check if user is already a participant
    existing_participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.user_id == participant_data.user_id
    ).first()
    
    if existing_participant:
        if existing_participant.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a participant"
            )
        else:
            # Reactivate participant
            existing_participant.is_active = True
            existing_participant.joined_at = datetime.utcnow()
            existing_participant.left_at = None
            db.commit()
            db.refresh(existing_participant)
            
            user = db.query(User).filter(User.id == participant_data.user_id).first()
            return ChatParticipantResponse(
                **existing_participant.__dict__,
                user_name=user.full_name or user.username if user else None,
                user_role=user.role if user else None
            )
    
    # Add new participant
    new_participant = ChatParticipant(
        chat_room_id=room_id,
        user_id=participant_data.user_id
    )
    db.add(new_participant)
    db.commit()
    db.refresh(new_participant)
    
    user = db.query(User).filter(User.id == participant_data.user_id).first()
    return ChatParticipantResponse(
        **new_participant.__dict__,
        user_name=user.full_name or user.username if user else None,
        user_role=user.role if user else None
    )

@router.get("/rooms/{room_id}/participants", response_model=List[ChatParticipantResponse])
async def get_participants(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get participants of a chat room"""
    
    # Check if user is participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this chat room"
        )
    
    # Get all active participants with user info
    participants = db.query(ChatParticipant).options(
        joinedload(ChatParticipant.user)
    ).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.is_active == True
    ).all()
    
    return [
        ChatParticipantResponse(
            **p.__dict__,
            user_name=p.user.full_name or p.user.username,
            user_role=p.user.role
        )
        for p in participants
    ]

@router.delete("/rooms/{room_id}/participants/{user_id}")
async def remove_participant(
    room_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a participant from a chat room"""
    
    # Check if current user is the creator or removing themselves
    chat_room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not chat_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat room not found"
        )
    
    if chat_room.created_by_id != current_user.id and user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator can remove other participants"
        )
    
    # Find and deactivate participant
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.user_id == user_id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )
    
    participant.is_active = False
    participant.left_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Participant removed successfully"}

# Utility endpoints
@router.get("/unread-counts", response_model=List[UnreadMessageCount])
async def get_unread_counts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get unread message counts for all chat rooms"""
    
    # Get all chat rooms where user is participant
    participants = db.query(ChatParticipant).filter(
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).all()
    
    unread_counts = []
    for participant in participants:
        unread_count = 0
        if participant.last_read_message_id:
            unread_count = db.query(ChatMessage).filter(
                ChatMessage.chat_room_id == participant.chat_room_id,
                ChatMessage.id > participant.last_read_message_id
            ).count()
        else:
            unread_count = db.query(ChatMessage).filter(
                ChatMessage.chat_room_id == participant.chat_room_id
            ).count()
        
        unread_counts.append(UnreadMessageCount(
            chat_room_id=participant.chat_room_id,
            unread_count=unread_count
        ))
    
    return unread_counts

@router.post("/rooms/{room_id}/mark-read")
async def mark_messages_as_read(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all messages in a chat room as read"""
    
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this chat room"
        )
    
    # Get the latest message ID
    latest_message = db.query(ChatMessage).filter(
        ChatMessage.chat_room_id == room_id
    ).order_by(desc(ChatMessage.id)).first()
    
    if latest_message:
        participant.last_read_message_id = latest_message.id
        db.commit()
    
    return {"message": "Messages marked as read"}

# WebSocket endpoints for real-time messaging
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time chat"""
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close(code=4004, reason="User not found")
        return
    
    await manager.connect(websocket, user_id)
    
    # Subscribe user to their chat rooms
    user_rooms = db.query(ChatParticipant).filter(
        ChatParticipant.user_id == user_id,
        ChatParticipant.is_active == True
    ).all()
    
    for participant in user_rooms:
        await manager.subscribe_to_room(user_id, participant.chat_room_id)
    
    # Notify other users that this user is online
    for participant in user_rooms:
        await manager.notify_user_status(user_id, "online", participant.chat_room_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message_type = message_data.get("type")
            
            if message_type == "ping":
                # Respond to ping with pong
                await websocket.send_text(json.dumps({"type": "pong"}))
                
            elif message_type == "typing":
                # Handle typing indicators
                room_id = message_data.get("room_id")
                is_typing = message_data.get("is_typing", False)
                
                if room_id:
                    await manager.send_typing_notification(user_id, room_id, is_typing)
                    
            elif message_type == "join_room":
                # Subscribe to a new room
                room_id = message_data.get("room_id")
                if room_id:
                    # Verify user has access to this room
                    participant = db.query(ChatParticipant).filter(
                        ChatParticipant.chat_room_id == room_id,
                        ChatParticipant.user_id == user_id,
                        ChatParticipant.is_active == True
                    ).first()
                    
                    if participant:
                        await manager.subscribe_to_room(user_id, room_id)
                        await manager.notify_user_status(user_id, "online", room_id)
                        
            elif message_type == "leave_room":
                # Unsubscribe from a room
                room_id = message_data.get("room_id")
                if room_id:
                    await manager.unsubscribe_from_room(user_id, room_id)
                    await manager.notify_user_status(user_id, "offline", room_id)
                    
    except WebSocketDisconnect:
        # Handle disconnection
        manager.disconnect(user_id)
        
        # Notify other users that this user is offline
        for participant in user_rooms:
            await manager.notify_user_status(user_id, "offline", participant.chat_room_id)
            
        logger.info(f"User {user_id} disconnected from WebSocket")
        
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id)

@router.post("/rooms/{room_id}/typing")
async def send_typing_indicator(
    room_id: int,
    is_typing: bool = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send typing indicator via HTTP (fallback for WebSocket)"""
    
    # Verify user has access to room
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this chat room"
        )
    
    await manager.send_typing_notification(current_user.id, room_id, is_typing)
    return {"message": "Typing indicator sent"}

@router.get("/rooms/{room_id}/online-users")
async def get_online_users(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of online users in a chat room"""
    
    # Verify user has access to room
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.is_active == True
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this chat room"
        )
    
    # Get all participants in the room
    participants = db.query(ChatParticipant).options(
        joinedload(ChatParticipant.user)
    ).filter(
        ChatParticipant.chat_room_id == room_id,
        ChatParticipant.is_active == True
    ).all()
    
    online_users = []
    for participant in participants:
        is_online = manager.is_user_online(participant.user_id)
        online_users.append({
            "user_id": participant.user_id,
            "username": participant.user.username,
            "full_name": participant.user.full_name,
            "role": participant.user.role,
            "is_online": is_online
        })
    
    return {"online_users": online_users}

# Notification helper function
async def send_specialist_response_notification(message: ChatMessage, chat_room: ChatRoom, sender: User, db: Session):
    """Send notification to healthcare workers when a specialist responds"""
    
    # Only send notifications if the sender is a specialist
    if sender.role != UserRole.SPECIALIST:
        return
    
    # Get all participants in the chat room who are not specialists
    participants = db.query(ChatParticipant).options(
        joinedload(ChatParticipant.user)
    ).filter(
        ChatParticipant.chat_room_id == chat_room.id,
        ChatParticipant.user_id != sender.id,  # Don't notify the sender
        ChatParticipant.is_active == True
    ).all()
    
    # Filter to only healthcare workers (not other specialists)
    healthcare_workers = [p for p in participants if p.user.role in [UserRole.HEALTHCARE_WORKER, UserRole.ADMIN]]
    
    for participant in healthcare_workers:
        # Determine notification type based on message type
        notification_type = NotificationType.DIAGNOSIS if message.message_type == 'medical_response' else NotificationType.USER
        
        # Create notification title and message
        if message.message_type == 'medical_response':
            title = "🩺 Medical Response Received"
            notification_message = f"Dr. {sender.full_name or sender.username} has provided a medical consultation response for '{chat_room.title}'"
        else:
            title = "💬 Specialist Response"
            notification_message = f"Dr. {sender.full_name or sender.username} has responded in '{chat_room.title}'"
        
        # Create notification record
        notification = Notification(
            user_id=participant.user_id,
            type=notification_type,
            title=title,
            message=notification_message,
            link=f"/specialist_chat.html?room_id={chat_room.id}",  # Link to the chat room
            read=False,
            created_at=datetime.utcnow()
        )
        
        db.add(notification)
        
        # Send real-time notification via WebSocket if user is online
        try:
            if manager.is_user_online(participant.user_id):
                notification_data = {
                    "type": "notification",
                    "notification_type": notification_type.value,
                    "title": title,
                    "message": notification_message,
                    "link": f"/specialist_chat.html?room_id={chat_room.id}",
                    "timestamp": datetime.utcnow().isoformat(),
                    "chat_room_id": chat_room.id,
                    "sender_name": sender.full_name or sender.username
                }
                await manager.send_personal_message(json.dumps(notification_data), participant.user_id)
        except Exception as e:
            logger.error(f"Failed to send real-time notification to user {participant.user_id}: {e}")
    
    # Commit all notifications
    db.commit()
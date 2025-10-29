"""
WebSocket Manager for Real-time Chat
Handles WebSocket connections for specialist chat system
"""

import json
import logging
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import ChatRoom, ChatMessage, User
from app.api.schemas import ChatMessageResponse
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[int, WebSocket] = {}
        # Store room subscriptions by room_id
        self.room_subscriptions: Dict[int, Set[int]] = {}
        # Store user rooms for quick lookup
        self.user_rooms: Dict[int, Set[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected to WebSocket")

    def disconnect(self, user_id: int):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        # Remove user from all room subscriptions
        for room_id in list(self.room_subscriptions.keys()):
            if user_id in self.room_subscriptions[room_id]:
                self.room_subscriptions[room_id].discard(user_id)
                if not self.room_subscriptions[room_id]:
                    del self.room_subscriptions[room_id]
        
        # Clear user rooms
        if user_id in self.user_rooms:
            del self.user_rooms[user_id]
        
        logger.info(f"User {user_id} disconnected from WebSocket")

    async def subscribe_to_room(self, user_id: int, room_id: int):
        """Subscribe a user to a chat room"""
        if room_id not in self.room_subscriptions:
            self.room_subscriptions[room_id] = set()
        
        self.room_subscriptions[room_id].add(user_id)
        
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        self.user_rooms[user_id].add(room_id)
        
        logger.info(f"User {user_id} subscribed to room {room_id}")

    async def unsubscribe_from_room(self, user_id: int, room_id: int):
        """Unsubscribe a user from a chat room"""
        if room_id in self.room_subscriptions and user_id in self.room_subscriptions[room_id]:
            self.room_subscriptions[room_id].discard(user_id)
            if not self.room_subscriptions[room_id]:
                del self.room_subscriptions[room_id]
        
        if user_id in self.user_rooms and room_id in self.user_rooms[user_id]:
            self.user_rooms[user_id].discard(room_id)

    async def send_personal_message(self, message: str, user_id: int):
        """Send a message to a specific user"""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                self.disconnect(user_id)

    async def broadcast_to_room(self, message: dict, room_id: int, exclude_user: int = None):
        """Broadcast a message to all users in a room"""
        if room_id not in self.room_subscriptions:
            return

        message_text = json.dumps(message)
        disconnected_users = []

        for user_id in self.room_subscriptions[room_id]:
            if exclude_user and user_id == exclude_user:
                continue
                
            if user_id in self.active_connections:
                try:
                    await self.active_connections[user_id].send_text(message_text)
                except Exception as e:
                    logger.error(f"Error broadcasting to user {user_id}: {e}")
                    disconnected_users.append(user_id)

        # Clean up disconnected users
        for user_id in disconnected_users:
            self.disconnect(user_id)

    async def notify_user_status(self, user_id: int, status: str, room_id: int = None):
        """Notify about user status changes (online/offline)"""
        status_message = {
            "type": "user_status",
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }

        if room_id:
            await self.broadcast_to_room(status_message, room_id, exclude_user=user_id)
        else:
            # Broadcast to all rooms the user is in
            if user_id in self.user_rooms:
                for room_id in self.user_rooms[user_id]:
                    await self.broadcast_to_room(status_message, room_id, exclude_user=user_id)

    async def send_message_notification(self, message: ChatMessage, db: Session):
        """Send real-time message notification to room participants"""
        try:
            # Get message details with sender info
            sender = db.query(User).filter(User.id == message.sender_id).first()
            
            message_data = {
                "type": "new_message",
                "message": {
                    "id": message.id,
                    "content": message.content,
                    "message_type": message.message_type.value,
                    "sender_id": message.sender_id,
                    "sender_name": sender.full_name if sender else "Unknown",
                    "room_id": message.room_id,
                    "created_at": message.created_at.isoformat(),
                    "is_edited": message.is_edited,
                    "file_url": message.file_url,
                    "file_name": message.file_name,
                    "file_size": message.file_size
                }
            }

            # Broadcast to all room participants except sender
            await self.broadcast_to_room(message_data, message.room_id, exclude_user=message.sender_id)
            
        except Exception as e:
            logger.error(f"Error sending message notification: {e}")

    async def send_typing_notification(self, user_id: int, room_id: int, is_typing: bool):
        """Send typing indicator to room participants"""
        typing_data = {
            "type": "typing",
            "user_id": user_id,
            "room_id": room_id,
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }

        await self.broadcast_to_room(typing_data, room_id, exclude_user=user_id)

    def get_room_participants(self, room_id: int) -> List[int]:
        """Get list of online participants in a room"""
        if room_id in self.room_subscriptions:
            return list(self.room_subscriptions[room_id])
        return []

    def is_user_online(self, user_id: int) -> bool:
        """Check if a user is currently online"""
        return user_id in self.active_connections

# Global connection manager instance
manager = ConnectionManager()
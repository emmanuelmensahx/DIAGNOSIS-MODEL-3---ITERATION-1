import os
import uuid
import httpx
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from fastapi import HTTPException
import logging
import jwt as pyjwt
import base64
import hashlib
import hmac

logger = logging.getLogger(__name__)


class VideoCallParticipant(BaseModel):
    """Video call participant model."""
    user_id: str
    name: str
    email: str
    role: str  # doctor, patient, specialist
    avatar_url: Optional[str] = None
    is_moderator: bool = False


class VideoCallRoom(BaseModel):
    """Video call room model."""
    room_id: str
    room_name: str
    created_by: str
    created_at: datetime
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    status: str  # scheduled, active, ended
    participants: List[VideoCallParticipant] = []
    room_url: str
    recording_enabled: bool = False
    max_participants: int = 10
    room_settings: Dict[str, Any] = {}


class VideoCallSession(BaseModel):
    """Video call session model."""
    session_id: str
    room_id: str
    participant_id: str
    join_time: datetime
    leave_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    connection_quality: Optional[str] = None


class VideoCallRecording(BaseModel):
    """Video call recording model."""
    recording_id: str
    room_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    file_url: Optional[str] = None
    file_size_mb: Optional[float] = None
    status: str  # recording, processing, ready, failed


class VideoCallService:
    """Integration with video calling services (Zoom, Jitsi, Agora, etc.)."""
    
    def __init__(self):
        self.provider = os.getenv("VIDEO_CALL_PROVIDER", "jitsi")  # jitsi, zoom, agora
        
        # Zoom configuration
        self.zoom_api_key = os.getenv("ZOOM_API_KEY")
        self.zoom_api_secret = os.getenv("ZOOM_API_SECRET")
        self.zoom_base_url = "https://api.zoom.us/v2"
        
        # Agora configuration
        self.agora_app_id = os.getenv("AGORA_APP_ID")
        self.agora_app_certificate = os.getenv("AGORA_APP_CERTIFICATE")
        
        # Jitsi configuration (self-hosted or meet.jit.si)
        self.jitsi_domain = os.getenv("JITSI_DOMAIN", "meet.jit.si")
        self.jitsi_app_id = os.getenv("JITSI_APP_ID")
        self.jitsi_private_key = os.getenv("JITSI_PRIVATE_KEY")
        
        # General settings
        self.default_room_duration = 60  # minutes
        self.max_room_duration = 240  # 4 hours
    
    async def create_room(
        self, 
        room_name: str, 
        created_by: str,
        scheduled_start: Optional[datetime] = None,
        duration_minutes: int = None,
        participants: List[VideoCallParticipant] = None,
        settings: Dict[str, Any] = None
    ) -> VideoCallRoom:
        """Create a new video call room."""
        try:
            if self.provider == "zoom":
                return await self._create_zoom_meeting(room_name, created_by, scheduled_start, duration_minutes, participants, settings)
            elif self.provider == "agora":
                return await self._create_agora_channel(room_name, created_by, scheduled_start, duration_minutes, participants, settings)
            else:  # Default to Jitsi
                return await self._create_jitsi_room(room_name, created_by, scheduled_start, duration_minutes, participants, settings)
        except Exception as e:
            logger.error(f"Failed to create video call room: {e}")
            raise HTTPException(status_code=500, detail="Failed to create video call room")
    
    async def join_room(self, room_id: str, participant: VideoCallParticipant) -> Dict[str, str]:
        """Generate join URL and token for a participant."""
        try:
            if self.provider == "zoom":
                return await self._join_zoom_meeting(room_id, participant)
            elif self.provider == "agora":
                return await self._join_agora_channel(room_id, participant)
            else:  # Jitsi
                return await self._join_jitsi_room(room_id, participant)
        except Exception as e:
            logger.error(f"Failed to join video call room: {e}")
            raise HTTPException(status_code=500, detail="Failed to join video call room")
    
    async def end_room(self, room_id: str, ended_by: str) -> bool:
        """End a video call room."""
        try:
            if self.provider == "zoom":
                return await self._end_zoom_meeting(room_id, ended_by)
            elif self.provider == "agora":
                return await self._end_agora_channel(room_id, ended_by)
            else:  # Jitsi
                return await self._end_jitsi_room(room_id, ended_by)
        except Exception as e:
            logger.error(f"Failed to end video call room: {e}")
            return False
    
    async def get_room_info(self, room_id: str) -> VideoCallRoom:
        """Get information about a video call room."""
        try:
            if self.provider == "zoom":
                return await self._get_zoom_meeting_info(room_id)
            elif self.provider == "agora":
                return await self._get_agora_channel_info(room_id)
            else:  # Jitsi
                return await self._get_jitsi_room_info(room_id)
        except Exception as e:
            logger.error(f"Failed to get room info: {e}")
            raise HTTPException(status_code=404, detail="Room not found")
    
    async def start_recording(self, room_id: str) -> VideoCallRecording:
        """Start recording a video call."""
        try:
            if self.provider == "zoom":
                return await self._start_zoom_recording(room_id)
            elif self.provider == "agora":
                return await self._start_agora_recording(room_id)
            else:  # Jitsi
                return await self._start_jitsi_recording(room_id)
        except Exception as e:
            logger.error(f"Failed to start recording: {e}")
            raise HTTPException(status_code=500, detail="Failed to start recording")
    
    async def stop_recording(self, room_id: str, recording_id: str) -> VideoCallRecording:
        """Stop recording a video call."""
        try:
            if self.provider == "zoom":
                return await self._stop_zoom_recording(room_id, recording_id)
            elif self.provider == "agora":
                return await self._stop_agora_recording(room_id, recording_id)
            else:  # Jitsi
                return await self._stop_jitsi_recording(room_id, recording_id)
        except Exception as e:
            logger.error(f"Failed to stop recording: {e}")
            raise HTTPException(status_code=500, detail="Failed to stop recording")
    
    # Zoom implementation
    async def _create_zoom_meeting(
        self, 
        room_name: str, 
        created_by: str,
        scheduled_start: Optional[datetime],
        duration_minutes: int,
        participants: List[VideoCallParticipant],
        settings: Dict[str, Any]
    ) -> VideoCallRoom:
        """Create Zoom meeting."""
        if not self.zoom_api_key or not self.zoom_api_secret:
            raise HTTPException(status_code=500, detail="Zoom API credentials not configured")
        
        # Generate JWT token for Zoom API
        token = self._generate_zoom_jwt()
        
        meeting_data = {
            "topic": room_name,
            "type": 2,  # Scheduled meeting
            "start_time": scheduled_start.isoformat() if scheduled_start else None,
            "duration": duration_minutes or self.default_room_duration,
            "settings": {
                "host_video": settings.get("host_video", True) if settings else True,
                "participant_video": settings.get("participant_video", True) if settings else True,
                "join_before_host": settings.get("join_before_host", False) if settings else False,
                "mute_upon_entry": settings.get("mute_upon_entry", True) if settings else True,
                "waiting_room": settings.get("waiting_room", True) if settings else True,
                "auto_recording": "cloud" if settings and settings.get("recording_enabled") else "none"
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.zoom_base_url}/users/me/meetings",
                json=meeting_data,
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 201:
                meeting = response.json()
                
                return VideoCallRoom(
                    room_id=str(meeting["id"]),
                    room_name=room_name,
                    created_by=created_by,
                    created_at=datetime.now(),
                    scheduled_start=scheduled_start,
                    scheduled_end=scheduled_start + timedelta(minutes=duration_minutes) if scheduled_start and duration_minutes else None,
                    status="scheduled",
                    participants=participants or [],
                    room_url=meeting["join_url"],
                    recording_enabled=settings.get("recording_enabled", False) if settings else False,
                    room_settings=settings or {}
                )
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to create Zoom meeting")
    
    async def _join_zoom_meeting(self, room_id: str, participant: VideoCallParticipant) -> Dict[str, str]:
        """Generate Zoom meeting join URL."""
        # For Zoom, we typically use the meeting join URL directly
        # Additional authentication can be added here if needed
        
        return {
            "join_url": f"https://zoom.us/j/{room_id}",
            "meeting_id": room_id,
            "participant_id": participant.user_id
        }
    
    # Jitsi implementation
    async def _create_jitsi_room(
        self, 
        room_name: str, 
        created_by: str,
        scheduled_start: Optional[datetime],
        duration_minutes: int,
        participants: List[VideoCallParticipant],
        settings: Dict[str, Any]
    ) -> VideoCallRoom:
        """Create Jitsi room."""
        # Generate unique room ID
        room_id = f"afridiag-{uuid.uuid4().hex[:8]}"
        
        # Jitsi room URL
        room_url = f"https://{self.jitsi_domain}/{room_id}"
        
        return VideoCallRoom(
            room_id=room_id,
            room_name=room_name,
            created_by=created_by,
            created_at=datetime.now(),
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_start + timedelta(minutes=duration_minutes) if scheduled_start and duration_minutes else None,
            status="scheduled",
            participants=participants or [],
            room_url=room_url,
            recording_enabled=settings.get("recording_enabled", False) if settings else False,
            room_settings=settings or {}
        )
    
    async def _join_jitsi_room(self, room_id: str, participant: VideoCallParticipant) -> Dict[str, str]:
        """Generate Jitsi room join information."""
        join_url = f"https://{self.jitsi_domain}/{room_id}"
        
        # Generate JWT token if Jitsi is configured with authentication
        jwt_token = None
        if self.jitsi_app_id and self.jitsi_private_key:
            jwt_token = self._generate_jitsi_jwt(room_id, participant)
            join_url += f"?jwt={jwt_token}"
        
        return {
            "join_url": join_url,
            "room_id": room_id,
            "participant_id": participant.user_id,
            "jwt_token": jwt_token
        }
    
    # Agora implementation
    async def _create_agora_channel(
        self, 
        room_name: str, 
        created_by: str,
        scheduled_start: Optional[datetime],
        duration_minutes: int,
        participants: List[VideoCallParticipant],
        settings: Dict[str, Any]
    ) -> VideoCallRoom:
        """Create Agora channel."""
        if not self.agora_app_id:
            raise HTTPException(status_code=500, detail="Agora App ID not configured")
        
        # Generate unique channel name
        channel_name = f"afridiag_{uuid.uuid4().hex[:8]}"
        
        return VideoCallRoom(
            room_id=channel_name,
            room_name=room_name,
            created_by=created_by,
            created_at=datetime.now(),
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_start + timedelta(minutes=duration_minutes) if scheduled_start and duration_minutes else None,
            status="scheduled",
            participants=participants or [],
            room_url=f"agora://{self.agora_app_id}/{channel_name}",
            recording_enabled=settings.get("recording_enabled", False) if settings else False,
            room_settings=settings or {}
        )
    
    async def _join_agora_channel(self, room_id: str, participant: VideoCallParticipant) -> Dict[str, str]:
        """Generate Agora channel join token."""
        if not self.agora_app_certificate:
            # Return basic info without token for development
            return {
                "app_id": self.agora_app_id,
                "channel_name": room_id,
                "user_id": participant.user_id,
                "token": None
            }
        
        # Generate Agora RTC token
        token = self._generate_agora_token(room_id, participant.user_id)
        
        return {
            "app_id": self.agora_app_id,
            "channel_name": room_id,
            "user_id": participant.user_id,
            "token": token
        }
    
    # Mock implementations for development
    async def _end_zoom_meeting(self, room_id: str, ended_by: str) -> bool:
        """End Zoom meeting."""
        # Implementation for ending Zoom meeting
        return True
    
    async def _end_agora_channel(self, room_id: str, ended_by: str) -> bool:
        """End Agora channel."""
        # Implementation for ending Agora channel
        return True
    
    async def _end_jitsi_room(self, room_id: str, ended_by: str) -> bool:
        """End Jitsi room."""
        # Jitsi rooms end automatically when all participants leave
        return True
    
    async def _get_zoom_meeting_info(self, room_id: str) -> VideoCallRoom:
        """Get Zoom meeting info."""
        # Mock implementation
        return VideoCallRoom(
            room_id=room_id,
            room_name="Mock Zoom Meeting",
            created_by="mock_user",
            created_at=datetime.now(),
            status="active",
            participants=[],
            room_url=f"https://zoom.us/j/{room_id}"
        )
    
    async def _get_agora_channel_info(self, room_id: str) -> VideoCallRoom:
        """Get Agora channel info."""
        # Mock implementation
        return VideoCallRoom(
            room_id=room_id,
            room_name="Mock Agora Channel",
            created_by="mock_user",
            created_at=datetime.now(),
            status="active",
            participants=[],
            room_url=f"agora://{self.agora_app_id}/{room_id}"
        )
    
    async def _get_jitsi_room_info(self, room_id: str) -> VideoCallRoom:
        """Get Jitsi room info."""
        # Mock implementation
        return VideoCallRoom(
            room_id=room_id,
            room_name="Mock Jitsi Room",
            created_by="mock_user",
            created_at=datetime.now(),
            status="active",
            participants=[],
            room_url=f"https://{self.jitsi_domain}/{room_id}"
        )
    
    # Recording implementations (mock)
    async def _start_zoom_recording(self, room_id: str) -> VideoCallRecording:
        """Start Zoom recording."""
        return VideoCallRecording(
            recording_id=f"zoom_rec_{uuid.uuid4().hex[:8]}",
            room_id=room_id,
            start_time=datetime.now(),
            status="recording"
        )
    
    async def _start_agora_recording(self, room_id: str) -> VideoCallRecording:
        """Start Agora recording."""
        return VideoCallRecording(
            recording_id=f"agora_rec_{uuid.uuid4().hex[:8]}",
            room_id=room_id,
            start_time=datetime.now(),
            status="recording"
        )
    
    async def _start_jitsi_recording(self, room_id: str) -> VideoCallRecording:
        """Start Jitsi recording."""
        return VideoCallRecording(
            recording_id=f"jitsi_rec_{uuid.uuid4().hex[:8]}",
            room_id=room_id,
            start_time=datetime.now(),
            status="recording"
        )
    
    async def _stop_zoom_recording(self, room_id: str, recording_id: str) -> VideoCallRecording:
        """Stop Zoom recording."""
        return VideoCallRecording(
            recording_id=recording_id,
            room_id=room_id,
            start_time=datetime.now() - timedelta(minutes=30),
            end_time=datetime.now(),
            status="processing"
        )
    
    async def _stop_agora_recording(self, room_id: str, recording_id: str) -> VideoCallRecording:
        """Stop Agora recording."""
        return VideoCallRecording(
            recording_id=recording_id,
            room_id=room_id,
            start_time=datetime.now() - timedelta(minutes=30),
            end_time=datetime.now(),
            status="processing"
        )
    
    async def _stop_jitsi_recording(self, room_id: str, recording_id: str) -> VideoCallRecording:
        """Stop Jitsi recording."""
        return VideoCallRecording(
            recording_id=recording_id,
            room_id=room_id,
            start_time=datetime.now() - timedelta(minutes=30),
            end_time=datetime.now(),
            status="processing"
        )
    
    # Utility methods
    def _generate_zoom_jwt(self) -> str:
        """Generate JWT token for Zoom API."""
        payload = {
            "iss": self.zoom_api_key,
            "exp": datetime.now() + timedelta(hours=1)
        }
        return pyjwt.encode(payload, self.zoom_api_secret, algorithm="HS256")
    
    def _generate_jitsi_jwt(self, room_id: str, participant: VideoCallParticipant) -> str:
        """Generate JWT token for Jitsi."""
        payload = {
            "context": {
                "user": {
                    "id": participant.user_id,
                    "name": participant.name,
                    "email": participant.email,
                    "avatar": participant.avatar_url
                }
            },
            "aud": self.jitsi_app_id,
            "iss": self.jitsi_app_id,
            "sub": self.jitsi_domain,
            "room": room_id,
            "exp": datetime.now() + timedelta(hours=2)
        }
        return pyjwt.encode(payload, self.jitsi_private_key, algorithm="RS256")
    
    def _generate_agora_token(self, channel_name: str, user_id: str) -> str:
        """Generate Agora RTC token."""
        # Simplified token generation - in production, use Agora's token server
        if not self.agora_app_certificate:
            return None
        
        # This is a simplified implementation
        # In production, use Agora's official token generation library
        expiration_time = int((datetime.now() + timedelta(hours=24)).timestamp())
        
        message = f"{self.agora_app_id}{channel_name}{user_id}{expiration_time}"
        signature = hmac.new(
            self.agora_app_certificate.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return base64.b64encode(f"{signature}:{expiration_time}".encode()).decode()


# Global instance
video_call_service = VideoCallService()
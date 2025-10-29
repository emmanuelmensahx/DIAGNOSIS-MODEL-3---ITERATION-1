from fastapi import BackgroundTasks, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.db.models import User, Notification, NotificationType
from app.utils.email import send_email_notification

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
    
    async def create_notification(
        self,
        user_id: int,
        notification_type: NotificationType,
        title: str,
        message: str,
        link: Optional[str] = None,
        send_email: bool = False,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Notification:
        """Create a new notification for a user"""
        # Check if user exists
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User with ID {user_id} not found")
        
        # Create notification
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            link=link,
            read=False,
            created_at=datetime.utcnow()
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        # Send email notification in background if requested
        if send_email and user.email and background_tasks:
            background_tasks.add_task(
                send_email_notification,
                user.email,
                title,
                message
            )
        
        return notification
    
    async def create_system_notification(
        self,
        user_ids: List[int],
        title: str,
        message: str,
        link: Optional[str] = None,
        send_email: bool = False,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> List[Notification]:
        """Create system notifications for multiple users"""
        notifications = []
        
        for user_id in user_ids:
            try:
                notification = await self.create_notification(
                    user_id=user_id,
                    notification_type=NotificationType.SYSTEM,
                    title=title,
                    message=message,
                    link=link,
                    send_email=send_email,
                    background_tasks=background_tasks
                )
                notifications.append(notification)
            except ValueError:
                # Skip users that don't exist
                continue
        
        return notifications
    
    async def create_diagnosis_notification(
        self,
        user_id: int,
        diagnosis_id: int,
        title: str,
        message: str,
        send_email: bool = False,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Notification:
        """Create a diagnosis-related notification"""
        link = f"/diagnoses/{diagnosis_id}"
        
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.DIAGNOSIS,
            title=title,
            message=message,
            link=link,
            send_email=send_email,
            background_tasks=background_tasks
        )
    
    async def create_treatment_notification(
        self,
        user_id: int,
        treatment_id: int,
        title: str,
        message: str,
        send_email: bool = False,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Notification:
        """Create a treatment-related notification"""
        link = f"/treatments/{treatment_id}"
        
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.TREATMENT,
            title=title,
            message=message,
            link=link,
            send_email=send_email,
            background_tasks=background_tasks
        )
    
    async def create_follow_up_notification(
        self,
        user_id: int,
        follow_up_id: int,
        title: str,
        message: str,
        send_email: bool = False,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Notification:
        """Create a follow-up-related notification"""
        link = f"/follow-ups/{follow_up_id}"
        
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.FOLLOW_UP,
            title=title,
            message=message,
            link=link,
            send_email=send_email,
            background_tasks=background_tasks
        )

# Dependency for injection
def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(db)
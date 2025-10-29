from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.auth import get_current_active_user
from app.db.database import get_db
from app.db.models import User, UserRole, Consultation, ConsultationStatus
from app.api.schemas import ConsultationCreate, ConsultationResponse, ConsultationUpdate, ConsultationAccept, ConsultationListResponse, ConsultationStats

router = APIRouter(prefix="/consultations", tags=["consultations"])

@router.post("/", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
async def create_consultation_request(
    consultation_data: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new consultation request for specialist review"""
    
    # Create consultation request
    consultation = Consultation(
        patient_id=consultation_data.patient_id,
        diagnosis_id=consultation_data.diagnosis_id,
        requesting_user_id=current_user.id,
        status=ConsultationStatus.PENDING,
        priority=consultation_data.priority,
        specialization_required=consultation_data.specialization_required,
        description=consultation_data.description,
        estimated_duration=consultation_data.estimated_duration,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    
    return consultation

@router.get("/requests", response_model=ConsultationListResponse)
async def get_consultation_requests(
    status_filter: Optional[str] = None,
    priority: Optional[str] = None,
    specialization: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get consultation requests (for specialists)"""
    
    if current_user.role != UserRole.SPECIALIST:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only specialists can view consultation requests"
        )
    
    # Build query
    query = db.query(Consultation).filter(Consultation.specialist_id.is_(None))
    
    if status_filter:
        query = query.filter(Consultation.status == status_filter)
    
    if priority:
        query = query.filter(Consultation.priority == priority)
        
    if specialization:
        query = query.filter(Consultation.specialization_required == specialization)
    
    # Order by priority and creation time
    consultations = query.order_by(
        Consultation.priority.desc(),
        Consultation.created_at.asc()
    ).all()
    
    return ConsultationListResponse(
        consultations=consultations,
        total_count=len(consultations)
    )

@router.get("/my-requests", response_model=ConsultationListResponse)
async def get_my_consultation_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get consultation requests created by current user"""
    
    consultations = db.query(Consultation).filter(
        Consultation.requesting_user_id == current_user.id
    ).order_by(Consultation.created_at.desc()).all()
    
    return ConsultationListResponse(
        consultations=consultations,
        total_count=len(consultations)
    )

@router.get("/active", response_model=ConsultationListResponse)
async def get_active_consultations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get active consultations for current specialist"""
    
    if current_user.role != UserRole.SPECIALIST:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only specialists can view active consultations"
        )
    
    consultations = db.query(Consultation).filter(
        Consultation.specialist_id == current_user.id,
        Consultation.status.in_([ConsultationStatus.ACCEPTED, ConsultationStatus.IN_PROGRESS])
    ).order_by(Consultation.updated_at.desc()).all()
    
    return ConsultationListResponse(
        consultations=consultations,
        total_count=len(consultations)
    )

@router.post("/{consultation_id}/accept", response_model=ConsultationResponse)
async def accept_consultation(
    consultation_id: int,
    accept_data: ConsultationAccept,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Accept a consultation request"""
    
    if current_user.role != UserRole.SPECIALIST:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only specialists can accept consultations"
        )
    
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found"
        )
    
    if consultation.status != ConsultationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultation is not in pending status"
        )
    
    # Update consultation
    consultation.specialist_id = current_user.id
    consultation.status = ConsultationStatus.ACCEPTED
    consultation.specialist_notes = accept_data.notes
    consultation.estimated_duration = accept_data.estimated_duration or consultation.estimated_duration
    consultation.scheduled_at = accept_data.scheduled_at or consultation.scheduled_at
    consultation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(consultation)
    
    return consultation

@router.post("/{consultation_id}/decline", response_model=dict)
async def decline_consultation(
    consultation_id: int,
    decline_reason: str = "Not available",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Decline a consultation request"""
    
    if current_user.role != UserRole.SPECIALIST:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only specialists can decline consultations"
        )
    
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found"
        )
    
    if consultation.status != ConsultationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultation is not in pending status"
        )
    
    # Update consultation
    consultation.status = ConsultationStatus.DECLINED
    consultation.specialist_notes = f"Declined: {decline_reason}"
    consultation.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Consultation declined successfully"}

@router.put("/{consultation_id}", response_model=ConsultationResponse)
async def update_consultation(
    consultation_id: int,
    update_data: ConsultationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update consultation details"""
    
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.SPECIALIST:
        if consultation.specialist_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own consultations"
            )
    elif consultation.requesting_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update consultations you requested"
        )
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(consultation, field, value)
    
    consultation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(consultation)
    
    return consultation

@router.post("/{consultation_id}/complete", response_model=ConsultationResponse)
async def complete_consultation(
    consultation_id: int,
    completion_notes: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark consultation as completed"""
    
    if current_user.role != UserRole.SPECIALIST:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only specialists can complete consultations"
        )
    
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found"
        )
    
    if consultation.specialist_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only complete your own consultations"
        )
    
    # Update consultation
    consultation.status = ConsultationStatus.COMPLETED
    consultation.specialist_notes = completion_notes
    consultation.completed_at = datetime.utcnow()
    consultation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(consultation)
    
    return consultation

@router.get("/stats", response_model=ConsultationStats)
async def get_consultation_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get consultation statistics for current specialist"""
    
    if current_user.role != UserRole.SPECIALIST:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only specialists can view consultation statistics"
        )
    
    # Get statistics
    pending_count = db.query(Consultation).filter(
        Consultation.specialist_id.is_(None),
        Consultation.status == ConsultationStatus.PENDING
    ).count()
    
    active_count = db.query(Consultation).filter(
        Consultation.specialist_id == current_user.id,
        Consultation.status.in_([ConsultationStatus.ACCEPTED, ConsultationStatus.IN_PROGRESS])
    ).count()
    
    completed_count = db.query(Consultation).filter(
        Consultation.specialist_id == current_user.id,
        Consultation.status == ConsultationStatus.COMPLETED
    ).count()
    
    total_requests = db.query(Consultation).filter(
        Consultation.specialist_id.is_(None)
    ).count()
    
    return ConsultationStats(
        total_consultations=total_requests,
        pending_consultations=pending_count,
        active_consultations=active_count,
        completed_consultations=completed_count
    )
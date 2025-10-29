from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import Patient, MedicalHistory, User
from app.api.schemas import (
    PatientCreate, PatientUpdate, Patient as PatientSchema, PatientWithHistory, PaginatedPatients,
    MedicalHistoryCreate, MedicalHistory as MedicalHistorySchema
)
from app.core.auth import get_current_active_user, get_frontline_worker

router = APIRouter()

@router.post("/patients/", response_model=PatientSchema, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    # Create new patient
    db_patient = Patient(
        **patient.dict(),
        frontline_worker_id=current_user.id,
        created_by=current_user.id
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.get("/patients/", response_model=PaginatedPatients)
def read_patients(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    gender: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Query patients
    query = db.query(Patient)
    
    # Filter by frontline worker if user is not an admin or specialist
    if current_user.role == "frontline_worker":
        query = query.filter(Patient.frontline_worker_id == current_user.id)
    
    # Apply gender filter
    if gender:
        query = query.filter(Patient.gender == gender)

    # Apply search filter if provided (search by name and address/phone)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Patient.first_name.ilike(like)) |
            (Patient.last_name.ilike(like)) |
            (Patient.address.ilike(like)) |
            (Patient.phone_number.ilike(like))
        )

    # Pagination calculations
    total = query.count()
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()
    return {"page": page, "size": size, "total": total, "items": items}

@router.get("/patients/{patient_id:int}", response_model=PatientSchema)
def read_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get patient by ID
    db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if user has access to this patient
    if current_user.role == "frontline_worker" and db_patient.frontline_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this patient")
    
    return db_patient

@router.put("/patients/{patient_id:int}", response_model=PatientWithHistory)
def update_patient(
    patient_id: int,
    patient: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get patient by ID
    db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if user has access to this patient
    if current_user.role == "frontline_worker" and db_patient.frontline_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this patient")
    
    # Update patient fields
    patient_data = patient.dict(exclude_unset=True)
    # Handle medical_history separately to avoid assigning to relationship
    medical_note = patient_data.pop("medical_history", None)
    for key, value in patient_data.items():
        setattr(db_patient, key, value)
    
    db.commit()
    db.refresh(db_patient)

    # Optionally persist the medical note as a MedicalHistory record
    if medical_note is not None:
        db_med = MedicalHistory(
            patient_id=patient_id,
            condition="general_update",
            notes=medical_note,
        )
        db.add(db_med)
        db.commit()
        db.refresh(db_med)

    # Build response using schema and include medical_history note if provided
    # Serialize using base patient schema to avoid ORM relationship mapping issues
    base_dict = PatientSchema.from_orm(db_patient).dict()
    if medical_note is not None:
        base_dict["medical_history"] = medical_note
    return base_dict

@router.delete("/patients/{patient_id:int}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    # Get patient by ID
    db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if user has access to this patient
    if db_patient.frontline_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this patient")
    
    # Delete patient
    db.delete(db_patient)
    db.commit()
    return None

# Medical History endpoints
@router.post("/patients/{patient_id:int}/medical-history/", response_model=MedicalHistorySchema)
def create_medical_history(
    patient_id: int,
    medical_history: MedicalHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    # Check if patient exists and user has access
    db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if db_patient.frontline_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add medical history for this patient")
    
    # Create medical history entry
    db_medical_history = MedicalHistory(
        **medical_history.dict(),
        patient_id=patient_id
    )
    
    db.add(db_medical_history)
    db.commit()
    db.refresh(db_medical_history)
    return db_medical_history

@router.get("/patients/{patient_id:int}/medical-history/", response_model=List[MedicalHistorySchema])
def read_medical_history(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if patient exists and user has access
    db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if current_user.role == "frontline_worker" and db_patient.frontline_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view medical history for this patient")
    
    # Get medical history for patient
    medical_history = db.query(MedicalHistory).filter(MedicalHistory.patient_id == patient_id).all()
    return medical_history

# Dedicated search endpoint to avoid collision with numeric patient_id
@router.get("/patients/search", response_model=PaginatedPatients)
def search_patients(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Patient)
    if current_user.role == "frontline_worker":
        query = query.filter(Patient.frontline_worker_id == current_user.id)

    like = f"%{q}%"
    query = query.filter(
        (Patient.first_name.ilike(like)) |
        (Patient.last_name.ilike(like)) |
        (Patient.address.ilike(like)) |
        (Patient.phone_number.ilike(like))
    )

    total = query.count()
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()
    return {"page": page, "size": size, "total": total, "items": items}
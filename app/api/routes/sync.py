from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
import asyncio
import logging
import os

from app.db.database import get_db
from app.db.models import User, Patient, Diagnosis, Treatment, FollowUp
from app.api.schemas import SyncRequest, SyncResponse, SyncData
from app.core.auth import get_current_active_user
from app.utils.image_storage import get_medical_images_by_diagnosis

# Import offline sync functionality if available
try:
    from app.database.offline_sync import OfflineSync, auto_sync_if_connected
    from app.core.config_offline import get_offline_settings
    OFFLINE_SYNC_AVAILABLE = True
except ImportError:
    OFFLINE_SYNC_AVAILABLE = False

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for offline sync API
class SyncStatusResponse(BaseModel):
    status: str
    last_sync: Optional[str] = None
    pending_items: int = 0
    internet_available: bool = False
    sync_enabled: bool = False

class SyncResultResponse(BaseModel):
    status: str
    timestamp: str
    patients_uploaded: int = 0
    diagnoses_uploaded: int = 0
    updates_downloaded: int = 0
    errors: int = 0
    message: Optional[str] = None

class SyncConfigRequest(BaseModel):
    remote_url: Optional[str] = None
    api_key: Optional[str] = None
    auto_sync_enabled: bool = True
    sync_interval_hours: int = 6

@router.post("/sync", response_model=SyncResponse)
async def sync_data(
    sync_request: SyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get last sync timestamp
    last_sync = sync_request.last_sync
    
    # Process incoming data from client
    await process_incoming_data(db, current_user, sync_request.data)
    
    # Get updated data since last sync
    updated_data = await get_updated_data(db, current_user, last_sync)
    
    return {
        "status": "success",
        "data": updated_data,
        "message": "Sync completed successfully"
    }

@router.get("/sync/timestamp")
async def get_last_sync_timestamp(
    current_user: User = Depends(get_current_active_user)
):
    # Return current server timestamp for sync reference
    return {
        "status": "success",
        "data": {
            "timestamp": datetime.utcnow()
        },
        "message": "Current server timestamp"
    }

async def process_incoming_data(db: Session, user: User, data: SyncData):
    """Process data coming from the client during sync"""
    
    # Process patients
    if data.patients:
        for patient_data in data.patients:
            # Check if patient exists by unique_id
            patient_id = patient_data.get("id")
            unique_id = patient_data.get("unique_id")
            
            existing_patient = None
            if patient_id:
                existing_patient = db.query(Patient).filter(Patient.id == patient_id).first()
            elif unique_id:
                existing_patient = db.query(Patient).filter(Patient.unique_id == unique_id).first()
            
            if existing_patient:
                # Update existing patient
                for key, value in patient_data.items():
                    if key not in ["id", "created_at", "updated_at", "frontline_worker_id"]:
                        setattr(existing_patient, key, value)
                existing_patient.updated_at = datetime.utcnow()
            else:
                # Create new patient
                new_patient = Patient(
                    **{k: v for k, v in patient_data.items() if k not in ["id", "created_at", "updated_at"]},
                    frontline_worker_id=user.id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(new_patient)
    
    # Process diagnoses
    if data.diagnoses:
        for diagnosis_data in data.diagnoses:
            # Check if diagnosis exists
            diagnosis_id = diagnosis_data.get("id")
            
            existing_diagnosis = None
            if diagnosis_id:
                existing_diagnosis = db.query(Diagnosis).filter(Diagnosis.id == diagnosis_id).first()
            
            if existing_diagnosis:
                # Update existing diagnosis
                for key, value in diagnosis_data.items():
                    if key not in ["id", "created_at", "updated_at", "created_by_id"]:
                        setattr(existing_diagnosis, key, value)
                existing_diagnosis.updated_at = datetime.utcnow()
            else:
                # Create new diagnosis
                new_diagnosis = Diagnosis(
                    **{k: v for k, v in diagnosis_data.items() if k not in ["id", "created_at", "updated_at"]},
                    created_by_id=user.id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(new_diagnosis)
    
    # Process treatments
    if data.treatments:
        for treatment_data in data.treatments:
            # Check if treatment exists
            treatment_id = treatment_data.get("id")
            
            existing_treatment = None
            if treatment_id:
                existing_treatment = db.query(Treatment).filter(Treatment.id == treatment_id).first()
            
            if existing_treatment and user.role == "specialist":
                # Only specialists can update treatments
                for key, value in treatment_data.items():
                    if key not in ["id", "created_at", "updated_at", "prescribed_by_id"]:
                        setattr(existing_treatment, key, value)
                existing_treatment.updated_at = datetime.utcnow()
            elif not existing_treatment and user.role == "specialist":
                # Create new treatment
                new_treatment = Treatment(
                    **{k: v for k, v in treatment_data.items() if k not in ["id", "created_at", "updated_at"]},
                    prescribed_by_id=user.id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(new_treatment)
    
    # Process follow-ups
    if data.follow_ups:
        for follow_up_data in data.follow_ups:
            # Check if follow-up exists
            follow_up_id = follow_up_data.get("id")
            
            existing_follow_up = None
            if follow_up_id:
                existing_follow_up = db.query(FollowUp).filter(FollowUp.id == follow_up_id).first()
            
            if existing_follow_up:
                # Update existing follow-up
                for key, value in follow_up_data.items():
                    if key not in ["id", "created_at", "updated_at"]:
                        setattr(existing_follow_up, key, value)
                existing_follow_up.updated_at = datetime.utcnow()
            else:
                # Create new follow-up
                new_follow_up = FollowUp(
                    **{k: v for k, v in follow_up_data.items() if k not in ["id", "created_at", "updated_at"]},
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(new_follow_up)
    
    # Commit all changes
    db.commit()

async def get_updated_data(db: Session, user: User, last_sync: datetime) -> SyncData:
    """Get data updated since last sync"""
    
    result = SyncData()
    
    # Get updated patients
    if user.role == "frontline_worker":
        # Frontline workers only get their own patients
        patients = db.query(Patient).filter(
            Patient.frontline_worker_id == user.id,
            Patient.updated_at >= last_sync
        ).all()
        result.patients = [{
            "id": p.id,
            "unique_id": p.unique_id,
            "age": p.age,
            "gender": p.gender,
            "location": p.location,
            "frontline_worker_id": p.frontline_worker_id,
            "created_at": p.created_at,
            "updated_at": p.updated_at
        } for p in patients]
        
        # Get patient IDs for filtering diagnoses
        patient_ids = [p.id for p in patients]
        
        # Get updated diagnoses for these patients
        diagnoses = db.query(Diagnosis).filter(
            Diagnosis.patient_id.in_(patient_ids) if patient_ids else False,
            Diagnosis.updated_at >= last_sync
        ).all()
    elif user.role == "specialist":
        # Specialists get all pending diagnoses and those they've reviewed
        diagnoses = db.query(Diagnosis).filter(
            (Diagnosis.status == "pending") | 
            (Diagnosis.reviewed_by_id == user.id),
            Diagnosis.updated_at >= last_sync
        ).all()
        
        # Get patient IDs from these diagnoses
        patient_ids = list(set([d.patient_id for d in diagnoses]))
        
        # Get patients for these diagnoses
        patients = db.query(Patient).filter(
            Patient.id.in_(patient_ids) if patient_ids else False
        ).all()
        result.patients = [{
            "id": p.id,
            "unique_id": p.unique_id,
            "age": p.age,
            "gender": p.gender,
            "location": p.location,
            "frontline_worker_id": p.frontline_worker_id,
            "created_at": p.created_at,
            "updated_at": p.updated_at
        } for p in patients]
    
    # Process diagnoses
    result.diagnoses = []
    for d in diagnoses:
        diagnosis_dict = {
            "id": d.id,
            "patient_id": d.patient_id,
            "disease_type": d.disease_type,
            "symptoms": d.symptoms,
            "ai_confidence": d.ai_confidence,
            "ai_diagnosis": d.ai_diagnosis,
            "status": d.status,
            "notes": d.notes,
            "created_by_id": d.created_by_id,
            "reviewed_by_id": d.reviewed_by_id,
            "created_at": d.created_at,
            "updated_at": d.updated_at
        }
        
        # Get medical images for this diagnosis
        images = await get_medical_images_by_diagnosis(d.id)
        if images:
            diagnosis_dict["images"] = images
            
        result.diagnoses.append(diagnosis_dict)
    
    # Get diagnosis IDs for filtering treatments
    diagnosis_ids = [d.id for d in diagnoses]
    
    # Get updated treatments for these diagnoses
    treatments = db.query(Treatment).filter(
        Treatment.diagnosis_id.in_(diagnosis_ids) if diagnosis_ids else False,
        Treatment.updated_at >= last_sync
    ).all()
    
    result.treatments = [{
        "id": t.id,
        "diagnosis_id": t.diagnosis_id,
        "treatment_plan": t.treatment_plan,
        "prescribed_by_id": t.prescribed_by_id,
        "start_date": t.start_date,
        "end_date": t.end_date,
        "notes": t.notes,
        "created_at": t.created_at,
        "updated_at": t.updated_at
    } for t in treatments]
    
    # Get treatment IDs for filtering follow-ups
    treatment_ids = [t.id for t in treatments]
    
    # Get updated follow-ups for these treatments
    follow_ups = db.query(FollowUp).filter(
        FollowUp.treatment_id.in_(treatment_ids) if treatment_ids else False,
        FollowUp.updated_at >= last_sync
    ).all()
    
    result.follow_ups = [{
        "id": f.id,
        "treatment_id": f.treatment_id,
        "status": f.status,
        "notes": f.notes,
        "scheduled_date": f.scheduled_date,
        "completed_date": f.completed_date,
        "created_at": f.created_at,
        "updated_at": f.updated_at
    } for f in follow_ups]
    
    return result


# ============================================================================
# OFFLINE SYNC ENDPOINTS FOR RURAL DEPLOYMENT
# ============================================================================

# Dependency to get sync manager for offline deployment
async def get_sync_manager():
    if not OFFLINE_SYNC_AVAILABLE:
        raise HTTPException(
            status_code=501, 
            detail="Offline sync functionality not available in this deployment"
        )
    
    settings = get_offline_settings()
    return OfflineSync(settings.DATABASE_URL.replace("sqlite:///", ""))

@router.get("/offline/status", response_model=SyncStatusResponse)
async def get_offline_sync_status():
    """Get current offline synchronization status"""
    if not OFFLINE_SYNC_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Offline sync not available in this deployment"
        )
    
    try:
        sync_manager = await get_sync_manager()
        
        # Check internet connectivity
        internet_available = await sync_manager.check_internet_connectivity()
        
        # Get pending sync items
        pending_items = await sync_manager.get_pending_sync_items()
        
        # Get last sync timestamp
        last_sync = await sync_manager._get_last_sync_timestamp()
        
        return SyncStatusResponse(
            status="ready" if sync_manager.sync_enabled else "disabled",
            last_sync=last_sync if last_sync != "1970-01-01T00:00:00" else None,
            pending_items=len(pending_items),
            internet_available=internet_available,
            sync_enabled=sync_manager.sync_enabled
        )
    
    except Exception as e:
        logger.error(f"Error getting offline sync status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/offline/manual", response_model=SyncResultResponse)
async def manual_offline_sync():
    """Manually trigger offline synchronization"""
    if not OFFLINE_SYNC_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Offline sync not available in this deployment"
        )
    
    try:
        sync_manager = await get_sync_manager()
        
        if not sync_manager.sync_enabled:
            raise HTTPException(
                status_code=400, 
                detail="Synchronization is not configured. Please set up sync settings first."
            )
        
        # Check internet connectivity
        if not await sync_manager.check_internet_connectivity():
            raise HTTPException(
                status_code=400,
                detail="No internet connection available. Cannot perform synchronization."
            )
        
        # Perform sync
        results = await sync_manager.perform_full_sync()
        
        return SyncResultResponse(**results)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Manual offline sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/offline/auto", response_model=SyncResultResponse)
async def trigger_auto_offline_sync(background_tasks: BackgroundTasks):
    """Trigger automatic offline sync in background if conditions are met"""
    if not OFFLINE_SYNC_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Offline sync not available in this deployment"
        )
    
    try:
        settings = get_offline_settings()
        
        # Add background task for auto sync
        background_tasks.add_task(
            auto_sync_if_connected, 
            settings.DATABASE_URL.replace("sqlite:///", "")
        )
        
        return SyncResultResponse(
            status="scheduled",
            timestamp=datetime.now().isoformat(),
            message="Auto-sync scheduled in background"
        )
    
    except Exception as e:
        logger.error(f"Error scheduling auto offline sync: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/offline/pending")
async def get_pending_offline_sync_items():
    """Get list of items pending offline synchronization"""
    if not OFFLINE_SYNC_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Offline sync not available in this deployment"
        )
    
    try:
        sync_manager = await get_sync_manager()
        pending_items = await sync_manager.get_pending_sync_items()
        
        # Group by table and operation for better overview
        summary = {}
        for item in pending_items:
            table = item['table_name']
            operation = item['operation']
            
            if table not in summary:
                summary[table] = {}
            if operation not in summary[table]:
                summary[table][operation] = 0
            
            summary[table][operation] += 1
        
        return {
            "total_pending": len(pending_items),
            "summary": summary,
            "items": pending_items[:50]  # Limit to first 50 items for performance
        }
    
    except Exception as e:
        logger.error(f"Error getting pending offline sync items: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/offline/config")
async def update_offline_sync_config(config: SyncConfigRequest):
    """Update offline synchronization configuration"""
    if not OFFLINE_SYNC_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Offline sync not available in this deployment"
        )
    
    try:
        settings = get_offline_settings()
        
        # Update sync configuration in database
        import sqlite3
        conn = sqlite3.connect(settings.DATABASE_URL.replace("sqlite:///", ""))
        cursor = conn.cursor()
        
        try:
            # Update sync settings
            if config.remote_url:
                cursor.execute("""
                    INSERT OR REPLACE INTO system_settings (setting_key, setting_value)
                    VALUES ('sync_remote_url', ?)
                """, (config.remote_url,))
            
            if config.api_key:
                cursor.execute("""
                    INSERT OR REPLACE INTO system_settings (setting_key, setting_value)
                    VALUES ('sync_api_key', ?)
                """, (config.api_key,))
            
            cursor.execute("""
                INSERT OR REPLACE INTO system_settings (setting_key, setting_value)
                VALUES ('auto_sync_enabled', ?)
            """, (str(config.auto_sync_enabled),))
            
            cursor.execute("""
                INSERT OR REPLACE INTO system_settings (setting_key, setting_value)
                VALUES ('sync_interval_hours', ?)
            """, (str(config.sync_interval_hours),))
            
            conn.commit()
            
            return {"status": "success", "message": "Offline sync configuration updated"}
        
        finally:
            conn.close()
    
    except Exception as e:
        logger.error(f"Error updating offline sync config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/offline/config")
async def get_offline_sync_config():
    """Get current offline synchronization configuration"""
    if not OFFLINE_SYNC_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Offline sync not available in this deployment"
        )
    
    try:
        settings = get_offline_settings()
        
        import sqlite3
        conn = sqlite3.connect(settings.DATABASE_URL.replace("sqlite:///", ""))
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT setting_key, setting_value FROM system_settings 
                WHERE setting_key IN ('sync_remote_url', 'auto_sync_enabled', 'sync_interval_hours')
            """)
            
            config = {}
            for row in cursor.fetchall():
                key, value = row
                if key == 'auto_sync_enabled':
                    config[key] = value.lower() == 'true'
                elif key == 'sync_interval_hours':
                    config[key] = int(value) if value else 6
                else:
                    config[key] = value
            
            # Don't return API key for security
            config['api_key_configured'] = bool(config.get('sync_api_key'))
            config.pop('sync_api_key', None)
            
            return config
        
        finally:
            conn.close()
    
    except Exception as e:
        logger.error(f"Error getting offline sync config: {e}")
        raise HTTPException(status_code=500, detail=str(e))
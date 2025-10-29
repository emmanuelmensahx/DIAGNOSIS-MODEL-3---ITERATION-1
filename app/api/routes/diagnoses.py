from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import logging

from app.db.database import get_db
from app.db.models import Diagnosis, Patient, User, DiagnosisStatus, Disease, DiseaseCategory, DiseaseSeverity
from app.api.schemas import (
    DiagnosisCreate, DiagnosisUpdate, Diagnosis as DiagnosisSchema,
    DiagnosisInDB, EmergencyDiagnosisCreate
)
from app.core.auth import get_current_active_user, get_frontline_worker, get_specialist
# Direct imports for ML modules
from app.ml.prediction import predict_disease, predict_disease_sync_wrapper
from app.utils.image_storage import save_medical_image, get_medical_image


from app.data.diseases_registry import get_disease_by_code, get_disease_from_complete_database, search_diseases_by_symptoms
from app.data.extended_diseases_database import get_complete_disease_database
from app.data.treatment_protocols_database import get_treatment_protocol

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/emergency-diagnosis", response_model=DiagnosisSchema, status_code=status.HTTP_201_CREATED)
async def create_emergency_diagnosis(
    emergency_diagnosis: EmergencyDiagnosisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create emergency diagnosis with minimal required information"""
    logger.info(
        f"[Emergency Diagnosis] Create requested: medical_history_length={len(emergency_diagnosis.medical_history)}, by_user={getattr(current_user, 'id', 'unknown')}"
    )
    
    # Handle patient creation or lookup
    patient_id = emergency_diagnosis.patient_id
    if not patient_id and emergency_diagnosis.patient_name:
        # Create temporary patient for emergency case
        from app.db.models import Patient
        patient_name_parts = (emergency_diagnosis.patient_name or "Emergency Patient").split(" ", 1)
        first_name = patient_name_parts[0]
        last_name = patient_name_parts[1] if len(patient_name_parts) > 1 else "Patient"
        
        temp_patient = Patient(
            first_name=first_name,
            last_name=last_name,
            date_of_birth="1990-01-01",  # Default if age not provided
            gender=emergency_diagnosis.patient_gender or "unknown",
            phone_number=emergency_diagnosis.patient_phone,
            frontline_worker_id=current_user.id,
            created_by=current_user.id
        )
        db.add(temp_patient)
        db.flush()  # Get the ID without committing
        patient_id = temp_patient.id
    elif not patient_id:
        # Create anonymous emergency patient
        from app.db.models import Patient
        temp_patient = Patient(
            first_name="Emergency",
            last_name="Patient",
            date_of_birth="1990-01-01",  # Default date
            gender="unknown",
            frontline_worker_id=current_user.id,
            created_by=current_user.id
        )
        db.add(temp_patient)
        db.flush()
        patient_id = temp_patient.id
    
    # Enhanced text processing for medical history
    from app.services.text_processor import medical_text_processor
    
    # Extract information from medical history text
    base_data = {
        'temperature': emergency_diagnosis.temperature,
        'blood_pressure_systolic': emergency_diagnosis.blood_pressure_systolic,
        'blood_pressure_diastolic': emergency_diagnosis.blood_pressure_diastolic,
        'heart_rate': emergency_diagnosis.heart_rate,
        'respiratory_rate': emergency_diagnosis.respiratory_rate,
        'oxygen_saturation': emergency_diagnosis.oxygen_saturation,
        'allergies': emergency_diagnosis.allergies,
        'symptom_duration': emergency_diagnosis.symptom_duration,
        'patient_age': emergency_diagnosis.patient_age,
        'patient_gender': emergency_diagnosis.patient_gender,
        'symptoms': emergency_diagnosis.symptoms
    }
    
    # Enhance with extracted data from medical history
    enhanced_data = medical_text_processor.enhance_emergency_diagnosis_data(
        emergency_diagnosis.medical_history, base_data
    )
    
    # Prepare additional data for LLM analysis
    additional_data = {}
    
    # Compile vital signs (from both provided and extracted data)
    vital_signs = []
    if enhanced_data.get('temperature'):
        vital_signs.append(f"Temperature: {enhanced_data['temperature']}°C")
    if enhanced_data.get('blood_pressure_systolic') and enhanced_data.get('blood_pressure_diastolic'):
        vital_signs.append(f"BP: {enhanced_data['blood_pressure_systolic']}/{enhanced_data['blood_pressure_diastolic']} mmHg")
    if enhanced_data.get('heart_rate'):
        vital_signs.append(f"HR: {enhanced_data['heart_rate']} bpm")
    if enhanced_data.get('respiratory_rate'):
        vital_signs.append(f"RR: {enhanced_data['respiratory_rate']}/min")
    if enhanced_data.get('oxygen_saturation'):
        vital_signs.append(f"O2 Sat: {enhanced_data['oxygen_saturation']}%")
    
    if vital_signs:
        additional_data['vital_signs'] = ", ".join(vital_signs)
    
    if enhanced_data.get('allergies'):
        additional_data['allergies'] = enhanced_data['allergies']
    if enhanced_data.get('symptom_duration'):
        additional_data['symptom_duration'] = enhanced_data['symptom_duration']
    if enhanced_data.get('symptom_severity'):
        additional_data['symptom_severity'] = enhanced_data['symptom_severity']
    
    # Patient demographics (from both provided and extracted data)
    demographics = []
    if enhanced_data.get('patient_age'):
        demographics.append(f"Age: {enhanced_data['patient_age']}")
    if enhanced_data.get('patient_gender'):
        demographics.append(f"Gender: {enhanced_data['patient_gender']}")
    if demographics:
        additional_data['patient_demographics'] = ", ".join(demographics)
    
    # Add extracted symptoms if available
    if enhanced_data.get('symptoms'):
        additional_data['extracted_symptoms'] = enhanced_data['symptoms']
    
    # Use LLM service for emergency diagnosis
    from app.services.llm_service import LLMService
    from app.services.medical_prompts import MedicalPromptTemplates
    
    llm_service = LLMService()
    
    try:
        # Get emergency diagnosis prompt
        prompt = MedicalPromptTemplates.get_emergency_diagnosis_prompt(
            emergency_diagnosis.medical_history,
            additional_data
        )
        
        # Prepare patient data for LLM analysis
        patient_data = {
            'age': enhanced_data.get('patient_age'),
            'gender': enhanced_data.get('patient_gender'),
            'temperature': enhanced_data.get('temperature'),
            'blood_pressure_systolic': enhanced_data.get('blood_pressure_systolic'),
            'blood_pressure_diastolic': enhanced_data.get('blood_pressure_diastolic'),
            'heart_rate': enhanced_data.get('heart_rate'),
            'respiratory_rate': enhanced_data.get('respiratory_rate'),
            'oxygen_saturation': enhanced_data.get('oxygen_saturation'),
            'allergies': enhanced_data.get('allergies'),
            'symptom_duration': enhanced_data.get('symptom_duration'),
            'symptoms': enhanced_data.get('symptoms')
        }
        
        # Get LLM analysis
        llm_response = await llm_service.analyze_medical_case(prompt, patient_data)
        
        # Create diagnosis record with enhanced symptoms
        symptoms_text = enhanced_data.get('symptoms') or emergency_diagnosis.symptoms or emergency_diagnosis.medical_history[:500]
        
        # Get disease code from LLM response or use provided code
        disease_code = (
            llm_response.get('disease_code') or 
            llm_response.get('primary_diagnosis_code') or 
            emergency_diagnosis.disease_code
        )
        
        # If no explicit disease code, try to extract from primary diagnosis text
        if not disease_code:
            primary_diagnosis = llm_response.get('Primary Diagnosis', '').lower()
            if 'malaria' in primary_diagnosis:
                disease_code = 'malaria'
            elif 'pneumonia' in primary_diagnosis:
                disease_code = 'pneumonia'
            elif 'tuberculosis' in primary_diagnosis or 'tb' in primary_diagnosis:
                disease_code = 'tuberculosis'
            elif 'covid' in primary_diagnosis or 'coronavirus' in primary_diagnosis:
                disease_code = 'covid19'
            elif 'typhoid' in primary_diagnosis:
                disease_code = 'typhoid'
            elif 'dengue' in primary_diagnosis:
                disease_code = 'dengue'
        
        # If Grok fails to provide a disease code, return error instead of fallback
        if not disease_code:
            raise HTTPException(
                status_code=503,
                detail="Emergency diagnosis service unavailable - Grok AI failed to provide diagnosis"
            )
        
        disease = get_disease_by_code(disease_code)
        if not disease:
            raise HTTPException(
                status_code=503,
                detail=f"Emergency diagnosis service unavailable - Invalid disease code from Grok AI: {disease_code}"
            )
        
        # Handle disease_id - comprehensive database diseases don't have id attribute
        disease_id = None
        if disease:
            if hasattr(disease, 'id'):
                disease_id = disease.id
            else:
                # For dataclass diseases, generate a pseudo-ID based on the code
                disease_id = hash(disease.code) % 1000000
        
        db_diagnosis = Diagnosis(
            patient_id=patient_id,
            disease_code=disease_code,
            disease_id=disease_id,
            symptoms=symptoms_text if isinstance(symptoms_text, list) else [symptoms_text],
            ai_confidence=llm_response.get('confidence_score', llm_response.get('confidence', llm_response.get('Confidence Level', 0.0))),
            ai_diagnosis=json.dumps(llm_response),
            ai_reasoning=llm_response.get('reasoning', 'Emergency diagnosis with LLM analysis'),
            status=DiagnosisStatus.PENDING,
            notes=emergency_diagnosis.additional_notes or "Emergency diagnosis based on medical history with enhanced text analysis",
            created_by_id=current_user.id
        )
        
        db.add(db_diagnosis)
        db.commit()
        db.refresh(db_diagnosis)
        
        logger.info(f"[Emergency Diagnosis] Created successfully: diagnosis_id={db_diagnosis.id}")
        return db_diagnosis
        
    except Exception as e:
        logger.error(f"[Emergency Diagnosis] Error: {str(e)}")
        db.rollback()
        
        # If LLM analysis fails, return error instead of fallback
        raise HTTPException(
            status_code=503,
            detail="Emergency diagnosis service unavailable - Grok AI analysis failed"
        )

@router.post("/diagnoses/", response_model=DiagnosisSchema, status_code=status.HTTP_201_CREATED)
@router.post("/diagnosis", response_model=DiagnosisSchema, status_code=status.HTTP_201_CREATED)
async def create_diagnosis(
    diagnosis: DiagnosisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    logger.info(
        f"[Diagnoses] Create requested: patient_id={diagnosis.patient_id}, disease_code={diagnosis.disease_code}, by_user={getattr(current_user, 'id', 'unknown')}"
    )
    # Check if patient exists and user has access
    db_patient = db.query(Patient).filter(Patient.id == diagnosis.patient_id).first()
    
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Allow specialists to create diagnoses; restrict frontline workers to their own patients
    if current_user.role == "frontline_worker" and db_patient.frontline_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create diagnosis for this patient")
    
    # Process symptoms and get AI prediction
    # Accept plain strings or JSON; store as list for new schema
    if isinstance(diagnosis.symptoms, str):
        try:
            parsed_symptoms = json.loads(diagnosis.symptoms)
            if isinstance(parsed_symptoms, list):
                symptoms_list = parsed_symptoms
            else:
                # Convert comma-separated string to list
                symptoms_list = [s.strip() for s in diagnosis.symptoms.split(',') if s.strip()]
        except Exception:
            # Fallback: convert comma-separated to list
            symptoms_list = [s.strip() for s in diagnosis.symptoms.split(',') if s.strip()]
    else:
        symptoms_list = diagnosis.symptoms if isinstance(diagnosis.symptoms, list) else [str(diagnosis.symptoms)]
    
    logger.debug(f"[Diagnoses] Parsed symptoms count={len(symptoms_list)}")
    
    # Validate disease code using complete database
    disease_code = diagnosis.disease_code
    registry_disease = get_disease_from_complete_database(disease_code)
    if not registry_disease:
        raise HTTPException(status_code=400, detail=f"Invalid disease code: {disease_code}")
    
    # Get or create database Disease record
    db_disease = db.query(Disease).filter(Disease.code == disease_code).first()
    
    if db_disease:
        # Check if existing disease has NULL age_groups and fix it
        if db_disease.age_groups is None:
            logger.info(f"[Diagnoses] Fixing NULL age_groups for existing disease {disease_code}")
            age_groups_list = []
            if hasattr(registry_disease, 'age_groups') and registry_disease.age_groups:
                age_groups_list = [age_group.value if hasattr(age_group, 'value') else str(age_group) for age_group in registry_disease.age_groups]
            db_disease.age_groups = age_groups_list
            db.commit()
            db.refresh(db_disease)
    
    if not db_disease:
        # Create database Disease record from registry data
        regions_list = []
        if hasattr(registry_disease, 'regions') and registry_disease.regions:
            regions_list = [region.value if hasattr(region, 'value') else str(region) for region in registry_disease.regions]
        
        age_groups_list = []
        if hasattr(registry_disease, 'age_groups') and registry_disease.age_groups:
            age_groups_list = [age_group.value if hasattr(age_group, 'value') else str(age_group) for age_group in registry_disease.age_groups]
        
        risk_factors_list = []
        if hasattr(registry_disease, 'risk_factors') and registry_disease.risk_factors:
            risk_factors_list = registry_disease.risk_factors
        
        db_disease = Disease(
            code=disease_code,
            name=registry_disease.name,
            category=DiseaseCategory.GENERAL,  # Default category
            severity=DiseaseSeverity.MODERATE,  # Default severity
            common_symptoms=registry_disease.common_symptoms if hasattr(registry_disease, 'common_symptoms') else [],
            specific_symptoms=registry_disease.specific_symptoms if hasattr(registry_disease, 'specific_symptoms') else [],
            regions=regions_list,
            description=registry_disease.description if hasattr(registry_disease, 'description') else "",
            age_groups=age_groups_list,
            risk_factors=risk_factors_list,
            prevention_measures=[]  # Default empty list since this field doesn't exist in registry
        )
        db.add(db_disease)
        db.commit()
        db.refresh(db_disease)
    
    # Get AI prediction using the new system
    prediction_result = predict_disease(disease_code, symptoms_list)
    logger.info(
        f"[Diagnoses] Prediction complete: diagnosis={prediction_result.get('diagnosis')}, confidence={prediction_result.get('confidence')}"
    )
    
    # Create diagnosis with new schema
    diagnosis_data = diagnosis.dict()
    diagnosis_data["symptoms"] = symptoms_list
    diagnosis_data["disease_id"] = db_disease.id
    
    db_diagnosis = Diagnosis(
        **diagnosis_data,
        ai_diagnosis=prediction_result.get("diagnosis", prediction_result.get("prediction", "Unknown")),
        ai_confidence=prediction_result.get("confidence", 0.0),
        ai_reasoning=prediction_result.get("reasoning", "AI prediction based on symptoms"),
        differential_diagnoses=prediction_result.get("differential_diagnoses", []),
        status=DiagnosisStatus.PENDING,
        created_by_id=current_user.id
    )
    
    db.add(db_diagnosis)
    db.commit()
    db.refresh(db_diagnosis)
    logger.info(f"[Diagnoses] Created diagnosis id={db_diagnosis.id} for patient_id={db_diagnosis.patient_id}")
    return db_diagnosis

@router.post("/diagnoses/enhanced", response_model=DiagnosisSchema, status_code=status.HTTP_201_CREATED)
async def create_enhanced_diagnosis(
    diagnosis: DiagnosisCreate,
    medical_history: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    """Create diagnosis with LLM enhancement combining traditional ML with AI analysis"""
    logger.info(
        f"[Diagnoses] Enhanced create requested: patient_id={diagnosis.patient_id}, disease_code={diagnosis.disease_code}, by_user={getattr(current_user, 'id', 'unknown')}"
    )
    # Check if patient exists and user has access
    db_patient = db.query(Patient).filter(Patient.id == diagnosis.patient_id).first()
    
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if db_patient.frontline_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create diagnosis for this patient")
    
    # Process symptoms and get enhanced AI prediction
    if isinstance(diagnosis.symptoms, str):
        try:
            symptoms = json.loads(diagnosis.symptoms)
            if not isinstance(symptoms, list):
                symptoms = [s.strip() for s in diagnosis.symptoms.split(',') if s.strip()]
        except Exception:
            symptoms = [s.strip() for s in diagnosis.symptoms.split(',') if s.strip()]
    else:
        symptoms = diagnosis.symptoms if isinstance(diagnosis.symptoms, list) else [str(diagnosis.symptoms)]

    # For enhanced diagnosis, allow comprehensive prediction without specific disease code
    disease_code = diagnosis.disease_code
    if disease_code and disease_code.lower() not in ["unknown", "comprehensive", "predict"]:
        # Validate disease code only if a specific disease is requested
        disease = get_disease_from_complete_database(disease_code)
        if not disease:
            raise HTTPException(status_code=400, detail=f"Invalid disease code: {disease_code}")
    else:
        # For comprehensive prediction, we don't need a specific disease
        disease = None

    # Prepare patient data for LLM analysis using existing fields only
    # Patient model fields available: first_name, last_name, date_of_birth, gender, phone_number, address
    # Derive age from date_of_birth if available
    derived_age = None
    try:
        if getattr(db_patient, 'date_of_birth', None):
            from datetime import datetime
            dob = db_patient.date_of_birth
            if isinstance(dob, str):
                dob = datetime.fromisoformat(dob)
            today = datetime.utcnow()
            derived_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except Exception:
        derived_age = None

    patient_data = {
        "age": derived_age,
        "gender": getattr(db_patient, 'gender', None),
        "address": getattr(db_patient, 'address', None),
        # Optional contextual fields from diagnosis payload if present
        "vital_signs": getattr(diagnosis, 'vital_signs', None),
        "lab_results": getattr(diagnosis, 'lab_results', None),
        "symptom_duration": getattr(diagnosis, 'symptom_duration', None)
    }
    
    # Get enhanced prediction with LLM analysis using comprehensive prediction
    try:
        from app.ml.prediction import predict_disease_comprehensive
        prediction_result = predict_disease_comprehensive(
            symptoms=symptoms,
            patient_data=patient_data,
            medical_images=getattr(diagnosis, 'medical_images', None),
            max_diseases=10
        )
        prediction_result["llm_enhanced"] = True
        prediction_result["enhancement_status"] = "Comprehensive AI prediction completed"
        logger.info(
            f"[Diagnoses] Comprehensive prediction complete: prediction={prediction_result.get('diagnosis')}, confidence={prediction_result.get('confidence')}"
        )
    except Exception as e:
        # Fallback to traditional prediction if comprehensive prediction fails
        prediction_result = predict_disease_comprehensive(symptoms, patient_data)
        prediction_result["llm_enhanced"] = False
        prediction_result["enhancement_status"] = f"Comprehensive prediction failed: {str(e)}"
        logger.warning(f"[Diagnoses] Comprehensive prediction failed; fallback used. error={e}")
    
    # Create diagnosis with enhanced results
    # Avoid passing duplicate 'notes' by constructing fields explicitly
    base_data = diagnosis.dict()
    base_notes = base_data.pop("notes", None)
    base_data["symptoms"] = symptoms
    
    # For comprehensive prediction, try to find disease by predicted code
    if disease is None and prediction_result.get("disease_code"):
        predicted_disease = get_disease_from_complete_database(prediction_result["disease_code"])
        if predicted_disease:
            # Handle both database models (with .id) and dataclass models (without .id)
            if hasattr(predicted_disease, 'id'):
                base_data["disease_id"] = predicted_disease.id
            else:
                # For dataclass Disease objects, generate a pseudo-ID or set to None
                base_data["disease_id"] = None
        else:
            base_data["disease_id"] = None
    else:
        base_data["disease_id"] = disease.id if disease and hasattr(disease, 'id') else None

    db_diagnosis = Diagnosis(
        **base_data,
        ai_diagnosis=prediction_result.get("prediction", prediction_result.get("diagnosis", "Unknown")),
        ai_confidence=prediction_result.get("confidence", 0.0),
        ai_reasoning=prediction_result.get("reasoning", "Enhanced AI prediction with LLM analysis"),
        differential_diagnoses=prediction_result.get("differential_diagnoses", []),
        status=DiagnosisStatus.PENDING,
        created_by_id=current_user.id,
        # Store LLM analysis in notes or additional field
        notes=f"{base_notes or ''}\n\nLLM Analysis: {json.dumps(prediction_result.get('llm_analysis', {}), indent=2) if prediction_result.get('llm_enhanced') else 'LLM analysis not available'}"
    )
    
    db.add(db_diagnosis)
    db.commit()
    db.refresh(db_diagnosis)
    logger.info(f"[Diagnoses] Created enhanced diagnosis id={db_diagnosis.id} for patient_id={db_diagnosis.patient_id}")
    
    # Add LLM enhancement info to response
    diagnosis_dict = db_diagnosis.__dict__.copy()
    diagnosis_dict["llm_enhanced"] = prediction_result.get("llm_enhanced", False)
    diagnosis_dict["enhancement_status"] = prediction_result.get("enhancement_status", "Traditional ML only")
    if prediction_result.get("llm_analysis"):
        diagnosis_dict["llm_analysis"] = prediction_result["llm_analysis"]
    
    return diagnosis_dict

@router.post("/diagnoses/{diagnosis_id}/images/")
async def upload_diagnosis_image(
    diagnosis_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    logger.info(
        f"[Images] Upload requested: diagnosis_id={diagnosis_id}, filename={getattr(image, 'filename', 'unknown')}, by_user={getattr(current_user, 'id', 'unknown')}"
    )
    # Check if diagnosis exists and user has access
    db_diagnosis = db.query(Diagnosis).filter(Diagnosis.id == diagnosis_id).first()
    
    if db_diagnosis is None:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    
    # Check if user has access to this diagnosis
    db_patient = db.query(Patient).filter(Patient.id == db_diagnosis.patient_id).first()
    if db_patient.frontline_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to upload images for this diagnosis")
    
    # Save image to MongoDB
    image_id = await save_medical_image(
        image_file=image,
        diagnosis_id=diagnosis_id,
        patient_id=db_diagnosis.patient_id,
        uploaded_by=current_user.id
    )
    logger.info(f"[Images] Upload success: diagnosis_id={diagnosis_id}, image_id={image_id}")
    return {"status": "success", "image_id": image_id}

@router.post("/diagnosis/with-image", status_code=status.HTTP_201_CREATED)
async def create_diagnosis_with_image(
    image: UploadFile = File(...),
    patient_id: int = Form(...),
    symptoms: str = Form(...),
    disease_type: str = Form(...),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    """Create a diagnosis and upload an image in a single request."""
    # Validate patient access
    db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    if db_patient.frontline_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create diagnosis for this patient")

    # Parse symptoms string into JSON if needed
    try:
        parsed_symptoms = json.loads(symptoms)
    except Exception:
        # Fallback: convert comma-separated to dict of booleans
        symptom_list = [s.strip().lower().replace(' ', '_') for s in symptoms.split(',') if s.strip()]
        parsed_symptoms = {s: True for s in symptom_list}

    # Predict via ML
    prediction = predict_disease(disease_type, parsed_symptoms)

    # Create diagnosis
    db_diagnosis = Diagnosis(
        patient_id=patient_id,
        disease_type=disease_type,
        symptoms=json.dumps(parsed_symptoms),
        notes=notes,
        ai_diagnosis=prediction.get("diagnosis"),
        ai_confidence=prediction.get("confidence", 0.0),
        status=DiagnosisStatus.PENDING,
        created_by_id=current_user.id
    )
    db.add(db_diagnosis)
    db.commit()
    db.refresh(db_diagnosis)

    # Save image
    image_id = await save_medical_image(
        image_file=image,
        diagnosis_id=db_diagnosis.id,
        patient_id=patient_id,
        uploaded_by=current_user.id
    )

    # Response structure expected by tests
    return {
        "id": db_diagnosis.id,
        "patient_id": db_diagnosis.patient_id,
        "ai_prediction": db_diagnosis.ai_diagnosis,
        "confidence_score": db_diagnosis.ai_confidence,
        "image_url": f"/api/v1/images/{image_id}",
        "disease_type": disease_type,
        "status": db_diagnosis.status.value,
    }

@router.get("/diagnoses", response_model=List[DiagnosisSchema])
@router.get("/diagnoses/", response_model=List[DiagnosisSchema])
def read_diagnoses(
    skip: int = 0,
    limit: int = 100,
    status: Optional[DiagnosisStatus] = None,
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    logger.debug(f"[Diagnoses] List requested: skip={skip}, limit={limit}, status={status}, patient_id={patient_id}, by_user={getattr(current_user, 'id', 'unknown')}")
    # Query diagnoses
    query = db.query(Diagnosis)
    
    # Apply filters
    if status:
        query = query.filter(Diagnosis.status == status)
    
    if patient_id:
        query = query.filter(Diagnosis.patient_id == patient_id)
    
    # Filter by user role
    if current_user.role == "frontline_worker":
        # Frontline workers can only see diagnoses for their patients
        query = query.join(Patient).filter(Patient.frontline_worker_id == current_user.id)
    elif current_user.role == "specialist":
        # Specialists can see all diagnoses or those assigned to them
        pass  # No additional filter needed
    
    # Apply pagination
    diagnoses = query.offset(skip).limit(limit).all()
    logger.debug(f"[Diagnoses] List returned count={len(diagnoses)}")
    return diagnoses

@router.get("/diagnoses/{diagnosis_id:int}", response_model=DiagnosisSchema)
@router.get("/diagnosis/{diagnosis_id:int}", response_model=DiagnosisSchema)
def read_diagnosis(
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    logger.debug(f"[Diagnoses] Read requested: diagnosis_id={diagnosis_id}, by_user={getattr(current_user, 'id', 'unknown')}")
    # Get diagnosis by ID
    db_diagnosis = db.query(Diagnosis).filter(Diagnosis.id == diagnosis_id).first()
    
    if db_diagnosis is None:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    
    # Check if user has access to this diagnosis
    if current_user.role == "frontline_worker":
        db_patient = db.query(Patient).filter(Patient.id == db_diagnosis.patient_id).first()
        if db_patient.frontline_worker_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this diagnosis")
    
    return db_diagnosis

@router.put("/diagnoses/{diagnosis_id:int}/review", response_model=dict)
@router.put("/diagnosis/{diagnosis_id:int}/review", response_model=dict)
def review_diagnosis(
    diagnosis_id: int,
    diagnosis_update: DiagnosisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_specialist)
):
    logger.info(
        f"[Diagnoses] Review requested: diagnosis_id={diagnosis_id}, by_user={getattr(current_user, 'id', 'unknown')}"
    )
    # Get diagnosis by ID
    db_diagnosis = db.query(Diagnosis).filter(Diagnosis.id == diagnosis_id).first()
    
    if db_diagnosis is None:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    
    # Update diagnosis with specialist review
    update_data = diagnosis_update.dict(exclude_unset=True)
    
    # Ensure status is valid for specialist review
    if "status" in update_data and update_data["status"] not in [DiagnosisStatus.CONFIRMED, DiagnosisStatus.REJECTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status for specialist review. Must be 'confirmed' or 'rejected'."
        )
    
    # Update diagnosis fields
    for key, value in update_data.items():
        setattr(db_diagnosis, key, value)
    
    # Set the reviewer
    db_diagnosis.reviewed_by_id = current_user.id
    
    db.commit()
    db.refresh(db_diagnosis)
    logger.info(
        f"[Diagnoses] Review updated: diagnosis_id={db_diagnosis.id}, status={db_diagnosis.status}, reviewed_by={current_user.id}"
    )
    # Build response including echoed specialist notes and plan
    response = {
        "id": db_diagnosis.id,
        "patient_id": db_diagnosis.patient_id,
        "disease_type": db_diagnosis.disease_type.value if hasattr(db_diagnosis.disease_type, 'value') else db_diagnosis.disease_type,
        "symptoms": db_diagnosis.symptoms,
        "ai_confidence": db_diagnosis.ai_confidence,
        "ai_diagnosis": db_diagnosis.ai_diagnosis,
        "status": db_diagnosis.status.value if hasattr(db_diagnosis.status, 'value') else db_diagnosis.status,
        "notes": db_diagnosis.notes,
        "created_by_id": db_diagnosis.created_by_id,
        "reviewed_by_id": db_diagnosis.reviewed_by_id,
        "created_at": db_diagnosis.created_at.isoformat() if hasattr(db_diagnosis.created_at, 'isoformat') else db_diagnosis.created_at,
        "updated_at": db_diagnosis.updated_at.isoformat() if hasattr(db_diagnosis.updated_at, 'isoformat') else db_diagnosis.updated_at,
    }
    if diagnosis_update.specialist_notes is not None:
        response["specialist_notes"] = diagnosis_update.specialist_notes
    if diagnosis_update.treatment_plan is not None:
        response["treatment_plan"] = diagnosis_update.treatment_plan
    return response

@router.get("/patients/{patient_id:int}/diagnoses/", response_model=dict)
@router.get("/patients/{patient_id:int}/diagnoses", response_model=dict)
def read_patient_diagnoses(
    patient_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    logger.debug(f"[Diagnoses] Patient list requested: patient_id={patient_id}, page={page}, size={size}, by_user={getattr(current_user, 'id', 'unknown')}")
    # Check if patient exists and user has access
    db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if current_user.role == "frontline_worker" and db_patient.frontline_worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view diagnoses for this patient")
    
    # Paginated diagnoses for patient
    query = db.query(Diagnosis).filter(Diagnosis.patient_id == patient_id)
    total = query.count()
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()
    logger.debug(f"[Diagnoses] Patient list returned count={len(items)}")
    return {"page": page, "size": size, "total": total, "items": items}

# Additional endpoints to align with tests
@router.get("/diagnosis/pending", response_model=dict)
def read_pending_diagnoses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Return pending diagnoses for review."""
    query = db.query(Diagnosis).filter(Diagnosis.status == DiagnosisStatus.PENDING)
    if current_user.role == "frontline_worker":
        query = query.join(Patient).filter(Patient.frontline_worker_id == current_user.id)
    orm_items = query.all()
    # Serialize ORM objects using schema
    from app.api.schemas import Diagnosis as DiagnosisSchema
    items = [DiagnosisSchema.from_orm(d).dict() for d in orm_items]
    return {"items": items}

@router.get("/diagnosis/statistics", response_model=dict)
def diagnosis_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Return basic diagnosis statistics expected by tests."""
    base_query = db.query(Diagnosis)
    if current_user.role == "frontline_worker":
        base_query = base_query.join(Patient).filter(Patient.frontline_worker_id == current_user.id)

    total = base_query.count()
    pending = base_query.filter(Diagnosis.status == DiagnosisStatus.PENDING).count()
    confirmed = base_query.filter(Diagnosis.status == DiagnosisStatus.CONFIRMED).count()

    # Breakdown by disease type
    from app.db.models import DiseaseType
    breakdown = {}
    for dt in DiseaseType:
        breakdown[dt.value] = base_query.filter(Diagnosis.disease_type == dt).count()

    return {
        "total_diagnoses": total,
        "pending_count": pending,
        "confirmed_count": confirmed,
        "disease_breakdown": breakdown,
    }
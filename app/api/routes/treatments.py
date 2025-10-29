from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import Treatment, Diagnosis, Patient, User, FollowUp, Disease
from app.api.schemas import (
    TreatmentCreate, TreatmentUpdate, Treatment as TreatmentSchema,
    FollowUpCreate, FollowUpUpdate, FollowUp as FollowUpSchema
)
from app.core.auth import get_current_active_user, get_specialist
from app.data.diseases_registry import get_disease_by_code
from app.data.treatment_protocols_database import (
    get_all_protocols_for_disease,
    get_treatment_protocol,
    search_protocols_by_medication
)
from app.services.llm_service import LLMService
from app.core.config import settings
import json

router = APIRouter()

@router.post("/treatments/", response_model=TreatmentSchema, status_code=status.HTTP_201_CREATED)
def create_treatment(
    treatment: TreatmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_specialist)
):
    # Check if diagnosis exists
    db_diagnosis = db.query(Diagnosis).filter(Diagnosis.id == treatment.diagnosis_id).first()
    
    if db_diagnosis is None:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    
    # Create treatment
    treatment_data = treatment.dict()
    treatment_data['prescribed_by_id'] = current_user.id
    db_treatment = Treatment(**treatment_data)
    
    db.add(db_treatment)
    db.commit()
    db.refresh(db_treatment)
    return db_treatment

@router.get("/treatments/{treatment_id}", response_model=TreatmentSchema)
def read_treatment(
    treatment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get treatment by ID
    db_treatment = db.query(Treatment).filter(Treatment.id == treatment_id).first()
    
    if db_treatment is None:
        raise HTTPException(status_code=404, detail="Treatment not found")
    
    # Check if user has access to this treatment
    if current_user.role == "frontline_worker":
        # Get the patient associated with this treatment
        diagnosis = db.query(Diagnosis).filter(Diagnosis.id == db_treatment.diagnosis_id).first()
        patient = db.query(Patient).filter(Patient.id == diagnosis.patient_id).first()
        
        if patient.frontline_worker_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this treatment")
    
    return db_treatment

@router.put("/treatments/{treatment_id}", response_model=TreatmentSchema)
def update_treatment(
    treatment_id: int,
    treatment: TreatmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_specialist)
):
    # Get treatment by ID
    db_treatment = db.query(Treatment).filter(Treatment.id == treatment_id).first()
    
    if db_treatment is None:
        raise HTTPException(status_code=404, detail="Treatment not found")
    
    # Update treatment fields
    treatment_data = treatment.dict(exclude_unset=True)
    for key, value in treatment_data.items():
        setattr(db_treatment, key, value)
    
    db.commit()
    db.refresh(db_treatment)
    return db_treatment

@router.get("/diagnoses/{diagnosis_id}/treatments/", response_model=List[TreatmentSchema])
def read_diagnosis_treatments(
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if diagnosis exists
    db_diagnosis = db.query(Diagnosis).filter(Diagnosis.id == diagnosis_id).first()
    
    if db_diagnosis is None:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    
    # Check if user has access to this diagnosis
    if current_user.role == "frontline_worker":
        patient = db.query(Patient).filter(Patient.id == db_diagnosis.patient_id).first()
        if patient.frontline_worker_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view treatments for this diagnosis")
    
    # Get treatments for diagnosis
    treatments = db.query(Treatment).filter(Treatment.diagnosis_id == diagnosis_id).all()
    return treatments

# Follow-up endpoints
@router.post("/follow-ups/", response_model=FollowUpSchema, status_code=status.HTTP_201_CREATED)
def create_follow_up(
    follow_up: FollowUpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if treatment exists
    db_treatment = db.query(Treatment).filter(Treatment.id == follow_up.treatment_id).first()
    
    if db_treatment is None:
        raise HTTPException(status_code=404, detail="Treatment not found")
    
    # Check if user has access to create follow-ups
    if current_user.role == "frontline_worker":
        # Get the patient associated with this treatment
        diagnosis = db.query(Diagnosis).filter(Diagnosis.id == db_treatment.diagnosis_id).first()
        patient = db.query(Patient).filter(Patient.id == diagnosis.patient_id).first()
        
        if patient.frontline_worker_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to create follow-ups for this treatment")
    
    # Create follow-up
    db_follow_up = FollowUp(**follow_up.dict())
    
    db.add(db_follow_up)
    db.commit()
    db.refresh(db_follow_up)
    return db_follow_up

@router.put("/follow-ups/{follow_up_id}", response_model=FollowUpSchema)
def update_follow_up(
    follow_up_id: int,
    follow_up: FollowUpUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get follow-up by ID
    db_follow_up = db.query(FollowUp).filter(FollowUp.id == follow_up_id).first()
    
    if db_follow_up is None:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    
    # Check if user has access to update this follow-up
    if current_user.role == "frontline_worker":
        # Get the patient associated with this follow-up
        treatment = db.query(Treatment).filter(Treatment.id == db_follow_up.treatment_id).first()
        diagnosis = db.query(Diagnosis).filter(Diagnosis.id == treatment.diagnosis_id).first()
        patient = db.query(Patient).filter(Patient.id == diagnosis.patient_id).first()
        
        if patient.frontline_worker_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this follow-up")
    
    # Update follow-up fields
    follow_up_data = follow_up.dict(exclude_unset=True)
    for key, value in follow_up_data.items():
        setattr(db_follow_up, key, value)
    
    db.commit()
    db.refresh(db_follow_up)
    return db_follow_up

@router.get("/treatments/{treatment_id}/follow-ups/", response_model=List[FollowUpSchema])
def read_treatment_follow_ups(
    treatment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if treatment exists
    db_treatment = db.query(Treatment).filter(Treatment.id == treatment_id).first()
    
    if db_treatment is None:
        raise HTTPException(status_code=404, detail="Treatment not found")
    
    # Check if user has access to this treatment
    if current_user.role == "frontline_worker":
        # Get the patient associated with this treatment
        diagnosis = db.query(Diagnosis).filter(Diagnosis.id == db_treatment.diagnosis_id).first()
        patient = db.query(Patient).filter(Patient.id == diagnosis.patient_id).first()
        
        if patient.frontline_worker_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view follow-ups for this treatment")
    
    # Get follow-ups for treatment
    follow_ups = db.query(FollowUp).filter(FollowUp.treatment_id == treatment_id).all()
    return follow_ups

# Treatment Protocol endpoints
@router.get("/treatment-protocols/disease/{disease_code}")
def get_disease_treatment_protocols(
    disease_code: str,
    limit: Optional[int] = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get treatment protocols for a specific disease"""
    # Validate disease code
    disease = get_disease_by_code(disease_code)
    if not disease:
        raise HTTPException(status_code=404, detail=f"Disease not found: {disease_code}")
    
    protocols = get_treatment_protocols_for_disease(disease_code, limit=limit)
    return {
        "disease_code": disease_code,
        "disease_name": disease.name,
        "protocols": protocols
    }

@router.get("/treatment-protocols/{protocol_id}")
def get_treatment_protocol_details(
    protocol_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed information about a specific treatment protocol"""
    protocol = get_treatment_protocol_by_id(protocol_id)
    if not protocol:
        raise HTTPException(status_code=404, detail=f"Treatment protocol not found: {protocol_id}")
    
    return protocol

@router.get("/treatment-protocols/search")
def search_treatment_protocols_endpoint(
    query: str,
    disease_code: Optional[str] = None,
    severity: Optional[str] = None,
    limit: Optional[int] = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Search treatment protocols by query, disease, or severity"""
    protocols = search_treatment_protocols(
        query=query,
        disease_code=disease_code,
        severity=severity,
        limit=limit
    )
    
    return {
        "query": query,
        "disease_code": disease_code,
        "severity": severity,
        "protocols": protocols,
        "total_found": len(protocols)
    }

@router.get("/diagnoses/{diagnosis_id}/recommended-treatments")
def get_recommended_treatments_for_diagnosis(
    diagnosis_id: int,
    limit: Optional[int] = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get recommended treatment protocols for a specific diagnosis"""
    # Check if diagnosis exists
    db_diagnosis = db.query(Diagnosis).filter(Diagnosis.id == diagnosis_id).first()
    if db_diagnosis is None:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    
    # Check if user has access to this diagnosis
    if current_user.role == "frontline_worker":
        patient = db.query(Patient).filter(Patient.id == db_diagnosis.patient_id).first()
        if patient.frontline_worker_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view treatments for this diagnosis")
    
    # Get disease information
    disease = db.query(Disease).filter(Disease.id == db_diagnosis.disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Disease information not found for this diagnosis")
    
    # Get recommended treatment protocols
    protocols = get_treatment_protocols_for_disease(disease.code, limit=limit)
    
    return {
        "diagnosis_id": diagnosis_id,
        "disease_code": disease.code,
        "disease_name": disease.name,
        "ai_diagnosis": db_diagnosis.ai_diagnosis,
        "ai_confidence": db_diagnosis.ai_confidence,
        "recommended_protocols": protocols
    }

@router.post("/generate-comprehensive-treatment-guide")
async def generate_comprehensive_treatment_guide(
    diagnosis_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate a comprehensive treatment guide using Grok AI with personalized recommendations"""
    try:
        # Extract diagnosis information
        disease_type = diagnosis_data.get('disease_type', '')
        disease_code = diagnosis_data.get('disease_code', '')
        confidence = diagnosis_data.get('confidence', 0)
        patient_data = diagnosis_data.get('patient_data', {})
        symptoms = diagnosis_data.get('symptoms', [])
        severity = diagnosis_data.get('severity', 'moderate')
        
        # Get base treatment protocols
        base_protocols = []
        if disease_code:
            base_protocols = get_all_protocols_for_disease(disease_code)
        
        # Initialize LLM service
        llm_service = LLMService()
        
        # Create comprehensive prompt for Grok AI
        grok_prompt = f"""
        Generate a comprehensive, personalized treatment guide for the following case:
        
        DIAGNOSIS INFORMATION:
        - Disease: {disease_type}
        - Disease Code: {disease_code}
        - Confidence: {confidence}%
        - Severity: {severity}
        
        PATIENT INFORMATION:
        - Age: {patient_data.get('age', 'Not specified')}
        - Gender: {patient_data.get('gender', 'Not specified')}
        - Weight: {patient_data.get('weight', 'Not specified')}
        - Medical History: {patient_data.get('medical_history', 'None specified')}
        - Current Medications: {patient_data.get('current_medications', 'None specified')}
        - Allergies: {patient_data.get('allergies', 'None specified')}
        
        SYMPTOMS:
        {', '.join(symptoms) if symptoms else 'No specific symptoms listed'}
        
        Please provide a comprehensive treatment guide that includes:
        
        1. IMMEDIATE TREATMENT PLAN:
           - First-line medications with specific dosages
           - Route of administration
           - Duration of treatment
           - Monitoring requirements
        
        2. PERSONALIZED RECOMMENDATIONS:
           - Age-appropriate dosing adjustments
           - Weight-based calculations if applicable
           - Considerations for medical history
           - Drug interaction warnings
        
        3. LIFESTYLE MODIFICATIONS:
           - Diet recommendations
           - Activity restrictions or recommendations
           - Environmental modifications
           - Preventive measures
        
        4. MONITORING AND FOLLOW-UP:
           - Vital signs to monitor
           - Laboratory tests required
           - Follow-up schedule
           - Warning signs to watch for
        
        5. EMERGENCY INDICATORS:
           - Red flag symptoms
           - When to seek immediate medical attention
           - Emergency contact protocols
        
        6. PATIENT EDUCATION:
           - Disease explanation in simple terms
           - Treatment compliance importance
           - Expected outcomes and timeline
           - Side effects to watch for
        
        7. ALTERNATIVE TREATMENTS:
           - Second-line options if first-line fails
           - Complementary therapies
           - Supportive care measures
        
        Format the response as a structured JSON with clear sections for easy parsing and display.
        Focus on evidence-based medicine appropriate for African healthcare contexts.
        Consider resource limitations and accessibility of medications.
        """
        
        # Get AI response using LLM service
        grok_response = await llm_service.get_comprehensive_diagnosis(grok_prompt)
        
        # Parse Grok response
        try:
            grok_treatment_guide = json.loads(grok_response)
        except json.JSONDecodeError:
            # If JSON parsing fails, create structured response from text
            grok_treatment_guide = {
                "ai_generated_guide": grok_response,
                "format": "text"
            }
        
        # Combine with base protocols
        comprehensive_guide = {
            "diagnosis": {
                "disease_type": disease_type,
                "disease_code": disease_code,
                "confidence": confidence,
                "severity": severity,
                "ai_engine": "Grok AI"
            },
            "patient_profile": patient_data,
            "symptoms": symptoms,
            "base_protocols": [
                {
                    "protocol_name": protocol.protocol_name,
                    "treatment_type": protocol.treatment_type.value,
                    "medications": [
                        {
                            "name": med.name,
                            "dosage": med.dosage,
                            "frequency": med.frequency,
                            "duration": med.duration,
                            "route": med.route.value
                        } for med in protocol.medications
                    ],
                    "procedures": [
                        {
                            "name": proc.name,
                            "description": proc.description,
                            "indications": proc.indications
                        } for proc in protocol.procedures
                    ],
                    "lifestyle_recommendations": [
                        {
                            "category": rec.category,
                            "recommendation": rec.recommendation,
                            "importance": rec.importance,
                            "timeline": rec.timeline
                        } for rec in protocol.lifestyle_recommendations
                    ]
                } for protocol in base_protocols[:3]  # Top 3 protocols
            ],
            "grok_ai_recommendations": grok_treatment_guide,
            "generated_at": str(datetime.utcnow()),
            "generated_by": current_user.username,
            "metadata": {
                "ai_enhanced": True,
                "personalized": True,
                "evidence_based": True,
                "african_context": True
            }
        }
        
        return {
            "success": True,
            "treatment_guide": comprehensive_guide,
            "message": "Comprehensive treatment guide generated successfully"
        }
        
    except Exception as e:
        # Fallback to basic treatment guide if Grok AI fails
        basic_protocols = []
        if disease_code:
            basic_protocols = get_all_protocols_for_disease(disease_code)
        
        fallback_guide = {
            "diagnosis": {
                "disease_type": disease_type,
                "disease_code": disease_code,
                "confidence": confidence,
                "severity": severity,
                "ai_engine": "Standard Protocol"
            },
            "patient_profile": patient_data,
            "symptoms": symptoms,
            "base_protocols": [
                {
                    "protocol_name": protocol.protocol_name,
                    "treatment_type": protocol.treatment_type.value,
                    "medications": [
                        {
                            "name": med.name,
                            "dosage": med.dosage,
                            "frequency": med.frequency,
                            "duration": med.duration,
                            "route": med.route.value
                        } for med in protocol.medications
                    ]
                } for protocol in basic_protocols[:2]
            ],
            "generated_at": str(datetime.utcnow()),
            "generated_by": current_user.username,
            "error": f"Grok AI unavailable: {str(e)}",
            "metadata": {
                "ai_enhanced": False,
                "personalized": False,
                "evidence_based": True,
                "fallback_mode": True
            }
        }
        
        return {
            "success": True,
            "treatment_guide": fallback_guide,
            "message": "Basic treatment guide generated (Grok AI unavailable)",
            "warning": "Enhanced AI features temporarily unavailable"
        }
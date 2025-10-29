import os
import json
from typing import Dict, Any, List, Optional
import asyncio
from app.services.llm_service import llm_service
from app.core.config import settings
from app.db.models import Disease, DiseaseCategory, DiseaseSeverity
from app.data.diseases_registry import get_disease_registry, get_disease_by_code, search_diseases_by_symptoms
from app.data.extended_diseases_database import get_complete_disease_database
from app.data.comprehensive_diseases_500 import get_disease_by_code as get_disease_by_code_comprehensive

# Import DiseaseType enum from medical_prompts
from app.services.medical_prompts import DiseaseType

async def predict_disease_grok_only(
    symptoms: List[str],
    patient_data: Optional[Dict[str, Any]] = None,
    medical_images: Optional[List[str]] = None,
    disease_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Predict disease using only Grok API - no ML models
    """
    try:
        # Prepare patient history for Grok
        patient_history = f"Patient presents with the following symptoms: {', '.join(symptoms)}"
        
        if patient_data:
            patient_history += f"\n\nPatient Information:"
            for key, value in patient_data.items():
                if value is not None:
                    patient_history += f"\n- {key.replace('_', ' ').title()}: {value}"
        
        if medical_images:
            patient_history += f"\n\nMedical images provided: {len(medical_images)} image(s)"
        
        # Use Grok API for diagnosis
        result = await llm_service.analyze_medical_case(patient_history)
        
        if result and not result.get('error'):
            return {
                "disease_type": result.get('diagnosis', 'Unknown'),
                "confidence": result.get('confidence', 0.0) / 100.0 if result.get('confidence') else 0.7,
                "diagnosis": result.get('diagnosis', 'Unknown'),
                "symptoms_analyzed": symptoms,
                "explanation": result.get('reasoning', 'Diagnosis provided by Grok AI'),
                "treatment_recommendations": result.get('treatment_recommendations', {}),
                "specialist_referral": result.get('specialist_referral', False),
                "critical_indicators": result.get('critical_indicators', False),
                "ai_provider": "grok",
                "differential_diagnoses": result.get('differential_diagnoses', [])
            }
        else:
            return {
                "error": result.get('error', 'Grok API diagnosis failed'),
                "disease_type": disease_type or "unknown",
                "confidence": 0.0,
                "diagnosis": "Unable to diagnose - Grok API error"
            }
            
    except Exception as e:
        return {
            "error": f"Grok prediction failed: {str(e)}",
            "disease_type": disease_type or "unknown", 
            "confidence": 0.0,
            "diagnosis": "Unable to diagnose due to error"
        }

def predict_disease(disease_type,
                   symptoms: List[str],
                   patient_data: Optional[Dict[str, Any]] = None,
                   medical_images: Optional[List[str]] = None) -> Dict[str, Any]:
    """Main prediction function using only Grok API - synchronous wrapper."""
    try:
        # Type validation
        from sqlalchemy.orm import Session
        if isinstance(disease_type, Session):
            raise ValueError(f"Invalid disease_type: received Session object instead of string/enum.")
        
        if not isinstance(disease_type, (str, type(None))) and not hasattr(disease_type, 'value'):
            raise ValueError(f"Invalid disease_type: expected string or enum, got {type(disease_type)}")
        
        # Convert disease_type to string
        if hasattr(disease_type, 'value'):
            disease_str = disease_type.value
        else:
            disease_str = str(disease_type) if disease_type else None
        
        # Run async Grok prediction
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                predict_disease_grok_only(symptoms, patient_data, medical_images, disease_str)
            )
        finally:
            loop.close()
        
        return result
        
    except Exception as e:
        return {
            "error": f"Prediction failed: {str(e)}",
            "disease_type": str(disease_type) if disease_type else "unknown",
            "confidence": 0.0,
            "diagnosis": "Unable to diagnose due to error"
        }

def predict_disease_sync_wrapper(disease_type,
                                symptoms: List[str],
                                patient_data: Optional[Dict[str, Any]] = None,
                                medical_images: Optional[List[str]] = None) -> Dict[str, Any]:
    """Synchronous wrapper for predict_disease - uses only Grok API."""
    return predict_disease(disease_type, symptoms, patient_data, medical_images)

def predict_disease_comprehensive(symptoms: List[str], 
                                patient_data: Optional[Dict[str, Any]] = None,
                                medical_images: Optional[List[str]] = None,
                                max_diseases: int = 10) -> Dict[str, Any]:
    """
    Enhanced disease prediction using only Grok API
    Returns comprehensive analysis with differential diagnosis
    """
    try:
        # Run async Grok prediction
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                predict_disease_grok_only(symptoms, patient_data, medical_images)
            )
        finally:
            loop.close()
        
        # Ensure we have differential diagnoses
        if not result.get('differential_diagnoses'):
            result['differential_diagnoses'] = []
        
        return result
        
    except Exception as e:
        return {
            "error": f"Comprehensive prediction failed: {str(e)}",
            "confidence": 0.0,
            "diagnosis": "Unable to diagnose due to error",
            "differential_diagnoses": []
        }

# Legacy functions for backward compatibility
def load_model(disease_type):
    """Legacy function - now returns None since we use only Grok API"""
    return None

def create_dummy_model(disease_type):
    """Legacy function - now returns None since we use only Grok API"""
    return None

def preprocess_symptoms(symptoms, disease_code):
    """Legacy function - no longer needed with Grok API"""
    return None

def preprocess_symptoms_legacy(symptoms, disease_type):
    """Legacy function - no longer needed with Grok API"""
    return None
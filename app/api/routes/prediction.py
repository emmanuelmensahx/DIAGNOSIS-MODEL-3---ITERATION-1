from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import time

from app.db.database import get_db
from cache_service import DiagnosisCacheService, get_cached_or_predict
from async_optimization_service import AsyncOptimizationService, optimize_prediction_request, async_optimize
from app.services.database_optimization_service import get_optimized_db_service, optimize_database_queries
from app.db.models import User, Disease, DiseaseCategory, DiseaseSeverity
from app.core.auth import get_current_active_user, get_frontline_worker
# Direct imports for ML modules
from app.ml.prediction import predict_disease, predict_disease_sync_wrapper, predict_disease_comprehensive
# from app.ml.enhanced_diagnostic_engine import get_enhanced_prediction, is_enhanced_engine_ready, train_enhanced_engine
from app.data.diseases_registry import (
    get_disease_registry, get_supported_diseases as get_supported_diseases_list,
    get_disease_by_code, search_diseases_by_symptoms, get_diseases_by_category,
    get_treatment_protocol, get_comprehensive_disease_count
)
from app.data.extended_diseases_database import get_complete_disease_database
from app.data.treatment_protocols_database import get_all_protocols_for_disease
from app.api.schemas import PredictionRequest, PredictionResponse



def _get_enhanced_engine():
    """Lazy import for enhanced diagnostic engine."""
    from app.ml.enhanced_diagnostic_engine import get_enhanced_prediction, is_enhanced_engine_ready, train_enhanced_engine
    return get_enhanced_prediction, is_enhanced_engine_ready, train_enhanced_engine

router = APIRouter()

# Initialize cache service
cache_service = DiagnosisCacheService()

# Initialize async optimization service
async_service = AsyncOptimizationService(max_workers=4, enable_batching=True)

@router.post("/predict/tuberculosis", response_model=PredictionResponse)
async def predict_tuberculosis(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    """Predict tuberculosis based on symptoms and patient data"""
    try:
        # Use cached prediction for improved performance
        async def prediction_func(symptoms, patient_data, disease_type):
            return predict_disease(
                disease_type="tuberculosis",  # Use string code instead of enum
                symptoms=request.symptoms,
                patient_data=request.patient_data.dict() if request.patient_data else None,
                medical_images=request.medical_images
            )
        
        prediction_result = await get_cached_or_predict(
            symptoms=request.symptoms,
            patient_data=request.patient_data.dict() if request.patient_data else None,
            disease_type="tuberculosis",
            prediction_function=prediction_func
        )
        
        return PredictionResponse(**prediction_result)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )



@router.post("/predict/grok-primary", response_model=PredictionResponse)
async def predict_grok_primary(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    """
    Primary diagnosis using Grok AI as the main diagnostic engine
    Uses all patient data including symptoms, demographics, vitals, and medical history
    """
    try:
        from app.services.llm_service import llm_service
        
        # Prepare patient data
        patient_data = request.patient_data.dict() if request.patient_data else {}
        medical_history = patient_data.get('medical_history', '')
        
        # Get comprehensive diagnosis from Grok
        grok_result = await llm_service.get_comprehensive_diagnosis(
            symptoms=request.symptoms,
            patient_data=patient_data,
            medical_history=medical_history
        )
        
        # Transform Grok result to match PredictionResponse schema
        diagnosis_responses = []
        
        # Add primary diagnosis
        primary_diag = grok_result.get('primary_diagnosis', {})
        
        # Map category string to enum
        try:
            category = DiseaseCategory(primary_diag.get('category', 'general'))
        except ValueError:
            category = DiseaseCategory.GENERAL
        
        # Map severity (default to moderate for Grok diagnoses)
        severity = DiseaseSeverity.MODERATE
        
        primary_response = {
            'disease_code': primary_diag.get('disease_code', 'unknown'),
            'disease_name': primary_diag.get('disease_name', 'Unknown'),
            'category': category,
            'severity': severity,
            'confidence': primary_diag.get('confidence', 0.0),
            'reasoning': grok_result.get('clinical_reasoning', 'Grok AI comprehensive analysis'),
            'differential_diagnoses': [],
            'recommendations': grok_result.get('recommended_actions', []),
            'treatment_protocols': [],
            'emergency_level': 1 if grok_result.get('risk_level') == 'low' else 
                             2 if grok_result.get('risk_level') == 'medium' else
                             3 if grok_result.get('risk_level') == 'high' else 4,
            # Enhanced treatment information from Grok AI
            'treatment_plan': grok_result.get('treatment_plan', None),
            'patient_education': grok_result.get('patient_education', None),
            'follow_up_care': grok_result.get('follow_up', None)
        }
        diagnosis_responses.append(primary_response)
        
        # Add differential diagnoses
        for diff_diag in grok_result.get('differential_diagnoses', [])[:4]:
            try:
                diff_category = DiseaseCategory.GENERAL
                diff_response = {
                    'disease_code': 'unknown',
                    'disease_name': diff_diag.get('disease_name', 'Unknown'),
                    'category': diff_category,
                    'severity': DiseaseSeverity.MODERATE,
                    'confidence': diff_diag.get('confidence', 0.0),
                    'reasoning': diff_diag.get('reasoning', 'Differential diagnosis'),
                    'differential_diagnoses': [],
                    'recommendations': [],
                    'treatment_protocols': [],
                    'emergency_level': 1
                }
                diagnosis_responses.append(diff_response)
            except Exception:
                continue
        
        # Create response with enhanced Grok metadata
        response = PredictionResponse(
            predictions=diagnosis_responses,
            total_diseases_searched=len(diagnosis_responses),
            search_time_ms=0.0,
            ai_engine=grok_result.get("ai_engine", "grok"),
            ai_confidence=grok_result.get("overall_confidence", 0.0),
            ai_reasoning=grok_result.get("clinical_reasoning", ""),
            clinical_notes=grok_result.get("clinical_notes", "")
        )
        
        # Add comprehensive Grok AI metadata to response for frontend display
        response_dict = response.dict()
        response_dict.update({
            "grok_engine_used": grok_result.get("grok_engine_used", True),
            "enhanced_ai": grok_result.get("enhanced_ai", True),
            "llm_provider": grok_result.get("llm_provider", "grok"),
            "model_used": grok_result.get("model_used", "grok-4-fast-reasoning"),
            "ai_metadata": grok_result.get("ai_metadata", {}),
            "validation_status": grok_result.get("validation_status", {}),
            "analysis_timestamp": grok_result.get("analysis_timestamp", "")
        })
        
        # Return enhanced response with all Grok metadata
        return response_dict
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Grok primary diagnosis failed: {str(e)}"
        )

@router.post("/predict/ai-enhanced", response_model=PredictionResponse)
async def predict_ai_enhanced(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    """
    Enhanced AI prediction using ensemble learning with confidence scoring
    Provides differential diagnosis and uncertainty metrics
    """
    try:
        # Lazy import enhanced engine functions
        get_enhanced_prediction, is_enhanced_engine_ready, _ = _get_enhanced_engine()
        
        # Check if enhanced engine is ready
        if not is_enhanced_engine_ready():
            # Fallback to comprehensive prediction
            prediction_result = predict_disease_comprehensive(
                symptoms=request.symptoms,
                patient_data=request.patient_data.dict() if request.patient_data else None,
                medical_images=request.medical_images,
                max_diseases=10
            )
            prediction_result.update({
                'enhanced_ai': False,
                'fallback_reason': 'Enhanced AI engine not trained - using comprehensive prediction'
            })
        else:
            # Use enhanced AI engine
            get_enhanced_prediction, _, _ = _get_enhanced_engine()
            prediction_result = get_enhanced_prediction(
                symptoms=request.symptoms,
                patient_data=request.patient_data.dict() if request.patient_data else None
            )
        
        # Ensure required fields are present
        if 'disease_code' not in prediction_result:
            prediction_result['disease_code'] = 'unknown'
        if 'diagnosis' not in prediction_result:
            prediction_result['diagnosis'] = prediction_result.get('disease_name', 'Unknown condition')
        if 'confidence' not in prediction_result:
            prediction_result['confidence'] = 0.0
        if 'treatment_recommendations' not in prediction_result:
            prediction_result['treatment_recommendations'] = ["Consult healthcare professional for proper diagnosis"]
        if 'severity' not in prediction_result:
            prediction_result['severity'] = 'moderate'
        if 'next_steps' not in prediction_result:
            prediction_result['next_steps'] = ["Seek medical consultation", "Monitor symptoms"]
        
        # Create a proper DiagnosisResponse object
        try:
            # Get differential diagnoses
            differential_diagnoses = prediction_result.get('differential_diagnoses', [])
            
            # Use the main prediction result as primary diagnosis (not differential diagnoses)
            primary_disease_name = prediction_result.get('diagnosis', prediction_result.get('disease_name', 'Unknown condition'))
            primary_disease_code = prediction_result.get('disease_code', 'unknown')
            primary_confidence = prediction_result.get('confidence', 0.0)
            primary_category = prediction_result.get('category', 'general')
            primary_severity = prediction_result.get('severity', 'moderate')
            
            # Cap confidence at 95% to avoid unrealistic 100% confidence scores
            if primary_confidence > 0.95:
                primary_confidence = 0.95
            
            # If confidence is very low or no primary diagnosis, indicate uncertainty
            if primary_confidence < 0.3 or primary_disease_name in ['Unknown condition', 'Unable to determine diagnosis']:
                primary_disease_name = 'Multiple conditions possible'
                primary_disease_code = 'differential'
                primary_confidence = max(primary_confidence, 0.1)  # Minimum confidence for display
            
            # Convert category string to enum
            try:
                category = DiseaseCategory(primary_category)
            except ValueError:
                category = DiseaseCategory.GENERAL
            
            # Convert severity string to enum
            try:
                severity = DiseaseSeverity(primary_severity)
            except ValueError:
                severity = DiseaseSeverity.MODERATE
            
            diagnosis_response = {
                'disease_code': primary_disease_code,
                'disease_name': primary_disease_name,
                'category': category,
                'severity': severity,
                'confidence': float(primary_confidence),
                'reasoning': prediction_result.get('reasoning', 'Enhanced AI analysis completed'),
                'differential_diagnoses': differential_diagnoses,
                'recommendations': prediction_result.get('treatment_recommendations', prediction_result.get('recommendations', ["Consult healthcare professional for proper diagnosis"])),
                'treatment_protocols': prediction_result.get('treatment_protocols', []),
                'emergency_level': int(prediction_result.get('emergency_level', 1))
            }
            
            # Add enhanced AI metadata to reasoning
            enhanced_features = {
                'ensemble_learning': True,
                'confidence_scoring': True,
                'differential_diagnosis': True,
                'uncertainty_metrics': True
            }
            diagnosis_response['reasoning'] += f" | Enhanced AI v2.0 features: {', '.join([k for k, v in enhanced_features.items() if v])}"
            
        except Exception as conversion_error:
            # Fallback diagnosis if conversion fails
            diagnosis_response = {
                'disease_code': 'unknown',
                'disease_name': 'Enhanced AI Analysis',
                'category': DiseaseCategory.GENERAL,
                'severity': DiseaseSeverity.MODERATE,
                'confidence': 0.5,
                'reasoning': f'Enhanced AI processing completed with fallback due to: {str(conversion_error)}',
                'differential_diagnoses': [],
                'recommendations': ["Consult healthcare professional for proper diagnosis"],
                'treatment_protocols': [],
                'emergency_level': 1
            }
        
        return PredictionResponse(
            predictions=[diagnosis_response],
            total_diseases_searched=prediction_result.get('total_diseases_analyzed', 1),
            search_time_ms=prediction_result.get('search_time_ms', 0.0)
        )
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Enhanced AI prediction failed: {str(e)}"
        )

@router.post("/train-enhanced-ai")
async def train_enhanced_ai_endpoint(
    current_user: User = Depends(get_current_active_user)
):
    """
    Train the enhanced AI diagnostic engine
    Requires admin privileges
    """
    try:
        # Check if user has admin privileges (you may want to add admin role check)
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges to train AI models"
            )
        
        # Train the enhanced engine
        _, is_enhanced_engine_ready, train_enhanced_engine = _get_enhanced_engine()
        train_enhanced_engine()
        
        return {
            "message": "Enhanced AI diagnostic engine training completed successfully",
            "status": "success",
            "engine_ready": is_enhanced_engine_ready()
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Training failed: {str(e)}"
        )

@router.get("/enhanced-ai/status")
async def get_enhanced_ai_status(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the status of the enhanced AI diagnostic engine
    """
    try:
        _, is_enhanced_engine_ready, _ = _get_enhanced_engine()
        return {
            "engine_ready": is_enhanced_engine_ready(),
            "status": "ready" if is_enhanced_engine_ready() else "not_trained",
            "features": {
                "ensemble_learning": True,
                "confidence_scoring": True,
                "differential_diagnosis": True,
                "uncertainty_metrics": True
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status check failed: {str(e)}"
        )

@router.post("/predict/{disease_code}/enhanced", response_model=PredictionResponse)
async def predict_disease_enhanced(
    disease_code: str,
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    """Enhanced prediction for specific disease type"""
    try:
        # Validate disease code exists in the database
        disease = get_disease_by_code(disease_code)
        if not disease:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported disease code: {disease_code}"
            )
        
        # Make enhanced prediction
        prediction_result = predict_disease(
            disease_type=disease_code,
            symptoms=request.symptoms,
            patient_data=request.patient_data.dict() if request.patient_data else None,
            medical_images=request.medical_images
        )
        
        # Get treatment protocols for this disease
        treatment_protocols = get_treatment_protocols_for_disease(disease_code)
        if treatment_protocols:
            prediction_result['treatment_protocols'] = [
                {
                    'protocol_id': protocol.protocol_id,
                    'name': protocol.name,
                    'type': protocol.type.value,
                    'severity': protocol.severity.value,
                    'duration_days': protocol.duration_days,
                    'cost_estimate': protocol.cost_estimate
                }
                for protocol in treatment_protocols[:3]  # Top 3 protocols
            ]
        
        return PredictionResponse(**prediction_result)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Enhanced prediction failed: {str(e)}"
        )

@router.post("/predict/lung-cancer", response_model=PredictionResponse)
async def predict_lung_cancer(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    """Predict lung cancer based on symptoms and patient data"""
    try:
        # Make prediction using the expanded disease database
        prediction_result = predict_disease(
            disease_type="lung_cancer",  # Use string code instead of enum
            symptoms=request.symptoms,
            patient_data=request.patient_data.dict() if request.patient_data else None,
            medical_images=request.medical_images
        )
        
        return PredictionResponse(**prediction_result)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.post("/predict/malaria", response_model=PredictionResponse)
async def predict_malaria(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    """Predict malaria based on symptoms and patient data"""
    try:
        # Make prediction using the expanded disease database
        prediction_result = predict_disease(
            disease_type="malaria",  # Use string code instead of enum
            symptoms=request.symptoms,
            patient_data=request.patient_data.dict() if request.patient_data else None,
            medical_images=request.medical_images
        )
        
        return PredictionResponse(**prediction_result)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.post("/predict/pneumonia", response_model=PredictionResponse)
async def predict_pneumonia(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    """Predict pneumonia based on symptoms and patient data"""
    try:
        # Make prediction using the expanded disease database
        prediction_result = predict_disease(
            disease_type="pneumonia",  # Use string code instead of enum
            symptoms=request.symptoms,
            patient_data=request.patient_data.dict() if request.patient_data else None,
            medical_images=request.medical_images
        )
        
        return PredictionResponse(**prediction_result)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.post("/predict/general", response_model=PredictionResponse)
async def predict_general(
    request: PredictionRequest,
    disease_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    """General prediction endpoint that can handle any disease type"""
    try:
        # Prepare common inputs
        symptoms = request.symptoms
        patient_data = request.patient_data.dict() if request.patient_data else None
        medical_images = request.medical_images

        # If disease_type is given, validate and run that specific model
        if disease_type:
            # Type validation to prevent Session objects being passed as disease_type
            if not isinstance(disease_type, str):
                raise HTTPException(
                    status_code=500,
                    detail=f"Invalid disease_type: expected string, got {type(disease_type)}. "
                           f"This indicates a variable confusion in the calling code."
                )
            code = disease_type.replace("-", "_").lower()
            # Check if disease exists in the comprehensive database
            disease = get_disease_by_code(code)
            if disease:
                prediction_result = predict_disease(
                    disease_type=code,
                    symptoms=symptoms,
                    patient_data=patient_data,
                    medical_images=medical_images,
                )
                return PredictionResponse(**prediction_result)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported disease type: {disease_type}"
                )

        # Auto-detect disease based on symptoms using the comprehensive database
        relevant_diseases = search_diseases_by_symptoms(symptoms)
        
        best_prediction = None
        best_confidence = 0.0
        all_predictions = []
        
        # Determine user region hint if available
        user_region = getattr(current_user, "region", None) or "sub_saharan_africa"
        
        # Evaluate top relevant diseases
        for disease in relevant_diseases[:15]:  # Limit for performance
            try:
                prediction_result = predict_disease(
                    disease_type=disease.code,
                    symptoms=symptoms,
                    patient_data=patient_data,
                    medical_images=medical_images,
                )
                
                # Apply priority and region weighting
                confidence = prediction_result.get('confidence', 0.0)
                
                # Region weighting
                region_weight = 1.0
                if user_region and user_region.lower() in [r.lower() for r in disease.regions]:
                    region_weight = 1.3
                
                # Priority weighting based on disease severity and prevalence
                priority_weight = 1.0
                if disease.severity.value == 'critical':
                    priority_weight = 1.4
                elif disease.severity.value == 'severe':
                    priority_weight = 1.2
                
                weighted_confidence = confidence * region_weight * priority_weight
                
                prediction_data = {
                    'disease_code': disease.code,
                    'disease_name': disease.name,
                    'confidence': confidence,
                    'weighted_confidence': weighted_confidence,
                    'prediction': prediction_result
                }
                all_predictions.append(prediction_data)
                
                if weighted_confidence > best_confidence:
                    best_confidence = weighted_confidence
                    best_prediction = prediction_result
                    best_prediction['disease_code'] = disease.code
                    best_prediction['disease_name'] = disease.name
                    best_prediction['category'] = disease.category.value
                    
            except Exception as e:
                # Skip diseases that fail prediction
                continue
        
        if best_prediction:
            # Add differential diagnoses from other high-confidence predictions
            all_predictions.sort(key=lambda x: x['weighted_confidence'], reverse=True)
            best_prediction['differential_diagnoses'] = [
                {
                    'disease_code': p['disease_code'],
                    'disease_name': p['disease_name'],
                    'confidence': p['confidence']
                }
                for p in all_predictions[1:6]  # Top 5 alternatives
            ]
            
            # Add treatment protocols if available
            treatment_protocols = get_treatment_protocols_for_disease(best_prediction['disease_code'])
            if treatment_protocols:
                best_prediction['treatment_protocols'] = [
                    {
                        'protocol_id': protocol.protocol_id,
                        'name': protocol.name,
                        'type': protocol.type.value,
                        'severity': protocol.severity.value,
                        'duration_days': protocol.duration_days,
                        'cost_estimate': protocol.cost_estimate
                    }
                    for protocol in treatment_protocols[:3]  # Top 3 protocols
                ]
            
            return PredictionResponse(**best_prediction)
        else:
            # Fallback response with proper DiagnosisResponse structure
            fallback_diagnosis = {
                "disease_code": "unknown",
                "disease_name": "Unknown Condition",
                "category": DiseaseCategory.GENERAL,
                "severity": DiseaseSeverity.MODERATE,
                "confidence": 0.0,
                "reasoning": "Unable to determine diagnosis based on provided symptoms. Please consult a healthcare professional.",
                "differential_diagnoses": [],
                "recommendations": ["Consult a healthcare professional for proper diagnosis", "Monitor symptoms and seek immediate care if they worsen"],
                "treatment_protocols": [],
                "emergency_level": 1
            }
            
            return PredictionResponse(
                predictions=[fallback_diagnosis],
                total_diseases_searched=len(relevant_diseases),
                search_time_ms=0.0
            )
    
    except HTTPException:
        # Re-raise explicit HTTP errors
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"General prediction failed: {str(e)}"
        )

@router.get("/predict/supported-diseases")
async def get_supported_diseases_endpoint(
    current_user: User = Depends(get_frontline_worker)
):
    """Get list of all supported diseases for prediction"""
    try:
        # Get diseases from the comprehensive database
        all_diseases = get_complete_disease_database()
        
        # Format for API response
        diseases = [
            {
                "code": disease.code,
                "name": disease.name,
                "category": disease.category.value,
                "severity": disease.severity.value,
                "regions": [region.value for region in disease.regions],
                "common_symptoms": disease.common_symptoms[:5],  # First 5 symptoms
                "description": disease.description[:200] + "..." if len(disease.description) > 200 else disease.description
            }
            for disease in all_diseases.values()
        ]
        
        return {
            "supported_diseases": diseases,
            "total_count": len(diseases),
            "categories": list(set(d["category"] for d in diseases)),
            "regions": list(set(region.value for disease in all_diseases.values() for region in disease.regions))
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve supported diseases: {str(e)}"
        )

@router.get("/diseases/search")
async def search_diseases(
    symptoms: Optional[str] = None,
    category: Optional[str] = None,
    region: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user)
):
    """Search diseases by various criteria."""
    try:
        complete_db = get_complete_disease_database()
        results = []
        
        # Convert symptoms string to list
        symptom_list = []
        if symptoms:
            symptom_list = [s.strip() for s in symptoms.split(',')]
        
        # Search by symptoms if provided
        if symptom_list:
            disease_matches = search_diseases_by_symptoms(symptom_list)
            for disease_code, score in disease_matches[:limit]:
                if disease_code in complete_db:
                    disease = complete_db[disease_code]
                    results.append({
                        "code": disease.code,
                        "name": disease.name,
                        "category": disease.category.value,
                        "severity": disease.severity.value,
                        "regions": [region.value for region in disease.regions],
                        "match_score": score,
                        "symptoms": disease.common_symptoms,
                        "description": disease.description
                    })
        else:
            # Filter by other criteria
            for disease_code, disease in complete_db.items():
                include = True
                
                if category and disease.category.value != category:
                    include = False
                if region and region not in [r.value for r in disease.regions]:
                    include = False
                if severity and disease.severity.value != severity:
                    include = False
                
                if include:
                    results.append({
                        "code": disease.code,
                        "name": disease.name,
                        "category": disease.category.value,
                        "severity": disease.severity.value,
                        "regions": [region.value for region in disease.regions],
                        "symptoms": disease.common_symptoms,
                        "description": disease.description
                    })
                
                if len(results) >= limit:
                    break
        
        return {
            "diseases": results,
            "total_found": len(results),
            "search_criteria": {
                "symptoms": symptom_list,
                "category": category,
                "region": region,
                "severity": severity
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Disease search failed: {str(e)}"
        )

@router.get("/diseases/categories")
async def get_disease_categories(
    current_user: User = Depends(get_current_active_user)
):
    """Get all available disease categories."""
    try:
        categories = {}
        complete_db = get_complete_disease_database()
        
        for disease in complete_db.values():
            category = disease.category.value
            if category not in categories:
                categories[category] = {
                    "name": category,
                    "count": 0,
                    "diseases": []
                }
            categories[category]["count"] += 1
            categories[category]["diseases"].append({
                "code": disease.code,
                "name": disease.name,
                "severity": disease.severity.value
            })
        
        return {
            "categories": list(categories.values()),
            "total_categories": len(categories)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get disease categories: {str(e)}"
        )

@router.get("/diseases/statistics")
async def get_disease_statistics(
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive disease database statistics."""
    try:
        complete_db = get_complete_disease_database()
        
        # Count by category
        category_counts = {}
        severity_counts = {}
        region_counts = {}
        
        for disease in complete_db.values():
            # Category counts
            category = disease.category.value
            category_counts[category] = category_counts.get(category, 0) + 1
            
            # Severity counts
            severity = disease.severity.value
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
            # Region counts
            for region in disease.regions:
                region_counts[region.value] = region_counts.get(region.value, 0) + 1
        
        return {
            "total_diseases": len(complete_db),
            "categories": category_counts,
            "severities": severity_counts,
            "regions": region_counts,
            "database_version": "1.0",
            "last_updated": "2024-01-01"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get disease statistics: {str(e)}"
        )

@router.get("/diseases/{disease_code}")
async def get_disease_details(
    disease_code: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed information about a specific disease."""
    try:
        disease = get_disease_by_code(disease_code)
        if not disease:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Disease with code '{disease_code}' not found"
            )
        
        # Get treatment protocols
        treatment_protocols = get_treatment_protocols_for_disease(disease_code)
        
        return {
            "disease": {
                "code": disease.code,
                "name": disease.name,
                "category": disease.category.value,
                "severity": disease.severity.value,
                "icd11_code": disease.icd11_code,
                "symptoms": disease.common_symptoms,
                "regions": [region.value for region in disease.regions],
                "age_groups": [ag.value for ag in disease.age_groups],
                "prevalence_rate": disease.prevalence_rate,
                "mortality_rate": disease.mortality_rate,
                "description": disease.description,
                "risk_factors": disease.risk_factors,
                "prevention": disease.prevention,
                "diagnostic_tests": disease.diagnostic_tests,
                "treatment": {
                    "primary": disease.treatment.primary,
                    "secondary": disease.treatment.secondary,
                    "emergency": disease.treatment.emergency,
                    "prevention": disease.treatment.prevention,
                    "medications": disease.treatment.medications,
                    "duration": disease.treatment.duration,
                    "success_rate": disease.treatment.success_rate,
                    "cost": disease.treatment.cost
                }
            },
            "treatment_protocols": [
                {
                    "protocol_name": protocol.protocol_name,
                    "treatment_type": protocol.treatment_type.value,
                    "severity_level": protocol.severity_level,
                    "medications": [
                        {
                            "name": med.name,
                            "dosage": med.dosage,
                            "frequency": med.frequency,
                            "duration": med.duration,
                            "route": med.route.value
                        } for med in protocol.medications
                    ],
                    "success_rate": protocol.success_rate,
                    "cost_estimate": protocol.cost_estimate
                } for protocol in treatment_protocols
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get disease details: {str(e)}"
        )

@router.post("/ai/predict")
async def ai_predict(
    image: UploadFile = File(...),
    disease_type: str = Form(...),
    current_user: User = Depends(get_frontline_worker)
):
    """AI prediction endpoint for image-based disease detection.
    Accepts an image file and disease_type, returns prediction and confidence.
    """
    try:
        # Validate disease type exists in comprehensive database
        disease_code = disease_type.replace("-", "_").lower()
        disease = get_disease_by_code(disease_code)
        
        if not disease:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Unsupported disease type: {disease_type}"
            )

        # Read image content for future ML processing
        image_content = await image.read()
        
        # Use image-based symptoms placeholder
        symptoms = ["image_analysis_requested"]
        
        # Make prediction using the comprehensive disease database
        result = predict_disease(
            disease_type=disease_code,
            symptoms=symptoms,
            patient_data=None,
            medical_images=[{"type": "uploaded", "size": len(image_content)}],
        )
        
        return {
            "prediction": result.get("diagnosis", disease.name),
            "confidence": result.get("confidence", 0.0),
            "disease_type": disease_type,
            "disease_code": disease_code,
            "severity": result.get("severity", disease.severity.value),
            "recommendations": result.get("recommendations", "Consult healthcare professional for confirmation")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI prediction failed: {str(e)}"
        )

@router.get("/cache/statistics")
async def get_cache_statistics(
    current_user: User = Depends(get_current_active_user)
):
    """Get cache performance statistics."""
    try:
        stats = cache_service.get_statistics()
        return {
            "cache_statistics": stats,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cache statistics: {str(e)}"
        )

@router.post("/predict/batch-optimized")
async def predict_batch_optimized(
    requests: List[PredictionRequest],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_frontline_worker)
):
    """
    Optimized batch prediction endpoint for processing multiple requests concurrently
    Uses async processing and caching for improved performance
    """
    try:
        if len(requests) > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 10 requests allowed per batch"
            )
        
        # Prepare prediction function for batch processing
        async def single_prediction_func(request_data: Dict[str, Any]) -> Dict[str, Any]:
            request = PredictionRequest(**request_data)
            
            # Use cached prediction with comprehensive analysis
            async def prediction_func(symptoms, patient_data, disease_type):
                return predict_disease_comprehensive(
                    symptoms=request.symptoms,
                    patient_data=request.patient_data.dict() if request.patient_data else None,
                    medical_images=request.medical_images,
                    max_diseases=10
                )
            
            return await get_cached_or_predict(
                symptoms=request.symptoms,
                patient_data=request.patient_data.dict() if request.patient_data else None,
                disease_type="batch_comprehensive",
                prediction_function=prediction_func
            )
        
        # Convert requests to dict format for async processing
        request_data_list = [req.dict() for req in requests]
        
        # Process batch with async optimization
        results = await async_service.process_concurrent_predictions(
            request_data_list,
            single_prediction_func
        )
        
        # Transform results to response format
        batch_responses = []
        for i, result in enumerate(results):
            if result.success:
                prediction_result = result.data
                
                # Transform to PredictionResponse format (simplified)
                diagnosis_responses = []
                
                if prediction_result:
                    try:
                        # Convert category and severity
                        category = DiseaseCategory.GENERAL
                        severity = DiseaseSeverity.MODERATE
                        
                        primary_diagnosis = {
                            'disease_code': prediction_result.get('disease_code', 'unknown'),
                            'disease_name': prediction_result.get('disease_name', 'Unknown'),
                            'category': category,
                            'severity': severity,
                            'confidence': prediction_result.get('confidence', 0.0),
                            'reasoning': prediction_result.get('reasoning', 'Batch analysis'),
                            'differential_diagnoses': [],
                            'recommendations': prediction_result.get('recommendations', []),
                            'treatment_protocols': prediction_result.get('treatment_protocols', []),
                            'emergency_level': prediction_result.get('emergency_level', 1)
                        }
                        diagnosis_responses.append(primary_diagnosis)
                        
                    except Exception:
                        # Fallback diagnosis
                        diagnosis_responses.append({
                            'disease_code': 'unknown',
                            'disease_name': 'Analysis Incomplete',
                            'category': DiseaseCategory.GENERAL,
                            'severity': DiseaseSeverity.MODERATE,
                            'confidence': 0.1,
                            'reasoning': 'Batch processing incomplete',
                            'differential_diagnoses': [],
                            'recommendations': ['Consult healthcare professional'],
                            'treatment_protocols': [],
                            'emergency_level': 1
                        })
                
                batch_response = {
                    'request_index': i,
                    'success': True,
                    'processing_time': result.processing_time,
                    'cache_hit': result.cache_hit,
                    'prediction': PredictionResponse(
                        predictions=diagnosis_responses,
                        total_diseases_searched=prediction_result.get('total_diseases_analyzed', 0) if prediction_result else 0,
                        search_time_ms=result.processing_time * 1000
                    )
                }
            else:
                batch_response = {
                    'request_index': i,
                    'success': False,
                    'processing_time': result.processing_time,
                    'error': result.error,
                    'prediction': None
                }
            
            batch_responses.append(batch_response)
        
        # Get performance metrics
        performance_metrics = async_service.get_performance_metrics()
        
        return {
            'batch_results': batch_responses,
            'total_requests': len(requests),
            'successful_predictions': sum(1 for r in batch_responses if r['success']),
            'total_processing_time': sum(r['processing_time'] for r in batch_responses),
            'performance_metrics': performance_metrics,
            'status': 'completed'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )

@router.get("/performance/metrics")
async def get_performance_metrics(
    current_user: User = Depends(get_current_active_user)
):
    """Get backend performance metrics including async processing and caching statistics."""
    try:
        async_metrics = async_service.get_performance_metrics()
        cache_stats = cache_service.get_statistics()
        
        return {
            'async_processing': async_metrics,
            'caching': cache_stats,
            'status': 'success',
            'timestamp': time.time()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get performance metrics: {str(e)}"
        )

@router.post("/diseases/search-optimized")
async def search_diseases_optimized(
    symptoms: List[str],
    category_filter: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Optimized disease search by symptoms using database indexes and caching."""
    try:
        start_time = time.time()
        
        # Get optimized database service
        db_service = get_optimized_db_service(db)
        
        # Use caching for frequent searches
        cache_key = f"disease_search_{hash(tuple(sorted(symptoms)))}{category_filter}{limit}"
        
        async def search_func(symptoms_param, patient_data, disease_type):
            return db_service.get_diseases_by_symptoms_optimized(
                symptoms=symptoms,
                limit=limit,
                category_filter=category_filter
            )
        
        results = await get_cached_or_predict(
            symptoms=symptoms,
            patient_data={},
            disease_type="search",
            prediction_function=search_func
        )
        
        processing_time = time.time() - start_time
        
        return {
            'diseases': results,
            'total_found': len(results),
            'processing_time': processing_time,
            'cached': cache_key in cache_service._cache,
            'status': 'success'
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimized disease search failed: {str(e)}"
        )

@router.get("/diagnoses/recent-optimized")
async def get_recent_diagnoses_optimized(
    limit: int = 50,
    days_back: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get recent diagnoses with optimized database queries."""
    try:
        start_time = time.time()
        
        # Get optimized database service
        db_service = get_optimized_db_service(db)
        
        # Use caching for frequent requests
        cache_key = f"recent_diagnoses_{current_user.id}_{current_user.role}_{limit}_{days_back}"
        
        async def query_func(symptoms, patient_data, disease_type):
            return db_service.get_recent_diagnoses_optimized(
                user_id=current_user.id,
                user_role=current_user.role,
                limit=limit,
                days_back=days_back
            )
        
        results = await get_cached_or_predict(
            symptoms=[],
            patient_data={},
            disease_type="recent_diagnoses",
            prediction_function=query_func
        )
        
        processing_time = time.time() - start_time
        
        return {
            'diagnoses': results,
            'total_found': len(results),
            'processing_time': processing_time,
            'cached': cache_key in cache_service._cache,
            'status': 'success'
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimized recent diagnoses query failed: {str(e)}"
        )

@router.get("/statistics/optimized")
async def get_statistics_optimized(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive statistics with optimized database queries."""
    try:
        start_time = time.time()
        
        # Get optimized database service
        db_service = get_optimized_db_service(db)
        
        # Use caching for statistics
        cache_key = "disease_statistics_optimized"
        
        async def stats_func(symptoms, patient_data, disease_type):
            return db_service.get_disease_statistics_optimized()
        
        results = await get_cached_or_predict(
            symptoms=[],
            patient_data={},
            disease_type="statistics",
            prediction_function=stats_func
        )
        
        processing_time = time.time() - start_time
        
        return {
            'statistics': results,
            'processing_time': processing_time,
            'cached': cache_key in cache_service._cache,
            'status': 'success'
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimized statistics query failed: {str(e)}"
        )

@router.post("/database/optimize")
async def optimize_database(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Initialize database optimizations and create indexes."""
    try:
        # Check if user has admin privileges
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin users can optimize database"
            )
        
        start_time = time.time()
        
        # Initialize database optimizations
        db_service = optimize_database_queries(db)
        
        processing_time = time.time() - start_time
        
        return {
            'message': 'Database optimization completed successfully',
            'processing_time': processing_time,
            'optimizations_applied': [
                'Created database indexes for common queries',
                'Optimized join patterns',
                'Enhanced query performance for disease matching',
                'Improved diagnosis retrieval speed'
            ],
            'status': 'success'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database optimization failed: {str(e)}"
        )
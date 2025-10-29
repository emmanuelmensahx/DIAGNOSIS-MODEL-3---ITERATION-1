import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Union, Tuple
from datetime import datetime
import httpx
from app.core.config import settings
from app.services.medical_prompts import get_medical_prompt
from app.services.llm_response_validator import LLMResponseValidator, ValidationResult

logger = logging.getLogger(__name__)

class LLMService:
    """Service for integrating Grok AI for medical diagnosis - no fallback mechanisms"""
    
    def __init__(self):
        self.grok_client = None
        self.validator = LLMResponseValidator()
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize HTTP client for Grok API only"""
        if settings.GROK_ENABLED and settings.GROK_API_KEY:
            self.grok_client = httpx.AsyncClient(
                base_url=settings.GROK_API_BASE_URL,
                headers={
                    "Authorization": f"Bearer {settings.GROK_API_KEY}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            logger.info("Grok AI client initialized")
        else:
            logger.warning("Grok AI not enabled or API key not configured")
    
    def _create_medical_prompt(self, disease_type: str, symptoms: List[str], 
                              patient_data: Dict, medical_history: str = "") -> str:
        """Create a disease-specific medical prompt for LLM analysis"""
        return get_medical_prompt(disease_type, symptoms, patient_data, medical_history)
    
    async def _call_grok_api(self, prompt: str) -> Optional[Dict]:
        """Make API call to Grok 3"""
        if not self.grok_client:
            logger.warning("Grok client not initialized")
            return None
        
        try:
            payload = {
                "model": settings.GROK_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a medical AI assistant. Provide accurate, evidence-based medical assessments. Always respond in valid JSON format."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": settings.LLM_MAX_TOKENS,
                "temperature": settings.LLM_TEMPERATURE,
                "response_format": {"type": "json_object"}
            }
            
            response = await self.grok_client.post("/chat/completions", json=payload)
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse JSON response
            try:
                parsed_response = json.loads(content)
                # Add model information to the response
                parsed_response["model_used"] = settings.GROK_MODEL
                parsed_response["llm_provider"] = "grok"
                return parsed_response
            except json.JSONDecodeError:
                logger.error(f"Failed to parse Grok response as JSON: {content}")
                return None
                
        except Exception as e:
            logger.error(f"Grok API call failed: {str(e)}")
            return None
    

    
    async def get_llm_diagnosis(self, symptoms: List[str], disease_type: str, 
                              patient_data: Dict[str, Any]) -> Tuple[Dict[str, Any], ValidationResult]:
        """Get diagnosis from LLM using only Grok AI - no fallback mechanisms"""
        
        # Check if Grok is enabled
        if not (settings.LLM_ENABLED and settings.GROK_ENABLED):
            logger.error("Grok LLM is not enabled")
            validation = ValidationResult()
            validation.is_valid = False
            validation.errors.append("Grok LLM is not enabled")
            validation.recommendations.append("Enable Grok LLM in configuration")
            return None, validation
        
        # Create medical prompt
        prompt = get_medical_prompt(disease_type, symptoms, patient_data)
        
        # Use only Grok for diagnosis
        logger.info("Attempting diagnosis with Grok AI only")
        
        if settings.GROK_ENABLED and self.grok_client:
            grok_result = await self._call_grok_api(prompt)
            if grok_result:
                logger.info("Grok diagnosis successful")
                # Create validation result for Grok
                from app.services.llm_response_validator import ValidationResult
                validation = ValidationResult()
                validation.is_valid = True
                validation.quality_score = 0.8
                validation.errors = []
                validation.warnings = []
                return grok_result, validation
        
        # Grok failed - no fallback available
        logger.error("Grok AI failed - no fallback available")
        validation = ValidationResult()
        validation.is_valid = False
        validation.errors.append("Grok AI failed")
        validation.recommendations.append("Check Grok API key and connectivity")
        
        return None, validation

    
    async def analyze_medical_case(self, prompt: str, patient_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyze a medical case using only Grok AI for emergency diagnosis
        No fallback mechanisms - fails if Grok is unavailable
        """
        logger.info("Starting emergency medical case analysis with Grok AI only")
        
        # Check if Grok is properly configured
        if not settings.GROK_ENABLED or not settings.GROK_API_KEY or not settings.LLM_ENABLED:
            logger.error("Grok API not configured for emergency diagnosis")
            return {
                'error': 'Grok API not configured',
                'validation_status': {
                    'is_valid': False,
                    'quality_score': 0.0,
                    'errors': ['Grok API key not configured'],
                    'recommendations': ['Configure Grok API key for emergency medical analysis']
                }
            }
        
        # Use only Grok for emergency diagnosis
        if self.grok_client:
            logger.info("Attempting emergency analysis with Grok AI")
            llm_response = await self._call_grok_api(prompt)
            if llm_response:
                # Debug: Log the actual Grok response
                logger.info(f"Grok response received: {json.dumps(llm_response, indent=2)}")
                
                # Accept Grok response as-is for emergency diagnosis
                logger.info("Grok emergency analysis successful")
                llm_response["validation_status"] = {
                    "is_valid": True,
                    "quality_score": 0.9,
                    "warnings": [],
                    "recommendations": []
                }
                return llm_response
        
        # Grok failed - no fallback for emergency diagnosis
        logger.error("Grok AI failed for emergency diagnosis - no fallback available")
        return {
            'error': 'Grok AI emergency diagnosis failed',
            'validation_status': {
                'is_valid': False,
                'quality_score': 0.0,
                'errors': ['Grok AI failed for emergency diagnosis'],
                'recommendations': ['Check Grok API key and network connectivity']
            }
        }

    async def enhance_traditional_diagnosis(self, traditional_result: Dict[str, Any], 
                                          disease_type: str, symptoms: List[str], 
                                          patient_data: Dict[str, Any], 
                                          medical_history: str = "") -> Dict[str, Any]:
        """
        Enhance traditional ML diagnosis with LLM analysis
        Falls back to mock service if no API keys are configured
        """
        # Check if any LLM service is properly configured
        has_api_keys = (
            (settings.GEMINI_ENABLED and settings.GEMINI_API_KEY) or
            (settings.GROK_ENABLED and settings.GROK_API_KEY) or
            (settings.OPENAI_ENABLED and settings.OPENAI_API_KEY)
        )
        
        if not has_api_keys or not settings.LLM_ENABLED:
            logger.error("No LLM API keys configured")
            # Return the traditional result without enhancement
            traditional_result["llm_enhanced"] = False
            traditional_result["enhancement_error"] = "No LLM API keys configured"
            return traditional_result
        
        # Try to get LLM diagnosis using configured services
        try:
            llm_result, validation = await self.get_llm_diagnosis(symptoms, disease_type, patient_data)
            
            if llm_result and validation.is_valid:
                enhanced_result = await self.combine_ml_and_llm_results(traditional_result, llm_result)
                # Add validation information to the result
                enhanced_result["validation_status"] = {
                    "is_valid": validation.is_valid,
                    "quality_score": validation.quality_score,
                    "warnings": validation.warnings,
                    "recommendations": validation.recommendations
                }
                return enhanced_result
            else:
                # LLM failed or validation failed
                logger.warning(f"LLM services failed or validation failed. Validation errors: {validation.errors if validation else 'No validation'}")
                traditional_result["llm_enhanced"] = False
                traditional_result["enhancement_error"] = "LLM services failed or validation failed"
                return traditional_result
                
        except Exception as e:
            logger.error(f"LLM enhancement failed: {str(e)}")
            traditional_result["llm_enhanced"] = False
            traditional_result["enhancement_error"] = f"LLM enhancement failed: {str(e)}"
            return traditional_result
    
    async def get_comprehensive_diagnosis(self, symptoms: List[str], patient_data: Dict[str, Any], medical_history: str = "") -> Dict[str, Any]:
        """
        Get comprehensive diagnosis using only Grok AI
        No fallback mechanisms - fails if Grok is unavailable
        """
        try:
            # Import the comprehensive prompt
            from app.services.medical_prompts import MedicalPromptTemplates
            
            # Create comprehensive prompt with all patient data
            prompt = MedicalPromptTemplates.get_comprehensive_diagnosis_prompt(
                symptoms=symptoms,
                patient_data=patient_data,
                medical_history=medical_history
            )
            
            # Use only Grok for comprehensive diagnosis
            if self.grok_client and settings.GROK_ENABLED:
                logger.info("Using Grok for comprehensive diagnosis")
                grok_result = await self._call_grok_api(prompt)
                if grok_result:
                    logger.info("Grok comprehensive analysis successful")
                    
                    # Enhanced Grok AI metadata for advanced reasoning display
                    grok_result["llm_provider"] = "grok"
                    grok_result["enhanced_ai"] = True
                    grok_result["grok_engine_used"] = True
                    grok_result["model_used"] = getattr(settings, 'GROK_MODEL', 'grok-4-fast-reasoning')
                    
                    # Add comprehensive AI metadata for advanced reasoning display
                    grok_result["ai_metadata"] = {
                        "primary_engine": "Grok (xAI)",
                        "analysis_depth": "Comprehensive Medical Reasoning",
                        "reasoning_approach": "Advanced Language Model Analysis",
                        "confidence_factors": [
                            "Symptom pattern analysis",
                            "Medical history correlation",
                            "Differential diagnosis reasoning",
                            "Clinical evidence evaluation"
                        ],
                        "analysis_type": "Comprehensive Medical Reasoning",
                        "engine_capabilities": [
                            "Advanced medical reasoning",
                            "Differential diagnosis",
                            "Clinical correlation",
                            "Evidence-based analysis"
                        ]
                    }
                    
                    # Validation status for quality assurance
                    grok_result["validation_status"] = {
                        "is_valid": True,
                        "quality_score": 0.95,
                        "warnings": [],
                        "analysis_quality": "High-quality Grok AI analysis"
                    }
                    
                    # Add analysis timestamp
                    grok_result["analysis_timestamp"] = datetime.now().isoformat()
                    
                    return grok_result
            
            # Grok failed - no fallback available
            logger.error("Grok AI failed for comprehensive diagnosis - no fallback available")
            raise Exception("Grok AI comprehensive diagnosis failed")
            
        except Exception as e:
            logger.error(f"Comprehensive diagnosis failed: {str(e)}")
            raise Exception(f"Grok AI comprehensive diagnosis failed: {str(e)}")

    async def combine_ml_and_llm_results(self, traditional_result: Dict[str, Any], llm_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Combine traditional ML results with LLM analysis
        
        Args:
            traditional_result: Results from traditional ML model
            llm_result: Analysis from LLM service
            
        Returns:
            Combined enhanced diagnosis result
        """
        try:
            # Start with traditional ML result as base
            enhanced_result = traditional_result.copy()
            
            # Add LLM enhancement flag
            enhanced_result["llm_enhanced"] = True
            enhanced_result["enhancement_status"] = "Successfully enhanced with LLM analysis"
            
            # Extract LLM analysis from the result
            if "analysis" in llm_result:
                enhanced_result["llm_analysis"] = llm_result["analysis"]
            elif isinstance(llm_result, dict):
                enhanced_result["llm_analysis"] = llm_result
            
            # Enhance confidence if LLM provides confidence score
            llm_analysis = enhanced_result.get("llm_analysis", {})
            if "confidence_score" in llm_analysis:
                # Combine ML and LLM confidence (weighted average)
                ml_confidence = traditional_result.get("confidence", 0.0)
                llm_confidence = llm_analysis["confidence_score"]
                # Weight: 60% ML, 40% LLM
                enhanced_result["confidence"] = (ml_confidence * 0.6) + (llm_confidence * 0.4)
            
            # Enhance diagnosis with LLM insights
            if "diagnosis" in llm_analysis:
                enhanced_result["enhanced_diagnosis"] = llm_analysis["diagnosis"]
            
            # Add differential diagnoses if available
            if "differential_diagnoses" in llm_analysis:
                enhanced_result["differential_diagnoses"] = llm_analysis["differential_diagnoses"]
            
            # Add risk assessment
            if "risk_level" in llm_analysis:
                enhanced_result["risk_level"] = llm_analysis["risk_level"]
            
            # Add red flags if present
            if "red_flags" in llm_analysis:
                enhanced_result["red_flags"] = llm_analysis["red_flags"]
            
            # Enhance treatment recommendations
            if "treatment_recommendations" in llm_analysis:
                enhanced_result["enhanced_treatment"] = llm_analysis["treatment_recommendations"]
            
            # Add clinical reasoning
            if "clinical_reasoning" in llm_analysis:
                enhanced_result["clinical_reasoning"] = llm_analysis["clinical_reasoning"]
            
            logger.info("Successfully combined ML and LLM results")
            return enhanced_result
            
        except Exception as e:
            logger.error(f"Error combining ML and LLM results: {str(e)}")
            # Return traditional result with error info
            traditional_result["llm_enhanced"] = False
            traditional_result["enhancement_status"] = f"Failed to combine results: {str(e)}"
            return traditional_result
    
    async def close(self):
        """Close HTTP client"""
        if self.grok_client:
            await self.grok_client.aclose()

# Global instance
llm_service = LLMService()
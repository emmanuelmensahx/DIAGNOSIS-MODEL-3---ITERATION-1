"""
LLM Response Validator for Medical AI Responses
Ensures safety, quality, and appropriateness of LLM-generated medical content
"""

import json
import re
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class ValidationSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ValidationResult:
    def __init__(self):
        self.is_valid = True
        self.confidence_score = 1.0
        self.warnings = []
        self.errors = []
        self.safety_flags = []
        self.quality_score = 1.0
        self.recommendations = []

class LLMResponseValidator:
    """Validates LLM responses for medical safety and quality"""
    
    def __init__(self):
        # Dangerous or inappropriate medical advice patterns
        self.dangerous_patterns = [
            r"ignore medical advice",
            r"don't see a doctor",
            r"avoid medical treatment",
            r"self-medicate",
            r"home surgery",
            r"dangerous dosage",
            r"experimental treatment",
            r"unproven cure"
        ]
        
        # Required medical response fields
        self.required_fields = [
            "primary_diagnosis",
            "confidence_score",
            "recommended_investigations",
            "immediate_management",
            "red_flags",
            "referral_criteria"
        ]
        
        # Confidence thresholds
        self.min_confidence = 0.1
        self.low_confidence_threshold = 0.4
        self.high_confidence_threshold = 0.8
        
        # Safety keywords that should trigger warnings
        self.safety_keywords = [
            "emergency", "urgent", "immediate", "critical", "life-threatening",
            "severe", "acute", "shock", "unconscious", "bleeding", "seizure"
        ]

    def validate_response(self, llm_response: Dict[str, Any], 
                         disease_type: str, symptoms: List[str], 
                         patient_age: Optional[int] = None) -> ValidationResult:
        """
        Comprehensive validation of LLM medical response
        
        Args:
            llm_response: The LLM-generated medical response
            disease_type: The suspected disease type
            symptoms: List of patient symptoms
            patient_age: Patient age for age-specific validation
            
        Returns:
            ValidationResult with validation status and recommendations
        """
        result = ValidationResult()
        
        try:
            # 1. Structure validation
            self._validate_structure(llm_response, result)
            
            # 2. Content safety validation
            self._validate_safety(llm_response, result)
            
            # 3. Medical appropriateness validation
            self._validate_medical_appropriateness(llm_response, disease_type, symptoms, patient_age, result)
            
            # 4. Confidence validation
            self._validate_confidence(llm_response, result)
            
            # 5. Quality assessment
            self._assess_quality(llm_response, result)
            
            # 6. Generate recommendations
            self._generate_recommendations(result)
            
            # Final validation decision
            result.is_valid = len(result.errors) == 0 and result.quality_score >= 0.3
            
        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            result.is_valid = False
            result.errors.append(f"Validation process failed: {str(e)}")
            result.quality_score = 0.0
        
        return result

    def _validate_structure(self, response: Dict[str, Any], result: ValidationResult):
        """Validate response structure and required fields"""
        
        # Check if response is a dictionary
        if not isinstance(response, dict):
            result.errors.append("Response is not a valid JSON object")
            return
        
        # Check required fields
        missing_fields = []
        for field in self.required_fields:
            if field not in response:
                missing_fields.append(field)
        
        if missing_fields:
            result.warnings.append(f"Missing recommended fields: {', '.join(missing_fields)}")
            result.quality_score *= 0.8
        
        # Validate confidence score format
        if "confidence_score" in response:
            confidence = response["confidence_score"]
            if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
                result.errors.append("Invalid confidence score format (must be 0.0-1.0)")

    def _validate_safety(self, response: Dict[str, Any], result: ValidationResult):
        """Check for dangerous or inappropriate medical advice"""
        
        # Convert response to text for pattern matching
        response_text = json.dumps(response).lower()
        
        # Check for dangerous patterns
        for pattern in self.dangerous_patterns:
            if re.search(pattern, response_text):
                result.safety_flags.append(f"Potentially dangerous advice detected: {pattern}")
                result.quality_score *= 0.5
        
        # Check for emergency indicators
        emergency_count = 0
        for keyword in self.safety_keywords:
            if keyword in response_text:
                emergency_count += 1
        
        if emergency_count >= 3:
            result.warnings.append("High emergency indicator count - ensure appropriate urgency level")

    def _validate_medical_appropriateness(self, response: Dict[str, Any], 
                                        disease_type: str, symptoms: List[str], 
                                        patient_age: Optional[int], result: ValidationResult):
        """Validate medical appropriateness of the response"""
        
        # Age-specific validation
        if patient_age is not None:
            self._validate_age_appropriateness(response, patient_age, result)
        
        # Disease-specific validation
        self._validate_disease_appropriateness(response, disease_type, result)
        
        # Symptom consistency validation
        self._validate_symptom_consistency(response, symptoms, result)

    def _validate_age_appropriateness(self, response: Dict[str, Any], 
                                    patient_age: int, result: ValidationResult):
        """Validate age-appropriate recommendations"""
        
        response_text = json.dumps(response).lower()
        
        # Pediatric considerations (under 18)
        if patient_age < 18:
            adult_medications = ["aspirin", "tetracycline", "quinolone", "warfarin"]
            for med in adult_medications:
                if med in response_text:
                    result.warnings.append(f"Adult medication '{med}' mentioned for pediatric patient")
        
        # Elderly considerations (over 65)
        if patient_age > 65:
            high_risk_meds = ["benzodiazepine", "anticholinergic", "high-dose nsaid"]
            for med in high_risk_meds:
                if med in response_text:
                    result.warnings.append(f"High-risk medication '{med}' for elderly patient")

    def _validate_disease_appropriateness(self, response: Dict[str, Any], 
                                        disease_type: str, result: ValidationResult):
        """Validate disease-specific appropriateness"""
        
        # Handle primary_diagnosis as either string or dict
        primary_diagnosis_raw = response.get("primary_diagnosis", "")
        if isinstance(primary_diagnosis_raw, dict):
            primary_diagnosis = primary_diagnosis_raw.get("disease_name", "").lower()
        else:
            primary_diagnosis = str(primary_diagnosis_raw).lower()
        disease_type_lower = disease_type.lower()
        
        # Check if primary diagnosis is related to suspected disease
        if disease_type_lower not in primary_diagnosis and not self._are_diseases_related(disease_type_lower, primary_diagnosis):
            result.warnings.append(f"Primary diagnosis '{primary_diagnosis}' differs significantly from suspected '{disease_type}'")
            result.confidence_score *= 0.8

    def _validate_symptom_consistency(self, response: Dict[str, Any], 
                                    symptoms: List[str], result: ValidationResult):
        """Validate consistency between symptoms and diagnosis"""
        
        if not symptoms:
            return
        
        response_text = json.dumps(response).lower()
        symptom_mentions = 0
        
        for symptom in symptoms:
            if symptom.lower() in response_text:
                symptom_mentions += 1
        
        symptom_coverage = symptom_mentions / len(symptoms) if symptoms else 0
        
        if symptom_coverage < 0.3:
            result.warnings.append("Low symptom coverage in response - may not address patient's presentation")
            result.quality_score *= 0.7

    def _validate_confidence(self, response: Dict[str, Any], result: ValidationResult):
        """Validate confidence levels and appropriateness"""
        
        confidence = response.get("confidence_score", 0.5)
        
        if confidence < self.min_confidence:
            result.errors.append(f"Confidence too low ({confidence}) - response unreliable")
        elif confidence < self.low_confidence_threshold:
            result.warnings.append("Low confidence - consider additional assessment")
        elif confidence > self.high_confidence_threshold:
            # High confidence should be backed by clear reasoning
            reasoning = response.get("clinical_reasoning", "")
            if len(reasoning) < 100:
                result.warnings.append("High confidence with insufficient reasoning")

    def _assess_quality(self, response: Dict[str, Any], result: ValidationResult):
        """Assess overall quality of the response"""
        
        quality_factors = []
        
        # Check completeness
        field_completeness = sum(1 for field in self.required_fields if field in response) / len(self.required_fields)
        quality_factors.append(field_completeness)
        
        # Check reasoning quality
        reasoning = response.get("clinical_reasoning", "")
        reasoning_quality = min(len(reasoning) / 200, 1.0)  # Normalize to 200 chars
        quality_factors.append(reasoning_quality)
        
        # Check differential diagnoses
        differentials = response.get("differential_diagnoses", [])
        differential_quality = min(len(differentials) / 3, 1.0)  # Normalize to 3 differentials
        quality_factors.append(differential_quality)
        
        # Calculate overall quality
        base_quality = sum(quality_factors) / len(quality_factors)
        result.quality_score = min(result.quality_score, base_quality)

    def _generate_recommendations(self, result: ValidationResult):
        """Generate recommendations based on validation results"""
        
        if result.safety_flags:
            result.recommendations.append("Review safety concerns before using response")
        
        if result.quality_score < 0.5:
            result.recommendations.append("Consider regenerating response or using fallback")
        
        if len(result.warnings) > 3:
            result.recommendations.append("Multiple warnings detected - manual review recommended")
        
        if result.confidence_score < self.low_confidence_threshold:
            result.recommendations.append("Low confidence - seek additional clinical input")

    def _are_diseases_related(self, disease1: str, disease2: str) -> bool:
        """Check if two diseases are medically related"""
        
        # Define disease relationship groups
        respiratory_diseases = ["pneumonia", "tuberculosis", "lung_cancer", "bronchitis", "asthma"]
        gi_diseases = ["gastroenteritis", "appendicitis", "cholecystitis", "peptic_ulcer", "hepatitis"]
        pediatric_diseases = ["measles", "mumps", "chickenpox", "rsv", "rotavirus", "whooping_cough"]
        
        disease_groups = [respiratory_diseases, gi_diseases, pediatric_diseases]
        
        for group in disease_groups:
            if disease1 in group and disease2 in group:
                return True
        
        return False

    def sanitize_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize response by removing or modifying unsafe content"""
        
        sanitized = response.copy()
        
        # Remove dangerous advice patterns
        for field in ["immediate_management", "patient_education", "clinical_reasoning"]:
            if field in sanitized and isinstance(sanitized[field], str):
                content = sanitized[field]
                for pattern in self.dangerous_patterns:
                    content = re.sub(pattern, "[REMOVED: UNSAFE ADVICE]", content, flags=re.IGNORECASE)
                sanitized[field] = content
        
        # Ensure confidence is within bounds
        if "confidence_score" in sanitized:
            confidence = sanitized["confidence_score"]
            if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
                sanitized["confidence_score"] = 0.5  # Default safe value
        
        return sanitized
"""
Diagnosis Validation Service

This module provides validation logic to prevent inappropriate disease assignments
based on age groups, symptom compatibility, and clinical reasoning.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class ValidationSeverity(Enum):
    """Severity levels for validation warnings"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class ValidationResult:
    """Result of diagnosis validation"""
    is_valid: bool
    confidence_score: float
    warnings: List[Dict[str, Any]]
    recommendations: List[str]
    alternative_diagnoses: List[str]


class DiagnosisValidator:
    """
    Validates disease assignments based on clinical logic and constraints
    """
    
    def __init__(self):
        # Age-based disease restrictions
        self.age_restrictions = {
            "pediatric_only": {
                "diseases": ["measles", "mumps", "chickenpox", "rsv", "rotavirus", "whooping_cough"],
                "max_age": 18,
                "message": "This disease is primarily seen in children"
            },
            "adult_predominant": {
                "diseases": ["lung_cancer", "peptic_ulcer", "cholecystitis"],
                "min_age": 18,
                "message": "This disease is more common in adults"
            },
            "elderly_risk": {
                "diseases": ["pneumonia", "tuberculosis"],
                "high_risk_age": 65,
                "message": "Higher risk and severity in elderly patients"
            }
        }
        
        # Symptom compatibility matrix
        self.symptom_incompatibilities = {
            "respiratory_diseases": {
                "diseases": ["tuberculosis", "pneumonia", "lung_cancer", "rsv", "whooping_cough"],
                "required_symptoms": ["cough", "shortness_of_breath", "chest_pain", "fever"],
                "incompatible_symptoms": ["diarrhea", "vomiting", "abdominal_pain"]
            },
            "gastrointestinal_diseases": {
                "diseases": ["gastroenteritis", "appendicitis", "cholecystitis", "peptic_ulcer", "ulcerative_colitis", "hepatitis_a", "rotavirus"],
                "required_symptoms": ["abdominal_pain", "nausea", "vomiting", "diarrhea"],
                "incompatible_symptoms": ["cough", "shortness_of_breath"]
            },
            "infectious_diseases": {
                "diseases": ["measles", "mumps", "chickenpox", "malaria", "tuberculosis", "hepatitis_a"],
                "required_symptoms": ["fever"],
                "warning_symptoms": ["fatigue", "muscle_aches"]
            }
        }
        
        # Geographic/endemic restrictions
        self.geographic_restrictions = {
            "malaria": {
                "endemic_regions": ["sub_saharan_africa", "southeast_asia", "south_america"],
                "travel_history_required": True,
                "message": "Consider travel history to endemic areas"
            },
            "tuberculosis": {
                "risk_factors": ["immunocompromised", "crowded_living", "malnutrition"],
                "message": "Consider TB risk factors and exposure history"
            }
        }
        
        # Severity-based warnings
        self.severity_warnings = {
            "high_severity": ["appendicitis", "cholecystitis", "pneumonia", "lung_cancer"],
            "emergency_conditions": ["appendicitis", "severe_pneumonia"],
            "chronic_conditions": ["tuberculosis", "ulcerative_colitis", "lung_cancer"]
        }
    
    def validate_diagnosis(
        self, 
        disease: str, 
        symptoms: List[str], 
        patient_age: Optional[int] = None,
        patient_data: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        """
        Validate a diagnosis against clinical logic and constraints
        
        Args:
            disease: The proposed disease diagnosis
            symptoms: List of patient symptoms
            patient_age: Patient's age in years
            patient_data: Additional patient information
            
        Returns:
            ValidationResult with validation outcome and recommendations
        """
        warnings = []
        recommendations = []
        alternative_diagnoses = []
        confidence_score = 1.0
        is_valid = True
        
        # Normalize disease name
        disease_normalized = disease.lower().replace(" ", "_")
        symptoms_normalized = [s.lower().strip() for s in symptoms]
        
        # Age-based validation
        age_validation = self._validate_age_compatibility(disease_normalized, patient_age)
        if age_validation["warnings"]:
            warnings.extend(age_validation["warnings"])
            confidence_score *= age_validation["confidence_multiplier"]
        
        # Symptom compatibility validation
        symptom_validation = self._validate_symptom_compatibility(disease_normalized, symptoms_normalized)
        if symptom_validation["warnings"]:
            warnings.extend(symptom_validation["warnings"])
            confidence_score *= symptom_validation["confidence_multiplier"]
            if symptom_validation["alternative_diagnoses"]:
                alternative_diagnoses.extend(symptom_validation["alternative_diagnoses"])
        
        # Geographic/endemic validation
        geographic_validation = self._validate_geographic_factors(disease_normalized, patient_data)
        if geographic_validation["warnings"]:
            warnings.extend(geographic_validation["warnings"])
            recommendations.extend(geographic_validation["recommendations"])
        
        # Severity and urgency validation
        severity_validation = self._validate_severity_factors(disease_normalized, symptoms_normalized, patient_age)
        if severity_validation["warnings"]:
            warnings.extend(severity_validation["warnings"])
            recommendations.extend(severity_validation["recommendations"])
        
        # Determine overall validity
        critical_warnings = [w for w in warnings if w.get("severity") == ValidationSeverity.CRITICAL.value]
        if critical_warnings or confidence_score < 0.3:
            is_valid = False
        
        return ValidationResult(
            is_valid=is_valid,
            confidence_score=max(0.1, confidence_score),  # Minimum confidence of 0.1
            warnings=warnings,
            recommendations=recommendations,
            alternative_diagnoses=list(set(alternative_diagnoses))  # Remove duplicates
        )
    
    def _validate_age_compatibility(self, disease: str, patient_age: Optional[int]) -> Dict[str, Any]:
        """Validate age compatibility for the disease"""
        warnings = []
        confidence_multiplier = 1.0
        
        if patient_age is None:
            return {"warnings": warnings, "confidence_multiplier": confidence_multiplier}
        
        # Check pediatric-only diseases
        if disease in self.age_restrictions["pediatric_only"]["diseases"]:
            if patient_age > self.age_restrictions["pediatric_only"]["max_age"]:
                warnings.append({
                    "type": "age_incompatibility",
                    "severity": ValidationSeverity.WARNING.value,
                    "message": f"{disease} is uncommon in adults (age {patient_age}). {self.age_restrictions['pediatric_only']['message']}",
                    "patient_age": patient_age,
                    "expected_age_range": f"0-{self.age_restrictions['pediatric_only']['max_age']}"
                })
                confidence_multiplier = 0.3
        
        # Check adult-predominant diseases
        elif disease in self.age_restrictions["adult_predominant"]["diseases"]:
            if patient_age < self.age_restrictions["adult_predominant"]["min_age"]:
                warnings.append({
                    "type": "age_incompatibility",
                    "severity": ValidationSeverity.WARNING.value,
                    "message": f"{disease} is uncommon in children (age {patient_age}). {self.age_restrictions['adult_predominant']['message']}",
                    "patient_age": patient_age,
                    "expected_age_range": f"{self.age_restrictions['adult_predominant']['min_age']}+"
                })
                confidence_multiplier = 0.4
        
        # Check elderly risk diseases
        elif disease in self.age_restrictions["elderly_risk"]["diseases"]:
            if patient_age >= self.age_restrictions["elderly_risk"]["high_risk_age"]:
                warnings.append({
                    "type": "age_risk_factor",
                    "severity": ValidationSeverity.INFO.value,
                    "message": f"{disease} has higher risk and severity in elderly patients (age {patient_age}). {self.age_restrictions['elderly_risk']['message']}",
                    "patient_age": patient_age
                })
        
        return {"warnings": warnings, "confidence_multiplier": confidence_multiplier}
    
    def _validate_symptom_compatibility(self, disease: str, symptoms: List[str]) -> Dict[str, Any]:
        """Validate symptom compatibility for the disease"""
        warnings = []
        confidence_multiplier = 1.0
        alternative_diagnoses = []
        
        # Check each disease category
        for category, rules in self.symptom_incompatibilities.items():
            if disease in rules["diseases"]:
                # Check for required symptoms
                if "required_symptoms" in rules:
                    required_present = any(req_symptom in symptoms for req_symptom in rules["required_symptoms"])
                    if not required_present:
                        warnings.append({
                            "type": "missing_required_symptoms",
                            "severity": ValidationSeverity.WARNING.value,
                            "message": f"{disease} typically presents with symptoms like: {', '.join(rules['required_symptoms'])}",
                            "missing_symptoms": rules["required_symptoms"],
                            "category": category
                        })
                        confidence_multiplier *= 0.6
                
                # Check for incompatible symptoms
                if "incompatible_symptoms" in rules:
                    incompatible_present = [symptom for symptom in symptoms if symptom in rules["incompatible_symptoms"]]
                    if incompatible_present:
                        warnings.append({
                            "type": "incompatible_symptoms",
                            "severity": ValidationSeverity.WARNING.value,
                            "message": f"{disease} rarely presents with: {', '.join(incompatible_present)}",
                            "incompatible_symptoms": incompatible_present,
                            "category": category
                        })
                        confidence_multiplier *= 0.7
                        
                        # Suggest alternative diagnoses based on incompatible symptoms
                        if "diarrhea" in incompatible_present or "vomiting" in incompatible_present:
                            alternative_diagnoses.extend(["gastroenteritis", "rotavirus", "appendicitis"])
                        if "cough" in incompatible_present or "shortness_of_breath" in incompatible_present:
                            alternative_diagnoses.extend(["pneumonia", "tuberculosis", "rsv"])
        
        return {
            "warnings": warnings, 
            "confidence_multiplier": confidence_multiplier,
            "alternative_diagnoses": alternative_diagnoses
        }
    
    def _validate_geographic_factors(self, disease: str, patient_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate geographic and endemic factors"""
        warnings = []
        recommendations = []
        
        if patient_data is None:
            patient_data = {}
        
        if disease in self.geographic_restrictions:
            restriction = self.geographic_restrictions[disease]
            
            if restriction.get("travel_history_required"):
                travel_history = patient_data.get("travel_history", [])
                endemic_regions = restriction.get("endemic_regions", [])
                
                if not travel_history or not any(region in str(travel_history).lower() for region in endemic_regions):
                    warnings.append({
                        "type": "geographic_risk_factor",
                        "severity": ValidationSeverity.INFO.value,
                        "message": restriction["message"],
                        "endemic_regions": endemic_regions
                    })
                    recommendations.append(f"Verify travel history to {', '.join(endemic_regions)}")
        
        return {"warnings": warnings, "recommendations": recommendations}
    
    def _validate_severity_factors(self, disease: str, symptoms: List[str], patient_age: Optional[int]) -> Dict[str, Any]:
        """Validate severity and urgency factors"""
        warnings = []
        recommendations = []
        
        # High severity diseases
        if disease in self.severity_warnings["high_severity"]:
            warnings.append({
                "type": "high_severity_disease",
                "severity": ValidationSeverity.INFO.value,
                "message": f"{disease} is a serious condition requiring prompt medical attention",
                "disease": disease
            })
            recommendations.append("Ensure appropriate follow-up and monitoring")
        
        # Emergency conditions
        if disease in self.severity_warnings["emergency_conditions"]:
            emergency_symptoms = ["severe_pain", "high_fever", "difficulty_breathing", "severe_abdominal_pain"]
            if any(symptom in symptoms for symptom in emergency_symptoms):
                warnings.append({
                    "type": "emergency_condition",
                    "severity": ValidationSeverity.CRITICAL.value,
                    "message": f"{disease} with severe symptoms may require immediate medical intervention",
                    "disease": disease
                })
                recommendations.append("Consider immediate referral or emergency care")
        
        # Chronic conditions
        if disease in self.severity_warnings["chronic_conditions"]:
            recommendations.append(f"{disease} requires long-term management and regular follow-up")
        
        return {"warnings": warnings, "recommendations": recommendations}


# Global instance
diagnosis_validator = DiagnosisValidator()
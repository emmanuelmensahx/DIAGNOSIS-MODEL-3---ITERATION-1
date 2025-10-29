"""
Enhanced symptom matching service for improved disease prediction accuracy
"""

from typing import Dict, List, Tuple, Set
import re
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class SymptomMatcher:
    """Enhanced symptom matching for better disease prediction"""
    
    def __init__(self):
        # Symptom-to-disease mapping with weights
        self.symptom_disease_map = {
            # Respiratory symptoms
            "persistent_cough": {
                "tuberculosis": 0.8,
                "pneumonia": 0.7,
                "lung_cancer": 0.6,
                "whooping_cough": 0.9
            },
            "coughing_blood": {
                "tuberculosis": 0.9,
                "lung_cancer": 0.8,
                "pneumonia": 0.3
            },
            "hemoptysis": {
                "tuberculosis": 0.9,
                "lung_cancer": 0.8,
                "pneumonia": 0.3
            },
            "shortness_of_breath": {
                "pneumonia": 0.8,
                "tuberculosis": 0.6,
                "rsv": 0.7,
                "lung_cancer": 0.5
            },
            "chest_pain": {
                "pneumonia": 0.7,
                "tuberculosis": 0.5,
                "lung_cancer": 0.4
            },
            "wheezing": {
                "rsv": 0.8,
                "pneumonia": 0.4,
                "whooping_cough": 0.6
            },
            "whooping_sound": {
                "whooping_cough": 0.95
            },
            
            # Fever and systemic symptoms
            "fever": {
                "malaria": 0.9,
                "pneumonia": 0.8,
                "tuberculosis": 0.7,
                "measles": 0.8,
                "mumps": 0.7,
                "chickenpox": 0.8,
                "rsv": 0.7,
                "gastroenteritis": 0.6,
                "appendicitis": 0.7,
                "cholecystitis": 0.6,
                "hepatitis_a": 0.7,
                "whooping_cough": 0.5
            },
            "chills": {
                "malaria": 0.9,
                "pneumonia": 0.6,
                "tuberculosis": 0.5
            },
            "night_sweats": {
                "tuberculosis": 0.8,
                "malaria": 0.6,
                "lung_cancer": 0.4
            },
            "weight_loss": {
                "tuberculosis": 0.8,
                "lung_cancer": 0.7,
                "ulcerative_colitis": 0.6
            },
            "fatigue": {
                "tuberculosis": 0.6,
                "hepatitis_a": 0.8,
                "malaria": 0.7,
                "lung_cancer": 0.5
            },
            
            # Gastrointestinal symptoms
            "diarrhea": {
                "gastroenteritis": 0.9,
                "rotavirus": 0.8,
                "ulcerative_colitis": 0.7
            },
            "vomiting": {
                "gastroenteritis": 0.8,
                "rotavirus": 0.8,
                "appendicitis": 0.6,
                "cholecystitis": 0.5
            },
            "nausea": {
                "gastroenteritis": 0.7,
                "appendicitis": 0.7,
                "cholecystitis": 0.8,
                "hepatitis_a": 0.6
            },
            "abdominal_pain": {
                "appendicitis": 0.9,
                "gastroenteritis": 0.7,
                "cholecystitis": 0.8,
                "peptic_ulcer": 0.8,
                "ulcerative_colitis": 0.7
            },
            "right_lower_quadrant_pain": {
                "appendicitis": 0.95
            },
            "right_upper_quadrant_pain": {
                "cholecystitis": 0.9
            },
            "epigastric_pain": {
                "peptic_ulcer": 0.8,
                "gastroenteritis": 0.4
            },
            "bloody_stool": {
                "ulcerative_colitis": 0.8,
                "gastroenteritis": 0.3
            },
            "jaundice": {
                "hepatitis_a": 0.9,
                "cholecystitis": 0.4
            },
            
            # Skin and rash symptoms
            "rash": {
                "measles": 0.8,
                "chickenpox": 0.9,
                "mumps": 0.2
            },
            "vesicular_rash": {
                "chickenpox": 0.95
            },
            "maculopapular_rash": {
                "measles": 0.9
            },
            "koplik_spots": {
                "measles": 0.98
            },
            
            # Head and neck symptoms
            "headache": {
                "malaria": 0.7,
                "measles": 0.5,
                "mumps": 0.4
            },
            "parotid_swelling": {
                "mumps": 0.95
            },
            "sore_throat": {
                "measles": 0.4,
                "mumps": 0.3
            },
            
            # Age-specific symptoms
            "difficulty_feeding": {
                "rsv": 0.7,
                "rotavirus": 0.5
            },
            "irritability": {
                "rsv": 0.6,
                "rotavirus": 0.5,
                "measles": 0.4
            }
        }
        
        # Symptom synonyms and variations
        self.symptom_synonyms = {
            "cough": ["coughing", "persistent_cough", "chronic_cough"],
            "fever": ["high_temperature", "pyrexia", "febrile"],
            "diarrhea": ["loose_stools", "watery_stools", "frequent_bowel_movements"],
            "vomiting": ["throwing_up", "emesis", "nausea_and_vomiting"],
            "headache": ["head_pain", "cephalgia"],
            "rash": ["skin_rash", "eruption", "skin_lesions"],
            "abdominal_pain": ["stomach_pain", "belly_pain", "tummy_ache"],
            "shortness_of_breath": ["dyspnea", "breathing_difficulty", "breathlessness"],
            "chest_pain": ["thoracic_pain", "chest_discomfort"],
            "weight_loss": ["losing_weight", "unintentional_weight_loss"],
            "night_sweats": ["nocturnal_sweating", "night_time_sweating"],
            "hemoptysis": ["coughing_blood", "blood_in_sputum", "bloody_cough"]
        }
        
        # Disease categories for validation
        self.disease_categories = {
            "respiratory": ["tuberculosis", "pneumonia", "lung_cancer", "rsv", "whooping_cough"],
            "gastrointestinal": ["gastroenteritis", "appendicitis", "cholecystitis", "peptic_ulcer", "ulcerative_colitis", "hepatitis_a", "rotavirus"],
            "infectious": ["malaria", "tuberculosis", "pneumonia", "measles", "mumps", "chickenpox", "rsv", "rotavirus", "whooping_cough", "hepatitis_a"],
            "pediatric": ["measles", "mumps", "chickenpox", "rsv", "rotavirus", "whooping_cough"]
        }
    
    def normalize_symptoms(self, symptoms: List[str]) -> List[str]:
        """Normalize symptom names using synonyms"""
        normalized = []
        
        for symptom in symptoms:
            symptom_lower = symptom.lower().strip()
            
            # Check for exact matches first
            if symptom_lower in self.symptom_disease_map:
                normalized.append(symptom_lower)
                continue
            
            # Check synonyms
            found = False
            for canonical, synonyms in self.symptom_synonyms.items():
                if symptom_lower in synonyms or any(syn in symptom_lower for syn in synonyms):
                    normalized.append(canonical)
                    found = True
                    break
            
            if not found:
                # Try partial matching for compound symptoms
                for canonical_symptom in self.symptom_disease_map.keys():
                    if canonical_symptom in symptom_lower or symptom_lower in canonical_symptom:
                        normalized.append(canonical_symptom)
                        found = True
                        break
                
                if not found:
                    normalized.append(symptom_lower)
        
        return list(set(normalized))  # Remove duplicates
    
    def calculate_disease_scores(self, symptoms: List[str], patient_age: int = None) -> Dict[str, float]:
        """Calculate disease likelihood scores based on symptoms"""
        normalized_symptoms = self.normalize_symptoms(symptoms)
        disease_scores = defaultdict(float)
        
        for symptom in normalized_symptoms:
            if symptom in self.symptom_disease_map:
                for disease, weight in self.symptom_disease_map[symptom].items():
                    disease_scores[disease] += weight
        
        # Apply age-based adjustments
        if patient_age is not None:
            disease_scores = self._apply_age_adjustments(disease_scores, patient_age)
        
        # Normalize scores
        if disease_scores:
            max_score = max(disease_scores.values())
            if max_score > 0:
                for disease in disease_scores:
                    disease_scores[disease] = disease_scores[disease] / max_score
        
        return dict(disease_scores)
    
    def _apply_age_adjustments(self, disease_scores: Dict[str, float], age: int) -> Dict[str, float]:
        """Apply age-based adjustments to disease scores"""
        adjusted_scores = disease_scores.copy()
        
        # Pediatric diseases more likely in children
        if age < 18:
            for disease in self.disease_categories["pediatric"]:
                if disease in adjusted_scores:
                    adjusted_scores[disease] *= 1.5
        
        # Some diseases more common in adults
        if age > 40:
            adult_diseases = ["lung_cancer", "peptic_ulcer", "cholecystitis"]
            for disease in adult_diseases:
                if disease in adjusted_scores:
                    adjusted_scores[disease] *= 1.2
        
        # Elderly adjustments
        if age > 65:
            elderly_diseases = ["pneumonia", "lung_cancer"]
            for disease in elderly_diseases:
                if disease in adjusted_scores:
                    adjusted_scores[disease] *= 1.3
        
        return adjusted_scores
    
    def get_top_matches(self, symptoms: List[str], patient_age: int = None, top_n: int = 5) -> List[Tuple[str, float]]:
        """Get top disease matches for given symptoms"""
        scores = self.calculate_disease_scores(symptoms, patient_age)
        
        # Sort by score descending
        sorted_diseases = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        return sorted_diseases[:top_n]
    
    def validate_disease_assignment(self, disease: str, symptoms: List[str], patient_age: int = None) -> Dict[str, any]:
        """Validate if a disease assignment makes sense given symptoms and patient data"""
        normalized_symptoms = self.normalize_symptoms(symptoms)
        
        # Check if disease has any matching symptoms
        matching_symptoms = []
        total_weight = 0
        
        if disease in [d for symptom_map in self.symptom_disease_map.values() for d in symptom_map.keys()]:
            for symptom in normalized_symptoms:
                if symptom in self.symptom_disease_map:
                    if disease in self.symptom_disease_map[symptom]:
                        weight = self.symptom_disease_map[symptom][disease]
                        matching_symptoms.append((symptom, weight))
                        total_weight += weight
        
        # Age validation
        age_appropriate = True
        age_warning = None
        
        if patient_age is not None:
            if disease in self.disease_categories["pediatric"] and patient_age > 18:
                age_appropriate = False
                age_warning = f"{disease} is typically a pediatric condition"
            elif disease == "lung_cancer" and patient_age < 30:
                age_appropriate = False
                age_warning = f"{disease} is rare in patients under 30"
        
        return {
            "valid": len(matching_symptoms) > 0,
            "confidence": total_weight,
            "matching_symptoms": matching_symptoms,
            "age_appropriate": age_appropriate,
            "age_warning": age_warning,
            "total_symptoms_matched": len(matching_symptoms),
            "total_symptoms_provided": len(normalized_symptoms)
        }

# Create global instance
symptom_matcher = SymptomMatcher()
import os
import json
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from enum import Enum

# Import disease-specific models
# These will be implemented in separate modules
from app.api.schemas import DiseaseType

class ModelInterface:
    """Interface for all disease diagnosis models"""
    
    def __init__(self):
        self.models = {}
        self.load_models()
    
    def load_models(self):
        """Load all disease models"""
        # This would load the actual trained models in production
        # For now, we'll use placeholder implementations
        
        # Import disease-specific model handlers
        try:
            from app.ml.lung_cancer.model import LungCancerModel
            self.models[DiseaseType.LUNG_CANCER] = LungCancerModel()
        except ImportError:
            print(f"Warning: {DiseaseType.LUNG_CANCER} model not available")
        
        try:
            from app.ml.malaria.model import MalariaModel
            self.models[DiseaseType.MALARIA] = MalariaModel()
        except ImportError:
            print(f"Warning: {DiseaseType.MALARIA} model not available")
        
        try:
            from app.ml.pneumonia.model import PneumoniaModel
            self.models[DiseaseType.PNEUMONIA] = PneumoniaModel()
        except ImportError:
            print(f"Warning: {DiseaseType.PNEUMONIA} model not available")
        
        try:
            from app.ml.tuberculosis.model import TuberculosisModel
            self.models[DiseaseType.TUBERCULOSIS] = TuberculosisModel()
        except ImportError:
            print(f"Warning: {DiseaseType.TUBERCULOSIS} model not available")
    
    def predict(self, 
               disease_type: DiseaseType, 
               symptoms: Dict[str, Any], 
               medical_images: Optional[List[str]] = None) -> Dict[str, Any]:
        """Make a prediction for a specific disease
        
        Args:
            disease_type: The type of disease to diagnose
            symptoms: Dictionary of patient symptoms
            medical_images: Optional list of medical image IDs
            
        Returns:
            Dictionary containing diagnosis results
        """
        if disease_type not in self.models:
            raise ValueError(f"Model for {disease_type} not available")
        
        # Call the specific disease model
        model = self.models[disease_type]
        result = model.predict(symptoms, medical_images)
        
        # Add metadata to the result
        result["disease_type"] = disease_type
        result["requires_specialist_review"] = self._check_if_specialist_needed(result)
        
        return result
    
    def predict_disease_type(self, 
                           symptoms: Dict[str, Any], 
                           medical_images: Optional[List[str]] = None) -> Tuple[DiseaseType, float]:
        """Predict the most likely disease type based on symptoms and images
        
        Args:
            symptoms: Dictionary of patient symptoms
            medical_images: Optional list of medical image IDs
            
        Returns:
            Tuple of (predicted disease type, confidence score)
        """
        # This would use a classifier to determine the disease type
        # For now, we'll use a simple rule-based approach
        
        # Example implementation (would be replaced with actual ML model)
        disease_scores = {}
        
        # Check for lung cancer indicators
        if "persistent_cough" in symptoms and symptoms["persistent_cough"] and \
           "chest_pain" in symptoms and symptoms["chest_pain"] and \
           "weight_loss" in symptoms and symptoms["weight_loss"]:
            disease_scores[DiseaseType.LUNG_CANCER] = 0.7
        else:
            disease_scores[DiseaseType.LUNG_CANCER] = 0.1
        
        # Check for malaria indicators
        if "fever" in symptoms and symptoms["fever"] and \
           "chills" in symptoms and symptoms["chills"] and \
           "sweating" in symptoms and symptoms["sweating"]:
            disease_scores[DiseaseType.MALARIA] = 0.8
        else:
            disease_scores[DiseaseType.MALARIA] = 0.1
        
        # Check for pneumonia indicators
        if "cough" in symptoms and symptoms["cough"] and \
           "fever" in symptoms and symptoms["fever"] and \
           "difficulty_breathing" in symptoms and symptoms["difficulty_breathing"]:
            disease_scores[DiseaseType.PNEUMONIA] = 0.75
        else:
            disease_scores[DiseaseType.PNEUMONIA] = 0.1
        
        # Check for tuberculosis indicators
        if "cough" in symptoms and symptoms["cough"] and \
           "blood_in_sputum" in symptoms and symptoms.get("blood_in_sputum", False) and \
           "night_sweats" in symptoms and symptoms.get("night_sweats", False):
            disease_scores[DiseaseType.TUBERCULOSIS] = 0.85
        else:
            disease_scores[DiseaseType.TUBERCULOSIS] = 0.1
        
        # Get the disease with the highest score
        predicted_disease = max(disease_scores.items(), key=lambda x: x[1])
        return predicted_disease[0], predicted_disease[1]
    
    def diagnose(self, 
                symptoms: Dict[str, Any], 
                medical_images: Optional[List[str]] = None, 
                disease_type: Optional[DiseaseType] = None) -> Dict[str, Any]:
        """Main diagnosis function
        
        Args:
            symptoms: Dictionary of patient symptoms
            medical_images: Optional list of medical image IDs
            disease_type: Optional disease type if already known
            
        Returns:
            Dictionary containing diagnosis results
        """
        # If disease type is not provided, predict it
        if disease_type is None:
            disease_type, confidence = self.predict_disease_type(symptoms, medical_images)
        
        # Get detailed diagnosis for the disease
        diagnosis = self.predict(disease_type, symptoms, medical_images)
        
        return diagnosis
    
    def _check_if_specialist_needed(self, result: Dict[str, Any]) -> bool:
        """Determine if specialist review is needed based on model confidence
        
        Args:
            result: The diagnosis result dictionary
            
        Returns:
            Boolean indicating if specialist review is needed
        """
        # If confidence is below threshold or certain critical symptoms are present
        if result.get("confidence", 0) < 0.7 or result.get("critical_indicators", False):
            return True
        return False

# Singleton instance
model_interface = ModelInterface()
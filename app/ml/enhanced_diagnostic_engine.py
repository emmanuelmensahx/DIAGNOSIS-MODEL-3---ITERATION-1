"""
Enhanced AI Diagnostic Engine for AfriDiag
Implements ensemble learning with confidence scoring and differential diagnosis
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
from sklearn.metrics import accuracy_score, classification_report
import joblib
import json
import logging
from pathlib import Path
from datetime import datetime

from app.data.diseases_registry import get_disease_registry, get_disease_by_code
from app.data.extended_diseases_database import get_complete_disease_database
from app.data.comprehensive_diseases_500 import get_diseases_by_symptoms
from app.db.models import DiseaseSeverity, DiseaseCategory

logger = logging.getLogger(__name__)

class EnhancedDiagnosticEngine:
    """
    Enhanced AI Diagnostic Engine using ensemble learning methods
    Provides confidence scoring and differential diagnosis capabilities
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or "models/enhanced_diagnostic_engine"
        self.models = {}
        self.ensemble_weights = {
            'random_forest': 0.4,
            'gradient_boost': 0.4, 
            'logistic_regression': 0.2
        }
        self.scaler = StandardScaler()
        self.feature_names = []
        self.disease_classes = []
        self.is_trained = False
        
        # Initialize individual models
        self._initialize_models()
        
        # Try to load existing models
        self._load_models()
    
    def _initialize_models(self):
        """Initialize the ensemble models"""
        self.models = {
            'random_forest': RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            ),
            'gradient_boost': GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            ),
            'logistic_regression': LogisticRegression(
                random_state=42,
                max_iter=1000,
                solver='liblinear'
            )
        }
        
        # Create voting classifier
        self.voting_classifier = VotingClassifier(
            estimators=[(name, model) for name, model in self.models.items()],
            voting='soft',
            weights=list(self.ensemble_weights.values())
        )
    
    def _load_models(self):
        """Load pre-trained models if they exist"""
        try:
            model_dir = Path(self.model_path)
            if model_dir.exists():
                # Load individual models
                for name in self.models.keys():
                    model_file = model_dir / f"{name}.joblib"
                    if model_file.exists():
                        self.models[name] = joblib.load(model_file)
                
                # Load voting classifier
                voting_file = model_dir / "voting_classifier.joblib"
                if voting_file.exists():
                    self.voting_classifier = joblib.load(voting_file)
                
                # Load scaler and metadata
                scaler_file = model_dir / "scaler.joblib"
                if scaler_file.exists():
                    self.scaler = joblib.load(scaler_file)
                
                metadata_file = model_dir / "metadata.json"
                if metadata_file.exists():
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                        self.feature_names = metadata.get('feature_names', [])
                        self.disease_classes = metadata.get('disease_classes', [])
                        self.is_trained = metadata.get('is_trained', False)
                
                logger.info(f"Loaded enhanced diagnostic models from {self.model_path}")
        except Exception as e:
            logger.warning(f"Could not load existing models: {e}")
            self.is_trained = False
    
    def prepare_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare synthetic training data from disease database
        In production, this would use real patient data
        """
        # Get disease registry (returns dict of disease_code -> disease_data)
        diseases_dict = get_disease_registry()
        
        # Create feature matrix and labels
        features = []
        labels = []
        
        # Get all unique symptoms across diseases
        all_symptoms = set()
        for disease_code, disease_data in diseases_dict.items():
            if 'common_symptoms' in disease_data:
                all_symptoms.update(disease_data['common_symptoms'])
            if 'specific_symptoms' in disease_data:
                all_symptoms.update(disease_data['specific_symptoms'])
        
        self.feature_names = sorted(list(all_symptoms))
        self.disease_classes = list(diseases_dict.keys())
        
        # Generate synthetic training samples
        for disease_code, disease_data in diseases_dict.items():
            disease_symptoms = []
            if 'common_symptoms' in disease_data:
                disease_symptoms.extend(disease_data['common_symptoms'])
            if 'specific_symptoms' in disease_data:
                disease_symptoms.extend(disease_data['specific_symptoms'])
            
            # Generate multiple samples per disease with variations
            for _ in range(50):  # 50 samples per disease
                feature_vector = np.zeros(len(self.feature_names))
                
                # Set symptoms for this disease (with some noise)
                for symptom in disease_symptoms:
                    if symptom in self.feature_names:
                        idx = self.feature_names.index(symptom)
                        # Add noise: 80% chance of having the symptom
                        if np.random.random() < 0.8:
                            feature_vector[idx] = np.random.uniform(0.7, 1.0)
                
                # Add some random symptoms (noise)
                num_random_symptoms = np.random.randint(0, 3)
                random_indices = np.random.choice(
                    len(self.feature_names), 
                    size=num_random_symptoms, 
                    replace=False
                )
                for idx in random_indices:
                    if feature_vector[idx] == 0:  # Don't override disease symptoms
                        feature_vector[idx] = np.random.uniform(0.1, 0.4)
                
                features.append(feature_vector)
                labels.append(disease_code)
        
        return np.array(features), np.array(labels)
    
    def train_ensemble(self, X: Optional[np.ndarray] = None, y: Optional[np.ndarray] = None):
        """Train the ensemble models"""
        try:
            if X is None or y is None:
                logger.info("Generating synthetic training data...")
                X, y = self.prepare_training_data()
            
            logger.info(f"Training ensemble with {X.shape[0]} samples and {X.shape[1]} features")
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train individual models
            for name, model in self.models.items():
                logger.info(f"Training {name}...")
                model.fit(X_scaled, y)
                
                # Calculate cross-validation score
                cv_scores = cross_val_score(model, X_scaled, y, cv=5)
                logger.info(f"{name} CV accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
            
            # Train voting classifier
            logger.info("Training voting classifier...")
            self.voting_classifier.fit(X_scaled, y)
            
            # Calculate ensemble accuracy
            ensemble_scores = cross_val_score(self.voting_classifier, X_scaled, y, cv=5)
            logger.info(f"Ensemble CV accuracy: {ensemble_scores.mean():.3f} (+/- {ensemble_scores.std() * 2:.3f})")
            
            self.is_trained = True
            self._save_models()
            
            logger.info("Enhanced diagnostic engine training completed successfully")
            
        except Exception as e:
            logger.error(f"Training failed: {e}")
            raise
    
    def predict_with_confidence(self, symptoms: List[str], 
                              patient_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make predictions with confidence scores and differential diagnosis
        """
        try:
            if not self.is_trained:
                logger.warning("Model not trained, using fallback prediction")
                return self._fallback_prediction(symptoms, patient_data)
            
            # Prepare feature vector
            feature_vector = self._prepare_feature_vector(symptoms)
            
            # Get predictions from all models
            predictions = {}
            probabilities = {}
            
            for name, model in self.models.items():
                pred = model.predict(feature_vector)[0]
                prob = model.predict_proba(feature_vector)[0]
                predictions[name] = pred
                probabilities[name] = prob
            
            # Ensemble prediction
            ensemble_prob = self.voting_classifier.predict_proba(feature_vector)[0]
            ensemble_pred = self.voting_classifier.predict(feature_vector)[0]
            
            # Calculate confidence score
            confidence = np.max(ensemble_prob)
            
            # Generate differential diagnoses
            differential_diagnoses = []
            top_indices = np.argsort(ensemble_prob)[::-1]  # Sort in descending order
            for i, idx in enumerate(top_indices[1:]):  # Skip top prediction
                disease_code = self.disease_classes[idx]
                disease_name = self._get_disease_name(disease_code)
                if disease_name:
                    differential_diagnoses.append({
                        'disease_code': disease_code,
                        'disease_name': disease_name,
                        'confidence': float(ensemble_prob[idx]),
                        'rank': i + 2
                    })
            
            # Get primary prediction details
            primary_disease_name = self._get_disease_name(ensemble_pred)
            
            # Calculate uncertainty metrics
            uncertainty_metrics = self._calculate_uncertainty(probabilities, ensemble_prob)
            
            result = {
                'disease_code': ensemble_pred,
                'disease_name': primary_disease_name or ensemble_pred,
                'diagnosis': primary_disease_name or ensemble_pred,
                'confidence': float(confidence),
                'uncertainty_score': uncertainty_metrics['uncertainty'],
                'model_agreement': uncertainty_metrics['agreement'],
                'differential_diagnoses': differential_diagnoses,
                'individual_predictions': {
                    name: {
                        'prediction': pred,
                        'confidence': float(np.max(prob))
                    }
                    for name, (pred, prob) in zip(predictions.keys(), 
                                                zip(predictions.values(), probabilities.values()))
                },
                'symptoms_analyzed': symptoms,
                'enhanced_ai': True,
                'prediction_timestamp': datetime.now().isoformat()
            }
            
            # Add clinical reasoning
            result['clinical_reasoning'] = self._generate_clinical_reasoning(
                result, symptoms, patient_data
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Enhanced prediction failed: {e}")
            return self._fallback_prediction(symptoms, patient_data)
    
    def _prepare_feature_vector(self, symptoms: List[str]) -> np.ndarray:
        """Convert symptoms to feature vector"""
        feature_vector = np.zeros(len(self.feature_names))
        
        for symptom in symptoms:
            symptom_lower = symptom.lower().strip()
            # Find matching features (exact or partial match)
            for i, feature_name in enumerate(self.feature_names):
                if (symptom_lower in feature_name.lower() or 
                    feature_name.lower() in symptom_lower):
                    feature_vector[i] = 1.0
        
        # Scale the feature vector
        feature_vector = self.scaler.transform(feature_vector.reshape(1, -1))
        return feature_vector
    
    def _get_disease_name(self, disease_code: str) -> Optional[str]:
        """Get disease name from either comprehensive database or disease registry"""
        try:
            # Try comprehensive database first
            from app.data.comprehensive_diseases_500 import get_disease_by_code
            disease = get_disease_by_code(disease_code)
            if disease and hasattr(disease, 'name'):
                return disease.name
        except (ImportError, Exception):
            pass
        
        # Fallback to disease registry
        try:
            disease_data = get_disease_registry().get(disease_code)
            if disease_data and 'name' in disease_data:
                return disease_data['name']
        except ImportError:
            pass
        
        # Final fallback: format the code as a title
        return disease_code.replace('_', ' ').title()
    
    def _calculate_uncertainty(self, individual_probs: Dict[str, np.ndarray], 
                             ensemble_prob: np.ndarray) -> Dict[str, float]:
        """Calculate uncertainty metrics"""
        # Entropy-based uncertainty
        entropy = -np.sum(ensemble_prob * np.log(ensemble_prob + 1e-10))
        max_entropy = np.log(len(ensemble_prob))
        uncertainty = entropy / max_entropy
        
        # Model agreement (how much models agree on top prediction)
        top_predictions = []
        for prob in individual_probs.values():
            top_predictions.append(np.argmax(prob))
        
        # Calculate agreement as percentage of models agreeing on top prediction
        most_common = max(set(top_predictions), key=top_predictions.count)
        agreement = top_predictions.count(most_common) / len(top_predictions)
        
        return {
            'uncertainty': float(uncertainty),
            'agreement': float(agreement)
        }
    
    def _generate_clinical_reasoning(self, prediction: Dict[str, Any], 
                                   symptoms: List[str], 
                                   patient_data: Optional[Dict[str, Any]]) -> str:
        """Generate clinical reasoning for the prediction"""
        reasoning_parts = []
        
        confidence = prediction['confidence']
        disease_name = prediction['disease_name']
        
        # Confidence interpretation
        if confidence > 0.8:
            reasoning_parts.append(f"High confidence diagnosis of {disease_name}")
        elif confidence > 0.6:
            reasoning_parts.append(f"Moderate confidence diagnosis of {disease_name}")
        else:
            reasoning_parts.append(f"Low confidence diagnosis of {disease_name}")
        
        # Model agreement
        agreement = prediction['model_agreement']
        if agreement > 0.8:
            reasoning_parts.append("Strong consensus among AI models")
        elif agreement > 0.6:
            reasoning_parts.append("Moderate consensus among AI models")
        else:
            reasoning_parts.append("Limited consensus among AI models - consider differential diagnoses")
        
        # Symptom analysis
        if len(symptoms) >= 3:
            reasoning_parts.append(f"Based on {len(symptoms)} reported symptoms")
        else:
            reasoning_parts.append("Limited symptom information - additional assessment recommended")
        
        # Differential diagnosis mention
        if len(prediction['differential_diagnoses']) > 0:
            top_alternative = prediction['differential_diagnoses'][0]
            reasoning_parts.append(f"Consider {top_alternative['disease_name']} as alternative diagnosis")
        
        return ". ".join(reasoning_parts) + "."
    
    def _fallback_prediction(self, symptoms: List[str], 
                           patient_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Fallback prediction when enhanced model is not available"""
        # Use existing comprehensive prediction as fallback
        from app.ml.prediction import predict_disease_comprehensive
        
        result = predict_disease_comprehensive(symptoms, patient_data)
        result.update({
            'enhanced_ai': False,
            'fallback_reason': 'Enhanced model not trained',
            'uncertainty_score': 0.5,
            'model_agreement': 0.0
        })
        
        return result
    
    def _save_models(self):
        """Save trained models to disk"""
        try:
            model_dir = Path(self.model_path)
            model_dir.mkdir(parents=True, exist_ok=True)
            
            # Save individual models
            for name, model in self.models.items():
                joblib.dump(model, model_dir / f"{name}.joblib")
            
            # Save voting classifier
            joblib.dump(self.voting_classifier, model_dir / "voting_classifier.joblib")
            
            # Save scaler
            joblib.dump(self.scaler, model_dir / "scaler.joblib")
            
            # Save metadata
            metadata = {
                'feature_names': self.feature_names,
                'disease_classes': self.disease_classes,
                'is_trained': self.is_trained,
                'training_timestamp': datetime.now().isoformat(),
                'ensemble_weights': self.ensemble_weights
            }
            
            with open(model_dir / "metadata.json", 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Models saved to {self.model_path}")
            
        except Exception as e:
            logger.error(f"Failed to save models: {e}")

# Global instance
enhanced_engine = EnhancedDiagnosticEngine()

def get_enhanced_prediction(symptoms: List[str], 
                          patient_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Main function to get enhanced AI predictions
    """
    return enhanced_engine.predict_with_confidence(symptoms, patient_data)

def train_enhanced_engine():
    """
    Train the enhanced diagnostic engine
    """
    enhanced_engine.train_ensemble()

def is_enhanced_engine_ready() -> bool:
    """
    Check if enhanced engine is trained and ready
    """
    return enhanced_engine.is_trained
"""
Enhanced text processing service for medical history analysis
Extracts symptoms, vital signs, and key medical information from free-text input
"""

import re
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class MedicalTextProcessor:
    """Enhanced text processor for medical history and symptom extraction"""
    
    def __init__(self):
        # Common medical terms and patterns
        self.symptom_patterns = {
            'fever': r'\b(?:fever|febrile|pyrexia|high temperature|temp|hot)\b',
            'cough': r'\b(?:cough|coughing|productive cough|dry cough|persistent cough)\b',
            'shortness_of_breath': r'\b(?:shortness of breath|dyspnea|dyspnoea|breathless|difficulty breathing|sob)\b',
            'chest_pain': r'\b(?:chest pain|chest discomfort|thoracic pain)\b',
            'headache': r'\b(?:headache|head pain|cephalgia|migraine)\b',
            'nausea': r'\b(?:nausea|nauseous|feeling sick|queasy)\b',
            'vomiting': r'\b(?:vomiting|vomit|throwing up|emesis)\b',
            'diarrhea': r'\b(?:diarrhea|diarrhoea|loose stools|watery stools)\b',
            'fatigue': r'\b(?:fatigue|tired|exhausted|weakness|weak|lethargic)\b',
            'weight_loss': r'\b(?:weight loss|lost weight|losing weight|dropped weight)\b',
            'night_sweats': r'\b(?:night sweats|sweating at night|nocturnal sweating)\b',
            'abdominal_pain': r'\b(?:abdominal pain|stomach pain|belly pain|tummy pain)\b',
            'joint_pain': r'\b(?:joint pain|arthralgia|aching joints)\b',
            'muscle_pain': r'\b(?:muscle pain|myalgia|aching muscles)\b',
            'rash': r'\b(?:rash|skin rash|eruption|spots)\b',
            'swelling': r'\b(?:swelling|swollen|edema|oedema)\b',
            'bleeding': r'\b(?:bleeding|blood|hemorrhage|haemorrhage)\b',
            'seizure': r'\b(?:seizure|convulsion|fit|epileptic)\b',
            'confusion': r'\b(?:confusion|confused|disoriented|altered mental state)\b'
        }
        
        self.vital_sign_patterns = {
            'temperature': r'\b(?:temp|temperature)[\s:]*(\d+\.?\d*)\s*(?:°?[cf]|celsius|fahrenheit)?\b',
            'blood_pressure': r'\b(?:bp|blood pressure)[\s:]*(\d+)\/(\d+)\s*(?:mmhg)?\b',
            'heart_rate': r'\b(?:hr|heart rate|pulse)[\s:]*(\d+)\s*(?:bpm|beats)?\b',
            'respiratory_rate': r'\b(?:rr|respiratory rate|breathing rate)[\s:]*(\d+)\s*(?:\/min|per minute)?\b',
            'oxygen_saturation': r'\b(?:o2 sat|oxygen saturation|spo2)[\s:]*(\d+)\s*%?\b'
        }
        
        self.duration_patterns = {
            'days': r'(\d+)\s*(?:days?|d)\b',
            'weeks': r'(\d+)\s*(?:weeks?|w)\b',
            'months': r'(\d+)\s*(?:months?|m)\b',
            'years': r'(\d+)\s*(?:years?|y)\b',
            'hours': r'(\d+)\s*(?:hours?|h)\b'
        }
        
        self.severity_patterns = {
            'mild': r'\b(?:mild|slight|minor|little)\b',
            'moderate': r'\b(?:moderate|medium|average)\b',
            'severe': r'\b(?:severe|serious|intense|extreme|bad|terrible)\b',
            'acute': r'\b(?:acute|sudden|rapid|quick)\b',
            'chronic': r'\b(?:chronic|persistent|ongoing|long-term)\b'
        }
    
    def extract_symptoms(self, text: str) -> List[str]:
        """Extract symptoms from medical text"""
        text_lower = text.lower()
        found_symptoms = []
        
        for symptom, pattern in self.symptom_patterns.items():
            if re.search(pattern, text_lower, re.IGNORECASE):
                found_symptoms.append(symptom.replace('_', ' '))
        
        return found_symptoms
    
    def extract_vital_signs(self, text: str) -> Dict[str, Any]:
        """Extract vital signs from medical text"""
        vital_signs = {}
        text_lower = text.lower()
        
        # Temperature
        temp_match = re.search(self.vital_sign_patterns['temperature'], text_lower, re.IGNORECASE)
        if temp_match:
            temp_value = float(temp_match.group(1))
            # Convert Fahrenheit to Celsius if needed
            if temp_value > 45:  # Likely Fahrenheit
                temp_value = (temp_value - 32) * 5/9
            vital_signs['temperature'] = round(temp_value, 1)
        
        # Blood pressure
        bp_match = re.search(self.vital_sign_patterns['blood_pressure'], text_lower, re.IGNORECASE)
        if bp_match:
            vital_signs['blood_pressure_systolic'] = int(bp_match.group(1))
            vital_signs['blood_pressure_diastolic'] = int(bp_match.group(2))
        
        # Heart rate
        hr_match = re.search(self.vital_sign_patterns['heart_rate'], text_lower, re.IGNORECASE)
        if hr_match:
            vital_signs['heart_rate'] = int(hr_match.group(1))
        
        # Respiratory rate
        rr_match = re.search(self.vital_sign_patterns['respiratory_rate'], text_lower, re.IGNORECASE)
        if rr_match:
            vital_signs['respiratory_rate'] = int(rr_match.group(1))
        
        # Oxygen saturation
        o2_match = re.search(self.vital_sign_patterns['oxygen_saturation'], text_lower, re.IGNORECASE)
        if o2_match:
            vital_signs['oxygen_saturation'] = int(o2_match.group(1))
        
        return vital_signs
    
    def extract_duration(self, text: str) -> Optional[str]:
        """Extract symptom duration from text"""
        text_lower = text.lower()
        
        # Look for duration patterns
        for unit, pattern in self.duration_patterns.items():
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                value = int(match.group(1))
                return f"{value} {unit}"
        
        # Look for relative time expressions
        if re.search(r'\b(?:yesterday|last night)\b', text_lower):
            return "1 day"
        elif re.search(r'\b(?:this morning|today)\b', text_lower):
            return "< 1 day"
        elif re.search(r'\b(?:last week)\b', text_lower):
            return "1 week"
        elif re.search(r'\b(?:few days)\b', text_lower):
            return "2-3 days"
        elif re.search(r'\b(?:few weeks)\b', text_lower):
            return "2-3 weeks"
        
        return None
    
    def extract_severity(self, text: str) -> Optional[str]:
        """Extract symptom severity from text"""
        text_lower = text.lower()
        
        for severity, pattern in self.severity_patterns.items():
            if re.search(pattern, text_lower, re.IGNORECASE):
                return severity
        
        return None
    
    def extract_patient_demographics(self, text: str) -> Dict[str, Any]:
        """Extract patient demographic information from text"""
        demographics = {}
        text_lower = text.lower()
        
        # Age extraction
        age_patterns = [
            r'\b(\d+)\s*(?:years?|yr|y)\s*old\b',
            r'\bage[\s:]*(\d+)\b',
            r'\b(\d+)\s*(?:year old|yr old)\b'
        ]
        
        for pattern in age_patterns:
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                demographics['age'] = int(match.group(1))
                break
        
        # Gender extraction
        if re.search(r'\b(?:male|man|boy|gentleman|mr)\b', text_lower):
            demographics['gender'] = 'male'
        elif re.search(r'\b(?:female|woman|girl|lady|mrs|ms)\b', text_lower):
            demographics['gender'] = 'female'
        
        return demographics
    
    def extract_allergies(self, text: str) -> Optional[str]:
        """Extract allergy information from text"""
        text_lower = text.lower()
        
        # Look for allergy mentions
        allergy_patterns = [
            r'allergic to ([^.]+)',
            r'allergy to ([^.]+)',
            r'allergies:?\s*([^.]+)',
            r'drug allergies?:?\s*([^.]+)'
        ]
        
        for pattern in allergy_patterns:
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        if re.search(r'\b(?:no allergies|no known allergies|nka|nkda)\b', text_lower):
            return "No known allergies"
        
        return None
    
    def analyze_medical_text(self, text: str) -> Dict[str, Any]:
        """Comprehensive analysis of medical text"""
        if not text or not text.strip():
            return {}
        
        analysis = {
            'symptoms': self.extract_symptoms(text),
            'vital_signs': self.extract_vital_signs(text),
            'duration': self.extract_duration(text),
            'severity': self.extract_severity(text),
            'demographics': self.extract_patient_demographics(text),
            'allergies': self.extract_allergies(text),
            'original_text': text.strip()
        }
        
        # Remove empty values
        return {k: v for k, v in analysis.items() if v}
    
    def enhance_emergency_diagnosis_data(self, medical_history: str, 
                                       existing_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Enhance emergency diagnosis data with extracted information"""
        if existing_data is None:
            existing_data = {}
        
        # Analyze the medical history text
        extracted = self.analyze_medical_text(medical_history)
        
        # Merge extracted data with existing data (existing data takes precedence)
        enhanced_data = existing_data.copy()
        
        # Add extracted symptoms if not already provided
        if not enhanced_data.get('symptoms') and extracted.get('symptoms'):
            enhanced_data['symptoms'] = ', '.join(extracted['symptoms'])
        
        # Add extracted vital signs if not already provided
        if extracted.get('vital_signs'):
            for key, value in extracted['vital_signs'].items():
                if not enhanced_data.get(key):
                    enhanced_data[key] = value
        
        # Add other extracted information
        if not enhanced_data.get('symptom_duration') and extracted.get('duration'):
            enhanced_data['symptom_duration'] = extracted['duration']
        
        if not enhanced_data.get('allergies') and extracted.get('allergies'):
            enhanced_data['allergies'] = extracted['allergies']
        
        # Add demographic information
        if extracted.get('demographics'):
            for key, value in extracted['demographics'].items():
                field_name = f'patient_{key}'
                if not enhanced_data.get(field_name):
                    enhanced_data[field_name] = value
        
        # Add severity assessment
        if extracted.get('severity'):
            enhanced_data['symptom_severity'] = extracted['severity']
        
        return enhanced_data

# Global instance
medical_text_processor = MedicalTextProcessor()
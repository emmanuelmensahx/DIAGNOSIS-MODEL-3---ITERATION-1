from typing import Dict, List, Any
from enum import Enum

class DiseaseType(Enum):
    TUBERCULOSIS = "tuberculosis"
    LUNG_CANCER = "lung_cancer"
    MALARIA = "malaria"
    PNEUMONIA = "pneumonia"

class MedicalPromptTemplates:
    """Medical prompt templates for disease-specific LLM analysis"""
    
    @staticmethod
    def get_emergency_diagnosis_prompt(medical_history: str, additional_data: Dict[str, Any] = None) -> str:
        """Emergency diagnosis prompt for free-text medical history input"""
        base = MedicalPromptTemplates.get_base_prompt()
        
        additional_info = ""
        if additional_data:
            if additional_data.get('vital_signs'):
                additional_info += f"\n**VITAL SIGNS:** {additional_data['vital_signs']}"
            if additional_data.get('allergies'):
                additional_info += f"\n**ALLERGIES:** {additional_data['allergies']}"
            if additional_data.get('symptom_duration'):
                additional_info += f"\n**SYMPTOM DURATION:** {additional_data['symptom_duration']}"
            if additional_data.get('patient_demographics'):
                additional_info += f"\n**PATIENT INFO:** {additional_data['patient_demographics']}"
        
        return f"""{base}

**EMERGENCY DIAGNOSIS ASSESSMENT:**
You are analyzing a medical case for emergency diagnosis. Extract key information from the provided medical history and provide a comprehensive assessment.

**MEDICAL HISTORY PROVIDED:**
{medical_history}
{additional_info}

**ANALYSIS REQUIREMENTS:**
1. **Primary Diagnosis:** Most likely condition based on the presentation
2. **Differential Diagnoses:** List 3-5 alternative diagnoses to consider
3. **Confidence Level:** Rate your confidence (0-100%) in the primary diagnosis
4. **Risk Assessment:** Immediate, short-term, and long-term risks
5. **Red Flags:** Any concerning symptoms requiring immediate attention
6. **Recommended Actions:** Immediate interventions, tests, and treatments
7. **Clinical Reasoning:** Explain your diagnostic reasoning process
8. **Emergency Treatment Plan:** Immediate treatment recommendations with medications and dosages
9. **Patient Education:** Critical information to communicate to patient/family
10. **Follow-up Instructions:** Specific follow-up care and monitoring requirements

**FOCUS AREAS:**
- Extract and analyze symptoms from the narrative
- Identify relevant medical history and risk factors
- Consider common diseases in African healthcare settings
- Prioritize life-threatening conditions
- Provide actionable recommendations for resource-limited settings

**OUTPUT FORMAT:** Provide a structured JSON response with the above analysis points.
"""
    
    @staticmethod
    def get_comprehensive_diagnosis_prompt(symptoms: List[str], patient_data: Dict[str, Any], medical_history: str = "") -> str:
        """Comprehensive diagnostic prompt that uses all patient data for primary diagnosis"""
        base = MedicalPromptTemplates.get_base_prompt()
        
        # Format patient demographics
        demographics = ""
        if patient_data:
            age = patient_data.get('age', 'Unknown')
            gender = patient_data.get('gender', 'Unknown')
            region = patient_data.get('region', 'Sub-Saharan Africa')
            demographics = f"Age: {age}, Gender: {gender}, Region: {region}"
        
        # Format vital signs
        vitals = ""
        if patient_data:
            vital_signs = []
            if patient_data.get('temperature'):
                vital_signs.append(f"Temperature: {patient_data['temperature']}°C")
            if patient_data.get('heart_rate'):
                vital_signs.append(f"Heart Rate: {patient_data['heart_rate']} bpm")
            if patient_data.get('blood_pressure'):
                vital_signs.append(f"Blood Pressure: {patient_data['blood_pressure']}")
            if patient_data.get('respiratory_rate'):
                vital_signs.append(f"Respiratory Rate: {patient_data['respiratory_rate']}")
            if patient_data.get('oxygen_saturation'):
                vital_signs.append(f"Oxygen Saturation: {patient_data['oxygen_saturation']}%")
            vitals = ", ".join(vital_signs) if vital_signs else "Not provided"
        
        # Format symptoms
        symptoms_text = ", ".join(symptoms) if symptoms else "No specific symptoms reported"
        
        return f"""{base}

**COMPREHENSIVE MEDICAL DIAGNOSIS REQUEST:**

**PATIENT INFORMATION:**
- Demographics: {demographics}
- Vital Signs: {vitals}
- Medical History: {medical_history if medical_history else "No significant medical history provided"}

**PRESENTING SYMPTOMS:**
{symptoms_text}

**DIAGNOSTIC TASK:**
As the primary diagnostic engine, analyze ALL the provided patient data to determine the most likely diagnosis. Do not rely solely on symptom matching - consider the complete clinical picture including demographics, vital signs, medical history, and epidemiological factors.

**REQUIRED ANALYSIS:**
1. **Primary Diagnosis:** Most likely condition based on the complete clinical picture
2. **Confidence Score:** Your confidence level (0.0-1.0) in this diagnosis
3. **Clinical Reasoning:** Detailed explanation of your diagnostic reasoning
4. **Differential Diagnoses:** List 3-5 alternative diagnoses with confidence scores
5. **Risk Stratification:** Assess urgency (low/medium/high/critical)
6. **Recommended Actions:** Immediate interventions, diagnostic tests, and treatment
7. **Red Flags:** Any concerning findings requiring immediate attention
8. **Treatment Plan:** Comprehensive treatment recommendations including medications, dosages, and duration
9. **Patient Education:** Key points to educate the patient about their condition
10. **Follow-up Care:** Specific follow-up schedule and monitoring requirements

**SPECIAL CONSIDERATIONS:**
- Consider diseases common in sub-Saharan Africa (malaria, TB, HIV-related conditions, etc.)
- Account for age and gender-specific conditions
- Evaluate vital signs for severity assessment
- Consider chronic conditions like diabetes, hypertension
- Think about infectious vs non-infectious causes
- Consider nutritional and environmental factors

**OUTPUT FORMAT:** 
Provide a structured JSON response with the following format:
{{
    "primary_diagnosis": {{
        "disease_name": "string",
        "disease_code": "string (ICD-10 if available)",
        "confidence": 0.0-1.0,
        "category": "infectious/chronic/acute/emergency/etc"
    }},
    "clinical_reasoning": "detailed explanation",
    "differential_diagnoses": [
        {{
            "disease_name": "string",
            "confidence": 0.0-1.0,
            "reasoning": "brief explanation"
        }}
    ],
    "risk_level": "low/medium/high/critical",
    "recommended_actions": [
        "immediate action 1",
        "diagnostic test 2",
        "treatment 3"
    ],
    "red_flags": ["concerning finding 1", "concerning finding 2"],
    "treatment_plan": {{
        "medications": [
            {{
                "name": "medication name",
                "dosage": "dosage and frequency",
                "duration": "treatment duration",
                "instructions": "special instructions"
            }}
        ],
        "non_pharmacological": [
            "lifestyle modification 1",
            "therapy recommendation 2"
        ],
        "monitoring": [
            "parameter to monitor 1",
            "parameter to monitor 2"
        ]
    }},
    "patient_education": [
        "key education point 1",
        "key education point 2",
        "warning signs to watch for"
    ],
    "follow_up": {{
        "timeline": "recommended follow-up timeline",
        "specific_appointments": [
            "appointment type 1 in X days/weeks",
            "appointment type 2 in X days/weeks"
        ],
        "emergency_criteria": [
            "when to seek immediate care 1",
            "when to seek immediate care 2"
        ]
    }}
}}
"""

    @staticmethod
    def get_base_prompt() -> str:
        """Base medical prompt with African healthcare context"""
        return """You are an expert medical AI assistant specializing in healthcare for rural African populations. 
You have extensive knowledge of tropical diseases, resource-limited settings, and culturally appropriate care.

IMPORTANT GUIDELINES:
- Consider the epidemiology of diseases common in sub-Saharan Africa
- Account for limited diagnostic resources in rural settings
- Provide practical, cost-effective recommendations
- Consider cultural factors and traditional medicine practices
- Prioritize immediate life-threatening conditions
- Use clear, simple language for frontline healthcare workers
"""
    
    @staticmethod
    def get_tuberculosis_prompt(symptoms: List[str], patient_data: Dict[str, Any], medical_history: str = "") -> str:
        """Specialized prompt for tuberculosis diagnosis"""
        base = MedicalPromptTemplates.get_base_prompt()
        
        specific_context = """
**TUBERCULOSIS ASSESSMENT CONTEXT:**
- TB is endemic in sub-Saharan Africa with high HIV co-infection rates
- Consider both pulmonary and extrapulmonary TB presentations
- Drug-resistant TB (MDR-TB, XDR-TB) is a growing concern
- Malnutrition and HIV significantly increase TB risk
- Traditional symptoms may be masked in immunocompromised patients

**KEY DIFFERENTIAL DIAGNOSES TO CONSIDER:**
- Pneumonia (bacterial, viral, fungal)
- Lung cancer (especially in smokers)
- HIV-related opportunistic infections
- Chronic obstructive pulmonary disease (COPD)
- Bronchiectasis
- Lung abscess

**CRITICAL RED FLAGS:**
- Hemoptysis (coughing blood)
- Severe weight loss (>10% body weight)
- Night sweats with fever >3 weeks
- Progressive dyspnea
- Signs of TB meningitis or miliary TB
"""
        
        return MedicalPromptTemplates._format_prompt(
            base, specific_context, "tuberculosis", symptoms, patient_data, medical_history
        )
    
    @staticmethod
    def get_malaria_prompt(symptoms: List[str], patient_data: Dict[str, Any], medical_history: str = "") -> str:
        """Specialized prompt for malaria diagnosis"""
        base = MedicalPromptTemplates.get_base_prompt()
        
        specific_context = """
**MALARIA ASSESSMENT CONTEXT:**
- Malaria is hyperendemic in many African regions
- P. falciparum is the most dangerous species
- Seasonal patterns affect transmission intensity
- Pregnancy and children <5 years are high-risk groups
- Rapid diagnostic tests (RDTs) may not be available

**KEY DIFFERENTIAL DIAGNOSES TO CONSIDER:**
- Typhoid fever
- Viral infections (dengue, chikungunya)
- Bacterial sepsis
- Meningitis
- Pneumonia
- Gastroenteritis
- Urinary tract infection

**CRITICAL RED FLAGS:**
- Altered consciousness or seizures
- Severe anemia (Hb <5g/dL)
- Respiratory distress
- Hypoglycemia
- Jaundice with dark urine
- Bleeding or coagulation disorders
- Shock or circulatory collapse
"""
        
        return MedicalPromptTemplates._format_prompt(
            base, specific_context, "malaria", symptoms, patient_data, medical_history
        )
    
    @staticmethod
    def get_pneumonia_prompt(symptoms: List[str], patient_data: Dict[str, Any], medical_history: str = "") -> str:
        """Specialized prompt for pneumonia diagnosis"""
        base = MedicalPromptTemplates.get_base_prompt()
        
        specific_context = """
**PNEUMONIA ASSESSMENT CONTEXT:**
- Community-acquired pneumonia is common in all age groups
- HIV increases risk of atypical pneumonia (PCP, TB)
- Malnutrition predisposes to severe pneumonia
- Limited access to chest X-rays in rural settings
- High mortality in elderly and immunocompromised

**KEY DIFFERENTIAL DIAGNOSES TO CONSIDER:**
- Tuberculosis (especially in HIV+ patients)
- Malaria (can present with respiratory symptoms)
- Bronchitis or bronchiolitis
- Lung abscess
- Pleural effusion or empyema
- Congestive heart failure
- Pulmonary embolism

**CRITICAL RED FLAGS:**
- Severe respiratory distress (RR >30/min)
- Cyanosis or oxygen saturation <90%
- Altered mental status
- Hypotension or shock
- Multilobar involvement
- Sepsis syndrome
- Inability to maintain oral intake
"""
        
        return MedicalPromptTemplates._format_prompt(
            base, specific_context, "pneumonia", symptoms, patient_data, medical_history
        )
    
    @staticmethod
    def get_lung_cancer_prompt(symptoms: List[str], patient_data: Dict[str, Any], medical_history: str = "") -> str:
        """Specialized prompt for lung cancer diagnosis"""
        base = MedicalPromptTemplates.get_base_prompt()
        
        specific_context = """
**LUNG CANCER ASSESSMENT CONTEXT:**
- Lung cancer incidence is rising in Africa due to smoking and air pollution
- Late presentation is common due to limited screening
- Squamous cell carcinoma is most common type
- Often confused with tuberculosis in endemic areas
- Limited access to advanced diagnostic imaging

**KEY DIFFERENTIAL DIAGNOSES TO CONSIDER:**
- Tuberculosis (most important differential)
- Pneumonia (recurrent or persistent)
- Lung abscess
- Bronchiectasis
- Chronic obstructive pulmonary disease
- Pleural effusion (malignant vs. infectious)
- Metastatic disease from other primary sites

**CRITICAL RED FLAGS:**
- Hemoptysis with weight loss
- Progressive dyspnea over weeks/months
- Chest pain with pleural involvement
- Superior vena cava syndrome
- Bone pain (possible metastases)
- Neurological symptoms (brain metastases)
- Hypercalcemia or other paraneoplastic syndromes
"""
        
        return MedicalPromptTemplates._format_prompt(
            base, specific_context, "lung_cancer", symptoms, patient_data, medical_history
        )
    
    @staticmethod
    def _format_prompt(base: str, specific_context: str, disease_type: str, 
                      symptoms: List[str], patient_data: Dict[str, Any], medical_history: str) -> str:
        """Format the complete medical prompt"""
        
        # Extract patient demographics
        age = patient_data.get('age', 'Not specified')
        gender = patient_data.get('gender', 'Not specified')
        location = patient_data.get('location', 'Rural Africa')
        
        # Extract clinical data
        vital_signs = patient_data.get('vital_signs', 'Not available')
        lab_results = patient_data.get('lab_results', 'Not available')
        symptom_duration = patient_data.get('symptom_duration', 'Not specified')
        
        # Format symptoms
        symptoms_text = ', '.join(symptoms) if symptoms else 'No specific symptoms listed'
        
        # Format medical history
        history_text = medical_history if medical_history.strip() else 'No previous medical history provided'
        
        prompt = f"""{base}

{specific_context}

**PATIENT INFORMATION:**
- Age: {age}
- Gender: {gender}
- Location: {location}

**PRESENTING SYMPTOMS:**
{symptoms_text}

**CLINICAL DATA:**
- Vital Signs: {vital_signs}
- Laboratory Results: {lab_results}
- Duration of Symptoms: {symptom_duration}

**MEDICAL HISTORY:**
{history_text}

**ANALYSIS REQUEST:**
Provide a comprehensive medical assessment for suspected {disease_type}. Include:

1. **Primary Assessment**: Most likely diagnosis based on clinical presentation
2. **Differential Diagnoses**: List 3-5 alternative conditions to consider
3. **Risk Stratification**: Classify as low, moderate, high, or critical risk
4. **Confidence Level**: Your diagnostic confidence (0.0-1.0 scale)
5. **Recommended Investigations**: Prioritized list of tests/examinations
6. **Immediate Management**: First-line treatment recommendations
7. **Red Flag Symptoms**: Warning signs requiring urgent referral
8. **Follow-up Plan**: Monitoring schedule and next steps
9. **Patient Education**: Key points for patient/family counseling
10. **Referral Criteria**: When to refer to higher level of care

**CRITICAL REQUIREMENTS:**
- You MUST provide a SPECIFIC primary diagnosis (e.g., "Type 2 Diabetes Mellitus", "Community-Acquired Pneumonia", "Pulmonary Tuberculosis")
- NEVER use vague terms like "Multiple Conditions Possible", "Requires further evaluation", or "Various conditions"
- You MUST provide at least 3 specific differential diagnoses
- Your confidence score must reflect your actual diagnostic certainty
- All recommendations must be actionable and specific

**RESPONSE FORMAT:**
Respond in valid JSON format with this exact structure:
{{
  "primary_diagnosis": "SPECIFIC MEDICAL CONDITION NAME (e.g., 'Type 2 Diabetes Mellitus', 'Community-Acquired Pneumonia')",
  "differential_diagnoses": ["specific_condition_1", "specific_condition_2", "specific_condition_3", "specific_condition_4"],
  "risk_level": "low|moderate|high|critical",
  "confidence_score": 0.75,
  "recommended_investigations": ["specific_test_1", "specific_test_2", "specific_test_3"],
  "immediate_management": ["specific_treatment_1", "specific_treatment_2", "specific_treatment_3"],
  "red_flags": ["specific_warning_1", "specific_warning_2", "specific_warning_3"],
  "follow_up_plan": "detailed follow-up instructions with specific timeframes",
  "patient_education": ["specific_education_point_1", "specific_education_point_2"],
  "referral_criteria": ["specific_criteria_1", "specific_criteria_2"],
  "clinical_reasoning": "detailed explanation of why you chose this specific primary diagnosis over the differentials",
  "cultural_considerations": "relevant cultural factors for this patient",
  "resource_limitations": "adaptations for resource-limited settings"
}}

Ensure all recommendations are appropriate for rural African healthcare settings with limited resources."""
        
        return prompt
    
    @staticmethod
    def get_gastroenteritis_prompt(symptoms: List[str], patient_data: Dict[str, Any], medical_history: str = "") -> str:
        """Specialized prompt for gastroenteritis diagnosis"""
        base = MedicalPromptTemplates.get_base_prompt()
        
        specific_context = """
**GASTROENTERITIS ASSESSMENT CONTEXT:**
- Gastroenteritis is common in areas with poor sanitation
- Dehydration is the primary concern, especially in children
- Viral, bacterial, and parasitic causes are common
- Rotavirus is a leading cause in children under 5
- Cholera outbreaks can occur in endemic areas

**KEY DIFFERENTIAL DIAGNOSES TO CONSIDER:**
- Viral gastroenteritis (rotavirus, norovirus)
- Bacterial gastroenteritis (E. coli, Salmonella, Shigella)
- Parasitic infections (Giardia, Cryptosporidium)
- Food poisoning
- Cholera (in endemic areas)
- Appendicitis (especially with right lower quadrant pain)
- Inflammatory bowel disease

**CRITICAL RED FLAGS:**
- Severe dehydration (sunken eyes, poor skin turgor)
- Blood in stool with fever
- Severe abdominal pain
- Signs of shock or circulatory collapse
- Persistent vomiting preventing oral rehydration
- High fever with altered consciousness
"""
        
        return MedicalPromptTemplates._format_prompt(
            base, specific_context, "gastroenteritis", symptoms, patient_data, medical_history
        )
    
    @staticmethod
    def get_appendicitis_prompt(symptoms: List[str], patient_data: Dict[str, Any], medical_history: str = "") -> str:
        """Specialized prompt for appendicitis diagnosis"""
        base = MedicalPromptTemplates.get_base_prompt()
        
        specific_context = """
**APPENDICITIS ASSESSMENT CONTEXT:**
- Appendicitis is a surgical emergency requiring immediate intervention
- Classic presentation may be atypical in children and elderly
- Delayed diagnosis can lead to perforation and peritonitis
- Limited surgical facilities may require urgent referral
- High mortality if untreated

**KEY DIFFERENTIAL DIAGNOSES TO CONSIDER:**
- Gastroenteritis
- Urinary tract infection
- Ovarian cyst or torsion (in females)
- Ectopic pregnancy (in women of childbearing age)
- Mesenteric lymphadenitis
- Inflammatory bowel disease
- Peptic ulcer disease

**CRITICAL RED FLAGS:**
- Right lower quadrant pain with rebound tenderness
- Fever with increasing abdominal pain
- Nausea and vomiting with abdominal pain
- Signs of peritonitis (rigid abdomen)
- Elevated white blood cell count
- McBurney's point tenderness
"""
        
        return MedicalPromptTemplates._format_prompt(
            base, specific_context, "appendicitis", symptoms, patient_data, medical_history
        )
    
    @staticmethod
    def get_cholecystitis_prompt(symptoms: List[str], patient_data: Dict[str, Any], medical_history: str = "") -> str:
        """Specialized prompt for cholecystitis diagnosis"""
        base = MedicalPromptTemplates.get_base_prompt()
        
        specific_context = """
**CHOLECYSTITIS ASSESSMENT CONTEXT:**
- Acute cholecystitis often requires surgical intervention
- More common in women and patients with gallstones
- Can progress to gallbladder perforation or sepsis
- Murphy's sign is a key diagnostic indicator
- Limited ultrasound availability may complicate diagnosis

**KEY DIFFERENTIAL DIAGNOSES TO CONSIDER:**
- Peptic ulcer disease
- Pancreatitis
- Hepatitis
- Right lower lobe pneumonia
- Myocardial infarction (especially in elderly)
- Appendicitis
- Kidney stones

**CRITICAL RED FLAGS:**
- Right upper quadrant pain with Murphy's sign
- Fever with jaundice (Charcot's triad)
- Severe abdominal pain radiating to back
- Signs of sepsis or shock
- Persistent vomiting
- Palpable gallbladder mass
"""
        
        return MedicalPromptTemplates._format_prompt(
            base, specific_context, "cholecystitis", symptoms, patient_data, medical_history
        )
    
    @staticmethod
    def get_measles_prompt(symptoms: List[str], patient_data: Dict[str, Any], medical_history: str = "") -> str:
        """Specialized prompt for measles diagnosis"""
        base = MedicalPromptTemplates.get_base_prompt()
        
        specific_context = """
**MEASLES ASSESSMENT CONTEXT:**
- Measles is highly contagious and can cause serious complications
- Vaccination coverage gaps can lead to outbreaks
- Complications include pneumonia, encephalitis, and death
- Vitamin A deficiency increases severity
- Isolation and contact tracing are essential

**KEY DIFFERENTIAL DIAGNOSES TO CONSIDER:**
- Rubella (German measles)
- Roseola infantum
- Scarlet fever
- Drug rash
- Kawasaki disease
- Viral exanthem
- Dengue fever

**CRITICAL RED FLAGS:**
- High fever with characteristic rash
- Koplik's spots in mouth
- Cough, coryza, and conjunctivitis (3 C's)
- Complications: pneumonia, encephalitis
- Severe diarrhea and dehydration
- Secondary bacterial infections
"""
        
        return MedicalPromptTemplates._format_prompt(
            base, specific_context, "measles", symptoms, patient_data, medical_history
        )
    
    @staticmethod
    def get_rsv_prompt(symptoms: List[str], patient_data: Dict[str, Any], medical_history: str = "") -> str:
        """Specialized prompt for RSV (Respiratory Syncytial Virus) diagnosis"""
        base = MedicalPromptTemplates.get_base_prompt()
        
        specific_context = """
**RSV ASSESSMENT CONTEXT:**
- RSV is a leading cause of bronchiolitis in infants
- Most severe in children under 2 years
- Can cause respiratory failure requiring ventilation
- Seasonal patterns with winter peaks
- High transmission rate in households

**KEY DIFFERENTIAL DIAGNOSES TO CONSIDER:**
- Bronchiolitis from other viruses
- Pneumonia (bacterial or viral)
- Asthma exacerbation
- Pertussis (whooping cough)
- Congenital heart disease
- Foreign body aspiration
- Cystic fibrosis

**CRITICAL RED FLAGS:**
- Severe respiratory distress in infants
- Apnea episodes
- Poor feeding and dehydration
- Cyanosis or oxygen saturation <90%
- Grunting respirations
- Intercostal retractions
- Lethargy or irritability
"""
        
        return MedicalPromptTemplates._format_prompt(
            base, specific_context, "rsv", symptoms, patient_data, medical_history
        )

    @staticmethod
    def get_prompt_for_disease(disease_type: str, symptoms: List[str], 
                              patient_data: Dict[str, Any], medical_history: str = "") -> str:
        """Get the appropriate prompt template for a specific disease"""
        
        disease_type_lower = disease_type.lower()
        
        # Original diseases
        if disease_type_lower == "tuberculosis":
            return MedicalPromptTemplates.get_tuberculosis_prompt(symptoms, patient_data, medical_history)
        elif disease_type_lower == "malaria":
            return MedicalPromptTemplates.get_malaria_prompt(symptoms, patient_data, medical_history)
        elif disease_type_lower == "pneumonia":
            return MedicalPromptTemplates.get_pneumonia_prompt(symptoms, patient_data, medical_history)
        elif disease_type_lower == "lung_cancer":
            return MedicalPromptTemplates.get_lung_cancer_prompt(symptoms, patient_data, medical_history)
        
        # Gastrointestinal diseases
        elif disease_type_lower == "gastroenteritis":
            return MedicalPromptTemplates.get_gastroenteritis_prompt(symptoms, patient_data, medical_history)
        elif disease_type_lower == "appendicitis":
            return MedicalPromptTemplates.get_appendicitis_prompt(symptoms, patient_data, medical_history)
        elif disease_type_lower == "cholecystitis":
            return MedicalPromptTemplates.get_cholecystitis_prompt(symptoms, patient_data, medical_history)
        elif disease_type_lower in ["peptic_ulcer", "peptic_ulcer_disease"]:
            return MedicalPromptTemplates._format_prompt(
                MedicalPromptTemplates.get_base_prompt(),
                """**PEPTIC ULCER DISEASE ASSESSMENT:** Focus on H. pylori infection, NSAID use, and complications like bleeding or perforation.""",
                "peptic_ulcer_disease",
                symptoms,
                patient_data,
                medical_history
            )
        elif disease_type_lower == "ulcerative_colitis":
            return MedicalPromptTemplates._format_prompt(
                MedicalPromptTemplates.get_base_prompt(),
                """**ULCERATIVE COLITIS ASSESSMENT:** Consider inflammatory bowel disease with bloody diarrhea and potential complications.""",
                "ulcerative_colitis",
                symptoms,
                patient_data,
                medical_history
            )
        elif disease_type_lower in ["hepatitis_a", "hepatitis"]:
            return MedicalPromptTemplates._format_prompt(
                MedicalPromptTemplates.get_base_prompt(),
                """**HEPATITIS A ASSESSMENT:** Focus on viral hepatitis with jaundice, poor sanitation exposure, and supportive care.""",
                "hepatitis_a",
                symptoms,
                patient_data,
                medical_history
            )
        
        # Pediatric diseases
        elif disease_type_lower == "measles":
            return MedicalPromptTemplates.get_measles_prompt(symptoms, patient_data, medical_history)
        elif disease_type_lower == "rsv":
            return MedicalPromptTemplates.get_rsv_prompt(symptoms, patient_data, medical_history)
        elif disease_type_lower == "mumps":
            return MedicalPromptTemplates._format_prompt(
                MedicalPromptTemplates.get_base_prompt(),
                """**MUMPS ASSESSMENT:** Focus on parotid gland swelling, complications like orchitis or meningitis, and vaccination status.""",
                "mumps",
                symptoms,
                patient_data,
                medical_history
            )
        elif disease_type_lower == "chickenpox":
            return MedicalPromptTemplates._format_prompt(
                MedicalPromptTemplates.get_base_prompt(),
                """**CHICKENPOX ASSESSMENT:** Consider varicella-zoster virus with characteristic vesicular rash and potential complications.""",
                "chickenpox",
                symptoms,
                patient_data,
                medical_history
            )
        elif disease_type_lower in ["rotavirus", "rotavirus_gastroenteritis"]:
            return MedicalPromptTemplates._format_prompt(
                MedicalPromptTemplates.get_base_prompt(),
                """**ROTAVIRUS GASTROENTERITIS ASSESSMENT:** Focus on severe diarrhea in children, dehydration risk, and supportive care.""",
                "rotavirus_gastroenteritis",
                symptoms,
                patient_data,
                medical_history
            )
        elif disease_type_lower in ["whooping_cough", "pertussis"]:
            return MedicalPromptTemplates._format_prompt(
                MedicalPromptTemplates.get_base_prompt(),
                """**WHOOPING COUGH ASSESSMENT:** Consider Bordetella pertussis with characteristic paroxysmal cough and vaccination status.""",
                "whooping_cough",
                symptoms,
                patient_data,
                medical_history
            )
        else:
            # Fallback to general medical prompt
            return MedicalPromptTemplates._format_prompt(
                MedicalPromptTemplates.get_base_prompt(),
                f"**GENERAL MEDICAL ASSESSMENT for {disease_type.upper()}:**\nProvide comprehensive medical analysis for this condition in the context of African healthcare settings.",
                disease_type,
                symptoms,
                patient_data,
                medical_history
            )

# Convenience function for easy import
def get_medical_prompt(disease_type: str, symptoms: List[str], 
                      patient_data: Dict[str, Any], medical_history: str = "") -> str:
    """Get medical prompt for disease-specific analysis"""
    return MedicalPromptTemplates.get_prompt_for_disease(disease_type, symptoms, patient_data, medical_history)
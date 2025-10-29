from typing import Dict, List, Optional
import sys
import os

try:
    from app.data.comprehensive_diseases_500 import (
        COMPREHENSIVE_DISEASES_DATABASE, 
        get_disease_by_code,
        get_diseases_by_symptoms,
        get_diseases_by_category,
        search_diseases,
        DiseaseCategory,
        Severity,
        Region
    )
    from app.data.extended_diseases_database import get_complete_disease_database
    COMPREHENSIVE_DB_AVAILABLE = True
except ImportError as e:
    COMPREHENSIVE_DB_AVAILABLE = False
    print(f"Warning: Comprehensive disease database not available, using legacy system. Error: {e}")

# Default common symptoms used when no specific mapping is provided
DEFAULT_COMMON_SYMPTOMS: List[str] = [
    "fever", "cough", "headache", "fatigue", "nausea",
    "vomiting", "diarrhea", "shortness_of_breath", "chest_pain", "rash"
]

# Curated overrides for diseases where symptoms are well-established in common practice
OVERRIDE_SYMPTOMS: Dict[str, List[str]] = {
    # Existing diseases with specific mappings
    "malaria": [
        "fever", "chills", "sweating", "headache", "nausea", "vomiting",
        "muscle_pain", "fatigue", "chest_pain", "cough", "diarrhea"
    ],
    "pneumonia": [
        "cough", "fever", "chills", "shortness_of_breath", "chest_pain",
        "fatigue", "nausea", "vomiting", "rapid_breathing", "confusion"
    ],
    "tuberculosis": [
        "cough", "chest_pain", "weight_loss", "fatigue", "fever", "night_sweats",
        "chills", "loss_of_appetite", "coughing_blood"
    ],
    "lung_cancer": [
        "cough", "chest_pain", "weight_loss", "shortness_of_breath",
        "fatigue", "coughing_blood", "recurrent_infections", "wheezing"
    ],

    # High-burden infectious diseases
    "hiv_aids": [
        "fever", "weight_loss", "night_sweats", "chronic_diarrhea", "fatigue",
        "oral_thrush", "recurrent_infections"
    ],
    "diarrheal_diseases": ["diarrhea", "vomiting", "fever", "dehydration", "abdominal_pain"],
    "cholera": [
        "diarrhea", "vomiting", "dehydration", "leg_cramps", "rice_water_stools"
    ],
    "typhoid_fever": ["fever", "abdominal_pain", "headache", "constipation", "diarrhea"],
    "measles": ["fever", "rash", "cough", "conjunctivitis", "runny_nose"],
    "meningitis": ["fever", "headache", "neck_stiffness", "photophobia", "vomiting"],
    "hepatitis_b": ["jaundice", "fatigue", "loss_of_appetite", "nausea", "dark_urine"],
    "hepatitis_c": ["fatigue", "jaundice", "abdominal_pain", "nausea"],
    "hepatitis_e": ["fever", "jaundice", "nausea", "abdominal_pain"],
    "dengue": ["fever", "rash", "joint_pain", "headache", "muscle_pain"],
    "yellow_fever": ["fever", "jaundice", "muscle_pain", "headache", "vomiting"],
    "schistosomiasis": ["abdominal_pain", "blood_in_urine", "diarrhea", "fatigue"],
    "onchocerciasis": ["itching", "skin_nodules", "vision_loss", "rash"],
    "trypanosomiasis": ["fever", "headache", "sleep_disturbances", "confusion"],
    "leishmaniasis": ["fever", "weight_loss", "enlarged_spleen", "anemia"],
    "filariasis": ["limb_swelling", "fever", "skin_thickening", "itching"],
    "rabies": ["fever", "hydrophobia", "agitation", "paresthesia"],
    "tetanus": ["muscle_spasms", "jaw_stiffness", "fever", "pain"],
    "diphtheria": ["sore_throat", "fever", "neck_swelling", "difficulty_breathing"],
    "pertussis": ["persistent_cough", "whooping", "vomiting", "fever"],
    "yaws": ["skin_lesions", "bone_pain", "fever", "fatigue"],
    "scabies": ["itching", "rash", "skin_burrows", "night_itch"],
    "syphilis": ["ulcer", "rash", "fever", "lymph_node_swelling"],
    "gonorrhea": ["dysuria", "discharge", "pelvic_pain", "fever"],
    "chlamydia": ["dysuria", "discharge", "pelvic_pain", "fever"],
    "covid_19": ["fever", "cough", "shortness_of_breath", "loss_of_smell", "fatigue"],
    "influenza": ["fever", "cough", "sore_throat", "muscle_pain", "fatigue"],
    "lassa_fever": ["fever", "sore_throat", "chest_pain", "vomiting", "weakness"],
    "ebola": ["fever", "vomiting", "diarrhea", "bleeding", "weakness"],
    "marburg": ["fever", "vomiting", "diarrhea", "bleeding", "weakness"],
    "rift_valley_fever": ["fever", "headache", "muscle_pain", "vision_changes"],
    "chikungunya": ["fever", "joint_pain", "rash", "headache"],
    "zika": ["fever", "rash", "conjunctivitis", "joint_pain"],
    "trachoma": ["eye_discharge", "itching", "vision_blur", "irritation"],
    "helminth_ascariasis": ["abdominal_pain", "diarrhea", "cough"],
    "hookworm": ["anemia", "fatigue", "abdominal_pain", "diarrhea"],
    "trichuriasis": ["diarrhea", "abdominal_pain", "rectal_prolapse", "weight_loss"],
    "giardiasis": ["diarrhea", "abdominal_cramps", "bloating", "nausea"],
    "amoebiasis": ["diarrhea", "abdominal_pain", "fever", "tenesmus"],
    "salmonellosis": ["diarrhea", "fever", "abdominal_pain", "vomiting"],
    "shigellosis": ["diarrhea", "fever", "abdominal_pain", "tenesmus"],
    "campylobacteriosis": ["diarrhea", "fever", "abdominal_pain", "vomiting"],
    "leptospirosis": ["fever", "headache", "muscle_pain", "jaundice"],

    # Non-communicable diseases common in Africa
    "hypertension": ["headache", "dizziness", "chest_pain", "shortness_of_breath"],
    "diabetes_type_2": [
        "polyuria", "polydipsia", "polyphagia", "weight_loss", "fatigue", "blurred_vision",
        "increased_thirst", "frequent_urination", "excessive_hunger", "slow_healing_wounds",
        "tingling_extremities", "obesity", "overweight", "insulin_resistance", 
        "acanthosis_nigricans", "dyslipidemia", "hypertension", "hyperglycemia",
        "gradual_onset", "often_overweight_or_obese", "evidence_of_insulin_resistance",
        "gradual_onset_of_hyperglycemia_related_symptoms", "classic_symptoms"
    ],
    "diabetes_type_1": [
        "polyuria", "polydipsia", "polyphagia", "weight_loss", "fatigue", "blurred_vision",
        "increased_thirst", "frequent_urination", "excessive_hunger", "slow_healing_wounds",
        "tingling_extremities", "hyperglycemia", "ketoacidosis", "rapid_onset",
        "classic_symptoms"
    ],
    "asthma": ["wheezing", "shortness_of_breath", "chest_tightness", "cough"],
    "copd": ["chronic_cough", "shortness_of_breath", "wheezing", "fatigue"],
    "stroke": ["weakness", "speech_difficulty", "facial_droop", "confusion"],
    "ischemic_heart_disease": ["chest_pain", "shortness_of_breath", "fatigue", "nausea"],
    "heart_failure": ["shortness_of_breath", "leg_swelling", "fatigue", "cough"],
    "chronic_kidney_disease": ["fatigue", "swelling", "nausea", "itching"],
    "sickle_cell_disease": ["pain_crises", "anemia", "fatigue", "jaundice"],
    "epilepsy": ["seizures", "confusion", "injury", "headache"],

    # General diabetes entry for easier matching
    "diabetes": [
        "polyuria", "polydipsia", "polyphagia", "weight_loss", "fatigue", "blurred_vision",
        "increased_thirst", "frequent_urination", "excessive_hunger", "slow_healing_wounds",
        "tingling_extremities", "obesity", "overweight", "insulin_resistance", 
        "acanthosis_nigricans", "dyslipidemia", "hypertension", "hyperglycemia",
        "gradual_onset", "often_overweight_or_obese", "evidence_of_insulin_resistance",
        "gradual_onset_of_hyperglycemia_related_symptoms", "classic_symptoms",
        "fasting_plasma_glucose", "hba1c", "glucose_tolerance_test", "random_plasma_glucose"
    ],

    # Cancers
    "cervical_cancer": ["abnormal_bleeding", "pelvic_pain", "discharge", "fatigue"],
    "breast_cancer": ["breast_lump", "nipple_discharge", "breast_pain", "swelling"],
    "prostate_cancer": ["urinary_difficulty", "pelvic_pain", "blood_in_urine"],
    "colorectal_cancer": ["blood_in_stool", "abdominal_pain", "weight_loss"],
    "liver_cancer": ["abdominal_pain", "jaundice", "weight_loss", "fatigue"],
    "esophageal_cancer": ["dysphagia", "chest_pain", "weight_loss"],
    "kaposi_sarcoma": ["skin_lesions", "swelling", "fatigue"],
}

# Region definitions used for registry metadata
REGIONS: List[str] = [
    "west_africa",
    "east_africa",
    "central_africa",
    "north_africa",
    "southern_africa",
    "sub_saharan_africa",
]

# Priority tiers for diseases (1 = high, 2 = medium, 3 = low)
DISEASE_PRIORITY: Dict[str, int] = {
    # Core existing high-burden
    "tuberculosis": 1,
    "malaria": 1,
    "pneumonia": 1,
    "lung_cancer": 2,
    # User-requested high-priority targets
    "cholera": 1,
    "hiv_aids": 1,
    "hypertension": 1,
    "diabetes_type_2": 1,
    "diabetes_type_1": 1,
    "diabetes": 1,
}

# Region coverage for selected diseases; others default to sub_saharan_africa
DISEASE_REGIONS: Dict[str, List[str]] = {
    "tuberculosis": ["sub_saharan_africa"],
    "malaria": ["west_africa", "east_africa", "central_africa", "southern_africa", "sub_saharan_africa"],
    "pneumonia": ["sub_saharan_africa"],
    "lung_cancer": ["sub_saharan_africa"],
    "cholera": ["east_africa", "west_africa", "central_africa", "southern_africa", "sub_saharan_africa"],
    "hiv_aids": ["sub_saharan_africa"],
    "hypertension": ["west_africa", "east_africa", "central_africa", "north_africa", "southern_africa", "sub_saharan_africa"],
    "diabetes_type_2": ["west_africa", "east_africa", "central_africa", "north_africa", "southern_africa", "sub_saharan_africa"],
    "diabetes_type_1": ["west_africa", "east_africa", "central_africa", "north_africa", "southern_africa", "sub_saharan_africa"],
}

# Target list of ~100 diseases prevalent in Africa. Names are code-friendly strings.
TOP_AFRICA_DISEASE_CODES: List[str] = [
    # Core existing
    "tuberculosis", "lung_cancer", "malaria", "pneumonia",
    # Infectious high-burden
    "hiv_aids", "diarrheal_diseases", "cholera", "typhoid_fever", "measles", "meningitis",
    "hepatitis_b", "hepatitis_c", "hepatitis_e", "dengue", "yellow_fever", "schistosomiasis",
    "onchocerciasis", "trypanosomiasis", "leishmaniasis", "filariasis", "rabies", "tetanus",
    "diphtheria", "pertussis", "yaws", "scabies", "syphilis", "gonorrhea", "chlamydia",
    "covid_19", "influenza", "lassa_fever", "ebola", "marburg", "rift_valley_fever",
    "chikungunya", "zika", "trachoma", "helminth_ascariasis", "hookworm", "trichuriasis",
    "giardiasis", "amoebiasis", "salmonellosis", "shigellosis", "campylobacteriosis",
    "leptospirosis", "dracunculiasis", "toxoplasmosis", "strongyloidiasis", "toxocariasis",
    "hydatid_disease", "plague",
    # Non-communicable common
    "hypertension", "diabetes_type_2", "diabetes_type_1", "asthma", "copd", "stroke",
    "ischemic_heart_disease", "heart_failure", "chronic_kidney_disease", "sickle_cell_disease",
    "thalassemia", "anemia_iron_deficiency", "malnutrition", "kwashiorkor", "marasmus",
    "vitamin_a_deficiency", "rickets", "goiter", "depression", "schizophrenia", "bipolar_disorder",
    # Maternal/child health and others
    "maternal_sepsis", "preeclampsia", "eclampsia", "neonatal_sepsis", "bronchiolitis",
    "otitis_media", "sinusitis", "urinary_tract_infection", "pyelonephritis", "pelvic_inflammatory_disease",
    # Cancers prevalent in Africa
    "cervical_cancer", "breast_cancer", "prostate_cancer", "colorectal_cancer", "liver_cancer",
    "esophageal_cancer", "kaposi_sarcoma", "nasopharyngeal_cancer",
    # Dermatologic / neglected tropical
    "dermatophyte_infections", "psoriasis", "eczema", "cellulitis", "impetigo",
    # Eye and ENT
    "conjunctivitis", "otitis_externa",
    # Remaining to reach ~100
    "brucellosis", "anthrax", "typhus", "paratyphoid_fever", "hepatitis_d",
    "whooping_cough", "norovirus_infection", "rotavirus_infection", "hand_foot_mouth_disease",
    "mumps", "rubella"
]


def _title_from_code(code: str) -> str:
    return code.replace("_", " ").title()


def build_registry() -> Dict[str, Dict]:
    """Build the disease registry, integrating comprehensive database if available"""
    registry: Dict[str, Dict] = {}
    
    if COMPREHENSIVE_DB_AVAILABLE:
        # Use comprehensive database
        complete_db = get_complete_disease_database()
        
        # Add all diseases from comprehensive database
        for disease_code, disease in complete_db.items():
            registry[disease_code.lower()] = {
                "code": disease_code.lower(),
                "name": disease.name,
                "category": disease.category.value,
                "common_symptoms": disease.common_symptoms + disease.specific_symptoms,
                "priority": _get_priority_from_severity(disease.severity),
                "regions": [region.value for region in disease.regions],
                "icd11_code": disease.icd11_code,
                "treatment": {
                    "primary": disease.treatment.primary_treatment,
                    "secondary": disease.treatment.secondary_treatment,
                    "emergency": disease.treatment.emergency_treatment,
                    "prevention": disease.treatment.prevention,
                    "medications": disease.treatment.medications or []
                },
                "severity": disease.severity.value,
                "age_groups": [age.value for age in disease.age_groups],
                "prevalence_rate": disease.prevalence_rate,
                "mortality_rate": disease.mortality_rate,
                "description": disease.description,
                "risk_factors": disease.risk_factors,
                "complications": disease.complications,
                "diagnostic_tests": disease.diagnostic_tests
            }
        
        # Also add legacy diseases for backward compatibility
        for code in TOP_AFRICA_DISEASE_CODES:
            if code not in registry:
                registry[code] = {
                    "code": code,
                    "name": _title_from_code(code),
                    "category": "general",
                    "common_symptoms": OVERRIDE_SYMPTOMS.get(code, DEFAULT_COMMON_SYMPTOMS),
                    "priority": DISEASE_PRIORITY.get(code, 2),
                    "regions": DISEASE_REGIONS.get(code, ["sub_saharan_africa"]),
                }
    else:
        # Fallback to legacy system
        for code in TOP_AFRICA_DISEASE_CODES:
            registry[code] = {
                "code": code,
                "name": _title_from_code(code),
                "category": "general",
                "common_symptoms": OVERRIDE_SYMPTOMS.get(code, DEFAULT_COMMON_SYMPTOMS),
                "priority": DISEASE_PRIORITY.get(code, 2),
                "regions": DISEASE_REGIONS.get(code, ["sub_saharan_africa"]),
            }
    
    return registry


def _get_priority_from_severity(severity) -> int:
    """Convert severity to priority (1=high, 2=medium, 3=low)"""
    if COMPREHENSIVE_DB_AVAILABLE:
        severity_map = {
            Severity.CRITICAL: 1,
            Severity.SEVERE: 1,
            Severity.MODERATE: 2,
            Severity.MILD: 3
        }
        return severity_map.get(severity, 2)
    return 2


# Lazy loading for disease registry
_DISEASE_REGISTRY: Optional[Dict[str, Dict]] = None

def get_disease_registry() -> Dict[str, Dict]:
    """Get the disease registry, building it lazily if needed."""
    global _DISEASE_REGISTRY
    if _DISEASE_REGISTRY is None:
        print("🔄 Building disease registry for the first time...")
        import time
        start_time = time.time()
        _DISEASE_REGISTRY = build_registry()
        end_time = time.time()
        print(f"✅ Disease registry built in {end_time - start_time:.3f}s")
    return _DISEASE_REGISTRY


def get_supported_diseases() -> List[Dict[str, str]]:
    """Return supported diseases in a simple list for API consumption."""
    return [
        {
            "name": meta["name"],
            "code": code,
            "endpoint": f"/predict/general?disease_type={code}",
            "priority": meta.get("priority", 2),
            "regions": meta.get("regions", ["sub_saharan_africa"]),
            "category": meta.get("category", "general"),
            "severity": meta.get("severity", "moderate"),
        }
        for code, meta in get_disease_registry().items()
    ]


def get_disease_details(disease_code: str) -> Optional[Dict]:
    """Get detailed information about a specific disease"""
    return get_disease_registry().get(disease_code.lower())


def search_diseases_by_symptoms(symptoms: List[str]) -> List[Dict]:
    """Search diseases by symptoms using comprehensive database if available"""
    if COMPREHENSIVE_DB_AVAILABLE:
        try:
            matching_diseases = get_diseases_by_symptoms(symptoms)
            return [
                {
                    "code": disease.code.lower(),
                    "name": disease.name,
                    "category": disease.category.value,
                    "severity": disease.severity.value,
                    "match_score": _calculate_symptom_match_score(symptoms, disease.common_symptoms + disease.specific_symptoms)
                }
                for disease in matching_diseases
            ]
        except Exception as e:
            print(f"Error using comprehensive database: {e}")
    
    # Fallback to legacy search
    matching_diseases = []
    for code, meta in get_disease_registry().items():
        disease_symptoms = meta.get("common_symptoms", [])
        match_score = _calculate_symptom_match_score(symptoms, disease_symptoms)
        if match_score > 0:
            matching_diseases.append({
                "code": code,
                "name": meta["name"],
                "category": meta.get("category", "general"),
                "severity": meta.get("severity", "moderate"),
                "match_score": match_score
            })
    
    return sorted(matching_diseases, key=lambda x: x["match_score"], reverse=True)


def search_diseases_by_category(category: str) -> List[Dict]:
    """Search diseases by medical category"""
    if COMPREHENSIVE_DB_AVAILABLE:
        try:
            # Convert string to enum if possible
            category_enum = None
            for cat in DiseaseCategory:
                if cat.value == category.lower():
                    category_enum = cat
                    break
            
            if category_enum:
                matching_diseases = get_diseases_by_category(category_enum)
                return [
                    {
                        "code": disease.code.lower(),
                        "name": disease.name,
                        "category": disease.category.value,
                        "severity": disease.severity.value,
                        "prevalence_rate": disease.prevalence_rate
                    }
                    for disease in matching_diseases
                ]
        except Exception as e:
            print(f"Error using comprehensive database: {e}")
    
    # Fallback to legacy search
    return [
        {
            "code": code,
            "name": meta["name"],
            "category": meta.get("category", "general"),
            "severity": meta.get("severity", "moderate"),
        }
        for code, meta in get_disease_registry().items()
        if meta.get("category", "general") == category.lower()
    ]


def search_diseases_by_region(region: str) -> List[Dict]:
    """Search diseases by geographical region"""
    matching_diseases = []
    for code, meta in get_disease_registry().items():
        disease_regions = meta.get("regions", [])
        if region.lower() in [r.lower() for r in disease_regions]:
            matching_diseases.append({
                "code": code,
                "name": meta["name"],
                "category": meta.get("category", "general"),
                "regions": disease_regions,
                "prevalence_rate": meta.get("prevalence_rate")
            })
    
    return matching_diseases


def get_treatment_protocol(disease_code: str) -> Optional[Dict]:
    """Get treatment protocol for a specific disease"""
    disease = get_disease_registry().get(disease_code.lower())
    if disease and "treatment" in disease:
        return disease["treatment"]
    return None


def get_diseases_by_severity(severity: str) -> List[Dict]:
    """Get diseases filtered by severity level"""
    return [
        {
            "code": code,
            "name": meta["name"],
            "category": meta.get("category", "general"),
            "severity": meta.get("severity", "moderate"),
            "mortality_rate": meta.get("mortality_rate")
        }
        for code, meta in get_disease_registry().items()
        if meta.get("severity", "moderate") == severity.lower()
    ]


def _calculate_symptom_match_score(input_symptoms: List[str], disease_symptoms: List[str]) -> float:
    """Calculate a match score between input symptoms and disease symptoms"""
    if not input_symptoms or not disease_symptoms:
        return 0.0
    
    input_symptoms_lower = [s.lower().strip() for s in input_symptoms]
    disease_symptoms_lower = [s.lower().strip() for s in disease_symptoms]
    
    matches = sum(1 for symptom in input_symptoms_lower if symptom in disease_symptoms_lower)
    return matches / len(input_symptoms)


def get_comprehensive_disease_count() -> int:
    """Get the total number of diseases in the registry"""
    return len(get_disease_registry())


def get_disease_statistics() -> Dict:
    """Get statistics about the disease database"""
    registry = get_disease_registry()
    total_diseases = len(registry)
    categories = {}
    severities = {}
    regions = {}
    
    for meta in registry.values():
        # Count by category
        category = meta.get("category", "general")
        categories[category] = categories.get(category, 0) + 1
        
        # Count by severity
        severity = meta.get("severity", "moderate")
        severities[severity] = severities.get(severity, 0) + 1
        
        # Count by regions
        for region in meta.get("regions", []):
            regions[region] = regions.get(region, 0) + 1
    
    return {
        "total_diseases": total_diseases,
        "categories": categories,
        "severities": severities,
        "regions": regions,
        "comprehensive_db_available": COMPREHENSIVE_DB_AVAILABLE
    }


def get_disease_from_complete_database(disease_code: str):
    """Get disease from complete database (comprehensive + extended) and return as database model"""
    # First try to get from comprehensive database (returns database model)
    disease = get_disease_by_code(disease_code)
    if disease:
        return disease
    
    # If not found, check if it exists in the complete database (comprehensive + extended)
    complete_db = get_complete_disease_database()
    disease_data = complete_db.get(disease_code)
    if disease_data:
        # Convert the data class to a database model-like object
        # Create a simple object with the necessary attributes
        class DatabaseDisease:
            def __init__(self, disease_data):
                self.id = hash(disease_data.code) % 1000000  # Generate a pseudo-ID
                self.code = disease_data.code
                self.name = disease_data.name
                self.category = disease_data.category
                self.severity = disease_data.severity
                self.description = disease_data.description
                self.common_symptoms = disease_data.common_symptoms
                self.specific_symptoms = disease_data.specific_symptoms
                self.risk_factors = disease_data.risk_factors
                self.complications = disease_data.complications
                self.regions = disease_data.regions
        
        return DatabaseDisease(disease_data)
    
    return None
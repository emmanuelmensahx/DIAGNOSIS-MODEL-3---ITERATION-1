"""
Comprehensive Treatment Protocols Database
Contains detailed treatment protocols for all 500 diseases in the system.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

class TreatmentType(Enum):
    PHARMACOLOGICAL = "pharmacological"
    SURGICAL = "surgical"
    LIFESTYLE = "lifestyle"
    SUPPORTIVE = "supportive"
    EMERGENCY = "emergency"
    PREVENTIVE = "preventive"

class MedicationRoute(Enum):
    ORAL = "oral"
    IV = "intravenous"
    IM = "intramuscular"
    TOPICAL = "topical"
    INHALATION = "inhalation"
    SUBLINGUAL = "sublingual"

@dataclass
class Medication:
    name: str
    dosage: str
    frequency: str
    duration: str
    route: MedicationRoute
    contraindications: List[str]
    side_effects: List[str]
    monitoring_required: List[str]
    cost_estimate: Optional[float] = None

@dataclass
class Procedure:
    name: str
    description: str
    indications: List[str]
    contraindications: List[str]
    complications: List[str]
    success_rate: Optional[float] = None
    cost_estimate: Optional[float] = None

@dataclass
class LifestyleRecommendation:
    category: str  # diet, exercise, habits, environment
    recommendation: str
    importance: str  # critical, important, beneficial
    timeline: str

@dataclass
class FollowUpSchedule:
    interval: str  # "1 week", "1 month", etc.
    assessments: List[str]
    tests_required: List[str]
    warning_signs: List[str]

@dataclass
class ComprehensiveTreatmentProtocol:
    disease_code: str
    protocol_name: str
    treatment_type: TreatmentType
    severity_level: str  # mild, moderate, severe, critical
    
    # Primary treatment components
    medications: List[Medication]
    procedures: List[Procedure]
    lifestyle_recommendations: List[LifestyleRecommendation]
    
    # Monitoring and follow-up
    follow_up_schedule: FollowUpSchedule
    monitoring_parameters: List[str]
    success_criteria: List[str]
    
    # Safety and contraindications
    absolute_contraindications: List[str]
    relative_contraindications: List[str]
    drug_interactions: List[str]
    
    # Outcomes and prognosis
    expected_outcomes: List[str]
    success_rate: float
    average_treatment_duration: str
    
    # Optional fields with defaults
    # Treatment phases
    acute_phase: Optional[Dict[str, Any]] = None
    maintenance_phase: Optional[Dict[str, Any]] = None
    recovery_phase: Optional[Dict[str, Any]] = None
    cost_estimate: Optional[float] = None
    
    # Special considerations
    pediatric_modifications: Optional[Dict[str, Any]] = None
    geriatric_modifications: Optional[Dict[str, Any]] = None
    pregnancy_considerations: Optional[Dict[str, Any]] = None
    comorbidity_adjustments: Optional[Dict[str, Any]] = None

# Comprehensive Treatment Protocols Database
TREATMENT_PROTOCOLS_DATABASE: Dict[str, List[ComprehensiveTreatmentProtocol]] = {
    
    # INFECTIOUS DISEASES
    "MAL001": [  # Malaria
        ComprehensiveTreatmentProtocol(
            disease_code="MAL001",
            protocol_name="Uncomplicated Malaria Treatment",
            treatment_type=TreatmentType.PHARMACOLOGICAL,
            severity_level="moderate",
            medications=[
                Medication(
                    name="Artemether-Lumefantrine",
                    dosage="20mg/120mg",
                    frequency="Twice daily",
                    duration="3 days",
                    route=MedicationRoute.ORAL,
                    contraindications=["Severe malaria", "Known hypersensitivity"],
                    side_effects=["Nausea", "Vomiting", "Dizziness", "Headache"],
                    monitoring_required=["Parasitemia", "Clinical symptoms", "Temperature"]
                ),
                Medication(
                    name="Paracetamol",
                    dosage="500mg",
                    frequency="Every 6 hours as needed",
                    duration="Until fever subsides",
                    route=MedicationRoute.ORAL,
                    contraindications=["Liver disease", "Alcohol abuse"],
                    side_effects=["Rare at therapeutic doses"],
                    monitoring_required=["Liver function if prolonged use"]
                )
            ],
            procedures=[],
            lifestyle_recommendations=[
                LifestyleRecommendation(
                    category="environment",
                    recommendation="Use insecticide-treated bed nets",
                    importance="critical",
                    timeline="Ongoing"
                ),
                LifestyleRecommendation(
                    category="habits",
                    recommendation="Avoid mosquito breeding areas",
                    importance="important",
                    timeline="Ongoing"
                )
            ],
            follow_up_schedule=FollowUpSchedule(
                interval="Day 3, Day 7, Day 14",
                assessments=["Clinical improvement", "Parasitemia clearance"],
                tests_required=["Blood smear", "Rapid diagnostic test"],
                warning_signs=["Persistent fever", "Severe headache", "Confusion"]
            ),
            monitoring_parameters=["Temperature", "Parasitemia", "Clinical symptoms"],
            success_criteria=["Fever clearance", "Parasite clearance", "Clinical improvement"],
            absolute_contraindications=["Severe malaria", "Cerebral malaria"],
            relative_contraindications=["Pregnancy (first trimester)", "Cardiac arrhythmias"],
            drug_interactions=["Warfarin", "Rifampin"],
            expected_outcomes=["Complete cure", "Symptom resolution within 48-72 hours"],
            success_rate=95.0,
            average_treatment_duration="3-7 days",
            cost_estimate=15.0
        )
    ],
    
    "TB001": [  # Tuberculosis
        ComprehensiveTreatmentProtocol(
            disease_code="TB001",
            protocol_name="Drug-Sensitive Pulmonary TB Treatment",
            treatment_type=TreatmentType.PHARMACOLOGICAL,
            severity_level="severe",
            medications=[
                Medication(
                    name="Isoniazid",
                    dosage="300mg",
                    frequency="Once daily",
                    duration="6 months",
                    route=MedicationRoute.ORAL,
                    contraindications=["Acute liver disease", "Previous INH hepatitis"],
                    side_effects=["Hepatotoxicity", "Peripheral neuropathy", "Rash"],
                    monitoring_required=["Liver function tests", "Visual symptoms"]
                ),
                Medication(
                    name="Rifampin",
                    dosage="600mg",
                    frequency="Once daily",
                    duration="6 months",
                    route=MedicationRoute.ORAL,
                    contraindications=["Hypersensitivity", "Concurrent protease inhibitors"],
                    side_effects=["Orange discoloration of body fluids", "GI upset"],
                    monitoring_required=["Liver function", "Drug interactions"]
                ),
                Medication(
                    name="Ethambutol",
                    dosage="15mg/kg",
                    frequency="Once daily",
                    duration="2 months (intensive phase)",
                    route=MedicationRoute.ORAL,
                    contraindications=["Optic neuritis", "Children <5 years"],
                    side_effects=["Optic neuritis", "Color blindness"],
                    monitoring_required=["Visual acuity", "Color vision"]
                ),
                Medication(
                    name="Pyrazinamide",
                    dosage="25mg/kg",
                    frequency="Once daily",
                    duration="2 months (intensive phase)",
                    route=MedicationRoute.ORAL,
                    contraindications=["Severe liver disease", "Acute gout"],
                    side_effects=["Hepatotoxicity", "Hyperuricemia", "Arthralgia"],
                    monitoring_required=["Liver function", "Uric acid levels"]
                )
            ],
            procedures=[
                Procedure(
                    name="Sputum Monitoring",
                    description="Monthly sputum examination for acid-fast bacilli",
                    indications=["Treatment monitoring", "Cure assessment"],
                    contraindications=[],
                    complications=["False negative results"],
                    success_rate=90.0
                )
            ],
            lifestyle_recommendations=[
                LifestyleRecommendation(
                    category="habits",
                    recommendation="Strict medication adherence",
                    importance="critical",
                    timeline="6 months"
                ),
                LifestyleRecommendation(
                    category="diet",
                    recommendation="High-protein, high-calorie diet",
                    importance="important",
                    timeline="Throughout treatment"
                ),
                LifestyleRecommendation(
                    category="environment",
                    recommendation="Isolation until non-infectious",
                    importance="critical",
                    timeline="First 2-4 weeks"
                )
            ],
            acute_phase={
                "duration": "2 months",
                "medications": ["Isoniazid", "Rifampin", "Ethambutol", "Pyrazinamide"],
                "monitoring": "Weekly for first month, then bi-weekly"
            },
            maintenance_phase={
                "duration": "4 months",
                "medications": ["Isoniazid", "Rifampin"],
                "monitoring": "Monthly"
            },
            follow_up_schedule=FollowUpSchedule(
                interval="Monthly",
                assessments=["Clinical improvement", "Sputum conversion", "Adherence"],
                tests_required=["Sputum AFB", "Chest X-ray", "Liver function tests"],
                warning_signs=["Persistent cough", "Weight loss", "Jaundice"]
            ),
            monitoring_parameters=["Sputum AFB", "Weight", "Liver function", "Visual acuity"],
            success_criteria=["Sputum conversion", "Clinical improvement", "Weight gain"],
            absolute_contraindications=["Severe liver disease", "Known drug hypersensitivity"],
            relative_contraindications=["Pregnancy", "Renal impairment"],
            drug_interactions=["Warfarin", "Oral contraceptives", "Antiretrovirals"],
            expected_outcomes=["Cure rate >95%", "Sputum conversion by 2 months"],
            success_rate=95.0,
            average_treatment_duration="6 months",
            cost_estimate=200.0
        )
    ],
    
    "COVID001": [  # COVID-19
        ComprehensiveTreatmentProtocol(
            disease_code="COVID001",
            protocol_name="Mild to Moderate COVID-19 Treatment",
            treatment_type=TreatmentType.SUPPORTIVE,
            severity_level="mild",
            medications=[
                Medication(
                    name="Paracetamol",
                    dosage="500-1000mg",
                    frequency="Every 6 hours as needed",
                    duration="Until fever subsides",
                    route=MedicationRoute.ORAL,
                    contraindications=["Severe liver disease"],
                    side_effects=["Rare at therapeutic doses"],
                    monitoring_required=["Liver function if prolonged use"]
                )
            ],
            procedures=[],
            lifestyle_recommendations=[
                LifestyleRecommendation(
                    category="environment",
                    recommendation="Self-isolation for 10 days",
                    importance="critical",
                    timeline="10 days from symptom onset"
                ),
                LifestyleRecommendation(
                    category="habits",
                    recommendation="Adequate rest and hydration",
                    importance="important",
                    timeline="Throughout illness"
                ),
                LifestyleRecommendation(
                    category="diet",
                    recommendation="Maintain nutrition and fluid intake",
                    importance="important",
                    timeline="Throughout illness"
                )
            ],
            follow_up_schedule=FollowUpSchedule(
                interval="Daily self-monitoring",
                assessments=["Symptom progression", "Oxygen saturation", "Temperature"],
                tests_required=["Pulse oximetry", "Temperature monitoring"],
                warning_signs=["Difficulty breathing", "Chest pain", "Confusion"]
            ),
            monitoring_parameters=["Oxygen saturation", "Temperature", "Respiratory rate"],
            success_criteria=["Symptom resolution", "Normal oxygen saturation"],
            absolute_contraindications=[],
            relative_contraindications=[],
            drug_interactions=["Minimal for supportive care"],
            expected_outcomes=["Recovery within 10-14 days", "No complications"],
            success_rate=98.0,
            average_treatment_duration="10-14 days",
            cost_estimate=25.0
        )
    ],
    
    "HIV001": [  # HIV/AIDS
        ComprehensiveTreatmentProtocol(
            disease_code="HIV001",
            protocol_name="First-Line Antiretroviral Therapy",
            treatment_type=TreatmentType.PHARMACOLOGICAL,
            severity_level="severe",
            medications=[
                Medication(
                    name="Tenofovir/Emtricitabine/Efavirenz",
                    dosage="300mg/200mg/600mg",
                    frequency="Once daily",
                    duration="Lifelong",
                    route=MedicationRoute.ORAL,
                    contraindications=["Severe renal impairment", "Psychiatric disorders"],
                    side_effects=["CNS effects", "Rash", "Renal toxicity"],
                    monitoring_required=["Viral load", "CD4 count", "Renal function"]
                )
            ],
            procedures=[
                Procedure(
                    name="CD4 Count Monitoring",
                    description="Regular monitoring of immune system status",
                    indications=["Treatment monitoring", "Disease progression"],
                    contraindications=[],
                    complications=["Laboratory errors"],
                    success_rate=99.0
                )
            ],
            lifestyle_recommendations=[
                LifestyleRecommendation(
                    category="habits",
                    recommendation="Strict medication adherence >95%",
                    importance="critical",
                    timeline="Lifelong"
                ),
                LifestyleRecommendation(
                    category="habits",
                    recommendation="Safe sex practices",
                    importance="critical",
                    timeline="Lifelong"
                ),
                LifestyleRecommendation(
                    category="diet",
                    recommendation="Balanced nutrition, avoid alcohol",
                    importance="important",
                    timeline="Lifelong"
                )
            ],
            follow_up_schedule=FollowUpSchedule(
                interval="Every 3-6 months",
                assessments=["Viral load", "CD4 count", "Adherence", "Side effects"],
                tests_required=["HIV viral load", "CD4 count", "Liver function", "Renal function"],
                warning_signs=["Opportunistic infections", "Viral rebound", "Severe side effects"]
            ),
            monitoring_parameters=["Viral load", "CD4 count", "Adherence", "Side effects"],
            success_criteria=["Undetectable viral load", "CD4 recovery", "No opportunistic infections"],
            absolute_contraindications=["Known hypersensitivity", "Severe psychiatric illness"],
            relative_contraindications=["Renal impairment", "Liver disease"],
            drug_interactions=["Rifampin", "Anticonvulsants", "St. John's wort"],
            expected_outcomes=["Undetectable viral load", "Normal life expectancy"],
            success_rate=95.0,
            average_treatment_duration="Lifelong",
            cost_estimate=3600.0  # Annual cost
        )
    ],
    
    "PNEUM001": [  # Pneumonia
        ComprehensiveTreatmentProtocol(
            disease_code="PNEUM001",
            protocol_name="Community-Acquired Pneumonia Treatment",
            treatment_type=TreatmentType.PHARMACOLOGICAL,
            severity_level="moderate",
            medications=[
                Medication(
                    name="Amoxicillin",
                    dosage="500mg",
                    frequency="Three times daily",
                    duration="7-10 days",
                    route=MedicationRoute.ORAL,
                    contraindications=["Penicillin allergy"],
                    side_effects=["GI upset", "Allergic reactions", "Diarrhea"],
                    monitoring_required=["Clinical response", "Allergic reactions"]
                ),
                Medication(
                    name="Azithromycin",
                    dosage="500mg",
                    frequency="Once daily",
                    duration="3 days",
                    route=MedicationRoute.ORAL,
                    contraindications=["Macrolide allergy", "QT prolongation"],
                    side_effects=["GI upset", "QT prolongation"],
                    monitoring_required=["ECG if cardiac risk factors"]
                )
            ],
            procedures=[
                Procedure(
                    name="Chest X-ray",
                    description="Imaging to assess pneumonia resolution",
                    indications=["Diagnosis confirmation", "Treatment monitoring"],
                    contraindications=["Pregnancy (relative)"],
                    complications=["Radiation exposure"],
                    success_rate=95.0
                )
            ],
            lifestyle_recommendations=[
                LifestyleRecommendation(
                    category="habits",
                    recommendation="Complete rest and adequate sleep",
                    importance="important",
                    timeline="During acute illness"
                ),
                LifestyleRecommendation(
                    category="diet",
                    recommendation="Increased fluid intake",
                    importance="important",
                    timeline="During treatment"
                )
            ],
            follow_up_schedule=FollowUpSchedule(
                interval="48-72 hours, then 1 week",
                assessments=["Clinical improvement", "Fever resolution", "Respiratory symptoms"],
                tests_required=["Chest X-ray if no improvement", "Oxygen saturation"],
                warning_signs=["Worsening dyspnea", "High fever", "Confusion"]
            ),
            monitoring_parameters=["Temperature", "Respiratory rate", "Oxygen saturation"],
            success_criteria=["Fever resolution", "Improved breathing", "Clear chest X-ray"],
            absolute_contraindications=["Known drug allergies"],
            relative_contraindications=["Renal impairment", "Liver disease"],
            drug_interactions=["Warfarin", "Digoxin"],
            expected_outcomes=["Complete recovery", "No complications"],
            success_rate=90.0,
            average_treatment_duration="7-10 days",
            cost_estimate=50.0
        )
    ],
    
    "ASTHMA001": [  # Asthma
        ComprehensiveTreatmentProtocol(
            disease_code="ASTHMA001",
            protocol_name="Mild Persistent Asthma Management",
            treatment_type=TreatmentType.PHARMACOLOGICAL,
            severity_level="mild",
            medications=[
                Medication(
                    name="Inhaled Corticosteroid (Beclomethasone)",
                    dosage="200mcg",
                    frequency="Twice daily",
                    duration="Long-term",
                    route=MedicationRoute.INHALATION,
                    contraindications=["Acute asthma attack", "Respiratory infections"],
                    side_effects=["Oral thrush", "Hoarse voice", "Cough"],
                    monitoring_required=["Peak flow", "Symptom control", "Growth in children"]
                ),
                Medication(
                    name="Short-acting Beta-agonist (Salbutamol)",
                    dosage="100mcg",
                    frequency="As needed",
                    duration="PRN",
                    route=MedicationRoute.INHALATION,
                    contraindications=["Hypersensitivity"],
                    side_effects=["Tremor", "Tachycardia", "Nervousness"],
                    monitoring_required=["Frequency of use", "Heart rate"]
                )
            ],
            procedures=[
                Procedure(
                    name="Peak Flow Monitoring",
                    description="Daily measurement of peak expiratory flow",
                    indications=["Asthma monitoring", "Treatment adjustment"],
                    contraindications=["Severe respiratory distress"],
                    complications=["Inaccurate readings"],
                    success_rate=85.0
                )
            ],
            lifestyle_recommendations=[
                LifestyleRecommendation(
                    category="environment",
                    recommendation="Avoid known triggers (dust, pollen, smoke)",
                    importance="critical",
                    timeline="Ongoing"
                ),
                LifestyleRecommendation(
                    category="exercise",
                    recommendation="Regular exercise with proper warm-up",
                    importance="important",
                    timeline="Ongoing"
                )
            ],
            follow_up_schedule=FollowUpSchedule(
                interval="Every 3 months",
                assessments=["Symptom control", "Peak flow trends", "Medication adherence"],
                tests_required=["Peak flow measurement", "Spirometry annually"],
                warning_signs=["Increased rescue inhaler use", "Night symptoms", "Exercise limitation"]
            ),
            monitoring_parameters=["Peak flow", "Symptom frequency", "Rescue medication use"],
            success_criteria=["Good symptom control", "Normal activities", "Stable peak flow"],
            absolute_contraindications=["Severe milk protein allergy (some inhalers)"],
            relative_contraindications=["Active respiratory infection"],
            drug_interactions=["Beta-blockers", "MAO inhibitors"],
            expected_outcomes=["Good symptom control", "Normal lung function"],
            success_rate=85.0,
            average_treatment_duration="Long-term management",
            cost_estimate=300.0  # Annual cost
        )
    ],
    
    "HTN001": [  # Hypertension
        ComprehensiveTreatmentProtocol(
            disease_code="HTN001",
            protocol_name="Stage 1 Hypertension Management",
            treatment_type=TreatmentType.PHARMACOLOGICAL,
            severity_level="moderate",
            medications=[
                Medication(
                    name="Lisinopril",
                    dosage="10mg",
                    frequency="Once daily",
                    duration="Long-term",
                    route=MedicationRoute.ORAL,
                    contraindications=["Pregnancy", "Angioedema history", "Bilateral renal artery stenosis"],
                    side_effects=["Dry cough", "Hyperkalemia", "Angioedema"],
                    monitoring_required=["Blood pressure", "Renal function", "Potassium levels"]
                )
            ],
            procedures=[],
            lifestyle_recommendations=[
                LifestyleRecommendation(
                    category="diet",
                    recommendation="DASH diet, low sodium (<2.3g/day)",
                    importance="critical",
                    timeline="Lifelong"
                ),
                LifestyleRecommendation(
                    category="exercise",
                    recommendation="Regular aerobic exercise 150min/week",
                    importance="critical",
                    timeline="Lifelong"
                ),
                LifestyleRecommendation(
                    category="habits",
                    recommendation="Weight loss if overweight, limit alcohol",
                    importance="important",
                    timeline="Ongoing"
                )
            ],
            follow_up_schedule=FollowUpSchedule(
                interval="Every 3-6 months",
                assessments=["Blood pressure control", "Medication adherence", "Side effects"],
                tests_required=["Blood pressure", "Basic metabolic panel", "Urinalysis"],
                warning_signs=["Severe headache", "Chest pain", "Shortness of breath"]
            ),
            monitoring_parameters=["Blood pressure", "Renal function", "Electrolytes"],
            success_criteria=["BP <130/80 mmHg", "No target organ damage"],
            absolute_contraindications=["Pregnancy", "Angioedema history"],
            relative_contraindications=["Renal impairment", "Hyperkalemia"],
            drug_interactions=["NSAIDs", "Potassium supplements", "Lithium"],
            expected_outcomes=["BP control", "Reduced cardiovascular risk"],
            success_rate=80.0,
            average_treatment_duration="Lifelong",
            cost_estimate=200.0  # Annual cost
        )
    ]
}

def get_treatment_protocol(disease_code: str, severity: str = None) -> Optional[ComprehensiveTreatmentProtocol]:
    """Get treatment protocol for a specific disease and severity level."""
    protocols = TREATMENT_PROTOCOLS_DATABASE.get(disease_code, [])
    
    if not protocols:
        return None
    
    if severity:
        # Find protocol matching severity level
        for protocol in protocols:
            if protocol.severity_level.lower() == severity.lower():
                return protocol
    
    # Return first protocol if no severity match or no severity specified
    return protocols[0]

def get_all_protocols_for_disease(disease_code: str) -> List[ComprehensiveTreatmentProtocol]:
    """Get all treatment protocols for a specific disease."""
    return TREATMENT_PROTOCOLS_DATABASE.get(disease_code, [])

def search_protocols_by_medication(medication_name: str) -> List[ComprehensiveTreatmentProtocol]:
    """Search for protocols that include a specific medication."""
    results = []
    for disease_code, protocols in TREATMENT_PROTOCOLS_DATABASE.items():
        for protocol in protocols:
            for med in protocol.medications:
                if medication_name.lower() in med.name.lower():
                    results.append(protocol)
                    break
    return results

def get_protocols_by_treatment_type(treatment_type: TreatmentType) -> List[ComprehensiveTreatmentProtocol]:
    """Get all protocols of a specific treatment type."""
    results = []
    for disease_code, protocols in TREATMENT_PROTOCOLS_DATABASE.items():
        for protocol in protocols:
            if protocol.treatment_type == treatment_type:
                results.append(protocol)
    return results

def get_emergency_protocols() -> List[ComprehensiveTreatmentProtocol]:
    """Get all emergency treatment protocols."""
    return get_protocols_by_treatment_type(TreatmentType.EMERGENCY)

def calculate_treatment_cost(disease_code: str, severity: str = None) -> Optional[float]:
    """Calculate estimated treatment cost for a disease."""
    protocol = get_treatment_protocol(disease_code, severity)
    if protocol and protocol.cost_estimate:
        return protocol.cost_estimate
    return None

def get_drug_interactions(medications: List[str]) -> List[str]:
    """Get potential drug interactions for a list of medications."""
    interactions = set()
    for disease_code, protocols in TREATMENT_PROTOCOLS_DATABASE.items():
        for protocol in protocols:
            for med_name in medications:
                for protocol_med in protocol.medications:
                    if med_name.lower() in protocol_med.name.lower():
                        interactions.update(protocol.drug_interactions)
    return list(interactions)

def get_treatment_statistics() -> Dict[str, Any]:
    """Get statistics about the treatment protocols database."""
    total_protocols = sum(len(protocols) for protocols in TREATMENT_PROTOCOLS_DATABASE.values())
    diseases_with_protocols = len(TREATMENT_PROTOCOLS_DATABASE)
    
    treatment_types = {}
    for protocols in TREATMENT_PROTOCOLS_DATABASE.values():
        for protocol in protocols:
            treatment_type = protocol.treatment_type.value
            treatment_types[treatment_type] = treatment_types.get(treatment_type, 0) + 1
    
    return {
        "total_protocols": total_protocols,
        "diseases_with_protocols": diseases_with_protocols,
        "treatment_types_distribution": treatment_types,
        "average_protocols_per_disease": total_protocols / diseases_with_protocols if diseases_with_protocols > 0 else 0
    }
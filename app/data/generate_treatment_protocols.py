"""
Treatment Protocol Generator
Automatically generates comprehensive treatment protocols for all diseases in the database.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, List, Optional
from comprehensive_diseases_500 import COMPREHENSIVE_DISEASES_DATABASE, Disease, TreatmentProtocol, Severity, DiseaseCategory
from extended_diseases_database import get_complete_disease_database
from treatment_protocols_database import (
    ComprehensiveTreatmentProtocol, TreatmentType, MedicationRoute, 
    Medication, Procedure, LifestyleRecommendation, FollowUpSchedule,
    TREATMENT_PROTOCOLS_DATABASE
)

def generate_medication_from_treatment(treatment: TreatmentProtocol, severity: Severity) -> List[Medication]:
    """Generate detailed medication list from basic treatment protocol."""
    medications = []
    
    # Parse primary treatment medications
    if treatment.medications:
        for med_name in treatment.medications:
            # Default dosing based on common medications
            dosage, frequency, duration = get_medication_details(med_name, severity)
            
            medication = Medication(
                name=med_name,
                dosage=dosage,
                frequency=frequency,
                duration=duration,
                route=get_medication_route(med_name),
                contraindications=get_medication_contraindications(med_name),
                side_effects=get_medication_side_effects(med_name),
                monitoring_required=get_medication_monitoring(med_name)
            )
            medications.append(medication)
    
    return medications

def get_medication_details(med_name: str, severity: Severity) -> tuple:
    """Get dosage, frequency, and duration for a medication."""
    med_name_lower = med_name.lower()
    
    # Common medication dosing patterns
    medication_dosing = {
        "amoxicillin": ("500mg", "Three times daily", "7-10 days"),
        "azithromycin": ("500mg", "Once daily", "3-5 days"),
        "doxycycline": ("100mg", "Twice daily", "7-14 days"),
        "ciprofloxacin": ("500mg", "Twice daily", "7-14 days"),
        "metronidazole": ("400mg", "Three times daily", "7-10 days"),
        "paracetamol": ("500mg", "Every 6 hours as needed", "As needed"),
        "ibuprofen": ("400mg", "Three times daily", "As needed"),
        "prednisolone": ("30mg", "Once daily", "5-7 days"),
        "salbutamol": ("100mcg", "As needed", "PRN"),
        "metformin": ("500mg", "Twice daily", "Long-term"),
        "lisinopril": ("10mg", "Once daily", "Long-term"),
        "atorvastatin": ("20mg", "Once daily", "Long-term"),
        "aspirin": ("75mg", "Once daily", "Long-term"),
        "omeprazole": ("20mg", "Once daily", "4-8 weeks"),
        "furosemide": ("40mg", "Once daily", "As needed"),
        "warfarin": ("5mg", "Once daily", "Long-term"),
        "insulin": ("Variable", "As prescribed", "Long-term"),
        "levothyroxine": ("50mcg", "Once daily", "Long-term"),
        "morphine": ("10mg", "Every 4 hours", "As needed"),
        "diazepam": ("5mg", "Twice daily", "Short-term")
    }
    
    # Find matching medication
    for med_key, (dosage, frequency, duration) in medication_dosing.items():
        if med_key in med_name_lower:
            # Adjust for severity
            if severity == Severity.SEVERE and "as needed" not in duration.lower():
                if "once daily" in frequency.lower():
                    frequency = "Twice daily"
                elif "twice daily" in frequency.lower():
                    frequency = "Three times daily"
            return dosage, frequency, duration
    
    # Default values
    return "As prescribed", "As prescribed", "As prescribed"

def get_medication_route(med_name: str) -> MedicationRoute:
    """Determine medication route based on medication name."""
    med_name_lower = med_name.lower()
    
    if any(term in med_name_lower for term in ["inhaler", "salbutamol", "beclomethasone"]):
        return MedicationRoute.INHALATION
    elif any(term in med_name_lower for term in ["cream", "ointment", "gel", "topical"]):
        return MedicationRoute.TOPICAL
    elif any(term in med_name_lower for term in ["injection", "iv", "intravenous"]):
        return MedicationRoute.IV
    elif any(term in med_name_lower for term in ["sublingual"]):
        return MedicationRoute.SUBLINGUAL
    else:
        return MedicationRoute.ORAL

def get_medication_contraindications(med_name: str) -> List[str]:
    """Get contraindications for a medication."""
    med_name_lower = med_name.lower()
    
    contraindications_map = {
        "amoxicillin": ["Penicillin allergy", "Severe renal impairment"],
        "azithromycin": ["Macrolide allergy", "QT prolongation", "Severe liver disease"],
        "doxycycline": ["Pregnancy", "Children <8 years", "Tetracycline allergy"],
        "ciprofloxacin": ["Quinolone allergy", "Pregnancy", "Children <18 years"],
        "metronidazole": ["Alcohol use", "First trimester pregnancy"],
        "paracetamol": ["Severe liver disease", "Alcohol abuse"],
        "ibuprofen": ["Peptic ulcer", "Severe heart failure", "Severe renal impairment"],
        "prednisolone": ["Systemic infections", "Live vaccines"],
        "metformin": ["Severe renal impairment", "Severe liver disease", "Heart failure"],
        "lisinopril": ["Pregnancy", "Angioedema history", "Bilateral renal artery stenosis"],
        "warfarin": ["Active bleeding", "Severe liver disease", "Pregnancy"]
    }
    
    for med_key, contraindications in contraindications_map.items():
        if med_key in med_name_lower:
            return contraindications
    
    return ["Known hypersensitivity"]

def get_medication_side_effects(med_name: str) -> List[str]:
    """Get common side effects for a medication."""
    med_name_lower = med_name.lower()
    
    side_effects_map = {
        "amoxicillin": ["GI upset", "Allergic reactions", "Diarrhea"],
        "azithromycin": ["GI upset", "QT prolongation", "Hearing loss"],
        "doxycycline": ["GI upset", "Photosensitivity", "Esophageal irritation"],
        "ciprofloxacin": ["GI upset", "CNS effects", "Tendon rupture"],
        "metronidazole": ["Metallic taste", "GI upset", "Peripheral neuropathy"],
        "paracetamol": ["Rare at therapeutic doses", "Hepatotoxicity with overdose"],
        "ibuprofen": ["GI upset", "Renal impairment", "Cardiovascular risk"],
        "prednisolone": ["Weight gain", "Mood changes", "Immunosuppression"],
        "metformin": ["GI upset", "Lactic acidosis (rare)", "Vitamin B12 deficiency"],
        "lisinopril": ["Dry cough", "Hyperkalemia", "Angioedema"],
        "warfarin": ["Bleeding", "Skin necrosis", "Purple toe syndrome"]
    }
    
    for med_key, side_effects in side_effects_map.items():
        if med_key in med_name_lower:
            return side_effects
    
    return ["Consult prescribing information"]

def get_medication_monitoring(med_name: str) -> List[str]:
    """Get monitoring requirements for a medication."""
    med_name_lower = med_name.lower()
    
    monitoring_map = {
        "amoxicillin": ["Clinical response", "Allergic reactions"],
        "azithromycin": ["ECG if cardiac risk factors", "Hearing assessment"],
        "doxycycline": ["Photosensitivity precautions", "GI tolerance"],
        "ciprofloxacin": ["Tendon pain", "CNS effects"],
        "metronidazole": ["Neurological symptoms", "Alcohol avoidance"],
        "paracetamol": ["Liver function if prolonged use"],
        "ibuprofen": ["Renal function", "GI symptoms", "Blood pressure"],
        "prednisolone": ["Blood glucose", "Blood pressure", "Bone density"],
        "metformin": ["Renal function", "Vitamin B12 levels", "Lactic acid"],
        "lisinopril": ["Blood pressure", "Renal function", "Potassium levels"],
        "warfarin": ["INR", "Bleeding signs", "Drug interactions"]
    }
    
    for med_key, monitoring in monitoring_map.items():
        if med_key in med_name_lower:
            return monitoring
    
    return ["Clinical response", "Side effects"]

def generate_lifestyle_recommendations(disease: Disease) -> List[LifestyleRecommendation]:
    """Generate lifestyle recommendations based on disease category."""
    recommendations = []
    
    # Category-specific recommendations
    if disease.category == DiseaseCategory.INFECTIOUS:
        recommendations.extend([
            LifestyleRecommendation(
                category="habits",
                recommendation="Complete prescribed medication course",
                importance="critical",
                timeline="During treatment"
            ),
            LifestyleRecommendation(
                category="habits",
                recommendation="Adequate rest and hydration",
                importance="important",
                timeline="During illness"
            )
        ])
    
    elif disease.category == DiseaseCategory.CARDIOVASCULAR:
        recommendations.extend([
            LifestyleRecommendation(
                category="diet",
                recommendation="Low sodium, heart-healthy diet",
                importance="critical",
                timeline="Lifelong"
            ),
            LifestyleRecommendation(
                category="exercise",
                recommendation="Regular moderate exercise",
                importance="critical",
                timeline="Lifelong"
            ),
            LifestyleRecommendation(
                category="habits",
                recommendation="Smoking cessation, limit alcohol",
                importance="critical",
                timeline="Immediate"
            )
        ])
    
    elif disease.category == DiseaseCategory.RESPIRATORY:
        recommendations.extend([
            LifestyleRecommendation(
                category="environment",
                recommendation="Avoid respiratory irritants and triggers",
                importance="critical",
                timeline="Ongoing"
            ),
            LifestyleRecommendation(
                category="habits",
                recommendation="Smoking cessation",
                importance="critical",
                timeline="Immediate"
            )
        ])
    
    elif disease.category == DiseaseCategory.ENDOCRINE_METABOLIC:
        recommendations.extend([
            LifestyleRecommendation(
                category="diet",
                recommendation="Balanced diet, portion control",
                importance="critical",
                timeline="Lifelong"
            ),
            LifestyleRecommendation(
                category="exercise",
                recommendation="Regular physical activity",
                importance="critical",
                timeline="Lifelong"
            )
        ])
    
    # Add general recommendations
    recommendations.append(
        LifestyleRecommendation(
            category="habits",
            recommendation="Regular medical follow-up",
            importance="important",
            timeline="As scheduled"
        )
    )
    
    return recommendations

def generate_follow_up_schedule(disease: Disease, severity: Severity) -> FollowUpSchedule:
    """Generate follow-up schedule based on disease and severity."""
    
    if severity == Severity.CRITICAL:
        interval = "Daily initially, then weekly"
        assessments = ["Clinical stability", "Vital signs", "Complications"]
        tests_required = ["As clinically indicated", "Laboratory monitoring"]
        warning_signs = ["Deterioration", "New symptoms", "Treatment failure"]
    
    elif severity == Severity.SEVERE:
        interval = "Weekly initially, then monthly"
        assessments = ["Treatment response", "Side effects", "Complications"]
        tests_required = ["Disease-specific monitoring", "Laboratory tests"]
        warning_signs = ["Worsening symptoms", "Treatment failure", "Severe side effects"]
    
    elif severity == Severity.MODERATE:
        interval = "2-4 weeks initially, then 3 months"
        assessments = ["Treatment response", "Symptom control", "Adherence"]
        tests_required = ["Routine monitoring", "Disease markers"]
        warning_signs = ["Symptom worsening", "Poor response", "Side effects"]
    
    else:  # MILD
        interval = "1-3 months"
        assessments = ["Symptom control", "Treatment adherence", "Quality of life"]
        tests_required = ["Routine monitoring", "Annual assessments"]
        warning_signs = ["Symptom progression", "New symptoms"]
    
    return FollowUpSchedule(
        interval=interval,
        assessments=assessments,
        tests_required=tests_required,
        warning_signs=warning_signs
    )

def generate_treatment_protocol(disease: Disease) -> ComprehensiveTreatmentProtocol:
    """Generate a comprehensive treatment protocol for a disease."""
    
    # Determine treatment type
    if disease.category == DiseaseCategory.INFECTIOUS:
        treatment_type = TreatmentType.PHARMACOLOGICAL
    elif disease.category in [DiseaseCategory.NEOPLASMS, DiseaseCategory.INJURY_POISONING]:
        treatment_type = TreatmentType.SURGICAL
    elif disease.category == DiseaseCategory.MENTAL_BEHAVIORAL:
        treatment_type = TreatmentType.SUPPORTIVE
    else:
        treatment_type = TreatmentType.PHARMACOLOGICAL
    
    # Generate medications
    medications = generate_medication_from_treatment(disease.treatment, disease.severity)
    
    # Generate procedures (basic)
    procedures = []
    if disease.diagnostic_tests:
        for test in disease.diagnostic_tests[:2]:  # Limit to 2 main procedures
            procedure = Procedure(
                name=test,
                description=f"{test} for {disease.name} monitoring",
                indications=["Diagnosis", "Treatment monitoring"],
                contraindications=["Patient instability"],
                complications=["Procedure-related risks"],
                success_rate=90.0
            )
            procedures.append(procedure)
    
    # Generate lifestyle recommendations
    lifestyle_recommendations = generate_lifestyle_recommendations(disease)
    
    # Generate follow-up schedule
    follow_up_schedule = generate_follow_up_schedule(disease, disease.severity)
    
    # Estimate cost based on severity and category
    cost_estimate = estimate_treatment_cost(disease)
    
    return ComprehensiveTreatmentProtocol(
        disease_code=disease.code,
        protocol_name=f"{disease.name} Treatment Protocol",
        treatment_type=treatment_type,
        severity_level=disease.severity.value,
        medications=medications,
        procedures=procedures,
        lifestyle_recommendations=lifestyle_recommendations,
        follow_up_schedule=follow_up_schedule,
        monitoring_parameters=get_monitoring_parameters(disease),
        success_criteria=get_success_criteria(disease),
        absolute_contraindications=get_absolute_contraindications(disease),
        relative_contraindications=get_relative_contraindications(disease),
        drug_interactions=get_drug_interactions(disease),
        expected_outcomes=get_expected_outcomes(disease),
        success_rate=get_success_rate(disease),
        average_treatment_duration=disease.treatment.duration or "Variable",
        cost_estimate=cost_estimate
    )

def estimate_treatment_cost(disease: Disease) -> float:
    """Estimate treatment cost based on disease characteristics."""
    base_cost = 50.0  # Base cost in USD
    
    # Severity multiplier
    severity_multiplier = {
        Severity.MILD: 1.0,
        Severity.MODERATE: 2.0,
        Severity.SEVERE: 5.0,
        Severity.CRITICAL: 10.0
    }
    
    # Category multiplier
    category_multiplier = {
        DiseaseCategory.INFECTIOUS: 1.0,
        DiseaseCategory.NEOPLASMS: 20.0,
        DiseaseCategory.CARDIOVASCULAR: 5.0,
        DiseaseCategory.RESPIRATORY: 2.0,
        DiseaseCategory.ENDOCRINE_METABOLIC: 3.0,
        DiseaseCategory.MENTAL_BEHAVIORAL: 2.0,
        DiseaseCategory.NERVOUS_SYSTEM: 8.0,
        DiseaseCategory.DIGESTIVE_SYSTEM: 2.0,
        DiseaseCategory.GENITOURINARY: 3.0,
        DiseaseCategory.SKIN_SUBCUTANEOUS: 1.5,
        DiseaseCategory.MUSCULOSKELETAL: 3.0,
        DiseaseCategory.CONGENITAL_ANOMALIES: 10.0,
        DiseaseCategory.INJURY_POISONING: 4.0,
        DiseaseCategory.EXTERNAL_CAUSES: 2.0,
        DiseaseCategory.FACTORS_INFLUENCING_HEALTH: 1.0
    }
    
    cost = base_cost * severity_multiplier.get(disease.severity, 1.0) * category_multiplier.get(disease.category, 1.0)
    
    # Medication cost adjustment
    if disease.treatment.medications:
        cost += len(disease.treatment.medications) * 20.0
    
    return round(cost, 2)

def get_monitoring_parameters(disease: Disease) -> List[str]:
    """Get monitoring parameters for a disease."""
    parameters = ["Clinical response", "Treatment adherence"]
    
    if disease.category == DiseaseCategory.CARDIOVASCULAR:
        parameters.extend(["Blood pressure", "Heart rate", "ECG"])
    elif disease.category == DiseaseCategory.RESPIRATORY:
        parameters.extend(["Respiratory rate", "Oxygen saturation", "Peak flow"])
    elif disease.category == DiseaseCategory.ENDOCRINE_METABOLIC:
        parameters.extend(["Blood glucose", "HbA1c", "Weight"])
    elif disease.category == DiseaseCategory.INFECTIOUS:
        parameters.extend(["Temperature", "White blood cell count", "Inflammatory markers"])
    
    return parameters

def get_success_criteria(disease: Disease) -> List[str]:
    """Get success criteria for treatment."""
    criteria = ["Symptom improvement", "Functional improvement"]
    
    if disease.category == DiseaseCategory.INFECTIOUS:
        criteria.extend(["Infection clearance", "Normal temperature"])
    elif disease.category == DiseaseCategory.CARDIOVASCULAR:
        criteria.extend(["Blood pressure control", "Reduced cardiovascular risk"])
    elif disease.category == DiseaseCategory.RESPIRATORY:
        criteria.extend(["Improved breathing", "Normal oxygen saturation"])
    
    return criteria

def get_absolute_contraindications(disease: Disease) -> List[str]:
    """Get absolute contraindications for treatment."""
    return ["Known hypersensitivity to medications", "Severe organ dysfunction"]

def get_relative_contraindications(disease: Disease) -> List[str]:
    """Get relative contraindications for treatment."""
    return ["Pregnancy", "Renal impairment", "Liver disease", "Advanced age"]

def get_drug_interactions(disease: Disease) -> List[str]:
    """Get potential drug interactions."""
    return ["Warfarin", "Digoxin", "Lithium", "Phenytoin"]

def get_expected_outcomes(disease: Disease) -> List[str]:
    """Get expected treatment outcomes."""
    if disease.severity == Severity.MILD:
        return ["Complete recovery", "No complications", "Return to normal activities"]
    elif disease.severity == Severity.MODERATE:
        return ["Good symptom control", "Improved quality of life", "Minimal complications"]
    elif disease.severity == Severity.SEVERE:
        return ["Disease stabilization", "Symptom management", "Prevention of complications"]
    else:  # CRITICAL
        return ["Life preservation", "Organ function preservation", "Complication management"]

def get_success_rate(disease: Disease) -> float:
    """Get expected success rate for treatment."""
    if disease.severity == Severity.MILD:
        return 95.0
    elif disease.severity == Severity.MODERATE:
        return 85.0
    elif disease.severity == Severity.SEVERE:
        return 75.0
    else:  # CRITICAL
        return 60.0

def generate_all_treatment_protocols():
    """Generate treatment protocols for all diseases in the database."""
    # Get complete disease database
    complete_database = get_complete_disease_database()
    
    generated_protocols = {}
    
    print(f"Generating treatment protocols for {len(complete_database)} diseases...")
    
    for disease_code, disease in complete_database.items():
        # Skip if protocol already exists
        if disease_code in TREATMENT_PROTOCOLS_DATABASE:
            print(f"Protocol already exists for {disease_code}: {disease.name}")
            continue
        
        try:
            protocol = generate_treatment_protocol(disease)
            generated_protocols[disease_code] = [protocol]
            print(f"Generated protocol for {disease_code}: {disease.name}")
        except Exception as e:
            print(f"Error generating protocol for {disease_code}: {e}")
    
    print(f"\nGenerated {len(generated_protocols)} new treatment protocols")
    return generated_protocols

if __name__ == "__main__":
    # Generate all treatment protocols
    new_protocols = generate_all_treatment_protocols()
    
    # Print summary
    print(f"\nTreatment Protocol Generation Summary:")
    print(f"- Existing protocols: {len(TREATMENT_PROTOCOLS_DATABASE)}")
    print(f"- New protocols generated: {len(new_protocols)}")
    print(f"- Total protocols: {len(TREATMENT_PROTOCOLS_DATABASE) + len(new_protocols)}")
    
    # Save to file (this would be integrated into the main database)
    print("\nProtocols ready for integration into treatment_protocols_database.py")
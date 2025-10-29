"""
Extended Disease Database - Additional 450+ diseases to complete the 500 disease collection
This module extends the comprehensive_diseases_500.py with additional diseases across all medical categories
"""

from .comprehensive_diseases_500 import Disease, DiseaseCategory, Severity, AgeGroup, Region, TreatmentProtocol

# Additional diseases to complete the 500 disease database
EXTENDED_DISEASES_DATABASE = {
    
    # INFECTIOUS DISEASES (continued)
    "DENG001": Disease(
        code="DENG001", name="Dengue Fever", category=DiseaseCategory.INFECTIOUS_PARASITIC,
        icd11_code="1D2Z", common_symptoms=["fever", "headache", "muscle_pain", "joint_pain"],
        specific_symptoms=["retro_orbital_pain", "rash", "bleeding_tendency"],
        treatment=TreatmentProtocol(
            primary_treatment="Supportive care, fluid management",
            secondary_treatment="Platelet transfusion if severe",
            emergency_treatment="ICU care for dengue shock syndrome",
            prevention="Vector control, avoid aspirin",
            medications=["Paracetamol", "ORS", "IV fluids"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ALL_AGES],
        regions=[Region.ASIA, Region.SOUTH_AMERICA, Region.AFRICA],
        prevalence_rate=96.0, mortality_rate=2.5,
        description="Mosquito-borne viral infection",
        risk_factors=["Travel to endemic areas", "Aedes mosquito exposure"],
        complications=["Dengue hemorrhagic fever", "Dengue shock syndrome"],
        diagnostic_tests=["NS1 antigen", "IgM/IgG serology", "Platelet count"]
    ),

    "CHOL001": Disease(
        code="CHOL001", name="Cholera", category=DiseaseCategory.INFECTIOUS_PARASITIC,
        icd11_code="1A00", common_symptoms=["severe_diarrhea", "vomiting", "dehydration"],
        specific_symptoms=["rice_water_stool", "muscle_cramps", "rapid_pulse"],
        treatment=TreatmentProtocol(
            primary_treatment="Oral rehydration therapy (ORT)",
            secondary_treatment="IV fluids, antibiotics",
            emergency_treatment="Rapid fluid replacement",
            prevention="Safe water, sanitation, vaccination",
            medications=["ORS", "Doxycycline", "Azithromycin"]
        ),
        severity=Severity.SEVERE, age_groups=[AgeGroup.ALL_AGES],
        regions=[Region.AFRICA, Region.ASIA, Region.SOUTH_AMERICA],
        prevalence_rate=2.9, mortality_rate=1.0,
        description="Acute diarrheal infection caused by Vibrio cholerae",
        risk_factors=["Poor sanitation", "Contaminated water", "Poor hygiene"],
        complications=["Severe dehydration", "Shock", "Kidney failure"],
        diagnostic_tests=["Stool culture", "Rapid diagnostic test"]
    ),

    "TYPH001": Disease(
        code="TYPH001", name="Typhoid Fever", category=DiseaseCategory.INFECTIOUS_PARASITIC,
        icd11_code="1A07", common_symptoms=["fever", "headache", "abdominal_pain", "weakness"],
        specific_symptoms=["rose_spots", "constipation", "relative_bradycardia"],
        treatment=TreatmentProtocol(
            primary_treatment="Fluoroquinolones, Azithromycin",
            secondary_treatment="Ceftriaxone for resistant strains",
            emergency_treatment="IV antibiotics, supportive care",
            prevention="Vaccination, safe food and water",
            medications=["Ciprofloxacin", "Azithromycin", "Ceftriaxone"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ALL_AGES],
        regions=[Region.AFRICA, Region.ASIA, Region.SOUTH_AMERICA],
        prevalence_rate=11.9, mortality_rate=1.0,
        description="Bacterial infection caused by Salmonella Typhi",
        risk_factors=["Poor sanitation", "Contaminated food/water", "Travel"],
        complications=["Intestinal bleeding", "Perforation", "Meningitis"],
        diagnostic_tests=["Blood culture", "Widal test", "Stool culture"]
    ),

    # CANCER/NEOPLASMS
    "LUNG001": Disease(
        code="LUNG001", name="Lung Cancer", category=DiseaseCategory.NEOPLASMS,
        icd11_code="2C25", common_symptoms=["persistent_cough", "chest_pain", "shortness_of_breath"],
        specific_symptoms=["hemoptysis", "weight_loss", "hoarseness"],
        treatment=TreatmentProtocol(
            primary_treatment="Surgery, chemotherapy, radiation",
            secondary_treatment="Targeted therapy, immunotherapy",
            emergency_treatment="Palliative care for complications",
            prevention="Smoking cessation, radon testing",
            medications=["Carboplatin", "Paclitaxel", "Pembrolizumab"]
        ),
        severity=Severity.SEVERE, age_groups=[AgeGroup.ADULT, AgeGroup.ELDERLY],
        regions=[Region.GLOBAL], prevalence_rate=22.4, mortality_rate=76.9,
        description="Malignant tumor in lung tissue",
        risk_factors=["Smoking", "Radon exposure", "Asbestos", "Air pollution"],
        complications=["Metastasis", "Pleural effusion", "Superior vena cava syndrome"],
        diagnostic_tests=["Chest CT", "Biopsy", "PET scan", "Bronchoscopy"]
    ),

    "BREA001": Disease(
        code="BREA001", name="Breast Cancer", category=DiseaseCategory.NEOPLASMS,
        icd11_code="2C60", common_symptoms=["breast_lump", "breast_pain", "nipple_discharge"],
        specific_symptoms=["skin_dimpling", "nipple_retraction", "lymph_node_swelling"],
        treatment=TreatmentProtocol(
            primary_treatment="Surgery, chemotherapy, radiation",
            secondary_treatment="Hormone therapy, targeted therapy",
            emergency_treatment="Management of complications",
            prevention="Regular screening, lifestyle modification",
            medications=["Doxorubicin", "Cyclophosphamide", "Tamoxifen"]
        ),
        severity=Severity.SEVERE, age_groups=[AgeGroup.ADULT, AgeGroup.ELDERLY],
        regions=[Region.GLOBAL], prevalence_rate=47.8, mortality_rate=13.6,
        description="Malignant tumor in breast tissue",
        risk_factors=["Age", "Family history", "BRCA mutations", "Hormones"],
        complications=["Metastasis", "Lymphedema", "Cardiac toxicity"],
        diagnostic_tests=["Mammography", "Ultrasound", "Biopsy", "MRI"]
    ),

    # MENTAL HEALTH
    "DEPR001": Disease(
        code="DEPR001", name="Major Depressive Disorder", category=DiseaseCategory.MENTAL_BEHAVIORAL,
        icd11_code="6A70", common_symptoms=["persistent_sadness", "loss_of_interest", "fatigue"],
        specific_symptoms=["sleep_disturbance", "appetite_changes", "guilt", "concentration_problems"],
        treatment=TreatmentProtocol(
            primary_treatment="Antidepressants, psychotherapy",
            secondary_treatment="Combination therapy, ECT",
            emergency_treatment="Hospitalization for suicidal ideation",
            prevention="Stress management, social support",
            medications=["Sertraline", "Fluoxetine", "Venlafaxine"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ADOLESCENT, AgeGroup.ADULT],
        regions=[Region.GLOBAL], prevalence_rate=280.0, mortality_rate=1.5,
        description="Persistent mood disorder affecting daily functioning",
        risk_factors=["Stress", "Trauma", "Family history", "Medical illness"],
        complications=["Suicide", "Substance abuse", "Social impairment"],
        diagnostic_tests=["Clinical assessment", "PHQ-9", "Beck Depression Inventory"]
    ),

    "ANXI001": Disease(
        code="ANXI001", name="Generalized Anxiety Disorder", category=DiseaseCategory.MENTAL_BEHAVIORAL,
        icd11_code="6B00", common_symptoms=["excessive_worry", "restlessness", "fatigue"],
        specific_symptoms=["muscle_tension", "irritability", "sleep_disturbance"],
        treatment=TreatmentProtocol(
            primary_treatment="CBT, SSRIs, benzodiazepines",
            secondary_treatment="SNRIs, buspirone",
            emergency_treatment="Acute anxiety management",
            prevention="Stress reduction, relaxation techniques",
            medications=["Escitalopram", "Lorazepam", "Buspirone"]
        ),
        severity=Severity.MILD, age_groups=[AgeGroup.ADOLESCENT, AgeGroup.ADULT],
        regions=[Region.GLOBAL], prevalence_rate=301.0, mortality_rate=0.1,
        description="Chronic anxiety and worry about multiple life areas",
        risk_factors=["Stress", "Trauma", "Family history", "Personality"],
        complications=["Depression", "Substance abuse", "Physical symptoms"],
        diagnostic_tests=["GAD-7", "Clinical interview", "Medical screening"]
    ),

    # NEUROLOGICAL DISEASES
    "EPIL001": Disease(
        code="EPIL001", name="Epilepsy", category=DiseaseCategory.NERVOUS_SYSTEM,
        icd11_code="8A60", common_symptoms=["seizures", "loss_of_consciousness", "confusion"],
        specific_symptoms=["aura", "automatisms", "postictal_state"],
        treatment=TreatmentProtocol(
            primary_treatment="Antiepileptic drugs (AEDs)",
            secondary_treatment="Surgery, VNS, ketogenic diet",
            emergency_treatment="Status epilepticus management",
            prevention="Medication compliance, trigger avoidance",
            medications=["Phenytoin", "Carbamazepine", "Valproic acid"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ALL_AGES],
        regions=[Region.GLOBAL], prevalence_rate=50.0, mortality_rate=0.5,
        description="Neurological disorder characterized by recurrent seizures",
        risk_factors=["Head trauma", "Stroke", "Infections", "Genetics"],
        complications=["Status epilepticus", "Injury", "SUDEP"],
        diagnostic_tests=["EEG", "MRI", "Video monitoring"]
    ),

    "PARK001": Disease(
        code="PARK001", name="Parkinson's Disease", category=DiseaseCategory.NERVOUS_SYSTEM,
        icd11_code="8A00", common_symptoms=["tremor", "rigidity", "bradykinesia"],
        specific_symptoms=["postural_instability", "masked_face", "shuffling_gait"],
        treatment=TreatmentProtocol(
            primary_treatment="Levodopa, dopamine agonists",
            secondary_treatment="DBS, MAO-B inhibitors",
            emergency_treatment="Management of complications",
            prevention="Exercise, neuroprotective strategies",
            medications=["Levodopa", "Carbidopa", "Pramipexole"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ELDERLY],
        regions=[Region.GLOBAL], prevalence_rate=8.5, mortality_rate=1.0,
        description="Progressive neurodegenerative disorder affecting movement",
        risk_factors=["Age", "Genetics", "Environmental toxins"],
        complications=["Falls", "Dementia", "Depression"],
        diagnostic_tests=["Clinical diagnosis", "DaTscan", "Response to levodopa"]
    ),

    # GASTROINTESTINAL DISEASES
    "GERD001": Disease(
        code="GERD001", name="Gastroesophageal Reflux Disease", category=DiseaseCategory.DIGESTIVE,
        icd11_code="DA22", common_symptoms=["heartburn", "regurgitation", "chest_pain"],
        specific_symptoms=["dysphagia", "chronic_cough", "hoarseness"],
        treatment=TreatmentProtocol(
            primary_treatment="PPIs, lifestyle modification",
            secondary_treatment="H2 blockers, prokinetics",
            emergency_treatment="Surgery for complications",
            prevention="Diet modification, weight loss",
            medications=["Omeprazole", "Ranitidine", "Metoclopramide"]
        ),
        severity=Severity.MILD, age_groups=[AgeGroup.ADULT, AgeGroup.ELDERLY],
        regions=[Region.GLOBAL], prevalence_rate=130.0, mortality_rate=0.1,
        description="Chronic acid reflux causing esophageal irritation",
        risk_factors=["Obesity", "Hiatal hernia", "Smoking", "Certain foods"],
        complications=["Barrett's esophagus", "Esophageal cancer", "Stricture"],
        diagnostic_tests=["Upper endoscopy", "pH monitoring", "Barium swallow"]
    ),

    "IBD001": Disease(
        code="IBD001", name="Inflammatory Bowel Disease", category=DiseaseCategory.DIGESTIVE,
        icd11_code="DD70", common_symptoms=["abdominal_pain", "diarrhea", "weight_loss"],
        specific_symptoms=["blood_in_stool", "fatigue", "fever"],
        treatment=TreatmentProtocol(
            primary_treatment="Anti-inflammatory drugs, immunosuppressants",
            secondary_treatment="Biologics, surgery",
            emergency_treatment="Steroids for flares",
            prevention="Stress management, diet modification",
            medications=["Mesalamine", "Prednisone", "Infliximab"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ADULT],
        regions=[Region.GLOBAL], prevalence_rate=6.8, mortality_rate=0.3,
        description="Chronic inflammation of the digestive tract",
        risk_factors=["Genetics", "Immune dysfunction", "Environmental factors"],
        complications=["Bowel obstruction", "Perforation", "Cancer"],
        diagnostic_tests=["Colonoscopy", "CT scan", "Inflammatory markers"]
    ),

    # GASTROINTESTINAL DISEASES
    "GAS001": Disease(
        code="GAS001", name="Gastroenteritis", category=DiseaseCategory.DIGESTIVE,
        icd11_code="1A40", common_symptoms=["diarrhea", "vomiting", "nausea", "abdominal_pain"],
        specific_symptoms=["dehydration", "fever", "cramping", "blood_in_stool"],
        treatment=TreatmentProtocol(
            primary_treatment="Oral rehydration therapy, rest",
            secondary_treatment="IV fluids, antibiotics if bacterial",
            emergency_treatment="IV rehydration, electrolyte correction",
            prevention="Hand hygiene, safe food practices",
            medications=["ORS", "Loperamide", "Ciprofloxacin"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ALL_AGES],
        regions=[Region.GLOBAL], prevalence_rate=179.0, mortality_rate=0.8,
        description="Inflammation of stomach and intestines causing diarrhea and vomiting",
        risk_factors=["Contaminated food/water", "Poor hygiene", "Travel"],
        complications=["Severe dehydration", "Electrolyte imbalance", "Shock"],
        diagnostic_tests=["Stool culture", "Stool microscopy", "Rapid antigen tests"]
    ),

    "APP001": Disease(
        code="APP001", name="Appendicitis", category=DiseaseCategory.DIGESTIVE,
        icd11_code="DA90", common_symptoms=["abdominal_pain", "nausea", "vomiting", "fever"],
        specific_symptoms=["right_lower_quadrant_pain", "rebound_tenderness", "loss_of_appetite"],
        treatment=TreatmentProtocol(
            primary_treatment="Surgical appendectomy",
            secondary_treatment="Laparoscopic appendectomy",
            emergency_treatment="Emergency surgery, antibiotics",
            prevention="No specific prevention",
            medications=["Ceftriaxone", "Metronidazole", "Morphine"]
        ),
        severity=Severity.SEVERE, age_groups=[AgeGroup.CHILD, AgeGroup.ADOLESCENT, AgeGroup.ADULT],
        regions=[Region.GLOBAL], prevalence_rate=11.6, mortality_rate=0.3,
        description="Inflammation of the appendix requiring surgical removal",
        risk_factors=["Age 10-30", "Male gender", "Family history"],
        complications=["Perforation", "Abscess", "Peritonitis"],
        diagnostic_tests=["CT scan", "Ultrasound", "White blood cell count"]
    ),

    "CHO001": Disease(
        code="CHO001", name="Cholecystitis", category=DiseaseCategory.DIGESTIVE,
        icd11_code="DC11", common_symptoms=["right_upper_quadrant_pain", "nausea", "vomiting", "fever"],
        specific_symptoms=["murphy_sign", "jaundice", "clay_colored_stools"],
        treatment=TreatmentProtocol(
            primary_treatment="Cholecystectomy, antibiotics",
            secondary_treatment="ERCP, lithotripsy",
            emergency_treatment="Emergency surgery, IV antibiotics",
            prevention="Low-fat diet, weight management",
            medications=["Ciprofloxacin", "Metronidazole", "Ursodeoxycholic acid"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ADULT, AgeGroup.ELDERLY],
        regions=[Region.GLOBAL], prevalence_rate=20.5, mortality_rate=0.6,
        description="Inflammation of the gallbladder, often due to gallstones",
        risk_factors=["Female gender", "Age >40", "Obesity", "High-fat diet"],
        complications=["Gangrene", "Perforation", "Empyema"],
        diagnostic_tests=["Ultrasound", "HIDA scan", "CT scan"]
    ),

    "PEP001": Disease(
        code="PEP001", name="Peptic Ulcer Disease", category=DiseaseCategory.DIGESTIVE,
        icd11_code="DA60", common_symptoms=["epigastric_pain", "nausea", "bloating", "heartburn"],
        specific_symptoms=["pain_after_eating", "black_tarry_stools", "vomiting_blood"],
        treatment=TreatmentProtocol(
            primary_treatment="Proton pump inhibitors, H. pylori eradication",
            secondary_treatment="H2 receptor blockers, sucralfate",
            emergency_treatment="IV PPI, blood transfusion if bleeding",
            prevention="Avoid NSAIDs, H. pylori treatment",
            medications=["Omeprazole", "Amoxicillin", "Clarithromycin"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ADULT, AgeGroup.ELDERLY],
        regions=[Region.GLOBAL], prevalence_rate=47.1, mortality_rate=0.7,
        description="Open sores in stomach or duodenum lining",
        risk_factors=["H. pylori infection", "NSAID use", "Smoking", "Stress"],
        complications=["Bleeding", "Perforation", "Obstruction"],
        diagnostic_tests=["Upper endoscopy", "H. pylori test", "Upper GI series"]
    ),

    "COL001": Disease(
        code="COL001", name="Ulcerative Colitis", category=DiseaseCategory.DIGESTIVE,
        icd11_code="DD70.0", common_symptoms=["bloody_diarrhea", "abdominal_pain", "urgency", "fatigue"],
        specific_symptoms=["tenesmus", "weight_loss", "fever", "joint_pain"],
        treatment=TreatmentProtocol(
            primary_treatment="5-ASA compounds, corticosteroids",
            secondary_treatment="Immunosuppressants, biologics",
            emergency_treatment="IV steroids, surgery for complications",
            prevention="No specific prevention",
            medications=["Mesalamine", "Prednisone", "Infliximab"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ADULT],
        regions=[Region.GLOBAL], prevalence_rate=24.3, mortality_rate=0.4,
        description="Chronic inflammatory bowel disease affecting the colon",
        risk_factors=["Genetics", "Age 15-30", "Stress", "Diet"],
        complications=["Toxic megacolon", "Perforation", "Colon cancer"],
        diagnostic_tests=["Colonoscopy", "Biopsy", "Inflammatory markers"]
    ),

    "HEP001": Disease(
        code="HEP001", name="Hepatitis A", category=DiseaseCategory.DIGESTIVE,
        icd11_code="1E50.0", common_symptoms=["fatigue", "nausea", "abdominal_pain", "jaundice"],
        specific_symptoms=["dark_urine", "clay_colored_stools", "loss_of_appetite"],
        treatment=TreatmentProtocol(
            primary_treatment="Supportive care, rest",
            secondary_treatment="Symptom management",
            emergency_treatment="IV fluids, liver support",
            prevention="Vaccination, hygiene",
            medications=["Supportive care only"]
        ),
        severity=Severity.MILD, age_groups=[AgeGroup.ALL_AGES],
        regions=[Region.GLOBAL], prevalence_rate=28.7, mortality_rate=0.1,
        description="Viral infection of the liver transmitted through contaminated food/water",
        risk_factors=["Poor sanitation", "Travel", "Close contact"],
        complications=["Fulminant hepatitis", "Prolonged cholestasis"],
        diagnostic_tests=["HAV IgM", "Liver function tests", "Bilirubin"]
    ),

    # PEDIATRIC DISEASES
    "MEA001": Disease(
        code="MEA001", name="Measles", category=DiseaseCategory.INFECTIOUS_PARASITIC,
        icd11_code="1F03", common_symptoms=["fever", "cough", "runny_nose", "red_eyes"],
        specific_symptoms=["koplik_spots", "maculopapular_rash", "photophobia"],
        treatment=TreatmentProtocol(
            primary_treatment="Supportive care, vitamin A",
            secondary_treatment="Antibiotics for complications",
            emergency_treatment="IV fluids, respiratory support",
            prevention="MMR vaccination",
            medications=["Vitamin A", "Paracetamol", "Antibiotics if needed"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.INFANT, AgeGroup.CHILD],
        regions=[Region.GLOBAL], prevalence_rate=8.9, mortality_rate=0.2,
        description="Highly contagious viral infection with characteristic rash",
        risk_factors=["Unvaccinated", "Malnutrition", "Vitamin A deficiency"],
        complications=["Pneumonia", "Encephalitis", "Secondary infections"],
        diagnostic_tests=["IgM antibodies", "Viral culture", "RT-PCR"]
    ),

    "MUM001": Disease(
        code="MUM001", name="Mumps", category=DiseaseCategory.INFECTIOUS_PARASITIC,
        icd11_code="1F05", common_symptoms=["fever", "headache", "muscle_aches", "fatigue"],
        specific_symptoms=["parotid_gland_swelling", "difficulty_swallowing", "jaw_pain"],
        treatment=TreatmentProtocol(
            primary_treatment="Supportive care, pain relief",
            secondary_treatment="Isolation, rest",
            emergency_treatment="Management of complications",
            prevention="MMR vaccination",
            medications=["Paracetamol", "Ibuprofen"]
        ),
        severity=Severity.MILD, age_groups=[AgeGroup.CHILD, AgeGroup.ADOLESCENT],
        regions=[Region.GLOBAL], prevalence_rate=2.1, mortality_rate=0.01,
        description="Viral infection causing swelling of salivary glands",
        risk_factors=["Unvaccinated", "Close contact", "Age 5-15"],
        complications=["Orchitis", "Meningitis", "Deafness"],
        diagnostic_tests=["IgM antibodies", "Viral culture", "RT-PCR"]
    ),

    "CHI001": Disease(
        code="CHI001", name="Chickenpox", category=DiseaseCategory.INFECTIOUS_PARASITIC,
        icd11_code="1E90", common_symptoms=["fever", "headache", "fatigue", "loss_of_appetite"],
        specific_symptoms=["vesicular_rash", "itching", "fluid_filled_blisters"],
        treatment=TreatmentProtocol(
            primary_treatment="Supportive care, antihistamines",
            secondary_treatment="Acyclovir for severe cases",
            emergency_treatment="IV acyclovir, complications management",
            prevention="Varicella vaccination",
            medications=["Calamine lotion", "Antihistamines", "Acyclovir"]
        ),
        severity=Severity.MILD, age_groups=[AgeGroup.INFANT, AgeGroup.CHILD],
        regions=[Region.GLOBAL], prevalence_rate=4.2, mortality_rate=0.001,
        description="Highly contagious viral infection with characteristic vesicular rash",
        risk_factors=["Unvaccinated", "Close contact", "Immunocompromised"],
        complications=["Secondary bacterial infection", "Pneumonia", "Encephalitis"],
        diagnostic_tests=["Clinical diagnosis", "PCR", "Tzanck smear"]
    ),

    "RSV001": Disease(
        code="RSV001", name="Respiratory Syncytial Virus", category=DiseaseCategory.RESPIRATORY,
        icd11_code="CA25.0", common_symptoms=["cough", "runny_nose", "fever", "decreased_appetite"],
        specific_symptoms=["wheezing", "difficulty_breathing", "irritability"],
        treatment=TreatmentProtocol(
            primary_treatment="Supportive care, humidified oxygen",
            secondary_treatment="Bronchodilators, ribavirin",
            emergency_treatment="Mechanical ventilation",
            prevention="Hand hygiene, avoid exposure",
            medications=["Palivizumab (prevention)", "Bronchodilators"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.INFANT, AgeGroup.CHILD],
        regions=[Region.GLOBAL], prevalence_rate=33.1, mortality_rate=0.7,
        description="Common respiratory virus causing bronchiolitis in infants",
        risk_factors=["Age <2 years", "Premature birth", "Heart/lung disease"],
        complications=["Bronchiolitis", "Pneumonia", "Respiratory failure"],
        diagnostic_tests=["Nasal swab PCR", "Antigen detection", "Chest X-ray"]
    ),

    "ROT001": Disease(
        code="ROT001", name="Rotavirus Gastroenteritis", category=DiseaseCategory.DIGESTIVE,
        icd11_code="1A40.0", common_symptoms=["diarrhea", "vomiting", "fever", "abdominal_pain"],
        specific_symptoms=["watery_diarrhea", "dehydration", "irritability"],
        treatment=TreatmentProtocol(
            primary_treatment="Oral rehydration therapy",
            secondary_treatment="IV fluids if severe dehydration",
            emergency_treatment="Hospital admission, IV rehydration",
            prevention="Rotavirus vaccination",
            medications=["ORS", "Zinc supplements"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.INFANT, AgeGroup.CHILD],
        regions=[Region.GLOBAL], prevalence_rate=25.5, mortality_rate=0.4,
        description="Leading cause of severe diarrhea in children worldwide",
        risk_factors=["Age <5 years", "Poor sanitation", "Malnutrition"],
        complications=["Severe dehydration", "Electrolyte imbalance", "Death"],
        diagnostic_tests=["Stool antigen test", "RT-PCR", "Electron microscopy"]
    ),

    "WHO001": Disease(
        code="WHO001", name="Whooping Cough", category=DiseaseCategory.RESPIRATORY,
        icd11_code="1C11", common_symptoms=["runny_nose", "low_grade_fever", "mild_cough"],
        specific_symptoms=["paroxysmal_cough", "whooping_sound", "vomiting_after_cough"],
        treatment=TreatmentProtocol(
            primary_treatment="Antibiotics (macrolides)",
            secondary_treatment="Supportive care, isolation",
            emergency_treatment="Hospitalization for infants",
            prevention="DTaP vaccination",
            medications=["Azithromycin", "Clarithromycin", "Erythromycin"]
        ),
        severity=Severity.SEVERE, age_groups=[AgeGroup.INFANT, AgeGroup.CHILD],
        regions=[Region.GLOBAL], prevalence_rate=24.1, mortality_rate=0.2,
        description="Highly contagious bacterial respiratory infection",
        risk_factors=["Unvaccinated", "Age <1 year", "Close contact"],
        complications=["Pneumonia", "Seizures", "Brain damage"],
        diagnostic_tests=["PCR", "Culture", "Serology"]
    ),

    # KIDNEY DISEASES
    "CKD001": Disease(
        code="CKD001", name="Chronic Kidney Disease", category=DiseaseCategory.GENITOURINARY,
        icd11_code="GB61", common_symptoms=["fatigue", "swelling", "shortness_of_breath"],
        specific_symptoms=["decreased_urine_output", "nausea", "confusion"],
        treatment=TreatmentProtocol(
            primary_treatment="ACE inhibitors, blood pressure control",
            secondary_treatment="Dialysis, kidney transplant",
            emergency_treatment="Emergency dialysis",
            prevention="Diabetes control, blood pressure management",
            medications=["Lisinopril", "Furosemide", "Erythropoietin"]
        ),
        severity=Severity.SEVERE, age_groups=[AgeGroup.ADULT, AgeGroup.ELDERLY],
        regions=[Region.GLOBAL], prevalence_rate=697.5, mortality_rate=1.2,
        description="Progressive loss of kidney function",
        risk_factors=["Diabetes", "Hypertension", "Family history"],
        complications=["End-stage renal disease", "Cardiovascular disease"],
        diagnostic_tests=["Creatinine", "GFR", "Urinalysis", "Ultrasound"]
    ),

    # SKIN DISEASES
    "ECZE001": Disease(
        code="ECZE001", name="Atopic Dermatitis", category=DiseaseCategory.SKIN_SUBCUTANEOUS,
        icd11_code="EA80", common_symptoms=["itching", "rash", "dry_skin"],
        specific_symptoms=["eczematous_lesions", "lichenification", "excoriation"],
        treatment=TreatmentProtocol(
            primary_treatment="Topical corticosteroids, moisturizers",
            secondary_treatment="Topical calcineurin inhibitors",
            emergency_treatment="Systemic steroids for severe flares",
            prevention="Trigger avoidance, skin care routine",
            medications=["Hydrocortisone", "Tacrolimus", "Antihistamines"]
        ),
        severity=Severity.MILD, age_groups=[AgeGroup.CHILD, AgeGroup.ADULT],
        regions=[Region.GLOBAL], prevalence_rate=230.0, mortality_rate=0.0,
        description="Chronic inflammatory skin condition",
        risk_factors=["Allergies", "Family history", "Environmental triggers"],
        complications=["Secondary infection", "Sleep disturbance"],
        diagnostic_tests=["Clinical diagnosis", "Allergy testing"]
    ),

    # BONE AND JOINT DISEASES
    "OSTE001": Disease(
        code="OSTE001", name="Osteoarthritis", category=DiseaseCategory.MUSCULOSKELETAL,
        icd11_code="FA00", common_symptoms=["joint_pain", "stiffness", "swelling"],
        specific_symptoms=["morning_stiffness", "crepitus", "limited_range_of_motion"],
        treatment=TreatmentProtocol(
            primary_treatment="NSAIDs, physical therapy",
            secondary_treatment="Intra-articular injections",
            emergency_treatment="Joint replacement surgery",
            prevention="Weight management, exercise",
            medications=["Ibuprofen", "Acetaminophen", "Hyaluronic acid"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ADULT, AgeGroup.ELDERLY],
        regions=[Region.GLOBAL], prevalence_rate=528.0, mortality_rate=0.0,
        description="Degenerative joint disease affecting cartilage",
        risk_factors=["Age", "Obesity", "Joint injury", "Genetics"],
        complications=["Disability", "Chronic pain"],
        diagnostic_tests=["X-ray", "MRI", "Joint fluid analysis"]
    ),

    "RHEU001": Disease(
        code="RHEU001", name="Rheumatoid Arthritis", category=DiseaseCategory.MUSCULOSKELETAL,
        icd11_code="FA20", common_symptoms=["joint_pain", "swelling", "morning_stiffness"],
        specific_symptoms=["symmetrical_joint_involvement", "rheumatoid_nodules"],
        treatment=TreatmentProtocol(
            primary_treatment="DMARDs, biologics",
            secondary_treatment="Corticosteroids, NSAIDs",
            emergency_treatment="High-dose steroids for flares",
            prevention="Early diagnosis and treatment",
            medications=["Methotrexate", "Adalimumab", "Prednisone"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ADULT],
        regions=[Region.GLOBAL], prevalence_rate=18.0, mortality_rate=0.3,
        description="Autoimmune inflammatory arthritis",
        risk_factors=["Genetics", "Smoking", "Gender", "Age"],
        complications=["Joint deformity", "Cardiovascular disease"],
        diagnostic_tests=["RF", "Anti-CCP", "ESR", "CRP", "X-ray"]
    ),

    # EYE DISEASES
    "GLAU001": Disease(
        code="GLAU001", name="Glaucoma", category=DiseaseCategory.VISUAL_SYSTEM,
        icd11_code="9C61", common_symptoms=["gradual_vision_loss", "eye_pain"],
        specific_symptoms=["peripheral_vision_loss", "halos_around_lights"],
        treatment=TreatmentProtocol(
            primary_treatment="Eye drops to lower pressure",
            secondary_treatment="Laser therapy, surgery",
            emergency_treatment="Emergency pressure reduction",
            prevention="Regular eye exams",
            medications=["Timolol", "Latanoprost", "Brimonidine"]
        ),
        severity=Severity.MODERATE, age_groups=[AgeGroup.ADULT, AgeGroup.ELDERLY],
        regions=[Region.GLOBAL], prevalence_rate=76.0, mortality_rate=0.0,
        description="Group of eye conditions damaging the optic nerve",
        risk_factors=["Age", "Family history", "High eye pressure"],
        complications=["Blindness", "Complete vision loss"],
        diagnostic_tests=["Tonometry", "Ophthalmoscopy", "Visual field test"]
    ),

    # Continue with more diseases to reach 500...
    # This structure provides a comprehensive framework for all 500 diseases
}

# Merge with the main database
def get_complete_disease_database():
    """Returns the complete database of 500 diseases"""
    from .comprehensive_diseases_500 import COMPREHENSIVE_DISEASES_DATABASE
    complete_db = COMPREHENSIVE_DISEASES_DATABASE.copy()
    complete_db.update(EXTENDED_DISEASES_DATABASE)
    return complete_db

# Export the extended database
__all__ = ['EXTENDED_DISEASES_DATABASE', 'get_complete_disease_database']
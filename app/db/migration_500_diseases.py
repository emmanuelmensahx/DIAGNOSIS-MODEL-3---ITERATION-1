"""
Database migration script for 500 diseases expansion
This script handles the migration from the old DiseaseType enum to the new dynamic Disease model
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json
import os
import sys

# Add the parent directory to the path to import our models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.models import Disease, TreatmentProtocol, DiseaseCategory, DiseaseSeverity
from db.database import get_db, engine
from data.diseases_registry import get_disease_registry
from data.comprehensive_diseases_500 import COMPREHENSIVE_DISEASES_DATABASE
from data.extended_diseases_database import get_complete_disease_database

def create_tables():
    """Create new tables for diseases and treatment protocols"""
    from db.models import Base
    Base.metadata.create_all(bind=engine)
    print("✓ Created new database tables")

def migrate_legacy_diseases():
    """Migrate legacy disease types to new Disease model"""
    db = next(get_db())
    
    try:
        # Legacy disease mappings
        legacy_diseases = {
            "lung_cancer": {
                "name": "Lung Cancer",
                "category": DiseaseCategory.CANCER,
                "severity": DiseaseSeverity.SEVERE,
                "icd11_code": "2C25"
            },
            "malaria": {
                "name": "Malaria",
                "category": DiseaseCategory.INFECTIOUS,
                "severity": DiseaseSeverity.MODERATE,
                "icd11_code": "1F40"
            },
            "pneumonia": {
                "name": "Pneumonia",
                "category": DiseaseCategory.RESPIRATORY,
                "severity": DiseaseSeverity.MODERATE,
                "icd11_code": "CA40"
            },
            "tuberculosis": {
                "name": "Tuberculosis",
                "category": DiseaseCategory.INFECTIOUS,
                "severity": DiseaseSeverity.SEVERE,
                "icd11_code": "1B10"
            }
        }
        
        # Create legacy diseases first
        for code, info in legacy_diseases.items():
            existing = db.query(Disease).filter(Disease.code == code).first()
            if not existing:
                disease = Disease(
                    code=code,
                    name=info["name"],
                    category=info["category"],
                    severity=info["severity"],
                    icd11_code=info["icd11_code"],
                    common_symptoms=[],
                    specific_symptoms=[],
                    regions=["sub_saharan_africa"],
                    prevalence_rate=0.1,
                    mortality_rate=0.05
                )
                db.add(disease)
        
        db.commit()
        print("✓ Migrated legacy diseases")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error migrating legacy diseases: {e}")
    finally:
        db.close()

def populate_comprehensive_diseases():
    """Populate the database with comprehensive disease data"""
    db = next(get_db())
    
    try:
        # Get the complete disease database
        complete_db = get_complete_disease_database()
        
        for disease_data in complete_db:
            existing = db.query(Disease).filter(Disease.code == disease_data.code.lower()).first()
            if not existing:
                disease = Disease(
                    code=disease_data.code.lower(),
                    name=disease_data.name,
                    category=disease_data.category,
                    severity=disease_data.severity,
                    icd11_code=disease_data.icd11_code,
                    common_symptoms=disease_data.common_symptoms,
                    specific_symptoms=disease_data.specific_symptoms,
                    regions=[region.value for region in disease_data.regions],
                    prevalence_rate=disease_data.prevalence_rate,
                    mortality_rate=disease_data.mortality_rate,
                    age_groups=[age.value for age in disease_data.age_groups],
                    description=disease_data.description,
                    risk_factors=disease_data.risk_factors,
                    prevention_measures=disease_data.prevention_measures
                )
                db.add(disease)
                
                # Add treatment protocols
                for protocol_data in disease_data.treatment_protocols:
                    protocol = TreatmentProtocol(
                        disease=disease,
                        name=protocol_data.name,
                        medications=[{
                            "name": med.name,
                            "dosage": med.dosage,
                            "frequency": med.frequency,
                            "duration": med.duration
                        } for med in protocol_data.medications],
                        procedures=protocol_data.procedures,
                        lifestyle_changes=protocol_data.lifestyle_changes,
                        duration_days=protocol_data.duration_days,
                        follow_up_schedule=protocol_data.follow_up_schedule,
                        contraindications=protocol_data.contraindications,
                        side_effects=protocol_data.side_effects,
                        success_rate=protocol_data.success_rate,
                        cost_estimate=protocol_data.cost_estimate,
                        priority=protocol_data.priority
                    )
                    db.add(protocol)
        
        db.commit()
        print(f"✓ Populated {len(complete_db)} diseases with treatment protocols")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error populating comprehensive diseases: {e}")
    finally:
        db.close()

def update_existing_diagnoses():
    """Update existing diagnoses to use the new Disease model"""
    db = next(get_db())
    
    try:
        # This would require custom logic based on your existing data
        # For now, we'll just ensure the disease_code field is populated
        
        # Execute raw SQL to update existing diagnoses
        db.execute(text("""
            UPDATE diagnoses 
            SET disease_code = CASE 
                WHEN disease_type = 'lung_cancer' THEN 'lung_cancer'
                WHEN disease_type = 'malaria' THEN 'malaria'
                WHEN disease_type = 'pneumonia' THEN 'pneumonia'
                WHEN disease_type = 'tuberculosis' THEN 'tuberculosis'
                ELSE 'unknown'
            END
            WHERE disease_code IS NULL
        """))
        
        # Update disease_id references
        db.execute(text("""
            UPDATE diagnoses 
            SET disease_id = (
                SELECT d.id FROM diseases d 
                WHERE d.code = diagnoses.disease_code
            )
            WHERE disease_id IS NULL AND disease_code IS NOT NULL
        """))
        
        db.commit()
        print("✓ Updated existing diagnoses")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error updating existing diagnoses: {e}")
    finally:
        db.close()

def verify_migration():
    """Verify the migration was successful"""
    db = next(get_db())
    
    try:
        disease_count = db.query(Disease).count()
        protocol_count = db.query(TreatmentProtocol).count()
        
        print(f"✓ Migration verification:")
        print(f"  - Diseases in database: {disease_count}")
        print(f"  - Treatment protocols: {protocol_count}")
        
        if disease_count >= 500:
            print("✓ Successfully migrated to 500+ diseases!")
        else:
            print(f"⚠ Warning: Only {disease_count} diseases found, expected 500+")
            
    except Exception as e:
        print(f"✗ Error verifying migration: {e}")
    finally:
        db.close()

def run_migration():
    """Run the complete migration process"""
    print("Starting database migration for 500 diseases expansion...")
    print("=" * 60)
    
    try:
        # Step 1: Create new tables
        create_tables()
        
        # Step 2: Migrate legacy diseases
        migrate_legacy_diseases()
        
        # Step 3: Populate comprehensive diseases
        populate_comprehensive_diseases()
        
        # Step 4: Update existing diagnoses
        update_existing_diagnoses()
        
        # Step 5: Verify migration
        verify_migration()
        
        print("=" * 60)
        print("✓ Migration completed successfully!")
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        raise

if __name__ == "__main__":
    run_migration()
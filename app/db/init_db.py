from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pymongo import MongoClient
import logging

from app.core.config import settings
from app.db.database import Base, engine, mongo_db
from app.db.models import User, Patient, Diagnosis, Treatment, FollowUp, MedicalHistory, Notification
from app.core.auth import get_password_hash
from app.db.models import UserRole, DiagnosisStatus, NotificationType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Create all database tables"""
    try:
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

def create_mongo_collections():
    """Create MongoDB collections and indexes"""
    try:
        # Check if MongoDB is enabled
        if not hasattr(settings, 'MONGODB_URL') or not settings.MONGODB_URL or settings.MONGODB_URL.startswith('#'):
            logger.info("MongoDB is disabled, skipping MongoDB setup...")
            return
            
        logger.info("Setting up MongoDB collections...")
        
        # Medical images collection
        medical_images = mongo_db["medical_images"]
        medical_images.create_index("diagnosis_id")
        medical_images.create_index("patient_id")
        medical_images.create_index("uploaded_at")
        
        # Offline diagnoses collection (for sync)
        offline_diagnoses = mongo_db["offline_diagnoses"]
        offline_diagnoses.create_index("frontline_worker_id")
        offline_diagnoses.create_index("created_at")
        offline_diagnoses.create_index("synced")
        
        # System logs collection
        system_logs = mongo_db["system_logs"]
        system_logs.create_index("timestamp")
        system_logs.create_index("level")
        
        logger.info("MongoDB collections created successfully")
    except Exception as e:
        logger.error(f"Error creating MongoDB collections: {e}")
        logger.warning("Continuing without MongoDB...")

def create_default_users():
    """Create default admin and test users"""
    try:
        logger.info("Creating default users...")
        
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.email == "admin@afridiag.org").first()
        if not admin_user:
            admin_user = User(
                email="admin@afridiag.org",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            logger.info("Created admin user")
        
        # Create test frontline worker
        frontline_user = db.query(User).filter(User.email == "frontline@afridiag.org").first()
        if not frontline_user:
            frontline_user = User(
                email="frontline@afridiag.org",
                username="frontline_worker",
                hashed_password=get_password_hash("frontline123"),
                full_name="Test Frontline Worker",
                role=UserRole.FRONTLINE_WORKER,
                is_active=True
            )
            db.add(frontline_user)
            logger.info("Created frontline worker user")
        
        # Create test specialist
        specialist_user = db.query(User).filter(User.email == "specialist@afridiag.org").first()
        if not specialist_user:
            specialist_user = User(
                email="specialist@afridiag.org",
                username="specialist",
                hashed_password=get_password_hash("specialist123"),
                full_name="Test Specialist",
                role=UserRole.SPECIALIST,
                is_active=True
            )
            db.add(specialist_user)
            logger.info("Created specialist user")
        
        db.commit()
        db.close()
        logger.info("Default users created successfully")
        
    except Exception as e:
        logger.error(f"Error creating default users: {e}")
        raise

def create_sample_data():
    """Create sample data for testing"""
    try:
        logger.info("Creating sample data...")
        
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Get frontline worker
        frontline_user = db.query(User).filter(User.email == "frontline@afridiag.org").first()
        if not frontline_user:
            logger.warning("Frontline worker not found, skipping sample data creation")
            return
        
        # Create sample patient
        sample_patient = db.query(Patient).filter(Patient.unique_id == "PAT001").first()
        if not sample_patient:
            sample_patient = Patient(
                unique_id="PAT001",
                first_name="Jane",
                last_name="Doe",
                date_of_birth="1989-05-12",
                gender="Female",
                phone_number="555-0100",
                address="Rural Clinic A",
                frontline_worker_id=frontline_user.id,
                created_by=frontline_user.id,
            )
            db.add(sample_patient)
            db.commit()
            db.refresh(sample_patient)
            logger.info("Created sample patient")
        
        # Create sample diagnosis
        sample_diagnosis = db.query(Diagnosis).filter(
            Diagnosis.patient_id == sample_patient.id
        ).first()
        if not sample_diagnosis:
            sample_diagnosis = Diagnosis(
                patient_id=sample_patient.id,
                disease_code="tuberculosis",
                symptoms='{"cough": true, "fever": true, "weight_loss": true}',
                ai_confidence=0.85,
                ai_diagnosis="High probability of tuberculosis based on symptoms",
                status=DiagnosisStatus.PENDING,
                notes="Patient presents with classic TB symptoms",
                created_by_id=frontline_user.id
            )
            db.add(sample_diagnosis)
            logger.info("Created sample diagnosis")
        
        db.commit()
        db.close()
        logger.info("Sample data created successfully")
        
    except Exception as e:
        logger.error(f"Error creating sample data: {e}")
        raise

def init_database():
    """Initialize the entire database"""
    logger.info("Initializing AfriDiag database...")
    
    try:
        # Create PostgreSQL tables
        create_tables()
        
        # Create MongoDB collections
        create_mongo_collections()
        
        # Create default users
        create_default_users()
        
        # Create sample data
        create_sample_data()
        
        logger.info("Database initialization completed successfully!")
        logger.info("Default credentials:")
        logger.info("  Admin: admin@afridiag.org / admin123")
        logger.info("  Frontline Worker: frontline@afridiag.org / frontline123")
        logger.info("  Specialist: specialist@afridiag.org / specialist123")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

if __name__ == "__main__":
    init_database()
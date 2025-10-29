from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Float, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .database import Base

# Enums for various status and types
class UserRole(str, enum.Enum):
    FRONTLINE_WORKER = "frontline_worker"
    SPECIALIST = "specialist"
    ADMIN = "admin"

class DiagnosisStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    ESCALATED = "escalated"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"

class NotificationType(str, enum.Enum):
    SYSTEM = "system"
    DIAGNOSIS = "diagnosis"
    TREATMENT = "treatment"
    FOLLOW_UP = "follow_up"
    USER = "user"

class DiseaseCategory(str, enum.Enum):
    INFECTIOUS = "infectious"
    CANCER = "cancer"
    CARDIOVASCULAR = "cardiovascular"
    RESPIRATORY = "respiratory"
    NEUROLOGICAL = "neurological"
    GASTROINTESTINAL = "gastrointestinal"
    ENDOCRINE = "endocrine"
    MENTAL_HEALTH = "mental_health"
    KIDNEY = "kidney"
    SKIN = "skin"
    BONE_JOINT = "bone_joint"
    EYE = "eye"
    ENT = "ent"
    REPRODUCTIVE = "reproductive"
    BLOOD = "blood"
    AUTOIMMUNE = "autoimmune"
    GENETIC = "genetic"
    NUTRITIONAL = "nutritional"
    GENERAL = "general"

class DiseaseSeverity(str, enum.Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"

class TreatmentStatus(str, enum.Enum):
    PRESCRIBED = "prescribed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DISCONTINUED = "discontinued"
    MODIFIED = "modified"

class ChatRoomStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    ARCHIVED = "archived"

class MessageType(str, enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    DIAGNOSIS_REFERENCE = "diagnosis_reference"
    SYSTEM = "system"

class ConsultationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DECLINED = "declined"
    CANCELLED = "cancelled"

# User model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(Enum(UserRole))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patients = relationship(
        "Patient",
        back_populates="frontline_worker",
        foreign_keys="Patient.frontline_worker_id",
    )
    patients_created = relationship("Patient", back_populates="created_by_user", foreign_keys="Patient.created_by")
    diagnoses_created = relationship("Diagnosis", back_populates="created_by", foreign_keys="Diagnosis.created_by_id")
    diagnoses_reviewed = relationship("Diagnosis", back_populates="reviewed_by", foreign_keys="Diagnosis.reviewed_by_id")
    notifications = relationship("Notification", back_populates="user")
    # Chat relationships
    chat_participants = relationship("ChatParticipant", back_populates="user")
    sent_messages = relationship("ChatMessage", back_populates="sender")

# Patient model
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    # Legacy/anonymized identifier support
    unique_id = Column(String, unique=True, index=True)
    # Personal and contact information aligned with tests
    first_name = Column(String)
    last_name = Column(String)
    date_of_birth = Column(String)
    gender = Column(String)
    phone_number = Column(String)
    address = Column(String)
    # Ownership
    frontline_worker_id = Column(Integer, ForeignKey("users.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    frontline_worker = relationship(
        "User",
        back_populates="patients",
        foreign_keys=[frontline_worker_id],
    )
    created_by_user = relationship("User", back_populates="patients_created", foreign_keys=[created_by])
    diagnoses = relationship("Diagnosis", back_populates="patient")
    medical_history = relationship("MedicalHistory", back_populates="patient")

# Disease model - Dynamic disease support
class Disease(Base):
    __tablename__ = "diseases"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)  # Disease code (e.g., "malaria", "tuberculosis")
    name = Column(String, index=True)  # Disease name
    category = Column(Enum(DiseaseCategory))
    severity = Column(Enum(DiseaseSeverity))
    icd11_code = Column(String, nullable=True)  # ICD-11 classification code
    common_symptoms = Column(JSON)  # List of common symptoms
    specific_symptoms = Column(JSON)  # List of specific symptoms
    regions = Column(JSON)  # List of regions where disease is prevalent
    prevalence_rate = Column(Float, nullable=True)  # Prevalence rate (0-1)
    mortality_rate = Column(Float, nullable=True)  # Mortality rate (0-1)
    age_groups = Column(JSON)  # List of affected age groups
    description = Column(Text, nullable=True)  # Disease description
    risk_factors = Column(JSON, nullable=True)  # List of risk factors
    prevention_measures = Column(JSON, nullable=True)  # List of prevention measures
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    diagnoses = relationship("Diagnosis", back_populates="disease")
    treatment_protocols = relationship("TreatmentProtocol", back_populates="disease")

# Treatment Protocol model
class TreatmentProtocol(Base):
    __tablename__ = "treatment_protocols"

    id = Column(Integer, primary_key=True, index=True)
    disease_id = Column(Integer, ForeignKey("diseases.id"))
    name = Column(String)  # Protocol name
    medications = Column(JSON)  # List of medications with dosages
    procedures = Column(JSON)  # List of medical procedures
    lifestyle_changes = Column(JSON)  # List of lifestyle recommendations
    duration_days = Column(Integer, nullable=True)  # Treatment duration in days
    follow_up_schedule = Column(JSON, nullable=True)  # Follow-up schedule
    contraindications = Column(JSON, nullable=True)  # List of contraindications
    side_effects = Column(JSON, nullable=True)  # List of potential side effects
    success_rate = Column(Float, nullable=True)  # Treatment success rate (0-1)
    cost_estimate = Column(Float, nullable=True)  # Estimated cost
    priority = Column(Integer, default=1)  # Treatment priority (1=first-line, 2=second-line, etc.)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    disease = relationship("Disease", back_populates="treatment_protocols")
    treatments = relationship("Treatment", back_populates="protocol")

# Medical History model
class MedicalHistory(Base):
    __tablename__ = "medical_histories"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    condition = Column(String)
    notes = Column(Text)
    date_recorded = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="medical_history")

# Diagnosis model
class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    disease_id = Column(Integer, ForeignKey("diseases.id"))  # Reference to Disease model
    disease_code = Column(String, index=True)  # For backward compatibility and quick lookup
    symptoms = Column(JSON)  # JSON array of symptoms
    ai_confidence = Column(Float)  # AI confidence score (0-1)
    ai_diagnosis = Column(Text)  # AI diagnosis result
    ai_reasoning = Column(Text, nullable=True)  # AI reasoning for the diagnosis
    differential_diagnoses = Column(JSON, nullable=True)  # Alternative diagnoses with confidence scores
    status = Column(Enum(DiagnosisStatus), default=DiagnosisStatus.PENDING)
    notes = Column(Text, nullable=True)  # Additional notes
    emergency_level = Column(Integer, default=0)  # Emergency level (0=routine, 1=urgent, 2=emergency)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="diagnoses")
    disease = relationship("Disease", back_populates="diagnoses")
    created_by = relationship("User", back_populates="diagnoses_created", foreign_keys=[created_by_id])
    reviewed_by = relationship("User", back_populates="diagnoses_reviewed", foreign_keys=[reviewed_by_id])
    treatments = relationship("Treatment", back_populates="diagnosis")

# Treatment model
class Treatment(Base):
    __tablename__ = "treatments"

    id = Column(Integer, primary_key=True, index=True)
    diagnosis_id = Column(Integer, ForeignKey("diagnoses.id"))
    protocol_id = Column(Integer, ForeignKey("treatment_protocols.id"), nullable=True)
    treatment_plan = Column(Text)  # Custom treatment plan or protocol override
    medications = Column(JSON, nullable=True)  # List of prescribed medications
    procedures = Column(JSON, nullable=True)  # List of procedures performed
    lifestyle_recommendations = Column(JSON, nullable=True)  # Lifestyle changes
    status = Column(Enum(TreatmentStatus), default=TreatmentStatus.PRESCRIBED)
    prescribed_by_id = Column(Integer, ForeignKey("users.id"))
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    actual_end_date = Column(DateTime, nullable=True)  # When treatment actually ended
    effectiveness_score = Column(Float, nullable=True)  # Treatment effectiveness (0-1)
    side_effects_reported = Column(JSON, nullable=True)  # Reported side effects
    adherence_score = Column(Float, nullable=True)  # Patient adherence (0-1)
    cost_actual = Column(Float, nullable=True)  # Actual treatment cost
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    diagnosis = relationship("Diagnosis", back_populates="treatments")
    protocol = relationship("TreatmentProtocol", back_populates="treatments")
    prescribed_by = relationship("User")
    follow_ups = relationship("FollowUp", back_populates="treatment")

# Follow-up model
class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    treatment_id = Column(Integer, ForeignKey("treatments.id"))
    status = Column(String)  # e.g., scheduled, completed, missed
    notes = Column(Text, nullable=True)
    scheduled_date = Column(DateTime)
    completed_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    treatment = relationship("Treatment", back_populates="follow_ups")

# Notification model
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(Enum(NotificationType))
    title = Column(String)
    message = Column(Text)
    link = Column(String, nullable=True)  # Optional link to related resource
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notifications")

# Chat Room model - For specialist consultations
class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)  # Chat room title/subject
    description = Column(Text, nullable=True)  # Optional description
    diagnosis_id = Column(Integer, ForeignKey("diagnoses.id"), nullable=True)  # Optional link to diagnosis
    created_by_id = Column(Integer, ForeignKey("users.id"))  # User who created the chat
    status = Column(Enum(ChatRoomStatus), default=ChatRoomStatus.ACTIVE)
    is_emergency = Column(Boolean, default=False)  # Mark urgent consultations
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    
    # Relationships
    created_by = relationship("User")
    diagnosis = relationship("Diagnosis")
    participants = relationship("ChatParticipant", back_populates="chat_room")
    messages = relationship("ChatMessage", back_populates="chat_room")

# Chat Participant model - Users in a chat room
class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    id = Column(Integer, primary_key=True, index=True)
    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    last_read_message_id = Column(Integer, nullable=True)  # For tracking unread messages
    
    # Relationships
    chat_room = relationship("ChatRoom", back_populates="participants")
    user = relationship("User")

# Chat Message model - Individual messages in chat rooms
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    message_type = Column(Enum(MessageType), default=MessageType.TEXT)
    content = Column(Text)  # Message content
    file_url = Column(String, nullable=True)  # For file/image messages
    file_name = Column(String, nullable=True)  # Original file name
    file_size = Column(Integer, nullable=True)  # File size in bytes
    diagnosis_reference_id = Column(Integer, ForeignKey("diagnoses.id"), nullable=True)  # For diagnosis references
    reply_to_message_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=True)  # For replies
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    chat_room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User")
    diagnosis_reference = relationship("Diagnosis")
    reply_to = relationship("ChatMessage", remote_side=[id])  # Self-referential for replies

# Consultation model - Second opinion requests
class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    diagnosis_id = Column(Integer, ForeignKey("diagnoses.id"))
    requesting_user_id = Column(Integer, ForeignKey("users.id"))  # Frontline worker requesting
    specialist_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Assigned specialist
    status = Column(Enum(ConsultationStatus), default=ConsultationStatus.PENDING)
    priority = Column(String, default="medium")  # low, medium, high, urgent
    specialization_required = Column(String)  # cardiology, neurology, etc.
    description = Column(Text)  # Description of the consultation request
    specialist_notes = Column(Text, nullable=True)  # Specialist's notes/recommendations
    estimated_duration = Column(Integer, nullable=True)  # Estimated duration in minutes
    scheduled_at = Column(DateTime, nullable=True)  # Scheduled consultation time
    started_at = Column(DateTime, nullable=True)  # When consultation actually started
    completed_at = Column(DateTime, nullable=True)  # When consultation was completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient")
    diagnosis = relationship("Diagnosis")
    requesting_user = relationship("User", foreign_keys=[requesting_user_id])
    specialist = relationship("User", foreign_keys=[specialist_id])
from pydantic import BaseModel, Field, EmailStr, constr
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timedelta
from enum import Enum
from app.db.models import UserRole, DiagnosisStatus, NotificationType as ModelNotificationType, DiseaseCategory, DiseaseSeverity, TreatmentStatus, ChatRoomStatus, MessageType, ConsultationStatus

# Statistics schemas
class StatisticsPeriod(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

# Notification schemas
# Using NotificationType from models.py

class NotificationBase(BaseModel):
    type: ModelNotificationType
    title: str
    message: str
    link: Optional[str] = None

class NotificationCreate(NotificationBase):
    user_id: int
    send_email: bool = False

class NotificationUpdate(BaseModel):
    read: Optional[bool] = None

class NotificationInDB(NotificationBase):
    id: int
    user_id: int
    read: bool
    created_at: datetime

    class Config:
        orm_mode = True

class NotificationResponse(NotificationInDB):
    pass

class DiseaseStatistics(BaseModel):
    disease_code: str
    disease_name: str
    category: DiseaseCategory
    total_cases: int
    confirmed_cases: int
    pending_cases: int
    rejection_rate: float

class RegionStatistics(BaseModel):
    region: str
    total_patients: int
    active_cases: int
    disease_breakdown: Dict[str, int]

class TimeSeriesData(BaseModel):
    date: datetime
    value: int

class StatisticsResponse(BaseModel):
    period: StatisticsPeriod
    start_date: datetime
    end_date: datetime
    total_diagnoses: int
    diseases_breakdown: List[DiseaseStatistics]
    regional_data: List[RegionStatistics]
    time_series: Dict[str, List[TimeSeriesData]]

# Enum definitions
class UserRole(str, Enum):
    FRONTLINE_WORKER = "frontline_worker"
    SPECIALIST = "specialist"
    ADMIN = "admin"

class DiagnosisStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    ESCALATED = "escalated"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"

# Disease schemas
class DiseaseBase(BaseModel):
    code: str
    name: str
    category: DiseaseCategory
    severity: DiseaseSeverity
    icd11_code: Optional[str] = None
    description: Optional[str] = None

class DiseaseCreate(DiseaseBase):
    common_symptoms: List[str] = []
    specific_symptoms: List[str] = []
    regions: List[str] = []
    prevalence_rate: Optional[float] = None
    mortality_rate: Optional[float] = None
    age_groups: List[str] = []
    risk_factors: Optional[List[str]] = None
    prevention_measures: Optional[List[str]] = None

class DiseaseUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[DiseaseCategory] = None
    severity: Optional[DiseaseSeverity] = None
    icd11_code: Optional[str] = None
    description: Optional[str] = None
    common_symptoms: Optional[List[str]] = None
    specific_symptoms: Optional[List[str]] = None
    regions: Optional[List[str]] = None
    prevalence_rate: Optional[float] = None
    mortality_rate: Optional[float] = None
    age_groups: Optional[List[str]] = None
    risk_factors: Optional[List[str]] = None
    prevention_measures: Optional[List[str]] = None

class DiseaseInDB(DiseaseBase):
    id: int
    common_symptoms: List[str]
    specific_symptoms: List[str]
    regions: List[str]
    prevalence_rate: Optional[float]
    mortality_rate: Optional[float]
    age_groups: List[str]
    risk_factors: Optional[List[str]]
    prevention_measures: Optional[List[str]]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Disease(DiseaseInDB):
    pass

# Treatment Protocol schemas
class MedicationSchema(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str

class TreatmentProtocolBase(BaseModel):
    name: str
    medications: List[Dict[str, str]] = []
    procedures: List[str] = []
    lifestyle_changes: List[str] = []
    duration_days: Optional[int] = None
    priority: int = 1

class TreatmentProtocolCreate(TreatmentProtocolBase):
    disease_id: int
    follow_up_schedule: Optional[List[str]] = None
    contraindications: Optional[List[str]] = None
    side_effects: Optional[List[str]] = None
    success_rate: Optional[float] = None
    cost_estimate: Optional[float] = None

class TreatmentProtocolUpdate(BaseModel):
    name: Optional[str] = None
    medications: Optional[List[Dict[str, str]]] = None
    procedures: Optional[List[str]] = None
    lifestyle_changes: Optional[List[str]] = None
    duration_days: Optional[int] = None
    follow_up_schedule: Optional[List[str]] = None
    contraindications: Optional[List[str]] = None
    side_effects: Optional[List[str]] = None
    success_rate: Optional[float] = None
    cost_estimate: Optional[float] = None
    priority: Optional[int] = None

class TreatmentProtocolInDB(TreatmentProtocolBase):
    id: int
    disease_id: int
    follow_up_schedule: Optional[List[str]]
    contraindications: Optional[List[str]]
    side_effects: Optional[List[str]]
    success_rate: Optional[float]
    cost_estimate: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class TreatmentProtocol(TreatmentProtocolInDB):
    pass

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: UserRole

class UserCreate(UserBase):
    password: constr(min_length=8)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserInDB(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class UserResponse(UserInDB):
    pass

# Patient schemas
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: str
    gender: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    unique_id: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    unique_id: Optional[str] = None
    # Allow passing a simple medical history note during updates
    medical_history: Optional[str] = None

class PatientInDB(PatientBase):
    id: int
    frontline_worker_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Patient(PatientInDB):
    pass

# Extended response schema to include the latest medical history note when updating
class PatientWithHistory(Patient):
    medical_history: Optional[str] = None

class PaginatedPatients(BaseModel):
    page: int
    size: int
    total: int
    items: List[Patient]

# Medical History schemas
class MedicalHistoryBase(BaseModel):
    condition: str
    notes: str

class MedicalHistoryCreate(MedicalHistoryBase):
    patient_id: int

class MedicalHistoryUpdate(BaseModel):
    condition: Optional[str] = None
    notes: Optional[str] = None

class MedicalHistoryInDB(MedicalHistoryBase):
    id: int
    patient_id: int
    date_recorded: datetime

    class Config:
        orm_mode = True

class MedicalHistory(MedicalHistoryInDB):
    pass

# Diagnosis schemas
class DiagnosisBase(BaseModel):
    disease_code: str
    symptoms: List[str] = []  # List of symptoms
    notes: Optional[str] = None

class DiagnosisCreate(DiagnosisBase):
    patient_id: int
    disease_id: Optional[int] = None  # Will be populated from disease_code

class EmergencyDiagnosisCreate(BaseModel):
    """Emergency diagnosis schema with all optional fields for rapid assessment"""
    # Core fields - only medical_history is truly required
    medical_history: str = Field(..., description="Free-text medical history, symptoms, and patient information")
    
    # Optional structured fields
    patient_id: Optional[int] = None
    disease_code: Optional[str] = None
    symptoms: Optional[List[str]] = None
    allergies: Optional[str] = None
    additional_notes: Optional[str] = None
    medical_images: Optional[List[str]] = None
    
    # Optional vital signs
    temperature: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[float] = None
    
    # Optional symptom duration
    symptom_duration: Optional[str] = None
    
    # Optional patient information (if no patient_id provided)
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    patient_phone: Optional[str] = None

class DiagnosisUpdate(BaseModel):
    disease_code: Optional[str] = None
    disease_id: Optional[int] = None
    symptoms: Optional[List[str]] = None
    ai_confidence: Optional[float] = None
    ai_diagnosis: Optional[str] = None
    ai_reasoning: Optional[str] = None
    differential_diagnoses: Optional[List[Dict[str, Any]]] = None
    status: Optional[DiagnosisStatus] = None
    notes: Optional[str] = None
    emergency_level: Optional[int] = None
    reviewed_by_id: Optional[int] = None
    # Additional fields used by specialist review API response
    specialist_notes: Optional[str] = None
    treatment_plan: Optional[str] = None

class DiagnosisInDB(DiagnosisBase):
    id: int
    patient_id: int
    disease_id: Optional[int]
    ai_confidence: Optional[float] = None
    ai_diagnosis: Optional[str] = None
    ai_reasoning: Optional[str] = None
    differential_diagnoses: Optional[List[Dict[str, Any]]] = None
    status: DiagnosisStatus
    emergency_level: int = 0
    created_by_id: int
    reviewed_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Diagnosis(DiagnosisInDB):
    disease: Optional[Disease] = None  # Include disease details when needed

# Treatment schemas
class TreatmentBase(BaseModel):
    treatment_plan: str
    start_date: datetime
    end_date: Optional[datetime] = None
    notes: Optional[str] = None

class TreatmentCreate(TreatmentBase):
    diagnosis_id: int
    prescribed_by_id: int
    protocol_id: Optional[int] = None
    medications: Optional[List[Dict[str, str]]] = None
    procedures: Optional[List[str]] = None
    lifestyle_recommendations: Optional[List[str]] = None

class TreatmentUpdate(BaseModel):
    treatment_plan: Optional[str] = None
    protocol_id: Optional[int] = None
    medications: Optional[List[Dict[str, str]]] = None
    procedures: Optional[List[str]] = None
    lifestyle_recommendations: Optional[List[str]] = None
    status: Optional[TreatmentStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    effectiveness_score: Optional[float] = None
    side_effects_reported: Optional[List[str]] = None
    adherence_score: Optional[float] = None
    cost_actual: Optional[float] = None
    notes: Optional[str] = None

class TreatmentInDB(TreatmentBase):
    id: int
    diagnosis_id: int
    protocol_id: Optional[int]
    medications: Optional[List[Dict[str, str]]]
    procedures: Optional[List[str]]
    lifestyle_recommendations: Optional[List[str]]
    status: TreatmentStatus
    prescribed_by_id: int
    actual_end_date: Optional[datetime]
    effectiveness_score: Optional[float]
    side_effects_reported: Optional[List[str]]
    adherence_score: Optional[float]
    cost_actual: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Treatment(TreatmentInDB):
    protocol: Optional[TreatmentProtocol] = None  # Include protocol details when needed

# Follow-up schemas
class FollowUpBase(BaseModel):
    status: str
    notes: Optional[str] = None
    scheduled_date: datetime
    completed_date: Optional[datetime] = None

class FollowUpCreate(FollowUpBase):
    treatment_id: int

class FollowUpUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None

class FollowUpInDB(FollowUpBase):
    id: int
    treatment_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class FollowUp(FollowUpInDB):
    pass

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    
    @classmethod
    def from_jwt(cls, token: str):
        """Decode JWT token and create TokenData instance"""
        from jose import jwt, JWTError
        from app.core.config import settings
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email: str = payload.get("sub")
            role: str = payload.get("role")
            return cls(email=email, role=role)
        except JWTError:
            raise ValueError("Invalid token")

# Sync schemas
class SyncData(BaseModel):
    patients: Optional[List[Dict[str, Any]]] = None
    diagnoses: Optional[List[Dict[str, Any]]] = None
    treatments: Optional[List[Dict[str, Any]]] = None
    follow_ups: Optional[List[Dict[str, Any]]] = None

class SyncRequest(BaseModel):
    last_sync: datetime
    data: SyncData

class SyncResponse(BaseModel):
    status: str
    data: SyncData
    timestamp: datetime = Field(default_factory=datetime.now)

# API Request/Response schemas
class DiagnosisRequest(BaseModel):
    symptoms: List[str]
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    medical_history: Optional[str] = None
    region: Optional[str] = None
    category: Optional[DiseaseCategory] = None

class DiagnosisResponse(BaseModel):
    disease_code: str
    disease_name: str
    category: DiseaseCategory
    severity: DiseaseSeverity
    confidence: float
    reasoning: str
    differential_diagnoses: List[Dict[str, Any]] = []
    recommendations: List[str]
    treatment_protocols: List[Dict[str, Any]] = []
    emergency_level: int = Field(ge=0, le=5, description="Emergency level from 0 (non-urgent) to 5 (critical)")
    # Enhanced treatment information from Grok AI
    treatment_plan: Optional[Dict[str, Any]] = None
    patient_education: Optional[List[str]] = None
    follow_up_care: Optional[Dict[str, Any]] = None

class PatientData(BaseModel):
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    address: Optional[str] = None
    medical_history: Optional[str] = None

class PredictionRequest(BaseModel):
    symptoms: List[str]
    patient_data: Optional[PatientData] = None
    region: Optional[str] = None
    category: Optional[DiseaseCategory] = None
    medical_images: Optional[List[str]] = None

class PredictionResponse(BaseModel):
    predictions: List[DiagnosisResponse]
    patient_id: Optional[int] = None
    total_diseases_searched: int = 0
    search_time_ms: float = 0.0
    # Grok AI metadata
    ai_engine: Optional[str] = None  # "grok", "openai", "gemini", or "traditional"
    ai_confidence: Optional[float] = None  # Overall AI confidence in diagnosis
    ai_reasoning: Optional[str] = None  # AI's reasoning process
    clinical_notes: Optional[str] = None  # Additional clinical insights from AI

# Chat Room schemas
class ChatRoomBase(BaseModel):
    title: str
    description: Optional[str] = None
    diagnosis_id: Optional[int] = None
    is_emergency: bool = False

class ChatRoomCreate(ChatRoomBase):
    participant_ids: List[int] = []  # List of user IDs to add as participants

class ChatRoomUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ChatRoomStatus] = None

class ChatRoomInDB(ChatRoomBase):
    id: int
    created_by_id: int
    status: ChatRoomStatus
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class ChatRoomResponse(ChatRoomInDB):
    participant_count: int = 0
    unread_messages: int = 0
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None

# Chat Participant schemas
class ChatParticipantBase(BaseModel):
    user_id: int

class ChatParticipantCreate(ChatParticipantBase):
    chat_room_id: int

class ChatParticipantInDB(ChatParticipantBase):
    id: int
    chat_room_id: int
    joined_at: datetime
    left_at: Optional[datetime] = None
    is_active: bool
    last_read_message_id: Optional[int] = None

    class Config:
        orm_mode = True

class ChatParticipantResponse(ChatParticipantInDB):
    user_name: Optional[str] = None
    user_role: Optional[UserRole] = None

# Chat Message schemas
class ChatMessageBase(BaseModel):
    content: str
    message_type: MessageType = MessageType.TEXT
    diagnosis_reference_id: Optional[int] = None
    reply_to_message_id: Optional[int] = None

class ChatMessageCreate(ChatMessageBase):
    chat_room_id: int

class ChatMessageUpdate(BaseModel):
    content: Optional[str] = None
    is_edited: bool = True

class ChatMessageInDB(ChatMessageBase):
    id: int
    chat_room_id: int
    sender_id: int
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    is_edited: bool
    edited_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True

class ChatMessageResponse(ChatMessageInDB):
    sender_name: Optional[str] = None
    sender_role: Optional[UserRole] = None
    reply_to_content: Optional[str] = None  # Content of the message being replied to

# Chat system utility schemas
class ChatRoomListResponse(BaseModel):
    chat_rooms: List[ChatRoomResponse]
    total_count: int
    unread_total: int

class ChatMessageListResponse(BaseModel):
    messages: List[ChatMessageResponse]
    total_count: int
    has_more: bool = False

class UnreadMessageCount(BaseModel):
    chat_room_id: int
    unread_count: int

class ChatNotification(BaseModel):
    type: str  # "new_message", "new_chat_room", "user_joined", "user_left"
    chat_room_id: int
    message: str
    sender_name: Optional[str] = None
    timestamp: datetime

# Consultation schemas
class ConsultationBase(BaseModel):
    patient_id: int
    diagnosis_id: int
    priority: str = "medium"
    specialization_required: str
    description: str
    estimated_duration: Optional[int] = None

class ConsultationCreate(ConsultationBase):
    pass

class ConsultationUpdate(BaseModel):
    status: Optional[ConsultationStatus] = None
    specialist_notes: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    estimated_duration: Optional[int] = None

class ConsultationAccept(BaseModel):
    notes: Optional[str] = None
    estimated_duration: Optional[int] = None
    scheduled_at: Optional[datetime] = None

class ConsultationInDB(ConsultationBase):
    id: int
    requesting_user_id: int
    specialist_id: Optional[int] = None
    status: ConsultationStatus
    specialist_notes: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ConsultationResponse(ConsultationInDB):
    patient_name: Optional[str] = None
    requesting_user_name: Optional[str] = None
    specialist_name: Optional[str] = None
    diagnosis_summary: Optional[str] = None

class ConsultationListResponse(BaseModel):
    consultations: List[ConsultationResponse]
    total_count: int

class ConsultationStats(BaseModel):
    total_consultations: int
    pending_consultations: int
    active_consultations: int
    completed_consultations: int
    avg_response_time: Optional[float] = None  # in hours
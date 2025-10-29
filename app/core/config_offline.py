import os
from pydantic import BaseSettings
from typing import List, Optional
from functools import lru_cache

class OfflineSettings(BaseSettings):
    """Configuration optimized for offline rural hospital deployment"""
    
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AfriDiag - Rural Hospital Edition"
    PROJECT_DESCRIPTION: str = "AI-powered diagnostic tool for rural healthcare - Offline Mode"
    PROJECT_VERSION: str = "1.0.0-rural"
    
    # CORS settings - Allow local access only
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:8080",  # Main frontend
        "http://127.0.0.1:8080",
        "http://0.0.0.0:8080",
    ]
    
    # Database settings - SQLite for offline use
    DATABASE_TYPE: str = "sqlite"  # Using SQLite database for offline deployment
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///app/data/afridiag.db")
    SQLITE_DB_PATH: str = "/app/data/afridiag.db"
    
    # Disable MongoDB for offline mode
    MONGODB_ENABLED: bool = False
    MONGODB_URL: str = ""
    MONGODB_DB_NAME: str = ""
    
    # Authentication settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "rural_hospital_secret_key_2024")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours for rural hospital shifts
    
    # ML model settings - Local models only
    ML_MODELS_DIR: str = "/app/backend/ml_models"
    USE_LOCAL_MODELS_ONLY: bool = True
    
    # Storage settings
    UPLOAD_DIR: str = "/app/data/uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB for medical images
    
    # Logging settings
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "/app/data/logs/afridiag.log"
    
    # Offline mode settings
    OFFLINE_MODE: bool = True
    ENABLE_SYNC: bool = True  # Enable sync when internet is available
    SYNC_INTERVAL_HOURS: int = 24  # Sync every 24 hours when online
    
    # Disable external services for offline mode
    SMTP_ENABLED: bool = False
    EXTERNAL_API_ENABLED: bool = False
    
    # Emergency mode settings
    EMERGENCY_MODE_ENABLED: bool = True
    EMERGENCY_CONTACT_INFO: str = "Contact your regional medical center"
    
    # Data retention settings
    PATIENT_DATA_RETENTION_DAYS: int = 365  # Keep patient data for 1 year
    LOG_RETENTION_DAYS: int = 90  # Keep logs for 3 months
    
    # Backup settings
    AUTO_BACKUP_ENABLED: bool = True
    BACKUP_INTERVAL_HOURS: int = 6  # Backup every 6 hours
    BACKUP_LOCATION: str = "/app/data/backups"
    MAX_BACKUPS: int = 10  # Keep last 10 backups
    
    # Performance settings for rural hardware
    MAX_CONCURRENT_DIAGNOSES: int = 5
    CACHE_SIZE_MB: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_offline_settings() -> OfflineSettings:
    return OfflineSettings()

# Use offline settings by default in rural deployment
settings = get_offline_settings()
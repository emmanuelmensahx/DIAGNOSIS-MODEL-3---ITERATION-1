import os
from pydantic import BaseSettings
from typing import List, Optional
from functools import lru_cache

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AfriDiag API"
    PROJECT_DESCRIPTION: str = "AI-powered diagnostic tool for rural healthcare in Africa"
    PROJECT_VERSION: str = "0.1.0"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",  # React frontend
        "http://localhost:8080",  # Alternative frontend
        "http://localhost:19006", # Expo development server (Metro default)
        "http://localhost:19007", # Expo web dev server (webpack default)
        "http://localhost:19008", # Expo alternate web dev server
        "http://localhost:19009", # Expo web dev server (auto-assigned port)
        "https://afridiag.org",    # Production domain
    ]
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/afridiag")
    
    # MongoDB settings for medical images
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "afridiag")
    
    # Authentication settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "development_secret_key_change_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # ML model settings
    ML_MODELS_DIR: str = os.getenv("ML_MODELS_DIR", "./ml_models")
    
    # Storage settings
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Email settings (for notifications)
    SMTP_ENABLED: bool = os.getenv("SMTP_ENABLED", "False").lower() == "true"
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = int(os.getenv("SMTP_PORT", "587"))
    SMTP_SERVER: Optional[str] = os.getenv("SMTP_SERVER")
    SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    SMTP_SENDER_EMAIL: Optional[str] = os.getenv("SMTP_SENDER_EMAIL", "noreply@afridiag.org")
    
    # Integration service settings
    
    # Mapping service settings
    MAPPING_PROVIDER: str = os.getenv("MAPPING_PROVIDER", "google")  # google, mapbox, osm
    GOOGLE_MAPS_API_KEY: Optional[str] = os.getenv("GOOGLE_MAPS_API_KEY")
    MAPBOX_ACCESS_TOKEN: Optional[str] = os.getenv("MAPBOX_ACCESS_TOKEN")
    
    # Video call service settings
    VIDEO_CALL_PROVIDER: str = os.getenv("VIDEO_CALL_PROVIDER", "agora")  # zoom, agora, jitsi
    ZOOM_API_KEY: Optional[str] = os.getenv("ZOOM_API_KEY")
    ZOOM_API_SECRET: Optional[str] = os.getenv("ZOOM_API_SECRET")
    AGORA_APP_ID: Optional[str] = os.getenv("AGORA_APP_ID")
    AGORA_APP_CERTIFICATE: Optional[str] = os.getenv("AGORA_APP_CERTIFICATE")
    JITSI_DOMAIN: str = os.getenv("JITSI_DOMAIN", "meet.jit.si")
    
    # Virtual board service settings
    BOARD_PROVIDER: str = os.getenv("BOARD_PROVIDER", "custom")  # custom, miro, figma
    MIRO_CLIENT_ID: Optional[str] = os.getenv("MIRO_CLIENT_ID")
    MIRO_CLIENT_SECRET: Optional[str] = os.getenv("MIRO_CLIENT_SECRET")
    MIRO_ACCESS_TOKEN: Optional[str] = os.getenv("MIRO_ACCESS_TOKEN")
    FIGMA_ACCESS_TOKEN: Optional[str] = os.getenv("FIGMA_ACCESS_TOKEN")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Offline sync settings
    MAX_SYNC_BATCH_SIZE: int = 100
    
    # LLM API settings
    # Grok 3 (xAI) settings
    GROK_API_KEY: Optional[str] = os.getenv("GROK_API_KEY")
    GROK_API_BASE_URL: str = os.getenv("GROK_API_BASE_URL", "https://api.x.ai/v1")
    GROK_MODEL: str = os.getenv("GROK_MODEL", "grok-3")
    GROK_ENABLED: bool = os.getenv("GROK_ENABLED", "False").lower() == "true"
    
    # OpenAI GPT settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4")
    OPENAI_ENABLED: bool = os.getenv("OPENAI_ENABLED", "False").lower() == "true"
    
    # Google Gemini settings
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    GEMINI_ENABLED: bool = os.getenv("GEMINI_ENABLED", "False").lower() == "true"
    
    # LLM general settings
    LLM_ENABLED: bool = os.getenv("LLM_ENABLED", "False").lower() == "true"
    LLM_PRIMARY_PROVIDER: str = os.getenv("LLM_PRIMARY_PROVIDER", "gemini")  # gemini, grok, openai
    LLM_FALLBACK_PROVIDER: str = os.getenv("LLM_FALLBACK_PROVIDER", "grok")  # gemini, grok, openai
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "2000"))
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.3"))
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pymongo import MongoClient

from app.core.config import settings

# Create SQLAlchemy engine
# Use SQLite-specific connect args to allow usage across threads
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Create MongoDB client (if enabled)
try:
    if hasattr(settings, 'MONGODB_URL') and settings.MONGODB_URL and not settings.MONGODB_URL.startswith('#'):
        mongo_client = MongoClient(settings.MONGODB_URL)
        mongo_db = mongo_client[settings.MONGODB_DB_NAME]
    else:
        mongo_client = None
        mongo_db = None
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    mongo_client = None
    mongo_db = None

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency to get MongoDB collections
def get_mongo_collection(collection_name: str):
    return mongo_db[collection_name]
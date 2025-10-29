import os
import uuid
import json
from datetime import datetime, UTC
from typing import List, Dict, Any, Optional
from fastapi import UploadFile
import motor.motor_asyncio
from bson.objectid import ObjectId

from app.core.config import settings

# MongoDB connection (if enabled)
try:
    if settings.MONGODB_URL and settings.MONGODB_URL.strip():
        client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.MONGODB_DB_NAME]
        medical_images_collection = db["medical_images"]
        MONGODB_ENABLED = True
    else:
        client = None
        db = None
        medical_images_collection = None
        MONGODB_ENABLED = False
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    client = None
    db = None
    medical_images_collection = None
    MONGODB_ENABLED = False

# File storage fallback
IMAGE_STORAGE_DIR = os.path.join(settings.UPLOAD_DIR, "medical_images")
METADATA_FILE = os.path.join(IMAGE_STORAGE_DIR, "metadata.json")

# Ensure storage directory exists
os.makedirs(IMAGE_STORAGE_DIR, exist_ok=True)

def _load_metadata():
    """Load metadata from file"""
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def _save_metadata(metadata):
    """Save metadata to file"""
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, default=str, indent=2)

async def save_medical_image(image_file: UploadFile, diagnosis_id: int, patient_id: int, uploaded_by: int) -> str:
    """Save a medical image and return the image ID"""
    
    # Generate a unique filename
    file_extension = os.path.splitext(image_file.filename)[1] if image_file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    image_id = str(uuid.uuid4())
    
    # Read the file content
    content = await image_file.read()
    
    if MONGODB_ENABLED:
        # Save to MongoDB
        image_doc = {
            "filename": unique_filename,
            "content_type": image_file.content_type,
            "size": len(content),
            "data": content,
            "diagnosis_id": diagnosis_id,
            "patient_id": patient_id,
            "uploaded_by": uploaded_by,
            "uploaded_at": datetime.now(UTC),
            "metadata": {
                "original_filename": image_file.filename
            }
        }
        result = await medical_images_collection.insert_one(image_doc)
        return str(result.inserted_id)
    else:
        # Save to file system
        file_path = os.path.join(IMAGE_STORAGE_DIR, unique_filename)
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Save metadata
        all_metadata = _load_metadata()
        all_metadata[image_id] = {
            "filename": unique_filename,
            "content_type": image_file.content_type,
            "size": len(content),
            "diagnosis_id": diagnosis_id,
            "patient_id": patient_id,
            "uploaded_by": uploaded_by,
            "uploaded_at": datetime.now(UTC).isoformat(),
            "original_filename": image_file.filename
        }
        _save_metadata(all_metadata)
        return image_id

async def get_medical_image(image_id: str) -> Optional[Dict[str, Any]]:
    """Get a medical image by ID"""
    
    if MONGODB_ENABLED:
        try:
            obj_id = ObjectId(image_id)
            image = await medical_images_collection.find_one({"_id": obj_id})
            if image:
                image["_id"] = str(image["_id"])
                return image
            return None
        except Exception:
            return None
    else:
        # Load from file system
        all_metadata = _load_metadata()
        if image_id in all_metadata:
            metadata = all_metadata[image_id]
            file_path = os.path.join(IMAGE_STORAGE_DIR, metadata["filename"])
            if os.path.exists(file_path):
                with open(file_path, "rb") as f:
                    content = f.read()
                metadata["data"] = content
                metadata["_id"] = image_id
                return metadata
        return None

async def get_medical_images_by_diagnosis(diagnosis_id: int) -> List[Dict[str, Any]]:
    """Get all medical images for a diagnosis"""
    
    if MONGODB_ENABLED:
        cursor = medical_images_collection.find({"diagnosis_id": diagnosis_id})
        images = []
        async for image in cursor:
            image["_id"] = str(image["_id"])
            images.append(image)
        return images
    else:
        # Load from file system
        all_metadata = _load_metadata()
        images = []
        for img_id, metadata in all_metadata.items():
            if metadata.get("diagnosis_id") == diagnosis_id:
                metadata["_id"] = img_id
                images.append(metadata)
        return images

async def delete_medical_image(image_id: str) -> bool:
    """Delete a medical image"""
    
    if MONGODB_ENABLED:
        try:
            obj_id = ObjectId(image_id)
            result = await medical_images_collection.delete_one({"_id": obj_id})
            return result.deleted_count > 0
        except Exception:
            return False
    else:
        # Delete from file system
        all_metadata = _load_metadata()
        if image_id in all_metadata:
            metadata = all_metadata[image_id]
            file_path = os.path.join(IMAGE_STORAGE_DIR, metadata["filename"])
            if os.path.exists(file_path):
                os.remove(file_path)
            del all_metadata[image_id]
            _save_metadata(all_metadata)
            return True
        return False

async def get_medical_image_data(image_id: str) -> Optional[Dict[str, Any]]:
    """Get medical image data without the binary content"""
    
    if MONGODB_ENABLED:
        try:
            obj_id = ObjectId(image_id)
            image = await medical_images_collection.find_one(
                {"_id": obj_id}, 
                {"data": 0}  # Exclude binary data
            )
            if image:
                image["_id"] = str(image["_id"])
                return image
            return None
        except Exception:
            return None
    else:
        # Load from file system
        all_metadata = _load_metadata()
        if image_id in all_metadata:
            metadata = all_metadata[image_id].copy()
            metadata["_id"] = image_id
            return metadata
        return None
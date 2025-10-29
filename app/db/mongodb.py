from pymongo import MongoClient
from bson import ObjectId
from typing import Dict, List, Any, Optional

from app.core.config import settings
from app.db.database import mongo_db

# Collections
IMAGES_COLLECTION = "medical_images"
OFFLINE_SYNC_COLLECTION = "offline_sync"
AUDIT_LOGS_COLLECTION = "audit_logs"

# Helper functions for MongoDB operations
def insert_one(collection_name: str, document: Dict) -> str:
    """Insert a document into a collection and return the inserted ID"""
    result = mongo_db[collection_name].insert_one(document)
    return str(result.inserted_id)

def find_one(collection_name: str, query: Dict) -> Optional[Dict]:
    """Find a single document matching the query"""
    result = mongo_db[collection_name].find_one(query)
    return result

def find_by_id(collection_name: str, id: str) -> Optional[Dict]:
    """Find a document by its ID"""
    try:
        return mongo_db[collection_name].find_one({"_id": ObjectId(id)})
    except:
        return None

def find_many(collection_name: str, query: Dict, limit: int = 0, skip: int = 0) -> List[Dict]:
    """Find multiple documents matching the query"""
    cursor = mongo_db[collection_name].find(query)
    
    if skip:
        cursor = cursor.skip(skip)
    if limit:
        cursor = cursor.limit(limit)
        
    return list(cursor)

def update_one(collection_name: str, query: Dict, update: Dict) -> bool:
    """Update a single document matching the query"""
    result = mongo_db[collection_name].update_one(query, {"$set": update})
    return result.modified_count > 0

def update_by_id(collection_name: str, id: str, update: Dict) -> bool:
    """Update a document by its ID"""
    try:
        result = mongo_db[collection_name].update_one(
            {"_id": ObjectId(id)}, 
            {"$set": update}
        )
        return result.modified_count > 0
    except:
        return False

def delete_one(collection_name: str, query: Dict) -> bool:
    """Delete a single document matching the query"""
    result = mongo_db[collection_name].delete_one(query)
    return result.deleted_count > 0

def delete_by_id(collection_name: str, id: str) -> bool:
    """Delete a document by its ID"""
    try:
        result = mongo_db[collection_name].delete_one({"_id": ObjectId(id)})
        return result.deleted_count > 0
    except:
        return False
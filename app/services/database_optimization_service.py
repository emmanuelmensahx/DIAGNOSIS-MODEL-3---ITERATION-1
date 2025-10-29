"""
Database Optimization Service for AfriDiag
Provides optimized database queries and caching for improved performance
"""

from typing import List, Dict, Optional, Any, Tuple
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import text, func, and_, or_, case, distinct
from sqlalchemy.sql import select
import json
import logging
from datetime import datetime, timedelta
from functools import lru_cache

from app.db.models import (
    Disease, Diagnosis, Patient, User, TreatmentProtocol,
    DiseaseCategory, DiseaseSeverity, DiagnosisStatus
)

logger = logging.getLogger(__name__)

class DatabaseOptimizationService:
    """Service for optimized database operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self._query_cache = {}
        self._cache_ttl = 300  # 5 minutes
    
    def get_diseases_by_symptoms_optimized(
        self, 
        symptoms: List[str], 
        limit: int = 20,
        category_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Optimized disease search by symptoms using database indexes
        """
        try:
            # Build the base query with proper joins and indexes
            query = self.db.query(Disease).options(
                selectinload(Disease.treatment_protocols)
            )
            
            # Apply category filter if provided
            if category_filter:
                query = query.filter(Disease.category == category_filter)
            
            # Use database-level JSON operations for symptom matching
            symptom_conditions = []
            for symptom in symptoms:
                symptom_lower = symptom.lower()
                # Use JSON_CONTAINS or similar for efficient JSON array searching
                symptom_conditions.append(
                    or_(
                        func.json_extract(Disease.common_symptoms, '$').like(f'%{symptom_lower}%'),
                        func.json_extract(Disease.specific_symptoms, '$').like(f'%{symptom_lower}%')
                    )
                )
            
            if symptom_conditions:
                query = query.filter(or_(*symptom_conditions))
            
            # Order by relevance (diseases with more symptom matches first)
            diseases = query.limit(limit).all()
            
            # Calculate match scores efficiently
            results = []
            for disease in diseases:
                match_score = self._calculate_symptom_match_score_fast(
                    symptoms, 
                    disease.common_symptoms + disease.specific_symptoms
                )
                
                results.append({
                    "id": disease.id,
                    "code": disease.code,
                    "name": disease.name,
                    "category": disease.category.value,
                    "severity": disease.severity.value,
                    "match_score": match_score,
                    "common_symptoms": disease.common_symptoms,
                    "specific_symptoms": disease.specific_symptoms,
                    "prevalence_rate": disease.prevalence_rate,
                    "mortality_rate": disease.mortality_rate
                })
            
            # Sort by match score
            results.sort(key=lambda x: x["match_score"], reverse=True)
            return results
            
        except Exception as e:
            logger.error(f"Error in optimized disease search: {e}")
            return []
    
    def get_recent_diagnoses_optimized(
        self, 
        user_id: int, 
        user_role: str,
        limit: int = 50,
        days_back: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Optimized query for recent diagnoses with proper joins
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)
            
            # Build optimized query with eager loading
            query = self.db.query(Diagnosis).options(
                joinedload(Diagnosis.patient),
                joinedload(Diagnosis.disease),
                joinedload(Diagnosis.created_by)
            ).filter(Diagnosis.created_at >= cutoff_date)
            
            # Apply role-based filtering
            if user_role == "frontline_worker":
                query = query.join(Patient).filter(Patient.frontline_worker_id == user_id)
            elif user_role == "specialist":
                query = query.filter(
                    or_(
                        Diagnosis.reviewed_by_id == user_id,
                        Diagnosis.status == DiagnosisStatus.ESCALATED
                    )
                )
            
            # Order by creation date and limit
            diagnoses = query.order_by(Diagnosis.created_at.desc()).limit(limit).all()
            
            # Convert to optimized format
            results = []
            for diagnosis in diagnoses:
                results.append({
                    "id": diagnosis.id,
                    "patient_name": f"{diagnosis.patient.first_name} {diagnosis.patient.last_name}",
                    "disease_name": diagnosis.disease.name if diagnosis.disease else "Unknown",
                    "disease_code": diagnosis.disease_code,
                    "ai_confidence": diagnosis.ai_confidence,
                    "status": diagnosis.status.value,
                    "emergency_level": diagnosis.emergency_level,
                    "created_at": diagnosis.created_at.isoformat(),
                    "created_by": diagnosis.created_by.full_name if diagnosis.created_by else "Unknown"
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error in optimized recent diagnoses query: {e}")
            return []
    
    def get_disease_statistics_optimized(self) -> Dict[str, Any]:
        """
        Optimized query for disease statistics using aggregation
        """
        try:
            # Use database aggregation for better performance
            category_stats = self.db.query(
                Disease.category,
                func.count(Disease.id).label('count')
            ).group_by(Disease.category).all()
            
            severity_stats = self.db.query(
                Disease.severity,
                func.count(Disease.id).label('count')
            ).group_by(Disease.severity).all()
            
            # Get diagnosis statistics
            diagnosis_stats = self.db.query(
                Diagnosis.status,
                func.count(Diagnosis.id).label('count')
            ).group_by(Diagnosis.status).all()
            
            # Get top diseases by diagnosis count
            top_diseases = self.db.query(
                Disease.name,
                Disease.code,
                func.count(Diagnosis.id).label('diagnosis_count')
            ).join(Diagnosis).group_by(Disease.id, Disease.name, Disease.code)\
             .order_by(func.count(Diagnosis.id).desc()).limit(10).all()
            
            return {
                "total_diseases": self.db.query(Disease).count(),
                "category_breakdown": {cat.value: count for cat, count in category_stats},
                "severity_breakdown": {sev.value: count for sev, count in severity_stats},
                "diagnosis_status_breakdown": {status.value: count for status, count in diagnosis_stats},
                "top_diseases": [
                    {"name": name, "code": code, "diagnosis_count": count}
                    for name, code, count in top_diseases
                ]
            }
            
        except Exception as e:
            logger.error(f"Error in optimized disease statistics: {e}")
            return {}
    
    def search_patients_optimized(
        self, 
        search_term: str, 
        user_id: int, 
        user_role: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Optimized patient search with proper indexing
        """
        try:
            # Build base query with proper joins
            query = self.db.query(Patient).options(
                selectinload(Patient.diagnoses)
            )
            
            # Apply role-based filtering
            if user_role == "frontline_worker":
                query = query.filter(Patient.frontline_worker_id == user_id)
            
            # Apply search filters using indexed columns
            search_lower = search_term.lower()
            query = query.filter(
                or_(
                    func.lower(Patient.first_name).like(f'%{search_lower}%'),
                    func.lower(Patient.last_name).like(f'%{search_lower}%'),
                    func.lower(Patient.unique_id).like(f'%{search_lower}%'),
                    func.lower(Patient.phone_number).like(f'%{search_lower}%')
                )
            )
            
            patients = query.limit(limit).all()
            
            # Convert to optimized format
            results = []
            for patient in patients:
                recent_diagnosis = None
                if patient.diagnoses:
                    recent_diagnosis = max(patient.diagnoses, key=lambda d: d.created_at)
                
                results.append({
                    "id": patient.id,
                    "unique_id": patient.unique_id,
                    "full_name": f"{patient.first_name} {patient.last_name}",
                    "phone_number": patient.phone_number,
                    "gender": patient.gender,
                    "date_of_birth": patient.date_of_birth,
                    "recent_diagnosis": {
                        "disease_name": recent_diagnosis.disease.name if recent_diagnosis and recent_diagnosis.disease else None,
                        "status": recent_diagnosis.status.value if recent_diagnosis else None,
                        "created_at": recent_diagnosis.created_at.isoformat() if recent_diagnosis else None
                    } if recent_diagnosis else None
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error in optimized patient search: {e}")
            return []
    
    def get_treatment_protocols_optimized(
        self, 
        disease_id: int
    ) -> List[Dict[str, Any]]:
        """
        Optimized query for treatment protocols
        """
        try:
            protocols = self.db.query(TreatmentProtocol).filter(
                TreatmentProtocol.disease_id == disease_id
            ).order_by(TreatmentProtocol.priority).all()
            
            results = []
            for protocol in protocols:
                results.append({
                    "id": protocol.id,
                    "name": protocol.name,
                    "medications": protocol.medications,
                    "procedures": protocol.procedures,
                    "lifestyle_changes": protocol.lifestyle_changes,
                    "duration_days": protocol.duration_days,
                    "success_rate": protocol.success_rate,
                    "cost_estimate": protocol.cost_estimate,
                    "priority": protocol.priority
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error in optimized treatment protocols query: {e}")
            return []
    
    def _calculate_symptom_match_score_fast(
        self, 
        input_symptoms: List[str], 
        disease_symptoms: List[str]
    ) -> float:
        """
        Fast symptom matching using set operations
        """
        if not input_symptoms or not disease_symptoms:
            return 0.0
        
        # Convert to lowercase sets for fast comparison
        input_set = {symptom.lower().strip() for symptom in input_symptoms}
        disease_set = {symptom.lower().strip() for symptom in disease_symptoms}
        
        # Calculate Jaccard similarity
        intersection = len(input_set.intersection(disease_set))
        union = len(input_set.union(disease_set))
        
        if union == 0:
            return 0.0
        
        return intersection / union
    
    @lru_cache(maxsize=100)
    def get_disease_by_code_cached(self, disease_code: str) -> Optional[Dict[str, Any]]:
        """
        Cached disease lookup by code
        """
        try:
            disease = self.db.query(Disease).filter(Disease.code == disease_code.lower()).first()
            if disease:
                return {
                    "id": disease.id,
                    "code": disease.code,
                    "name": disease.name,
                    "category": disease.category.value,
                    "severity": disease.severity.value,
                    "common_symptoms": disease.common_symptoms,
                    "specific_symptoms": disease.specific_symptoms
                }
            return None
        except Exception as e:
            logger.error(f"Error in cached disease lookup: {e}")
            return None
    
    def create_database_indexes(self):
        """
        Create additional database indexes for performance
        """
        try:
            # Create indexes for common query patterns
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_diagnoses_created_at ON diagnoses(created_at DESC)",
                "CREATE INDEX IF NOT EXISTS idx_diagnoses_status ON diagnoses(status)",
                "CREATE INDEX IF NOT EXISTS idx_diagnoses_disease_code ON diagnoses(disease_code)",
                "CREATE INDEX IF NOT EXISTS idx_diagnoses_patient_id ON diagnoses(patient_id)",
                "CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name)",
                "CREATE INDEX IF NOT EXISTS idx_patients_unique_id ON patients(unique_id)",
                "CREATE INDEX IF NOT EXISTS idx_diseases_category ON diseases(category)",
                "CREATE INDEX IF NOT EXISTS idx_diseases_severity ON diseases(severity)",
                "CREATE INDEX IF NOT EXISTS idx_diseases_code ON diseases(code)",
                "CREATE INDEX IF NOT EXISTS idx_treatment_protocols_disease_id ON treatment_protocols(disease_id)"
            ]
            
            for index_sql in indexes:
                try:
                    self.db.execute(text(index_sql))
                    logger.info(f"Created index: {index_sql}")
                except Exception as e:
                    logger.warning(f"Index creation failed (may already exist): {e}")
            
            self.db.commit()
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating database indexes: {e}")
            self.db.rollback()


# Utility functions for easy integration
def get_optimized_db_service(db: Session) -> DatabaseOptimizationService:
    """Get an instance of the database optimization service"""
    return DatabaseOptimizationService(db)

def optimize_database_queries(db: Session):
    """Initialize database optimizations"""
    service = DatabaseOptimizationService(db)
    service.create_database_indexes()
    return service
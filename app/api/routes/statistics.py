from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.auth import get_current_active_user
from app.db.database import get_db
from app.db.models import User, Patient, Diagnosis, Treatment, FollowUp, DiagnosisStatus, Disease, DiseaseCategory, UserRole
from app.api.schemas import StatisticsResponse, DiseaseStatistics, RegionStatistics, TimeSeriesData, StatisticsPeriod
from app.data.extended_diseases_database import get_complete_disease_database
from app.data.comprehensive_diseases_500 import DiseaseCategory as ComprehensiveDiseaseCategory

router = APIRouter(prefix="/statistics", tags=["statistics"])

def map_comprehensive_to_api_category(comp_category: ComprehensiveDiseaseCategory) -> DiseaseCategory:
    """Map comprehensive database categories to API categories"""
    mapping = {
        ComprehensiveDiseaseCategory.INFECTIOUS_PARASITIC: DiseaseCategory.INFECTIOUS,
        ComprehensiveDiseaseCategory.NEOPLASMS: DiseaseCategory.CANCER,
        ComprehensiveDiseaseCategory.CIRCULATORY: DiseaseCategory.CARDIOVASCULAR,
        ComprehensiveDiseaseCategory.RESPIRATORY: DiseaseCategory.RESPIRATORY,
        ComprehensiveDiseaseCategory.NERVOUS_SYSTEM: DiseaseCategory.NEUROLOGICAL,
        ComprehensiveDiseaseCategory.DIGESTIVE: DiseaseCategory.GASTROINTESTINAL,
        ComprehensiveDiseaseCategory.ENDOCRINE_METABOLIC: DiseaseCategory.ENDOCRINE,
        ComprehensiveDiseaseCategory.MENTAL_BEHAVIORAL: DiseaseCategory.MENTAL_HEALTH,
        ComprehensiveDiseaseCategory.GENITOURINARY: DiseaseCategory.KIDNEY,
        ComprehensiveDiseaseCategory.SKIN_SUBCUTANEOUS: DiseaseCategory.SKIN,
        ComprehensiveDiseaseCategory.MUSCULOSKELETAL: DiseaseCategory.BONE_JOINT,
        ComprehensiveDiseaseCategory.VISUAL_SYSTEM: DiseaseCategory.EYE,
        ComprehensiveDiseaseCategory.EAR_MASTOID: DiseaseCategory.ENT,
        ComprehensiveDiseaseCategory.PREGNANCY_CHILDBIRTH: DiseaseCategory.REPRODUCTIVE,
        ComprehensiveDiseaseCategory.BLOOD_IMMUNE: DiseaseCategory.BLOOD,
        ComprehensiveDiseaseCategory.CONGENITAL: DiseaseCategory.GENETIC,
    }
    return mapping.get(comp_category, DiseaseCategory.GENERAL)

@router.get("/", response_model=StatisticsResponse)
async def get_statistics(
    period: StatisticsPeriod = Query(StatisticsPeriod.MONTHLY),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Get dashboard statistics based on specified period and date range"""
    
    # Set default date range if not provided
    if not end_date:
        end_date = datetime.utcnow()
    
    if not start_date:
        if period == StatisticsPeriod.DAILY:
            start_date = end_date - timedelta(days=1)
        elif period == StatisticsPeriod.WEEKLY:
            start_date = end_date - timedelta(weeks=1)
        elif period == StatisticsPeriod.MONTHLY:
            start_date = end_date - timedelta(days=30)
        else:  # YEARLY
            start_date = end_date - timedelta(days=365)
    
    # Get total diagnoses in the period
    total_diagnoses = db.query(func.count(Diagnosis.id)).filter(
        Diagnosis.created_at >= start_date,
        Diagnosis.created_at <= end_date
    ).scalar()
    
    # Get disease-specific statistics
    diseases_breakdown = []
    
    # Get comprehensive disease database
    comprehensive_diseases = get_complete_disease_database()
    
    # Get all disease codes that have diagnoses in the period
    disease_stats_query = db.query(
        Diagnosis.disease_code,
        func.count(Diagnosis.id).label("total_cases")
    ).filter(
        Diagnosis.created_at >= start_date,
        Diagnosis.created_at <= end_date,
        Diagnosis.disease_code.isnot(None)
    ).group_by(Diagnosis.disease_code).all()
    
    for disease_code, total_cases in disease_stats_query:
        if total_cases == 0:
            continue
            
        # Get disease information from comprehensive database
        disease_info = comprehensive_diseases.get(disease_code)
        if not disease_info:
            continue
            
        disease_name = disease_info.name
            
        # Get base query for this disease
        base_query = db.query(Diagnosis).filter(
            Diagnosis.disease_code == disease_code,
            Diagnosis.created_at >= start_date,
            Diagnosis.created_at <= end_date
        )
        
        # Count confirmed cases
        confirmed_cases = base_query.filter(
            Diagnosis.status == DiagnosisStatus.CONFIRMED
        ).count()
        
        # Count pending cases
        pending_cases = base_query.filter(
            Diagnosis.status.in_([DiagnosisStatus.PENDING, DiagnosisStatus.IN_PROGRESS])
        ).count()
        
        # Calculate rejection rate
        rejected_cases = base_query.filter(
            Diagnosis.status == DiagnosisStatus.REJECTED
        ).count()
        
        rejection_rate = rejected_cases / total_cases if total_cases > 0 else 0.0
        
        # Get disease category from comprehensive database
        disease_info = comprehensive_diseases.get(disease_code)
        if disease_info:
            disease_category = map_comprehensive_to_api_category(disease_info.category)
        else:
            disease_category = DiseaseCategory.GENERAL
        
        # Add to disease breakdown
        diseases_breakdown.append(DiseaseStatistics(
            disease_code=disease_code,
            disease_name=disease_name,
            category=disease_category,
            total_cases=total_cases,
            confirmed_cases=confirmed_cases,
            pending_cases=pending_cases,
            rejection_rate=rejection_rate
        ))
    
    # Get regional statistics (filter out null addresses)
    regions_query = db.query(
        Patient.address,
        func.count(Patient.id).label("total_patients"),
        func.count(Diagnosis.id).label("active_cases")
    ).join(Diagnosis, Patient.id == Diagnosis.patient_id).filter(
        (Diagnosis.created_at >= start_date) & 
        (Diagnosis.created_at <= end_date) &
        (Patient.address.isnot(None)) &
        (Patient.address != "")
    ).group_by(Patient.address).all()
    
    regional_data = []
    for region, total_patients, active_cases in regions_query:
        # Get disease breakdown for this region
        disease_breakdown = {}
        region_disease_stats = db.query(
            Diagnosis.disease_code,
            func.count(Diagnosis.id).label("count")
        ).join(
            Patient, Patient.id == Diagnosis.patient_id
        ).filter(
            Patient.address == region,
            Diagnosis.created_at >= start_date,
            Diagnosis.created_at <= end_date,
            Diagnosis.disease_code.isnot(None)
        ).group_by(Diagnosis.disease_code).all()
        
        for disease_code, count in region_disease_stats:
            if count > 0:
                disease_breakdown[disease_code] = count
        
        regional_data.append(RegionStatistics(
            region=region,
            total_patients=total_patients,
            active_cases=active_cases,
            disease_breakdown=disease_breakdown
        ))
    
    # Generate time series data
    time_series = {}
    
    # Determine the date grouping based on period (SQLite compatible)
    if period == StatisticsPeriod.DAILY:
        # Group by hour
        date_part = func.strftime('%Y-%m-%d %H:00:00', Diagnosis.created_at)
        delta = timedelta(hours=1)
    elif period == StatisticsPeriod.WEEKLY:
        # Group by day
        date_part = func.strftime('%Y-%m-%d', Diagnosis.created_at)
        delta = timedelta(days=1)
    elif period == StatisticsPeriod.MONTHLY:
        # Group by day
        date_part = func.strftime('%Y-%m-%d', Diagnosis.created_at)
        delta = timedelta(days=1)
    else:  # YEARLY
        # Group by month
        date_part = func.strftime('%Y-%m', Diagnosis.created_at)
        delta = timedelta(days=30)  # Approximate
    
    # Get diagnosis counts over time
    diagnosis_time_series = db.query(
        date_part.label("date"),
        func.count(Diagnosis.id).label("count")
    ).filter(
        Diagnosis.created_at >= start_date,
        Diagnosis.created_at <= end_date
    ).group_by("date").order_by("date").all()
    
    # Convert to TimeSeriesData objects
    time_series["diagnoses"] = [
        TimeSeriesData(
            date=datetime.strptime(date, '%Y-%m-%d %H:%M:%S' if period == StatisticsPeriod.DAILY else '%Y-%m-%d' if period != StatisticsPeriod.YEARLY else '%Y-%m'),
            value=count
        )
        for date, count in diagnosis_time_series
    ]
    
    # Return the complete statistics response
    return StatisticsResponse(
        period=period,
        start_date=start_date,
        end_date=end_date,
        total_diagnoses=total_diagnoses,
        diseases_breakdown=diseases_breakdown,
        regional_data=regional_data,
        time_series=time_series
    )

@router.get("/disease-trends", response_model=Dict[str, List[int]])
async def get_disease_trends(
    days: int = 30,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Get disease diagnosis trends over time"""
    
    # Calculate the start date based on the requested number of days
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all diseases that have diagnoses in the time range
    active_diseases = db.query(Diagnosis.disease_code).filter(
        Diagnosis.created_at >= start_date,
        Diagnosis.disease_code.isnot(None)
    ).distinct().all()
    
    # Initialize the result dictionary with empty lists for each active disease
    trends = {disease_code[0]: [0] * days for disease_code in active_diseases}
    
    # Query diagnoses within the time range
    diagnoses = db.query(
        Diagnosis.disease_code,
        func.date(Diagnosis.created_at),
        func.count(Diagnosis.id)
    ).filter(
        Diagnosis.created_at >= start_date,
        Diagnosis.disease_code.isnot(None)
    ).group_by(
        Diagnosis.disease_code,
        func.date(Diagnosis.created_at)
    ).all()
    
    # Process the query results
    for disease_code, date, count in diagnoses:
        # Calculate the index in the array (days from start_date)
        days_from_start = (date - start_date.date()).days
        if 0 <= days_from_start < days and disease_code in trends:
            trends[disease_code][days_from_start] = count
    
    return trends

@router.get("/disease-categories", response_model=Dict[str, int])
async def get_disease_category_statistics(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get statistics by disease category"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get comprehensive disease database
    comprehensive_diseases = get_complete_disease_database()
    
    # Get diagnoses with disease codes
    diagnoses_with_codes = db.query(
        Diagnosis.disease_code,
        func.count(Diagnosis.id).label("count")
    ).filter(
        Diagnosis.created_at >= start_date,
        Diagnosis.disease_code.isnot(None)
    ).group_by(Diagnosis.disease_code).all()
    
    # Map to categories
    category_stats = {}
    for disease_code, count in diagnoses_with_codes:
        disease_info = comprehensive_diseases.get(disease_code)
        if disease_info:
            category = disease_info.category.value
            category_stats[category] = category_stats.get(category, 0) + count
    
    return category_stats

@router.get("/comprehensive-statistics")
async def get_comprehensive_disease_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive statistics about the disease database"""
    
    # Get total diseases in the comprehensive database
    comprehensive_diseases = get_complete_disease_database()
    total_diseases_available = len(comprehensive_diseases)
    
    # Get diseases that have been diagnosed
    diagnosed_diseases = db.query(Diagnosis.disease_code).filter(
        Diagnosis.disease_code.isnot(None)
    ).distinct().count()
    
    # Get category breakdown from comprehensive database
    category_breakdown = {}
    for disease in comprehensive_diseases.values():
        category = disease.category.value
        category_breakdown[category] = category_breakdown.get(category, 0) + 1
    
    # Get severity breakdown from comprehensive database
    severity_breakdown = {}
    for disease in comprehensive_diseases.values():
        severity = disease.severity.value
        severity_breakdown[severity] = severity_breakdown.get(severity, 0) + 1
    
    return {
        "total_diseases_available": total_diseases_available,
        "diseases_with_diagnoses": diagnosed_diseases,
        "coverage_percentage": (diagnosed_diseases / total_diseases_available * 100) if total_diseases_available > 0 else 0,
        "category_breakdown": category_breakdown,
        "severity_breakdown": severity_breakdown
    }
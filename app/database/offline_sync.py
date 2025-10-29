"""
Data Synchronization Module for AfriDiag Rural Deployment
Handles syncing local SQLite data with remote servers when internet is available
"""

import asyncio
import json
import sqlite3
import aiohttp
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import hashlib
import os

logger = logging.getLogger(__name__)

class OfflineSync:
    def __init__(self, db_path: str, remote_url: str = None, api_key: str = None):
        self.db_path = db_path
        self.remote_url = remote_url or os.getenv("SYNC_SERVER_URL")
        self.api_key = api_key or os.getenv("SYNC_API_KEY")
        self.sync_enabled = bool(self.remote_url and self.api_key)
        
    async def check_internet_connectivity(self) -> bool:
        """Check if internet connection is available"""
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get('https://8.8.8.8', timeout=5) as response:
                    return response.status == 200
        except:
            return False
    
    async def get_pending_sync_items(self) -> List[Dict]:
        """Get all items in sync queue that need to be synchronized"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT * FROM sync_queue 
                WHERE status = 'pending' 
                ORDER BY created_at ASC
            """)
            items = [dict(row) for row in cursor.fetchall()]
            return items
        finally:
            conn.close()
    
    async def add_to_sync_queue(self, table_name: str, record_id: str, 
                               operation: str, data: Dict = None):
        """Add an item to the sync queue"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            sync_id = f"{table_name}_{record_id}_{operation}_{datetime.now().isoformat()}"
            data_hash = hashlib.md5(json.dumps(data or {}, sort_keys=True).encode()).hexdigest()
            
            cursor.execute("""
                INSERT OR REPLACE INTO sync_queue 
                (sync_id, table_name, record_id, operation, data, data_hash, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
            """, (sync_id, table_name, record_id, operation, 
                  json.dumps(data) if data else None, data_hash, datetime.now().isoformat()))
            
            conn.commit()
            logger.info(f"Added to sync queue: {table_name}.{record_id} ({operation})")
        finally:
            conn.close()
    
    async def sync_patient_data(self, session: aiohttp.ClientSession) -> Tuple[int, int]:
        """Sync patient data with remote server"""
        success_count = 0
        error_count = 0
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            # Get patients that need syncing
            cursor.execute("""
                SELECT p.*, sq.sync_id, sq.operation 
                FROM patients p
                JOIN sync_queue sq ON p.patient_id = sq.record_id
                WHERE sq.table_name = 'patients' AND sq.status = 'pending'
            """)
            
            patients = cursor.fetchall()
            
            for patient in patients:
                try:
                    patient_data = dict(patient)
                    sync_id = patient_data.pop('sync_id')
                    operation = patient_data.pop('operation')
                    
                    if operation == 'create' or operation == 'update':
                        async with session.post(
                            f"{self.remote_url}/api/patients/sync",
                            json=patient_data,
                            headers={"Authorization": f"Bearer {self.api_key}"}
                        ) as response:
                            if response.status == 200:
                                await self._mark_sync_complete(sync_id)
                                success_count += 1
                            else:
                                await self._mark_sync_error(sync_id, f"HTTP {response.status}")
                                error_count += 1
                    
                    elif operation == 'delete':
                        async with session.delete(
                            f"{self.remote_url}/api/patients/{patient_data['patient_id']}",
                            headers={"Authorization": f"Bearer {self.api_key}"}
                        ) as response:
                            if response.status in [200, 404]:  # 404 is OK for delete
                                await self._mark_sync_complete(sync_id)
                                success_count += 1
                            else:
                                await self._mark_sync_error(sync_id, f"HTTP {response.status}")
                                error_count += 1
                
                except Exception as e:
                    logger.error(f"Error syncing patient {patient['patient_id']}: {e}")
                    await self._mark_sync_error(sync_id, str(e))
                    error_count += 1
        
        finally:
            conn.close()
        
        return success_count, error_count
    
    async def sync_diagnosis_data(self, session: aiohttp.ClientSession) -> Tuple[int, int]:
        """Sync diagnosis data with remote server"""
        success_count = 0
        error_count = 0
        
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT d.*, sq.sync_id, sq.operation 
                FROM diagnoses d
                JOIN sync_queue sq ON d.diagnosis_id = sq.record_id
                WHERE sq.table_name = 'diagnoses' AND sq.status = 'pending'
            """)
            
            diagnoses = cursor.fetchall()
            
            for diagnosis in diagnoses:
                try:
                    diagnosis_data = dict(diagnosis)
                    sync_id = diagnosis_data.pop('sync_id')
                    operation = diagnosis_data.pop('operation')
                    
                    if operation == 'create' or operation == 'update':
                        async with session.post(
                            f"{self.remote_url}/api/diagnoses/sync",
                            json=diagnosis_data,
                            headers={"Authorization": f"Bearer {self.api_key}"}
                        ) as response:
                            if response.status == 200:
                                await self._mark_sync_complete(sync_id)
                                success_count += 1
                            else:
                                await self._mark_sync_error(sync_id, f"HTTP {response.status}")
                                error_count += 1
                
                except Exception as e:
                    logger.error(f"Error syncing diagnosis {diagnosis['diagnosis_id']}: {e}")
                    await self._mark_sync_error(sync_id, str(e))
                    error_count += 1
        
        finally:
            conn.close()
        
        return success_count, error_count
    
    async def download_updates(self, session: aiohttp.ClientSession) -> Tuple[int, int]:
        """Download updates from remote server"""
        success_count = 0
        error_count = 0
        
        try:
            # Get last sync timestamp
            last_sync = await self._get_last_sync_timestamp()
            
            # Download patient updates
            async with session.get(
                f"{self.remote_url}/api/sync/patients",
                params={"since": last_sync},
                headers={"Authorization": f"Bearer {self.api_key}"}
            ) as response:
                if response.status == 200:
                    updates = await response.json()
                    for update in updates.get('patients', []):
                        await self._apply_patient_update(update)
                        success_count += 1
            
            # Download diagnosis updates
            async with session.get(
                f"{self.remote_url}/api/sync/diagnoses",
                params={"since": last_sync},
                headers={"Authorization": f"Bearer {self.api_key}"}
            ) as response:
                if response.status == 200:
                    updates = await response.json()
                    for update in updates.get('diagnoses', []):
                        await self._apply_diagnosis_update(update)
                        success_count += 1
            
            # Update last sync timestamp
            await self._update_last_sync_timestamp()
        
        except Exception as e:
            logger.error(f"Error downloading updates: {e}")
            error_count += 1
        
        return success_count, error_count
    
    async def perform_full_sync(self) -> Dict[str, any]:
        """Perform a complete synchronization cycle"""
        if not self.sync_enabled:
            return {"status": "disabled", "message": "Sync not configured"}
        
        # Check internet connectivity
        if not await self.check_internet_connectivity():
            return {"status": "no_internet", "message": "No internet connection available"}
        
        sync_results = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "patients_uploaded": 0,
            "diagnoses_uploaded": 0,
            "updates_downloaded": 0,
            "errors": 0
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                # Upload local changes
                patient_success, patient_errors = await self.sync_patient_data(session)
                diagnosis_success, diagnosis_errors = await self.sync_diagnosis_data(session)
                
                # Download remote updates
                download_success, download_errors = await self.download_updates(session)
                
                sync_results.update({
                    "patients_uploaded": patient_success,
                    "diagnoses_uploaded": diagnosis_success,
                    "updates_downloaded": download_success,
                    "errors": patient_errors + diagnosis_errors + download_errors
                })
                
                # Log sync completion
                await self._log_sync_completion(sync_results)
                
        except Exception as e:
            logger.error(f"Sync failed: {e}")
            sync_results.update({
                "status": "error",
                "message": str(e),
                "errors": 1
            })
        
        return sync_results
    
    async def _mark_sync_complete(self, sync_id: str):
        """Mark a sync item as completed"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                UPDATE sync_queue 
                SET status = 'completed', completed_at = ?
                WHERE sync_id = ?
            """, (datetime.now().isoformat(), sync_id))
            conn.commit()
        finally:
            conn.close()
    
    async def _mark_sync_error(self, sync_id: str, error_message: str):
        """Mark a sync item as failed"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                UPDATE sync_queue 
                SET status = 'error', error_message = ?, retry_count = retry_count + 1
                WHERE sync_id = ?
            """, (error_message, sync_id))
            conn.commit()
        finally:
            conn.close()
    
    async def _get_last_sync_timestamp(self) -> str:
        """Get the timestamp of the last successful sync"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT setting_value FROM system_settings 
                WHERE setting_key = 'last_sync_timestamp'
            """)
            result = cursor.fetchone()
            return result[0] if result else "1970-01-01T00:00:00"
        finally:
            conn.close()
    
    async def _update_last_sync_timestamp(self):
        """Update the last sync timestamp"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT OR REPLACE INTO system_settings (setting_key, setting_value)
                VALUES ('last_sync_timestamp', ?)
            """, (datetime.now().isoformat(),))
            conn.commit()
        finally:
            conn.close()
    
    async def _apply_patient_update(self, update: Dict):
        """Apply a patient update from remote server"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            if update.get('operation') == 'delete':
                cursor.execute("DELETE FROM patients WHERE patient_id = ?", 
                             (update['patient_id'],))
            else:
                # Insert or update patient
                cursor.execute("""
                    INSERT OR REPLACE INTO patients 
                    (patient_id, first_name, last_name, date_of_birth, gender, 
                     phone, email, address, emergency_contact, medical_history, 
                     allergies, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    update['patient_id'], update['first_name'], update['last_name'],
                    update['date_of_birth'], update['gender'], update.get('phone'),
                    update.get('email'), update.get('address'), 
                    update.get('emergency_contact'), update.get('medical_history'),
                    update.get('allergies'), update['created_at'], update['updated_at']
                ))
            
            conn.commit()
        finally:
            conn.close()
    
    async def _apply_diagnosis_update(self, update: Dict):
        """Apply a diagnosis update from remote server"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            if update.get('operation') == 'delete':
                cursor.execute("DELETE FROM diagnoses WHERE diagnosis_id = ?", 
                             (update['diagnosis_id'],))
            else:
                cursor.execute("""
                    INSERT OR REPLACE INTO diagnoses 
                    (diagnosis_id, patient_id, symptoms, primary_diagnosis, 
                     differential_diagnosis, confidence_score, ai_analysis, 
                     doctor_notes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    update['diagnosis_id'], update['patient_id'], 
                    json.dumps(update['symptoms']), update['primary_diagnosis'],
                    json.dumps(update.get('differential_diagnosis', [])),
                    update.get('confidence_score'), json.dumps(update.get('ai_analysis', {})),
                    update.get('doctor_notes'), update['created_at'], update['updated_at']
                ))
            
            conn.commit()
        finally:
            conn.close()
    
    async def _log_sync_completion(self, results: Dict):
        """Log sync completion to audit log"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO audit_log (action, details, timestamp)
                VALUES ('sync_completed', ?, ?)
            """, (json.dumps(results), datetime.now().isoformat()))
            conn.commit()
        finally:
            conn.close()

# Utility functions for integration with main application

async def auto_sync_if_connected(db_path: str):
    """Automatically sync if internet connection is available"""
    sync_manager = OfflineSync(db_path)
    
    if await sync_manager.check_internet_connectivity():
        logger.info("Internet connection detected, starting auto-sync...")
        results = await sync_manager.perform_full_sync()
        logger.info(f"Auto-sync completed: {results}")
        return results
    else:
        logger.debug("No internet connection, skipping auto-sync")
        return {"status": "no_internet"}

def schedule_periodic_sync(db_path: str, interval_hours: int = 6):
    """Schedule periodic sync attempts"""
    async def periodic_sync():
        while True:
            try:
                await auto_sync_if_connected(db_path)
            except Exception as e:
                logger.error(f"Periodic sync failed: {e}")
            
            # Wait for next sync interval
            await asyncio.sleep(interval_hours * 3600)
    
    # Start the periodic sync task
    asyncio.create_task(periodic_sync())
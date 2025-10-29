import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { API_BASE_URL as API_URL } from '../utils/apiConfig';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Longer timeout for sync operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (typeof window !== 'undefined') {
    const lsToken = window.localStorage.getItem('userToken');
    if (lsToken) {
      config.headers.Authorization = `Bearer ${lsToken}`;
    }
  }
  return config;
});

/**
 * Check if device is online
 * @returns {Promise<boolean>} - True if online
 */
export const isOnline = async () => {
  const networkState = await NetInfo.fetch();
  return networkState.isConnected;
};

/**
 * Get last sync timestamp
 * @returns {Promise<Date|null>} - Last sync timestamp
 */
export const getLastSyncTime = async () => {
  try {
    const timestamp = await AsyncStorage.getItem('lastSyncTime');
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};

/**
 * Set last sync timestamp
 * @param {Date} timestamp - Sync timestamp
 */
export const setLastSyncTime = async (timestamp = new Date()) => {
  try {
    await AsyncStorage.setItem('lastSyncTime', timestamp.toISOString());
  } catch (error) {
    console.error('Error setting last sync time:', error);
  }
};

/**
 * Get offline data from local storage
 * @param {string} key - Storage key
 * @returns {Promise<Array>} - Offline data array
 */
export const getOfflineData = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting offline data for ${key}:`, error);
    return [];
  }
};

/**
 * Save data to offline storage
 * @param {string} key - Storage key
 * @param {Array} data - Data to save
 */
export const saveOfflineData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving offline data for ${key}:`, error);
  }
};

/**
 * Add item to offline queue
 * @param {string} key - Storage key
 * @param {Object} item - Item to add
 */
export const addToOfflineQueue = async (key, item) => {
  try {
    const existingData = await getOfflineData(key);
    const newData = [...existingData, {
      ...item,
      _offline: true,
      _timestamp: new Date().toISOString(),
      _id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }];
    await saveOfflineData(key, newData);
    return newData[newData.length - 1];
  } catch (error) {
    console.error(`Error adding to offline queue for ${key}:`, error);
    throw error;
  }
};

/**
 * Remove item from offline queue
 * @param {string} key - Storage key
 * @param {string} itemId - Item ID to remove
 */
export const removeFromOfflineQueue = async (key, itemId) => {
  try {
    const existingData = await getOfflineData(key);
    const filteredData = existingData.filter(item => item._id !== itemId);
    await saveOfflineData(key, filteredData);
  } catch (error) {
    console.error(`Error removing from offline queue for ${key}:`, error);
  }
};

/**
 * Sync offline patients with server
 * @returns {Promise<Object>} - Sync result
 */
export const syncOfflinePatients = async () => {
  try {
    if (!(await isOnline())) {
      throw new Error('Device is offline');
    }

    const offlinePatients = await getOfflineData('offlinePatients');
    const syncResults = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const patient of offlinePatients) {
      try {
        // Remove offline metadata before sending
        const { _offline, _timestamp, _id, ...patientData } = patient;
        
        // Create patient on server
        const response = await api.post('/patients', patientData);
        
        // Remove from offline queue
        await removeFromOfflineQueue('offlinePatients', _id);
        
        syncResults.success++;
      } catch (error) {
        console.error('Error syncing patient:', error);
        syncResults.failed++;
        syncResults.errors.push({
          patient: patient._id,
          error: error.message
        });
      }
    }

    return syncResults;
  } catch (error) {
    console.error('Error syncing offline patients:', error);
    throw error;
  }
};

/**
 * Sync offline diagnoses with server
 * @returns {Promise<Object>} - Sync result
 */
export const syncOfflineDiagnoses = async () => {
  try {
    if (!(await isOnline())) {
      throw new Error('Device is offline');
    }

    const offlineDiagnoses = await getOfflineData('offlineDiagnoses');
    const syncResults = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const diagnosis of offlineDiagnoses) {
      try {
        // Remove offline metadata before sending
        const { _offline, _timestamp, _id, ...diagnosisData } = diagnosis;
        
        // Create diagnosis on server
        const response = await api.post('/diagnoses', diagnosisData);
        
        // Remove from offline queue
        await removeFromOfflineQueue('offlineDiagnoses', _id);
        
        syncResults.success++;
      } catch (error) {
        console.error('Error syncing diagnosis:', error);
        syncResults.failed++;
        syncResults.errors.push({
          diagnosis: diagnosis._id,
          error: error.message
        });
      }
    }

    return syncResults;
  } catch (error) {
    console.error('Error syncing offline diagnoses:', error);
    throw error;
  }
};

/**
 * Sync all offline data with server
 * @returns {Promise<Object>} - Complete sync result
 */
export const syncAllOfflineData = async () => {
  try {
    if (!(await isOnline())) {
      throw new Error('Device is offline');
    }

    const results = {
      patients: { success: 0, failed: 0, errors: [] },
      diagnoses: { success: 0, failed: 0, errors: [] },
      treatments: { success: 0, failed: 0, errors: [] },
      totalSuccess: 0,
      totalFailed: 0,
      startTime: new Date(),
      endTime: null
    };

    // Sync patients
    try {
      results.patients = await syncOfflinePatients();
      results.totalSuccess += results.patients.success;
      results.totalFailed += results.patients.failed;
    } catch (error) {
      console.error('Error syncing patients:', error);
      results.patients.errors.push({ general: error.message });
    }

    // Sync diagnoses
    try {
      results.diagnoses = await syncOfflineDiagnoses();
      results.totalSuccess += results.diagnoses.success;
      results.totalFailed += results.diagnoses.failed;
    } catch (error) {
      console.error('Error syncing diagnoses:', error);
      results.diagnoses.errors.push({ general: error.message });
    }

    // Sync treatments
    try {
      const { syncOfflineTreatments } = await import('./treatmentService');
      results.treatments = await syncOfflineTreatments();
      results.totalSuccess += results.treatments.success;
      results.totalFailed += results.treatments.failed;
    } catch (error) {
      console.error('Error syncing treatments:', error);
      results.treatments.errors.push({ general: error.message });
    }

    // Update last sync time if any items were successfully synced
    if (results.totalSuccess > 0) {
      await setLastSyncTime();
    }

    results.endTime = new Date();
    return results;
  } catch (error) {
    console.error('Error in complete sync:', error);
    throw error;
  }
};

/**
 * Get sync status and pending items count
 * @returns {Promise<Object>} - Sync status
 */
export const getSyncStatus = async () => {
  try {
    const lastSync = await getLastSyncTime();
    const offlinePatients = await getOfflineData('offlinePatients');
    const offlineDiagnoses = await getOfflineData('offlineDiagnoses');
    
    // Get treatment data
    let offlineTreatments = [];
    try {
      const { getOfflineTreatments } = await import('./treatmentService');
      offlineTreatments = await getOfflineTreatments();
    } catch (error) {
      console.warn('Could not load treatment data:', error);
    }
    
    const online = await isOnline();

    return {
      isOnline: online,
      lastSyncTime: lastSync,
      pendingItems: {
        patients: offlinePatients.length,
        diagnoses: offlineDiagnoses.length,
        treatments: offlineTreatments.length,
        total: offlinePatients.length + offlineDiagnoses.length + offlineTreatments.length
      },
      canSync: online && (offlinePatients.length > 0 || offlineDiagnoses.length > 0 || offlineTreatments.length > 0)
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    return {
      isOnline: false,
      lastSyncTime: null,
      pendingItems: { patients: 0, diagnoses: 0, treatments: 0, total: 0 },
      canSync: false
    };
  }
};

/**
 * Clear all offline data (use with caution)
 * @returns {Promise<void>}
 */
export const clearOfflineData = async () => {
  try {
    await AsyncStorage.removeItem('offlinePatients');
    await AsyncStorage.removeItem('offlineDiagnoses');
    await AsyncStorage.removeItem('lastSyncTime');
    
    // Clear treatment data
    try {
      const { clearOfflineTreatmentData } = await import('./treatmentService');
      await clearOfflineTreatmentData();
    } catch (error) {
      console.warn('Could not clear treatment data:', error);
    }
    
    console.log('All offline data cleared');
  } catch (error) {
    console.error('Error clearing offline data:', error);
    throw error;
  }
};
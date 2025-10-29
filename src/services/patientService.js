import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline } from './syncService';
import { 
  createApiInstance, 
  makeApiRequest, 
  ApiError, 
  ERROR_TYPES,
  getErrorMessage,
  getErrorType,
  checkNetworkConnectivity 
} from '../utils/apiUtils';
import { API_BASE_URL as API_URL } from '../utils/apiConfig';

// Create enhanced API instance
const api = createApiInstance(API_URL, {
  timeout: 10000,
});

/**
 * Get all patients
 * @returns {Promise} - Array of patients
 */
export const getPatients = async (page = 1, limit = 20, search = '', options = {}) => {
  const {
    onRetry,
    onError,
    maxRetries = 3,
  } = options;

  try {
    // Try to get cached data first
    const cacheKey = `patients_${page}_${limit}_${search}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (!(await isOnline())) {
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      throw new ApiError(
        'No internet connection and no cached data available.',
        ERROR_TYPES.OFFLINE,
        null,
        null,
        true
      );
    }

    // Backend expects page/size; align params accordingly
    const size = Math.max(1, limit);
    const params = { page, size };
    if (search) {
      params.search = search;
    }

    // Debug: confirm base URL and params used for patients request
    try {
      console.log('[patientService] Base URL:', api.defaults.baseURL);
      console.log('[patientService] Request params:', params);
    } catch (_) {}

    // Debug: inspect tokens available before request
    try {
      const storageToken = await AsyncStorage.getItem('userToken');
      const lsToken = (typeof window !== 'undefined') ? window.localStorage.getItem('userToken') : null;
      const effectiveToken = storageToken || lsToken;
      const summarize = (t) => t ? `${t.slice(0, 12)}...` : '(none)';
      console.log('[patientService] Token sources:', {
        asyncStorage: summarize(storageToken),
        localStorage: summarize(lsToken),
        effective: effectiveToken ? `Bearer ${summarize(effectiveToken)}` : '(none)',
      });
    } catch (_) {}

    // Make API request with retry logic
    const response = await makeApiRequest({
      method: 'get',
      url: '/patients/',
      params,
      baseURL: api.defaults.baseURL,
    }, {
      maxRetries,
      onRetry: (attempt, delay, error) => {
        console.log(`Retrying get patients... Attempt ${attempt + 1}`);
        if (onRetry) onRetry(attempt, delay, error);
      },
      onError: (error, attempt) => {
        console.error(`Get patients attempt ${attempt} failed:`, error);
        if (onError) onError(error, attempt);
      },
    });
    
    // Normalize response shape to an array of patient items
    const raw = response?.data;
    const items = Array.isArray(raw) ? raw : (raw?.items ?? []);

    try {
      console.log(`[patientService] Received patients count: ${items.length}`);
    } catch (_) {}

    // Normalize fields for UI expectations
    const computeAgeFromDob = (dob) => {
      if (!dob) return undefined;
      try {
        const birthDate = new Date(dob);
        const diffMs = Date.now() - birthDate.getTime();
        const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
        return years > 0 ? years : undefined;
      } catch {
        return undefined;
      }
    };

    const normalized = items.map((p) => {
      const fullName = (p.name || `${p.first_name ?? ''} ${p.last_name ?? ''}`).trim();
      return {
        id: p.id,
        name: fullName || 'Unknown',
        gender: p.gender || 'unknown',
        age: p.age ?? computeAgeFromDob(p.date_of_birth),
        notes: p.medical_history || '',
        // Keep original fields for detail screens if needed
        first_name: p.first_name,
        last_name: p.last_name,
        date_of_birth: p.date_of_birth,
        phone_number: p.phone_number,
        address: p.address,
        unique_id: p.unique_id,
        frontline_worker_id: p.frontline_worker_id,
      };
    });

    // Cache the normalized array for offline use
    await AsyncStorage.setItem(cacheKey, JSON.stringify(normalized));

    return normalized;
  } catch (error) {
    console.error('Get patients error:', error);
    
    // Try to return cached data on error
    const cacheKey = `patients_${page}_${limit}_${search}`;
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        console.log('Returning cached patient data due to error');
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.warn('Failed to retrieve cached data:', cacheError);
    }
    
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Wrap other errors
    throw new ApiError(
      getErrorMessage(error),
      getErrorType(error),
      error.response?.status,
      error,
      true
    );
  }
};

/**
 * Get a patient by ID
 * @param {number} patientId - The patient ID
 * @returns {Promise} - The patient data
 */
export const getPatientById = async (patientId) => {
  try {
    // Check if we're online
    if (!(await isOnline())) {
      // If offline, get from local storage
      return await getOfflinePatientById(patientId);
    }

    // Get from server
    const response = await api.get(`/patients/${patientId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting patient ${patientId}:`, error);
    
    // Try to get from cache if request fails
    try {
      return await getOfflinePatientById(patientId);
    } catch (offlineError) {
      throw new Error('Failed to get patient');
    }
  }
};

/**
 * Create a new patient
 * @param {Object} patientData - The patient data
 * @param {Object} options - Options for retry logic
 * @returns {Promise} - The created patient
 */
export const createPatient = async (patientData, options = {}) => {
  const {
    onRetry,
    onError,
    maxRetries = 3,
  } = options;

  try {
    if (!(await isOnline())) {
      // Save offline for later sync
      await savePatientOffline(patientData);
      return { 
        success: true, 
        offline: true, 
        message: 'Patient saved offline. Will sync when connection is restored.' 
      };
    }

    // Make API request with retry logic
    const response = await makeApiRequest({
      method: 'post',
      url: '/patients/',
      data: patientData,
      baseURL: api.defaults.baseURL,
    }, {
      maxRetries,
      onRetry: (attempt, delay, error) => {
        console.log(`Retrying create patient... Attempt ${attempt + 1}`);
        if (onRetry) onRetry(attempt, delay, error);
      },
      onError: (error, attempt) => {
        console.error(`Create patient attempt ${attempt} failed:`, error);
        if (onError) onError(error, attempt);
      },
    });
    
    // Update local cache
    await updatePatientCache(response.data);
    
    return response.data;
  } catch (error) {
    console.error('Create patient error:', error);
    
    // Save offline as backup for retryable errors
    if (error instanceof ApiError && (error.type === ERROR_TYPES.NETWORK || error.type === ERROR_TYPES.OFFLINE)) {
      try {
        await savePatientOffline(patientData);
      } catch (offlineError) {
        console.error('Failed to save patient offline:', offlineError);
      }
    }
    
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      // Add offline backup info to network errors
      if (error.type === ERROR_TYPES.NETWORK || error.type === ERROR_TYPES.OFFLINE) {
        throw new ApiError(
          'Network error. Patient saved offline for later sync.',
          error.type,
          error.statusCode,
          error.originalError,
          error.retryable
        );
      }
      throw error;
    }
    
    // Wrap other errors
    throw new ApiError(
      getErrorMessage(error),
      getErrorType(error),
      error.response?.status,
      error,
      true
    );
  }
};

/**
 * Update a patient
 * @param {number} patientId - The patient ID
 * @param {Object} patientData - The updated patient data
 * @returns {Promise} - The updated patient
 */
export const updatePatient = async (patientId, patientData) => {
  try {
    // Check if we're online
    if (!(await isOnline())) {
      // If offline, save for later sync
      return await updatePatientOffline(patientId, patientData);
    }

    // Update on server
    const response = await api.put(`/patients/${patientId}`, patientData);
    
    // Update local cache
    await updatePatientCache(response.data);
    
    return response.data;
  } catch (error) {
    console.error(`Error updating patient ${patientId}:`, error);
    throw new Error('Failed to update patient');
  }
};

/**
 * Get patients from local storage
 * @returns {Promise} - Array of patients
 */
const getOfflinePatients = async () => {
  try {
    const patientsJson = await AsyncStorage.getItem('patients');
    if (!patientsJson) {
      return [];
    }
    return JSON.parse(patientsJson);
  } catch (error) {
    console.error('Error getting offline patients:', error);
    return [];
  }
};

/**
 * Get a patient by ID from local storage
 * @param {number} patientId - The patient ID
 * @returns {Promise} - The patient data
 */
const getOfflinePatientById = async (patientId) => {
  try {
    const patients = await getOfflinePatients();
    const patient = patients.find(p => p.id === patientId);
    
    if (!patient) {
      throw new Error(`Patient ${patientId} not found offline`);
    }
    
    return patient;
  } catch (error) {
    console.error(`Error getting offline patient ${patientId}:`, error);
    throw error;
  }
};

/**
 * Save a patient for offline use
 * @param {Object} patientData - The patient data
 * @returns {Promise} - The saved patient data with a local ID
 */
const savePatientOffline = async (patientData) => {
  try {
    // Generate a local ID
    const localId = `local_${Date.now()}`;
    
    // Add metadata
    const offlinePatient = {
      ...patientData,
      id: localId,
      created_at: new Date().toISOString(),
      synced: false,
    };

    // Get existing offline patients
    const offlinePatientsJson = await AsyncStorage.getItem('offline_patients');
    const offlinePatients = offlinePatientsJson ? JSON.parse(offlinePatientsJson) : [];
    
    // Add new patient
    offlinePatients.push(offlinePatient);
    
    // Save updated list
    await AsyncStorage.setItem('offline_patients', JSON.stringify(offlinePatients));
    
    // Also update the main patients cache
    await updatePatientCache(offlinePatient);
    
    return offlinePatient;
  } catch (error) {
    console.error('Error saving patient offline:', error);
    throw new Error('Failed to save patient offline');
  }
};

/**
 * Update a patient for offline use
 * @param {number} patientId - The patient ID
 * @param {Object} patientData - The updated patient data
 * @returns {Promise} - The updated patient data
 */
const updatePatientOffline = async (patientId, patientData) => {
  try {
    // Check if this is a local patient
    const isLocalId = String(patientId).startsWith('local_');
    
    if (isLocalId) {
      // Update in offline patients
      const offlinePatientsJson = await AsyncStorage.getItem('offline_patients');
      if (offlinePatientsJson) {
        const offlinePatients = JSON.parse(offlinePatientsJson);
        const index = offlinePatients.findIndex(p => p.id === patientId);
        
        if (index !== -1) {
          // Update the patient
          offlinePatients[index] = {
            ...offlinePatients[index],
            ...patientData,
            updated_at: new Date().toISOString(),
          };
          
          // Save updated list
          await AsyncStorage.setItem('offline_patients', JSON.stringify(offlinePatients));
        }
      }
    }
    
    // Add to pending updates
    const pendingUpdatesJson = await AsyncStorage.getItem('pending_patient_updates');
    const pendingUpdates = pendingUpdatesJson ? JSON.parse(pendingUpdatesJson) : [];
    
    // Add or update pending update
    const existingIndex = pendingUpdates.findIndex(update => update.id === patientId);
    if (existingIndex !== -1) {
      pendingUpdates[existingIndex] = {
        id: patientId,
        data: { ...pendingUpdates[existingIndex].data, ...patientData },
        timestamp: new Date().toISOString(),
      };
    } else {
      pendingUpdates.push({
        id: patientId,
        data: patientData,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Save pending updates
    await AsyncStorage.setItem('pending_patient_updates', JSON.stringify(pendingUpdates));
    
    // Update the main patients cache
    const updatedPatient = { ...patientData, id: patientId };
    await updatePatientCache(updatedPatient);
    
    return updatedPatient;
  } catch (error) {
    console.error(`Error updating patient ${patientId} offline:`, error);
    throw new Error('Failed to update patient offline');
  }
};

/**
 * Update the patient cache
 * @param {Object} patient - The patient to update in cache
 * @returns {Promise} - Void
 */
const updatePatientCache = async (patient) => {
  try {
    // Get current cache
    const patientsJson = await AsyncStorage.getItem('patients');
    const patients = patientsJson ? JSON.parse(patientsJson) : [];
    
    // Find if patient already exists
    const index = patients.findIndex(p => p.id === patient.id);
    
    if (index !== -1) {
      // Update existing patient
      patients[index] = { ...patients[index], ...patient };
    } else {
      // Add new patient
      patients.push(patient);
    }
    
    // Save updated cache
    await AsyncStorage.setItem('patients', JSON.stringify(patients));
  } catch (error) {
    console.error('Error updating patient cache:', error);
  }
};

/**
 * Sync offline patients with the server
 * @returns {Promise} - Result of the sync operation
 */
export const syncOfflinePatients = async () => {
  try {
    // Check if we're online
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      throw new Error('Cannot sync while offline');
    }

    // Get offline patients
    const offlinePatientsJson = await AsyncStorage.getItem('offline_patients');
    const pendingUpdatesJson = await AsyncStorage.getItem('pending_patient_updates');
    
    if (!offlinePatientsJson && !pendingUpdatesJson) {
      return { created: 0, updated: 0, failed: 0 };
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      details: [],
    };

    // Sync new patients
    if (offlinePatientsJson) {
      const offlinePatients = JSON.parse(offlinePatientsJson);
      const unsyncedPatients = offlinePatients.filter(patient => !patient.synced);
      
      for (const patient of unsyncedPatients) {
        try {
          // Remove local metadata
          const { id, synced, ...patientData } = patient;
          
          // Create on server
          const response = await api.post('/patients', patientData);
          
          // Mark as synced
          patient.synced = true;
          patient.server_id = response.data.id;
          
          results.created++;
          results.details.push({
            local_id: id,
            server_id: response.data.id,
            status: 'created',
          });
        } catch (error) {
          console.error(`Error syncing patient ${patient.id}:`, error);
          results.failed++;
          results.details.push({
            local_id: patient.id,
            status: 'failed',
            error: error.message,
          });
        }
      }
      
      // Save updated offline patients
      await AsyncStorage.setItem('offline_patients', JSON.stringify(offlinePatients));
    }

    // Sync patient updates
    if (pendingUpdatesJson) {
      const pendingUpdates = JSON.parse(pendingUpdatesJson);
      const successfulUpdates = [];
      
      for (const update of pendingUpdates) {
        try {
          // Skip updates for local patients that haven't been synced yet
          if (String(update.id).startsWith('local_')) {
            const offlinePatients = offlinePatientsJson ? JSON.parse(offlinePatientsJson) : [];
            const patient = offlinePatients.find(p => p.id === update.id);
            
            if (!patient || !patient.synced) {
              continue;
            }
            
            // Use the server ID instead
            update.id = patient.server_id;
          }
          
          // Update on server
          const response = await api.put(`/patients/${update.id}`, update.data);
          
          results.updated++;
          results.details.push({
            id: update.id,
            status: 'updated',
          });
          
          // Mark as successful
          successfulUpdates.push(update.id);
        } catch (error) {
          console.error(`Error syncing patient update ${update.id}:`, error);
          results.failed++;
          results.details.push({
            id: update.id,
            status: 'failed',
            error: error.message,
          });
        }
      }
      
      // Remove successful updates
      const remainingUpdates = pendingUpdates.filter(update => !successfulUpdates.includes(update.id));
      await AsyncStorage.setItem('pending_patient_updates', JSON.stringify(remainingUpdates));
    }
    
    // Refresh the patients cache
    try {
      const response = await api.get('/patients');
      await AsyncStorage.setItem('patients', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error refreshing patients cache:', error);
    }
    
    return results;
  } catch (error) {
    console.error('Error syncing offline patients:', error);
    throw new Error('Failed to sync offline patients');
  }
};
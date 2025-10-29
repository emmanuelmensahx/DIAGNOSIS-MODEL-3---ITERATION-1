import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { addToOfflineQueue, isOnline } from './syncService';
import { 
  createApiInstance, 
  makeApiRequest, 
  ApiError, 
  ERROR_TYPES,
  getErrorMessage,
  getErrorType,
  checkNetworkConnectivity 
} from '../utils/apiUtils';

// API configuration
import { API_BASE_URL as API_URL } from '../utils/apiConfig';

// Create enhanced API instance
const api = createApiInstance(API_URL, {
  timeout: 10000,
});

/**
 * Make AI prediction for disease diagnosis
 * @param {Object} predictionData - The prediction data
 * @param {Object} options - Additional options for the request
 * @returns {Promise} - The prediction result
 */
const makePrediction = async (predictionData, options = {}) => {
  const {
    onRetry,
    onError,
    maxRetries = 2, // Reduced retries for AI predictions due to longer processing time
    diagnosisId: predictionDiagnosisId
  } = options;

  try {
    // Check if we're online
    if (!(await isOnline())) {
      throw new ApiError(
        'AI prediction requires internet connection',
        ERROR_TYPES.OFFLINE,
        null,
        null,
        true
      );
    }

    // Handle image uploads first if there are any
    let imageIds = [];
    if (predictionData.medical_images && predictionData.medical_images.length > 0) {
      // If URIs provided and diagnosisId available, upload to backend and collect image_ids
      const looksLikeUris = predictionData.medical_images.some(img => typeof img === 'string' && (img.startsWith('file:') || img.startsWith('http')));
      if (looksLikeUris && predictionDiagnosisId) {
        console.log('[Prediction] Uploading images for diagnosis', predictionDiagnosisId);
        imageIds = await uploadImages(predictionData.medical_images, predictionDiagnosisId);
      } else {
        // Assume provided values are already image IDs
        imageIds = predictionData.medical_images;
      }
    }

    // Normalize patient_data: coerce numeric strings, strip invalid/empty values
    const normalizePatientData = (pd) => {
      if (!pd || typeof pd !== 'object') return undefined;

      const toNumber = (value, { allowFloat = false, special } = {}) => {
        if (value === null || value === undefined) return undefined;
        if (typeof value === 'string') {
          let s = value.trim();
          if (s === '') return undefined;
          if (special === 'bp' && s.includes('/')) {
            // Accept formats like "120/80"; take systolic part
            s = s.split('/')[0].trim();
          }
          if (special === 'percent' && s.endsWith('%')) {
            s = s.slice(0, -1).trim();
          }
          // Replace commas used as decimal separators
          s = s.replace(',', '.');
          value = s;
        }
        const num = allowFloat ? parseFloat(value) : parseInt(value, 10);
        if (Number.isNaN(num)) return undefined;
        return num;
      };

      const out = {};
      // Age (int)
      if (pd.age !== undefined) {
        const v = toNumber(pd.age);
        if (v !== undefined) out.age = v;
      }
      // Gender (string)
      if (pd.gender) out.gender = pd.gender;
      // Temperature (float)
      if (pd.temperature !== undefined) {
        const v = toNumber(pd.temperature, { allowFloat: true });
        if (v !== undefined) out.temperature = v;
      }
      // Heart rate (int)
      if (pd.heart_rate !== undefined) {
        const v = toNumber(pd.heart_rate);
        if (v !== undefined) out.heart_rate = v;
      }
      // Respiratory rate (int)
      if (pd.respiratory_rate !== undefined) {
        const v = toNumber(pd.respiratory_rate);
        if (v !== undefined) out.respiratory_rate = v;
      }
      // Systolic BP (int), accept "120/80" by taking first number
      if (pd.systolic_bp !== undefined) {
        const v = toNumber(pd.systolic_bp, { special: 'bp' });
        if (v !== undefined) out.systolic_bp = v;
      }
      // Oxygen saturation (float), accept "98%"
      if (pd.oxygen_saturation !== undefined) {
        const v = toNumber(pd.oxygen_saturation, { allowFloat: true, special: 'percent' });
        if (v !== undefined) out.oxygen_saturation = v;
      }

      return Object.keys(out).length ? out : undefined;
    };

    const normalizedPatientData = normalizePatientData(predictionData.patient_data);

    // Prepare prediction request
    const requestData = {
      symptoms: predictionData.symptoms,
      patient_data: normalizedPatientData,
      medical_images: imageIds
    };

    // Make prediction based on disease type
    let endpoint = '/predict/general';
    let url = endpoint;
    let params = undefined;
    if (predictionData.disease_type) {
      // Map frontend disease types to backend endpoints (core diseases)
      const coreDiseaseTypeMap = {
        'lung_cancer': 'lung-cancer',
        'tuberculosis': 'tuberculosis',
        'malaria': 'malaria',
        'pneumonia': 'pneumonia'
      };
      const dt = predictionData.disease_type;
      const backendDiseaseType = coreDiseaseTypeMap[dt];
      if (backendDiseaseType) {
        url = `/predict/${backendDiseaseType}`;
      } else {
        // Treat as registry code and pass via general endpoint query param
        url = '/predict/general';
        params = { disease_type: dt };
      }
    }

    // Make API request with retry logic
    console.log('[Prediction] Request payload:', {
      endpoint,
      payload: requestData,
    });
    const response = await makeApiRequest({
      method: 'post',
      url,
      params,
      data: requestData,
      baseURL: api.defaults.baseURL,
      timeout: 60000, // 60 seconds for AI processing
    }, {
      maxRetries,
      onRetry: (attempt, delay, error) => {
        console.log(`[Prediction] Retrying... Attempt ${attempt + 1}, delay=${delay}ms`);
        if (onRetry) onRetry(attempt, delay, error);
      },
      onError: (error, attempt) => {
        console.error(`[Prediction] Attempt ${attempt} failed:`, error);
        if (onError) onError(error, attempt);
      },
      skipRetryForTypes: [ERROR_TYPES.VALIDATION, ERROR_TYPES.UNAUTHORIZED],
    });

    return response.data;
  } catch (error) {
    console.error('[Prediction] Error:', error);
    
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
      false
    );
  }
};

/**
 * Submit a new diagnosis to the server
 * @param {Object} diagnosisData - The diagnosis data
 * @param {Object} options - Additional options for the request
 * @returns {Promise} - The diagnosis result
 */
const submitDiagnosis = async (diagnosisData, options = {}) => {
  const {
    onRetry,
    onError,
    maxRetries = 3,
  } = options;

  try {
    // Check if we're online
    if (!(await isOnline())) {
      // Save for later sync
      return await addToOfflineQueue('offlineDiagnoses', diagnosisData);
    }

    // Build diagnosis payload to match backend expectations
    const symptomsArray = Array.isArray(diagnosisData.symptoms)
      ? diagnosisData.symptoms
      : (diagnosisData.symptoms || []);

    // Normalize disease_type to backend enum values (lowercase)
    const diseaseEnumMap = {
      'PNEUMONIA': 'pneumonia',
      'TUBERCULOSIS': 'tuberculosis',
      'MALARIA': 'malaria',
      'LUNG_CANCER': 'lung_cancer',
      'lung-cancer': 'lung_cancer',
    };
    const normalizedDiseaseType = diseaseEnumMap[diagnosisData.disease_type] || diagnosisData.disease_type;
    if (!normalizedDiseaseType) {
      throw new Error('Disease type is required to create a diagnosis');
    }

    // Ensure symptoms are sent as JSON string (backend parses string to dict)
    const symptomsJson = (() => {
      try {
        // If already a JSON string, keep as is
        if (typeof diagnosisData.symptoms === 'string') {
          JSON.parse(diagnosisData.symptoms);
          return diagnosisData.symptoms;
        }
      } catch {}
      return JSON.stringify(symptomsArray);
    })();

    const diagnosisPayload = {
      patient_id: diagnosisData.patient_id,
      disease_type: normalizedDiseaseType,
      symptoms: symptomsJson,
      notes: diagnosisData.notes || ''
    };

    console.log('[Diagnosis] Creating diagnosis with payload:', diagnosisPayload);
    // Create diagnosis to obtain diagnosis ID
    const createResponse = await makeApiRequest({
      method: 'post',
      url: '/diagnoses/',
      data: diagnosisPayload,
      baseURL: api.defaults.baseURL,
    }, {
      maxRetries,
      onRetry: (attempt, delay, error) => {
        console.log(`[Diagnosis] Retrying create... Attempt ${attempt + 1}, delay=${delay}ms`);
        if (onRetry) onRetry(attempt, delay, error);
      },
      onError: (error, attempt) => {
        const readable = error?.toString ? error.toString() : getErrorMessage(error);
        console.error(`[Diagnosis] Create attempt ${attempt} failed:`, readable);
        if (onError) onError(error, attempt);
      },
    });

    const createdDiagnosis = createResponse.data;
    const diagnosisId = createdDiagnosis.id;
    console.log('[Diagnosis] Created ID:', diagnosisId);

    // Upload images tied to this diagnosis, if any
    let uploadedImageIds = [];
    if (diagnosisData.medical_images && diagnosisData.medical_images.length > 0) {
      console.log('[Diagnosis] Uploading images for diagnosis:', diagnosisId);
      uploadedImageIds = await uploadImages(diagnosisData.medical_images, diagnosisId);
      console.log('[Diagnosis] Uploaded image IDs:', uploadedImageIds);
    }

    // Optionally make prediction with uploaded images to show enriched result to UI
    let predictionResult = null;
    try {
      predictionResult = await makePrediction({
        ...diagnosisData,
        medical_images: uploadedImageIds,
      }, { diagnosisId });
    } catch (e) {
      console.warn('[Diagnosis] Prediction failed after create; proceeding with created diagnosis only.', e);
    }

    return predictionResult ? { ...createdDiagnosis, prediction: predictionResult } : createdDiagnosis;
  } catch (error) {
    const readable = error?.toString ? error.toString() : getErrorMessage(error);
    console.error('[Diagnosis] Submit error:', readable);
    
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
      true // Most diagnosis submission errors are retryable
    );
  }
};

/**
 * Upload medical images to the server
 * @param {Array} images - Array of image URIs
 * @returns {Promise} - Array of image IDs from the server
 */
const uploadImages = async (images, diagnosisId) => {
  try {
    const imageIds = [];
    if (!diagnosisId) {
      console.warn('[Images] Missing diagnosisId; cannot upload images to backend.');
      return imageIds;
    }
    
    // Upload each image
    for (const imageUri of images) {
      // Create form data
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      });

      // Upload image to diagnosis-specific endpoint
      console.log('[Images] Uploading image to /diagnoses/' + diagnosisId + '/images/');
      const response = await api.post(`/diagnoses/${diagnosisId}/images/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Add image ID to array
      imageIds.push(response.data.image_id);
    }

    return imageIds;
  } catch (error) {
    console.error('[Images] Upload error:', error);
    throw new Error('Failed to upload images');
  }
};

/**
 * Save diagnosis data for offline use
 * @param {Object} diagnosisData - The diagnosis data
 * @returns {Promise} - The saved diagnosis data with a local ID
 */
const saveDiagnosisOffline = async (diagnosisData) => {
  try {
    // Generate a local ID
    const localId = `local_${Date.now()}`;
    
    // Add metadata
    const offlineDiagnosis = {
      ...diagnosisData,
      id: localId,
      created_at: new Date().toISOString(),
      status: 'pending',
      synced: false,
    };

    // Get existing offline diagnoses
    const offlineDiagnosesJson = await AsyncStorage.getItem('offline_diagnoses');
    const offlineDiagnoses = offlineDiagnosesJson ? JSON.parse(offlineDiagnosesJson) : [];
    
    // Add new diagnosis
    offlineDiagnoses.push(offlineDiagnosis);
    
    // Save updated list
    await AsyncStorage.setItem('offline_diagnoses', JSON.stringify(offlineDiagnoses));
    
    return offlineDiagnosis;
  } catch (error) {
    console.error('Error saving diagnosis offline:', error);
    throw new Error('Failed to save diagnosis offline');
  }
};

/**
 * Sync offline diagnoses with the server
 * @returns {Promise} - Result of the sync operation
 */
const syncOfflineDiagnoses = async () => {
  try {
    // Check if we're online
    if (!(await isOnline())) {
      throw new Error('Cannot sync while offline');
    }

    // Get offline diagnoses
    const offlineDiagnosesJson = await AsyncStorage.getItem('offline_diagnoses');
    if (!offlineDiagnosesJson) {
      return { synced: 0, failed: 0 };
    }

    const offlineDiagnoses = JSON.parse(offlineDiagnosesJson);
    const unsyncedDiagnoses = offlineDiagnoses.filter(diagnosis => !diagnosis.synced);
    
    if (unsyncedDiagnoses.length === 0) {
      return { synced: 0, failed: 0 };
    }

    // Track results
    const results = {
      synced: 0,
      failed: 0,
      details: [],
    };

    // Sync each diagnosis
    for (const diagnosis of unsyncedDiagnoses) {
      try {
        // Remove local metadata and prepare payload
        const { id, synced, ...diagnosisData } = diagnosis;
        const symptomsArray = Array.isArray(diagnosisData.symptoms) ? diagnosisData.symptoms : (diagnosisData.symptoms || []);
        const payload = {
          patient_id: diagnosisData.patient_id,
          disease_type: diagnosisData.disease_type,
          symptoms: JSON.stringify(symptomsArray),
          notes: diagnosisData.notes || ''
        };

        console.log('[Offline Sync] Creating diagnosis for local', id);
        // Submit to server first to create diagnosis
        const response = await api.post('/diagnoses/', payload);
        const serverDiagnosisId = response.data.id;

        // Handle image uploads if there are local URIs
        if (diagnosis.medical_images && diagnosis.medical_images.length > 0) {
          const localImages = diagnosis.medical_images.filter(img => typeof img === 'string' && img.startsWith('file:'));
          if (localImages.length > 0) {
            const imageIds = await uploadImages(localImages, serverDiagnosisId);
            // Replace local URIs with server IDs
            diagnosis.medical_images = diagnosis.medical_images
              .filter(img => !(typeof img === 'string' && img.startsWith('file:')))
              .concat(imageIds);
            console.log('[Offline Sync] Uploaded image IDs:', imageIds);
          }
        }
        
        // Mark as synced
        diagnosis.synced = true;
        diagnosis.server_id = serverDiagnosisId;
        
        results.synced++;
        results.details.push({
          local_id: id,
          server_id: serverDiagnosisId,
          status: 'success',
        });
      } catch (error) {
        console.error(`[Offline Sync] Error syncing diagnosis ${diagnosis.id}:`, error);
        results.failed++;
        results.details.push({
          local_id: diagnosis.id,
          status: 'failed',
          error: error.message,
        });
      }
    }

    // Update offline storage
    await AsyncStorage.setItem('offline_diagnoses', JSON.stringify(offlineDiagnoses));
    
    return results;
  } catch (error) {
    console.error('Error syncing offline diagnoses:', error);
    throw new Error('Failed to sync offline diagnoses');
  }
};

/**
 * Get all diagnoses for a patient
 * @param {number} patientId - The patient ID
 * @returns {Promise} - Array of diagnoses
 */
const getPatientDiagnoses = async (patientId, { page = 1, size = 50 } = {}) => {
  try {
    // Check if we're online
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      // If offline, get from local storage
      return await getOfflineDiagnoses(patientId);
    }

    // Get from server (backend returns a paginated object with `items`)
    const response = await api.get(`/patients/${patientId}/diagnoses`, {
      params: { page, size },
    });

    const payload = response?.data;
    const rawItems = Array.isArray(payload) ? payload : (payload?.items || []);

    // Normalize fields expected by UI
    const items = rawItems.map((d) => {
      let symptoms = d?.symptoms;
      if (typeof symptoms === 'string') {
        try {
          const parsed = JSON.parse(symptoms);
          symptoms = Array.isArray(parsed) ? parsed : [];
        } catch {
          // Fallback: treat string as single symptom entry
          symptoms = symptoms ? [symptoms] : [];
        }
      } else if (!Array.isArray(symptoms)) {
        symptoms = [];
      }

      return {
        ...d,
        symptoms,
      };
    });

    return items;
  } catch (error) {
    console.error('Error getting patient diagnoses:', error);
    throw new Error('Failed to get patient diagnoses');
  }
};

/**
 * Get offline diagnoses for a patient
 * @param {string} patientId - Patient ID
 * @returns {Promise} - Array of offline diagnoses
 */
const getOfflineDiagnoses = async (patientId) => {
  try {
    const offlineDiagnoses = await AsyncStorage.getItem(`offline_diagnoses_${patientId}`);
    return offlineDiagnoses ? JSON.parse(offlineDiagnoses) : [];
  } catch (error) {
    console.error('Error getting offline diagnoses:', error);
    throw new Error('Failed to get offline diagnoses');
  }
};

// Enhanced diagnosis with LLM integration
const makeEnhancedDiagnosis = async (diagnosisData, images = []) => {
  try {
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    if (!isConnected) {
      throw new Error('Internet connection required for LLM-enhanced diagnosis');
    }

    // Prepare payload to match backend `DiagnosisCreate` schema
    const symptomsArray = Array.isArray(diagnosisData.symptoms)
      ? diagnosisData.symptoms
      : (diagnosisData.symptoms || []);

    // Normalize disease_type to backend enum values (lowercase)
    const diseaseEnumMap = {
      'PNEUMONIA': 'pneumonia',
      'TUBERCULOSIS': 'tuberculosis',
      'MALARIA': 'malaria',
      'LUNG_CANCER': 'lung_cancer',
      'lung-cancer': 'lung_cancer',
    };
    const normalizedDiseaseType = diseaseEnumMap[diagnosisData.disease_type] || diagnosisData.disease_type;
    if (!normalizedDiseaseType) {
      throw new Error('Disease type is required for enhanced diagnosis');
    }

    const enhancedPayload = {
      patient_id: diagnosisData.patient_id,
      disease_type: normalizedDiseaseType,
      symptoms: JSON.stringify(symptomsArray),
      notes: diagnosisData.notes || ''
    };

    // Pass medical_history via query string, as expected by backend
    const medicalHistory = encodeURIComponent(diagnosisData.medical_history || '');
    const endpoint = `/predict/grok-primary?medical_history=${medicalHistory}`;

    console.log('Making enhanced diagnosis request:', {
      endpoint,
      payload: enhancedPayload,
    });

    const response = await api.post(endpoint, enhancedPayload);
    console.log('Enhanced diagnosis response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Enhanced diagnosis error:', error);
    // Fallback to regular prediction if LLM fails (network or server-side)
    if (error.message && error.message.includes('Internet connection')) {
      throw error;
    }
    console.log('Falling back to regular prediction...');
    return await makePrediction(diagnosisData);
  }
};

/**
 * Get all pending diagnoses for specialist review
 * @param {Object} filters - Optional filters (status, patient_id, etc.)
 * @returns {Promise} - Array of pending diagnoses
 */
const getPendingReviews = async (filters = {}) => {
  try {
    // Check if we're online
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      throw new Error('Internet connection required for specialist reviews');
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.patient_id) params.append('patient_id', filters.patient_id);
    if (filters.skip) params.append('skip', filters.skip);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/diagnoses?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error getting pending reviews:', error);
    throw new Error(error.response?.data?.detail || 'Failed to get pending reviews');
  }
};

/**
 * Get a specific diagnosis by ID for review
 * @param {number} diagnosisId - The diagnosis ID
 * @returns {Promise} - The diagnosis data
 */
const getDiagnosisForReview = async (diagnosisId) => {
  try {
    // Check if we're online
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      throw new Error('Internet connection required for diagnosis review');
    }

    const response = await api.get(`/diagnoses/${diagnosisId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting diagnosis for review:', error);
    throw new Error(error.response?.data?.detail || 'Failed to get diagnosis');
  }
};

/**
 * Submit specialist review for a diagnosis
 * @param {number} diagnosisId - The diagnosis ID
 * @param {Object} reviewData - The review data
 * @returns {Promise} - The updated diagnosis
 */
const submitSpecialistReview = async (diagnosisId, reviewData) => {
  try {
    // Check if we're online
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      // Save for later sync if offline
      const offlineReview = {
        diagnosisId,
        reviewData,
        timestamp: new Date().toISOString(),
        type: 'specialist_review'
      };
      return await addToOfflineQueue('offlineReviews', offlineReview);
    }

    const response = await api.put(`/diagnoses/${diagnosisId}/review`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error submitting specialist review:', error);
    throw new Error(error.response?.data?.detail || 'Failed to submit review');
  }
};

/**
 * Get diagnosis statistics for specialist dashboard
 * @returns {Promise} - Statistics data
 */
const getDiagnosisStatistics = async () => {
  try {
    // Check if we're online
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      throw new Error('Internet connection required for statistics');
    }

    const response = await api.get('/diagnoses/statistics');
    return response.data;
  } catch (error) {
    console.error('Error getting diagnosis statistics:', error);
    throw new Error(error.response?.data?.detail || 'Failed to get statistics');
  }
};

/**
 * Sync offline specialist reviews
 * @returns {Promise} - Sync results
 */
const syncOfflineReviews = async () => {
  try {
    // Check if we're online
    if (!(await isOnline())) {
      throw new Error('Cannot sync while offline');
    }

    // Get offline reviews
    const offlineReviewsJson = await AsyncStorage.getItem('offlineReviews');
    if (!offlineReviewsJson) {
      return { synced: 0, failed: 0 };
    }

    const offlineReviews = JSON.parse(offlineReviewsJson);
    const unsyncedReviews = offlineReviews.filter(review => !review.synced);
    
    if (unsyncedReviews.length === 0) {
      return { synced: 0, failed: 0 };
    }

    // Track results
    const results = {
      synced: 0,
      failed: 0,
      details: [],
    };

    // Sync each review
    for (const review of unsyncedReviews) {
      try {
        const response = await api.put(`/diagnoses/${review.diagnosisId}/review`, review.reviewData);
        
        // Mark as synced
        review.synced = true;
        review.server_response = response.data;
        
        results.synced++;
        results.details.push({
          diagnosis_id: review.diagnosisId,
          status: 'success',
        });
      } catch (error) {
        console.error(`Error syncing review for diagnosis ${review.diagnosisId}:`, error);
        results.failed++;
        results.details.push({
          diagnosis_id: review.diagnosisId,
          status: 'failed',
          error: error.message,
        });
      }
    }

    // Update offline storage
    await AsyncStorage.setItem('offlineReviews', JSON.stringify(offlineReviews));
    
    return results;
  } catch (error) {
    console.error('Error syncing offline reviews:', error);
    throw new Error('Failed to sync offline reviews');
  }
};

/**
 * Submit emergency diagnosis with free-text medical history
 * @param {Object} emergencyData - The emergency diagnosis data
 * @returns {Promise} - The diagnosis result
 */
const submitEmergencyDiagnosis = async (emergencyData) => {
  try {
    // Check if we're online
    if (!(await isOnline())) {
      throw new ApiError(
        'Emergency diagnosis requires internet connection',
        ERROR_TYPES.OFFLINE,
        null,
        null,
        true
      );
    }

    console.log('[Emergency Diagnosis] Submitting emergency diagnosis:', {
      patient_name: emergencyData.patient_name,
      disease_type: emergencyData.disease_type,
      history_length: emergencyData.medical_history?.length || 0,
      has_patient_id: !!emergencyData.patient_id,
    });

    // Prepare the request data
    const requestData = {
      medical_history: emergencyData.medical_history,
      patient_name: emergencyData.patient_name,
      disease_type: emergencyData.disease_type || null,
      additional_notes: emergencyData.additional_notes || '',
      // Include patient_id if available for linking to existing patient
      ...(emergencyData.patient_id && { patient_id: emergencyData.patient_id })
    };

    // Make the API request
    const response = await makeApiRequest(
      () => api.post('/emergency-diagnosis', requestData),
      {
        maxRetries: 2,
        timeout: 30000, // 30 seconds for emergency diagnosis
        onRetry: (attempt, error) => {
          console.log(`[Emergency Diagnosis] Retry attempt ${attempt}:`, error.message);
        },
        onError: (error) => {
          console.error('[Emergency Diagnosis] Request failed:', error);
        }
      }
    );

    console.log('[Emergency Diagnosis] Success:', {
      diagnosis_id: response.data.id,
      primary_diagnosis: response.data.ai_diagnosis ? JSON.parse(response.data.ai_diagnosis).primary_diagnosis : 'N/A',
      confidence: response.data.ai_confidence,
    });

    return response.data;
  } catch (error) {
    console.error('[Emergency Diagnosis] Error:', error);
    
    // Handle specific error types
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new ApiError(
        'Network error during emergency diagnosis. Please check your connection.',
        ERROR_TYPES.NETWORK,
        null,
        error,
        true
      );
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      throw new ApiError(
        'Server error during emergency diagnosis. Please try again.',
        ERROR_TYPES.SERVER,
        error.response.status,
        error,
        true
      );
    }
    
    // Handle client errors
    if (error.response?.status >= 400) {
      const message = error.response.data?.detail || 
                     error.response.data?.message || 
                     'Invalid emergency diagnosis data';
      throw new ApiError(
        message,
        ERROR_TYPES.VALIDATION,
        error.response.status,
        error,
        false
      );
    }
    
    // Generic error
    throw new ApiError(
      'Failed to submit emergency diagnosis',
      ERROR_TYPES.UNKNOWN,
      null,
      error,
      true
    );
  }
};

export {
  makePrediction,
  submitDiagnosis,
  uploadImages,
  saveDiagnosisOffline,
  syncOfflineDiagnoses,
  getPatientDiagnoses,
  getOfflineDiagnoses,
  makeEnhancedDiagnosis,
  getPendingReviews,
  getDiagnosisForReview,
  submitSpecialistReview,
  getDiagnosisStatistics,
  syncOfflineReviews,
  submitEmergencyDiagnosis,
};
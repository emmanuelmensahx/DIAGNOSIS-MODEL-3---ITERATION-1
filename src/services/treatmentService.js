import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { addToOfflineQueue, isOnline } from './syncService';
import { API_BASE_URL as API_URL } from '../utils/apiConfig';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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

// Create treatment plan
export const createTreatment = async (treatmentData) => {
  try {
    const online = await isOnline();
    
    if (!online) {
      // Save offline and add to sync queue
      await saveTreatmentOffline(treatmentData);
      await addToOfflineQueue('treatments', treatmentData);
      return { 
        success: true, 
        offline: true, 
        message: 'Treatment plan saved offline. Will sync when online.' 
      };
    }

    const response = await api.post('/treatments/', treatmentData);
    return { 
      success: true, 
      data: response.data, 
      message: 'Treatment plan created successfully.' 
    };
  } catch (error) {
    console.error('Error creating treatment:', error);
    
    // If online request fails, save offline as fallback
    try {
      await saveTreatmentOffline(treatmentData);
      await addToOfflineQueue('treatments', treatmentData);
      return { 
        success: true, 
        offline: true, 
        message: 'Treatment plan saved offline due to connection error.' 
      };
    } catch (offlineError) {
      console.error('Error saving treatment offline:', offlineError);
      throw new Error('Failed to save treatment plan');
    }
  }
};

// Get treatment by ID
export const getTreatmentById = async (treatmentId) => {
  try {
    const response = await api.get(`/treatments/${treatmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching treatment:', error);
    throw error;
  }
};

// Update treatment
export const updateTreatment = async (treatmentId, updateData) => {
  try {
    const online = await isOnline();
    
    if (!online) {
      // Save offline update
      await saveTreatmentUpdateOffline(treatmentId, updateData);
      await addToOfflineQueue('treatment_updates', { treatmentId, ...updateData });
      return { 
        success: true, 
        offline: true, 
        message: 'Treatment update saved offline. Will sync when online.' 
      };
    }

    const response = await api.put(`/treatments/${treatmentId}`, updateData);
    return { 
      success: true, 
      data: response.data, 
      message: 'Treatment updated successfully.' 
    };
  } catch (error) {
    console.error('Error updating treatment:', error);
    
    // If online request fails, save offline as fallback
    try {
      await saveTreatmentUpdateOffline(treatmentId, updateData);
      await addToOfflineQueue('treatment_updates', { treatmentId, ...updateData });
      return { 
        success: true, 
        offline: true, 
        message: 'Treatment update saved offline due to connection error.' 
      };
    } catch (offlineError) {
      console.error('Error saving treatment update offline:', offlineError);
      throw new Error('Failed to save treatment update');
    }
  }
};

// Get treatments for a diagnosis
export const getTreatmentsByDiagnosis = async (diagnosisId) => {
  try {
    const response = await api.get(`/diagnoses/${diagnosisId}/treatments/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching treatments for diagnosis:', error);
    throw error;
  }
};

// Create follow-up
export const createFollowUp = async (followUpData) => {
  try {
    const online = await isOnline();
    
    if (!online) {
      await saveFollowUpOffline(followUpData);
      await addToOfflineQueue('follow_ups', followUpData);
      return { 
        success: true, 
        offline: true, 
        message: 'Follow-up saved offline. Will sync when online.' 
      };
    }

    const response = await api.post('/follow-ups/', followUpData);
    return { 
      success: true, 
      data: response.data, 
      message: 'Follow-up created successfully.' 
    };
  } catch (error) {
    console.error('Error creating follow-up:', error);
    
    try {
      await saveFollowUpOffline(followUpData);
      await addToOfflineQueue('follow_ups', followUpData);
      return { 
        success: true, 
        offline: true, 
        message: 'Follow-up saved offline due to connection error.' 
      };
    } catch (offlineError) {
      console.error('Error saving follow-up offline:', offlineError);
      throw new Error('Failed to save follow-up');
    }
  }
};

// Get follow-ups for a treatment
export const getFollowUpsByTreatment = async (treatmentId) => {
  try {
    const response = await api.get(`/treatments/${treatmentId}/follow-ups/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    throw error;
  }
};

// Offline storage functions
export const saveTreatmentOffline = async (treatmentData) => {
  try {
    const offlineTreatments = await getOfflineTreatments();
    const newTreatment = {
      ...treatmentData,
      id: `offline_${Date.now()}`,
      offline: true,
      created_at: new Date().toISOString(),
    };
    
    offlineTreatments.push(newTreatment);
    await AsyncStorage.setItem('offline_treatments', JSON.stringify(offlineTreatments));
    return newTreatment;
  } catch (error) {
    console.error('Error saving treatment offline:', error);
    throw error;
  }
};

export const saveTreatmentUpdateOffline = async (treatmentId, updateData) => {
  try {
    const offlineUpdates = await getOfflineTreatmentUpdates();
    const update = {
      treatmentId,
      ...updateData,
      id: `offline_update_${Date.now()}`,
      updated_at: new Date().toISOString(),
    };
    
    offlineUpdates.push(update);
    await AsyncStorage.setItem('offline_treatment_updates', JSON.stringify(offlineUpdates));
    return update;
  } catch (error) {
    console.error('Error saving treatment update offline:', error);
    throw error;
  }
};

export const saveFollowUpOffline = async (followUpData) => {
  try {
    const offlineFollowUps = await getOfflineFollowUps();
    const newFollowUp = {
      ...followUpData,
      id: `offline_${Date.now()}`,
      offline: true,
      created_at: new Date().toISOString(),
    };
    
    offlineFollowUps.push(newFollowUp);
    await AsyncStorage.setItem('offline_follow_ups', JSON.stringify(offlineFollowUps));
    return newFollowUp;
  } catch (error) {
    console.error('Error saving follow-up offline:', error);
    throw error;
  }
};

export const getOfflineTreatments = async () => {
  try {
    const data = await AsyncStorage.getItem('offline_treatments');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline treatments:', error);
    return [];
  }
};

export const getOfflineTreatmentUpdates = async () => {
  try {
    const data = await AsyncStorage.getItem('offline_treatment_updates');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline treatment updates:', error);
    return [];
  }
};

export const getOfflineFollowUps = async () => {
  try {
    const data = await AsyncStorage.getItem('offline_follow_ups');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline follow-ups:', error);
    return [];
  }
};

// Sync functions
export const syncOfflineTreatments = async () => {
  try {
    const offlineTreatments = await getOfflineTreatments();
    const syncedTreatments = [];
    const failedTreatments = [];

    for (const treatment of offlineTreatments) {
      try {
        // Remove offline-specific fields before syncing
        const { id, offline, ...treatmentData } = treatment;
        const response = await api.post('/treatments/', treatmentData);
        syncedTreatments.push(response.data);
      } catch (error) {
        console.error('Error syncing treatment:', error);
        failedTreatments.push(treatment);
      }
    }

    // Keep only failed treatments in offline storage
    await AsyncStorage.setItem('offline_treatments', JSON.stringify(failedTreatments));
    
    return {
      synced: syncedTreatments.length,
      failed: failedTreatments.length,
      syncedData: syncedTreatments,
    };
  } catch (error) {
    console.error('Error syncing offline treatments:', error);
    throw error;
  }
};

export const syncOfflineTreatmentUpdates = async () => {
  try {
    const offlineUpdates = await getOfflineTreatmentUpdates();
    const syncedUpdates = [];
    const failedUpdates = [];

    for (const update of offlineUpdates) {
      try {
        const { treatmentId, id, updated_at, ...updateData } = update;
        const response = await api.put(`/treatments/${treatmentId}`, updateData);
        syncedUpdates.push(response.data);
      } catch (error) {
        console.error('Error syncing treatment update:', error);
        failedUpdates.push(update);
      }
    }

    // Keep only failed updates in offline storage
    await AsyncStorage.setItem('offline_treatment_updates', JSON.stringify(failedUpdates));
    
    return {
      synced: syncedUpdates.length,
      failed: failedUpdates.length,
      syncedData: syncedUpdates,
    };
  } catch (error) {
    console.error('Error syncing offline treatment updates:', error);
    throw error;
  }
};

export const syncOfflineFollowUps = async () => {
  try {
    const offlineFollowUps = await getOfflineFollowUps();
    const syncedFollowUps = [];
    const failedFollowUps = [];

    for (const followUp of offlineFollowUps) {
      try {
        // Remove offline-specific fields before syncing
        const { id, offline, ...followUpData } = followUp;
        const response = await api.post('/follow-ups/', followUpData);
        syncedFollowUps.push(response.data);
      } catch (error) {
        console.error('Error syncing follow-up:', error);
        failedFollowUps.push(followUp);
      }
    }

    // Keep only failed follow-ups in offline storage
    await AsyncStorage.setItem('offline_follow_ups', JSON.stringify(failedFollowUps));
    
    return {
      synced: syncedFollowUps.length,
      failed: failedFollowUps.length,
      syncedData: syncedFollowUps,
    };
  } catch (error) {
    console.error('Error syncing offline follow-ups:', error);
    throw error;
  }
};

export const clearOfflineTreatmentData = async () => {
  try {
    await AsyncStorage.multiRemove([
      'offline_treatments',
      'offline_treatment_updates',
      'offline_follow_ups'
    ]);
  } catch (error) {
    console.error('Error clearing offline treatment data:', error);
    throw error;
  }
};
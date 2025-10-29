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

/**
 * Get current user profile
 * @returns {Promise} - The user profile data
 */
export const getCurrentUser = async () => {
  try {
    // Check if we're online
    if (!(await isOnline())) {
      // If offline, return cached user data
      const cachedUser = await AsyncStorage.getItem('userData');
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
      throw new Error('No cached user data available offline');
    }

    // Fetch from server
    const response = await api.get('/users/me');
    
    // Update local cache
    await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    
    // Try to return cached data if server request fails
    try {
      const cachedUser = await AsyncStorage.getItem('userData');
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
    } catch (cacheError) {
      console.error('Error reading cached user data:', cacheError);
    }
    
    throw new Error('Failed to fetch user profile');
  }
};

/**
 * Update user profile
 * @param {Object} userData - The user data to update
 * @returns {Promise} - The updated user profile
 */
export const updateUserProfile = async (userData) => {
  try {
    // Get current user ID from cached data
    const cachedUser = await AsyncStorage.getItem('userData');
    if (!cachedUser) {
      throw new Error('No user data found');
    }
    
    const currentUser = JSON.parse(cachedUser);
    const userId = currentUser.id;

    // Check if we're online
    if (!(await isOnline())) {
      // If offline, save for later sync
      const offlineUpdate = {
        id: userId,
        data: userData,
        timestamp: new Date().toISOString(),
      };
      
      await addToOfflineQueue('userUpdates', offlineUpdate);
      
      // Update local cache optimistically
      const updatedUser = { ...currentUser, ...userData };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      
      return updatedUser;
    }

    // Update on server
    const response = await api.put(`/users/${userId}`, userData);
    
    // Update local cache
    await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
};

/**
 * Get user by ID (for admin/specialist use)
 * @param {string} userId - The user ID
 * @returns {Promise} - The user profile data
 */
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw new Error('Failed to fetch user profile');
  }
};

/**
 * Get all users (admin only)
 * @returns {Promise} - Array of user profiles
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw new Error('Failed to fetch users');
  }
};

/**
 * Create new user (admin only)
 * @param {Object} userData - The user data
 * @returns {Promise} - The created user profile
 */
export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
};

/**
 * Delete user (admin only)
 * @param {string} userId - The user ID
 * @returns {Promise} - Success message
 */
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

/**
 * Sync offline user updates
 * @returns {Promise} - Sync results
 */
export const syncUserUpdates = async () => {
  try {
    const offlineUpdatesJson = await AsyncStorage.getItem('offline_userUpdates');
    if (!offlineUpdatesJson) {
      return { synced: 0, failed: 0, details: [] };
    }

    const offlineUpdates = JSON.parse(offlineUpdatesJson);
    const results = { synced: 0, failed: 0, details: [] };
    const successfulUpdates = [];

    for (const update of offlineUpdates) {
      try {
        // Update on server
        const response = await api.put(`/users/${update.id}`, update.data);
        
        // Update local cache
        await AsyncStorage.setItem('userData', JSON.stringify(response.data));
        
        results.synced++;
        results.details.push({
          id: update.id,
          status: 'synced',
        });
        
        successfulUpdates.push(update.id);
      } catch (error) {
        console.error(`Error syncing user update ${update.id}:`, error);
        results.failed++;
        results.details.push({
          id: update.id,
          status: 'failed',
          error: error.message,
        });
      }
    }

    // Remove successfully synced updates
    const remainingUpdates = offlineUpdates.filter(
      update => !successfulUpdates.includes(update.id)
    );
    
    if (remainingUpdates.length === 0) {
      await AsyncStorage.removeItem('offline_userUpdates');
    } else {
      await AsyncStorage.setItem('offline_userUpdates', JSON.stringify(remainingUpdates));
    }

    return results;
  } catch (error) {
    console.error('Error syncing user updates:', error);
    throw new Error('Failed to sync user updates');
  }
};
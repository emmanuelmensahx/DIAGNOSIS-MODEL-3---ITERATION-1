import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as API_URL } from '../utils/apiConfig';
import { createApiInstance } from '../utils/apiUtils';

// Unified Axios instance with interceptors
const api = createApiInstance(API_URL, {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} - User data and token
 */
export const login = async (email, password) => {
  try {
    // Backend expects application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    // Debug: log outgoing request details
    try {
      console.log('Attempting login:', {
        request_url: `${API_URL}/auth/login`,
        email,
        hasPassword: Boolean(password),
      });
    } catch {}

    const response = await api.post('/auth/login', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Store token - backend returns {access_token, token_type} directly
    const { access_token, token_type } = response.data;
    try {
      console.log('Login succeeded:', { token_type, access_token_preview: access_token?.slice(0, 12) + '...' });
    } catch {}
    await AsyncStorage.setItem('userToken', access_token);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('userToken', access_token);
    }
    
    // Get user data using the token
    const userResponse = await api.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    await AsyncStorage.setItem('userData', JSON.stringify(userResponse.data));
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('userData', JSON.stringify(userResponse.data));
    }
    
    return {
      token: access_token,
      user: userResponse.data,
    };
  } catch (error) {
    // Enhanced error diagnostics
    try {
      console.error('Login error diagnostics:', {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        data: error?.response?.data,
        api_url: API_URL,
        request_url: `${API_URL}/auth/login`,
      });
    } catch {}

    let friendlyMessage = 'Login failed';
    if (error?.response) {
      const status = error.response.status;
      const detail = error.response?.data?.detail || error.response?.data?.message;
      if (detail) {
        friendlyMessage = detail;
      } else if (status === 401) {
        friendlyMessage = 'Invalid email or password.';
      } else if (status === 400) {
        friendlyMessage = 'Invalid request. Please check your input.';
      } else if (status >= 500) {
        friendlyMessage = 'Server error. Please try again later.';
      } else {
        friendlyMessage = `Login failed with status ${status}`;
      }
    } else {
      friendlyMessage = `Unable to reach API at ${API_URL}. Please ensure the backend is running and accessible.`;
    }

    throw new Error(friendlyMessage);
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise} - User data and token
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    
    // Store token and user data
    await AsyncStorage.setItem('userToken', response.data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error(error.response?.data?.detail || 'Registration failed');
  }
};

/**
 * Logout the current user
 * @returns {Promise} - Void
 */
export const logout = async () => {
  try {
    // Get token
    const token = await AsyncStorage.getItem('userToken');
    
    if (token) {
      // Call logout endpoint
      try {
        await api.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.warn('Error calling logout endpoint:', error);
        // Continue with local logout even if server logout fails
      }
    }
    
    // Clear local storage
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Logout failed');
  }
};

/**
 * Check if user is logged in
 * @returns {Promise<boolean>} - True if logged in
 */
export const isLoggedIn = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    return !!token;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

/**
 * Get current user data
 * @returns {Promise} - User data
 */
export const getCurrentUser = async () => {
  try {
    const userDataJson = await AsyncStorage.getItem('userData');
    if (!userDataJson) {
      return null;
    }
    return JSON.parse(userDataJson);
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Update user profile
 * @param {Object} userData - Updated user data
 * @returns {Promise} - Updated user data
 */
export const updateProfile = async (userData) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await api.put('/users/profile', userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Update stored user data
    await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error(error.response?.data?.detail || 'Failed to update profile');
  }
};

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise} - Success message
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw new Error(error.response?.data?.detail || 'Failed to change password');
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise} - Success message
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post('/auth/reset-password-request', { email });
    return response.data;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw new Error(error.response?.data?.detail || 'Failed to request password reset');
  }
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise} - Success message
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw new Error(error.response?.data?.detail || 'Failed to reset password');
  }
};
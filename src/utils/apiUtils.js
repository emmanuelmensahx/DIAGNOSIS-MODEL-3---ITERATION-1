import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { API_BASE_URL as API_URL } from './apiConfig';

// Error types for classification
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
  OFFLINE: 'OFFLINE',
};

// Custom error class for API errors
export class ApiError extends Error {
  constructor(message, type, statusCode, originalError, retryable = false) {
    const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
    super(msgStr);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.retryable = retryable;
    this.timestamp = new Date().toISOString();
  }

  toString() {
    const status = this.statusCode ? ` status=${this.statusCode}` : '';
    const retry = ` retryable=${this.retryable}`;
    return `[ApiError] type=${this.type}${status}${retry} message="${this.message}"`;
  }
}

// Helper to format FastAPI/Pydantic validation details into a readable string
const formatValidationDetail = (detail) => {
  try {
    if (!detail) return 'Validation error. Please check your input.';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      // FastAPI returns list of {loc, msg, type}
      const parts = detail.map((d) => {
        const field = Array.isArray(d.loc) ? d.loc.join('.') : d.loc;
        return field ? `${field}: ${d.msg}` : d.msg;
      });
      return parts.join('; ');
    }
    if (typeof detail === 'object') {
      // Sometimes it's a dict; stringify it
      return JSON.stringify(detail);
    }
    return String(detail);
  } catch {
    return 'Validation error. Please check your input.';
  }
};

// Error classification function
export const classifyError = (error) => {
  // Network connectivity issues
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        type: ERROR_TYPES.TIMEOUT,
        message: 'Request timed out. Please check your connection and try again.',
        retryable: true,
      };
    }
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      return {
        type: ERROR_TYPES.NETWORK,
        message: 'Network error. Please check your internet connection.',
        retryable: true,
      };
    }
    return {
      type: ERROR_TYPES.NETWORK,
      message: 'Unable to connect to server. Please check your internet connection.',
      retryable: true,
    };
  }

  const { status, data } = error.response;

  // HTTP status code based classification
  switch (status) {
    case 400:
      return {
        type: ERROR_TYPES.VALIDATION,
        message: data?.detail ? formatValidationDetail(data.detail) : (data?.message || 'Invalid request. Please check your input.'),
        retryable: false,
      };
    case 401:
      return {
        type: ERROR_TYPES.UNAUTHORIZED,
        message: 'Session expired. Please log in again.',
        retryable: false,
      };
    case 403:
      return {
        type: ERROR_TYPES.FORBIDDEN,
        message: 'You do not have permission to perform this action.',
        retryable: false,
      };
    case 404:
      return {
        type: ERROR_TYPES.NOT_FOUND,
        message: 'The requested resource was not found.',
        retryable: false,
      };
    case 408:
      return {
        type: ERROR_TYPES.TIMEOUT,
        message: 'Request timed out. Please try again.',
        retryable: true,
      };
    case 422:
      return {
        type: ERROR_TYPES.VALIDATION,
        message: data?.detail ? formatValidationDetail(data.detail) : 'Validation error. Please check your input.',
        retryable: false,
      };
    case 429:
      return {
        type: ERROR_TYPES.SERVER,
        message: 'Too many requests. Please wait a moment and try again.',
        retryable: true,
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: ERROR_TYPES.SERVER,
        message: 'Server error. Please try again later.',
        retryable: true,
      };
    default:
      return {
        type: ERROR_TYPES.UNKNOWN,
        message: data?.detail ? formatValidationDetail(data.detail) : (data?.message || 'An unexpected error occurred.'),
        retryable: status >= 500,
      };
  }
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
};

// Calculate retry delay with exponential backoff
const calculateRetryDelay = (attempt) => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

// Sleep function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced API request function with retry logic
export const makeApiRequest = async (requestConfig, options = {}) => {
  const {
    maxRetries = RETRY_CONFIG.maxRetries,
    onRetry,
    onError,
    skipRetryForTypes = [ERROR_TYPES.UNAUTHORIZED, ERROR_TYPES.FORBIDDEN, ERROR_TYPES.VALIDATION],
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Check network connectivity before making request
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        throw new ApiError(
          'No internet connection available.',
          ERROR_TYPES.OFFLINE,
          null,
          null,
          true
        );
      }

      // Ensure auth token is attached if available
      try {
        if (!requestConfig.headers) requestConfig.headers = {};
        if (!requestConfig.headers.Authorization) {
          const token = await AsyncStorage.getItem('userToken');
          let lsToken = null;
          if (!token && typeof window !== 'undefined') {
            lsToken = window.localStorage.getItem('userToken');
          }
          const effectiveToken = token || lsToken;
          if (effectiveToken) {
            requestConfig.headers.Authorization = `Bearer ${effectiveToken}`;
          }
        }
      } catch (tokenError) {
        console.warn('Failed to attach auth token for request:', tokenError);
      }

      // Make the API request
      try {
        const authHeader = requestConfig?.headers?.Authorization || '(none)';
        console.log('API Request:', {
          method: requestConfig.method,
          url: requestConfig.url,
          baseURL: requestConfig.baseURL,
          authHeader,
        });
      } catch {}
      const response = await axios(requestConfig);
      return response;

    } catch (error) {
      const classified = classifyError(error);
      lastError = new ApiError(
        classified.message,
        classified.type,
        error.response?.status,
        error,
        classified.retryable
      );

      // Special handling: on web, try auto-login once on 401 and retry original request
      if (
        classified.type === ERROR_TYPES.UNAUTHORIZED &&
        Platform.OS === 'web' &&
        !requestConfig.__retry_after_login
      ) {
        try {
          // Clear any stale tokens first
          try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            if (typeof window !== 'undefined') {
              try {
                window.localStorage.removeItem('userToken');
                window.localStorage.removeItem('userData');
              } catch {}
            }
          } catch {}

          const params = new URLSearchParams();
          params.append('username', 'frontline@afridiag.org');
          params.append('password', 'frontline123');

          const loginResp = await axios.post(
            `${API_URL}/auth/login`,
            params.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          );

          const access_token = loginResp?.data?.access_token;
          if (access_token) {
            try { await AsyncStorage.setItem('userToken', access_token); } catch {}
            if (typeof window !== 'undefined') {
              try { window.localStorage.setItem('userToken', access_token); } catch {}
            }

            const newConfig = {
              ...requestConfig,
              headers: {
                ...(requestConfig?.headers || {}),
                Authorization: `Bearer ${access_token}`,
              },
              __retry_after_login: true,
            };

            try {
              const retryResp = await axios(newConfig);
              return retryResp;
            } catch (retryErr) {
              // If retry also fails, fall through to standard error handling below
              lastError = new ApiError(
                classifyError(retryErr).message,
                classifyError(retryErr).type,
                retryErr.response?.status,
                retryErr,
                classifyError(retryErr).retryable
              );
            }
          }
        } catch (autoLoginErr) {
          console.warn('Auto-login after 401 in makeApiRequest failed:', autoLoginErr?.message || autoLoginErr);
        }
      }

      // Log error for debugging with readable output
      try {
        const readable = lastError?.toString ? lastError.toString() : (lastError?.message || String(lastError));
        console.error(`API Request failed (attempt ${attempt}):`, {
          url: requestConfig.url,
          method: requestConfig.method,
          error: readable,
          type: lastError?.type,
          status: lastError?.statusCode,
          retryable: lastError?.retryable,
        });
      } catch {
        console.error(`API Request failed (attempt ${attempt}):`, lastError);
      }

      // Call error callback if provided
      if (onError) {
        onError(lastError, attempt);
      }

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt > maxRetries || 
          !classified.retryable || 
          skipRetryForTypes.includes(classified.type)) {
        throw lastError;
      }

      // Calculate delay and wait before retry
      const delay = calculateRetryDelay(attempt);
      console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, delay, lastError);
      }

      await sleep(delay);
    }
  }

  throw lastError;
};

// Create enhanced axios instance
export const createApiInstance = (baseURL, defaultConfig = {}) => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    ...defaultConfig,
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    async (config) => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (typeof window !== 'undefined') {
          const lsToken = window.localStorage.getItem('userToken');
          if (lsToken) {
            config.headers.Authorization = `Bearer ${lsToken}`;
          }
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for global error handling
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const classified = classifyError(error);
      
      // Handle unauthorized errors globally
      if (classified.type === ERROR_TYPES.UNAUTHORIZED) {
        try {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userData');
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.removeItem('userToken');
              window.localStorage.removeItem('userData');
            } catch (lsErr) {
              console.warn('Failed to clear localStorage auth data:', lsErr);
            }
          }
        } catch (storageError) {
          console.warn('Failed to clear auth data:', storageError);
        }

        // On web, attempt an automatic login with demo credentials and retry once
        if (Platform.OS === 'web' && !error.config?.__retry_after_login) {
          try {
            const params = new URLSearchParams();
            params.append('username', 'frontline@afridiag.org');
            params.append('password', 'frontline123');

            const loginResp = await axios.post(
              `${API_URL}/auth/login`,
              params.toString(),
              { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            const access_token = loginResp?.data?.access_token;
            if (access_token) {
              try {
                await AsyncStorage.setItem('userToken', access_token);
              } catch {}
              if (typeof window !== 'undefined') {
                try {
                  window.localStorage.setItem('userToken', access_token);
                } catch {}
              }

              const newConfig = {
                ...error.config,
                headers: {
                  ...(error.config?.headers || {}),
                  Authorization: `Bearer ${access_token}`,
                },
                __retry_after_login: true,
              };

              return axios(newConfig);
            }
          } catch (autoLoginErr) {
            console.warn('Auto-login on 401 failed:', autoLoginErr?.message || autoLoginErr);
          }
        }
      }

      throw new ApiError(
        classified.message,
        classified.type,
        error.response?.status,
        error,
        classified.retryable
      );
    }
  );

  return instance;
};

// Utility functions for common API patterns
export const withRetry = (apiCall, options = {}) => {
  return (...args) => makeApiRequest(() => apiCall(...args), options);
};

export const isRetryableError = (error) => {
  return error instanceof ApiError && error.retryable;
};

export const getErrorMessage = (error) => {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred.';
};

export const getErrorType = (error) => {
  if (error instanceof ApiError) {
    return error.type;
  }
  return ERROR_TYPES.UNKNOWN;
};

// Network status utilities
export const checkNetworkConnectivity = async () => {
  try {
    const networkState = await NetInfo.fetch();
    return {
      isConnected: networkState.isConnected,
      type: networkState.type,
      isInternetReachable: networkState.isInternetReachable,
    };
  } catch (error) {
    console.warn('Failed to check network connectivity:', error);
    return {
      isConnected: false,
      type: 'unknown',
      isInternetReachable: false,
    };
  }
};

export default {
  makeApiRequest,
  createApiInstance,
  classifyError,
  ApiError,
  ERROR_TYPES,
  withRetry,
  isRetryableError,
  getErrorMessage,
  getErrorType,
  checkNetworkConnectivity,
};
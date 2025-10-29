/**
 * Authentication Configuration
 * 
 * This file contains configuration settings for authentication behavior,
 * including bypass options for development and testing.
 */

export const AUTH_CONFIG = {
  // Enable/disable automatic login bypass
  BYPASS_LOGIN: false,
  
  // Demo credentials for automatic login
  DEMO_CREDENTIALS: {
    email: 'frontline@afridiag.org',
    password: 'frontline123',
    role: 'frontline_worker'
  },
  
  // Alternative demo users for testing different roles
  DEMO_USERS: {
    frontline_worker: {
      email: 'frontline@afridiag.org',
      password: 'frontline123',
      name: 'Dr. Sarah Mwangi',
      role: 'frontline_worker'
    },
    specialist: {
      email: 'specialist@afridiag.org',
      password: 'specialist123',
      name: 'Dr. James Ochieng',
      role: 'specialist'
    },
    admin: {
      email: 'admin@afridiag.org',
      password: 'admin123',
      name: 'Dr. Amina Hassan',
      role: 'admin'
    }
  },
  
  // Token storage keys
  STORAGE_KEYS: {
    USER_TOKEN: 'userToken',
    USER_DATA: 'userData',
    BYPASS_FLAG: 'afridiag_bypass'
  },
  
  // Development settings
  DEV_MODE: process.env.NODE_ENV === 'development',
  
  // Logging settings
  ENABLE_AUTH_LOGS: false
};

export default AUTH_CONFIG;
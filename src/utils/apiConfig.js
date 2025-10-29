import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_PORT = 8001;
const DEFAULT_BASE_PATH = '/api/v1';

const parseHostFromExpo = () => {
  try {
    const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost || '';
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host) return host;
    }
  } catch (e) {
    // noop
  }
  return null;
};

const getBaseHost = () => {
  const envUrl = process.env.API_URL || process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // Force 127.0.0.1 for web to avoid IPv6 localhost issues
  if (Platform.OS === 'web') {
    return `http://127.0.0.1:${DEFAULT_PORT}`;
  }

  // Android emulator cannot resolve localhost of host machine
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  // Try to infer local network host from Expo
  const expoHost = parseHostFromExpo();
  if (expoHost) {
    return `http://${expoHost}:${DEFAULT_PORT}`;
  }

  // Web or iOS simulator
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:${DEFAULT_PORT}`;
  }

  return `http://localhost:${DEFAULT_PORT}`;
};

export const API_BASE_URL = (() => {
  const base = getBaseHost();
  // If provided env already includes the path, use as is
  if (base.includes('/api/v1')) return base;
  return `${base}${DEFAULT_BASE_PATH}`;
})();

export default API_BASE_URL;
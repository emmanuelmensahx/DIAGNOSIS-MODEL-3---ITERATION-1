// Web platform shim for React Native modules
export default {
  OS: 'web',
  Version: '1.0.0',
  isPad: false,
  isTesting: false,
  isTV: false,
  isDOMAvailable: typeof window !== 'undefined',
  select: (obj) => obj.web || obj.default,
  constants: {
    reactNativeVersion: { major: 0, minor: 70, patch: 0 },
    Version: '1.0.0',
    Release: '1.0.0',
    Serial: 'unknown',
    Fingerprint: 'unknown',
    Model: 'web',
    Brand: 'web',
    Manufacturer: 'web'
  }
};

// Also export as named exports for compatibility
export const OS = 'web';
export const Version = '1.0.0';
export const isPad = false;
export const isTesting = false;
export const isTV = false;
export const isDOMAvailable = typeof window !== 'undefined';
export const select = (obj) => obj.web || obj.default;
export const constants = {
  reactNativeVersion: { major: 0, minor: 70, patch: 0 },
  Version: '1.0.0',
  Release: '1.0.0',
  Serial: 'unknown',
  Fingerprint: 'unknown',
  Model: 'web',
  Brand: 'web',
  Manufacturer: 'web'
};
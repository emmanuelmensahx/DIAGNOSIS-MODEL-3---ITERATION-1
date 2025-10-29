// Comprehensive expo-modules-core shim for web
import PlatformShim from './web-platform-shim.js';

// Export Platform as named export
export const Platform = PlatformShim;

// Mock other expo-modules-core exports
export class CodedError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export class UnavailabilityError extends Error {
  constructor(moduleName, propertyName) {
    super(`${moduleName}.${propertyName} is not available on this platform.`);
  }
}

export class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }
  
  addListener(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(listener);
    return { remove: () => this.removeListener(eventType, listener) };
  }
  
  removeListener(eventType, listener) {
    if (this.listeners.has(eventType)) {
      const listeners = this.listeners.get(eventType);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  removeAllListeners(eventType) {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
  
  removeSubscription(subscription) {
    if (subscription && subscription.remove) {
      subscription.remove();
    }
  }
  
  emit(eventType, ...args) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.warn('EventEmitter listener error:', error);
        }
      });
    }
  }
}

export const DeviceEventEmitter = new EventEmitter();
export const RCTDeviceEventEmitter = new EventEmitter();
export const SyntheticPlatformEmitter = new EventEmitter();

export const NativeModulesProxy = {};

export const PermissionStatus = {
  DENIED: 'denied',
  GRANTED: 'granted',
  UNDETERMINED: 'undetermined',
};

export function createPermissionHook() {
  return () => [null, () => Promise.resolve({ status: PermissionStatus.GRANTED })];
}

export function deprecate() {
  // No-op for web
}

export function requireNativeModule() {
  throw new UnavailabilityError('expo-modules-core', 'requireNativeModule');
}

export function requireNativeViewManager() {
  throw new UnavailabilityError('expo-modules-core', 'requireNativeViewManager');
}

// Default export
export default {
  Platform: PlatformShim,
  CodedError,
  UnavailabilityError,
  EventEmitter,
  DeviceEventEmitter,
  RCTDeviceEventEmitter,
  SyntheticPlatformEmitter,
  NativeModulesProxy,
  PermissionStatus,
  createPermissionHook,
  deprecate,
  requireNativeModule,
  requireNativeViewManager,
};
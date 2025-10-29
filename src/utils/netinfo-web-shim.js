// Web-compatible NetInfo shim for React Native Web
const NetInfo = {
  fetch: () => Promise.resolve({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: {
      isConnectionExpensive: false,
      ssid: null,
      strength: null,
      ipAddress: null,
      subnet: null,
      frequency: null,
    }
  }),
  
  addEventListener: (listener) => {
    // Return a mock unsubscribe function
    return () => {};
  },
  
  useNetInfo: () => ({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: {
      isConnectionExpensive: false,
      ssid: null,
      strength: null,
      ipAddress: null,
      subnet: null,
      frequency: null,
    }
  })
};

export default NetInfo;
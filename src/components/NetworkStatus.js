import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { checkNetworkConnectivity } from '../utils/apiUtils';

const NetworkStatus = ({ 
  showWhenOnline = false, 
  position = 'top',
  onRetry,
  style 
}) => {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    type: 'unknown',
    isInternetReachable: true,
  });
  const [slideAnim] = useState(new Animated.Value(-100));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const newNetworkState = {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      };
      
      setNetworkState(newNetworkState);
      
      // Show/hide based on connection status
      const shouldShow = !newNetworkState.isConnected || 
                        (showWhenOnline && newNetworkState.isConnected);
      
      if (shouldShow !== isVisible) {
        setIsVisible(shouldShow);
        
        Animated.timing(slideAnim, {
          toValue: shouldShow ? 0 : (position === 'top' ? -100 : 100),
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    // Initial network check
    checkNetworkConnectivity().then(connectivity => {
      setNetworkState(connectivity);
    });

    return unsubscribe;
  }, [slideAnim, isVisible, showWhenOnline, position]);

  const getStatusConfig = () => {
    if (!networkState.isConnected) {
      return {
        text: 'No Internet Connection',
        subtext: 'You are currently offline',
        backgroundColor: '#dc3545',
        icon: '📵',
        showRetry: true,
      };
    }
    
    if (networkState.isInternetReachable === false) {
      return {
        text: 'Limited Connectivity',
        subtext: 'Connected but no internet access',
        backgroundColor: '#fd7e14',
        icon: '⚠️',
        showRetry: true,
      };
    }
    
    if (showWhenOnline && networkState.isConnected) {
      return {
        text: 'Back Online',
        subtext: `Connected via ${networkState.type}`,
        backgroundColor: '#28a745',
        icon: '✅',
        showRetry: false,
      };
    }
    
    return null;
  };

  const handleRetry = async () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry behavior - check connectivity
      const connectivity = await checkNetworkConnectivity();
      setNetworkState(connectivity);
    }
  };

  const statusConfig = getStatusConfig();
  
  if (!statusConfig || !isVisible) {
    return null;
  }

  const containerStyle = [
    styles.container,
    {
      backgroundColor: statusConfig.backgroundColor,
      transform: [{ translateY: slideAnim }],
      [position]: 0,
    },
    style,
  ];

  return (
    <Animated.View
      style={containerStyle}
      pointerEvents={Platform.OS === 'web' ? 'box-none' : 'auto'}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{statusConfig.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.statusText}>{statusConfig.text}</Text>
          <Text style={styles.subtextText}>{statusConfig.subtext}</Text>
        </View>
        {statusConfig.showRetry && (
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={handleRetry}
            activeOpacity={0.7}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// Offline Mode Banner Component
export const OfflineBanner = ({ visible, onDismiss, style }) => {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.offlineBanner,
        { transform: [{ translateY: slideAnim }] },
        style
      ]}
      pointerEvents={Platform.OS === 'web' ? 'box-none' : 'auto'}
    >
      <View style={styles.offlineContent}>
        <Text style={styles.offlineIcon}>📱</Text>
        <View style={styles.offlineTextContainer}>
          <Text style={styles.offlineTitle}>Offline Mode</Text>
          <Text style={styles.offlineSubtitle}>
            Changes will sync when connection is restored
          </Text>
        </View>
        {onDismiss && (
          <TouchableOpacity 
            style={styles.dismissButton} 
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// Connection Quality Indicator
export const ConnectionIndicator = ({ style }) => {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    type: 'unknown',
    isInternetReachable: true,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });
    });

    return unsubscribe;
  }, []);

  const getIndicatorConfig = () => {
    if (!networkState.isConnected) {
      return { color: '#dc3545', text: 'Offline', icon: '●' };
    }
    
    if (networkState.isInternetReachable === false) {
      return { color: '#fd7e14', text: 'Limited', icon: '●' };
    }
    
    if (networkState.type === 'wifi') {
      return { color: '#28a745', text: 'WiFi', icon: '●' };
    }
    
    if (networkState.type === 'cellular') {
      return { color: '#17a2b8', text: 'Mobile', icon: '●' };
    }
    
    return { color: '#28a745', text: 'Online', icon: '●' };
  };

  const config = getIndicatorConfig();

  return (
    <View style={[styles.connectionIndicator, style]}>
      <Text style={[styles.indicatorDot, { color: config.color }]}>
        {config.icon}
      </Text>
      <Text style={[styles.indicatorText, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
};

// Network Status Hook for use in components
export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    type: 'unknown',
    isInternetReachable: true,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });
    });

    // Initial check
    checkNetworkConnectivity().then(connectivity => {
      setNetworkState(connectivity);
    });

    return unsubscribe;
  }, []);

  return {
    ...networkState,
    isOnline: networkState.isConnected && networkState.isInternetReachable !== false,
    isOffline: !networkState.isConnected,
    hasLimitedConnectivity: networkState.isConnected && networkState.isInternetReachable === false,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subtextText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#6c757d',
    zIndex: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  offlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  offlineTextContainer: {
    flex: 1,
  },
  offlineTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  offlineSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  indicatorDot: {
    fontSize: 12,
    marginRight: 4,
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default NetworkStatus;
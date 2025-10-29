import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration,
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(-100),
    };

    setToasts(prev => [...prev, newToast]);

    // Animate in
    Animated.parallel([
      Animated.timing(newToast.opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(newToast.translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }

    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast) {
        // Animate out
        Animated.parallel([
          Animated.timing(toast.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(toast.translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToasts(current => current.filter(t => t.id !== id));
        });
      }
      return prev;
    });
  }, []);

  const showSuccess = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, onHide }) => {
  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          onHide={onHide}
        />
      ))}
    </View>
  );
};

// Individual Toast Item Component
const ToastItem = ({ toast, index, onHide }) => {
  const theme = useTheme();

  const getToastConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: 'check-circle',
          color: '#4caf50',
          backgroundColor: '#e8f5e8',
          borderColor: '#4caf50',
        };
      case 'error':
        return {
          icon: 'error',
          color: theme.colors.error,
          backgroundColor: '#ffebee',
          borderColor: theme.colors.error,
        };
      case 'warning':
        return {
          icon: 'warning',
          color: '#ff9800',
          backgroundColor: '#fff3e0',
          borderColor: '#ff9800',
        };
      default: // info
        return {
          icon: 'info',
          color: theme.colors.primary,
          backgroundColor: '#e3f2fd',
          borderColor: theme.colors.primary,
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity: toast.opacity,
          transform: [{ translateY: toast.translateY }],
          top: 60 + (index * 80), // Stack toasts
          backgroundColor: config.backgroundColor,
          borderLeftColor: config.borderColor,
        }
      ]}
      pointerEvents="auto"
    >
      <Card style={[styles.toastCard, { backgroundColor: config.backgroundColor }]}>
        <Card.Content style={styles.toastContent}>
          <Icon 
            name={config.icon} 
            size={20} 
            color={config.color} 
            style={styles.toastIcon}
          />
          <Text style={[
            styles.toastText,
            { color: config.color }
          ]}>
            {toast.message}
          </Text>
          <Icon 
            name="close" 
            size={18} 
            color={config.color} 
            style={styles.closeIcon}
            onPress={() => onHide(toast.id)}
          />
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

// Utility functions for common toast messages
export const showNetworkError = (showError) => {
  showError('No internet connection. Please check your network and try again.', 5000);
};

export const showSyncSuccess = (showSuccess) => {
  showSuccess('Data synchronized successfully!');
};

export const showSyncError = (showError) => {
  showError('Failed to synchronize data. Will retry when connection is restored.', 5000);
};

export const showDiagnosisSuccess = (showSuccess) => {
  showSuccess('Diagnosis submitted successfully!');
};

export const showDiagnosisError = (showError) => {
  showError('Failed to submit diagnosis. Please try again.', 5000);
};

export const showValidationError = (showError, message) => {
  showError(message || 'Please check your input and try again.', 4000);
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderLeftWidth: 4,
    borderRadius: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toastCard: {
    elevation: 0,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toastIcon: {
    marginRight: 12,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeIcon: {
    marginLeft: 8,
    padding: 4,
  },
});

export default ToastProvider;
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const ErrorMessage = ({ 
  message, 
  type = 'error', 
  onRetry, 
  onDismiss, 
  showIcon = true,
  style,
  retryText = 'Retry',
  dismissText = 'Dismiss'
}) => {
  const theme = useTheme();

  const getErrorConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: 'warning',
          color: theme.colors.warning || '#ff9800',
          backgroundColor: '#fff3e0',
          borderColor: '#ffcc02',
        };
      case 'info':
        return {
          icon: 'info',
          color: theme.colors.primary,
          backgroundColor: '#e3f2fd',
          borderColor: theme.colors.primary,
        };
      case 'success':
        return {
          icon: 'check-circle',
          color: '#4caf50',
          backgroundColor: '#e8f5e8',
          borderColor: '#4caf50',
        };
      case 'network':
        return {
          icon: 'wifi-off',
          color: '#f44336',
          backgroundColor: '#ffebee',
          borderColor: '#f44336',
        };
      default: // error
        return {
          icon: 'error',
          color: theme.colors.error,
          backgroundColor: '#ffebee',
          borderColor: theme.colors.error,
        };
    }
  };

  const config = getErrorConfig();

  if (!message) return null;

  return (
    <Card style={[
      styles.container,
      {
        backgroundColor: config.backgroundColor,
        borderLeftColor: config.borderColor,
      },
      style
    ]}>
      <Card.Content style={styles.content}>
        <View style={styles.messageContainer}>
          {showIcon && (
            <Icon 
              name={config.icon} 
              size={20} 
              color={config.color} 
              style={styles.icon}
            />
          )}
          <Text style={[
            styles.message,
            { color: config.color, flex: 1 }
          ]}>
            {message}
          </Text>
        </View>
        
        {(onRetry || onDismiss) && (
          <View style={styles.buttonContainer}>
            {onRetry && (
              <Button
                mode="text"
                onPress={onRetry}
                textColor={config.color}
                style={styles.button}
                compact
              >
                {retryText}
              </Button>
            )}
            {onDismiss && (
              <Button
                mode="text"
                onPress={onDismiss}
                textColor={config.color}
                style={styles.button}
                compact
              >
                {dismissText}
              </Button>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

// Specialized error message components
export const NetworkErrorMessage = ({ onRetry, ...props }) => (
  <ErrorMessage
    type="network"
    message="No internet connection. Please check your network and try again."
    onRetry={onRetry}
    retryText="Retry"
    {...props}
  />
);

export const ValidationErrorMessage = ({ errors, ...props }) => {
  if (!errors || errors.length === 0) return null;
  
  const message = Array.isArray(errors) 
    ? errors.join(', ')
    : errors;
    
  return (
    <ErrorMessage
      type="warning"
      message={message}
      {...props}
    />
  );
};

export const ApiErrorMessage = ({ error, onRetry, ...props }) => {
  const getMessage = () => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.response?.data?.detail) return error.response.data.detail;
    if (error?.response?.data?.message) return error.response.data.message;
    return 'An unexpected error occurred. Please try again.';
  };

  return (
    <ErrorMessage
      type="error"
      message={getMessage()}
      onRetry={onRetry}
      {...props}
    />
  );
};

export const SuccessMessage = ({ message, onDismiss, ...props }) => (
  <ErrorMessage
    type="success"
    message={message}
    onDismiss={onDismiss}
    dismissText="OK"
    {...props}
  />
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderLeftWidth: 4,
    elevation: 2,
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    marginLeft: 32, // Align with text (icon width + margin)
  },
  button: {
    marginLeft: 8,
  },
});

export default ErrorMessage;
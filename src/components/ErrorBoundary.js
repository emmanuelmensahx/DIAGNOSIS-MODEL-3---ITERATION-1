import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and any error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Here you could send the error to an error reporting service
    // Example: Sentry.captureException(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          onRetry={this.handleRetry}
          customMessage={this.props.fallbackMessage}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, onRetry, customMessage }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Card style={styles.errorCard}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Icon 
              name="error-outline" 
              size={64} 
              color={theme.colors.error} 
            />
          </View>
          
          <Text style={[styles.title, { color: theme.colors.error }]}>
            Something went wrong
          </Text>
          
          <Text style={[styles.message, { color: theme.colors.onSurface }]}>
            {customMessage || 'An unexpected error occurred. Please try again.'}
          </Text>
          
          {__DEV__ && error && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugTitle}>Debug Information:</Text>
              <Text style={styles.debugText}>{error.toString()}</Text>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={onRetry}
              style={styles.retryButton}
              icon="refresh"
            >
              Try Again
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorCard: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  debugInfo: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
  },
  retryButton: {
    paddingVertical: 8,
  },
});

export default ErrorBoundary;
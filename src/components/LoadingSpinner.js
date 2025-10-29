import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ActivityIndicator, Text, Card, useTheme } from 'react-native-paper';

const LoadingSpinner = ({ 
  loading = true,
  message = 'Loading...',
  size = 'large',
  overlay = false,
  fullScreen = false,
  color,
  style,
  children
}) => {
  const theme = useTheme();

  if (!loading) {
    return children || null;
  }

  const spinnerColor = color || theme.colors.primary;

  const LoadingContent = () => (
    <View
      pointerEvents={Platform.OS === 'web' && (fullScreen || overlay) ? 'none' : 'auto'}
      style={[
      styles.container,
      fullScreen && styles.fullScreen,
      overlay && styles.overlay,
      style
    ]}
    >
      <View style={styles.content}>
        <ActivityIndicator 
          size={size} 
          color={spinnerColor}
          style={styles.spinner}
        />
        {message && (
          <Text style={[
            styles.message,
            { color: theme.colors.onSurface }
          ]}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <View style={styles.overlayContainer}>
        {children}
        <LoadingContent />
      </View>
    );
  }

  return <LoadingContent />;
};

// Specialized loading components
export const InlineLoader = ({ loading, message, ...props }) => (
  <LoadingSpinner
    loading={loading}
    message={message}
    size="small"
    style={styles.inline}
    {...props}
  />
);

export const CardLoader = ({ loading, message = 'Loading data...', children, ...props }) => {
  if (!loading) return children;

  return (
    <Card style={styles.cardLoader}>
      <Card.Content style={styles.cardContent}>
        <LoadingSpinner
          loading={loading}
          message={message}
          size="large"
          {...props}
        />
      </Card.Content>
    </Card>
  );
};

export const OverlayLoader = ({ loading, message = 'Processing...', children, ...props }) => (
  <LoadingSpinner
    loading={loading}
    message={message}
    overlay={true}
    {...props}
  >
    {children}
  </LoadingSpinner>
);

export const FullScreenLoader = ({ loading, message = 'Loading application...', ...props }) => (
  <LoadingSpinner
    loading={loading}
    message={message}
    fullScreen={true}
    {...props}
  />
);

// Loading states for specific operations
export const DiagnosisLoader = ({ loading, children }) => (
  <OverlayLoader
    loading={loading}
    message="Analyzing symptoms and generating diagnosis..."
  >
    {children}
  </OverlayLoader>
);

export const SyncLoader = ({ loading, children }) => (
  <OverlayLoader
    loading={loading}
    message="Synchronizing data with server..."
  >
    {children}
  </OverlayLoader>
);

export const ImageUploadLoader = ({ loading, children }) => (
  <OverlayLoader
    loading={loading}
    message="Uploading medical images..."
  >
    {children}
  </OverlayLoader>
);

export const PredictionLoader = ({ loading, children }) => (
  <OverlayLoader
    loading={loading}
    message="Running AI prediction analysis..."
  >
    {children}
  </OverlayLoader>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 100,
  },
  overlayContainer: {
    position: 'relative',
    flex: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  cardLoader: {
    margin: 16,
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});

export default LoadingSpinner;
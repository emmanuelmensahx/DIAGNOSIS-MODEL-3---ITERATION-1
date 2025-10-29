import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {
  ErrorBoundary,
  ErrorMessage,
  NetworkErrorMessage,
  ApiErrorMessage,
  ValidationErrorMessage,
  SuccessMessage,
  LoadingSpinner,
  InlineLoader,
  CardLoader,
  DiagnosisLoader,
  SyncLoader,
  ImageUploadLoader,
  PredictionLoader,
  NetworkStatus,
  OfflineBanner,
  ConnectionIndicator,
  useNetworkStatus,
  ValidatedTextInput,
  ValidatedSelect,
  ValidatedCheckbox,
  FormSection,
  FormSubmitButton,
  ToastProvider,
  useToast,
} from '../components';
import { ApiError, ERROR_TYPES } from '../utils/apiUtils';
import { useFormValidation, rule } from '../utils/validation';

const TestSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const TestButton = ({ title, onPress, style }) => (
  <TouchableOpacity 
    style={[styles.testButton, style]} 
    onPress={onPress}
  >
    <Text style={styles.testButtonText}>{title}</Text>
  </TouchableOpacity>
);

const ErrorHandlingTestScreen = () => {
  const networkStatus = useNetworkStatus();
  const { showError, showSuccess, showWarning, showInfo } = useToast();
  
  // State for various test scenarios
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    spinner: false,
    inline: false,
    card: false,
    diagnosis: false,
    sync: false,
    imageUpload: false,
    prediction: false,
  });

  // Form validation test
  const {
    data: formData,
    errors,
    touched,
    setValue,
    setTouched,
    validateForm,
    isValid,
  } = useFormValidation({
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  }, [
    rule('email').required('Email is required').email('Invalid email format').build(),
    rule('password').required('Password is required').minLength(8, 'Password must be at least 8 characters').build(),
    rule('confirmPassword').required('Please confirm password').custom((value, data) => {
      return value === data.password ? null : 'Passwords do not match';
    }).build(),
    rule('terms').required('You must accept the terms').build(),
  ]);

  // Toggle loading state
  const toggleLoading = (type) => {
    setLoadingStates(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Test error scenarios
  const testNetworkError = () => {
    const error = new ApiError('Network connection failed', ERROR_TYPES.NETWORK, 0);
    showError(error.message);
  };

  const testTimeoutError = () => {
    const error = new ApiError('Request timed out', ERROR_TYPES.TIMEOUT, 408);
    showError(error.message);
  };

  const testValidationError = () => {
    const error = new ApiError('Invalid input data', ERROR_TYPES.VALIDATION, 400);
    showError(error.message);
  };

  const testServerError = () => {
    const error = new ApiError('Internal server error', ERROR_TYPES.SERVER, 500);
    showError(error.message);
  };

  const testUnauthorizedError = () => {
    const error = new ApiError('Session expired', ERROR_TYPES.UNAUTHORIZED, 401);
    showError(error.message);
  };

  // Test toast notifications
  const testToasts = () => {
    showSuccess('Operation completed successfully!');
    setTimeout(() => showWarning('This is a warning message'), 1000);
    setTimeout(() => showInfo('Here is some information'), 2000);
    setTimeout(() => showError('Something went wrong'), 3000);
  };

  // Simulate component crash for ErrorBoundary test
  const CrashComponent = ({ shouldCrash }) => {
    if (shouldCrash) {
      throw new Error('Intentional component crash for testing');
    }
    return <Text>Component is working normally</Text>;
  };

  const [shouldCrash, setShouldCrash] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <NetworkStatus position="top" />
      
      <OfflineBanner 
        visible={showOfflineBanner}
        onDismiss={() => setShowOfflineBanner(false)}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Error Handling Test</Text>
        <ConnectionIndicator />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Network Status Tests */}
        <TestSection title="Network Status">
          <Text style={styles.statusText}>
            Online: {networkStatus.isOnline ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.statusText}>
            Connection Type: {networkStatus.connectionType}
          </Text>
          <Text style={styles.statusText}>
            Limited Connectivity: {networkStatus.hasLimitedConnectivity ? 'Yes' : 'No'}
          </Text>
          
          <TestButton
            title="Toggle Offline Banner"
            onPress={() => setShowOfflineBanner(!showOfflineBanner)}
          />
        </TestSection>

        {/* Error Message Tests */}
        <TestSection title="Error Messages">
          <ErrorMessage
            message="This is a general error message"
            type="error"
            onRetry={() => showInfo('Retry clicked')}
            style={styles.testError}
          />
          
          <NetworkErrorMessage
            onRetry={() => showInfo('Network retry clicked')}
            style={styles.testError}
          />
          
          <ApiErrorMessage
            error={new ApiError('API request failed', ERROR_TYPES.SERVER, 500)}
            onRetry={() => showInfo('API retry clicked')}
            style={styles.testError}
          />
          
          <ValidationErrorMessage
            errors={['Email is required', 'Password is too short']}
            style={styles.testError}
          />
          
          <SuccessMessage
            message="Operation completed successfully!"
            onDismiss={() => showInfo('Success dismissed')}
            style={styles.testError}
          />
        </TestSection>

        {/* Loading States Tests */}
        <TestSection title="Loading States">
          <View style={styles.buttonRow}>
            <TestButton
              title={loadingStates.spinner ? 'Hide Spinner' : 'Show Spinner'}
              onPress={() => toggleLoading('spinner')}
              style={styles.halfButton}
            />
            <TestButton
              title={loadingStates.inline ? 'Hide Inline' : 'Show Inline'}
              onPress={() => toggleLoading('inline')}
              style={styles.halfButton}
            />
          </View>
          
          <View style={styles.buttonRow}>
            <TestButton
              title={loadingStates.card ? 'Hide Card' : 'Show Card'}
              onPress={() => toggleLoading('card')}
              style={styles.halfButton}
            />
            <TestButton
              title={loadingStates.diagnosis ? 'Hide Diagnosis' : 'Show Diagnosis'}
              onPress={() => toggleLoading('diagnosis')}
              style={styles.halfButton}
            />
          </View>

          {loadingStates.spinner && (
            <LoadingSpinner message="Loading data..." />
          )}
          
          {loadingStates.inline && (
            <InlineLoader message="Processing..." />
          )}
          
          {loadingStates.card && (
            <CardLoader />
          )}
          
          {loadingStates.diagnosis && (
            <DiagnosisLoader message="Analyzing symptoms..." overlay />
          )}
        </TestSection>

        {/* Toast Tests */}
        <TestSection title="Toast Notifications">
          <TestButton
            title="Test All Toasts"
            onPress={testToasts}
          />
          
          <View style={styles.buttonRow}>
            <TestButton
              title="Success"
              onPress={() => showSuccess('Success!')}
              style={styles.quarterButton}
            />
            <TestButton
              title="Warning"
              onPress={() => showWarning('Warning!')}
              style={styles.quarterButton}
            />
            <TestButton
              title="Error"
              onPress={() => showError('Error!')}
              style={styles.quarterButton}
            />
            <TestButton
              title="Info"
              onPress={() => showInfo('Info!')}
              style={styles.quarterButton}
            />
          </View>
        </TestSection>

        {/* Error Scenarios Tests */}
        <TestSection title="Error Scenarios">
          <View style={styles.buttonRow}>
            <TestButton
              title="Network Error"
              onPress={testNetworkError}
              style={styles.halfButton}
            />
            <TestButton
              title="Timeout Error"
              onPress={testTimeoutError}
              style={styles.halfButton}
            />
          </View>
          
          <View style={styles.buttonRow}>
            <TestButton
              title="Validation Error"
              onPress={testValidationError}
              style={styles.halfButton}
            />
            <TestButton
              title="Server Error"
              onPress={testServerError}
              style={styles.halfButton}
            />
          </View>
          
          <TestButton
            title="Unauthorized Error"
            onPress={testUnauthorizedError}
          />
        </TestSection>

        {/* Form Validation Tests */}
        <TestSection title="Form Validation">
          <FormSection title="Test Form">
            <ValidatedTextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => setValue('email', value)}
              onBlur={() => setTouched('email')}
              error={errors.email}
              touched={touched.email}
              required
              placeholder="Enter email"
              keyboardType="email-address"
            />
            
            <ValidatedTextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => setValue('password', value)}
              onBlur={() => setTouched('password')}
              error={errors.password}
              touched={touched.password}
              required
              placeholder="Enter password"
              secureTextEntry
            />
            
            <ValidatedTextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => setValue('confirmPassword', value)}
              onBlur={() => setTouched('confirmPassword')}
              error={errors.confirmPassword}
              touched={touched.confirmPassword}
              required
              placeholder="Confirm password"
              secureTextEntry
            />
            
            <ValidatedCheckbox
              label="I accept the terms and conditions"
              value={formData.terms}
              onValueChange={(value) => setValue('terms', value)}
              error={errors.terms}
              touched={touched.terms}
              required
            />
            
            <FormSubmitButton
              title="Submit Form"
              onPress={() => {
                const validation = validateForm();
                if (validation.isValid) {
                  showSuccess('Form is valid!');
                } else {
                  showError('Please fix form errors');
                }
              }}
              disabled={!isValid}
            />
          </FormSection>
        </TestSection>

        {/* Error Boundary Test */}
        <TestSection title="Error Boundary">
          <ErrorBoundary>
            <CrashComponent shouldCrash={shouldCrash} />
          </ErrorBoundary>
          
          <TestButton
            title={shouldCrash ? 'Fix Component' : 'Crash Component'}
            onPress={() => setShouldCrash(!shouldCrash)}
          />
        </TestSection>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#495057',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  testButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  halfButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  quarterButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  testError: {
    marginBottom: 12,
  },
});

// Wrap with ToastProvider for toast notifications
const ErrorHandlingTestScreenWithToast = (props) => (
  <ErrorHandlingTestScreen {...props} />
);

export default ErrorHandlingTestScreenWithToast;

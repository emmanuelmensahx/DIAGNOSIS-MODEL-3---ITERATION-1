import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  ErrorBoundary,
  NetworkStatus,
  OfflineBanner,
  ConnectionIndicator,
  useNetworkStatus,
  ValidatedTextInput,
  ValidatedSelect,
  ValidatedCheckbox,
  FormSection,
  FormSubmitButton,
  DiagnosisLoader,
  ToastProvider,
  useToast,
  ErrorMessage,
  DiseaseSearchSelect,
} from '../components';
import { useFormValidation, validationSchemas, rule } from '../utils/validation';
import { makePrediction } from '../services/diagnosisService';
import { ApiError, ERROR_TYPES } from '../utils/apiUtils';

// Enhanced diagnosis form validation schema
const diagnosisValidationSchema = [
  ...validationSchemas.diagnosis,
  rule('symptoms').required('Please select at least one symptom').build(),
  rule('severity').required('Please indicate symptom severity').build(),
  rule('duration').required('Please specify symptom duration').build(),
];

const EnhancedDiagnosisScreen = ({ navigation, route }) => {
  const { patientId } = route.params || {};
  const networkStatus = useNetworkStatus();
  const { showError, showSuccess, showWarning } = useToast();
  
  // Form state with validation
  const {
    data: formData,
    errors,
    touched,
    setValue,
    setTouched,
    validateForm,
    reset,
    isValid,
  } = useFormValidation({
    patientId: patientId || '',
    chiefComplaint: '',
    symptoms: [],
    severity: '',
    duration: '',
    additionalNotes: '',
  }, diagnosisValidationSchema);

  // Component state
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [selectedDiseaseCode, setSelectedDiseaseCode] = useState('');

  // Symptom options
  const symptomOptions = [
    { value: 'fever', label: 'Fever' },
    { value: 'cough', label: 'Cough' },
    { value: 'shortness_of_breath', label: 'Shortness of Breath' },
    { value: 'fatigue', label: 'Fatigue' },
    { value: 'headache', label: 'Headache' },
    { value: 'nausea', label: 'Nausea' },
    { value: 'vomiting', label: 'Vomiting' },
    { value: 'chest_pain', label: 'Chest Pain' },
  ];

  const severityOptions = [
    { value: 'mild', label: 'Mild' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' },
  ];

  const durationOptions = [
    { value: '1-3_days', label: '1-3 days' },
    { value: '4-7_days', label: '4-7 days' },
    { value: '1-2_weeks', label: '1-2 weeks' },
    { value: '2-4_weeks', label: '2-4 weeks' },
    { value: 'more_than_month', label: 'More than a month' },
  ];

  // Monitor network status
  useEffect(() => {
    if (networkStatus.isOffline) {
      setShowOfflineBanner(true);
      showWarning('You are currently offline. Diagnosis will be saved locally.');
    } else if (networkStatus.hasLimitedConnectivity) {
      showWarning('Limited connectivity detected. Some features may not work properly.');
    }
  }, [networkStatus, showWarning]);

  // Handle symptom selection
  const handleSymptomToggle = (symptomValue) => {
    const currentSymptoms = formData.symptoms || [];
    const updatedSymptoms = currentSymptoms.includes(symptomValue)
      ? currentSymptoms.filter(s => s !== symptomValue)
      : [...currentSymptoms, symptomValue];
    
    setValue('symptoms', updatedSymptoms);
  };

  // Handle form submission with enhanced error handling
  const handleSubmit = async () => {
    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      showError('Please fix the form errors before submitting.');
      return;
    }

    setLoading(true);
    setRetryCount(0);

    try {
      const predictionData = {
        patient_id: formData.patientId,
        chief_complaint: formData.chiefComplaint,
        symptoms: formData.symptoms,
        severity: formData.severity,
        duration: formData.duration,
        additional_notes: formData.additionalNotes,
        disease_type: selectedDiseaseCode || undefined,
      };

      const result = await makePrediction(predictionData, {
        maxRetries: 2,
        onRetry: (attempt, delay, error) => {
          setRetryCount(attempt);
          showWarning(`Retrying diagnosis... Attempt ${attempt + 1}`);
        },
        onError: (error, attempt) => {
          console.error(`Diagnosis attempt ${attempt} failed:`, error);
        },
      });

      setPredictionResult(result);
      showSuccess('Diagnosis completed successfully!');
      
      // Navigate to results screen
      navigation.navigate('DiagnosisResult', { 
        result,
        patientId: formData.patientId 
      });

    } catch (error) {
      console.error('Diagnosis submission error:', error);
      
      if (error instanceof ApiError) {
        switch (error.type) {
          case ERROR_TYPES.NETWORK:
          case ERROR_TYPES.OFFLINE:
            showError('Network error. Diagnosis saved offline for later sync.');
            break;
          case ERROR_TYPES.TIMEOUT:
            showError('Request timed out. Please try again.');
            break;
          case ERROR_TYPES.VALIDATION:
            showError(error.message);
            break;
          case ERROR_TYPES.UNAUTHORIZED:
            showError('Session expired. Please log in again.');
            navigation.navigate('Login');
            break;
          default:
            showError(error.message || 'An unexpected error occurred.');
        }
      } else {
        showError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle retry action
  const handleRetry = () => {
    if (loading) return;
    handleSubmit();
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <NetworkStatus 
          position="top"
          onRetry={handleRetry}
        />
        
        <OfflineBanner 
          visible={showOfflineBanner}
          onDismiss={() => setShowOfflineBanner(false)}
        />

        <View style={styles.header}>
          <Text style={styles.title}>AI Diagnosis</Text>
          <ConnectionIndicator style={styles.connectionIndicator} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FormSection title="Patient Information">
            <ValidatedTextInput
              label="Patient ID"
              value={formData.patientId}
              onChangeText={(value) => setValue('patientId', value)}
              onBlur={() => setTouched('patientId')}
              error={errors.patientId}
              touched={touched.patientId}
              required
              placeholder="Enter patient ID"
              disabled={!!patientId}
            />
          </FormSection>

          <FormSection title="Chief Complaint">
            <ValidatedTextInput
              label="Chief Complaint"
              value={formData.chiefComplaint}
              onChangeText={(value) => setValue('chiefComplaint', value)}
              onBlur={() => setTouched('chiefComplaint')}
              error={errors.chiefComplaint}
              touched={touched.chiefComplaint}
              required
              placeholder="Describe the main health concern"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </FormSection>

          <FormSection title="Disease Selection (Optional)">
            <Text style={styles.sectionSubtitle}>
              Search and select a target disease, or leave blank for auto-detection.
            </Text>
            <DiseaseSearchSelect
              value={selectedDiseaseCode}
              onChange={setSelectedDiseaseCode}
            />
          </FormSection>

          <FormSection title="Symptoms">
            <Text style={styles.sectionSubtitle}>
              Select all symptoms that apply:
            </Text>
            
            <View style={styles.symptomsGrid}>
              {symptomOptions.map((symptom) => (
                <ValidatedCheckbox
                  key={symptom.value}
                  label={symptom.label}
                  value={formData.symptoms?.includes(symptom.value) || false}
                  onValueChange={() => handleSymptomToggle(symptom.value)}
                  style={styles.symptomCheckbox}
                />
              ))}
            </View>
            
            {touched.symptoms && errors.symptoms && (
              <ErrorMessage
                message={errors.symptoms}
                type="validation"
                style={styles.symptomsError}
              />
            )}
          </FormSection>

          <FormSection title="Symptom Details">
            <ValidatedSelect
              label="Severity"
              value={formData.severity}
              onValueChange={(value) => setValue('severity', value)}
              onBlur={() => setTouched('severity')}
              error={errors.severity}
              touched={touched.severity}
              required
              placeholder="Select severity level"
              options={severityOptions}
            />

            <ValidatedSelect
              label="Duration"
              value={formData.duration}
              onValueChange={(value) => setValue('duration', value)}
              onBlur={() => setTouched('duration')}
              error={errors.duration}
              touched={touched.duration}
              required
              placeholder="Select symptom duration"
              options={durationOptions}
            />
          </FormSection>

          <FormSection title="Additional Information">
            <ValidatedTextInput
              label="Additional Notes"
              value={formData.additionalNotes}
              onChangeText={(value) => setValue('additionalNotes', value)}
              onBlur={() => setTouched('additionalNotes')}
              error={errors.additionalNotes}
              touched={touched.additionalNotes}
              placeholder="Any additional relevant information"
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
          </FormSection>

          <FormSubmitButton
            title="Generate Diagnosis"
            onPress={handleSubmit}
            loading={loading}
            disabled={!isValid || loading}
            style={styles.submitButton}
          />

          {retryCount > 0 && (
            <Text style={styles.retryText}>
              Retry attempt: {retryCount}
            </Text>
          )}
        </ScrollView>

        {loading && (
          <DiagnosisLoader 
            message="Analyzing symptoms and generating diagnosis..."
            overlay
          />
        )}
      </SafeAreaView>
    </ErrorBoundary>
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
  connectionIndicator: {
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  symptomCheckbox: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  symptomsError: {
    marginTop: 8,
  },
  submitButton: {
    marginTop: 24,
  },
  retryText: {
    textAlign: 'center',
    color: '#fd7e14',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
});

// Wrap with ToastProvider for toast notifications
const EnhancedDiagnosisScreenWithToast = (props) => (
  <EnhancedDiagnosisScreen {...props} />
);

export default EnhancedDiagnosisScreenWithToast;

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { 
  Button, 
  Card, 
  Title, 
  Paragraph, 
  TextInput, 
  Divider, 
  Chip, 
  ActivityIndicator, 
  Switch,
  HelperText,
  Surface
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';

// Contexts
import { useOffline } from '../../context/OfflineContext';

// Error Handling Components
import { 
  ErrorBoundary, 
  
  useToast, 
  LoadingSpinner,
  NetworkStatus,
  OfflineBanner,
  ValidatedTextInput,
  FormSection,
  FormSubmitButton
} from '../../components';

// Services
import { submitEmergencyDiagnosis } from '../../services/diagnosisService';
import { getPatientById } from '../../services/patientService';

// Validation schema
const EmergencyDiagnosisSchema = Yup.object().shape({
  medical_history: Yup.string()
    .min(20, 'Please provide more detailed medical history (at least 20 characters)')
    .required('Medical history is required for emergency diagnosis'),
  patient_name: Yup.string()
    .min(2, 'Patient name must be at least 2 characters')
    .required('Patient name is required'),
  additional_notes: Yup.string(),
});

const EmergencyDiagnosisScreenContent = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isOffline } = useOffline();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  
  // Get patient data from route params if available
  const { patient: routePatient, patientId } = route.params || { patient: null, patientId: null };
  const [patient, setPatient] = useState(routePatient || null);

  useEffect(() => {
    let isMounted = true;
    const loadPatientIfNeeded = async () => {
      try {
        if (!routePatient && patientId && !patient) {
          const data = await getPatientById(patientId);
          if (isMounted) setPatient(data);
        }
      } catch (err) {
        console.error('Failed to load patient by ID:', err);
      }
    };
    loadPatientIfNeeded();
    return () => { isMounted = false; };
  }, [routePatient, patientId]);

  // Handle form submission
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    
    try {
      const emergencyData = {
        medical_history: values.medical_history,
        patient_name: values.patient_name,
        disease_type: selectedDisease,
        additional_notes: values.additional_notes,
        // Include patient ID if available
        ...(patient?.id && { patient_id: patient.id })
      };

      console.log('[Emergency Diagnosis] Submit payload:', {
        patient_name: emergencyData.patient_name,
        disease_type: emergencyData.disease_type,
        history_length: emergencyData.medical_history.length,
        has_patient_id: !!emergencyData.patient_id,
        offline: !!isOffline,
      });
      
      if (isOffline) {
        showToast('Emergency diagnosis requires internet connection', 'error');
        return;
      }

      // Submit emergency diagnosis
      const result = await submitEmergencyDiagnosis(emergencyData);
      
      showToast('Emergency diagnosis completed successfully', 'success');
      
      // Navigate to results screen
      navigation.navigate('DiagnosisResult', { 
        result: { 
          prediction: result,
          diagnosis_data: emergencyData,
          isEmergency: true
        }, 
        patient: patient || { name: values.patient_name },
        diagnosisData: emergencyData 
      });
      
    } catch (error) {
      const readable = error?.toString ? error.toString() : (error.message || String(error));
      console.error('Emergency diagnosis submission error:', readable);
      showToast(error.message || 'Failed to submit emergency diagnosis', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateWordCount = (text) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  };

  const showExampleHistory = () => {
    Alert.alert(
      "Medical History Examples",
      "Here are some examples of detailed medical history:\n\n" +
      "• Patient is a 45-year-old male with 3-week history of persistent cough with blood-tinged sputum, fever up to 39°C, night sweats, and 8kg weight loss. Vital signs: BP 140/90, HR 110, RR 24, O2 sat 92%.\n\n" +
      "• 5-year-old girl with 2-day history of high fever (40°C), severe headache, vomiting, and confusion. Child appears lethargic with rash on body.\n\n" +
      "• 28-year-old pregnant woman (6 months) with 4-day history of intermittent fever, severe headache, muscle pain, and nausea. Fever spikes to 39.8°C with profuse sweating.",
      [{ text: "OK" }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <NetworkStatus />
      <OfflineBanner />
      
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.mainTitle}>🚨 Emergency Diagnosis</Title>
          <Paragraph style={styles.subtitle}>
            Rapid AI-powered diagnosis using free-text medical history
          </Paragraph>
          
          {patient && (
            <Surface style={styles.patientInfo}>
              <Paragraph style={styles.patientText}>
                Existing Patient: {patient.unique_id || patient.name} | Age: {patient.age} | Gender: {patient.gender}
              </Paragraph>
            </Surface>
          )}
          
          <Divider style={styles.divider} />
          
          <Title style={styles.sectionTitle}>Disease Type (Optional)</Title>
          <Paragraph style={styles.helperText}>
            Leave blank for AI to auto-detect, or select if you suspect a specific condition
          </Paragraph>
          
          <View style={styles.diseaseChips}>
            <Chip 
              selected={selectedDisease === null}
              onPress={() => setSelectedDisease(null)}
              style={[styles.chip, selectedDisease === null && styles.selectedChip]}
            >
              Auto-detect
            </Chip>
            <Chip 
              selected={selectedDisease === 'malaria'}
              onPress={() => setSelectedDisease('malaria')}
              style={[styles.chip, selectedDisease === 'malaria' && styles.selectedChip]}
            >
              Malaria
            </Chip>
            <Chip 
              selected={selectedDisease === 'pneumonia'}
              onPress={() => setSelectedDisease('pneumonia')}
              style={[styles.chip, selectedDisease === 'pneumonia' && styles.selectedChip]}
            >
              Pneumonia
            </Chip>
            <Chip 
              selected={selectedDisease === 'tuberculosis'}
              onPress={() => setSelectedDisease('tuberculosis')}
              style={[styles.chip, selectedDisease === 'tuberculosis' && styles.selectedChip]}
            >
              Tuberculosis
            </Chip>
            <Chip 
              selected={selectedDisease === 'lung_cancer'}
              onPress={() => setSelectedDisease('lung_cancer')}
              style={[styles.chip, selectedDisease === 'lung_cancer' && styles.selectedChip]}
            >
              Lung Cancer
            </Chip>
          </View>
          
          <Formik
            initialValues={{
              medical_history: '',
              patient_name: patient?.name || patient?.unique_id || '',
              additional_notes: ''
            }}
            validationSchema={EmergencyDiagnosisSchema}
            onSubmit={handleSubmit}
          >
            {({ handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
              <View>
                <Title style={styles.sectionTitle}>Patient Information</Title>
                
                <ValidatedTextInput
                  label="Patient Name or ID"
                  value={values.patient_name}
                  onChangeText={(text) => setFieldValue('patient_name', text)}
                  onBlur={handleBlur('patient_name')}
                  style={styles.input}
                  error={touched.patient_name && errors.patient_name}
                  errorMessage={touched.patient_name && errors.patient_name ? errors.patient_name : ''}
                  placeholder="Enter patient name or unique identifier"
                />
                
                <Title style={styles.sectionTitle}>
                  Medical History & Symptoms
                  <Button 
                    mode="text" 
                    onPress={showExampleHistory}
                    style={styles.exampleButton}
                    labelStyle={styles.exampleButtonText}
                  >
                    View Examples
                  </Button>
                </Title>
                
                <ValidatedTextInput
                  label="Detailed Medical History"
                  value={values.medical_history}
                  onChangeText={(text) => {
                    setFieldValue('medical_history', text);
                    updateWordCount(text);
                  }}
                  onBlur={handleBlur('medical_history')}
                  multiline
                  numberOfLines={8}
                  style={[styles.input, styles.textArea]}
                  error={touched.medical_history && errors.medical_history}
                  errorMessage={touched.medical_history && errors.medical_history ? errors.medical_history : ''}
                  placeholder="Describe the patient's current symptoms, vital signs, medical history, duration of symptoms, severity, and any relevant details. Include age, gender, fever, pain levels, breathing difficulties, etc."
                />
                
                <HelperText type="info" style={styles.wordCount}>
                  {wordCount} words • Minimum 20 characters required
                </HelperText>
                
                <Title style={styles.sectionTitle}>Additional Notes (Optional)</Title>
                
                <ValidatedTextInput
                  label="Additional Clinical Notes"
                  value={values.additional_notes}
                  onChangeText={(text) => setFieldValue('additional_notes', text)}
                  onBlur={handleBlur('additional_notes')}
                  multiline
                  numberOfLines={3}
                  style={[styles.input, styles.textArea]}
                  placeholder="Any additional observations, treatment history, or relevant information"
                />
                
                <Divider style={styles.divider} />
                
                <FormSubmitButton
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting || isOffline}
                  style={styles.submitButton}
                  mode="contained"
                  icon="medical-bag"
                >
                  {isSubmitting ? 'Processing Emergency Diagnosis...' : 'Submit Emergency Diagnosis'}
                </FormSubmitButton>
                
                {isOffline && (
                  <HelperText type="error" style={styles.offlineWarning}>
                    Emergency diagnosis requires internet connection
                  </HelperText>
                )}
              </View>
            )}
          </Formik>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  patientInfo: {
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  patientText: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  helperText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  diseaseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  selectedChip: {
    backgroundColor: '#1976d2',
  },
  input: {
    marginBottom: 8,
  },
  textArea: {
    minHeight: 120,
  },
  wordCount: {
    textAlign: 'right',
    marginBottom: 16,
  },
  exampleButton: {
    marginLeft: 8,
  },
  exampleButtonText: {
    fontSize: 12,
    color: '#1976d2',
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  offlineWarning: {
    textAlign: 'center',
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
});

// Wrapper component with error handling
const EmergencyDiagnosisScreen = (props) => {
  return (
    <ErrorBoundary>
      <EmergencyDiagnosisScreenContent {...props} />
    </ErrorBoundary>
  );
};

export default EmergencyDiagnosisScreen;

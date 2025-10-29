import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Title, Paragraph, Checkbox, TextInput, Divider, Chip, ActivityIndicator, Switch } from 'react-native-paper';
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
import { submitDiagnosis, saveDiagnosisOffline, makePrediction, makeEnhancedDiagnosis } from '../../services/diagnosisService';
import { getPatientById } from '../../services/patientService';

// Validation utilities
import { validateForm, validationSchemas } from '../../utils/validation';

// Validation schema
const DiagnosisSchema = Yup.object().shape({
  symptoms: Yup.object().required('Symptoms are required'),
  notes: Yup.string(),
});

// Symptom categories and options
const symptomCategories = [
  {
    name: 'Respiratory',
    symptoms: [
      { id: 'cough', label: 'Cough' },
      { id: 'difficulty_breathing', label: 'Difficulty Breathing' },
      { id: 'chest_pain', label: 'Chest Pain' },
      { id: 'blood_in_sputum', label: 'Blood in Sputum' },
    ],
  },
  {
    name: 'General',
    symptoms: [
      { id: 'fever', label: 'Fever' },
      { id: 'chills', label: 'Chills' },
      { id: 'fatigue', label: 'Fatigue' },
      { id: 'weight_loss', label: 'Weight Loss' },
      { id: 'night_sweats', label: 'Night Sweats' },
      { id: 'loss_of_appetite', label: 'Loss of Appetite' },
    ],
  },
];

const DiagnosisScreenContent = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isOffline } = useOffline();
  const { showToast } = useToast();
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [useLLM, setUseLLM] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState('');
  
  // Get patient data from route params
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

  // Handle image data from CameraScreen
  useEffect(() => {
    if (route.params?.imageUri) {
      const imageData = {
        uri: route.params.imageUri,
        uploaded: route.params.imageUploaded || false,
        imageIds: route.params.imageIds || []
      };
      
      // Add the new image to the images array
      setImages(prevImages => [...prevImages, imageData]);
      
      // Clear the route params to prevent re-adding the same image
      navigation.setParams({
        imageUri: undefined,
        imageUploaded: undefined,
        imageIds: undefined
      });
    }
  }, [route.params?.imageUri]);
  
  // Handle adding images
  const handleAddImage = () => {
    navigation.navigate('Camera', {
      onImageCaptured: (imageUri) => {
        setImages([...images, imageUri]);
      },
    });
  };
  
  // Handle form submission
  const handleSubmit = async (values) => {
    if (!patient || !patient.id) {
      showToast('Patient information is missing', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert symptoms object to array of symptom names
      const symptomsList = Object.keys(values.symptoms).filter(symptom => values.symptoms[symptom]);
      
      if (symptomsList.length === 0) {
        showToast('Please select at least one symptom', 'warning');
        setIsSubmitting(false);
        return;
      }
      
      // Disease selection is optional; when omitted, AI will auto-detect

      // Process images - extract uploaded image IDs or URIs for offline
      const processedImages = images.map(image => {
        if (typeof image === 'string') {
          // Legacy format - just URI
          return image;
        } else if (image.uploaded && image.imageIds?.length > 0) {
          // Use uploaded image IDs
          return image.imageIds;
        } else {
          // Use local URI for offline or failed uploads
          return image.uri;
        }
      }).flat(); // Flatten in case of multiple IDs per image

      const diagnosisData = {
        patient_id: patient.id,
        symptoms: symptomsList,
        patient_data: {
          age: patient.age,
          gender: patient.gender,
          temperature: values.temperature,
          heart_rate: values.heart_rate,
          respiratory_rate: values.respiratory_rate,
          systolic_bp: values.systolic_bp,
          oxygen_saturation: values.oxygen_saturation
        },
        notes: values.notes,
        disease_type: selectedDisease,
        medical_images: processedImages,
        medical_history: medicalHistory,
      };
      console.log('[UI] Submit payload:', {
        patient_id: diagnosisData.patient_id,
        disease_type: diagnosisData.disease_type,
        symptoms_count: diagnosisData.symptoms.length,
        images_count: (diagnosisData.medical_images || []).length,
        using_llm: !!useLLM,
        offline: !!isOffline,
      });
      
      let result;
      
      if (isOffline) {
        // Save diagnosis for later sync
        result = await saveDiagnosisOffline(diagnosisData);
        showToast('Diagnosis saved offline and will be synchronized when online', 'success');
        navigation.goBack();
      } else {
        if (selectedDisease) {
          // Make AI prediction for specific disease
          if (useLLM) {
            console.log('[UI] Making enhanced prediction...');
            const prediction = await makeEnhancedDiagnosis(diagnosisData);
            result = { prediction, diagnosis_data: diagnosisData };
          } else {
            console.log('[UI] Making prediction...');
            const prediction = await makePrediction(diagnosisData);
            result = { prediction, diagnosis_data: diagnosisData };
          }
        } else {
          // Auto-detect: run general AI prediction without preselecting disease
          console.log('[UI] Running general AI prediction...');
          const prediction = await makePrediction(diagnosisData);
          result = { prediction, diagnosis_data: diagnosisData };
        }
        
        // Navigate to results screen
        console.log('[UI] Navigate to DiagnosisResult with result keys:', Object.keys(result || {}));
        navigation.navigate('DiagnosisResult', { 
          result, 
          patient,
          diagnosisData 
        });
      }
    } catch (error) {
      const readable = error?.toString ? error.toString() : (error.message || String(error));
      console.error('Diagnosis submission error:', readable);
      showToast(error.message || 'Failed to submit diagnosis', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <NetworkStatus />
      <OfflineBanner />
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>New Diagnosis</Title>
          {patient ? (
            <Paragraph style={styles.patientInfo}>
              Patient: {patient.unique_id} | Age: {patient.age} | Gender: {patient.gender}
            </Paragraph>
          ) : (
            <Paragraph style={[styles.patientInfo, { color: 'red' }]}>
              Patient information is missing. Please navigate from Patient Details
              or ensure a valid patientId is provided.
            </Paragraph>
          )}
          
          <Divider style={styles.divider} />
          
          <Title style={styles.sectionTitle}>Disease Type (Optional — leave blank to auto-detect)</Title>
          <View style={styles.diseaseChips}>
            <Chip 
              selected={selectedDisease === 'lung_cancer'}
              onPress={() => setSelectedDisease('lung_cancer')}
              style={styles.chip}
            >
              Lung Cancer
            </Chip>
            <Chip 
              selected={selectedDisease === 'malaria'}
              onPress={() => setSelectedDisease('malaria')}
              style={styles.chip}
            >
              Malaria
            </Chip>
            <Chip 
              selected={selectedDisease === 'pneumonia'}
              onPress={() => setSelectedDisease('pneumonia')}
              style={styles.chip}
            >
              Pneumonia
            </Chip>
            <Chip 
              selected={selectedDisease === 'tuberculosis'}
              onPress={() => setSelectedDisease('tuberculosis')}
              style={styles.chip}
            >
              Tuberculosis
            </Chip>
          </View>
          
          <Formik
            initialValues={{
              symptoms: {},
              notes: '',
              temperature: '',
              heart_rate: '',
              respiratory_rate: '',
              systolic_bp: '',
              oxygen_saturation: ''
            }}
            validationSchema={DiagnosisSchema}
            onSubmit={handleSubmit}
          >
            {({ handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
              <View>
                <Title style={styles.sectionTitle}>Symptoms</Title>
                
                {symptomCategories.map((category) => (
                  <View key={category.name} style={styles.categoryContainer}>
                    <Title style={styles.categoryTitle}>{category.name}</Title>
                    
                    {category.symptoms.map((symptom) => (
                      <View key={symptom.id} style={styles.symptomRow}>
                        <Checkbox
                          status={values.symptoms[symptom.id] ? 'checked' : 'unchecked'}
                          onPress={() => {
                            setFieldValue(
                              `symptoms.${symptom.id}`,
                              !values.symptoms[symptom.id]
                            );
                          }}
                        />
                        <Paragraph>{symptom.label}</Paragraph>
                      </View>
                    ))}
                  </View>
                ))}
                
                {/* Duration fields for selected symptoms */}
                {values.symptoms.cough && (
                  <View style={styles.durationContainer}>
                    <Paragraph>Cough duration (weeks):</Paragraph>
                    <TextInput
                      style={styles.durationInput}
                      keyboardType="numeric"
                      value={values.symptoms.cough_duration_weeks || ''}
                      onChangeText={(text) => 
                        setFieldValue('symptoms.cough_duration_weeks', text)
                      }
                    />
                  </View>
                )}
                
                <Divider style={styles.divider} />
                
                <Title style={styles.sectionTitle}>Vital Signs (Optional)</Title>
                <View style={styles.vitalsContainer}>
                  <View style={styles.vitalRow}>
                    <TextInput
                      label="Temperature (°C)"
                      value={values.temperature}
                      onChangeText={(text) => setFieldValue('temperature', text)}
                      keyboardType="numeric"
                      style={styles.vitalInput}
                      placeholder="37.0"
                    />
                    <TextInput
                      label="Heart Rate (bpm)"
                      value={values.heart_rate}
                      onChangeText={(text) => setFieldValue('heart_rate', text)}
                      keyboardType="numeric"
                      style={styles.vitalInput}
                      placeholder="80"
                    />
                  </View>
                  
                  <View style={styles.vitalRow}>
                    <TextInput
                      label="Respiratory Rate"
                      value={values.respiratory_rate}
                      onChangeText={(text) => setFieldValue('respiratory_rate', text)}
                      keyboardType="numeric"
                      style={styles.vitalInput}
                      placeholder="16"
                    />
                    <TextInput
                      label="Systolic BP (mmHg)"
                      value={values.systolic_bp}
                      onChangeText={(text) => setFieldValue('systolic_bp', text)}
                      keyboardType="numeric"
                      style={styles.vitalInput}
                      placeholder="120"
                    />
                  </View>
                  
                  <TextInput
                    label="Oxygen Saturation (%)"
                    value={values.oxygen_saturation}
                    onChangeText={(text) => setFieldValue('oxygen_saturation', text)}
                    keyboardType="numeric"
                    style={styles.fullWidthVitalInput}
                    placeholder="98"
                  />
                </View>
                
                <Divider style={styles.divider} />
                
                <Title style={styles.sectionTitle}>Medical Images</Title>
                <View style={styles.imagesContainer}>
                  {images.length > 0 ? (
                    <Paragraph>{images.length} image(s) added</Paragraph>
                  ) : (
                    <Paragraph>No images added</Paragraph>
                  )}
                  <Button 
                    mode="outlined" 
                    onPress={handleAddImage}
                    style={styles.addButton}
                  >
                    Add Image
                  </Button>
                </View>
                
                <Divider style={styles.divider} />
                
                <Title style={styles.sectionTitle}>AI-Enhanced Diagnosis</Title>
                <View style={styles.toggleContainer}>
                  <Paragraph>Enable AI-powered analysis for more comprehensive diagnosis</Paragraph>
                  <Checkbox
                    status={useLLM ? 'checked' : 'unchecked'}
                    onPress={() => setUseLLM(!useLLM)}
                  />
                </View>
                
                {useLLM && (
                  <View>
                    <Title style={styles.sectionTitle}>Medical History</Title>
                    <TextInput
                      multiline
                      numberOfLines={4}
                      value={medicalHistory}
                      onChangeText={setMedicalHistory}
                      style={styles.notesInput}
                      placeholder="Enter patient's medical history, previous conditions, medications, allergies, family history..."
                    />
                  </View>
                )}
                
                <Divider style={styles.divider} />
                
                <Title style={styles.sectionTitle}>Additional Notes</Title>
                <TextInput
                  multiline
                  numberOfLines={4}
                  value={values.notes}
                  onChangeText={(text) => setFieldValue('notes', text)}
                  onBlur={handleBlur('notes')}
                  style={styles.notesInput}
                />
                
                <View style={styles.buttonContainer}>
                  <Button 
                    mode="contained" 
                    onPress={handleSubmit}
                    disabled={isSubmitting || !patient}
                    style={styles.submitButton}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator animating={true} color="white" />
                    ) : (
                      isOffline ? 'Save Offline' : useLLM ? 'Submit AI-Enhanced Diagnosis' : 'Submit Diagnosis'
                    )}
                  </Button>
                </View>
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
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  patientInfo: {
    marginTop: 8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 16,
  },
  vitalsContainer: {
    marginBottom: 16,
  },
  vitalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vitalInput: {
    flex: 0.48,
  },
  fullWidthVitalInput: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  diseaseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  durationInput: {
    width: 80,
    marginLeft: 8,
    height: 40,
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addButton: {
    marginLeft: 16,
  },
  notesInput: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  submitButton: {
    paddingVertical: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});

// Main wrapper component with error handling
const DiagnosisScreen = () => {
  return (
    <ErrorBoundary>
      <DiagnosisScreenContent />
    </ErrorBoundary>
  );
};

export default DiagnosisScreen;

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Share, Platform } from 'react-native';
import { Text, Card, Button, Divider, Chip, ActivityIndicator, useTheme, IconButton, Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOffline } from '../../context/OfflineContext';
import { makeApiRequest, getErrorMessage, getErrorType, ERROR_TYPES } from '../../utils/apiUtils';
import { API_BASE_URL } from '../../utils/apiConfig';

// Use centralized API base URL from config

const DiagnosisDetailsScreen = ({ route, navigation }) => {
  const { diagnosisId } = route.params;
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isOffline } = useOffline();
  const theme = useTheme();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadDiagnosis();
  }, [diagnosisId]);

  const loadDiagnosis = async () => {
    setLoading(true);
    try {
      if (isOffline) {
        // Try to get diagnosis from local storage
        const storedDiagnoses = await AsyncStorage.getItem('offlineDiagnoses');
        if (storedDiagnoses) {
          const allDiagnoses = JSON.parse(storedDiagnoses);
          const foundDiagnosis = allDiagnoses.find(d => d.id === diagnosisId);
          if (foundDiagnosis) {
            setDiagnosis(foundDiagnosis);
            return;
          }
        }
        // If not found in offline storage, use mock data
        setDiagnosis(generateMockDiagnosis(diagnosisId));
      } else {
        // Online mode - fetch from API
        const response = await makeApiRequest({
          method: 'GET',
          url: `${API_BASE_URL}/diagnoses/${diagnosisId}`,
        });
        setDiagnosis(response.data);
      }
    } catch (error) {
      console.error('Error loading diagnosis:', error);
      // Fallback to mock data
      setDiagnosis(generateMockDiagnosis(diagnosisId));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!diagnosis) return;

    const diagnosisInfo = `
Patient: ${diagnosis.patient_name}
Disease: ${diagnosis.disease_type || 'General Assessment'}
AI Diagnosis: ${diagnosis.ai_diagnosis}
Confidence: ${diagnosis.confidence}%
Status: ${diagnosis.status.toUpperCase()}
Date: ${formatDate(diagnosis.created_at)}
`;

    const shareTitle = `Diagnosis for ${diagnosis.patient_name}`;
    const shareMessage = `Diagnosis Details${diagnosisInfo}`;

    try {
      if (Platform.OS === 'web') {
        // Try Web Share API first
        const payload = { title: shareTitle, text: shareMessage };
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share(payload);
          setSnackbarMessage('Shared via browser share');
          setSnackbarVisible(true);
          return;
        }
        // Fallback to clipboard on web
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareMessage);
          setSnackbarMessage('Copied diagnosis details to clipboard');
          setSnackbarVisible(true);
          return;
        }
        // Final fallback: show info
        setSnackbarMessage('Share not supported in this browser');
        setSnackbarVisible(true);
        return;
      }

      // Native share for iOS/Android
      await Share.share({ message: shareMessage, title: shareTitle });
    } catch (error) {
      console.error('Error sharing diagnosis:', error);
      setSnackbarMessage('Unable to share on this platform');
      setSnackbarVisible(true);
    }
  };

  const handlePatientHistory = () => {
    if (diagnosis && diagnosis.patient_id) {
      navigation.navigate('PatientHistory', { patientId: diagnosis.patient_id });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Generate mock diagnosis for demonstration
  const generateMockDiagnosis = (id) => {
    const diseases = ['Tuberculosis', 'Pneumonia', 'Malaria', 'Lung Cancer'];
    const diseaseIndex = Math.floor(Math.random() * diseases.length);
    const symptoms = [
      ['Persistent cough', 'Chest pain', 'Weight loss', 'Night sweats', 'Fatigue'],
      ['Fever', 'Cough with phlegm', 'Shortness of breath', 'Chest pain', 'Fatigue'],
      ['Fever', 'Chills', 'Headache', 'Nausea', 'Muscle pain'],
      ['Persistent cough', 'Coughing up blood', 'Chest pain', 'Weight loss', 'Shortness of breath'],
    ];
    
    const treatmentPlans = [
      'Six-month regimen of isoniazid, rifampin, ethambutol, and pyrazinamide. Monitor liver function. Follow-up chest X-ray in 2 months.',
      'Amoxicillin 500mg three times daily for 7 days. Rest, hydration, and antipyretics as needed. Follow-up in 3 days if not improving.',
      'Artemisinin-based combination therapy for 3 days. Antipyretics for fever. Increase fluid intake. Follow-up blood test in 7 days.',
      'Refer to oncology specialist immediately. CT-guided biopsy recommended. Staging workup needed before treatment planning.'
    ];

    const statuses = ['pending', 'confirmed', 'rejected'];
    const statusIndex = Math.floor(Math.random() * statuses.length);

    return {
      id: parseInt(id),
      patient_id: 100 + parseInt(id),
      patient_name: `Patient ${100 + parseInt(id)}`,
      patient_age: 30 + Math.floor(Math.random() * 40),
      patient_gender: Math.random() > 0.5 ? 'Male' : 'Female',
      disease_type: diseases[diseaseIndex],
      symptoms: symptoms[diseaseIndex],
      medical_history: 'Hypertension, Type 2 Diabetes',
      ai_diagnosis: diseases[diseaseIndex],
      ai_diagnosis_details: `Based on the symptoms and image analysis, the AI system has detected patterns consistent with ${diseases[diseaseIndex]}.`,
      ai_treatment_plan: treatmentPlans[diseaseIndex],
      specialist_feedback: statusIndex === 2 ? 'Additional tests needed to confirm diagnosis. Please collect sputum sample and send for culture.' : '',
      treatment_plan: statusIndex === 1 ? treatmentPlans[diseaseIndex] : '',
      confidence: 70 + Math.floor(Math.random() * 25),
      status: statuses[statusIndex],
      urgency: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      updated_at: new Date(Date.now() - Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000)).toISOString(),
      frontline_worker: `Dr. Smith (ID: ${200 + parseInt(id)})`,
      specialist: statusIndex !== 0 ? `Dr. Johnson (ID: ${300 + parseInt(id)})` : '',
      frontline_worker_notes: 'Patient presented with symptoms that have been worsening over the past two weeks. No improvement with over-the-counter medications.',
      medical_images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ],
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading diagnosis details...</Text>
      </View>
    );
  }

  if (!diagnosis) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Diagnosis not found</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  const statusColors = {
    pending: '#FFA000',
    confirmed: '#4CAF50',
    rejected: '#F44336',
  };

  const urgencyColors = {
    high: '#F44336',
    medium: '#FFA000',
    low: '#4CAF50',
  };
  
  return (
    <>
    <ScrollView style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You are offline. Some data may not be up to date.</Text>
        </View>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Diagnosis Details</Text>
              <Text style={styles.subtitle}>
                Submitted: {formatDate(diagnosis.created_at)}
              </Text>
            </View>
            <View style={styles.statusContainer}>
              <Chip
                style={[styles.statusChip, { backgroundColor: statusColors[diagnosis.status] }]}
                textStyle={styles.statusText}
              >
                {diagnosis.status.toUpperCase()}
              </Chip>
              {diagnosis.urgency && (
                <Chip
                  style={[styles.urgencyChip, { backgroundColor: urgencyColors[diagnosis.urgency] }]}
                  textStyle={styles.statusText}
                >
                  {diagnosis.urgency.toUpperCase()}
                </Chip>
              )}
            </View>
          </View>

          <Card style={styles.sectionCard}>
            <Card.Title title="Patient Information" />
            <Card.Content>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{diagnosis.patient_name}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>ID</Text>
                  <Text style={styles.infoValue}>{diagnosis.patient_id}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Age</Text>
                  <Text style={styles.infoValue}>{diagnosis.patient_age}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{diagnosis.patient_gender}</Text>
                </View>
              </View>
              {diagnosis.medical_history && (
                <View style={styles.fullWidthInfo}>
                  <Text style={styles.infoLabel}>Medical History</Text>
                  <Text style={styles.infoValue}>{diagnosis.medical_history}</Text>
                </View>
              )}
              <Button
                mode="outlined"
                icon="history"
                onPress={handlePatientHistory}
                style={styles.historyButton}
              >
                View Patient History
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.sectionCard}>
            <Card.Title title="Diagnosis Information" />
            <Card.Content>
              <View style={styles.fullWidthInfo}>
                <Text style={styles.infoLabel}>Disease Type</Text>
                <Text style={styles.infoValue}>
                  {diagnosis.disease_type || 'General Assessment'}
                </Text>
              </View>
              <View style={styles.fullWidthInfo}>
                <Text style={styles.infoLabel}>Symptoms</Text>
                <View style={styles.symptomsContainer}>
                  {(() => {
                    const sym = diagnosis.symptoms;
                    const normalizedSymptoms = Array.isArray(sym)
                      ? sym
                      : typeof sym === 'string'
                        ? sym.split(',').map(s => s.trim()).filter(Boolean)
                        : sym && typeof sym === 'object'
                          ? Object.keys(sym).filter(k => sym[k])
                          : [];
                    return normalizedSymptoms.map((symptom, index) => (
                      <Chip key={index} style={styles.symptomChip}>
                        {symptom}
                      </Chip>
                    ));
                  })()}
                </View>
              </View>
              {diagnosis.frontline_worker_notes && (
                <View style={styles.fullWidthInfo}>
                  <Text style={styles.infoLabel}>Frontline Worker Notes</Text>
                  <Text style={styles.infoValue}>
                    {diagnosis.frontline_worker_notes}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.sectionCard}>
            <Card.Title title="AI Diagnosis" />
            <Card.Content>
              <View style={styles.aiDiagnosisContainer}>
                <View style={styles.aiDiagnosisHeader}>
                  <Text style={styles.aiDiagnosisTitle}>
                    {diagnosis.ai_diagnosis}
                  </Text>
                  <Chip style={styles.confidenceChip}>
                    {diagnosis.confidence}% Confidence
                  </Chip>
                </View>
                {diagnosis.ai_diagnosis_details && (
                  <Text style={styles.aiDiagnosisDetails}>
                    {diagnosis.ai_diagnosis_details}
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>

          {diagnosis.medical_images && diagnosis.medical_images.length > 0 && (
            <Card style={styles.sectionCard}>
              <Card.Title title="Medical Images" />
              <Card.Content>
                <ScrollView horizontal style={styles.imagesScrollView}>
                  {diagnosis.medical_images.map((image, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image
                        source={{ uri: image }}
                        style={styles.medicalImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.imageLabel}>Image {index + 1}</Text>
                    </View>
                  ))}
                </ScrollView>
              </Card.Content>
            </Card>
          )}

          {diagnosis.status !== 'pending' && (
            <Card style={styles.sectionCard}>
              <Card.Title title="Specialist Review" />
              <Card.Content>
                {diagnosis.specialist && (
                  <View style={styles.fullWidthInfo}>
                    <Text style={styles.infoLabel}>Reviewed By</Text>
                    <Text style={styles.infoValue}>{diagnosis.specialist}</Text>
                  </View>
                )}
                {diagnosis.specialist_feedback && (
                  <View style={styles.fullWidthInfo}>
                    <Text style={styles.infoLabel}>Specialist Feedback</Text>
                    <Text style={styles.infoValue}>{diagnosis.specialist_feedback}</Text>
                  </View>
                )}
                {diagnosis.status === 'confirmed' && diagnosis.treatment_plan && (
                  <View style={styles.fullWidthInfo}>
                    <Text style={styles.infoLabel}>Treatment Plan</Text>
                    <Text style={styles.infoValue}>{diagnosis.treatment_plan}</Text>
                  </View>
                )}
                {diagnosis.updated_at && (
                  <Text style={styles.reviewDate}>
                    Reviewed on {formatDate(diagnosis.updated_at)}
                  </Text>
                )}
              </Card.Content>
            </Card>
          )}

          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              icon="share"
              onPress={handleShare}
              style={styles.actionButton}
            >
              Share
            </Button>
            <Button
              mode="contained"
              icon="account-group"
              onPress={() => navigation.navigate('FrontlineHome', { screen: 'Patients' })}
              style={styles.actionButton}
            >
              Patients
            </Button>
            <Button
              mode="outlined"
              icon="arrow-left"
              onPress={() => navigation.goBack()}
              style={styles.actionButton}
            >
              Back
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
    <Snackbar
      visible={snackbarVisible}
      onDismiss={() => setSnackbarVisible(false)}
      duration={3000}
    >
      {snackbarMessage}
    </Snackbar>
  </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  offlineBanner: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 5,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineText: {
    color: '#856404',
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 5,
  },
  statusChip: {
    height: 28,
  },
  urgencyChip: {
    height: 28,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fullWidthInfo: {
    marginBottom: 16,
  },
  historyButton: {
    marginTop: 8,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  symptomChip: {
    margin: 4,
  },
  aiDiagnosisContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
  },
  aiDiagnosisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiDiagnosisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  confidenceChip: {
    backgroundColor: '#2196F3',
  },
  aiDiagnosisDetails: {
    fontSize: 14,
    lineHeight: 20,
  },
  imagesScrollView: {
    flexDirection: 'row',
  },
  imageContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  medicalImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  imageLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  backButton: {
    paddingHorizontal: 20,
  },
});

export default DiagnosisDetailsScreen;

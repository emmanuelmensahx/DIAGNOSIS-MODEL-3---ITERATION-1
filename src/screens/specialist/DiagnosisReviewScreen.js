import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, Button, TextInput, Chip, ActivityIndicator, useTheme, Dialog, Portal } from 'react-native-paper';
import { ErrorBoundary, useToast, LoadingSpinner, NetworkStatus, OfflineBanner, FormSubmitButton } from '../../components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOffline } from '../../context/OfflineContext';
import { makeApiRequest, getErrorMessage, getErrorType, ERROR_TYPES } from '../../utils/apiUtils';
import { API_BASE_URL } from '../../utils/apiConfig';

// Use centralized API base URL from config

const DiagnosisReviewScreenContent = ({ route, navigation }) => {
  const { diagnosisId } = route.params;
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [alternativeDiagnosis, setAlternativeDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const { isOffline } = useOffline();
  const theme = useTheme();
  const { showToast } = useToast();

  // Load diagnosis data
  useEffect(() => {
    loadDiagnosis();
  }, [diagnosisId]);

  const loadDiagnosis = async () => {
    if (isOffline) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await makeApiRequest({
        method: 'GET',
        url: `${API_BASE_URL}/diagnoses/${diagnosisId}`,
      }, {
        onRetry: (attempt, delay) => {
          showToast(`Retrying request... (attempt ${attempt})`, 'info');
        }
      });
      setDiagnosis(response.data);
      
      // Pre-fill treatment plan if AI suggested one
      if (response.data.ai_treatment_plan) {
        setTreatmentPlan(response.data.ai_treatment_plan);
      }
    } catch (error) {
      console.error('Error loading diagnosis:', error);
      const errorMessage = getErrorMessage(error);
      showToast(`Failed to load diagnosis: ${errorMessage}`, 'error');
      
      // Use mock data for demonstration
      const mockDiagnosis = generateMockDiagnosis(diagnosisId);
      setDiagnosis(mockDiagnosis);
      
      // Pre-fill treatment plan if AI suggested one
      if (mockDiagnosis.ai_treatment_plan) {
        setTreatmentPlan(mockDiagnosis.ai_treatment_plan);
      }
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Handle diagnosis confirmation
  const handleConfirm = async () => {
    if (!treatmentPlan.trim()) {
      showToast('Please provide a treatment plan before confirming.', 'error');
      return;
    }
    
    setDialogAction('confirm');
    setConfirmDialogVisible(true);
  };

  // Handle diagnosis rejection
  const handleReject = () => {
    if (!feedback.trim()) {
      showToast('Please provide feedback before rejecting.', 'error');
      return;
    }
    
    setDialogAction('reject');
    setRejectDialogVisible(true);
  };

  // Submit diagnosis review
  const submitReview = async (action) => {
    if (isOffline) {
      showToast('Cannot submit review while offline.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        status: action === 'confirm' ? 'confirmed' : 'rejected',
        specialist_feedback: feedback,
        alternative_diagnosis: alternativeDiagnosis,
        treatment_plan: treatmentPlan,
      };

      await makeApiRequest({
        method: 'PUT',
        url: `${API_BASE_URL}/diagnoses/${diagnosisId}/review`,
        data: reviewData,
      }, {
        onRetry: (attempt, delay) => {
          showToast(`Retrying submission... (attempt ${attempt})`, 'info');
        }
      });

      showToast(`Diagnosis ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully.`, 'success');
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = getErrorMessage(error);
      showToast(`Failed to submit review: ${errorMessage}`, 'error');
    } finally {
      setSubmitting(false);
      setConfirmDialogVisible(false);
      setRejectDialogVisible(false);
    }
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
      confidence: 70 + Math.floor(Math.random() * 25),
      status: 'pending',
      urgency: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      frontline_worker: `Dr. Smith (ID: ${200 + parseInt(id)})`,
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
        <LoadingSpinner message="Loading diagnosis details..." />
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
    <ScrollView style={styles.container}>
      <NetworkStatus />
      <OfflineBanner />
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Diagnosis Review</Text>
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

          <Card style={styles.sectionCard}>
            <Card.Title title="Specialist Review" />
            <Card.Content>
              <TextInput
                label="Feedback"
                value={feedback}
                onChangeText={setFeedback}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.textInput}
                disabled={diagnosis.status !== 'pending' || isOffline}
              />

              <TextInput
                label="Alternative Diagnosis (if applicable)"
                value={alternativeDiagnosis}
                onChangeText={setAlternativeDiagnosis}
                mode="outlined"
                style={styles.textInput}
                disabled={diagnosis.status !== 'pending' || isOffline}
              />

              <TextInput
                label="Treatment Plan"
                value={treatmentPlan}
                onChangeText={setTreatmentPlan}
                mode="outlined"
                multiline
                numberOfLines={6}
                style={styles.textInput}
                disabled={diagnosis.status !== 'pending' || isOffline}
              />
            </Card.Content>
          </Card>

          {diagnosis.status === 'pending' && !isOffline && (
            <View style={styles.actionsContainer}>
              <FormSubmitButton
                title="Confirm Diagnosis"
                onPress={handleConfirm}
                loading={submitting && dialogAction === 'confirm'}
                disabled={submitting}
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                icon="check"
              />
              <FormSubmitButton
                title="Reject Diagnosis"
                onPress={handleReject}
                loading={submitting && dialogAction === 'reject'}
                disabled={submitting}
                style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                icon="close"
              />
            </View>
          )}

          {(diagnosis.status !== 'pending' || isOffline) && (
            <View style={styles.statusMessageContainer}>
              {isOffline ? (
                <Text style={styles.offlineMessage}>
                  You are offline. Diagnosis review is not available in offline mode.
                </Text>
              ) : (
                <Text style={styles.statusMessage}>
                  This diagnosis has already been {diagnosis.status}.
                </Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={confirmDialogVisible} onDismiss={() => setConfirmDialogVisible(false)}>
          <Dialog.Title>Confirm Diagnosis</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to confirm this diagnosis?</Text>
            <Text style={styles.dialogText}>
              Disease: {diagnosis.ai_diagnosis}
            </Text>
            <Text style={styles.dialogText}>
              Treatment: {treatmentPlan.substring(0, 100)}...
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialogVisible(false)}>Cancel</Button>
            <Button onPress={() => submitReview('confirm')} loading={submitting}>
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={rejectDialogVisible} onDismiss={() => setRejectDialogVisible(false)}>
          <Dialog.Title>Reject Diagnosis</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to reject this diagnosis?</Text>
            <Text style={styles.dialogText}>
              Feedback: {feedback.substring(0, 100)}...
            </Text>
            {alternativeDiagnosis && (
              <Text style={styles.dialogText}>
                Alternative: {alternativeDiagnosis}
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRejectDialogVisible(false)}>Cancel</Button>
            <Button onPress={() => submitReview('reject')} loading={submitting}>
              Reject
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
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
  textInput: {
    marginBottom: 16,
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
  statusMessageContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    alignItems: 'center',
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  offlineMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    textAlign: 'center',
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
  dialogText: {
    marginTop: 8,
    color: '#666',
  },
});

const DiagnosisReviewScreen = (props) => {
  return (
    <ErrorBoundary>
      <DiagnosisReviewScreenContent {...props} />
    </ErrorBoundary>
  );
};

export default DiagnosisReviewScreen;

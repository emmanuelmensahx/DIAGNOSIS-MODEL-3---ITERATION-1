import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Divider, IconButton, useTheme } from 'react-native-paper';
import { ErrorBoundary, useToast, LoadingSpinner, NetworkStatus, OfflineBanner, ErrorMessage } from '../../components';
import { getPatientById, updatePatient } from '../../services/patientService';
import { getPatientDiagnoses } from '../../services/diagnosisService';
import { useOffline } from '../../context/OfflineContext';

const PatientDetailsScreenContent = ({ route, navigation }) => {
  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diagnosesLoading, setDiagnosesLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOffline } = useOffline();
  const theme = useTheme();
  const { showToast } = useToast();

  // Load patient data
  useEffect(() => {
    loadPatient();
    loadDiagnoses();
  }, [patientId]);

  const loadPatient = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPatientById(patientId);
      setPatient(data);
    } catch (error) {
      console.error('Error loading patient:', error);
      setError('Failed to load patient details');
      showToast('Failed to load patient details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDiagnoses = async () => {
    setDiagnosesLoading(true);
    try {
      const data = await getPatientDiagnoses(patientId, { page: 1, size: 50 });
      const items = Array.isArray(data) ? data : [];
      setDiagnoses(items);
    } catch (error) {
      console.error('Error loading diagnoses:', error);
      setDiagnoses([]);
    } finally {
      setDiagnosesLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render diagnosis card
  const renderDiagnosisCard = (diagnosis) => {
    const isLocal = String(diagnosis.id).startsWith('local_');
    const statusColor = {
      pending: '#FFA000',
      confirmed: '#4CAF50',
      rejected: '#F44336',
    }[diagnosis.status] || '#757575';

    return (
      <Card key={diagnosis.id} style={styles.diagnosisCard}>
        <Card.Content>
          <View style={styles.diagnosisHeader}>
            <Text style={styles.diagnosisDate}>
              {formatDate(diagnosis.created_at)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>
                {isLocal ? 'Offline' : diagnosis.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.diagnosisTitle}>
            {diagnosis.disease_type || 'General Assessment'}
          </Text>
          <Text style={styles.diagnosisSymptoms}>
            Symptoms: {diagnosis.symptoms.join(', ')}
          </Text>
          {diagnosis.ai_diagnosis && (
            <Text style={styles.aiDiagnosis}>
              AI Diagnosis: {diagnosis.ai_diagnosis}
              {diagnosis.confidence && ` (${diagnosis.confidence}% confidence)`}
            </Text>
          )}
        </Card.Content>
        <Card.Actions>
          <Button
            mode="text"
            onPress={() =>
              navigation.navigate('DiagnosisDetails', { diagnosisId: diagnosis.id })
            }
          >
            View Details
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading patient details..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadPatient}
        showRetry={true}
      />
    );
  }

  if (!patient) {
    return (
      <ErrorMessage
        message="Patient not found"
        onRetry={() => navigation.goBack()}
        retryText="Go Back"
        showRetry={true}
      />
    );
  }

  const isLocalPatient = String(patient.id).startsWith('local_');

  return (
    <ScrollView style={styles.container}>
      <NetworkStatus />
      <OfflineBanner />
      
      <Card style={styles.patientCard}>
        <Card.Content>
          <View style={styles.patientHeader}>
            <View>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientId}>
                ID: {isLocalPatient ? 'Pending' : patient.id}
              </Text>
            </View>
            <IconButton
              icon="pencil"
              size={24}
              onPress={() =>
                navigation.navigate('EditPatient', { patient })
              }
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{patient.age}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{patient.gender}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Blood Type</Text>
              <Text style={styles.infoValue}>{patient.blood_type || 'Unknown'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Height</Text>
              <Text style={styles.infoValue}>
                {patient.height ? `${patient.height} cm` : 'N/A'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Weight</Text>
              <Text style={styles.infoValue}>
                {patient.weight ? `${patient.weight} kg` : 'N/A'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>BMI</Text>
              <Text style={styles.infoValue}>
                {patient.height && patient.weight
                  ? (patient.weight / ((patient.height / 100) ** 2)).toFixed(1)
                  : 'N/A'}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactInfo}>
            <Text>Phone: {patient.phone || 'N/A'}</Text>
            <Text>Email: {patient.email || 'N/A'}</Text>
            <Text>Address: {patient.address || 'N/A'}</Text>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.sectionTitle}>Medical Information</Text>
          <View style={styles.medicalInfo}>
            <Text>Allergies: {patient.allergies || 'None reported'}</Text>
            <Text>Chronic Conditions: {patient.chronic_conditions || 'None reported'}</Text>
            <Text>Current Medications: {patient.current_medications || 'None reported'}</Text>
          </View>

          {patient.notes && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text>{patient.notes}</Text>
            </>
          )}
        </Card.Content>
      </Card>

      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          icon="stethoscope"
          onPress={() =>
            navigation.navigate('NewDiagnosis', { patientId: patient.id })
          }
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
        >
          New Diagnosis
        </Button>
        <Button
          mode="outlined"
          icon="history"
          onPress={() =>
            navigation.navigate('PatientHistory', { patientId: patient.id })
          }
          style={styles.actionButton}
        >
          Full History
        </Button>
      </View>

      <Text style={styles.diagnosesTitle}>Recent Diagnoses</Text>
      {diagnosesLoading ? (
        <View style={styles.diagnosesLoadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text>Loading diagnoses...</Text>
        </View>
      ) : diagnoses.length === 0 ? (
        <Card style={styles.emptyDiagnosesCard}>
          <Card.Content>
            <Text style={styles.emptyDiagnosesText}>No diagnoses found</Text>
          </Card.Content>
        </Card>
      ) : (
        diagnoses
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(renderDiagnosisCard)
      )}

      {isOffline && (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>You are offline. Some features may be limited.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
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
  patientCard: {
    marginBottom: 16,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  patientId: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    marginVertical: 16,
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
    fontSize: 12,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactInfo: {
    marginBottom: 16,
  },
  medicalInfo: {
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  diagnosesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  diagnosesLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyDiagnosesCard: {
    marginBottom: 16,
  },
  emptyDiagnosesText: {
    textAlign: 'center',
    color: '#666',
  },
  diagnosisCard: {
    marginBottom: 16,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosisDate: {
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  diagnosisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  diagnosisSymptoms: {
    marginBottom: 8,
  },
  aiDiagnosis: {
    fontStyle: 'italic',
  },
  offlineContainer: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 5,
    marginVertical: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#856404',
  },
});

// Wrapper component with error handling
const PatientDetailsScreen = ({ route, navigation }) => {
  return (
    <ErrorBoundary>
      <PatientDetailsScreenContent route={route} navigation={navigation} />
    </ErrorBoundary>
  );
};

export default PatientDetailsScreen;

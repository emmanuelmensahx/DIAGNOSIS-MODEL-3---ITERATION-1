import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Divider, Chip, ActivityIndicator, useTheme, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOffline } from '../../context/OfflineContext';
import { makeApiRequest, getErrorMessage, getErrorType, ERROR_TYPES } from '../../utils/apiUtils';
import { API_BASE_URL } from '../../utils/apiConfig';

// Use centralized API base URL from config

const PatientHistoryScreen = ({ route, navigation }) => {
  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline } = useOffline();
  const theme = useTheme();

  useEffect(() => {
    if (!patientId) return;
    loadPatientData();
  }, [patientId]);

  // Guard missing patientId to prevent invalid navigation and API calls
  if (!patientId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Patient information is missing. Please navigate from Patient Details or ensure a valid patientId is provided.
        </Text>
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

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // Load patient details
      await loadPatient();
      // Load patient diagnoses
      await loadDiagnoses();
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPatient = async () => {
    try {
      if (isOffline) {
        // Try to get patient from local storage
        const storedPatients = await AsyncStorage.getItem('offlinePatients');
        if (storedPatients) {
          const patients = JSON.parse(storedPatients);
          const foundPatient = patients.find(p => p.id === patientId);
          if (foundPatient) {
            setPatient(foundPatient);
            return;
          }
        }
        // If not found in offline storage, use mock data
        setPatient(generateMockPatient(patientId));
      } else {
        // Online mode - fetch from API
        const response = await makeApiRequest({
          method: 'GET',
          url: `${API_BASE_URL}/patients/${patientId}`,
        });
        setPatient(response.data);
      }
    } catch (error) {
      console.error('Error loading patient:', error);
      // Fallback to mock data
      setPatient(generateMockPatient(patientId));
    }
  };

  const loadDiagnoses = async () => {
    try {
      if (isOffline) {
        // Try to get diagnoses from local storage
        const storedDiagnoses = await AsyncStorage.getItem('offlineDiagnoses');
        if (storedDiagnoses) {
          const allDiagnoses = JSON.parse(storedDiagnoses);
          const patientDiagnoses = allDiagnoses.filter(d => d.patient_id === patientId);
          setDiagnoses(patientDiagnoses);
          return;
        }
        // If not found in offline storage, use mock data
        setDiagnoses(generateMockDiagnoses(patientId));
      } else {
        // Online mode - fetch from API (backend returns paginated object)
        const response = await makeApiRequest({
          method: 'GET',
          url: `${API_BASE_URL}/patients/${patientId}/diagnoses`,
          params: { page: 1, size: 50 },
        });
        const payload = response?.data;
        const items = Array.isArray(payload) ? payload : (payload?.items || []);
        setDiagnoses(items);
      }
    } catch (error) {
      console.error('Error loading diagnoses:', error);
      // Fallback to mock data
      setDiagnoses(generateMockDiagnoses(patientId));
    }
  };

  const onRefresh = async () => {
    if (isOffline) return;
    setRefreshing(true);
    await loadPatientData();
  };

  const handleNewDiagnosis = () => {
    navigation.navigate('NewDiagnosis', { patientId });
  };

  const handleViewDiagnosis = (diagnosisId) => {
    navigation.navigate('DiagnosisDetails', { diagnosisId });
  };

  const handleEditPatient = () => {
    navigation.navigate('EditPatient', { patientId });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Generate mock patient data for demonstration
  const generateMockPatient = (id) => {
    return {
      id: parseInt(id),
      name: `Patient ${id}`,
      age: 30 + Math.floor(Math.random() * 40),
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      contact_number: `+123456789${id.toString().padStart(2, '0')}`,
      address: '123 Main St, Rural Village, Sub-Saharan Africa',
      medical_history: [
        'Hypertension',
        'Type 2 Diabetes',
        'Malaria (2019)',
      ],
      allergies: ['Penicillin'],
      blood_type: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'][Math.floor(Math.random() * 8)],
      created_at: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
    };
  };

  // Generate mock diagnoses for demonstration
  const generateMockDiagnoses = (patientId) => {
    const count = 3 + Math.floor(Math.random() * 5);
    const diagnoses = [];
    const diseases = ['Tuberculosis', 'Pneumonia', 'Malaria', 'Lung Cancer', 'Common Cold', 'Influenza'];
    const statuses = ['pending', 'confirmed', 'rejected'];
    
    for (let i = 0; i < count; i++) {
      const diseaseIndex = Math.floor(Math.random() * diseases.length);
      const statusIndex = Math.floor(Math.random() * statuses.length);
      const date = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
      
      diagnoses.push({
        id: 1000 + i,
        patient_id: parseInt(patientId),
        disease_type: diseases[diseaseIndex],
        symptoms: ['Fever', 'Cough', 'Fatigue', 'Shortness of breath'].slice(0, 2 + Math.floor(Math.random() * 3)),
        ai_diagnosis: diseases[diseaseIndex],
        confidence: 70 + Math.floor(Math.random() * 25),
        status: statuses[statusIndex],
        created_at: date.toISOString(),
        updated_at: new Date(date.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        treatment: statusIndex === 1 ? 'Prescribed medication and rest' : null,
      });
    }
    
    // Sort by date (newest first)
    return diagnoses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading patient history...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Patient not found</Text>
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You are offline. Some data may not be up to date.</Text>
        </View>
      )}

      <Card style={styles.patientCard}>
        <Card.Content>
          <View style={styles.patientHeader}>
            <View>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientId}>ID: {patient.id}</Text>
            </View>
            <IconButton
              icon="pencil"
              size={20}
              onPress={handleEditPatient}
              disabled={isOffline}
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
          
          <View style={styles.contactInfo}>
            <Text style={styles.infoLabel}>Contact</Text>
            <Text style={styles.infoValue}>{patient.contact_number}</Text>
          </View>
          
          <View style={styles.contactInfo}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{patient.address}</Text>
          </View>
          
          <View style={styles.medicalHistorySection}>
            <Text style={styles.sectionTitle}>Medical History</Text>
            {patient.medical_history && patient.medical_history.length > 0 ? (
              <View style={styles.chipContainer}>
                {patient.medical_history.map((item, index) => (
                  <Chip key={index} style={styles.chip}>{item}</Chip>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No medical history recorded</Text>
            )}
          </View>
          
          {patient.allergies && patient.allergies.length > 0 && (
            <View style={styles.allergiesSection}>
              <Text style={styles.sectionTitle}>Allergies</Text>
              <View style={styles.chipContainer}>
                {patient.allergies.map((allergy, index) => (
                  <Chip key={index} style={[styles.chip, styles.allergyChip]}>{allergy}</Chip>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.registrationInfo}>
            <Text style={styles.registrationText}>
              Registered on {formatDate(patient.created_at)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.diagnosisHeader}>
        <Text style={styles.diagnosisTitle}>Diagnosis History</Text>
        <Button
          mode="contained"
          icon="plus"
          onPress={handleNewDiagnosis}
          disabled={isOffline}
        >
          New Diagnosis
        </Button>
      </View>

      {diagnoses.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>No diagnosis records found</Text>
          </Card.Content>
        </Card>
      ) : (
        diagnoses.map((diagnosis) => (
          <TouchableOpacity
            key={diagnosis.id}
            onPress={() => handleViewDiagnosis(diagnosis.id)}
          >
            <Card style={styles.diagnosisCard}>
              <Card.Content>
                <View style={styles.diagnosisCardHeader}>
                  <View>
                    <Text style={styles.diagnosisDisease}>{diagnosis.disease_type || 'General Assessment'}</Text>
                    <Text style={styles.diagnosisDate}>{formatDate(diagnosis.created_at)}</Text>
                  </View>
                  <Chip
                    style={[styles.statusChip, { backgroundColor: statusColors[diagnosis.status] }]}
                    textStyle={styles.statusText}
                  >
                    {diagnosis.status.toUpperCase()}
                  </Chip>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.diagnosisDetails}>
                  <View style={styles.diagnosisRow}>
                    <Text style={styles.diagnosisLabel}>AI Diagnosis:</Text>
                    <Text style={styles.diagnosisValue}>{diagnosis.ai_diagnosis}</Text>
                  </View>
                  
                  <View style={styles.diagnosisRow}>
                    <Text style={styles.diagnosisLabel}>Confidence:</Text>
                    <Text style={styles.diagnosisValue}>{diagnosis.confidence}%</Text>
                  </View>
                  
                  {(() => {
                    const sym = diagnosis.symptoms;
                    const normalizedSymptoms = Array.isArray(sym)
                      ? sym
                      : typeof sym === 'string'
                        ? sym.split(',').map(s => s.trim()).filter(Boolean)
                        : sym && typeof sym === 'object'
                          ? Object.keys(sym).filter(k => sym[k])
                          : [];
                    return normalizedSymptoms.length > 0 ? (
                      <View style={styles.symptomsContainer}>
                        <Text style={styles.diagnosisLabel}>Symptoms:</Text>
                        <View style={styles.chipContainer}>
                          {normalizedSymptoms.map((symptom, index) => (
                            <Chip key={index} style={styles.symptomChip}>{symptom}</Chip>
                          ))}
                        </View>
                      </View>
                    ) : null;
                  })()}
                  
                  {diagnosis.treatment && (
                    <View style={styles.diagnosisRow}>
                      <Text style={styles.diagnosisLabel}>Treatment:</Text>
                      <Text style={styles.diagnosisValue}>{diagnosis.treatment}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.viewDetailsContainer}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <IconButton icon="chevron-right" size={20} />
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))
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
  patientCard: {
    marginBottom: 20,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  patientId: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  contactInfo: {
    marginBottom: 12,
  },
  medicalHistorySection: {
    marginTop: 8,
    marginBottom: 12,
  },
  allergiesSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 4,
  },
  allergyChip: {
    backgroundColor: '#FFCDD2',
  },
  noDataText: {
    fontStyle: 'italic',
    color: '#666',
  },
  registrationInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  registrationText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  diagnosisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  diagnosisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyCard: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
  },
  diagnosisCard: {
    marginBottom: 16,
  },
  diagnosisCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagnosisDisease: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  diagnosisDate: {
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  diagnosisDetails: {
    marginTop: 8,
  },
  diagnosisRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  diagnosisLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  diagnosisValue: {
    fontSize: 14,
    flex: 1,
  },
  symptomsContainer: {
    marginBottom: 8,
  },
  symptomChip: {
    margin: 4,
    backgroundColor: '#E1F5FE',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  viewDetailsText: {
    color: '#2196F3',
    fontSize: 14,
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

export default PatientHistoryScreen;

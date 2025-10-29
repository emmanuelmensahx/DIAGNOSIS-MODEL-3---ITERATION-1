import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, SegmentedButtons, ActivityIndicator, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOffline } from '../../context/OfflineContext';
import { ErrorBoundary, useToast, LoadingSpinner, NetworkStatus, OfflineBanner, ErrorMessage } from '../../components';
import { makeApiRequest, getErrorMessage, getErrorType, ERROR_TYPES } from '../../utils/apiUtils';
import { API_BASE_URL } from '../../utils/apiConfig';

// Use centralized API base URL from config

const DashboardScreenContent = ({ navigation }) => {
  const [diagnoses, setDiagnoses] = useState([]);
  const [filteredDiagnoses, setFilteredDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [error, setError] = useState(null);
  const { isOffline } = useOffline();
  const { showToast } = useToast();
  const theme = useTheme();

  // Load diagnoses when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadDiagnoses();
    }, [])
  );

  // Load diagnoses from API
  const loadDiagnoses = async () => {
    if (isOffline) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await makeApiRequest({
        method: 'GET',
        url: `${API_BASE_URL}/diagnoses`,
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      }, {
        onRetry: (attempt, delay) => {
          showToast(`Retrying request... (attempt ${attempt})`, 'info');
        },
        onError: (error, attempt) => {
          console.error(`API Request failed (attempt ${attempt}):`, error);
        }
      });
      setDiagnoses(response.data);
      applyFilters(response.data, searchQuery);
    } catch (error) {
      console.error('Error loading diagnoses:', error);
      const errorMessage = getErrorMessage(error);
      const errorType = getErrorType(error);
      
      setError(errorMessage);
      
      if (errorType === ERROR_TYPES.OFFLINE || errorType === ERROR_TYPES.NETWORK) {
        showToast('No internet connection. Using demo data.', 'warning');
      } else {
        showToast(`Failed to load diagnoses: ${errorMessage}`, 'error');
      }
      
      // Use mock data for demonstration
      const mockDiagnoses = generateMockDiagnoses();
      setDiagnoses(mockDiagnoses);
      applyFilters(mockDiagnoses, searchQuery);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDiagnoses();
    setRefreshing(false);
  };

  // Apply filters based on search query
  const applyFilters = (data, query) => {
    if (!query.trim()) {
      setFilteredDiagnoses(data);
      return;
    }

    const filtered = data.filter(
      (diagnosis) =>
        diagnosis.patient_name.toLowerCase().includes(query.toLowerCase()) ||
        diagnosis.disease_type.toLowerCase().includes(query.toLowerCase()) ||
        diagnosis.symptoms.some((symptom) =>
          symptom.toLowerCase().includes(query.toLowerCase())
        )
    );
    setFilteredDiagnoses(filtered);
  };

  // Update filters when search query changes
  useEffect(() => {
    applyFilters(diagnoses, searchQuery);
  }, [searchQuery]);

  // Update diagnoses when status filter changes
  useEffect(() => {
    loadDiagnoses();
  }, [statusFilter]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render diagnosis card
  const renderDiagnosisCard = ({ item }) => {
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
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.patientName}>{item.patient_name}</Text>
              <Text style={styles.diagnosisDate}>
                Submitted: {formatDate(item.created_at)}
              </Text>
            </View>
            <View style={styles.statusContainer}>
              <Chip
                style={[styles.statusChip, { backgroundColor: statusColors[item.status] }]}
                textStyle={styles.statusText}
              >
                {item.status.toUpperCase()}
              </Chip>
              {item.urgency && (
                <Chip
                  style={[styles.urgencyChip, { backgroundColor: urgencyColors[item.urgency] }]}
                  textStyle={styles.statusText}
                >
                  {item.urgency.toUpperCase()}
                </Chip>
              )}
            </View>
          </View>

          <Text style={styles.diagnosisTitle}>
            {item.disease_type || 'General Assessment'}
          </Text>

          <View style={styles.diagnosisDetails}>
            <Text style={styles.detailLabel}>AI Diagnosis:</Text>
            <Text style={styles.detailValue}>
              {item.ai_diagnosis}
              {item.confidence && ` (${item.confidence}% confidence)`}
            </Text>
          </View>

          <View style={styles.diagnosisDetails}>
            <Text style={styles.detailLabel}>Symptoms:</Text>
            <Text style={styles.detailValue}>{item.symptoms.join(', ')}</Text>
          </View>

          {item.frontline_worker && (
            <View style={styles.diagnosisDetails}>
              <Text style={styles.detailLabel}>Submitted by:</Text>
              <Text style={styles.detailValue}>{item.frontline_worker}</Text>
            </View>
          )}
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={() =>
              navigation.navigate('DiagnosisReview', { diagnosisId: item.id })
            }
          >
            Review
          </Button>
          <Button
            mode="outlined"
            onPress={() =>
              navigation.navigate('PatientDetails', { patientId: item.patient_id })
            }
          >
            Patient Details
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  // Generate mock diagnoses for demonstration
  const generateMockDiagnoses = () => {
    const statuses = statusFilter === 'all' 
      ? ['pending', 'confirmed', 'rejected']
      : [statusFilter];
    
    const mockData = [];
    const diseases = ['Tuberculosis', 'Pneumonia', 'Malaria', 'Lung Cancer'];
    const symptoms = [
      ['Persistent cough', 'Chest pain', 'Weight loss', 'Night sweats', 'Fatigue'],
      ['Fever', 'Cough with phlegm', 'Shortness of breath', 'Chest pain', 'Fatigue'],
      ['Fever', 'Chills', 'Headache', 'Nausea', 'Muscle pain'],
      ['Persistent cough', 'Coughing up blood', 'Chest pain', 'Weight loss', 'Shortness of breath'],
    ];
    
    for (let i = 1; i <= 10; i++) {
      const diseaseIndex = Math.floor(Math.random() * diseases.length);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const urgencyLevels = ['high', 'medium', 'low'];
      
      mockData.push({
        id: i,
        patient_id: 100 + i,
        patient_name: `Patient ${100 + i}`,
        disease_type: diseases[diseaseIndex],
        symptoms: symptoms[diseaseIndex].slice(0, 3 + Math.floor(Math.random() * 3)),
        ai_diagnosis: diseases[diseaseIndex],
        confidence: 70 + Math.floor(Math.random() * 25),
        status: status,
        urgency: urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)],
        created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        frontline_worker: `Dr. Smith (ID: ${200 + i})`,
      });
    }
    
    return mockData;
  };

  return (
    <View style={styles.container}>
      <NetworkStatus />
      <OfflineBanner />
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => loadDiagnoses()}
        />
      )}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Specialist Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Review and confirm AI-assisted diagnoses
        </Text>
      </View>

      <View style={styles.filtersContainer}>
        <Searchbar
          placeholder="Search diagnoses..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          buttons={[
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'all', label: 'All' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {isOffline ? (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineTitle}>You are offline</Text>
          <Text style={styles.offlineText}>
            The specialist dashboard requires an internet connection to review diagnoses.
            Please connect to the internet and try again.
          </Text>
        </View>
      ) : loading ? (
        <LoadingSpinner message="Loading diagnoses..." />
      ) : filteredDiagnoses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {statusFilter !== 'all' ? statusFilter : ''} diagnoses found
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDiagnoses}
          renderItem={renderDiagnosisCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  searchBar: {
    marginBottom: 10,
  },
  segmentedButtons: {
    marginTop: 10,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  diagnosisDate: {
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
  diagnosisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  diagnosisDetails: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    fontWeight: 'bold',
    marginRight: 5,
    width: 100,
  },
  detailValue: {
    flex: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#856404',
  },
  offlineText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#856404',
  },
});

// Wrapper component with error handling
const DashboardScreen = (props) => {
  return (
    <ErrorBoundary>
      <DashboardScreenContent {...props} />
    </ErrorBoundary>
  );
};

export default DashboardScreen;

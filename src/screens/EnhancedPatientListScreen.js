import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  TextInput,
} from 'react-native';
import {
  ErrorBoundary,
  NetworkStatus,
  OfflineBanner,
  useNetworkStatus,
  LoadingSpinner,
  CardLoader,
  ErrorMessage,
  NetworkErrorMessage,
  ApiErrorMessage,
  ToastProvider,
  useToast,
} from '../components';
import { getPatients } from '../services/patientService';
import { ApiError, ERROR_TYPES } from '../utils/apiUtils';
import { useAuth } from '../context/AuthContext';

const PatientCard = ({ patient, onPress, loading = false }) => {
  if (loading) {
    return <CardLoader />;
  }

  return (
    <TouchableOpacity 
      style={styles.patientCard} 
      onPress={() => onPress(patient)}
      activeOpacity={0.7}
    >
      <View style={styles.patientHeader}>
        <Text style={styles.patientName}>
          {patient.first_name} {patient.last_name}
        </Text>
        <Text style={styles.patientId}>ID: {patient.id}</Text>
      </View>
      
      <View style={styles.patientDetails}>
        <Text style={styles.patientInfo}>
          Age: {patient.age} • Gender: {patient.gender}
        </Text>
        <Text style={styles.patientPhone}>{patient.phone}</Text>
      </View>
      
      {patient.last_visit && (
        <Text style={styles.lastVisit}>
          Last visit: {new Date(patient.last_visit).toLocaleDateString()}
        </Text>
      )}
      
      {patient.isOffline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const EnhancedPatientListScreen = ({ navigation }) => {
  const networkStatus = useNetworkStatus();
  const { showError, showSuccess, showWarning } = useToast();
  const { userToken, isLoading: authLoading } = useAuth();
  
  // State management
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  // Filtered patients based on search
  const filteredPatients = patients.filter(patient => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      patient.first_name?.toLowerCase().includes(query) ||
      patient.last_name?.toLowerCase().includes(query) ||
      patient.id?.toString().includes(query) ||
      patient.phone?.includes(query)
    );
  });

  // Load patients with enhanced error handling
  const loadPatients = useCallback(async (isRefresh = false) => {
    try {
      if (!userToken) {
        // Wait for auth to provide a token before fetching
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
        setError(null);
      } else {
        setLoading(true);
        setError(null);
      }

      const result = await getPatients(1, 20, '', {
        maxRetries: 2,
        onRetry: (attempt, delay, error) => {
          setRetryCount(attempt);
          showWarning(`Retrying... Attempt ${attempt + 1}`);
        },
        onError: (error, attempt) => {
          console.error(`Load patients attempt ${attempt} failed:`, error);
        },
      });

      const normalizedPatients = Array.isArray(result)
        ? result
        : (result?.patients || result?.items || []);
      setPatients(normalizedPatients);
      setRetryCount(0);
      
      if (isRefresh) {
        showSuccess('Patient list updated successfully!');
      }

    } catch (error) {
      console.error('Load patients error:', error);
      setError(error);
      
      if (error instanceof ApiError) {
        switch (error.type) {
          case ERROR_TYPES.NETWORK:
          case ERROR_TYPES.OFFLINE:
            showError('Network error. Showing cached data if available.');
            setShowOfflineBanner(true);
            break;
          case ERROR_TYPES.TIMEOUT:
            showError('Request timed out. Please try again.');
            break;
          case ERROR_TYPES.UNAUTHORIZED:
            showError('Session expired. Please log in again.');
            navigation.navigate('Login');
            break;
          case ERROR_TYPES.SERVER:
            showError('Server error. Please try again later.');
            break;
          default:
            showError(error.message || 'Failed to load patients.');
        }
      } else {
        showError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation, showError, showSuccess, showWarning, userToken]);

  // Initial load only when auth is ready and token exists
  useEffect(() => {
    if (!authLoading && userToken) {
      loadPatients();
    }
  }, [authLoading, userToken, loadPatients]);

  // Monitor network status
  useEffect(() => {
    if (networkStatus.isOffline) {
      setShowOfflineBanner(true);
      showWarning('You are offline. Showing cached data.');
    } else if (networkStatus.hasLimitedConnectivity) {
      showWarning('Limited connectivity. Some features may not work.');
    }
  }, [networkStatus, showWarning]);

  // Handle refresh
  const handleRefresh = () => {
    loadPatients(true);
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    loadPatients();
  };

  // Handle patient selection
  const handlePatientPress = (patient) => {
    navigation.navigate('PatientDetails', { patientId: patient.id });
  };

  // Handle add patient
  const handleAddPatient = () => {
    navigation.navigate('AddPatient');
  };

  // Render error state
  const renderError = () => {
    if (!error) return null;

    if (error instanceof ApiError) {
      switch (error.type) {
        case ERROR_TYPES.NETWORK:
        case ERROR_TYPES.OFFLINE:
          return (
            <NetworkErrorMessage
              onRetry={handleRetry}
              style={styles.errorContainer}
            />
          );
        default:
          return (
            <ApiErrorMessage
              error={error}
              onRetry={handleRetry}
              style={styles.errorContainer}
            />
          );
      }
    }

    return (
      <ErrorMessage
        message={error.message || 'Failed to load patients'}
        type="error"
        onRetry={handleRetry}
        style={styles.errorContainer}
      />
    );
  };

  // Render loading placeholders
  const renderLoadingPlaceholders = () => (
    <View style={styles.loadingContainer}>
      {[...Array(5)].map((_, index) => (
        <CardLoader key={index} style={styles.cardLoader} />
      ))}
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Patients Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'No patients match your search criteria'
          : 'Add your first patient to get started'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddPatient}
        >
          <Text style={styles.addButtonText}>Add Patient</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render patient item
  const renderPatientItem = ({ item }) => (
    <PatientCard
      patient={item}
      onPress={handlePatientPress}
    />
  );

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
          <Text style={styles.title}>Patients</Text>
          <TouchableOpacity 
            style={styles.addHeaderButton}
            onPress={handleAddPatient}
          >
            <Text style={styles.addHeaderButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {loading && !refreshing ? (
          renderLoadingPlaceholders()
        ) : error ? (
          renderError()
        ) : (
          <FlatList
            data={filteredPatients}
            renderItem={renderPatientItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#007bff']}
                tintColor="#007bff"
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}

        {retryCount > 0 && (
          <View style={styles.retryIndicator}>
            <Text style={styles.retryText}>
              Retry attempt: {retryCount}
            </Text>
          </View>
        )}

        {loading && refreshing && (
          <LoadingSpinner 
            message="Refreshing patients..."
            overlay={false}
            style={styles.refreshLoader}
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
  addHeaderButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addHeaderButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
  },
  patientId: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  patientDetails: {
    marginBottom: 8,
  },
  patientInfo: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  patientPhone: {
    fontSize: 14,
    color: '#6c757d',
  },
  lastVisit: {
    fontSize: 12,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  offlineIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fd7e14',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  offlineText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
  },
  cardLoader: {
    marginBottom: 12,
  },
  errorContainer: {
    margin: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  retryIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  retryText: {
    textAlign: 'center',
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
  },
  refreshLoader: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});

// Wrap with ToastProvider for toast notifications
const EnhancedPatientListScreenWithToast = (props) => (
  <EnhancedPatientListScreen {...props} />
);

export default EnhancedPatientListScreenWithToast;

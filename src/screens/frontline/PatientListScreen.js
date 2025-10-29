import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Button, Searchbar, FAB, Chip, ActivityIndicator, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getPatients } from '../../services/patientService';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { syncAllOfflineData, getSyncStatus } from '../../services/syncService';

// Error Handling Components
import { 
  ErrorBoundary, 
  useToast, 
  LoadingSpinner,
  NetworkStatus,
  OfflineBanner,
  ErrorMessage
} from '../../components';

const PatientListScreenContent = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const { isOffline } = useOffline();
  const { showToast } = useToast();
  const theme = useTheme();
  const { userToken } = useAuth();

  // Load patients when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!userToken) {
        console.log('PatientListScreen: waiting for user token before fetching patients');
        return;
      }
      loadPatients();
    }, [userToken])
  );

  // Load patients from API or local storage
  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPatients();
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
      setError(error.message || 'Failed to load patients');
      showToast(error.message || 'Failed to load patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  // Sync offline patients with server
  const handleSync = async () => {
    if (isOffline) {
      showToast('Cannot sync while offline', 'warning');
      return;
    }

    setSyncing(true);
    try {
      const results = await syncAllOfflineData();
      await loadPatients();
      
      if (results.totalFailed > 0) {
        showToast(`Sync completed with errors. Successful: ${results.totalSuccess}, Failed: ${results.totalFailed}`, 'warning');
      } else if (results.totalSuccess > 0) {
        showToast(`Sync successful! ${results.totalSuccess} items synchronized`, 'success');
      } else {
        showToast('No offline data to sync', 'info');
      }
    } catch (error) {
      console.error('Error syncing patients:', error);
      showToast('Failed to sync data. Please try again.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Filter patients based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(
        patient =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (patient.id && patient.id.toString().includes(searchQuery))
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  // Render patient card
  const renderPatientCard = ({ item }) => {
    const isLocal = String(item.id).startsWith('local_');

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('PatientDetails', { patientId: item.id })}
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.patientName}>{item.name}</Text>
              {isLocal && (
                <Chip
                  mode="outlined"
                  style={styles.offlineChip}
                  textStyle={{ color: theme.colors.error }}
                >
                  Offline
                </Chip>
              )}
            </View>
            <View style={styles.patientInfo}>
              <Text>ID: {isLocal ? 'Pending' : item.id}</Text>
              <Text>Age: {item.age}</Text>
              <Text>Gender: {item.gender}</Text>
            </View>
            <Text numberOfLines={2} style={styles.notes}>
              {item.notes || 'No additional notes'}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="text"
              onPress={() =>
                navigation.navigate('Diagnosis', { patientId: item.id })
              }
            >
              New Diagnosis
            </Button>
            <Button
              mode="text"
              onPress={() =>
                navigation.navigate('PatientDetails', { patientId: item.id })
              }
            >
              Details
            </Button>
          </Card.Actions>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <NetworkStatus />
      <OfflineBanner />
      
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={loadPatients}
          style={styles.errorMessage}
        />
      )}
      
      <View style={styles.header}>
        <Searchbar
          placeholder="Search patients..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        {!isOffline && (
          <Button
            mode="outlined"
            onPress={handleSync}
            loading={syncing}
            disabled={syncing}
            style={styles.syncButton}
          >
            Sync
          </Button>
        )}
      </View>

      {loading ? (
        <LoadingSpinner message="Loading patients..." />
      ) : filteredPatients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No patients found</Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('NewPatient')}
            style={styles.addButton}
          >
            Add New Patient
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('NewPatient')}
      />
    </View>
  );
};

// Main wrapper component with error handling
const PatientListScreen = ({ navigation }) => {
  return (
    <ErrorBoundary>
      <PatientListScreenContent navigation={navigation} />
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 10,
  },
  syncButton: {
    height: 50,
    justifyContent: 'center',
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
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  patientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notes: {
    color: '#666',
    marginTop: 8,
  },
  offlineChip: {
    backgroundColor: 'transparent',
    borderColor: 'red',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  addButton: {
    paddingHorizontal: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  errorMessage: {
    margin: 16,
  },
});

export default PatientListScreen;
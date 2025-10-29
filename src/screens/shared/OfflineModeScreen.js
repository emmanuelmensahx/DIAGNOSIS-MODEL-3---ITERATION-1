import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorBoundary, useToast, LoadingSpinner, NetworkStatus, OfflineBanner } from '../../components';
import { 
  syncAllOfflineData, 
  getSyncStatus, 
  clearOfflineData as clearAllOfflineData,
  getOfflineData 
} from '../../services/syncService';
import { 
  syncOfflineDiagnoses, 
  syncOfflineReviews 
} from '../../services/diagnosisService';
import { syncOfflinePatients } from '../../services/patientService';
import { useOffline } from '../../context/OfflineContext';

function OfflineModeScreenContent({ navigation }) {
  const { isOffline } = useOffline();
  const { showToast } = useToast();
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineData, setOfflineData] = useState({
    patients: [],
    diagnoses: [],
    treatments: [],
    reviews: [],
    pendingSync: [],
  });
  const [storageInfo, setStorageInfo] = useState({
    totalSize: 0,
    availableSpace: 0,
  });
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOfflineSettings();
    loadOfflineData();
    loadSyncStatus();
    calculateStorageInfo();
  }, []);

  const loadOfflineSettings = async () => {
    try {
      const offlineEnabled = await AsyncStorage.getItem('offlineMode');
      setIsOfflineMode(offlineEnabled === 'true');
    } catch (error) {
      console.error('Error loading offline settings:', error);
    }
  };

  const loadOfflineData = async () => {
    try {
      setIsLoading(true);
      
      // Load offline data using the sync service functions
      const patients = await getOfflineData('offlinePatients');
      const diagnoses = await getOfflineData('offlineDiagnoses');
      const reviews = await getOfflineData('offlineReviews');
      
      // Load treatment data
      let treatments = [];
      try {
        const { getOfflineTreatments } = await import('../../services/treatmentService');
        treatments = await getOfflineTreatments();
      } catch (error) {
        console.warn('Could not load treatment data:', error);
      }
      
      // Load pending sync items
      const pendingSync = await AsyncStorage.getItem('pending_sync');

      setOfflineData({
        patients: patients || [],
        diagnoses: diagnoses || [],
        reviews: reviews || [],
        treatments: treatments || [],
        pendingSync: pendingSync ? JSON.parse(pendingSync) : [],
      });
    } catch (error) {
      console.error('Error loading offline data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const calculateStorageInfo = async () => {
    try {
      // Mock storage calculation - in real app, use device storage APIs
      const mockTotalSize = 2.5; // MB
      const mockAvailableSpace = 47.5; // MB remaining
      
      setStorageInfo({
        totalSize: mockTotalSize,
        availableSpace: mockAvailableSpace,
      });
    } catch (error) {
      console.error('Error calculating storage:', error);
    }
  };

  const toggleOfflineMode = async (enabled) => {
    try {
      await AsyncStorage.setItem('offlineMode', enabled.toString());
      setIsOfflineMode(enabled);
      
      if (enabled) {
        showToast('Offline Mode Enabled - You can now work without internet connection. Data will sync when connection is restored.', 'success');
      } else {
        showToast('Offline Mode Disabled - You will need internet connection to use the app.', 'info');
      }
    } catch (error) {
      showToast('Failed to update offline mode setting', 'error');
    }
  };

  const syncPendingData = async () => {
    if (isOffline) {
      showToast('Cannot sync while offline. Please check your internet connection.', 'warning');
      return;
    }

    const totalPendingItems = (offlineData.patients?.length || 0) + 
                             (offlineData.diagnoses?.length || 0) + 
                             (offlineData.reviews?.length || 0) + 
                             (offlineData.pendingSync?.length || 0);

    if (totalPendingItems === 0) {
      showToast('No data pending sync', 'info');
      return;
    }

    showToast(`Starting sync of ${totalPendingItems} pending items...`, 'info');
    
    // Perform sync immediately without confirmation dialog
            setIsSyncing(true);
    setIsSyncing(true);
    try {
      // Perform comprehensive sync using the sync service
      const syncResults = await syncAllOfflineData();
      
      // Also sync specialist reviews if any
      if (offlineData.reviews?.length > 0) {
        try {
          await syncOfflineReviews();
        } catch (reviewError) {
          console.error('Error syncing reviews:', reviewError);
        }
      }
      
      // Reload data and sync status
      await loadOfflineData();
      await loadSyncStatus();
      
      // Show results
      if (syncResults.totalFailed > 0) {
        showToast(`Sync completed with errors - Successful: ${syncResults.totalSuccess}, Failed: ${syncResults.totalFailed}`, 'warning');
      } else if (syncResults.totalSuccess > 0) {
        showToast(`Sync successful - ${syncResults.totalSuccess} items synced`, 'success');
      } else {
        showToast('No offline data to sync', 'info');
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      showToast('Failed to sync data. Please try again.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const clearOfflineData = async () => {
    showToast('Clearing offline data...', 'info');
    
    try {
      // Use the comprehensive clear function from sync service
      await clearAllOfflineData();
      
      // Also clear additional offline data
      await AsyncStorage.multiRemove([
        'offlineReviews',
        'pending_sync',
        'offline_userUpdates',
      ]);
      
      // Reset local state
      setOfflineData({
        patients: [],
        diagnoses: [],
        reviews: [],
        pendingSync: [],
      });
      
      // Reload sync status
      await loadSyncStatus();
      
      showToast('Offline data cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing offline data:', error);
      showToast('Failed to clear offline data', 'error');
    }
  };

  const formatFileSize = (sizeInMB) => {
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const offlineDataItems = [
    {
      id: 'patients',
      title: 'Offline Patients',
      count: offlineData.patients?.length || 0,
      icon: 'account-group',
      color: '#1E88E5',
    },
    {
      id: 'diagnoses',
      title: 'Offline Diagnoses',
      count: offlineData.diagnoses?.length || 0,
      icon: 'medical-bag',
      color: '#38A169',
    },
    {
      id: 'treatments',
      title: 'Offline Treatments',
      count: offlineData.treatments?.length || 0,
      icon: 'pill',
      color: '#E53E3E',
    },
    {
      id: 'reviews',
      title: 'Offline Reviews',
      count: offlineData.reviews?.length || 0,
      icon: 'clipboard-check',
      color: '#9F7AEA',
    },
    {
      id: 'pending',
      title: 'Pending Sync',
      count: syncStatus?.pendingItems?.total || 0,
      icon: 'sync',
      color: '#F56500',
    },
  ];

  const renderDataItem = ({ item }) => (
    <View style={styles.dataCard}>
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <MaterialCommunityIcons name={item.icon} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.dataInfo}>
        <Text style={styles.dataTitle}>{item.title}</Text>
        <Text style={styles.dataCount}>{item.count} items</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E0" />
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading offline data..." />;
  }

  return (
    <View style={styles.container}>
      <NetworkStatus />
      <OfflineBanner />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Offline Mode</Text>
        <Text style={styles.subtitle}>Manage offline data and sync settings</Text>
      </View>

      {/* Offline Mode Toggle */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <MaterialCommunityIcons name="wifi-off" size={24} color="#1E88E5" />
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Enable Offline Mode</Text>
              <Text style={styles.toggleDescription}>
                Work without internet connection
              </Text>
            </View>
          </View>
          <Switch
            value={isOfflineMode}
            onValueChange={toggleOfflineMode}
            trackColor={{ false: '#CBD5E0', true: '#1E88E5' }}
            thumbColor={isOfflineMode ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>
      </View>

      {/* Storage Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Usage</Text>
        <View style={styles.storageInfo}>
          <View style={styles.storageRow}>
            <MaterialCommunityIcons name="harddisk" size={20} color="#718096" />
            <Text style={styles.storageLabel}>Offline Data</Text>
            <Text style={styles.storageValue}>{formatFileSize(storageInfo.totalSize)}</Text>
          </View>
          <View style={styles.storageRow}>
            <MaterialCommunityIcons name="database" size={20} color="#718096" />
            <Text style={styles.storageLabel}>Available Space</Text>
            <Text style={styles.storageValue}>{formatFileSize(storageInfo.availableSpace)}</Text>
          </View>
        </View>
      </View>

      {/* Offline Data Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Data</Text>
        <FlatList
          data={offlineDataItems}
          renderItem={renderDataItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>

      {/* Sync Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Actions</Text>
        
        <TouchableOpacity 
          style={[
            styles.actionButton,
            (syncStatus?.pendingItems?.total === 0 || isSyncing || isOffline) && styles.disabledButton
          ]} 
          onPress={syncPendingData}
          disabled={syncStatus?.pendingItems?.total === 0 || isSyncing || isOffline}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialCommunityIcons name="sync" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.actionButtonText}>
            {isSyncing ? 'Syncing...' : `Sync Pending Data (${syncStatus?.pendingItems?.total || 0})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={clearOfflineData}>
          <MaterialCommunityIcons name="delete" size={20} color="#E53E3E" />
          <Text style={styles.secondaryButtonText}>Clear Offline Data</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <View style={styles.connectionStatus}>
          <MaterialCommunityIcons 
            name={isOffline ? "wifi-off" : "wifi"} 
            size={20} 
            color={isOffline ? "#F56500" : "#38A169"} 
          />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusText, { color: isOffline ? "#F56500" : "#38A169" }]}>
              {isOffline ? 'Currently Offline' : 'Currently Online'}
            </Text>
            {syncStatus?.lastSyncTime && (
              <Text style={styles.lastSyncText}>
                Last sync: {new Date(syncStatus.lastSyncTime).toLocaleString()}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleText: {
    marginLeft: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  toggleDescription: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  storageInfo: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storageLabel: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
    marginLeft: 8,
  },
  storageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  dataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  dataCount: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#CBD5E0',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E53E3E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusContainer: {
    padding: 16,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 12,
  },
  statusTextContainer: {
    marginLeft: 8,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
});

// Wrapper component with error handling
const OfflineModeScreen = () => {
  return (
    <ErrorBoundary>
      <OfflineModeScreenContent />
    </ErrorBoundary>
  );
};

export default OfflineModeScreen;

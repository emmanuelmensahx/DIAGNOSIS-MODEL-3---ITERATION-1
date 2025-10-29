import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { ErrorBoundary, useToast, LoadingSpinner, NetworkStatus, OfflineBanner } from '../../components';
import {
  getSyncStatus,
  syncAllOfflineData,
  getLastSyncTime,
  clearOfflineData,
} from '../../services/syncService';
import { useOffline } from '../../context/OfflineContext';

const SyncScreenContent = ({ navigation }) => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline } = useOffline();
  const { showToast } = useToast();

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      setLoading(true);
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
      showToast('Failed to load sync status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSyncStatus();
    setRefreshing(false);
  };

  const handleSync = async () => {
    if (isOffline) {
      showToast('Cannot sync while offline. Please check your internet connection.', 'warning');
      return;
    }

    if (!syncStatus?.canSync) {
      showToast('No offline data to sync.', 'info');
      return;
    }

    showToast(`Starting sync of ${syncStatus.pendingItems.total} pending items...`, 'info');
    performSync();
  };

  const performSync = async () => {
    try {
      setSyncing(true);
      const results = await syncAllOfflineData();
      
      const message = `Sync completed! Successful: ${results.totalSuccess}, Failed: ${results.totalFailed}`;
      
      if (results.totalFailed > 0) {
        showToast(message, 'warning');
      } else {
        showToast(message, 'success');
      }
      
      // Refresh status
      await loadSyncStatus();
    } catch (error) {
      console.error('Error during sync:', error);
      showToast('Failed to sync data. Please try again.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearOfflineData = async () => {
    try {
      showToast('Clearing offline data...', 'info');
      await clearOfflineData();
      showToast('Offline data cleared successfully.', 'success');
      await loadSyncStatus();
    } catch (error) {
      console.error('Error clearing offline data:', error);
      showToast('Failed to clear offline data.', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getConnectionStatusColor = () => {
    return isOffline ? '#f44336' : '#4caf50';
  };

  const getConnectionStatusText = () => {
    return isOffline ? 'Offline' : 'Online';
  };

  if (loading) {
    return <LoadingSpinner message="Loading sync status..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <NetworkStatus />
      <OfflineBanner />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Synchronization</Text>
      </View>

      {/* Connection Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Icon
            name={isOffline ? 'wifi-off' : 'wifi'}
            size={24}
            color={getConnectionStatusColor()}
          />
          <Text style={[styles.statusText, { color: getConnectionStatusColor() }]}>
            {getConnectionStatusText()}
          </Text>
        </View>
        <Text style={styles.statusDescription}>
          {isOffline
            ? 'You are currently offline. Data will be saved locally and synced when connection is restored.'
            : 'You are online and can sync data with the server.'}
        </Text>
      </View>

      {/* Sync Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sync Status</Text>
        
        <View style={styles.syncInfo}>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Last Sync:</Text>
            <Text style={styles.syncValue}>
              {formatDate(syncStatus?.lastSyncTime)}
            </Text>
          </View>
          
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Pending Patients:</Text>
            <Text style={styles.syncValue}>
              {syncStatus?.pendingItems?.patients || 0}
            </Text>
          </View>
          
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Pending Diagnoses:</Text>
            <Text style={styles.syncValue}>
              {syncStatus?.pendingItems?.diagnoses || 0}
            </Text>
          </View>
          
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Total Pending:</Text>
            <Text style={[styles.syncValue, styles.totalPending]}>
              {syncStatus?.pendingItems?.total || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Sync Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Actions</Text>
        
        <TouchableOpacity
          style={[
            styles.syncButton,
            (!syncStatus?.canSync || syncing) && styles.syncButtonDisabled,
          ]}
          onPress={handleSync}
          disabled={!syncStatus?.canSync || syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="sync" size={20} color="#fff" />
          )}
          <Text style={styles.syncButtonText}>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearOfflineData}
          disabled={syncing}
        >
          <Icon name="delete" size={20} color="#f44336" />
          <Text style={styles.clearButtonText}>Clear Offline Data</Text>
        </TouchableOpacity>
      </View>

      {/* Help */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About Sync</Text>
        <Text style={styles.helpText}>
          • Data is automatically saved offline when you're disconnected
        </Text>
        <Text style={styles.helpText}>
          • Sync uploads your offline data to the server when you're online
        </Text>
        <Text style={styles.helpText}>
          • Pull down to refresh the sync status
        </Text>
        <Text style={styles.helpText}>
          • Clear offline data only removes local copies that haven't been synced
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  syncInfo: {
    gap: 12,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncLabel: {
    fontSize: 16,
    color: '#666',
  },
  syncValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  totalPending: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  syncButton: {
    backgroundColor: '#2196f3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  syncButtonDisabled: {
    backgroundColor: '#ccc',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  clearButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  clearButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
});

// Wrapper component with error handling
const SyncScreen = ({ navigation }) => {
  return (
    <ErrorBoundary>
      <SyncScreenContent navigation={navigation} />
    </ErrorBoundary>
  );
};

export default SyncScreen;

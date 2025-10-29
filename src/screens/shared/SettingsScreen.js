import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { getSyncStatus } from '../../services/syncService';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { isOffline } = useOffline();
  const [syncStatus, setSyncStatus] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent, showArrow = true }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color="#666" style={styles.settingIcon} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && <Icon name="chevron-right" size={24} color="#ccc" />}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* User Profile */}
      <View style={styles.profileSection}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Icon name="person" size={32} color="#fff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            <Text style={styles.userRole}>
              {user?.role === 'frontline_worker' ? 'Frontline Worker' : 'Specialist'}
            </Text>
          </View>
        </View>
      </View>

      {/* Data & Sync */}
      <SectionHeader title="Data & Sync" />
      <View style={styles.section}>
        <SettingItem
          icon="sync"
          title="Data Synchronization"
          subtitle={`${syncStatus?.pendingItems?.total || 0} items pending sync`}
          onPress={() => navigation.navigate('Sync')}
        />
        <SettingItem
          icon="wifi-off"
          title="Offline Mode"
          subtitle={isOffline ? 'Currently offline' : 'Online'}
          onPress={() => navigation.navigate('OfflineMode')}
        />
        <SettingItem
          icon="sync-alt"
          title="Auto Sync"
          subtitle="Automatically sync when online"
          rightComponent={
            <Switch
              value={autoSyncEnabled}
              onValueChange={setAutoSyncEnabled}
              trackColor={{ false: '#ccc', true: '#2196f3' }}
              thumbColor={autoSyncEnabled ? '#fff' : '#f4f3f4'}
            />
          }
          showArrow={false}
        />
      </View>

      {/* Notifications */}
      <SectionHeader title="Notifications" />
      <View style={styles.section}>
        <SettingItem
          icon="notifications"
          title="Push Notifications"
          subtitle="Receive alerts and updates"
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ccc', true: '#2196f3' }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          }
          showArrow={false}
        />
      </View>

      {/* Account */}
      <SectionHeader title="Account" />
      <View style={styles.section}>
        <SettingItem
          icon="person"
          title="Profile"
          subtitle="Edit your profile information"
          onPress={() => navigation.navigate('Profile')}
        />
        <SettingItem
          icon="lock"
          title="Change Password"
          subtitle="Update your password"
          onPress={() => {
            Alert.alert('Coming Soon', 'Password change feature will be available soon.');
          }}
        />
      </View>

      {/* Support */}
      <SectionHeader title="Support" />
      <View style={styles.section}>
        <SettingItem
          icon="help"
          title="Help & Support"
          subtitle="Get help and contact support"
          onPress={() => {
            Alert.alert('Help & Support', 'For support, please contact your system administrator.');
          }}
        />
        <SettingItem
          icon="info"
          title="About"
          subtitle="App version and information"
          onPress={() => {
            Alert.alert('About AfriDiag', 'AfriDiag v1.0.0\nAI-powered diagnostic platform for healthcare workers in Africa.');
          }}
        />
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#f44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#2196f3',
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  logoutText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SettingsScreen;

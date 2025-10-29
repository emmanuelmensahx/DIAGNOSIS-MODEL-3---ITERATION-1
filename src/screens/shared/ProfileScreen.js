import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { getCurrentUser, updateUserProfile } from '../../services/userService';
import { useOffline } from '../../context/OfflineContext';

export default function ProfileScreen({ navigation }) {
  const { userToken, signOut } = useAuth();
  const { isOffline } = useOffline();
  const [profile, setProfile] = useState({
    id: '',
    full_name: '',
    email: '',
    username: '',
    role: '',
    department: '',
    phone: '',
    location: '',
    profileImage: null,
    bio: '',
    credentials: [],
    yearsOfExperience: 0,
    specializations: [],
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ ...profile });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const userData = await getCurrentUser();
      
      // Map backend fields to profile state
      const profileData = {
        id: userData.id || '',
        full_name: userData.full_name || '',
        email: userData.email || '',
        username: userData.username || '',
        role: userData.role || '',
        department: userData.department || '',
        phone: userData.phone || '',
        location: userData.location || '',
        profileImage: userData.profile_image || null,
        bio: userData.bio || '',
        credentials: userData.credentials || [],
        yearsOfExperience: userData.years_of_experience || 0,
        specializations: userData.specializations || [],
      };
      
      setProfile(profileData);
      setOriginalProfile(profileData);
      setEditedProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setEditedProfile(prev => ({
          ...prev,
          profileImage: result.assets[0].uri,
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const saveProfile = async () => {
    try {
      setIsLoading(true);
      
      // Prepare update data (only send changed fields)
      const updateData = {};
      Object.keys(editedProfile).forEach(key => {
        if (editedProfile[key] !== originalProfile[key]) {
          // Map frontend fields to backend fields
          if (key === 'full_name') {
            updateData.full_name = editedProfile[key];
          } else if (key === 'yearsOfExperience') {
            updateData.years_of_experience = editedProfile[key];
          } else if (key === 'profileImage') {
            updateData.profile_image = editedProfile[key];
          } else {
            updateData[key] = editedProfile[key];
          }
        }
      });

      if (Object.keys(updateData).length === 0) {
        Alert.alert('Info', 'No changes to save');
        setIsEditing(false);
        setIsLoading(false);
        return;
      }

      const updatedUser = await updateUserProfile(updateData);
      
      // Update profile state with server response
      const updatedProfile = {
        id: updatedUser.id || '',
        full_name: updatedUser.full_name || '',
        email: updatedUser.email || '',
        username: updatedUser.username || '',
        role: updatedUser.role || '',
        department: updatedUser.department || '',
        phone: updatedUser.phone || '',
        location: updatedUser.location || '',
        profileImage: updatedUser.profile_image || null,
        bio: updatedUser.bio || '',
        credentials: updatedUser.credentials || [],
        yearsOfExperience: updatedUser.years_of_experience || 0,
        specializations: updatedUser.specializations || [],
      };
      
      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setIsEditing(false);
      
      const message = isOffline 
        ? 'Profile updated locally. Changes will sync when online.'
        : 'Profile updated successfully';
      Alert.alert('Success', message);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Error saving profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const currentProfile = isEditing ? editedProfile : profile;

  const profileSections = [
    {
      title: 'Personal Information',
      items: [
        { key: 'full_name', label: 'Full Name', icon: 'account', editable: true },
        { key: 'email', label: 'Email', icon: 'email', editable: true },
        { key: 'phone', label: 'Phone', icon: 'phone', editable: true },
        { key: 'location', label: 'Location', icon: 'map-marker', editable: true },
      ],
    },
    {
      title: 'Professional Information',
      items: [
        { key: 'role', label: 'Role', icon: 'badge-account', editable: false },
        { key: 'department', label: 'Department', icon: 'hospital-building', editable: true },
        { key: 'yearsOfExperience', label: 'Years of Experience', icon: 'calendar', editable: true },
      ],
    },
  ];

  const renderProfileItem = (item) => {
    const value = currentProfile[item.key];
    
    if (isEditing && item.editable) {
      return (
        <View key={item.key} style={styles.profileItem}>
          <View style={styles.itemHeader}>
            <MaterialCommunityIcons name={item.icon} size={20} color="#1E88E5" />
            <Text style={styles.itemLabel}>{item.label}</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={value?.toString() || ''}
            onChangeText={(text) => setEditedProfile(prev => ({ ...prev, [item.key]: text }))}
            placeholder={`Enter ${item.label.toLowerCase()}`}
            keyboardType={item.key === 'yearsOfExperience' ? 'numeric' : 'default'}
          />
        </View>
      );
    }

    return (
      <View key={item.key} style={styles.profileItem}>
        <View style={styles.itemHeader}>
          <MaterialCommunityIcons name={item.icon} size={20} color="#1E88E5" />
          <Text style={styles.itemLabel}>{item.label}</Text>
        </View>
        <Text style={styles.itemValue}>{value || 'Not specified'}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => isEditing ? saveProfile() : setIsEditing(true)}
            disabled={isLoading}
          >
            <MaterialCommunityIcons 
              name={isEditing ? "check" : "pencil"} 
              size={20} 
              color="#1E88E5" 
            />
            <Text style={styles.editButtonText}>
              {isLoading ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {isEditing && (
          <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
            <MaterialCommunityIcons name="close" size={20} color="#E53E3E" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Image and Basic Info */}
      <View style={styles.profileCard}>
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={isEditing ? pickProfileImage : undefined}
          disabled={!isEditing}
        >
          {currentProfile.profileImage ? (
            <Image source={{ uri: currentProfile.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialCommunityIcons name="account" size={60} color="#CBD5E0" />
            </View>
          )}
          {isEditing && (
            <View style={styles.imageOverlay}>
              <MaterialCommunityIcons name="camera" size={24} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
        
        <Text style={styles.profileName}>{currentProfile.full_name}</Text>
        <Text style={styles.profileRole}>{currentProfile.role}</Text>
        
        {currentProfile.credentials && currentProfile.credentials.length > 0 && (
          <View style={styles.credentialsContainer}>
            {currentProfile.credentials.map((credential, index) => (
              <View key={index} style={styles.credentialBadge}>
                <Text style={styles.credentialText}>{credential}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Bio Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bio</Text>
        {isEditing ? (
          <TextInput
            style={[styles.textInput, styles.bioInput]}
            value={currentProfile.bio || ''}
            onChangeText={(text) => setEditedProfile(prev => ({ ...prev, bio: text }))}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
          />
        ) : (
          <Text style={styles.bioText}>{currentProfile.bio || 'No bio available'}</Text>
        )}
      </View>

      {/* Specializations */}
      {currentProfile.specializations && currentProfile.specializations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specializations</Text>
          <View style={styles.specializationsContainer}>
            {currentProfile.specializations.map((specialization, index) => (
              <View key={index} style={styles.specializationTag}>
                <MaterialCommunityIcons name="medical-bag" size={16} color="#1E88E5" />
                <Text style={styles.specializationText}>{specialization}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Profile Sections */}
      {profileSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map(renderProfileItem)}
        </View>
      ))}

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Settings')}>
          <MaterialCommunityIcons name="cog" size={20} color="#1E88E5" />
          <Text style={styles.actionButtonText}>Settings</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E0" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('OfflineMode')}>
          <MaterialCommunityIcons name="wifi-off" size={20} color="#1E88E5" />
          <Text style={styles.actionButtonText}>Offline Mode</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E0" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.signOutButton]} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={20} color="#E53E3E" />
          <Text style={[styles.actionButtonText, styles.signOutText]}>Sign Out</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E0" />
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FED7D7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1E88E5',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#1E88E5',
    marginBottom: 12,
  },
  credentialsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  credentialBadge: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 2,
  },
  credentialText: {
    color: '#1E88E5',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
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
  bioText: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 24,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specializationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: '#38A169',
  },
  specializationText: {
    color: '#38A169',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  profileItem: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginLeft: 8,
  },
  itemValue: {
    fontSize: 16,
    color: '#2D3748',
    marginLeft: 28,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
    backgroundColor: '#FFFFFF',
    marginLeft: 28,
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#2D3748',
    flex: 1,
    marginLeft: 12,
  },
  signOutButton: {
    borderBottomWidth: 0,
  },
  signOutText: {
    color: '#E53E3E',
  },
});

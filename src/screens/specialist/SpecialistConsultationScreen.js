import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOffline } from '../../context/OfflineContext';

const SpecialistConsultationScreen = () => {
  const navigation = useNavigation();
  const { isOffline } = useOffline();
  
  const [activeTab, setActiveTab] = useState('available');
  const [specialists, setSpecialists] = useState([]);
  const [consultationRequests, setConsultationRequests] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [consultationModal, setConsultationModal] = useState(false);
  const [consultationDetails, setConsultationDetails] = useState({
    patientName: '',
    symptoms: '',
    urgency: 'normal',
    notes: ''
  });

  useEffect(() => {
    if (isOffline) {
      Alert.alert(
        'Offline Mode',
        'Specialist consultation requires an internet connection. Please connect to continue.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    
    loadSpecialists();
    loadConsultationRequests();
  }, [isOffline]);

  const loadSpecialists = () => {
    // Mock specialists data
    const mockSpecialists = [
      {
        id: 1,
        name: 'Dr. Sarah Johnson',
        specialty: 'Internal Medicine',
        availability: 'available',
        rating: 4.8,
        experience: '15 years',
        location: 'Nairobi, Kenya',
        languages: ['English', 'Swahili'],
        consultationFee: '$50',
        responseTime: '< 30 min'
      },
      {
        id: 2,
        name: 'Dr. Michael Okafor',
        specialty: 'Pediatrics',
        availability: 'busy',
        rating: 4.9,
        experience: '12 years',
        location: 'Lagos, Nigeria',
        languages: ['English', 'Igbo'],
        consultationFee: '$45',
        responseTime: '< 1 hour'
      },
      {
        id: 3,
        name: 'Dr. Amina Hassan',
        specialty: 'Emergency Medicine',
        availability: 'available',
        rating: 4.7,
        experience: '10 years',
        location: 'Cairo, Egypt',
        languages: ['English', 'Arabic'],
        consultationFee: '$55',
        responseTime: '< 15 min'
      }
    ];
    setSpecialists(mockSpecialists);
  };

  const loadConsultationRequests = () => {
    // Mock consultation requests
    const mockRequests = [
      {
        id: 1,
        patientName: 'John Doe',
        symptoms: 'Persistent cough, fever',
        urgency: 'high',
        status: 'pending',
        requestedAt: new Date(Date.now() - 3600000),
        specialistId: 1
      },
      {
        id: 2,
        patientName: 'Mary Smith',
        symptoms: 'Abdominal pain, nausea',
        urgency: 'normal',
        status: 'in_progress',
        requestedAt: new Date(Date.now() - 7200000),
        specialistId: 2
      }
    ];
    setConsultationRequests(mockRequests);
  };

  const requestConsultation = async () => {
    if (!selectedSpecialist) {
      Alert.alert('Error', 'Please select a specialist');
      return;
    }

    if (!consultationDetails.patientName || !consultationDetails.symptoms) {
      Alert.alert('Error', 'Please fill in patient name and symptoms');
      return;
    }

    try {
      // Simulate API call
      const newRequest = {
        id: Date.now(),
        ...consultationDetails,
        specialistId: selectedSpecialist.id,
        status: 'pending',
        requestedAt: new Date()
      };

      setConsultationRequests(prev => [...prev, newRequest]);
      setConsultationModal(false);
      setConsultationDetails({
        patientName: '',
        symptoms: '',
        urgency: 'normal',
        notes: ''
      });
      setSelectedSpecialist(null);

      Alert.alert(
        'Success',
        'Consultation request sent successfully. The specialist will respond shortly.',
        [
          {
            text: 'Start Chat',
            onPress: () => navigation.navigate('SpecialistChat', {
              requestId: newRequest.id,
              specialistId: selectedSpecialist.id,
              patientName: newRequest.patientName
            })
          },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send consultation request');
    }
  };

  const getAvailableSpecialists = () => {
    return specialists.filter(s => s.availability === 'available');
  };

  const getPendingRequests = () => {
    return consultationRequests.filter(r => r.status === 'pending');
  };

  const getActiveConsultations = () => {
    return consultationRequests.filter(r => r.status === 'in_progress');
  };

  const renderSpecialistCard = (specialist) => (
    <TouchableOpacity
      key={specialist.id}
      style={styles.specialistCard}
      onPress={() => {
        setSelectedSpecialist(specialist);
        setConsultationModal(true);
      }}
    >
      <View style={styles.specialistHeader}>
        <Text style={styles.specialistName}>{specialist.name}</Text>
        <View style={[
          styles.availabilityBadge,
          specialist.availability === 'available' ? styles.availableBadge : styles.busyBadge
        ]}>
          <Text style={styles.availabilityText}>
            {specialist.availability === 'available' ? 'Available' : 'Busy'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.specialistSpecialty}>{specialist.specialty}</Text>
      <Text style={styles.specialistLocation}>{specialist.location}</Text>
      
      <View style={styles.specialistDetails}>
        <Text style={styles.detailText}>⭐ {specialist.rating}</Text>
        <Text style={styles.detailText}>📅 {specialist.experience}</Text>
        <Text style={styles.detailText}>💰 {specialist.consultationFee}</Text>
        <Text style={styles.detailText}>⏱️ {specialist.responseTime}</Text>
      </View>
      
      <Text style={styles.languagesText}>
        Languages: {specialist.languages.join(', ')}
      </Text>
    </TouchableOpacity>
  );

  const renderConsultationRequest = (request) => {
    const specialist = specialists.find(s => s.id === request.specialistId);
    
    return (
      <TouchableOpacity
        key={request.id}
        style={styles.requestCard}
        onPress={() => navigation.navigate('SpecialistChat', {
          requestId: request.id,
          specialistId: request.specialistId,
          patientName: request.patientName
        })}
      >
        <View style={styles.requestHeader}>
          <Text style={styles.patientName}>{request.patientName}</Text>
          <View style={[
            styles.urgencyBadge,
            request.urgency === 'high' ? styles.highUrgency : styles.normalUrgency
          ]}>
            <Text style={styles.urgencyText}>{request.urgency}</Text>
          </View>
        </View>
        
        <Text style={styles.symptoms}>{request.symptoms}</Text>
        <Text style={styles.specialistAssigned}>
          Specialist: {specialist?.name || 'Unassigned'}
        </Text>
        <Text style={styles.requestTime}>
          Requested: {request.requestedAt.toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'available':
        return (
          <View>
            <Text style={styles.sectionTitle}>Available Specialists</Text>
            {getAvailableSpecialists().map(renderSpecialistCard)}
          </View>
        );
      case 'pending':
        return (
          <View>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            {getPendingRequests().map(renderConsultationRequest)}
          </View>
        );
      case 'active':
        return (
          <View>
            <Text style={styles.sectionTitle}>Active Consultations</Text>
            {getActiveConsultations().map(renderConsultationRequest)}
          </View>
        );
      default:
        return null;
    }
  };

  if (isOffline) {
    return (
      <View style={styles.offlineContainer}>
        <Text style={styles.offlineText}>
          Specialist consultation requires an internet connection
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Specialist Consultation</Text>
        <Text style={styles.headerSubtitle}>
          Connect with medical experts for professional consultation
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'available', label: 'Available Specialists' },
          { key: 'pending', label: 'Pending Requests' },
          { key: 'active', label: 'Active Consultations' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>

      {/* Consultation Request Modal */}
      <Modal
        visible={consultationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setConsultationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Consultation</Text>
            <Text style={styles.modalSubtitle}>
              Dr. {selectedSpecialist?.name} - {selectedSpecialist?.specialty}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Patient Name"
              value={consultationDetails.patientName}
              onChangeText={(text) => setConsultationDetails(prev => ({
                ...prev,
                patientName: text
              }))}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Symptoms and concerns"
              value={consultationDetails.symptoms}
              onChangeText={(text) => setConsultationDetails(prev => ({
                ...prev,
                symptoms: text
              }))}
              multiline
              numberOfLines={4}
            />

            <View style={styles.urgencyContainer}>
              <Text style={styles.urgencyLabel}>Urgency Level:</Text>
              {['normal', 'high', 'emergency'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.urgencyOption,
                    consultationDetails.urgency === level && styles.selectedUrgency
                  ]}
                  onPress={() => setConsultationDetails(prev => ({
                    ...prev,
                    urgency: level
                  }))}
                >
                  <Text style={[
                    styles.urgencyOptionText,
                    consultationDetails.urgency === level && styles.selectedUrgencyText
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes (optional)"
              value={consultationDetails.notes}
              onChangeText={(text) => setConsultationDetails(prev => ({
                ...prev,
                notes: text
              }))}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setConsultationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.requestButton}
                onPress={requestConsultation}
              >
                <Text style={styles.requestButtonText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  tabButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  specialistCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  specialistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  specialistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  availabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  availableBadge: {
    backgroundColor: '#4CAF50',
  },
  busyBadge: {
    backgroundColor: '#FF9800',
  },
  availabilityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  specialistSpecialty: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 5,
  },
  specialistLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  specialistDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  languagesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  highUrgency: {
    backgroundColor: '#F44336',
  },
  normalUrgency: {
    backgroundColor: '#2196F3',
  },
  urgencyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  symptoms: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  specialistAssigned: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 5,
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  urgencyContainer: {
    marginBottom: 15,
  },
  urgencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  urgencyOption: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedUrgency: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  urgencyOptionText: {
    color: '#666',
    fontSize: 14,
  },
  selectedUrgencyText: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  requestButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  requestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  offlineText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SpecialistConsultationScreen;
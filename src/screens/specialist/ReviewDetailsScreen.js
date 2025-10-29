import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getDiagnosisForReview, submitSpecialistReview } from '../../services/diagnosisService';

export default function ReviewDetailsScreen({ navigation, route }) {
  const { reviewId, reviewData } = route.params;
  const [review, setReview] = useState(reviewData || null);
  const [specialistFeedback, setSpecialistFeedback] = useState('');
  const [alternativeDiagnosis, setAlternativeDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [reviewStatus, setReviewStatus] = useState('confirmed'); // 'confirmed' or 'rejected'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userToken } = useAuth();

  useEffect(() => {
    if (!reviewData) {
      fetchReviewDetails();
    }
  }, [reviewId]);

  const fetchReviewDetails = async () => {
    try {
      // TODO: Replace with actual API call
      const mockData = {
        id: reviewId,
        patientName: 'John Doe',
        patientAge: 45,
        patientGender: 'Male',
        diagnosisType: 'Chest X-Ray',
        submittedBy: 'Dr. Smith',
        submittedAt: '2024-01-15T10:30:00Z',
        priority: 'high',
        symptoms: ['Persistent cough', 'Chest pain', 'Shortness of breath', 'Fever'],
        medicalHistory: 'Previous pneumonia 2 years ago, smoker for 15 years',
        imageUrl: 'https://via.placeholder.com/300x200/1E88E5/FFFFFF?text=Chest+X-Ray',
        aiPrediction: {
          condition: 'Pneumonia',
          confidence: 0.85,
          details: 'AI detected opacity in lower right lobe consistent with pneumonia',
        },
        vitals: {
          temperature: '38.5°C',
          bloodPressure: '140/90 mmHg',
          heartRate: '95 bpm',
          respiratoryRate: '22/min',
        },
      };
      setReview(mockData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch review details');
      console.error('Error fetching review details:', error);
    }
  };

  const submitReview = async () => {
    if (!diagnosis.trim()) {
      Alert.alert('Error', 'Please provide a diagnosis');
      return;
    }

    if (!confidence.trim()) {
      Alert.alert('Error', 'Please provide confidence level');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const reviewSubmission = {
        reviewId,
        diagnosis: diagnosis.trim(),
        confidence: confidence.trim(),
        recommendations: recommendations.trim(),
        reviewedAt: new Date().toISOString(),
      };

      // TODO: Submit to backend API
      console.log('Submitting review:', reviewSubmission);
      
      Alert.alert(
        'Review Submitted',
        'Your review has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#E53E3E';
      case 'medium':
        return '#F56500';
      case 'low':
        return '#38A169';
      default:
        return '#718096';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!review) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="loading" size={48} color="#1E88E5" />
        <Text style={styles.loadingText}>Loading review details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{review.patientName}</Text>
          <Text style={styles.patientDetails}>
            {review.patientAge} years old • {review.patientGender}
          </Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(review.priority) }]}>
          <Text style={styles.priorityText}>{review.priority.toUpperCase()}</Text>
        </View>
      </View>

      {/* Case Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Case Information</Text>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="medical-bag" size={20} color="#1E88E5" />
          <Text style={styles.infoText}>{review.diagnosisType}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account-circle" size={20} color="#1E88E5" />
          <Text style={styles.infoText}>Submitted by {review.submittedBy}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock" size={20} color="#1E88E5" />
          <Text style={styles.infoText}>{formatDate(review.submittedAt)}</Text>
        </View>
      </View>

      {/* Medical Image */}
      {review.imageUrl && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Image</Text>
          <Image source={{ uri: review.imageUrl }} style={styles.medicalImage} />
        </View>
      )}

      {/* AI Prediction */}
      {review.aiPrediction && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Analysis</Text>
          <View style={styles.aiPredictionCard}>
            <View style={styles.aiHeader}>
              <MaterialCommunityIcons name="robot" size={24} color="#1E88E5" />
              <Text style={styles.aiTitle}>AI Prediction</Text>
            </View>
            <Text style={styles.aiCondition}>{review.aiPrediction.condition}</Text>
            <Text style={styles.aiConfidence}>
              Confidence: {(() => {
                let confValue = review.aiPrediction.confidence;
                if (confValue > 1) {
                  return Math.round(confValue) + '%';
                } else {
                  return Math.round(confValue * 100) + '%';
                }
              })()}
            </Text>
            <Text style={styles.aiDetails}>{review.aiPrediction.details}</Text>
          </View>
        </View>
      )}

      {/* Symptoms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Symptoms</Text>
        <View style={styles.symptomsList}>
          {review.symptoms.map((symptom, index) => (
            <View key={index} style={styles.symptomItem}>
              <MaterialCommunityIcons name="circle-small" size={20} color="#718096" />
              <Text style={styles.symptomText}>{symptom}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Vitals */}
      {review.vitals && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vital Signs</Text>
          <View style={styles.vitalsGrid}>
            <View style={styles.vitalItem}>
              <MaterialCommunityIcons name="thermometer" size={20} color="#E53E3E" />
              <Text style={styles.vitalLabel}>Temperature</Text>
              <Text style={styles.vitalValue}>{review.vitals.temperature}</Text>
            </View>
            <View style={styles.vitalItem}>
              <MaterialCommunityIcons name="heart-pulse" size={20} color="#E53E3E" />
              <Text style={styles.vitalLabel}>Blood Pressure</Text>
              <Text style={styles.vitalValue}>{review.vitals.bloodPressure}</Text>
            </View>
            <View style={styles.vitalItem}>
              <MaterialCommunityIcons name="heart" size={20} color="#E53E3E" />
              <Text style={styles.vitalLabel}>Heart Rate</Text>
              <Text style={styles.vitalValue}>{review.vitals.heartRate}</Text>
            </View>
            <View style={styles.vitalItem}>
              <MaterialCommunityIcons name="lungs" size={20} color="#E53E3E" />
              <Text style={styles.vitalLabel}>Respiratory Rate</Text>
              <Text style={styles.vitalValue}>{review.vitals.respiratoryRate}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Medical History */}
      {review.medicalHistory && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical History</Text>
          <Text style={styles.historyText}>{review.medicalHistory}</Text>
        </View>
      )}

      {/* Review Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Review</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Diagnosis *</Text>
          <TextInput
            style={styles.textInput}
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder="Enter your diagnosis"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confidence Level *</Text>
          <TextInput
            style={styles.textInput}
            value={confidence}
            onChangeText={setConfidence}
            placeholder="e.g., High, Medium, Low or percentage"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Treatment Recommendations</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={recommendations}
            onChangeText={setRecommendations}
            placeholder="Enter treatment recommendations and next steps"
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={submitReview}
          disabled={isSubmitting}
        >
          <MaterialCommunityIcons 
            name={isSubmitting ? "loading" : "check-circle"} 
            size={24} 
            color="#FFFFFF" 
          />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 16,
    color: '#718096',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#4A5568',
    marginLeft: 8,
  },
  medicalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  aiPredictionCard: {
    backgroundColor: '#EBF8FF',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginLeft: 8,
  },
  aiCondition: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  aiConfidence: {
    fontSize: 14,
    color: '#1E88E5',
    marginBottom: 8,
  },
  aiDetails: {
    fontSize: 14,
    color: '#4A5568',
  },
  symptomsList: {
    marginLeft: 8,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  symptomText: {
    fontSize: 16,
    color: '#4A5568',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vitalItem: {
    width: '48%',
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    textAlign: 'center',
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 2,
    textAlign: 'center',
  },
  historyText: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#CBD5E0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 12,
  },
});

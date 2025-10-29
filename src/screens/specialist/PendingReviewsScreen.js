import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getPendingReviews } from '../../services/diagnosisService';
import { ErrorBoundary, useToast, LoadingSpinner, NetworkStatus, OfflineBanner, ErrorMessage } from '../../components';

function PendingReviewsScreenContent({ navigation }) {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { userToken } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch pending diagnoses from backend
      const response = await getPendingReviews({ 
        status: 'pending',
        limit: 50 
      });
      
      // Transform backend data to match frontend expectations
      const transformedData = response.map(diagnosis => ({
        id: diagnosis.id.toString(),
        patientName: diagnosis.patient?.full_name || `Patient ${diagnosis.patient_id}`,
        patientAge: diagnosis.patient?.age || 'Unknown',
        diagnosisType: diagnosis.disease_type || 'General Diagnosis',
        submittedBy: diagnosis.created_by?.full_name || diagnosis.created_by?.username || 'Unknown',
        submittedAt: diagnosis.created_at,
        priority: diagnosis.urgency || 'medium',
        symptoms: diagnosis.symptoms ? JSON.parse(diagnosis.symptoms) : [],
        aiDiagnosis: diagnosis.ai_diagnosis,
        aiConfidence: diagnosis.ai_confidence,
        notes: diagnosis.notes,
      }));
      
      setPendingReviews(transformedData);
    } catch (error) {
      const errorMessage = 'Failed to fetch pending reviews. Please check your internet connection.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Error fetching pending reviews:', error);
      
      // If offline or error, show empty state
      setPendingReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingReviews();
    setRefreshing(false);
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

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'alert';
      case 'low':
        return 'information';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderReviewItem = ({ item }) => (
    <TouchableOpacity
      style={styles.reviewCard}
      onPress={() => navigation.navigate('ReviewDetailsScreen', { reviewId: item.id, reviewData: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.patientAge}>Age: {item.patientAge}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <MaterialCommunityIcons 
            name={getPriorityIcon(item.priority)} 
            size={16} 
            color="#FFFFFF" 
          />
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.diagnosisInfo}>
        <MaterialCommunityIcons name="medical-bag" size={20} color="#1E88E5" />
        <Text style={styles.diagnosisType}>{item.diagnosisType}</Text>
      </View>

      <View style={styles.submissionInfo}>
        <Text style={styles.submittedBy}>Submitted by: {item.submittedBy}</Text>
        <Text style={styles.submittedAt}>{formatDate(item.submittedAt)}</Text>
      </View>

      <View style={styles.symptomsContainer}>
        <Text style={styles.symptomsLabel}>Symptoms:</Text>
        <View style={styles.symptomsList}>
          {item.symptoms.slice(0, 2).map((symptom, index) => (
            <Text key={index} style={styles.symptomItem}>• {symptom}</Text>
          ))}
          {item.symptoms.length > 2 && (
            <Text style={styles.moreSymptoms}>+{item.symptoms.length - 2} more</Text>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#1E88E5" />
      </View>
    </TouchableOpacity>
  );

  if (isLoading && pendingReviews.length === 0) {
    return <LoadingSpinner message="Loading pending reviews..." />;
  }

  return (
    <View style={styles.container}>
      <NetworkStatus />
      <OfflineBanner />
      
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={fetchPendingReviews}
        />
      )}
      
      <View style={styles.header}>
        <Text style={styles.title}>Pending Reviews</Text>
        <Text style={styles.subtitle}>{pendingReviews.length} cases awaiting review</Text>
      </View>

      <FlatList
        data={pendingReviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-check" size={64} color="#CBD5E0" />
            <Text style={styles.emptyText}>No pending reviews</Text>
            <Text style={styles.emptySubtext}>All cases have been reviewed</Text>
          </View>
        }
      />
    </View>
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
  listContainer: {
    padding: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 2,
  },
  patientAge: {
    fontSize: 14,
    color: '#718096',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  diagnosisInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosisType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E88E5',
    marginLeft: 8,
  },
  submissionInfo: {
    marginBottom: 12,
  },
  submittedBy: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 2,
  },
  submittedAt: {
    fontSize: 12,
    color: '#718096',
  },
  symptomsContainer: {
    marginBottom: 12,
  },
  symptomsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 4,
  },
  symptomsList: {
    marginLeft: 8,
  },
  symptomItem: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 2,
  },
  moreSymptoms: {
    fontSize: 14,
    color: '#1E88E5',
    fontStyle: 'italic',
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
  },
});

export default function PendingReviewsScreen({ navigation }) {
  return (
    <ErrorBoundary>
      <PendingReviewsScreenContent navigation={navigation} />
    </ErrorBoundary>
  );
}

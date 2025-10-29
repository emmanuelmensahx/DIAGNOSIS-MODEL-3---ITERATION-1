import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Chip, 
  Divider, 
  List,
  Surface,
  ProgressBar,
  IconButton
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { ErrorBoundary, useToast, NetworkStatus, OfflineBanner } from '../../components';

const DiagnosisResultScreenContent = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  const { result } = route.params || {};

  if (!result || !result.prediction) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Title>Error</Title>
            <Paragraph>No diagnosis results available.</Paragraph>
            <Button 
              mode="contained" 
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  const prediction = result.prediction;
  const confidence = prediction.confidence || 0;
  const diagnosis = prediction.diagnosis || 'Unknown';
  const diseaseType = prediction.disease_type || 'Unknown';
  const criticalIndicators = prediction.critical_indicators || false;
  const specialistReferral = prediction.specialist_referral || false;
  const treatmentRecommendations = prediction.treatment_recommendations || {};
  const diagnosisDetails = prediction.diagnosis_details || {};
  
  // LLM-enhanced analysis data
  const llmAnalysis = prediction.llm_analysis || null;
  const isLLMEnhanced = !!llmAnalysis;
  const differentialDiagnoses = llmAnalysis?.differential_diagnoses || [];
  const riskLevel = llmAnalysis?.risk_level || null;
  const redFlags = llmAnalysis?.red_flags || [];
  const llmConfidence = llmAnalysis?.confidence_score || null;
  
  // Validation status data
  const validationStatus = prediction.validation_status || null;
  const isValidated = validationStatus?.is_valid || false;
  const qualityScore = validationStatus?.quality_score || null;
  const validationWarnings = validationStatus?.warnings || null;
  const validationRecommendations = validationStatus?.recommendations || null;

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#4CAF50'; // Green
    if (confidence >= 0.6) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  const handleSpecialistReferral = () => {
    showToast('Initiating specialist referral...', 'info');
    // Navigate to specialist referral screen
    navigation.navigate('SpecialistReferral', { 
      diagnosis: result,
      patient: route.params?.patient 
    });
  };

  const handleSaveAndContinue = () => {
    showToast('Diagnosis saved to patient record', 'success');
    // Navigate to patient list after a short delay
    setTimeout(() => {
      // Navigate to the Patients tab within the FrontlineHome navigator
      navigation.navigate('FrontlineHome', { screen: 'Patients' });
    }, 1500);
  };

  return (
    <ScrollView style={styles.container}>
      <NetworkStatus />
      <OfflineBanner />
      
      {/* Critical Alert */}
      {criticalIndicators && (
        <Card style={[styles.card, styles.criticalCard]}>
          <Card.Content>
            <View style={styles.criticalHeader}>
              <Icon name="alert" size={24} color="#F44336" />
              <Title style={styles.criticalTitle}>Critical Indicators Detected</Title>
            </View>
            <Paragraph style={styles.criticalText}>
              This patient shows critical symptoms requiring immediate attention.
            </Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Main Diagnosis Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.diagnosisHeader}>
            <Title style={styles.diagnosisTitle}>{diagnosis}</Title>
            <Chip 
              mode="outlined" 
              style={[styles.diseaseChip, { borderColor: getConfidenceColor(confidence) }]}
            >
              {diseaseType.replace('_', ' ').toUpperCase()}
            </Chip>
          </View>
          
          <View style={styles.confidenceSection}>
            <View style={styles.confidenceHeader}>
              <Paragraph style={styles.confidenceLabel}>Confidence Level</Paragraph>
              <Paragraph style={[styles.confidenceText, { color: getConfidenceColor(confidence) }]}>
                {getConfidenceText(confidence)}
              </Paragraph>
            </View>
            <ProgressBar 
              progress={confidence} 
              color={getConfidenceColor(confidence)}
              style={styles.progressBar}
            />
            <Paragraph style={styles.confidencePercentage}>
              {(() => {
                if (confidence > 1) {
                  return confidence.toFixed(1) + '%';
                } else {
                  return (confidence * 100).toFixed(1) + '%';
                }
              })()}
            </Paragraph>
          </View>
        </Card.Content>
      </Card>

      {/* LLM Enhanced Analysis */}
      {isLLMEnhanced && (
        <Card style={[styles.card, styles.llmCard]}>
          <Card.Content>
            <View style={styles.llmHeader}>
              <Icon name="brain" size={24} color="#2196F3" />
              <Title style={styles.llmTitle}>AI-Enhanced Analysis</Title>
            </View>
            
            {riskLevel && (
              <View style={styles.riskLevelContainer}>
                <Paragraph style={styles.riskLabel}>Risk Level:</Paragraph>
                <Chip 
                  style={[
                    styles.riskChip,
                    riskLevel === 'high' && styles.highRisk,
                    riskLevel === 'medium' && styles.mediumRisk,
                    riskLevel === 'low' && styles.lowRisk
                  ]}
                >
                  {riskLevel.toUpperCase()}
                </Chip>
              </View>
            )}
            
            {llmConfidence && (
              <View style={styles.llmConfidenceContainer}>
                <Paragraph style={styles.llmConfidenceLabel}>AI Confidence:</Paragraph>
                <Paragraph style={styles.llmConfidenceValue}>
                  {(() => {
                    if (llmConfidence > 1) {
                      return llmConfidence + '%';
                    } else {
                      return (llmConfidence * 100).toFixed(1) + '%';
                    }
                  })()}
                </Paragraph>
              </View>
            )}
            
            {/* Validation Status */}
            {validationStatus && (
              <View style={styles.validationContainer}>
                <View style={styles.validationHeader}>
                  <Icon name="check-circle" size={20} color={isValidated ? "#4CAF50" : "#FF9800"} />
                  <Paragraph style={styles.validationLabel}>Validation Status</Paragraph>
                </View>
                <View style={styles.validationDetails}>
                  <Paragraph style={styles.validationText}>
                    Status: {isValidated ? "✅ Validated" : "⚠️ Needs Review"}
                  </Paragraph>
                  {qualityScore && (
                    <Paragraph style={styles.validationText}>
                      Quality Score: {qualityScore}
                    </Paragraph>
                  )}
                  {validationWarnings && (
                    <Paragraph style={[styles.validationText, styles.warningText]}>
                      Warning: {validationWarnings}
                    </Paragraph>
                  )}
                  {validationRecommendations && (
                    <Paragraph style={styles.validationText}>
                      Recommendation: {validationRecommendations}
                    </Paragraph>
                  )}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <Card style={[styles.card, styles.redFlagsCard]}>
          <Card.Content>
            <View style={styles.redFlagsHeader}>
              <Icon name="alert-circle" size={24} color="#F44336" />
              <Title style={styles.redFlagsTitle}>Red Flags</Title>
            </View>
            <View style={styles.redFlagsContainer}>
              {redFlags.map((flag, index) => (
                <Surface key={index} style={styles.redFlagItem}>
                  <Paragraph style={styles.redFlagText}>{flag}</Paragraph>
                </Surface>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Differential Diagnoses */}
      {differentialDiagnoses.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Differential Diagnoses</Title>
            {differentialDiagnoses.map((diff, index) => (
              <Surface key={index} style={styles.differentialItem}>
                <View style={styles.differentialHeader}>
                  <Paragraph style={styles.differentialDiagnosis}>{diff.diagnosis}</Paragraph>
                  <Chip style={styles.differentialProbability}>
                    {diff.probability}%
                  </Chip>
                </View>
                {diff.reasoning && (
                  <Paragraph style={styles.differentialReasoning}>{diff.reasoning}</Paragraph>
                )}
              </Surface>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Diagnosis Details */}
      {diagnosisDetails.primary_indicators && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Key Indicators</Title>
            <View style={styles.indicatorsContainer}>
              {diagnosisDetails.primary_indicators.map((indicator, index) => (
                <Chip key={index} style={styles.indicatorChip}>
                  {indicator.replace('_', ' ')}
                </Chip>
              ))}
            </View>
            
            {diagnosisDetails.severity && (
              <View style={styles.severityContainer}>
                <Paragraph style={styles.severityLabel}>Severity:</Paragraph>
                <Chip 
                  style={[
                    styles.severityChip,
                    diagnosisDetails.severity === 'severe' && styles.severeSeverity,
                    diagnosisDetails.severity === 'moderate' && styles.moderateSeverity
                  ]}
                >
                  {diagnosisDetails.severity.toUpperCase()}
                </Chip>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Treatment Recommendations */}
      {treatmentRecommendations.recommendation && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Treatment Recommendations</Title>
            
            <Surface style={styles.recommendationSurface}>
              <Paragraph style={styles.recommendationText}>
                {treatmentRecommendations.recommendation}
              </Paragraph>
            </Surface>

            {treatmentRecommendations.medications && (
              <View style={styles.medicationsSection}>
                <Paragraph style={styles.subsectionTitle}>Medications:</Paragraph>
                {treatmentRecommendations.medications.map((medication, index) => (
                  <List.Item
                    key={index}
                    title={medication}
                    left={(props) => <List.Icon {...props} icon="pill" />}
                    titleStyle={styles.medicationItem}
                  />
                ))}
              </View>
            )}

            {treatmentRecommendations.duration && (
              <Paragraph style={styles.durationText}>
                Duration: {treatmentRecommendations.duration}
              </Paragraph>
            )}

            {treatmentRecommendations.follow_up && (
              <Paragraph style={styles.followUpText}>
                Follow-up: {treatmentRecommendations.follow_up}
              </Paragraph>
            )}

            {treatmentRecommendations.notes && (
              <Surface style={styles.notesSurface}>
                <Paragraph style={styles.notesText}>
                  <Icon name="information" size={16} /> {treatmentRecommendations.notes}
                </Paragraph>
              </Surface>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Next Steps</Title>
          
          {specialistReferral && (
            <Button
              mode="contained"
              onPress={handleSpecialistReferral}
              style={[styles.actionButton, styles.referralButton]}
              icon="account-tie"
            >
              Refer to Specialist
            </Button>
          )}
          
          <Button
            mode="contained"
            onPress={handleSaveAndContinue}
            style={styles.actionButton}
            icon="content-save"
          >
            Save Diagnosis
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
            icon="arrow-left"
          >
            Back to Diagnosis
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  errorCard: {
    margin: 16,
  },
  criticalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  criticalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  criticalTitle: {
    marginLeft: 8,
    color: '#F44336',
    fontSize: 18,
  },
  criticalText: {
    color: '#D32F2F',
    fontWeight: '500',
  },
  diagnosisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  diagnosisTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  diseaseChip: {
    marginLeft: 8,
  },
  confidenceSection: {
    marginTop: 8,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  confidencePercentage: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  indicatorChip: {
    margin: 4,
    backgroundColor: '#E3F2FD',
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  severityChip: {
    backgroundColor: '#4CAF50',
  },
  moderateSeverity: {
    backgroundColor: '#FF9800',
  },
  severeSeverity: {
    backgroundColor: '#F44336',
  },
  recommendationSurface: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  medicationsSection: {
    marginTop: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  medicationItem: {
    fontSize: 14,
  },
  durationText: {
    marginTop: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  followUpText: {
    marginTop: 4,
    fontSize: 14,
    fontStyle: 'italic',
  },
  notesSurface: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#FFF3E0',
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#E65100',
  },
  actionButton: {
    marginBottom: 12,
  },
  referralButton: {
    backgroundColor: '#FF5722',
  },
  button: {
    marginTop: 16,
  },
  // LLM Analysis Styles
  llmCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  llmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  llmTitle: {
    marginLeft: 8,
    color: '#1976D2',
    fontSize: 18,
  },
  riskLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  riskChip: {
    backgroundColor: '#4CAF50',
  },
  highRisk: {
    backgroundColor: '#F44336',
  },
  mediumRisk: {
    backgroundColor: '#FF9800',
  },
  lowRisk: {
    backgroundColor: '#4CAF50',
  },
  llmConfidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  llmConfidenceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  llmConfidenceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  redFlagsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  redFlagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  redFlagsTitle: {
    marginLeft: 8,
    color: '#F44336',
    fontSize: 18,
  },
  redFlagsContainer: {
    gap: 8,
  },
  redFlagItem: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#FFCDD2',
    marginBottom: 4,
  },
  redFlagText: {
    color: '#D32F2F',
    fontWeight: '500',
  },
  differentialItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  differentialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  differentialDiagnosis: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  differentialProbability: {
    backgroundColor: '#E0E0E0',
    marginLeft: 8,
  },
  differentialReasoning: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  validationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  validationLabel: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  validationDetails: {
    gap: 4,
  },
  validationText: {
    fontSize: 14,
    color: '#333',
  },
  warningText: {
    color: '#FF9800',
    fontWeight: '500',
  },
});

const DiagnosisResultScreen = () => {
  return (
    <ErrorBoundary>
      <DiagnosisResultScreenContent />
    </ErrorBoundary>
  );
};

export default DiagnosisResultScreen;

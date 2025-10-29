import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { createTreatment } from '../../services/treatmentService';
import { ErrorBoundary, useToast, LoadingSpinner, NetworkStatus, OfflineBanner, ValidatedTextInput, FormSection, FormSubmitButton } from '../../components';

function TreatmentPlanScreenContent({ navigation, route }) {
  const { patientId, diagnosisData } = route.params || {};
  const { showToast } = useToast();
  const [treatmentPlan, setTreatmentPlan] = useState({
    diagnosis: '',
    medications: [],
    procedures: [],
    followUpInstructions: '',
    emergencyInstructions: '',
    nextAppointment: '',
    specialistReferral: false,
    referralNotes: '',
  });
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });
  const [newProcedure, setNewProcedure] = useState({
    name: '',
    description: '',
    urgency: 'routine',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userToken } = useAuth();
  const { isOffline } = useOffline();

  useEffect(() => {
    if (diagnosisData) {
      setTreatmentPlan(prev => ({
        ...prev,
        diagnosis: diagnosisData.diagnosis || '',
      }));
    }
  }, [diagnosisData]);

  const addMedication = () => {
    if (!newMedication.name.trim() || !newMedication.dosage.trim()) {
      showToast('Please provide medication name and dosage', 'error');
      return;
    }

    setTreatmentPlan(prev => ({
      ...prev,
      medications: [...prev.medications, { ...newMedication, id: Date.now().toString() }],
    }));

    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    });
  };

  const removeMedication = (id) => {
    setTreatmentPlan(prev => ({
      ...prev,
      medications: prev.medications.filter(med => med.id !== id),
    }));
  };

  const addProcedure = () => {
    if (!newProcedure.name.trim()) {
      showToast('Please provide procedure name', 'error');
      return;
    }

    setTreatmentPlan(prev => ({
      ...prev,
      procedures: [...prev.procedures, { ...newProcedure, id: Date.now().toString() }],
    }));

    setNewProcedure({
      name: '',
      description: '',
      urgency: 'routine',
    });
  };

  const removeProcedure = (id) => {
    setTreatmentPlan(prev => ({
      ...prev,
      procedures: prev.procedures.filter(proc => proc.id !== id),
    }));
  };

  const saveTreatmentPlan = async () => {
    if (!treatmentPlan.diagnosis.trim()) {
      showToast('Please provide a diagnosis', 'error');
      return;
    }

    if (treatmentPlan.medications.length === 0 && treatmentPlan.procedures.length === 0) {
      showToast('Please add at least one medication or procedure', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Format treatment plan for backend API
      const treatmentPlanText = formatTreatmentPlanText();
      
      const treatmentData = {
        diagnosis_id: diagnosisData?.id || null,
        treatment_plan: treatmentPlanText,
        start_date: new Date().toISOString(),
        end_date: null, // Can be set later based on treatment duration
        notes: `Patient ID: ${patientId}\n\nAdditional Notes:\n${treatmentPlan.followUpInstructions || 'No additional notes'}`
      };

      console.log('Saving treatment plan:', treatmentData);
      
      const result = await createTreatment(treatmentData);
      
      if (result.success) {
        const toastMessage = result.offline 
          ? 'Treatment plan saved offline and will sync when connected'
          : 'Treatment plan saved successfully';
        
        showToast(toastMessage, 'success');
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        throw new Error(result.message || 'Failed to save treatment plan');
      }
    } catch (error) {
      console.error('Error saving treatment plan:', error);
      showToast(
        error.message || 'Failed to save treatment plan. Please try again.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTreatmentPlanText = () => {
    let planText = `DIAGNOSIS: ${treatmentPlan.diagnosis}\n\n`;
    
    if (treatmentPlan.medications.length > 0) {
      planText += 'MEDICATIONS:\n';
      treatmentPlan.medications.forEach((med, index) => {
        planText += `${index + 1}. ${med.name}\n`;
        planText += `   Dosage: ${med.dosage}\n`;
        planText += `   Frequency: ${med.frequency}\n`;
        planText += `   Duration: ${med.duration}\n`;
        if (med.instructions) {
          planText += `   Instructions: ${med.instructions}\n`;
        }
        planText += '\n';
      });
    }
    
    if (treatmentPlan.procedures.length > 0) {
      planText += 'PROCEDURES:\n';
      treatmentPlan.procedures.forEach((proc, index) => {
        planText += `${index + 1}. ${proc.name} (${proc.urgency})\n`;
        if (proc.description) {
          planText += `   Description: ${proc.description}\n`;
        }
        planText += '\n';
      });
    }
    
    if (treatmentPlan.followUpInstructions) {
      planText += `FOLLOW-UP INSTRUCTIONS:\n${treatmentPlan.followUpInstructions}\n\n`;
    }
    
    if (treatmentPlan.emergencyInstructions) {
      planText += `EMERGENCY INSTRUCTIONS:\n${treatmentPlan.emergencyInstructions}\n\n`;
    }
    
    if (treatmentPlan.nextAppointment) {
      planText += `NEXT APPOINTMENT:\n${treatmentPlan.nextAppointment}\n\n`;
    }
    
    if (treatmentPlan.specialistReferral && treatmentPlan.referralNotes) {
      planText += `SPECIALIST REFERRAL:\n${treatmentPlan.referralNotes}\n\n`;
    }
    
    return planText.trim();
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent':
        return '#E53E3E';
      case 'priority':
        return '#F56500';
      case 'routine':
        return '#38A169';
      default:
        return '#718096';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <NetworkStatus />
      <OfflineBanner />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Treatment Plan</Text>
        <Text style={styles.subtitle}>Create comprehensive treatment plan</Text>
      </View>

      {/* Diagnosis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnosis</Text>
        <TextInput
          style={styles.textInput}
          value={treatmentPlan.diagnosis}
          onChangeText={(text) => setTreatmentPlan(prev => ({ ...prev, diagnosis: text }))}
          placeholder="Enter primary diagnosis"
          multiline
        />
      </View>

      {/* Medications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medications</Text>
        
        {/* Existing Medications */}
        {treatmentPlan.medications.map((medication) => (
          <View key={medication.id} style={styles.medicationCard}>
            <View style={styles.medicationHeader}>
              <MaterialCommunityIcons name="pill" size={20} color="#1E88E5" />
              <Text style={styles.medicationName}>{medication.name}</Text>
              <TouchableOpacity onPress={() => removeMedication(medication.id)}>
                <MaterialCommunityIcons name="close" size={20} color="#E53E3E" />
              </TouchableOpacity>
            </View>
            <Text style={styles.medicationDetails}>
              {medication.dosage} • {medication.frequency} • {medication.duration}
            </Text>
            {medication.instructions && (
              <Text style={styles.medicationInstructions}>{medication.instructions}</Text>
            )}
          </View>
        ))}

        {/* Add New Medication */}
        <View style={styles.addMedicationForm}>
          <Text style={styles.formTitle}>Add Medication</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Medication Name</Text>
              <TextInput
                style={styles.textInput}
                value={newMedication.name}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Amoxicillin"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Dosage</Text>
              <TextInput
                style={styles.textInput}
                value={newMedication.dosage}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, dosage: text }))}
                placeholder="e.g., 500mg"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <TextInput
                style={styles.textInput}
                value={newMedication.frequency}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, frequency: text }))}
                placeholder="e.g., 3 times daily"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Duration</Text>
              <TextInput
                style={styles.textInput}
                value={newMedication.duration}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, duration: text }))}
                placeholder="e.g., 7 days"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Special Instructions</Text>
          <TextInput
            style={styles.textInput}
            value={newMedication.instructions}
            onChangeText={(text) => setNewMedication(prev => ({ ...prev, instructions: text }))}
            placeholder="e.g., Take with food"
            multiline
          />

          <TouchableOpacity style={styles.addButton} onPress={addMedication}>
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Medication</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Procedures */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Procedures & Tests</Text>
        
        {/* Existing Procedures */}
        {treatmentPlan.procedures.map((procedure) => (
          <View key={procedure.id} style={styles.procedureCard}>
            <View style={styles.procedureHeader}>
              <MaterialCommunityIcons name="medical-bag" size={20} color="#1E88E5" />
              <Text style={styles.procedureName}>{procedure.name}</Text>
              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(procedure.urgency) }]}>
                <Text style={styles.urgencyText}>{procedure.urgency.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => removeProcedure(procedure.id)}>
                <MaterialCommunityIcons name="close" size={20} color="#E53E3E" />
              </TouchableOpacity>
            </View>
            {procedure.description && (
              <Text style={styles.procedureDescription}>{procedure.description}</Text>
            )}
          </View>
        ))}

        {/* Add New Procedure */}
        <View style={styles.addProcedureForm}>
          <Text style={styles.formTitle}>Add Procedure/Test</Text>
          
          <Text style={styles.inputLabel}>Procedure Name</Text>
          <TextInput
            style={styles.textInput}
            value={newProcedure.name}
            onChangeText={(text) => setNewProcedure(prev => ({ ...prev, name: text }))}
            placeholder="e.g., Blood culture, CT scan"
          />

          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={styles.textInput}
            value={newProcedure.description}
            onChangeText={(text) => setNewProcedure(prev => ({ ...prev, description: text }))}
            placeholder="Additional details or instructions"
            multiline
          />

          <Text style={styles.inputLabel}>Urgency</Text>
          <View style={styles.urgencySelector}>
            {['routine', 'priority', 'urgent'].map((urgency) => (
              <TouchableOpacity
                key={urgency}
                style={[
                  styles.urgencyOption,
                  newProcedure.urgency === urgency && styles.selectedUrgency,
                  { borderColor: getUrgencyColor(urgency) },
                ]}
                onPress={() => setNewProcedure(prev => ({ ...prev, urgency }))}
              >
                <Text
                  style={[
                    styles.urgencyOptionText,
                    newProcedure.urgency === urgency && { color: getUrgencyColor(urgency) },
                  ]}
                >
                  {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={addProcedure}>
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Procedure</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Follow-up Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Follow-up Instructions</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={treatmentPlan.followUpInstructions}
          onChangeText={(text) => setTreatmentPlan(prev => ({ ...prev, followUpInstructions: text }))}
          placeholder="Provide detailed follow-up instructions for the patient"
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Emergency Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Instructions</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={treatmentPlan.emergencyInstructions}
          onChangeText={(text) => setTreatmentPlan(prev => ({ ...prev, emergencyInstructions: text }))}
          placeholder="When to seek immediate medical attention"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Next Appointment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Next Appointment</Text>
        <TextInput
          style={styles.textInput}
          value={treatmentPlan.nextAppointment}
          onChangeText={(text) => setTreatmentPlan(prev => ({ ...prev, nextAppointment: text }))}
          placeholder="e.g., Follow-up in 1 week, Return if symptoms worsen"
        />
      </View>

      {/* Specialist Referral */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.sectionTitle}>Specialist Referral</Text>
          <Switch
            value={treatmentPlan.specialistReferral}
            onValueChange={(value) => setTreatmentPlan(prev => ({ ...prev, specialistReferral: value }))}
            trackColor={{ false: '#CBD5E0', true: '#1E88E5' }}
            thumbColor={treatmentPlan.specialistReferral ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>
        
        {treatmentPlan.specialistReferral && (
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={treatmentPlan.referralNotes}
            onChangeText={(text) => setTreatmentPlan(prev => ({ ...prev, referralNotes: text }))}
            placeholder="Referral notes and specialist type needed"
            multiline
            numberOfLines={3}
          />
        )}
      </View>

      {/* Save Button */}
      <View style={styles.submitContainer}>
        <FormSubmitButton
          title="Save Treatment Plan"
          onPress={saveTreatmentPlan}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.saveButton}
        />
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
  medicationCard: {
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    flex: 1,
    marginLeft: 8,
  },
  medicationDetails: {
    fontSize: 14,
    color: '#1E88E5',
    marginLeft: 28,
  },
  medicationInstructions: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 28,
    marginTop: 4,
    fontStyle: 'italic',
  },
  procedureCard: {
    backgroundColor: '#F0FFF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#38A169',
  },
  procedureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  procedureName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    flex: 1,
    marginLeft: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  procedureDescription: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 28,
    marginTop: 4,
  },
  addMedicationForm: {
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  addProcedureForm: {
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputHalf: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 6,
  },
  urgencySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  urgencyOption: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
  },
  selectedUrgency: {
    backgroundColor: '#F7FAFC',
  },
  urgencyOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  addButton: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    backgroundColor: '#38A169',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#CBD5E0',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

// Wrapper component with error handling
const TreatmentPlanScreen = (props) => {
  return (
    <ErrorBoundary>
      <TreatmentPlanScreenContent {...props} />
    </ErrorBoundary>
  );
};

export default TreatmentPlanScreen;

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { updatePatient } from '../../services/patientService';
import { useOffline } from '../../context/OfflineContext';
import { ErrorBoundary, useToast, NetworkStatus, OfflineBanner, ValidatedTextInput, FormSubmitButton } from '../../components';

const validationSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  dateOfBirth: Yup.string()
    .required('Date of birth is required')
    .matches(/\d{4}-\d{2}-\d{2}/, 'Use format YYYY-MM-DD'),
  gender: Yup.string()
    .required('Gender is required')
    .oneOf(['male', 'female', 'other'], 'Please select a valid gender'),
  address: Yup.string().required('Address is required'),
  phoneNumber: Yup.string(),
  medicalHistory: Yup.string(),
});

function EditPatientScreenContent({ route, navigation }) {
  const { patient } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);
  const { isOffline } = useOffline();
  const { showToast } = useToast();

  if (!patient) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Edit Patient</Text>
        <Text style={styles.errorText}>No patient data provided.</Text>
      </ScrollView>
    );
  }

  const initialValues = {
    firstName: patient.first_name || '',
    lastName: patient.last_name || '',
    dateOfBirth: patient.date_of_birth || '',
    gender: (patient.gender || '').toLowerCase(),
    address: patient.address || '',
    phoneNumber: patient.phone_number || '',
    medicalHistory: patient.medical_history || '',
  };

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const patientData = {
        first_name: values.firstName,
        last_name: values.lastName,
        date_of_birth: values.dateOfBirth,
        gender: values.gender.toLowerCase(),
        address: values.address,
        phone_number: values.phoneNumber,
        medical_history: values.medicalHistory,
      };

      const updated = await updatePatient(patient.id, patientData);

      const message = isOffline
        ? 'Patient updated locally. Data will sync when online.'
        : 'Patient updated successfully';
      showToast(message, 'success');

      // Navigate back after a brief delay
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error) {
      console.error('Error updating patient:', error);
      showToast('Failed to update patient. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <NetworkStatus />
      <OfflineBanner />
      <Text style={styles.title}>Edit Patient</Text>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles.form}>
            <ValidatedTextInput
              label="First Name *"
              value={values.firstName}
              onChangeText={(text) => setFieldValue('firstName', text)}
              onBlur={handleBlur('firstName')}
              placeholder="Enter first name"
              error={touched.firstName && errors.firstName}
              errorMessage={touched.firstName && errors.firstName ? errors.firstName : ''}
              style={styles.input}
            />

            <ValidatedTextInput
              label="Last Name *"
              value={values.lastName}
              onChangeText={(text) => setFieldValue('lastName', text)}
              onBlur={handleBlur('lastName')}
              placeholder="Enter last name"
              error={touched.lastName && errors.lastName}
              errorMessage={touched.lastName && errors.lastName ? errors.lastName : ''}
              style={styles.input}
            />

            <ValidatedTextInput
              label="Date of Birth (YYYY-MM-DD) *"
              value={values.dateOfBirth}
              onChangeText={(text) => setFieldValue('dateOfBirth', text)}
              onBlur={handleBlur('dateOfBirth')}
              placeholder="e.g., 1990-01-31"
              keyboardType="default"
              error={touched.dateOfBirth && errors.dateOfBirth}
              errorMessage={touched.dateOfBirth && errors.dateOfBirth ? errors.dateOfBirth : ''}
              style={styles.input}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderContainer}>
                {['male', 'female', 'other'].map((genderOption) => (
                  <TouchableOpacity
                    key={genderOption}
                    style={[
                      styles.genderButton,
                      values.gender === genderOption && styles.selectedGenderButton,
                    ]}
                    onPress={() => setFieldValue('gender', genderOption)}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        values.gender === genderOption && styles.selectedGenderButtonText,
                      ]}
                    >
                      {genderOption.charAt(0).toUpperCase() + genderOption.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {touched.gender && errors.gender && (
                <Text style={styles.errorText}>{errors.gender}</Text>
              )}
            </View>

            <ValidatedTextInput
              label="Address *"
              value={values.address}
              onChangeText={(text) => setFieldValue('address', text)}
              onBlur={handleBlur('address')}
              placeholder="Enter address (e.g., City, Region)"
              error={touched.address && errors.address}
              errorMessage={touched.address && errors.address ? errors.address : ''}
              style={styles.input}
            />

            <ValidatedTextInput
              label="Phone Number"
              value={values.phoneNumber}
              onChangeText={(text) => setFieldValue('phoneNumber', text)}
              onBlur={handleBlur('phoneNumber')}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <ValidatedTextInput
              label="Medical History"
              value={values.medicalHistory}
              onChangeText={(text) => setFieldValue('medicalHistory', text)}
              onBlur={handleBlur('medicalHistory')}
              placeholder="Enter any relevant medical history"
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textArea]}
            />

            <FormSubmitButton
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              title="Save Changes"
              style={styles.submitButton}
            />
          </View>
        )}
      </Formik>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  selectedGenderButton: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedGenderButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 14,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
});

const EditPatientScreen = (props) => (
  <ErrorBoundary>
    <EditPatientScreenContent {...props} />
  </ErrorBoundary>
);

export default EditPatientScreen;

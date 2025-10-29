import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, RadioButton, useTheme } from 'react-native-paper';
import { ErrorBoundary, useToast, FormSubmitButton, NetworkStatus, OfflineBanner } from '../../components';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { register } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';

// Validation schema
const RegisterSchema = Yup.object().shape({
  name: Yup.string().required('Full name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  role: Yup.string().required('Role is required'),
  specialization: Yup.string().when('role', {
    is: 'specialist',
    then: Yup.string().required('Specialization is required'),
  }),
  licenseNumber: Yup.string().when('role', {
    is: val => val === 'frontline_worker' || val === 'specialist',
    then: Yup.string().required('License number is required'),
  }),
});

const RegisterScreenContent = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const { signIn } = useAuth();
  const { isOffline } = useOffline();
  const theme = useTheme();
  const { showToast } = useToast();

  const handleRegister = async (values) => {
    if (isOffline) {
      showToast('You are currently offline. Please connect to the internet to register.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Format the data for the API
      const userData = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        specialization: values.specialization || null,
        license_number: values.licenseNumber || null,
      };

      const response = await register(userData);
      showToast('Registration successful! Welcome to AfriDiag.', 'success');
      signIn(response.token);
    } catch (error) {
      showToast(`Registration failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <NetworkStatus />
      <OfflineBanner />
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join AfriDiag to help diagnose and treat diseases</Text>
        
        <Surface style={styles.formContainer}>
          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              role: 'frontline_worker',
              specialization: '',
              licenseNumber: '',
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleRegister}
          >
            {({ handleSubmit, setFieldValue, values, errors, touched }) => (
              <>
                <TextInput
                  label="Full Name"
                  value={values.name}
                  onChangeText={(text) => setFieldValue('name', text)}
                  mode="outlined"
                  style={styles.input}
                  error={touched.name && errors.name}
                />
                {touched.name && errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
                
                <TextInput
                  label="Email"
                  value={values.email}
                  onChangeText={(text) => setFieldValue('email', text)}
                  mode="outlined"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  error={touched.email && errors.email}
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
                
                <TextInput
                  label="Password"
                  value={values.password}
                  onChangeText={(text) => setFieldValue('password', text)}
                  mode="outlined"
                  secureTextEntry={secureTextEntry}
                  style={styles.input}
                  error={touched.password && errors.password}
                  right={
                    <TextInput.Icon
                      icon={secureTextEntry ? 'eye' : 'eye-off'}
                      onPress={() => setSecureTextEntry(!secureTextEntry)}
                    />
                  }
                />
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
                
                <TextInput
                  label="Confirm Password"
                  value={values.confirmPassword}
                  onChangeText={(text) => setFieldValue('confirmPassword', text)}
                  mode="outlined"
                  secureTextEntry={confirmSecureTextEntry}
                  style={styles.input}
                  error={touched.confirmPassword && errors.confirmPassword}
                  right={
                    <TextInput.Icon
                      icon={confirmSecureTextEntry ? 'eye' : 'eye-off'}
                      onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                    />
                  }
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
                
                <Text style={styles.sectionTitle}>Role</Text>
                <RadioButton.Group
                  onValueChange={(value) => setFieldValue('role', value)}
                  value={values.role}
                >
                  <View style={styles.radioOption}>
                    <RadioButton value="frontline_worker" />
                    <Text>Frontline Worker</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="specialist" />
                    <Text>Specialist</Text>
                  </View>
                </RadioButton.Group>
                
                {values.role === 'specialist' && (
                  <>
                    <TextInput
                      label="Specialization"
                      value={values.specialization}
                      onChangeText={(text) => setFieldValue('specialization', text)}
                      mode="outlined"
                      style={styles.input}
                      error={touched.specialization && errors.specialization}
                    />
                    {touched.specialization && errors.specialization && (
                      <Text style={styles.errorText}>{errors.specialization}</Text>
                    )}
                  </>
                )}
                
                <TextInput
                  label="License Number"
                  value={values.licenseNumber}
                  onChangeText={(text) => setFieldValue('licenseNumber', text)}
                  mode="outlined"
                  style={styles.input}
                  error={touched.licenseNumber && errors.licenseNumber}
                />
                {touched.licenseNumber && errors.licenseNumber && (
                  <Text style={styles.errorText}>{errors.licenseNumber}</Text>
                )}
                
                <FormSubmitButton
                  title="Register"
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading || isOffline}
                  style={styles.button}
                />
              </>
            )}
          </Formik>
          
          <View style={styles.loginContainer}>
            <Text>Already have an account? </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.loginButton}
            >
              Login
            </Button>
          </View>
        </Surface>
        
        {isOffline && (
          <View style={styles.offlineContainer}>
            <Text style={styles.offlineText}>You are offline. Some features may be limited.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.7,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  input: {
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButton: {
    marginLeft: -10,
  },
  offlineContainer: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  offlineText: {
    color: '#856404',
  },
});

const RegisterScreen = (props) => {
  return (
    <ErrorBoundary>
      <RegisterScreenContent {...props} />
    </ErrorBoundary>
  );
};

export default RegisterScreen;

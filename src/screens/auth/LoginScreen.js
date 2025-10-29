import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, RadioButton, Card } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { login } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { ErrorBoundary, useToast, LoadingSpinner, NetworkStatus, OfflineBanner, ValidatedTextInput, FormSection, FormSubmitButton } from '../../components';

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string(),
});

const LoginScreenContent = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [selectedUser, setSelectedUser] = useState('admin');
  const { signIn } = useAuth();
  const { isOffline } = useOffline();
  const { showToast } = useToast();
  const theme = useTheme();

  // Demo user profiles
  const userProfiles = {
    frontline_worker: {
      id: 1,
      email: 'frontline@afridiag.org',
      name: 'Dr. Sarah Mwangi',
      role: 'frontline_worker',
      location: 'Rural Health Center, Kenya',
      specialization: 'General Practice',
      is_active: true,
      password: 'frontline123'
    },
    specialist: {
      id: 2,
      email: 'specialist@afridiag.org',
      name: 'Dr. James Okafor',
      role: 'specialist',
      location: 'University Hospital, Nigeria',
      specialization: 'Pulmonology',
      is_active: true,
      password: 'specialist123'
    },
    admin: {
      id: 3,
      email: 'admin@afridiag.org',
      name: 'Dr. Amina Hassan',
      role: 'admin',
      location: 'AfriDiag Headquarters',
      specialization: 'Health Informatics',
      is_active: true,
      password: 'admin123'
    }
  };

  const handleLogin = async (values) => {
    setLoading(true);
    const selectedProfile = userProfiles[selectedUser];
    const email = values.email;
    const password = values.password || selectedProfile.password;

    if (isOffline) {
      showToast('You appear offline — login may fail.', 'error');
    }

    console.log('Login attempt', {
      email,
      hasPassword: !!password,
      selectedUser,
      apiUrl: process.env.API_URL,
    });

    try {
      const result = await login(email, password);
      console.log('Login success', {
        tokenPreview: result?.token?.slice(0, 16),
        user: result?.user,
      });

      showToast(
        `Welcome ${selectedProfile.name}! Role: ${selectedProfile.role}`,
        'success'
      );

      setTimeout(() => {
        signIn(result.token, result.user);
      }, 1000);
    } catch (error) {
      const status = error?.status || error?.response?.status;
      const detail = error?.detail || error?.response?.data || error?.message;

      console.error('Login error details', { status, detail, error });

      let message = 'Login failed. Please try again.';
      if (status === 401) {
        message = 'Invalid credentials. Please check your email and password.';
      } else if (status >= 500) {
        message = 'Server error. Please try again later.';
      } else if (!status) {
        message = 'Network error. Unable to reach the API server.';
      }

      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <NetworkStatus />
      <OfflineBanner />
      <View style={styles.container}>
        <Surface style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </Surface>
        
        <Text style={styles.title}>AfriDiag</Text>
        <Text style={styles.subtitle}>AI-Driven Diagnosis Platform</Text>
        
        <Surface style={styles.formContainer}>
          {/* User Role Selection */}
          <Text style={styles.sectionTitle}>Select User Role</Text>
          
          {Object.entries(userProfiles).map(([key, profile]) => (
            <Card key={key} style={[styles.userCard, selectedUser === key && styles.selectedCard]}>
              <TouchableOpacity
                style={styles.userCardContent}
                onPress={() => setSelectedUser(key)}
              >
                <View style={styles.radioContainer}>
                  <RadioButton
                    value={key}
                    status={selectedUser === key ? 'checked' : 'unchecked'}
                    onPress={() => setSelectedUser(key)}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{profile.name}</Text>
                    <Text style={styles.userRole}>{profile.role.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={styles.userLocation}>{profile.location}</Text>
                    <Text style={styles.userSpecialization}>{profile.specialization}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          ))}
          
          <Formik
            initialValues={{ email: userProfiles[selectedUser].email, password: userProfiles[selectedUser].password }}
            validationSchema={LoginSchema}
            onSubmit={handleLogin}
            enableReinitialize={true}
          >
            {({ handleSubmit, setFieldValue, values, errors, touched }) => (
              <>
                <ValidatedTextInput
                  label="Email"
                  value={values.email}
                  onChangeText={(text) => setFieldValue('email', text)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  error={touched.email && errors.email}
                  errorMessage={touched.email && errors.email ? errors.email : ''}
                />
                
                <ValidatedTextInput
                  label="Password"
                  value={values.password}
                  onChangeText={(text) => setFieldValue('password', text)}
                  secureTextEntry={true}
                  style={styles.input}
                  error={touched.password && errors.password}
                  errorMessage={touched.password && errors.password ? errors.password : ''}
                />
                
                <FormSubmitButton
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading || isOffline}
                  title="Login"
                  style={styles.button}
                />
              </>
            )}
          </Formik>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <View style={styles.registerContainer}>
            <Text>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Register</Text>
            </TouchableOpacity>
          </View>
        </Surface>
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
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    opacity: 0.7,
  },
  formContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  userCard: {
    marginBottom: 10,
    borderRadius: 8,
  },
  selectedCard: {
    borderColor: '#6200ea',
    borderWidth: 2,
  },
  userCardContent: {
    padding: 15,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#6200ea',
    fontWeight: '600',
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 1,
  },
  userSpecialization: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
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
  button: {
    marginTop: 20,
    paddingVertical: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: '#1976D2',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
});

// Wrapper component with error handling
const LoginScreen = (props) => {
  return (
    <ErrorBoundary>
      <LoginScreenContent {...props} />
    </ErrorBoundary>
  );
};

export default LoginScreen;

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { OfflineProvider } from './src/context/OfflineContext';
import { ToastProvider } from './src/components';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  console.log('🚀 App component rendering...');
  
  // Simplified state management
  const [userToken, setUserToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBhZnJpZGlhZy5vcmciLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3NjE2MjY4NDF9.eI359WUibm-nxMYQJ3aZ99my-el196sDf2Atpp3me0g'); // Fresh authentication token
  const [isLoading, setIsLoading] = useState(false); // Start as not loading

  // Store demo token in localStorage for API access
  useEffect(() => {
    if (typeof window !== 'undefined' && userToken) {
      window.localStorage.setItem('userToken', userToken);
    }
  }, [userToken]);

  const authContext = {
    signIn: (token, userData) => {
      setUserToken(token);
      return Promise.resolve();
    },
    signOut: () => {
      setUserToken(null);
      return Promise.resolve();
    },
    userToken,
    isLoading,
  };

  const offlineContext = {
    isOffline: false,
    syncData: () => {},
  };

  // Simplified linking configuration for web
  const linking = {
    prefixes: ['http://localhost:19006'],
    config: {
      screens: {
        Login: 'login',
        FrontlineHome: {
          screens: {
            Patients: 'patients',
            NewPatient: 'new-patient',
            Diagnosis: 'diagnosis',
            TreatmentGuide: 'treatment-guide',
            Profile: 'frontline-profile',
          },
        },
      },
    },
  };

  return (
    <PaperProvider>
      <ToastProvider>
        <AuthProvider value={authContext}>
          <OfflineProvider value={offlineContext}>
            <NavigationContainer linking={linking}>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </OfflineProvider>
        </AuthProvider>
      </ToastProvider>
    </PaperProvider>
  );
}
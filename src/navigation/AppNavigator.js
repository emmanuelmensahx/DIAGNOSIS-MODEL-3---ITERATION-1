import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { MaterialCommunityIcons } from '@expo/vector-icons';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Frontline Worker Screens
import PatientListScreen from '../screens/frontline/PatientListScreen';
import PatientDetailsScreen from '../screens/frontline/PatientDetailsScreen';
import PatientHistoryScreen from '../screens/frontline/PatientHistoryScreen';
import DiagnosisDetailsScreen from '../screens/frontline/DiagnosisDetailsScreen';
import NewPatientScreen from '../screens/frontline/NewPatientScreen';
import EditPatientScreen from '../screens/frontline/EditPatientScreen';
import DiagnosisScreen from '../screens/frontline/DiagnosisScreen';
import EmergencyDiagnosisScreen from '../screens/frontline/EmergencyDiagnosisScreen';
import DiagnosisResultScreen from '../screens/frontline/DiagnosisResultScreen';
import CameraScreen from '../screens/frontline/CameraScreen';
import TreatmentGuideScreen from '../screens/frontline/TreatmentGuideScreen';

// Specialist Screens
import PendingReviewsScreen from '../screens/specialist/PendingReviewsScreen';
import ReviewDetailsScreen from '../screens/specialist/ReviewDetailsScreen';
import TreatmentPlanScreen from '../screens/specialist/TreatmentPlanScreen';
import SpecialistChatScreen from '../screens/specialist/SpecialistChatScreen';
import SpecialistConsultationScreen from '../screens/specialist/SpecialistConsultationScreen';

// Shared Screens
import ProfileScreen from '../screens/shared/ProfileScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import OfflineModeScreen from '../screens/shared/OfflineModeScreen';
import SyncScreen from '../screens/shared/SyncScreen';
import DashboardHomeScreen from '../screens/shared/DashboardHomeScreen';

// Context
import { useAuth } from '../context/AuthContext';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Frontline Worker Tab Navigator
function FrontlineTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1E88E5',
        tabBarInactiveTintColor: '#757575',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Patients"
        component={PatientListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <span style={{ color, fontSize: size }}>👥</span>
          ),
        }}
      />
      <Tab.Screen
        name="NewPatient"
        component={NewPatientScreen}
        options={{
          title: 'New Patient',
          tabBarIcon: ({ color, size }) => (
            <span style={{ color, fontSize: size }}>➕</span>
          ),
        }}
      />
      <Tab.Screen
        name="Diagnosis"
        component={DiagnosisScreen}
        options={{
          title: 'Diagnosis',
          tabBarIcon: ({ color, size }) => (
            <span style={{ color, fontSize: size }}>🩺</span>
          ),
        }}
      />
      <Tab.Screen
        name="Emergency"
        component={EmergencyDiagnosisScreen}
        options={{
          title: 'Emergency',
          tabBarIcon: ({ color, size }) => (
            <span style={{ color, fontSize: size }}>🚨</span>
          ),
        }}
      />
      <Tab.Screen
        name="TreatmentGuide"
        component={TreatmentGuideScreen}
        options={{
          title: 'Treatment Guide',
          tabBarIcon: ({ color, size }) => (
            <span style={{ color, fontSize: size }}>📖</span>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <span style={{ color, fontSize: size }}>👤</span>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Specialist Tab Navigator
function SpecialistTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1E88E5',
        tabBarInactiveTintColor: '#757575',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="DashboardHome"
        component={DashboardHomeScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <span style={{ color, fontSize: size }}>🏠</span>
          ),
        }}
      />
      <Tab.Screen
        name="PendingReviews"
        component={PendingReviewsScreen}
        options={{
          title: 'Pending Reviews',
          tabBarIcon: ({ color, size }) => (
            <span style={{ color, fontSize: size }}>📋</span>
          ),
        }}
      />
      <Tab.Screen
        name="SpecialistConsultation"
        component={SpecialistConsultationScreen}
        options={{
          title: 'Consultations',
          tabBarIcon: ({ color, size }) => (
            <span style={{ color, fontSize: size }}>💬</span>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <span style={{ color, fontSize: size }}>👤</span>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { userToken } = useAuth();
  
  // Mock user role for demonstration
  // In a real app, this would come from the decoded JWT or user profile
  const userRole = 'specialist'; // or 'frontline_worker'

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!userToken ? (
        // Auth screens
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      ) : (
        // App screens based on user role
        <Stack.Group>
          {userRole === 'frontline_worker' ? (
            <>
              <Stack.Screen name="FrontlineHome" component={FrontlineTabNavigator} />
              <Stack.Screen 
                name="PatientDetails" 
                component={PatientDetailsScreen} 
                options={{ headerShown: true, title: 'Patient Details' }}
              />
              <Stack.Screen 
                name="EditPatient" 
                component={EditPatientScreen} 
                options={{ headerShown: true, title: 'Edit Patient' }}
              />
              <Stack.Screen 
                name="PatientHistory" 
                component={PatientHistoryScreen} 
                options={{ headerShown: true, title: 'Patient History' }}
              />
              <Stack.Screen 
                name="Diagnosis" 
                component={DiagnosisScreen} 
                options={{ headerShown: true, title: 'New Diagnosis' }}
              />
              <Stack.Screen 
                name="NewDiagnosis" 
                component={DiagnosisScreen} 
                options={{ headerShown: true, title: 'New Diagnosis' }}
              />
              <Stack.Screen 
                name="EmergencyDiagnosis" 
                component={EmergencyDiagnosisScreen} 
                options={{ headerShown: true, title: 'Emergency Diagnosis' }}
              />
              <Stack.Screen 
                name="DiagnosisDetails" 
                component={DiagnosisDetailsScreen} 
                options={{ headerShown: true, title: 'Diagnosis Details' }}
              />
              <Stack.Screen 
                name="DiagnosisResult" 
                component={DiagnosisResultScreen} 
                options={{ headerShown: true, title: 'Diagnosis Result' }}
              />
              <Stack.Screen 
                name="Camera" 
                component={CameraScreen} 
                options={{ headerShown: true, title: 'Take Photo' }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="SpecialistHome" component={SpecialistTabNavigator} />
              <Stack.Screen 
                name="ReviewDetails" 
                component={ReviewDetailsScreen} 
                options={{ headerShown: true, title: 'Review Details' }}
              />
              <Stack.Screen 
                name="TreatmentPlan" 
                component={TreatmentPlanScreen} 
                options={{ headerShown: true, title: 'Treatment Plan' }}
              />
              <Stack.Screen 
                name="SpecialistChat" 
                component={SpecialistChatScreen} 
                options={{ headerShown: true, title: 'Specialist Chat' }}
              />
            </>
          )}
          {/* Shared screens */}
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ headerShown: true }}
          />
          <Stack.Screen 
            name="OfflineMode" 
            component={OfflineModeScreen} 
            options={{ headerShown: true, title: 'Offline Mode' }}
          />
          <Stack.Screen 
            name="Sync" 
            component={SyncScreen} 
            options={{ headerShown: true, title: 'Sync Data' }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

export default AppNavigator;
import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from './Theme';

// ==================== AUTH SCREENS ====================
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// ==================== TAB NAVIGATORS ====================
import DoctorTabs from './screens/DoctorTabs';
import PatientTabs from './screens/PatientTabs';
import PharmacistTabs from './screens/PharmacistTabs';

// ==================== DOCTOR SCREENS ====================
import DoctorProfileScreen from './screens/DoctorProfileScreen';
import AllPatientsScreen from './screens/AllPatientsScreen';
import SetConsultationFeeScreen from './screens/SetConsultationFeeScreen';

// ==================== PATIENT SCREENS ====================
import PatientProfile from './screens/PatientProfile';
import SearchMedicineScreen from './screens/SearchMedicineScreen';

// ==================== SHARED SCREENS ====================
import IndividualChatScreen from './screens/IndividualChatScreen';
import BookAppointmentScreen from './screens/BookAppointmentScreen';
import MapScreen from './screens/MapScreen';
import PaymentScreen from './screens/PaymentScreen';
import SendRecommendationScreen from './screens/SendRecommendationScreen';
import RecommendationScreen from './screens/RecommendationScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import CartScreen from './screens/CartScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import ViewProfileScreen from './screens/ViewProfileScreen';

// ==================== DOCTOR SELECTION & PAYMENT ====================
import DoctorListScreen from './screens/DoctorListScreen';
import DoctorSelectionScreen from './screens/DoctorSelectionScreen';
import MedicinePaymentScreen from './screens/MedicinePaymentScreen';
import ConsultationPaymentScreen from './screens/ConsultationPaymentScreen';

// ==================== PHARMACY SCREENS ====================
import SelectInitialMedicinesScreen from './screens/SelectInitialMedicinesScreen';
import AddEditMedicineScreen from './screens/AddEditMedicineScreen';
import ManageInventoryScreen from './screens/ManageInventoryScreen';

// Firebase
import { auth } from './firebaseConfig';

const Stack = createNativeStackNavigator();

/**
 * Logout handler - Called from header buttons
 */
const handleLogout = (navigation) => {
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await auth.signOut();
            navigation.replace('Splash');
          } catch (error) {
            console.log('Logout error:', error);
            Alert.alert('Error', 'Logout failed. Please try again.');
          }
        },
      },
    ]
  );
};

/**
 * Logout Button Component - Reusable header button
 */
const LogoutButton = ({ navigation }) => (
  <TouchableOpacity 
    onPress={() => handleLogout(navigation)} 
    style={{ marginRight: 15 }}
  >
    <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>
      Logout
    </Text>
  </TouchableOpacity>
);

/**
 * Standard Header Options - Used across multiple screens
 */
const defaultHeaderOptions = {
  headerShown: true,
  headerStyle: { 
    backgroundColor: COLORS.primary,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
};

/**
 * App Navigator - Main navigation structure
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.background },
        }}
      >
        {/* ==================== AUTH SCREENS ==================== */}
        
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen}
          options={{ 
            headerShown: false,
            animationEnabled: false,
            cardStyle: { backgroundColor: COLORS.background },
          }}
        />

        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ 
            headerShown: false,
            cardStyle: { backgroundColor: COLORS.background },
          }}
        />

        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ 
            headerShown: false,
            cardStyle: { backgroundColor: COLORS.background },
          }}
        />

        {/* ==================== DOCTOR NAVIGATION ==================== */}

        <Stack.Screen 
          name="DoctorTabs" 
          component={DoctorTabs}
          options={({ navigation }) => ({
            headerShown: true,
            title: 'Doctor Dashboard',
            headerStyle: { 
              backgroundColor: COLORS.primary,
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
            headerRight: () => <LogoutButton navigation={navigation} />,
          })}
        />

        <Stack.Screen
          name="DoctorProfile"
          component={DoctorProfileScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Doctor Profile',
          }}
        />

        <Stack.Screen 
          name="AllPatients"
          component={AllPatientsScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'All Patients',
          }}
        />

        <Stack.Screen 
          name="SetConsultationFee" 
          component={SetConsultationFeeScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Set Consultation Fees',
          }}
        />

        {/* ==================== PATIENT NAVIGATION ==================== */}

        <Stack.Screen 
          name="PatientTabs" 
          component={PatientTabs}
          options={({ navigation }) => ({
            headerShown: true,
            title: 'Patient Dashboard',
            headerStyle: { 
              backgroundColor: COLORS.primary,
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
            headerRight: () => <LogoutButton navigation={navigation} />,
          })}
        />

        <Stack.Screen 
          name="PatientProfile" 
          component={PatientProfile}
          options={{
            ...defaultHeaderOptions,
            title: 'Patient Profile',
          }}
        />

        <Stack.Screen
          name="SearchMedicine"
          component={SearchMedicineScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Search Medicines',
          }}
        />

        {/* ==================== PHARMACIST NAVIGATION ==================== */}

        <Stack.Screen 
          name="PharmacistTabs" 
          component={PharmacistTabs}
          options={({ navigation }) => ({
            headerShown: true,
            title: 'Pharmacist Dashboard',
            headerStyle: { 
              backgroundColor: COLORS.primary,
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
            headerRight: () => <LogoutButton navigation={navigation} />,
          })}
        />

        <Stack.Screen 
          name="SelectInitialMedicines" 
          component={SelectInitialMedicinesScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Select Medicines',
          }}
        />

        <Stack.Screen 
          name="AddEditMedicine" 
          component={AddEditMedicineScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Add/Edit Medicine',
          }}
        />

        <Stack.Screen 
          name="ManageInventory" 
          component={ManageInventoryScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Manage Inventory',
          }}
        />

        {/* ==================== SHARED SCREENS ==================== */}

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Settings',
          }}
        />

        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'My Profile',
          }}
        />

        <Stack.Screen 
          name="ViewProfile" 
          component={ViewProfileScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Profile',
          }}
        />

        <Stack.Screen 
          name="IndividualChat" 
          component={IndividualChatScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Chat',
          }}
        />

        <Stack.Screen 
          name="SendRecommendation" 
          component={SendRecommendationScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Send Recommendation',
          }}
        />

        <Stack.Screen 
          name="BookAppointment" 
          component={BookAppointmentScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Book Appointment',
          }}
        />

        <Stack.Screen 
          name="Map" 
          component={MapScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Delivery Location',
          }}
        />

        <Stack.Screen 
          name="Payment" 
          component={PaymentScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Payment',
          }}
        />

        <Stack.Screen 
          name="Recommendation" 
          component={RecommendationScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Recommendations',
          }}
        />

        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Notifications',
          }}
        />

        <Stack.Screen 
          name="Cart" 
          component={CartScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Shopping Cart',
          }}
        />

        {/* ==================== SELECTION & PAYMENT SCREENS ==================== */}

        <Stack.Screen 
          name="DoctorSelection" 
          component={DoctorSelectionScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Select Doctor',
          }}
        />

        <Stack.Screen 
          name="AllDoctors" 
          component={DoctorListScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'All Doctors',
          }}
        />

        <Stack.Screen 
          name="ConsultationPayment" 
          component={ConsultationPaymentScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Consultation Payment',
          }}
        />

        <Stack.Screen 
          name="MedicinePayment" 
          component={MedicinePaymentScreen}
          options={{
            ...defaultHeaderOptions,
            title: 'Medicine Payment',
          }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

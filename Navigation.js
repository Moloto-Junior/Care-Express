import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from './Theme';
import DoctorProfileScreen from './screens/DoctorProfileScreen'; 
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DoctorTabs from './screens/DoctorTabs';
import PatientTabs from './screens/PatientTabs';
import IndividualChatScreen from './screens/IndividualChatScreen';
import BookAppointmentScreen from './screens/BookAppointmentScreen';
import MapScreen from './screens/MapScreen';
import PaymentScreen from './screens/PaymentScreen';
import SendRecommendationScreen from './screens/SendRecommendationScreen';
import RecommendationScreen from './screens/RecommendationScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import CartScreen from './screens/cartScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import PatientProfile from './screens/PatientProfile';
import SearchMedicineScreen from './screens/SearchMedicineScreen';
import ViewProfileScreen from './screens/ViewProfileScreen'; 
import DoctorListScreen from './screens/DoctorListScreen';
import DoctorSelectionScreen from './screens/DoctorSelectionScreen';
import MedicinePaymentScreen from './screens/MedicinePaymentScreen';
import ConsultationPaymentScreen from './screens/ConsultationPaymentScreen';
import SetConsultationFeeScreen from './screens/SetConsultationFeeScreen';
import AllPatientsScreen from './screens/AllPatientsScreen';
import { auth } from './firebaseConfig';

const Stack = createNativeStackNavigator();

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
            navigation.replace('Login');
          } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Logout failed');
          }
        }
      }
    ]
  );
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        <Stack.Screen 
          name="DoctorTabs" 
          component={DoctorTabs}
          options={({ navigation }) => ({
            headerShown: true,
            title: 'Doctor Dashboard',
            headerRight: () => (
              <TouchableOpacity onPress={() => handleLogout(navigation)} style={{ marginRight: 15 }}>
                <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Logout</Text>
              </TouchableOpacity>
            )
          })}
        />

        <Stack.Screen
          name="DoctorProfile"
          component={DoctorProfileScreen}
          options={{
            headerShown: true,
            title: 'Doctor Profile',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }}
        />

        <Stack.Screen 
          name="PatientProfile" 
          component={PatientProfile} 
          options={{ title: 'Patient Profile' }} 
        />

        <Stack.Screen 
          name="SetConsultationFee" 
          component={SetConsultationFeeScreen} 
          options={{ 
            headerShown: true, 
            title: 'Set Consultation Fees',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />

        <Stack.Screen 
          name="DoctorSelection" 
          component={DoctorSelectionScreen} 
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="AllDoctors" 
          component={DoctorListScreen} 
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="ConsultationPayment" 
          component={ConsultationPaymentScreen} 
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="MedicinePayment" 
          component={MedicinePaymentScreen} 
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="PatientTabs" 
          component={PatientTabs}
          options={({ navigation }) => ({
            headerShown: true,
            title: 'Patient Dashboard',
            headerRight: () => (
              <TouchableOpacity onPress={() => handleLogout(navigation)} style={{ marginRight: 15 }}>
                <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Logout</Text>
              </TouchableOpacity>
            )
          })}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: true,
            title: 'Settings',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen 
  name="AllPatients"
  component={AllPatientsScreen}
  options={{ title: 'All Patients', headerShown: true }}
/>

        <Stack.Screen
          name="SearchMedicine"
          component={SearchMedicineScreen}
          options={{
            headerShown: true,
            title: 'Search Medicines',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }}
        />

        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ 
            headerShown: true, 
            title: 'My Profile',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />

        <Stack.Screen 
          name="ViewProfile" 
          component={ViewProfileScreen} 
          options={{ 
            headerShown: true, 
            title: 'Profile',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />

        <Stack.Screen 
          name="IndividualChat" 
          component={IndividualChatScreen} 
          options={{ 
            headerShown: true, 
            title: 'Chat',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />

        <Stack.Screen 
          name="SendRecommendation" 
          component={SendRecommendationScreen} 
          options={{ 
            headerShown: true, 
            title: 'Send Recommendation',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />

        <Stack.Screen 
          name="BookAppointment" 
          component={BookAppointmentScreen} 
          options={{ 
            headerShown: true, 
            title: 'Book Appointment',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />

        <Stack.Screen 
          name="Map" 
          component={MapScreen} 
          options={{ 
            headerShown: true, 
            title: 'Delivery Location',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />

        <Stack.Screen 
          name="Payment" 
          component={PaymentScreen} 
          options={{ 
            headerShown: true, 
            title: 'Payment',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />

        <Stack.Screen 
          name="Recommendation" 
          component={RecommendationScreen} 
          options={{ 
            headerShown: true, 
            title: 'Recommendations',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />

        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen} 
          options={{ 
            headerShown: true, 
            title: 'Notifications',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />

        <Stack.Screen 
          name="Cart" 
          component={CartScreen} 
          options={{ 
            headerShown: true, 
            title: 'Shopping Cart',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff',
          }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

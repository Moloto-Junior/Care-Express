import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { COLORS } from '../Theme';

// Doctor Screens
import DoctorDashboard from './DoctorDashboard';
import DoctorChatScreen from './DoctorChatScreen';
import AllPatientsScreen from './AllPatientsScreen';
import DoctorProfileScreen from './DoctorProfileScreen';
import SettingsScreen from './SettingsScreen';

const Tab = createBottomTabNavigator();

export default function DoctorTabs() {
  // Shared tab bar styling
  const tabBarOptions = {
    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: '#95A5A6',
    tabBarStyle: {
      backgroundColor: COLORS.card,
      height: 70,
      paddingBottom: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: COLORS.background,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    tabBarLabelStyle: { 
      fontSize: 11, 
      fontWeight: '600', 
      marginBottom: 4,
      marginTop: -2,
    },
    tabBarIconStyle: { 
      marginTop: 4,
      marginBottom: 2,
    },
  };

  // Shared header styling
  const headerOptions = {
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

  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      
      {/* Dashboard Tab */}
      <Tab.Screen
        name="Dashboard"
        component={DoctorDashboard}
        options={{
          ...headerOptions,
          headerTitle: 'Doctor Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Patients Tab */}
      <Tab.Screen
        name="AllPatients"
        component={AllPatientsScreen}
        options={{
          ...headerOptions,
          headerTitle: 'My Patients',
          tabBarLabel: 'Patients',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'people' : 'people-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Chat Tab */}
      <Tab.Screen
        name="Chat"
        component={DoctorChatScreen}
        options={{
          ...headerOptions,
          headerTitle: 'Messages',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'chatbubble' : 'chatbubble-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={DoctorProfileScreen}
        options={{
          ...headerOptions,
          headerTitle: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person-circle' : 'person-circle-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Settings Tab */}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          ...headerOptions,
          headerTitle: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'settings' : 'settings-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({});

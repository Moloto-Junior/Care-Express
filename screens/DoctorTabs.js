// src/screens/DoctorTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import DoctorDashboard from './DoctorDashboard';
import ViewAppointmentsScreen from './ViewAppointmentsScreen';
import ChatScreen from './ChatScreen';
import ProfileScreen from './ProfileScreen';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

export default function DoctorTabs() {
  const navigation = useNavigation();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#95A5A6',
        tabBarStyle: {
          backgroundColor: COLORS.card,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DoctorDashboard}
        options={{
          headerShown: true,
          headerTitle: 'Doctor Dashboard',
          headerStyle: {
            backgroundColor: COLORS.primary,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('SendRecommendation')}
              style={styles.headerButton}
            >
              <Ionicons name="mail" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={focused ? 28 : 24}
                color={color}
              />
            </View>
          ),
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={ViewAppointmentsScreen}
        options={{
          headerShown: true,
          headerTitle: 'My Appointments',
          headerStyle: {
            backgroundColor: COLORS.primary,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={focused ? 28 : 24}
                color={color}
              />
            </View>
          ),
          tabBarLabel: 'Appointments',
          tabBarBadge: undefined, // You can add badge count here later
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          headerTitle: 'Patient Chats',
          headerStyle: {
            backgroundColor: COLORS.primary,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={focused ? 28 : 24}
                color={color}
              />
            </View>
          ),
          tabBarLabel: 'Chats',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'My Profile',
          headerStyle: {
            backgroundColor: COLORS.primary,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={styles.headerButton}
            >
              <Ionicons name="notifications" size={24} color="#fff" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons
                name={focused ? 'person-circle' : 'person-circle-outline'}
                size={focused ? 28 : 24}
                color={color}
              />
            </View>
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 15,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 35,
    borderRadius: 10,
  },
  iconContainerFocused: {
    backgroundColor: `${COLORS.primary}15`,
  },
});
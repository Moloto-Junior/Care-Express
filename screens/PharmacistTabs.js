import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../Theme';
import { useNavigation } from '@react-navigation/native';

// Screens
import PharmacistDashboard from './PharmacistDashboard';
import ManageInventoryScreen from './ManageInventoryScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import ClientChatScreen from './ClientChatScreen'; // Chat with patients & doctors

const Tab = createBottomTabNavigator();

/**
 * Badge Component - Shows notification count
 */
const BadgeIcon = ({ count, children }) => {
  if (!count || count === 0) return children;
  
  return (
    <View style={{ position: 'relative' }}>
      {children}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
      </View>
    </View>
  );
};

export default function PharmacistTabs() {
  const navigation = useNavigation();

  // Tab bar options styling
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

  // Header options styling
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
        component={PharmacistDashboard}
        options={{
          ...headerOptions,
          headerTitle: 'Pharmacist Dashboard',
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

      {/* Inventory Management Tab */}
      <Tab.Screen
        name="Inventory"
        component={ManageInventoryScreen}
        options={{
          ...headerOptions,
          headerTitle: 'Manage Inventory',
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'cube' : 'cube-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      {/* Chat Tab */}
      <Tab.Screen
        name="Chat"
        component={ClientChatScreen}
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
          // You can add badge here if you have unread count
          // tabBarBadge: unreadCount > 0 ? unreadCount : null,
        }}
      />

      {/* Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
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

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

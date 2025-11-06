import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { COLORS } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import SearchMedicineScreen from './SearchMedicineScreen';
import ChatScreen from './ChatScreen';
import ProfileScreen from './ProfileScreen';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../NotificationContext';

const Tab = createMaterialTopTabNavigator();

const BadgeComponent = ({ count }) =>
  count > 0 ? (
    <View style={styles.tabBadge}>
      <Text style={styles.tabBadgeText}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  ) : null;

export default function PatientTabs() {
  const navigation = useNavigation();
  const { unreadCounts, markAsRead } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#95A5A6',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          textTransform: 'none',
          letterSpacing: 0.5,
        },
        tabBarStyle: {
          backgroundColor: COLORS.card,
          elevation: 8,
        },
        tabBarIndicatorStyle: {
          backgroundColor: COLORS.primary,
          height: 4,
          borderRadius: 2,
        },
        tabBarShowIcon: true,
        tabBarIconStyle: { width: 25, height: 25, marginBottom: -5 }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Medicine"
        component={SearchMedicineScreen}
        options={{
          title: 'Medicine',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'medical' : 'medical-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        listeners={{
          tabPress: () => markAsRead('chats'),
        }}
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={22}
                color={color}
              />
              <BadgeComponent count={unreadCounts.chats} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -14,
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: COLORS.card,
    zIndex: 2,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

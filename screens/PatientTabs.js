import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import SearchMedicineScreen from './SearchMedicineScreen';
import ChatScreen from './ChatScreen';
import ProfileScreen from './ProfileScreen';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../NotificationContext';

const Tab = createBottomTabNavigator();

const BadgeComponent = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <View style={styles.tabBadge}>
      <Text style={styles.tabBadgeText}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
};

export default function PatientTabs() {
  const navigation = useNavigation();
  const { unreadCounts, markAsRead } = useNotifications();

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
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: true,
          headerTitle: 'Care Express',
          headerStyle: {
            backgroundColor: COLORS.primary,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 22,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                markAsRead('notifications');
                navigation.navigate('Notifications');
              }}
              style={styles.headerButton}
            >
              <Ionicons name="notifications" size={24} color="#fff" />
              {unreadCounts.notifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCounts.notifications > 99 ? '99+' : unreadCounts.notifications.toString()}
                  </Text>
                </View>
              )}
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
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Medicine"
        component={SearchMedicineScreen}
        options={{
          headerShown: true,
          headerTitle: 'Medicine Store',
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
                name={focused ? 'medical' : 'medical-outline'}
                size={focused ? 28 : 24}
                color={color}
              />
            </View>
          ),
          tabBarLabel: 'Medicine',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        listeners={{
          tabPress: () => markAsRead('chats'),
        }}
        options={{
          headerShown: true,
          headerTitle: 'Doctor Chats',
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
              <BadgeComponent count={unreadCounts.chats} />
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
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Recommendation')}
                style={[styles.headerButton, { marginRight: 15 }]}
              >
                <Ionicons name="clipboard" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Map')}
                style={styles.headerButton}
              >
                <Ionicons name="location" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
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
    top: -5,
    right: -5,
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 35,
    borderRadius: 10,
    position: 'relative',
  },
  iconContainerFocused: {
    backgroundColor: `${COLORS.primary}15`,
  },
});

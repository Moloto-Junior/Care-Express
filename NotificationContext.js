import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [chats, setChats] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({
    notifications: 0,
    appointments: 0,
    chats: 0
  });

  const getCurrentUser = () => auth.currentUser;

  const getLastReadTimestamp = async (type) => {
    try {
      const timestamp = await AsyncStorage.getItem(`lastRead_${type}_${getCurrentUser()?.uid}`);
      return timestamp ? new Date(timestamp) : new Date(0);
    } catch (error) {
      return new Date(0);
    }
  };

  const setLastReadTimestamp = async (type) => {
    try {
      await AsyncStorage.setItem(`lastRead_${type}_${getCurrentUser()?.uid}`, new Date().toISOString());
    } catch (error) {
      console.error(`Error saving last read timestamp for ${type}:`, error);
    }
  };

  const calculateUnreadCount = async (items, type) => {
    const lastRead = await getLastReadTimestamp(type);
    return items.filter(item => {
      const itemDate = item.createdAt?.toDate?.() || item.timestamp?.toDate?.() || new Date(item.createdAt);
      return itemDate > lastRead;
    }).length;
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    const unsubscribers = [];

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where(user.email?.includes('doctor') ? 'doctorId' : 'patientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const notificationsUnsubscribe = onSnapshot(notificationsQuery, async (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notificationsList);
      
      const count = await calculateUnreadCount(notificationsList, 'notifications');
      setUnreadCounts(prev => ({ ...prev, notifications: count }));
    });

    const appointmentsUnsubscribe = onSnapshot(appointmentsQuery, async (snapshot) => {
      const appointmentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppointments(appointmentsList);
      
      const count = await calculateUnreadCount(appointmentsList, 'appointments');
      setUnreadCounts(prev => ({ ...prev, appointments: count }));
    });

    const chatsUnsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatsList);
      
      const count = await calculateUnreadCount(chatsList, 'chats');
      setUnreadCounts(prev => ({ ...prev, chats: count }));
    });

    unsubscribers.push(notificationsUnsubscribe, appointmentsUnsubscribe, chatsUnsubscribe);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const markAsRead = async (type) => {
    await setLastReadTimestamp(type);
    setUnreadCounts(prev => ({ ...prev, [type]: 0 }));
  };

  const value = {
    notifications,
    appointments,
    chats,
    unreadCounts,
    markAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

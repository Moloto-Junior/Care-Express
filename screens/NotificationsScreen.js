import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue, update, remove } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen({ route }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const notificationsRef = ref(db, `notifications/${auth.currentUser.uid}`);
    const unsubscribe = onValue(notificationsRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data)
          .map(id => ({ id, ...data[id] }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(list);

        const unread = list.filter(n => !n.read).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const markAsRead = async (id) => {
    try {
      await update(ref(db, `notifications/${auth.currentUser.uid}/${id}`), { read: true });
      setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
    } catch (error) {
      console.log('Error marking as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await remove(ref(db, `notifications/${auth.currentUser.uid}/${id}`));
    } catch (error) {
      console.log('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    try {
      await remove(ref(db, `notifications/${auth.currentUser.uid}`));
      setUnreadCount(0);
    } catch (error) {
      console.log('Error clearing notifications:', error);
    }
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (title) => {
    if (title.includes('Payment')) return 'card';
    if (title.includes('Appointment')) return 'calendar';
    if (title.includes('Order')) return 'cube';
    if (title.includes('Recommendation')) return 'medical';
    return 'notifications';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off-outline" size={80} color={COLORS.lightGray} />
        <Text style={styles.emptyText}>No Notifications</Text>
        <Text style={styles.emptySubText}>You're all caught up!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.bellContainer}>
            <Ionicons name="notifications-outline" size={26} color={COLORS.text} />
            {unreadCount > 0 && (
              <View style={styles.badgeOutside}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notificationCard, !item.read && styles.unreadCard]}
            onPress={() => markAsRead(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, !item.read && styles.unreadIconContainer]}>
              <Ionicons 
                name={getNotificationIcon(item.title)} 
                size={24} 
                color={!item.read ? COLORS.primary : COLORS.lightGray} 
              />
            </View>

            <View style={styles.notificationContent}>
              <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
                {item.title}
              </Text>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
            </View>

            <TouchableOpacity
              onPress={() => deleteNotification(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.secondary} />
            </TouchableOpacity>

            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 10,
  },
  clearText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  bellContainer: {
    position: 'relative',
  },
  badgeOutside: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 15,
    marginHorizontal: SIZES.padding,
    marginTop: 10,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unreadIconContainer: {
    backgroundColor: '#BBDEFB',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.lightGray,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});

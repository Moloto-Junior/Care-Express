import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { ref, onValue, set } from 'firebase/database';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showFullNotification, setShowFullNotification] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const notificationsRef = ref(db, `notifications/${userId}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationList = Object.values(data)
          .sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(notificationList);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (notification) => {
    if (notification.read) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      await set(ref(db, `notifications/${userId}/${notification.id}/read`), true);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const openNotification = (notification) => {
    setSelectedNotification(notification);
    setShowFullNotification(true);
    markAsRead(notification);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment_pending': return 'time';
      case 'appointment_confirmed': return 'checkmark-circle';
      case 'appointment_declined': return 'close-circle';
      case 'appointment_request': return 'calendar';
      case 'medicine_purchase': return 'medical';
      case 'recommendation_received': return 'clipboard';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'appointment_pending': return '#FFA500';
      case 'appointment_confirmed': return COLORS.success;
      case 'appointment_declined': return COLORS.secondary;
      case 'appointment_request': return COLORS.primary;
      case 'medicine_purchase': return COLORS.success;
      case 'recommendation_received': return '#9C27B0';
      default: return COLORS.lightGray;
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: diffDays > 365 ? 'numeric' : undefined
      });
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationCard,
        !item.read && styles.unreadNotification
      ]} 
      onPress={() => openNotification(item)}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.notificationIcon,
          { backgroundColor: getNotificationColor(item.type) + '20' }
        ]}>
          <Ionicons 
            name={getNotificationIcon(item.type)} 
            size={24} 
            color={getNotificationColor(item.type)} 
          />
        </View>

        <View style={styles.notificationText}>
          <Text style={[
            styles.notificationTitle,
            !item.read && styles.unreadTitle
          ]}>
            {item.title}
          </Text>
          <Text 
            style={styles.notificationMessage} 
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>
            {formatDate(item.timestamp)}
          </Text>
        </View>

        <View style={styles.notificationRight}>
          {!item.read && <View style={styles.unreadDot} />}
          <Ionicons name="chevron-forward" size={16} color={COLORS.lightGray} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Notifications</Text>
        <Text style={styles.notificationCount}>
          {notifications.filter(n => !n.read).length} new
        </Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off" size={80} color={COLORS.lightGray} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyMessage}>
            You'll receive notifications about appointments, medicine orders, and recommendations here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal visible={showFullNotification} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFullNotification(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notification Details</Text>
            <View />
          </View>

          {selectedNotification && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.fullNotificationCard}>
                <View style={styles.fullNotificationHeader}>
                  <View style={[
                    styles.fullNotificationIcon,
                    { backgroundColor: getNotificationColor(selectedNotification.type) + '20' }
                  ]}>
                    <Ionicons 
                      name={getNotificationIcon(selectedNotification.type)} 
                      size={32} 
                      color={getNotificationColor(selectedNotification.type)} 
                    />
                  </View>
                  <View style={styles.fullNotificationTitleContainer}>
                    <Text style={styles.fullNotificationTitle}>
                      {selectedNotification.title}
                    </Text>
                    <Text style={styles.fullNotificationTime}>
                      {formatDate(selectedNotification.timestamp)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.fullNotificationMessage}>
                  {selectedNotification.message}
                </Text>

                {selectedNotification.type === 'appointment_pending' && (
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.detailsTitle}>Appointment Details:</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="person" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>Doctor: {selectedNotification.doctorName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>Date: {selectedNotification.appointmentDate}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>Time: {selectedNotification.appointmentTime}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="cash" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>Total: R{selectedNotification.totalAmount}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name={selectedNotification.consultationType === 'home' ? 'home' : 'business'} size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>
                        Type: {selectedNotification.consultationType === 'home' ? 'Home Visit' : 'Clinic Visit'}
                      </Text>
                    </View>
                  </View>
                )}

                {selectedNotification.type === 'appointment_confirmed' && (
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.detailsTitle}>Confirmed Appointment:</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="person" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>Doctor: {selectedNotification.doctorName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>Date: {selectedNotification.appointmentDate}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>Time: {selectedNotification.appointmentTime}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="cash" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>Paid: R{selectedNotification.totalAmount}</Text>
                    </View>
                  </View>
                )}

                {selectedNotification.type === 'medicine_purchase' && (
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.detailsTitle}>Medicine Order Details:</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="storefront" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>From: {selectedNotification.branchName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>To: {selectedNotification.deliveryAddress}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="medical" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>Medicine Total: R{selectedNotification.medicineTotal}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="car" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>Delivery Fee: R{selectedNotification.deliveryFee} ({selectedNotification.distance}km)</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="cash" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>Total Paid: R{selectedNotification.finalTotal}</Text>
                    </View>
                  </View>
                )}

                {selectedNotification.type === 'recommendation_received' && (
                  <View style={styles.appointmentDetails}>
                    <Text style={styles.detailsTitle}>Recommendation Details:</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="person" size={16} color={COLORS.text} />
                      <Text style={styles.detailText}>From: {selectedNotification.doctorName}</Text>
                    </View>
                    {selectedNotification.recommendationType && (
                      <View style={styles.detailRow}>
                        <Ionicons name="clipboard" size={16} color={COLORS.text} />
                        <Text style={styles.detailText}>Type: {selectedNotification.recommendationType}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowFullNotification(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.text },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  notificationCount: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  listContainer: { padding: 15 },
  notificationCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 15, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  unreadNotification: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  notificationContent: { flexDirection: 'row', alignItems: 'flex-start' },
  notificationIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notificationText: { flex: 1 },
  notificationTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  unreadTitle: { fontWeight: 'bold' },
  notificationMessage: { fontSize: 14, color: COLORS.lightGray, lineHeight: 20, marginBottom: 8 },
  notificationTime: { fontSize: 12, color: COLORS.lightGray },
  notificationRight: { alignItems: 'center', justifyContent: 'center' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginBottom: 5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 20 },
  emptyMessage: { fontSize: 14, color: COLORS.lightGray, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  modalContent: { flex: 1, padding: 20 },
  fullNotificationCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 20, marginBottom: 20 },
  fullNotificationHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  fullNotificationIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  fullNotificationTitleContainer: { flex: 1 },
  fullNotificationTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  fullNotificationTime: { fontSize: 14, color: COLORS.lightGray },
  fullNotificationMessage: { fontSize: 16, color: COLORS.text, lineHeight: 24, marginBottom: 20 },
  appointmentDetails: { backgroundColor: COLORS.background, padding: 15, borderRadius: SIZES.radius, marginTop: 10 },
  detailsTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailText: { fontSize: 14, color: COLORS.text, marginLeft: 10, flex: 1 },
  closeButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: SIZES.radius, alignItems: 'center', marginTop: 10 },
  closeButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

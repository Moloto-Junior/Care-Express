// src/screens/ViewAppointmentsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Image } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue, update, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { notifyUserByUID } from './NotificationsService';

export default function ViewAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userId = auth.currentUser.uid;

    // Get user role and name
    const userRef = ref(db, `users/${userId}`);
    get(userRef).then(snapshot => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUserRole(userData.role);
        setUserName(userData.name);
      }
    });

    // Fetch appointments
    const appointmentsRef = ref(db, 'appointments');
    const unsubscribe = onValue(appointmentsRef, snapshot => {
      const data = snapshot.val();
      if (!data) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const list = Object.keys(data)
        .map(id => ({ id, ...data[id] }))
        .filter(item => {
          if (!userRole) return false;
          if (userRole === 'Doctor') return item.doctorId === userId;
          return item.patientId === userId;
        });

      // For each appointment, fetch profile pictures from users
      const promises = list.map(async item => {
        const patientSnap = await get(ref(db, `users/${item.patientId}`));
        const doctorSnap = await get(ref(db, `users/${item.doctorId}`));

        return {
          ...item,
          patientProfilePicture: patientSnap.exists() ? patientSnap.val().profilePicture || null : null,
          doctorProfilePicture: doctorSnap.exists() ? doctorSnap.val().profilePicture || null : null,
        };
      });

      Promise.all(promises).then(results => {
        setAppointments(results.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time)));
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, [userRole]);

  const updateStatus = async (appointmentId, newStatus, appointment) => {
    try {
      await update(ref(db, `appointments/${appointmentId}`), { status: newStatus });
      if (userRole === 'Doctor') {
        await notifyUserByUID(
          appointment.patientId,
          `Appointment ${newStatus}`,
          `Dr. ${userName} has ${newStatus.toLowerCase()} your appointment for ${appointment.date}`
        );
      }
      Alert.alert('Success', `Appointment ${newStatus.toLowerCase()} successfully`);
    } catch (error) {
      console.log('Update error:', error);
      Alert.alert('Error', 'Failed to update appointment');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return COLORS.success;
      case 'pending': return '#FFC107';
      case 'cancelled': case 'rejected': return COLORS.secondary;
      default: return COLORS.lightGray;
    }
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  if (appointments.length === 0) return (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={80} color={COLORS.lightGray} />
      <Text style={styles.emptyText}>No Appointments</Text>
      <Text style={styles.emptySubText}>
        {userRole === 'Doctor' ? 'Patient appointments will appear here' : 'Book an appointment to get started'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <View style={styles.avatarContainer}>
                {userRole === 'Doctor' ? (
                  item.patientProfilePicture ? (
                    <Image source={{ uri: item.patientProfilePicture }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                  ) : (
                    <Ionicons name="person" size={30} color={COLORS.primary} />
                  )
                ) : (
                  item.doctorProfilePicture ? (
                    <Image source={{ uri: item.doctorProfilePicture }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                  ) : (
                    <Ionicons name="medical" size={30} color={COLORS.primary} />
                  )
                )}
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentName}>
                  {userRole === 'Doctor' ? item.patientName : `Dr. ${item.doctorName}`}
                </Text>
                <View style={styles.dateTimeContainer}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.lightGray} />
                  <Text style={styles.dateTimeText}>{item.date} at {item.time}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status || 'Pending'}</Text>
              </View>
            </View>

            <View style={styles.reasonContainer}>
              <Ionicons name="medical" size={16} color={COLORS.primary} />
              <Text style={styles.reasonText}>{item.reason}</Text>
            </View>

            {userRole === 'Doctor' && item.status !== 'Confirmed' && item.status !== 'Cancelled' && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={() => updateStatus(item.id, 'Confirmed', item)}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => updateStatus(item.id, 'Cancelled', item)}>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: SIZES.padding },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 20 },
  emptySubText: { fontSize: 14, color: COLORS.lightGray, marginTop: 8, textAlign: 'center' },
  appointmentCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  appointmentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  appointmentInfo: { flex: 1 },
  appointmentName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  dateTimeContainer: { flexDirection: 'row', alignItems: 'center' },
  dateTimeText: { fontSize: 13, color: COLORS.lightGray, marginLeft: 4 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  reasonContainer: { flexDirection: 'row', backgroundColor: COLORS.background, padding: 10, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  reasonText: { flex: 1, fontSize: 14, color: COLORS.text, marginLeft: 8 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flex: 1, flexDirection: 'row', padding: 12, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  confirmButton: { backgroundColor: COLORS.success },
  cancelButton: { backgroundColor: COLORS.secondary },
  actionButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue, get, remove } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorDashboard({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const doctorId = auth.currentUser.uid;

  const createChatId = (userId1, userId2) => [userId1, userId2].sort().join('_');

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribePatients = onValue(usersRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const patientsList = Object.keys(data)
          .filter(uid => data[uid].role === 'Patient')
          .map(uid => ({ id: uid, ...data[uid] }));
        setPatients(patientsList);
      } else {
        setPatients([]);
      }
    });

    const appointmentsRef = ref(db, 'appointments');
    const unsubscribeAppointments = onValue(appointmentsRef, async snapshot => {
      const data = snapshot.val();
      const appts = [];
      if (data) {
        for (const key of Object.keys(data)) {
          if (data[key].doctorId === doctorId) {
            const patientSnap = await get(ref(db, `users/${data[key].patientId}`));
            const patientProfilePicture = patientSnap.exists() ? patientSnap.val().profilePicture || null : null;
            appts.push({ ...data[key], id: key, patientProfilePicture });
          }
        }
      }
      setAppointments(appts.sort((a, b) => new Date(a.date) - new Date(b.date)));
      setLoading(false);
    });

    return () => {
      unsubscribePatients();
      unsubscribeAppointments();
    };
  }, [doctorId]);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  const deleteAppointment = (appointmentId) => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await remove(ref(db, `appointments/${appointmentId}`));
            Alert.alert('Success', 'Appointment deleted successfully');
          } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to delete appointment');
          }
        }}
      ]
    );
  };

  const renderAppointmentItem = (item) => (
    <View key={item.id} style={styles.appointmentCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {item.patientProfilePicture ? (
          <Image source={{ uri: item.patientProfilePicture }} style={{ width: 45, height: 45, borderRadius: 22.5, marginRight: 10 }} />
        ) : (
          <View style={[styles.avatarPlaceholder, { marginRight: 10 }]}>
            <Ionicons name="person" size={24} color={COLORS.primary} />
          </View>
        )}
        <View>
          <Text style={styles.apptPatientName}>{item.patientName}</Text>
          <Text style={styles.apptReason}>Reason: {item.reason}</Text>
          <Text style={styles.apptTime}>{item.date} at {item.time}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 8, justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={[styles.statusBadge,
          item.status === 'Pending' ? styles.pending :
          item.status === 'Confirmed' ? styles.confirmed :
          styles.cancelled
        ]}>
          <Text style={styles.statusText}>{item.status || 'Pending'}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteAppointment(item.id)}>
          <Ionicons name="trash" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Welcome, Dr. {auth.currentUser.email.split('@')[0]}</Text>
      <Text style={styles.subtitle}>Your dashboard overview</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('SetConsultationFee')}
        >
          <Ionicons name="cash" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Set Consultation Fees</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#6B73FF' }]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments ({appointments.length})</Text>
          {appointments.length > 3 && (
            <TouchableOpacity onPress={() => navigation.navigate('ViewAppointments')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          )}
        </View>
        {appointments.length > 0 ? (
          appointments.slice(0, 3).map(renderAppointmentItem)
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={40} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>No appointments scheduled yet</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Registered Patients ({patients.length})</Text>
          {patients.length > 5 && (
            <TouchableOpacity onPress={() => navigation.navigate('AllPatients')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {patients.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={40} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>No patients registered yet</Text>
          </View>
        ) : (
          patients.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.patientCard}
              onPress={() => navigation.navigate('PatientProfile', { patientId: item.id })}
            >
              <View style={styles.avatarPlaceholder}>
                {item.profilePicture ? (
                  <Image source={{ uri: item.profilePicture }} style={{ width: 45, height: 45, borderRadius: 22.5 }} />
                ) : (
                  <Ionicons name="person" size={24} color={COLORS.primary} />
                )}
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{item.name}</Text>
                <Text style={styles.patientEmail}>{item.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => {
                  const chatId = createChatId(auth.currentUser.uid, item.id);
                  navigation.navigate('IndividualChat', {
                    chatId,
                    recipientId: item.id,
                    recipientName: item.name
                  });
                }}
              >
                <Ionicons name="chatbubbles" size={20} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  container: { flex: 1, padding: SIZES.padding, backgroundColor: COLORS.background },
  greeting: { fontSize: 28, fontWeight: '700', color: COLORS.primary, marginBottom: 5 },
  subtitle: { fontSize: 14, color: COLORS.lightGray, marginBottom: 15 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: SIZES.radius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text },
  viewAllText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  appointmentCard: { flexDirection: 'column', backgroundColor: COLORS.card, padding: 15, borderRadius: SIZES.radius, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: COLORS.primary, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  apptPatientName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  apptReason: { fontSize: 13, color: COLORS.text, marginBottom: 4 },
  apptTime: { fontSize: 13, color: COLORS.lightGray },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  pending: { backgroundColor: '#FFC107' },
  confirmed: { backgroundColor: COLORS.success },
  cancelled: { backgroundColor: COLORS.secondary },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  patientCard: { backgroundColor: COLORS.card, padding: 15, marginBottom: 10, borderRadius: SIZES.radius, flexDirection: 'row', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  patientEmail: { fontSize: 13, color: COLORS.lightGray, marginTop: 2 },
  chatButton: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  emptyCard: { backgroundColor: COLORS.card, padding: 30, borderRadius: SIZES.radius, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  emptyText: { fontSize: 14, color: COLORS.lightGray, marginTop: 10, textAlign: 'center' },
});

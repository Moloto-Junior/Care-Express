// src/screens/DoctorDashboard.js (COMPLETE FIXED VERSION)
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorDashboard({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const doctorId = auth.currentUser.uid;

  const createChatId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
  };

  useEffect(() => {
    // Fetch all patients
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

    // Fetch Doctor's Appointments (FIXED - filter by doctorId)
    const appointmentsRef = ref(db, 'appointments');
    const unsubscribeAppointments = onValue(appointmentsRef, snapshot => {
      const data = snapshot.val();
      const appts = [];
      if (data) {
        Object.keys(data).forEach(key => {
          // ✅ ONLY show appointments for THIS doctor
          if (data[key].doctorId === doctorId) {
            appts.push({...data[key], id: key});
          }
        });
      }
      // Sort by date (upcoming first)
      setAppointments(appts.sort((a, b) => new Date(a.date) - new Date(b.date)));
      setLoading(false);
    });

    return () => {
      unsubscribePatients();
      unsubscribeAppointments();
    };
  }, [doctorId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderAppointmentItem = (item) => (
    <View key={item.id} style={styles.appointmentCard}>
      <View>
        <Text style={styles.apptPatientName}>{item.patientName}</Text>
        <Text style={styles.apptReason}>Reason: {item.reason}</Text>
        <Text style={styles.apptTime}>{item.date} at {item.time}</Text>
      </View>
      <View style={[
        styles.statusBadge, 
        item.status === 'Pending' ? styles.pending : 
        item.status === 'Confirmed' ? styles.confirmed : 
        styles.cancelled
      ]}>
        <Text style={styles.statusText}>{item.status || 'Pending'}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Welcome, Dr. {auth.currentUser.email.split('@')[0]}</Text>
      <Text style={styles.subtitle}>Your dashboard overview</Text>

      {/* UPCOMING APPOINTMENTS SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments ({appointments.length})</Text>
          {appointments.length > 3 && (
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
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

      {/* PATIENTS SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Registered Patients ({patients.length})</Text>
          {patients.length > 5 && (
            <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
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
            <View key={item.id} style={styles.patientCard}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{item.name}</Text>
                <Text style={styles.patientEmail}>{item.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => {
                  const chatId = createChatId(auth.currentUser.uid, item.id);
                  console.log('Opening chat with patient:', item.name, 'ChatID:', chatId);
                  navigation.navigate('IndividualChat', {
                    chatId,
                    recipientId: item.id,
                    recipientName: item.name
                  });
                }}
              >
                <Ionicons name="chatbubbles" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginBottom: 25,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: SIZES.radius,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  apptPatientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  apptReason: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 4,
  },
  apptTime: {
    fontSize: 13,
    color: COLORS.lightGray,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  pending: {
    backgroundColor: '#FFC107',
  },
  confirmed: {
    backgroundColor: COLORS.success,
  },
  cancelled: {
    backgroundColor: COLORS.secondary,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  patientCard: {
    backgroundColor: COLORS.card,
    padding: 15,
    marginBottom: 10,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  patientEmail: {
    fontSize: 13,
    color: COLORS.lightGray,
    marginTop: 2,
  },
  chatButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    padding: 30,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 10,
    textAlign: 'center',
  },
});
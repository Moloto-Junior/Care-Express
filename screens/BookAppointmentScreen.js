// src/screens/BookAppointmentScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue, push } from 'firebase/database';
import { notifyUserByUID } from './NotificationsService';
import { Ionicons } from '@expo/vector-icons';

export default function BookAppointmentScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, 'users');

    const unsubscribe = onValue(
      usersRef,
      snapshot => {
        const data = snapshot.val();
        console.log('Fetched users:', data); // Debug log

        if (data) {
          const doctorsList = Object.keys(data)
            .filter(uid => data[uid].role === 'Doctor')
            .map(uid => ({ id: uid, ...data[uid] }));

          if (doctorsList.length === 0) {
            Alert.alert('Info', 'No doctors found in the database.');
          }

          setDoctors(doctorsList);
        } else {
          console.log('No users data found');
          Alert.alert('Info', 'No users found in the database.');
          setDoctors([]);
        }

        setLoading(false);
      },
      error => {
        console.log('Error fetching users:', error);
        Alert.alert('Error', 'Failed to fetch doctors. Check console for details.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !date || !time || !reason) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const userRef = ref(db, `users/${userId}`);

      onValue(
        userRef,
        async snapshot => {
          const userData = snapshot.val();
          const patientName = userData?.name || 'Patient';

          const appointment = {
            patientId: userId,
            patientName,
            doctorId: selectedDoctor.id,
            doctorName: selectedDoctor.name,
            date,
            time,
            reason,
            status: 'Pending',
            timestamp: Date.now(),
          };

          await push(ref(db, 'appointments'), appointment);

          // Notify doctor
          await notifyUserByUID(
            selectedDoctor.id,
            'New Appointment',
            `${patientName} booked an appointment for ${date} at ${time}`
          );

          // Notify patient
          await notifyUserByUID(
            userId,
            'Appointment Booked',
            `Your appointment with Dr. ${selectedDoctor.name} is pending confirmation`
          );

          Alert.alert('Success', 'Appointment booked successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        { onlyOnce: true }
      );
    } catch (error) {
      console.log('Booking error:', error);
      Alert.alert('Error', 'Failed to book appointment. Check console for details.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Book Appointment</Text>

      <Text style={styles.label}>Select Doctor:</Text>
      {doctors.length === 0 ? (
        <Text style={styles.emptyText}>No doctors available</Text>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.doctorCard,
                selectedDoctor?.id === item.id && styles.selectedDoctorCard,
              ]}
              onPress={() => setSelectedDoctor(item)}
            >
              <Ionicons
                name="person-circle"
                size={50}
                color={selectedDoctor?.id === item.id ? '#fff' : COLORS.primary}
              />
              <Text
                style={[
                  styles.doctorName,
                  selectedDoctor?.id === item.id && styles.selectedDoctorName,
                ]}
              >
                Dr. {item.name}
              </Text>
              <Text
                style={[
                  styles.doctorEmail,
                  selectedDoctor?.id === item.id && styles.selectedDoctorEmail,
                ]}
              >
                {item.email}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Text style={styles.label}>Date (YYYY-MM-DD):</Text>
      <TextInput
        placeholder="e.g., 2025-11-15"
        value={date}
        onChangeText={setDate}
        style={styles.input}
      />

      <Text style={styles.label}>Time (HH:MM):</Text>
      <TextInput
        placeholder="e.g., 14:30"
        value={time}
        onChangeText={setTime}
        style={styles.input}
      />

      <Text style={styles.label}>Reason for Visit:</Text>
      <TextInput
        placeholder="Describe your symptoms or reason"
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={4}
        style={[styles.input, styles.textArea]}
      />

      <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
        <Ionicons name="calendar" size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 8,
  },
  doctorCard: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: SIZES.radius,
    marginRight: 10,
    alignItems: 'center',
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedDoctorCard: {
    backgroundColor: COLORS.primary,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  selectedDoctorName: {
    color: '#fff',
  },
  doctorEmail: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 2,
    textAlign: 'center',
  },
  selectedDoctorEmail: {
    color: '#fff',
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: 12,
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    padding: 15,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.lightGray,
    marginVertical: 20,
  },
});

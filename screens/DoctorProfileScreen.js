import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { auth, db } from '../firebaseConfig';
import { ref, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

const createChatId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

export default function DoctorProfileScreen({ route, navigation }) {
  const { doctorId } = route.params;
  const [doctor, setDoctor] = useState(null);
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const [doctorSnapshot, feesSnapshot] = await Promise.all([
          get(ref(db, `users/${doctorId}`)),
          get(ref(db, `doctors/${doctorId}/fees`))
        ]);

        if (doctorSnapshot.exists()) {
          setDoctor(doctorSnapshot.val());
        }

        if (feesSnapshot.exists()) {
          setFees(feesSnapshot.val());
        }
      } catch (error) {
        console.log('Error fetching doctor:', error);
      }
      setLoading(false);
    };

    fetchDoctor();
  }, [doctorId]);

  const handleStartChat = () => {
    const me = auth.currentUser?.uid;
    if (!me || !doctor) return;
    const chatId = createChatId(me, doctorId);

    navigation.navigate('IndividualChat', {
      chatId,
      recipientId: doctorId,
      recipientName: `Dr. ${doctor.name}`,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: COLORS.text }}>Doctor not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {doctor.profilePicture ? (
          <Image source={{ uri: doctor.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={80} color="#fff" />
          </View>
        )}
        <Text style={styles.name}>Dr. {doctor.name}</Text>
        <Text style={styles.role}>Doctor</Text>
        {doctor.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="green" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{doctor.email}</Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{doctor.phone || 'Not provided'}</Text>

        <Text style={styles.label}>Specialty</Text>
        <Text style={styles.value}>{doctor.specialty || 'General Practice'}</Text>

        <Text style={styles.label}>Branch</Text>
        <Text style={styles.value}>{doctor.branch || 'Not specified'}</Text>
      </View>

      {fees && (
        <View style={styles.feesContainer}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="cash" size={20} color={COLORS.primary} />
            {' '}Consultation Fees
          </Text>

          <View style={styles.feeCard}>
            <View style={styles.feeHeader}>
              <Ionicons name="medical" size={20} color={COLORS.primary} />
              <Text style={styles.feeTitle}>In-Clinic Consultation</Text>
            </View>
            <Text style={styles.feeAmount}>R{fees.consultationFee}</Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() =>
                navigation.navigate('BookAppointment', {
                  doctorId,
                  doctor,
                  fees,
                  consultationType: 'clinic',
                })
              }
            >
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>

          {fees.availableForHomeVisits && (
            <View style={styles.feeCard}>
              <View style={styles.feeHeader}>
                <Ionicons name="home" size={20} color={COLORS.primary} />
                <Text style={styles.feeTitle}>Home Visit</Text>
              </View>
              <Text style={styles.feeAmount}>R{fees.homeVisitFee}</Text>
              <Text style={styles.feeNote}>+ Travel charges (R50 per 2km)</Text>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() =>
                  navigation.navigate('BookAppointment', {
                    doctorId,
                    doctor,
                    fees,
                    consultationType: 'home',
                  })
                }
              >
                <Text style={styles.bookButtonText}>Book Home Visit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.chatButton} onPress={handleStartChat}>
          <Ionicons name="chatbubbles" size={20} color="white" />
          <Text style={styles.chatButtonText}>Start Chat</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { alignItems: 'center', paddingVertical: 30, backgroundColor: COLORS.card },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  role: { fontSize: 16, color: COLORS.lightGray, marginTop: 5 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#e8f5e8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  verifiedText: { color: 'green', marginLeft: 4, fontSize: 12, fontWeight: '600' },
  infoContainer: { padding: 20 },
  label: { fontSize: 14, color: COLORS.lightGray, marginTop: 15 },
  value: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginTop: 5 },
  feesContainer: { padding: 20, paddingTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  feeCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  feeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  feeTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginLeft: 8 },
  feeAmount: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 5 },
  feeNote: { fontSize: 12, color: COLORS.lightGray, marginBottom: 10 },
  bookButton: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 10, alignItems: 'center' },
  bookButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
  actionContainer: { padding: 20, paddingTop: 0 },
  chatButton: { backgroundColor: COLORS.secondary || '#6B73FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: SIZES.radius, paddingVertical: 15 },
  chatButtonText: { color: 'white', fontWeight: '600', fontSize: 16, marginLeft: 8 },
});

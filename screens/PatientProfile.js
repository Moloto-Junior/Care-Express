import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { db } from '../firebaseConfig';
import { ref, get } from 'firebase/database';
import { COLORS, SIZES } from '../Theme';

export default function PatientProfile({ route }) {
  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const snapshot = await get(ref(db, `users/${patientId}`));
        if (snapshot.exists()) setPatient(snapshot.val());
      } catch (error) {
        console.log('Error fetching patient:', error);
      }
      setLoading(false);
    };
    fetchPatient();
  }, [patientId]);

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  if (!patient) return (
    <View style={styles.loading}>
      <Text style={{ color: COLORS.text }}>Patient not found</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {patient.profilePicture ? (
          <Image source={{ uri: patient.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>{patient.name?.charAt(0) || '?'}</Text>
          </View>
        )}
        <Text style={styles.name}>{patient.name}</Text>
        <Text style={styles.email}>{patient.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{patient.phone || 'N/A'}</Text>

        <Text style={styles.label}>Age</Text>
        <Text style={styles.value}>{patient.age || 'N/A'}</Text>

        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{patient.address || 'N/A'}</Text>

        <Text style={styles.label}>Medical Aid</Text>
        <Text style={styles.value}>{patient.medicalAid ? 'Yes' : 'No'}</Text>

        {patient.medicalAid && (
          <>
            <Text style={styles.label}>Medical Aid Number</Text>
            <Text style={styles.value}>{patient.medicalAidNumber || 'N/A'}</Text>
          </>
        )}

        <Text style={styles.label}>Extras</Text>
        <Text style={styles.value}>{patient.extras || 'N/A'}</Text>

        {patient.medicalHistory && (
          <>
            <Text style={styles.label}>Medical History</Text>
            <Text style={styles.value}>{patient.medicalHistory}</Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, borderWidth: 2, borderColor: COLORS.primary },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.lightGray,
    justifyContent: 'center', alignItems: 'center', marginBottom: 15
  },
  avatarPlaceholderText: { fontSize: 40, color: COLORS.white, fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  email: { fontSize: 16, color: COLORS.lightGray, marginBottom: 10 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  label: { fontSize: 14, color: COLORS.lightGray, fontWeight: '600', marginTop: 10 },
  value: { fontSize: 16, color: COLORS.text, marginTop: 2 },
});

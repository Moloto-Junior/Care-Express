import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db } from '../firebaseConfig';
import { ref, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorProfileScreen({ route }) {
  const { doctorId } = route.params;
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const snapshot = await get(ref(db, `users/${doctorId}`));
        if (snapshot.exists()) {
          setDoctor(snapshot.val());
        }
      } catch (error) {
        console.log('Error fetching doctor:', error);
      }
      setLoading(false);
    };

    fetchDoctor();
  }, [doctorId]);

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
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{doctor.email}</Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{doctor.phone || '-'}</Text>

        <Text style={styles.label}>Specialty</Text>
        <Text style={styles.value}>{doctor.specialty || '-'}</Text>

        <Text style={styles.label}>Branch</Text>
        <Text style={styles.value}>{doctor.branch || '-'}</Text>

        <Text style={styles.label}>Verified</Text>
        <Text style={styles.value}>{doctor.verified ? 'Yes' : 'No'}</Text>
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
  infoContainer: { padding: 20 },
  label: { fontSize: 14, color: COLORS.lightGray, marginTop: 15 },
  value: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginTop: 5 },
});

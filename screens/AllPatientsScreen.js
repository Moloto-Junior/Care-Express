import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';

export default function AllPatientsScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const patientsList = Object.keys(data)
          .filter(uid => data[uid].role === 'Patient')
          .map(uid => ({ id: uid, ...data[uid] }));
        setPatients(patientsList);
      } else {
        setPatients([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
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
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Registered Patients ({patients.length})</Text>
      {patients.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" size={40} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No patients registered yet</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 18 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
  patientCard: { backgroundColor: COLORS.card, padding: 17, marginBottom: 10, borderRadius: SIZES.radius, flexDirection: 'row', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  patientEmail: { fontSize: 13, color: COLORS.lightGray, marginTop: 2 },
  emptyCard: { backgroundColor: COLORS.card, padding: 40, borderRadius: SIZES.radius, alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 14, color: COLORS.lightGray, marginTop: 10, textAlign: 'center' },
});

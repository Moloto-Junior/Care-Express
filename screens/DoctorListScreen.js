import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorListScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const doctorsRef = ref(db, 'users');
    const unsubscribe = onValue(doctorsRef, snapshot => {
      const data = snapshot.val() || {};
      console.log('All users:', data);
      const doctorList = Object.keys(data)
        .filter(uid => data[uid].role === 'doctor')
        .map(uid => ({ id: uid, ...data[uid] }));
      console.log('Doctors:', doctorList);
      setDoctors(doctorList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('IndividualChat', {
        chatId: [auth.currentUser.uid, item.id].sort().join('_'),
        recipientId: item.id,
        recipientName: item.name
      })}
    >
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <Ionicons name="chatbubbles-outline" size={24} color={COLORS.primary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (doctors.length === 0) {
    return (
      <View style={styles.loading}>
        <Text>No doctors registered yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={doctors}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: SIZES.padding }}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width:0, height:2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  name: { fontWeight: 'bold', fontSize: SIZES.font + 2, color: COLORS.primary },
  email: { color: COLORS.text, marginTop: 4 },
});

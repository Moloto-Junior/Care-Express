// src/screens/ViewPatientsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function ViewPatientsScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const patientsList = Object.keys(data)
          .filter(uid => data[uid].role.toLowerCase() === 'patient')
          .map(uid => ({ id: uid, ...data[uid] }));
        setPatients(patientsList);
      } else {
        setPatients([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createChatId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (patients.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={80} color={COLORS.lightGray} />
        <Text style={styles.emptyText}>No Patients Yet</Text>
        <Text style={styles.emptySubText}>Registered patients will appear here</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Patients ({patients.length})</Text>
      </View>

      <FlatList
        data={patients}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.patientCard}>
            <View style={styles.avatarContainer}>
              {item.profilePicture ? (
                <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={30} color={COLORS.primary} />
                </View>
              )}
            </View>

            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{item.name}</Text>
              <Text style={styles.patientEmail}>{item.email}</Text>
              {item.deliveryLocation && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={12} color={COLORS.lightGray} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.deliveryLocation.address || 'Location set'}
                  </Text>
                </View>
              )}
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
              <Ionicons name="chatbubbles" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    padding: SIZES.padding,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  patientCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 15,
    marginHorizontal: SIZES.padding,
    marginTop: 10,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  patientEmail: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginLeft: 4,
    flex: 1,
  },
  chatButton: {
    backgroundColor: COLORS.primary,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
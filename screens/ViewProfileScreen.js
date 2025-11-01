import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function ViewProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const snapshot = await get(ref(db, `users/${userId}`));
      if (snapshot.exists()) {
        setUserData(snapshot.val());
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    }
    setLoading(false);
  };

  const createChatId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
  };

  const handleStartChat = () => {
    const chatId = createChatId(auth.currentUser.uid, userId);
    navigation.navigate('IndividualChat', {
      chatId,
      recipientId: userId,
      recipientName: userData?.name,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.lightGray} />
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {userData.profilePicture ? (
            <Image source={{ uri: userData.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons 
                name={userData.role === 'Doctor' ? 'medical' : 'person'} 
                size={60} 
                color="#fff" 
              />
            </View>
          )}
        </View>

        <Text style={styles.name}>
          {userData.role === 'Doctor' ? 'Dr. ' : ''}{userData.name}
        </Text>

        <View style={styles.roleBadge}>
          <Ionicons 
            name={userData.role === 'Doctor' ? 'medical' : 'person'} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.roleText}>{userData.role}</Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="mail" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userData.email}</Text>
          </View>
        </View>

        {userData.phone && (
          <View style={styles.infoCard}>
            <Ionicons name="call" size={24} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{userData.phone}</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${userData.phone}`)}>
              <Ionicons name="call-outline" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>
        )}

        {userData.role === 'Doctor' && (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="school" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Specialization</Text>
                <Text style={styles.infoValue}>{userData.specialization || 'General Practice'}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="time" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Experience</Text>
                <Text style={styles.infoValue}>{userData.experience || '5+ years'}</Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="calendar" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Recently'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.chatButton} onPress={handleStartChat}>
          <Ionicons name="chatbubbles" size={20} color="#fff" />
          <Text style={styles.chatButtonText}>Start Chat</Text>
        </TouchableOpacity>

        {userData.role === 'Doctor' && (
          <TouchableOpacity 
            style={styles.appointmentButton}
            onPress={() => navigation.navigate('BookAppointment')}
          >
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.appointmentButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 15,
  },
  header: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 30,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  infoSection: {
    padding: SIZES.padding,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  actionsSection: {
    padding: SIZES.padding,
    paddingTop: 0,
    paddingBottom: 30,
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  appointmentButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  appointmentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
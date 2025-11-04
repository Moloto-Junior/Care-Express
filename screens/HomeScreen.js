import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { auth, db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { getTranslation } from '../translations';

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); 

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const userRef = ref(db, `users/${userId}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setUser(snapshot.val());
        } else {
          setUser({ name: 'User' });
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const doctorList = Object.keys(data)
          .filter(uid => data[uid].role === 'Doctor')
          .map(uid => ({ id: uid, ...data[uid] }));
        setDoctors(doctorList.slice(0, 3));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const notificationsRef = ref(db, `notifications/${userId}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const unread = Object.values(data).filter(n => !n.read).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, []);

  const features = [
    { name: 'Book Appointment', icon: 'calendar-plus', screen: 'BookAppointment', color: COLORS.primary },
    { name: 'Medicine Store', icon: 'medical', screen: 'Medicine', color: COLORS.success },
    { name: 'View Recommendations', icon: 'clipboard', screen: 'Recommendation', color: '#9C27B0' },
    { name: 'Live Chat', icon: 'chatbubbles', screen: 'Chat', color: COLORS.secondary },
  ];

  const renderFeatureCard = (item) => (
    <TouchableOpacity
      key={item.name}
      style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.color }]}
      onPress={() => navigation.navigate(item.screen)}
    >
      <Ionicons
        name={item.icon}
        size={36}
        color={item.color}
        style={styles.cardIcon}
      />
      <Text style={styles.cardText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderDoctor = (doctor) => (
    <TouchableOpacity 
      key={doctor.id} 
      style={styles.doctorCard}
      onPress={() => navigation.navigate('DoctorProfile', { doctorId: doctor.id })}
    >
      <View style={styles.doctorAvatar}>
        {doctor.profilePicture ? (
          <Image 
            source={{ uri: doctor.profilePicture }} 
            style={{ width: 60, height: 60, borderRadius: 30 }} 
          />
        ) : (
          <Ionicons name="person" size={30} color={COLORS.primary} />
        )}
      </View>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>Dr. {doctor.name}</Text>
        <Text style={styles.doctorSpecialty}>{doctor.specialty || 'General Practice'}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFC107" />
          <Text style={styles.ratingText}>4.8</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.bookIcon} onPress={() => navigation.navigate('BookAppointment')}>
        <Ionicons name="calendar" size={24} color={COLORS.primary} />
      </TouchableOpacity>
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
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
      {/* Header Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, <Text style={styles.userName}>{user?.name || 'User'}!</Text>
          </Text>
          <Text style={styles.subtext}>How can we help you today?</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications" size={28} color={COLORS.primary} />
          {unreadCount > 0 && (
            <View style={styles.notificationCountContainer}>
              <Text style={styles.notificationCountText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        {features.map(renderFeatureCard)}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Doctors</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BookAppointment')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>
        {doctors.length > 0 ? (
          doctors.map(renderDoctor)
        ) : (
          <Text style={styles.emptyText}>No doctors available yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Tip</Text>
        <View style={styles.tipCard}>
          <Ionicons name="water" size={40} color={COLORS.primary} />
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.tipTitle}>Stay Hydrated</Text>
            <Text style={styles.tipText}>Drink at least 8 glasses of water daily</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { padding: SIZES.padding, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 24, fontWeight: '300', color: COLORS.text },
  userName: { fontWeight: '700', color: COLORS.primary },
  subtext: { fontSize: 14, color: COLORS.lightGray, marginTop: 5 },
  notificationButton: { position: 'relative' },
  notificationCountContainer: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notificationCountText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  quickActions: { marginBottom: 25 },
  card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  cardIcon: { marginRight: 15 },
  cardText: { fontSize: SIZES.font + 2, fontWeight: '600', color: COLORS.text },
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text },
  viewAllText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  doctorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 15, borderRadius: SIZES.radius, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  doctorAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: SIZES.font + 1, fontWeight: '600', color: COLORS.text },
  doctorSpecialty: { fontSize: 14, color: COLORS.lightGray, marginTop: 2 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 12, color: COLORS.text, marginLeft: 4 },
  bookIcon: { padding: 8 },
  emptyText: { color: COLORS.lightGray, textAlign: 'center', marginTop: 10 },
  tipCard: { backgroundColor: COLORS.card, padding: 15, borderRadius: SIZES.radius, flexDirection: 'row', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tipTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  tipText: { fontSize: 14, color: COLORS.lightGray, marginTop: 2 },
});

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Modal, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';
import { ref, onValue, get } from 'firebase/database';

export default function DoctorListScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [viewingDoctor, setViewingDoctor] = useState(null);

  const CLINICS = {
    limpopo: { name: 'Limpopo Polokwane Clinic' },
    johannesburg: { name: 'Johannesburg Braamfontein Clinic' }
  };

  useEffect(() => {
    loadAllDoctors();
  }, []);

  const loadAllDoctors = () => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const doctorList = [];
        
        for (const [uid, userData] of Object.entries(data)) {
          if (userData.role === 'Doctor') {
            try {
              const feesSnapshot = await get(ref(db, `doctors/${uid}/fees`));
              const fees = feesSnapshot.exists() ? feesSnapshot.val() : null;
              
              doctorList.push({
                id: uid,
                ...userData,
                fees: fees || {
                  consultationFee: 300,
                  homeVisitFee: 500,
                  availableForHomeVisits: true,
                  doctorBranch: 'limpopo'
                },
                availableForHomeVisits: fees?.availableForHomeVisits !== undefined ? fees.availableForHomeVisits : true
              });
            } catch (error) {
              doctorList.push({
                id: uid,
                ...userData,
                fees: {
                  consultationFee: 300,
                  homeVisitFee: 500,
                  availableForHomeVisits: true,
                  doctorBranch: 'limpopo'
                },
                availableForHomeVisits: true
              });
            }
          }
        }
        
        setDoctors(doctorList);
      }
      setLoading(false);
    });
  };

  const viewDoctorProfile = (doctor) => {
    setViewingDoctor(doctor);
    setShowProfile(true);
  };

  const bookAppointment = (doctor) => {
    navigation.navigate('ConsultationPayment', {
      doctorId: doctor.id,
      doctor: doctor,
      fees: doctor.fees
    });
  };

  const renderDoctor = ({ item }) => (
    <View style={styles.doctorCard}>
      <TouchableOpacity style={styles.doctorHeader} onPress={() => viewDoctorProfile(item)}>
        <View style={styles.doctorAvatar}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={30} color={COLORS.primary} />
          )}
        </View>
        
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>Dr. {item.name}</Text>
          <Text style={styles.doctorSpecialty}>{item.specialty || 'General Practice'}</Text>
          <Text style={styles.doctorBranch}>
            📍 {item.fees?.doctorBranch ? CLINICS[item.fees.doctorBranch]?.name : 'Limpopo Polokwane Clinic'}
          </Text>
          <View style={styles.feesRow}>
            <Text style={styles.feeText}>💼 R{item.fees?.consultationFee || 300}</Text>
            <Text style={styles.feeText}>🏠 R{item.fees?.homeVisitFee || 500}</Text>
          </View>
        </View>
        
        <Ionicons name="eye" size={20} color={COLORS.primary} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.bookButton}
        onPress={() => bookAppointment(item)}
      >
        <Ionicons name="calendar" size={18} color="white" />
        <Text style={styles.bookText}>Book Appointment</Text>
      </TouchableOpacity>

      {item.availableForHomeVisits && (
        <View style={styles.availabilityBadge}>
          <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
          <Text style={styles.badgeText}>Home visits</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading all doctors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>All Registered Doctors</Text>
        <Text style={styles.doctorCount}>{doctors.length} doctors</Text>
      </View>

      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id}
        renderItem={renderDoctor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      <Modal visible={showProfile} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowProfile(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Doctor Profile</Text>
            <View />
          </View>

          {viewingDoctor && (
            <ScrollView style={styles.profileContent}>
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatar}>
                  {viewingDoctor.profilePicture ? (
                    <Image source={{ uri: viewingDoctor.profilePicture }} style={styles.profileImage} />
                  ) : (
                    <Ionicons name="person" size={60} color={COLORS.primary} />
                  )}
                </View>
                <Text style={styles.profileName}>Dr. {viewingDoctor.name}</Text>
                <Text style={styles.profileSpecialty}>{viewingDoctor.specialty || 'General Practice'}</Text>
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>📧 Contact Information</Text>
                <Text style={styles.profileDetail}>Email: {viewingDoctor.email}</Text>
                <Text style={styles.profileDetail}>Phone: {viewingDoctor.phone || 'Not provided'}</Text>
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>💰 Consultation Fees</Text>
                <Text style={styles.profileDetail}>🏥 Clinic: R{viewingDoctor.fees?.consultationFee || 300}</Text>
                <Text style={styles.profileDetail}>🏠 Home Visit: R{viewingDoctor.fees?.homeVisitFee || 500} + travel</Text>
              </View>

              <TouchableOpacity 
                style={styles.bookFromProfileButton} 
                onPress={() => {
                  setShowProfile(false);
                  bookAppointment(viewingDoctor);
                }}
              >
                <Ionicons name="calendar" size={20} color="white" />
                <Text style={styles.bookFromProfileText}>Book Appointment</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.text },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  doctorCount: { fontSize: 14, color: COLORS.lightGray },
  listContainer: { padding: 15 },
  doctorCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 15, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, position: 'relative' },
  doctorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  doctorAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 2, borderColor: COLORS.primary },
  avatarImage: { width: 46, height: 46, borderRadius: 23 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  doctorSpecialty: { fontSize: 12, color: COLORS.lightGray, marginTop: 2 },
  doctorBranch: { fontSize: 11, color: COLORS.primary, marginTop: 1, fontWeight: '600' },
  feesRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  feeText: { fontSize: 10, color: COLORS.text, fontWeight: '600' },
  bookButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: SIZES.radius, gap: 5 },
  bookText: { color: 'white', fontSize: 14, fontWeight: '600' },
  availabilityBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.success + '20', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 2 },
  badgeText: { fontSize: 9, color: COLORS.success, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  profileContent: { flex: 1, padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 3, borderColor: COLORS.primary },
  profileImage: { width: 74, height: 74, borderRadius: 37 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  profileSpecialty: { fontSize: 14, color: COLORS.lightGray, marginTop: 5 },
  profileSection: { backgroundColor: COLORS.card, padding: 15, borderRadius: SIZES.radius, marginBottom: 15 },
  profileSectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  profileDetail: { fontSize: 14, color: COLORS.text, marginBottom: 5, lineHeight: 20 },
  bookFromProfileButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: SIZES.radius, gap: 8, marginTop: 10, marginBottom: 30 },
  bookFromProfileText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

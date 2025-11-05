import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, Modal, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';
import { ref, onValue, get } from 'firebase/database';

export default function DoctorSelectionScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

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
              
              const doctorData = {
                id: uid,
                ...userData,
                fees: fees || {
                  consultationFee: 300,
                  homeVisitFee: 500,
                  availableForHomeVisits: true,
                  doctorBranch: 'limpopo'
                },
                availableForHomeVisits: fees?.availableForHomeVisits !== undefined ? fees.availableForHomeVisits : true
              };
              
              doctorList.push(doctorData);
            } catch (error) {
              console.log('Error loading fees for doctor:', uid, error);
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
      } else {
        setDoctors([]);
      }
      setLoading(false);
    });
  };

  const selectDoctor = (doctor) => {
    navigation.navigate('ConsultationPayment', {
      doctorId: doctor.id,
      doctor: doctor,
      fees: doctor.fees
    });
  };

  const renderDoctor = ({ item }) => (
    <View style={styles.doctorCard}>
      <View style={styles.doctorHeader}>
        <View style={styles.doctorAvatar}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={35} color={COLORS.primary} />
          )}
        </View>
        
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>Dr. {item.name}</Text>
          <Text style={styles.doctorSpecialty}>{item.specialty || 'General Practice'}</Text>
          <Text style={styles.doctorBranch}>
            📍 {item.fees?.doctorBranch ? CLINICS[item.fees.doctorBranch]?.name : 'Limpopo Polokwane Clinic'}
          </Text>
          <View style={styles.feesPreview}>
            <Text style={styles.feeText}>💼 Clinic: R{item.fees?.consultationFee || 300}</Text>
            <Text style={styles.feeText}>🏠 Home: R{item.fees?.homeVisitFee || 500}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.selectDoctorButton}
        onPress={() => selectDoctor(item)}
      >
        <Ionicons name="calendar" size={20} color="white" />
        <Text style={styles.selectDoctorText}>Select This Doctor</Text>
      </TouchableOpacity>

      {item.availableForHomeVisits && (
        <View style={styles.availabilityBadge}>
          <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
          <Text style={styles.badgeText}>Home visits available</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading available doctors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Select Doctor</Text>
        <Text style={styles.doctorCount}>{doctors.length} available</Text>
      </View>

      {doctors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="medical-outline" size={80} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No doctors available</Text>
          <Text style={styles.emptySubText}>Please check back later</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item.id}
          renderItem={renderDoctor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.text },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  doctorCount: { fontSize: 14, color: COLORS.lightGray },
  listContainer: { padding: 15 },
  doctorCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, position: 'relative' },
  doctorHeader: { flexDirection: 'row', marginBottom: 15 },
  doctorAvatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 3, borderColor: COLORS.primary },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  doctorSpecialty: { fontSize: 14, color: COLORS.lightGray, marginBottom: 5 },
  doctorBranch: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginBottom: 8 },
  feesPreview: { flexDirection: 'row', gap: 15 },
  feeText: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  selectDoctorButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: SIZES.radius, gap: 6 },
  selectDoctorText: { color: 'white', fontSize: 14, fontWeight: '600' },
  availabilityBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.success + '20', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 3 },
  badgeText: { fontSize: 10, color: COLORS.success, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 20 },
  emptySubText: { fontSize: 14, color: COLORS.lightGray, marginTop: 8, textAlign: 'center' },
});

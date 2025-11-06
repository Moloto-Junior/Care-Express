import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, ActivityIndicator, Modal, FlatList, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { ref, get, onValue } from 'firebase/database';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const calculateTravelFee = (distance) => {
  const segments = Math.ceil(distance / 2);
  return segments * 50;
};

export default function BookAppointmentScreen({ route, navigation }) {
  const { doctorId: initialDoctorId, doctor: initialDoctor, fees: initialFees, consultationType = 'clinic' } = route.params || {};
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [patientLocation, setPatientLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distanceKm, setDistanceKm] = useState(0);
  const [travelFee, setTravelFee] = useState(0);
  const [baseFee, setBaseFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(initialDoctor);
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [selectedDoctorFees, setSelectedDoctorFees] = useState(initialFees);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showDoctorProfile, setShowDoctorProfile] = useState(false);
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const CLINICS = {
    limpopo: { 
      latitude: -23.9062, 
      longitude: 29.4560, 
      name: 'Limpopo Polokwane Clinic' 
    },
    johannesburg: { 
      latitude: -26.1907, 
      longitude: 28.0301, 
      name: 'Johannesburg Braamfontein Clinic' 
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const user = auth.currentUser;
        const locSnap = await get(ref(db, `users/${user.uid}/deliveryLocation`));
        if (locSnap.exists()) {
          const loc = locSnap.val();
          setPatientLocation(loc);
          if (consultationType === 'clinic') {
            setSelectedLocation(loc);
            setLocationAddress(loc.address || 'Saved location');
          }
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to load your location');
      }
      setLoading(false);
    };
    init();
    loadDoctors();
  }, []);

  const loadDoctors = () => {
    setLoadingDoctors(true);
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
                fees: fees,
                availableForHomeVisits: fees?.availableForHomeVisits || false
              });
            } catch (error) {
              console.log('Error loading fees for doctor:', uid, error);
              doctorList.push({
                id: uid,
                ...userData,
                fees: null,
                availableForHomeVisits: false
              });
            }
          }
        }
        
        const filteredDoctors = consultationType === 'home' 
          ? doctorList.filter(doc => doc.availableForHomeVisits)
          : doctorList;
        
        setDoctors(filteredDoctors);
      } else {
        setDoctors([]);
      }
      setLoadingDoctors(false);
    });
  };

  const calculateFeesFromLocation = (patientLocationCoords) => {
    if (!selectedDoctorFees || !patientLocationCoords) {
      console.log('Missing fees or location:', { fees: !!selectedDoctorFees, location: !!patientLocationCoords });
      return;
    }
    
    const base = consultationType === 'home' ? Number(selectedDoctorFees.homeVisitFee || 0) : Number(selectedDoctorFees.consultationFee || 0);
    setBaseFee(base);

    if (consultationType === 'home' && selectedDoctorFees.doctorBranch) {
      const doctorBranch = CLINICS[selectedDoctorFees.doctorBranch];
      
      if (doctorBranch && patientLocationCoords.latitude && patientLocationCoords.longitude) {
        console.log('Calculating distance from patient to doctor branch:');
        console.log('Patient location:', patientLocationCoords.latitude, patientLocationCoords.longitude);
        console.log('Doctor branch:', doctorBranch.name, doctorBranch.latitude, doctorBranch.longitude);
        
        const distance = calculateDistance(
          patientLocationCoords.latitude, 
          patientLocationCoords.longitude, 
          doctorBranch.latitude, 
          doctorBranch.longitude
        );
        
        const roundedDistance = Math.round(distance * 100) / 100;
        const calculatedTravelFee = calculateTravelFee(distance);
        const total = base + calculatedTravelFee;
        
        console.log('Calculated distance:', roundedDistance, 'km');
        console.log('Travel fee (R50 per 2km):', calculatedTravelFee);
        console.log('Total amount:', total);
        
        setDistanceKm(roundedDistance);
        setTravelFee(calculatedTravelFee);
        setTotalAmount(total);
        return;
      } else {
        console.log('Missing doctor branch or invalid coordinates');
        console.log('Doctor branch:', selectedDoctorFees.doctorBranch);
        console.log('Branch exists:', !!CLINICS[selectedDoctorFees.doctorBranch]);
      }
    }

    console.log('Setting default fees - no home visit calculation');
    setDistanceKm(0);
    setTravelFee(0);
    setTotalAmount(base);
  };

  useEffect(() => {
    calculateFeesFromLocation(selectedLocation);
  }, [consultationType, selectedDoctorFees, selectedLocation]);

  const selectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDoctorId(doctor.id);
    setSelectedDoctorFees(doctor.fees);
    setShowDoctorModal(false);
  };

  const viewDoctorProfile = (doctor) => {
    setViewingDoctor(doctor);
    setShowDoctorProfile(true);
  };

  const openLocationPicker = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to select your location.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setMapRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      setShowMapModal(true);
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location');
    }
  };

  const onMapPress = async (e) => {
    const coords = e.nativeEvent.coordinate;
    const newLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude
    };
    
    console.log('New location selected:', newLocation);
    setSelectedLocation(newLocation);
    calculateFeesFromLocation(newLocation);
    
    try {
      const result = await Location.reverseGeocodeAsync(coords);
      if (result[0]) {
        const addr = result[0];
        const addressText = `${addr.street || ''} ${addr.city || ''} ${addr.region || ''}`.trim();
        setLocationAddress(addressText || 'Selected location');
      }
    } catch (error) {
      setLocationAddress('Selected location');
    }
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      setPatientLocation(selectedLocation);
      setShowMapModal(false);
      if (consultationType === 'home' && selectedDoctorFees?.doctorBranch) {
        Alert.alert(
          'Location Confirmed', 
          `Distance from ${CLINICS[selectedDoctorFees.doctorBranch]?.name}: ${distanceKm}km\nTravel fee: R${travelFee}\nTotal: R${totalAmount}`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const proceedToPayment = () => {
    if (!selectedDoctor || !selectedDoctorId) {
      Alert.alert('Missing Doctor', 'Please select a doctor first');
      return;
    }

    if (!date || !time || !reason) {
      Alert.alert('Missing Info', 'Please enter date, time and reason');
      return;
    }

    if (consultationType === 'home' && !selectedLocation) {
      Alert.alert('Location Required', 'Please select your location for home visit');
      return;
    }

    const appointmentData = {
      date,
      time,
      reason,
      doctorId: selectedDoctorId,
      doctorName: selectedDoctor?.name || '',
      patientId: auth.currentUser.uid,
      visitLocation: consultationType === 'home' ? selectedLocation : null,
    };
    navigation.navigate('Payment', {
      amount: totalAmount,
      doctorId: selectedDoctorId,
      doctor: selectedDoctor,
      appointmentData,
      consultationType,
      fees: selectedDoctorFees,
      travelFee,
      distance: distanceKm
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={60} color={COLORS.primary} />
        <Text style={styles.title}>Book Appointment</Text>
        <Text style={styles.subtitle}>{consultationType === 'home' ? 'Home Visit' : 'Clinic Consultation'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Select Doctor</Text>
        <TouchableOpacity style={styles.doctorCard} onPress={() => setShowDoctorModal(true)}>
          {selectedDoctor ? (
            <>
              <View style={styles.doctorAvatar}>
                {selectedDoctor.profilePicture ? (
                  <Image source={{ uri: selectedDoctor.profilePicture }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={30} color={COLORS.primary} />
                )}
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>Dr. {selectedDoctor.name}</Text>
                <Text style={styles.doctorSpecialty}>{selectedDoctor.specialty || 'General Practice'}</Text>
                <Text style={styles.doctorBranch}>
                  {selectedDoctorFees?.doctorBranch ? CLINICS[selectedDoctorFees.doctorBranch]?.name : 'Branch not set'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => viewDoctorProfile(selectedDoctor)}>
                <Ionicons name="information-circle" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.doctorAvatar}>
                <Ionicons name="add-circle" size={30} color={COLORS.primary} />
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>Select a Doctor</Text>
                <Text style={styles.doctorSpecialty}>Choose from available doctors</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
            </>
          )}
        </TouchableOpacity>

        {selectedDoctorFees?.doctorBranch && (
          <>
            <Text style={styles.label}>Doctor's Branch</Text>
            <Text style={styles.value}>{CLINICS[selectedDoctorFees.doctorBranch]?.name || 'Unknown Branch'}</Text>
          </>
        )}

        {consultationType === 'home' && (
          <View style={styles.locationSection}>
            <Text style={styles.label}>Visit Location</Text>
            <TouchableOpacity style={styles.locationCard} onPress={openLocationPicker}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  {locationAddress || 'Tap to select location'}
                </Text>
                <Text style={styles.locationSubText}>
                  {selectedLocation ? `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}` : 'Select where you want the doctor to visit'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.breakdownCard}>
          {consultationType === 'home' ? (
            selectedLocation && selectedDoctorFees?.doctorBranch ? (
              <>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Distance from {CLINICS[selectedDoctorFees.doctorBranch]?.name}</Text>
                  <Text style={styles.rowValue}>{distanceKm} km</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Home visit base fee</Text>
                  <Text style={styles.rowValue}>R{Number(selectedDoctorFees?.homeVisitFee || 0)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Travel fee (R50 per 2km)</Text>
                  <Text style={styles.rowValue}>R{travelFee}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>R{totalAmount}</Text>
                </View>
              </>
            ) : (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>
                  {!selectedDoctorFees?.doctorBranch ? 'Doctor branch not set' : 'Select location to calculate fees'}
                </Text>
                <Text style={styles.rowValue}>-</Text>
              </View>
            )
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Consultation fee</Text>
                <Text style={styles.rowValue}>R{Number(selectedDoctorFees?.consultationFee || 0)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>R{totalAmount}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.inputLabel}>Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={COLORS.lightGray}
          value={date}
          onChangeText={setDate}
        />

        <Text style={styles.inputLabel}>Time</Text>
        <TextInput
          style={styles.input}
          placeholder="HH:MM"
          placeholderTextColor={COLORS.lightGray}
          value={time}
          onChangeText={setTime}
        />

        <Text style={styles.inputLabel}>Reason</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Brief reason for visit"
          placeholderTextColor={COLORS.lightGray}
          value={reason}
          onChangeText={setReason}
          multiline
        />
      </View>

      <TouchableOpacity style={styles.payButton} onPress={proceedToPayment}>
        <Ionicons name="card" size={22} color="#fff" />
        <Text style={styles.payButtonText}>Pay R{totalAmount}</Text>
      </TouchableOpacity>

      <Modal visible={showDoctorModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Select Doctor {consultationType === 'home' ? '(Home Visits)' : '(Clinic)'}
            </Text>
            <View />
          </View>

          {loadingDoctors ? (
            <View style={styles.loadingModal}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text>Loading doctors...</Text>
            </View>
          ) : (
            <FlatList
              data={doctors}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.doctorListItem}>
                  <TouchableOpacity 
                    style={styles.doctorSelectCard} 
                    onPress={() => selectDoctor(item)}
                  >
                    <View style={styles.doctorListAvatar}>
                      {item.profilePicture ? (
                        <Image source={{ uri: item.profilePicture }} style={styles.avatarImage} />
                      ) : (
                        <Ionicons name="person" size={24} color={COLORS.primary} />
                      )}
                    </View>
                    <View style={styles.doctorListInfo}>
                      <Text style={styles.doctorListName}>Dr. {item.name}</Text>
                      <Text style={styles.doctorListSpecialty}>{item.specialty || 'General Practice'}</Text>
                      <Text style={styles.doctorListBranch}>
                        {item.fees?.doctorBranch ? CLINICS[item.fees.doctorBranch]?.name : 'Branch not set'}
                      </Text>
                      <Text style={styles.doctorListFee}>
                        {consultationType === 'home' 
                          ? `Home Visit: R${item.fees?.homeVisitFee || 0}` 
                          : `Consultation: R${item.fees?.consultationFee || 0}`}
                      </Text>
                    </View>
                    <View style={styles.doctorListActions}>
                      <TouchableOpacity onPress={() => viewDoctorProfile(item)}>
                        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.lightGray} />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Ionicons name="medical-outline" size={60} color={COLORS.lightGray} />
                  <Text style={styles.emptyText}>
                    {consultationType === 'home' 
                      ? 'No doctors available for home visits' 
                      : 'No doctors available'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      <Modal visible={showDoctorProfile} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDoctorProfile(false)}>
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
                    <Ionicons name="person" size={50} color={COLORS.primary} />
                  )}
                </View>
                <Text style={styles.profileName}>Dr. {viewingDoctor.name}</Text>
                <Text style={styles.profileSpecialty}>{viewingDoctor.specialty || 'General Practice'}</Text>
                <Text style={styles.profileBranch}>
                  {viewingDoctor.fees?.doctorBranch ? CLINICS[viewingDoctor.fees.doctorBranch]?.name : 'Branch not set'}
                </Text>
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Contact Information</Text>
                <Text style={styles.profileDetail}>📧 {viewingDoctor.email}</Text>
                <Text style={styles.profileDetail}>📱 {viewingDoctor.phone || 'Not provided'}</Text>
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Consultation Fees</Text>
                <Text style={styles.profileDetail}>🏥 Clinic Visit: R{viewingDoctor.fees?.consultationFee || 0}</Text>
                {viewingDoctor.availableForHomeVisits && (
                  <Text style={styles.profileDetail}>🏠 Home Visit: R{viewingDoctor.fees?.homeVisitFee || 0}</Text>
                )}
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Availability</Text>
                <Text style={styles.profileDetail}>
                  🏥 Clinic Consultations: Available
                </Text>
                <Text style={styles.profileDetail}>
                  🏠 Home Visits: {viewingDoctor.availableForHomeVisits ? 'Available' : 'Not Available'}
                </Text>
              </View>

              {viewingDoctor.about && (
                <View style={styles.profileSection}>
                  <Text style={styles.profileSectionTitle}>About</Text>
                  <Text style={styles.profileAbout}>{viewingDoctor.about}</Text>
                </View>
              )}

              <TouchableOpacity 
                style={styles.selectDoctorButton} 
                onPress={() => {
                  selectDoctor(viewingDoctor);
                  setShowDoctorProfile(false);
                }}
              >
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text style={styles.selectDoctorText}>Select This Doctor</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal visible={showMapModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Visit Location</Text>
            <TouchableOpacity onPress={confirmLocation}>
              <Text style={styles.confirmText}>Done</Text>
            </TouchableOpacity>
          </View>

          {mapRegion && (
            <MapView
              style={styles.map}
              initialRegion={mapRegion}
              onPress={onMapPress}
              showsUserLocation={true}
            >
              {selectedLocation && (
                <Marker
                  coordinate={selectedLocation}
                  title="Visit Location"
                  description={`Distance: ${distanceKm}km | Fee: R${travelFee}`}
                  pinColor={COLORS.primary}
                />
              )}
              {selectedDoctorFees?.doctorBranch && CLINICS[selectedDoctorFees.doctorBranch] && (
                <Marker
                  coordinate={CLINICS[selectedDoctorFees.doctorBranch]}
                  title={CLINICS[selectedDoctorFees.doctorBranch].name}
                  description="Doctor's Branch"
                  pinColor="red"
                />
              )}
            </MapView>
          )}

          <View style={styles.mapInstructions}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.instructionsText}>
              Tap on the map to select visit location. Distance will be calculated from {CLINICS[selectedDoctorFees?.doctorBranch]?.name || 'doctor\'s branch'}.
            </Text>
          </View>
          
          {selectedLocation && selectedDoctorFees?.doctorBranch && (
            <View style={styles.mapPreview}>
              <Text style={styles.previewText}>
                {distanceKm}km from {CLINICS[selectedDoctorFees.doctorBranch]?.name} | Travel: R{travelFee} | Total: R{totalAmount}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', paddingVertical: 30, backgroundColor: COLORS.card },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 15 },
  subtitle: { fontSize: 16, color: COLORS.lightGray, marginTop: 5 },
  section: { padding: 20 },
  label: { fontSize: 12, color: COLORS.lightGray, marginTop: 12 },
  value: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginTop: 4 },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: SIZES.radius,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  doctorSpecialty: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 2,
  },
  doctorBranch: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 1,
  },
  locationSection: { marginTop: 15 },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: SIZES.radius,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  locationSubText: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 2,
  },
  breakdownCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 15, marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { fontSize: 14, color: COLORS.text, flex: 1 },
  rowValue: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.lightGray + '40', marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  inputLabel: { fontSize: 14, color: COLORS.text, marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 12, fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: COLORS.lightGray },
  payButton: { backgroundColor: COLORS.primary, margin: 20, borderRadius: SIZES.radius, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  confirmText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  loadingModal: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  doctorListItem: { paddingHorizontal: 15, paddingVertical: 5 },
  doctorSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  doctorListAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorListInfo: { flex: 1 },
  doctorListName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  doctorListSpecialty: { fontSize: 12, color: COLORS.lightGray, marginTop: 2 },
  doctorListBranch: { fontSize: 11, color: COLORS.primary, marginTop: 1 },
  doctorListFee: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginTop: 2 },
  doctorListActions: { alignItems: 'center', gap: 5 },
  emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: COLORS.lightGray, textAlign: 'center', marginTop: 20 },
  profileContent: { flex: 1, padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: { width: 80, height: 80, borderRadius: 40 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  profileSpecialty: { fontSize: 16, color: COLORS.lightGray, marginTop: 5 },
  profileBranch: { fontSize: 14, color: COLORS.primary, marginTop: 3 },
  profileSection: { marginBottom: 20 },
  profileSectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  profileDetail: { fontSize: 14, color: COLORS.text, marginBottom: 5 },
  profileAbout: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  selectDoctorButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radius,
    paddingVertical: 15,
    marginTop: 20,
    marginBottom: 30,
  },
  selectDoctorText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  map: { flex: 1 },
  mapInstructions: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: COLORS.card },
  instructionsText: { flex: 1, marginLeft: 10, fontSize: 14, color: COLORS.text },
  mapPreview: { backgroundColor: COLORS.primary, padding: 10, alignItems: 'center' },
  previewText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
});

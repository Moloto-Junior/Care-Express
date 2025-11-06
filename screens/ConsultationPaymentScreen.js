import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, TextInput, ActivityIndicator, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { ref, set, push, get } from 'firebase/database';

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

export default function ConsultationPaymentScreen({ route, navigation }) {
  const { doctorId, doctor, fees } = route.params || {};
  const [selectedType, setSelectedType] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState(0);
  const [travelFee, setTravelFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [processing, setProcessing] = useState(false);

  const CLINICS = {
    limpopo: { latitude: -23.9062, longitude: 29.4560, name: 'Limpopo Polokwane Clinic' },
    johannesburg: { latitude: -26.1907, longitude: 28.0301, name: 'Johannesburg Braamfontein Clinic' }
  };

  const clinicFee = fees?.consultationFee || 300;
  const homeVisitFee = fees?.homeVisitFee || 500;
  const doctorBranch = fees?.doctorBranch || 'limpopo';
  const homeVisitsAvailable = fees?.availableForHomeVisits !== undefined ? fees.availableForHomeVisits : true;

  useEffect(() => {
    loadSavedLocation();
  }, []);

  useEffect(() => {
    if (selectedType === 'clinic') {
      setTotalAmount(clinicFee);
    } else if (selectedType === 'home') {
      calculateHomeFees();
    }
  }, [selectedType, selectedLocation]);

  const loadSavedLocation = async () => {
    try {
      const user = auth.currentUser;
      const locSnap = await get(ref(db, `users/${user.uid}/deliveryLocation`));
      if (locSnap.exists()) {
        const loc = locSnap.val();
        setSelectedLocation(loc);
        setLocationAddress(loc.address || 'Saved location');
      }
    } catch (error) {
      console.log('Error loading saved location:', error);
    }
  };

  const calculateHomeFees = () => {
    if (!selectedLocation) {
      setTotalAmount(homeVisitFee);
      setDistanceKm(0);
      setTravelFee(0);
      return;
    }

    const branchCoord = CLINICS[doctorBranch];
    if (branchCoord) {
      const distance = calculateDistance(
        selectedLocation.latitude,
        selectedLocation.longitude,
        branchCoord.latitude,
        branchCoord.longitude
      );
      const roundedDistance = Math.round(distance * 100) / 100;
      const travel = calculateTravelFee(distance);
      
      setDistanceKm(roundedDistance);
      setTravelFee(travel);
      setTotalAmount(homeVisitFee + travel);
    }
  };

  const selectConsultationType = (type) => {
    if (type === 'home' && !homeVisitsAvailable) {
      Alert.alert('Not Available', 'This doctor is not available for home visits.');
      return;
    }
    setSelectedType(type);
  };

  const proceedToBooking = () => {
    if (!selectedType) {
      Alert.alert('Missing Selection', 'Please choose consultation type first');
      return;
    }

    if (selectedType === 'home' && !selectedLocation) {
      Alert.alert('Location Required', 'Please select your location for home visit');
      return;
    }

    setShowBookingForm(true);
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
    setSelectedLocation(coords);
    
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
      setShowMapModal(false);
    }
  };

  const processPayment = async () => {
    if (!date || !time || !reason) {
      Alert.alert('Missing Info', 'Please enter date, time and reason');
      return;
    }

    setProcessing(true);

    try {
      const user = auth.currentUser;
      const appointmentId = push(ref(db, 'appointments')).key;
      
      const appointmentData = {
        id: appointmentId,
        patientId: user.uid,
        patientName: user.displayName || user.email,
        doctorId,
        doctorName: doctor.name,
        consultationType: selectedType,
        date,
        time,
        reason,
        visitLocation: selectedType === 'home' ? selectedLocation : null,
        fees: {
          baseFee: selectedType === 'home' ? homeVisitFee : clinicFee,
          travelFee: selectedType === 'home' ? travelFee : 0,
          totalAmount
        },
        distance: selectedType === 'home' ? distanceKm : 0,
        status: 'pending',
        timestamp: Date.now()
      };

      await set(ref(db, `appointments/${appointmentId}`), appointmentData);

      if (selectedType === 'home' && selectedLocation) {
        await set(ref(db, `users/${user.uid}/deliveryLocation`), {
          ...selectedLocation,
          address: locationAddress,
          lastUpdated: Date.now()
        });
      }

      const patientNotificationId = push(ref(db, `notifications/${user.uid}`)).key;
      const patientNotification = {
        id: patientNotificationId,
        userId: user.uid,
        title: 'Appointment Booked - Awaiting Confirmation',
        message: `Your ${selectedType === 'home' ? 'home visit' : 'clinic'} appointment with Dr. ${doctor.name} has been submitted and is awaiting confirmation. Date: ${date} at ${time}. Total: R${totalAmount}`,
        type: 'appointment_pending',
        appointmentId,
        doctorName: doctor.name,
        consultationType: selectedType,
        appointmentDate: date,
        appointmentTime: time,
        totalAmount,
        read: false,
        timestamp: Date.now(),
      };
      await set(ref(db, `notifications/${user.uid}/${patientNotificationId}`), patientNotification);

      const doctorNotificationId = push(ref(db, `notifications/${doctorId}`)).key;
      const doctorNotification = {
        id: doctorNotificationId,
        userId: doctorId,
        title: 'New Appointment Request',
        message: `${user.displayName || user.email} has requested a ${selectedType === 'home' ? 'home visit' : 'clinic'} appointment on ${date} at ${time}. Reason: ${reason}`,
        type: 'appointment_request',
        appointmentId,
        patientId: user.uid,
        patientName: user.displayName || user.email,
        consultationType: selectedType,
        appointmentDate: date,
        appointmentTime: time,
        reason,
        totalAmount,
        read: false,
        timestamp: Date.now(),
      };
      await set(ref(db, `notifications/${doctorId}/${doctorNotificationId}`), doctorNotification);

      Alert.alert(
        'Appointment Submitted!',
        `Your appointment request has been sent to Dr. ${doctor.name}. You will receive a notification once the doctor confirms or declines your appointment.\n\nType: ${selectedType === 'home' ? 'Home Visit' : 'Clinic Visit'}\nDate: ${date}\nTime: ${time}\nTotal: R${totalAmount}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PatientTabs', { screen: 'Home' })
          }
        ]
      );

    } catch (error) {
      console.error('Appointment booking error:', error);
      Alert.alert('Booking Failed', 'There was an error booking your appointment. Please try again.');
    }

    setProcessing(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Consultation Booking</Text>
      </View>

      <View style={styles.doctorSection}>
        <Text style={styles.sectionTitle}>Selected Doctor</Text>
        <View style={styles.selectedDoctorCard}>
          <View style={styles.doctorAvatar}>
            {doctor?.profilePicture ? (
              <Image source={{ uri: doctor.profilePicture }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color={COLORS.primary} />
            )}
          </View>
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>Dr. {doctor?.name}</Text>
            <Text style={styles.doctorSpecialty}>{doctor?.specialty || 'General Practice'}</Text>
            <Text style={styles.doctorBranch}>
              📍 {CLINICS[doctorBranch]?.name}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.consultationSection}>
        <Text style={styles.sectionTitle}>Dr. {doctor?.name}'s Consultation Fees</Text>
        
        <TouchableOpacity 
          style={[
            styles.consultationOption,
            selectedType === 'clinic' && styles.selectedOption
          ]}
          onPress={() => selectConsultationType('clinic')}
        >
          <View style={styles.optionContent}>
            <Ionicons name="business" size={32} color={selectedType === 'clinic' ? 'white' : COLORS.primary} />
            <View style={styles.optionInfo}>
              <Text style={[
                styles.optionTitle,
                selectedType === 'clinic' && styles.selectedOptionText
              ]}>
                In-Clinic Consultation
              </Text>
              <Text style={[
                styles.optionDescription,
                selectedType === 'clinic' && styles.selectedOptionText
              ]}>
                Visit Dr. {doctor?.name} at {CLINICS[doctorBranch]?.name}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={[
                styles.optionPrice,
                selectedType === 'clinic' && styles.selectedOptionText
              ]}>
                R{clinicFee}
              </Text>
              <Text style={[
                styles.priceNote,
                selectedType === 'clinic' && styles.selectedOptionText
              ]}>
                Fixed fee
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.consultationOption,
            selectedType === 'home' && styles.selectedOption,
            !homeVisitsAvailable && styles.disabledOption
          ]}
          onPress={() => selectConsultationType('home')}
          disabled={!homeVisitsAvailable}
        >
          <View style={styles.optionContent}>
            <Ionicons 
              name="home" 
              size={32} 
              color={
                !homeVisitsAvailable 
                  ? COLORS.lightGray 
                  : selectedType === 'home' 
                    ? 'white' 
                    : COLORS.success
              } 
            />
            <View style={styles.optionInfo}>
              <Text style={[
                styles.optionTitle,
                selectedType === 'home' && styles.selectedOptionText,
                !homeVisitsAvailable && styles.disabledText
              ]}>
                Home Visit
              </Text>
              <Text style={[
                styles.optionDescription,
                selectedType === 'home' && styles.selectedOptionText,
                !homeVisitsAvailable && styles.disabledText
              ]}>
                {homeVisitsAvailable 
                  ? `Dr. ${doctor?.name} visits you at your location` 
                  : 'Dr. does not offer home visits'}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={[
                styles.optionPrice,
                selectedType === 'home' && styles.selectedOptionText,
                !homeVisitsAvailable && styles.disabledText
              ]}>
                {homeVisitsAvailable ? `R${homeVisitFee}` : 'N/A'}
              </Text>
              <Text style={[
                styles.priceNote,
                selectedType === 'home' && styles.selectedOptionText,
                !homeVisitsAvailable && styles.disabledText
              ]}>
                {homeVisitsAvailable ? '+ R50 per 2km' : ''}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {selectedType === 'home' && homeVisitsAvailable && (
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Select Your Location</Text>
          <TouchableOpacity style={styles.locationCard} onPress={openLocationPicker}>
            <Ionicons name="location" size={24} color={COLORS.primary} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                {locationAddress || 'Tap to select your location'}
              </Text>
              <Text style={styles.locationSubText}>
                {selectedLocation 
                  ? `${distanceKm}km from ${CLINICS[doctorBranch]?.name} | Travel: R${travelFee}`
                  : 'We need your location to calculate travel fees'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
          </TouchableOpacity>
        </View>
      )}

      {selectedType && (
        <View style={styles.totalSection}>
          <View style={styles.totalCard}>
            <Text style={styles.totalTitle}>Total Cost Breakdown</Text>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>
                {selectedType === 'home' ? 'Home visit fee' : 'Clinic consultation fee'}
              </Text>
              <Text style={styles.costValue}>R{selectedType === 'home' ? homeVisitFee : clinicFee}</Text>
            </View>
            
            {selectedType === 'home' && selectedLocation && (
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Distance ({distanceKm}km)</Text>
                <Text style={styles.costValue}>R{travelFee}</Text>
              </View>
            )}
            
            <View style={styles.totalDivider} />
            <View style={styles.costRow}>
              <Text style={styles.finalTotalLabel}>Total Amount</Text>
              <Text style={styles.finalTotalValue}>R{totalAmount}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.bookButton}
            onPress={proceedToBooking}
          >
            <Ionicons name="calendar" size={22} color="white" />
            <Text style={styles.bookButtonText}>Book {selectedType === 'home' ? 'Home Visit' : 'Clinic Visit'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showBookingForm} animationType="slide">
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={() => setShowBookingForm(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.formTitle}>Appointment Details</Text>
            <View />
          </View>

          <ScrollView style={styles.formContent}>
            <View style={styles.bookingSummary}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <Text style={styles.summaryText}>👨‍⚕️ Dr. {doctor?.name}</Text>
              <Text style={styles.summaryText}>
                {selectedType === 'home' ? '🏠 Home Visit' : '🏥 Clinic Visit'}
              </Text>
              <Text style={styles.summaryText}>💰 Total: R{totalAmount}</Text>
              {selectedType === 'home' && selectedLocation && (
                <Text style={styles.summaryText}>📍 {locationAddress} ({distanceKm}km)</Text>
              )}
            </View>

            <View style={styles.formFields}>
              <Text style={styles.inputLabel}>Appointment Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (e.g., 2025-11-06)"
                placeholderTextColor={COLORS.lightGray}
                value={date}
                onChangeText={setDate}
              />

              <Text style={styles.inputLabel}>Appointment Time *</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM (e.g., 14:30)"
                placeholderTextColor={COLORS.lightGray}
                value={time}
                onChangeText={setTime}
              />

              <Text style={styles.inputLabel}>Reason for Visit *</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="Brief description of your health concern"
                placeholderTextColor={COLORS.lightGray}
                value={reason}
                onChangeText={setReason}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={[styles.confirmButton, processing && styles.processingButton]} 
            onPress={processPayment}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size={24} color="white" />
            ) : (
              <Ionicons name="checkmark-circle" size={24} color="white" />
            )}
            <Text style={styles.confirmButtonText}>
              {processing ? 'Processing...' : `Submit Request - R${totalAmount}`}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={showMapModal} animationType="slide">
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Select Visit Location</Text>
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
                  description={`Distance: ${distanceKm}km | Travel: R${travelFee}`}
                  pinColor={COLORS.primary}
                />
              )}
              {CLINICS[doctorBranch] && (
                <Marker
                  coordinate={CLINICS[doctorBranch]}
                  title={CLINICS[doctorBranch].name}
                  description="Doctor's Branch"
                  pinColor="red"
                />
              )}
            </MapView>
          )}

          <View style={styles.mapInstructions}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.instructionsText}>
              Tap on map to select location. Travel fee: R50 per 2km from {CLINICS[doctorBranch]?.name}.
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  backButton: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  doctorSection: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  selectedDoctorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 18, borderRadius: SIZES.radius, borderWidth: 3, borderColor: COLORS.primary },
  doctorAvatar: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 2, borderColor: COLORS.primary },
  avatarImage: { width: 61, height: 61, borderRadius: 30.5 },
  doctorDetails: { flex: 1 },
  doctorName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  doctorSpecialty: { fontSize: 14, color: COLORS.lightGray, marginTop: 3 },
  doctorBranch: { fontSize: 13, color: COLORS.primary, marginTop: 2, fontWeight: '600' },
  consultationSection: { padding: 20 },
  consultationOption: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 22, marginBottom: 15, borderWidth: 3, borderColor: COLORS.lightGray },
  selectedOption: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  disabledOption: { opacity: 0.5, borderColor: COLORS.lightGray },
  optionContent: { flexDirection: 'row', alignItems: 'center' },
  optionInfo: { flex: 1, marginLeft: 15 },
  optionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  optionDescription: { fontSize: 14, color: COLORS.lightGray, marginTop: 5, lineHeight: 20 },
  priceContainer: { alignItems: 'flex-end' },
  optionPrice: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  priceNote: { fontSize: 12, color: COLORS.lightGray, marginTop: 3 },
  selectedOptionText: { color: 'white' },
  disabledText: { color: COLORS.lightGray },
  locationSection: { padding: 20 },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 18, borderRadius: SIZES.radius, borderWidth: 2, borderColor: COLORS.primary },
  locationInfo: { flex: 1, marginLeft: 12 },
  locationText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  locationSubText: { fontSize: 13, color: COLORS.lightGray, marginTop: 4 },
  totalSection: { padding: 20 },
  totalCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: SIZES.radius, borderWidth: 3, borderColor: COLORS.primary, marginBottom: 20 },
  totalTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  costLabel: { fontSize: 14, color: COLORS.text, flex: 1 },
  costValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  totalDivider: { height: 2, backgroundColor: COLORS.primary, marginVertical: 15 },
  finalTotalLabel: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  finalTotalValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  bookButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: SIZES.radius, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  bookButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  formContainer: { flex: 1, backgroundColor: COLORS.background },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  formContent: { flex: 1, padding: 20 },
  bookingSummary: { backgroundColor: COLORS.primary + '15', padding: 18, borderRadius: SIZES.radius, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  summaryText: { fontSize: 14, color: COLORS.text, marginBottom: 6 },
  formFields: { backgroundColor: COLORS.card, padding: 15, borderRadius: SIZES.radius },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 15, marginBottom: 8 },
  input: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 15, fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: COLORS.lightGray },
  confirmButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: SIZES.radius, margin: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  processingButton: { opacity: 0.7 },
  confirmButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  mapContainer: { flex: 1, backgroundColor: COLORS.background },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  mapTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  confirmText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  map: { flex: 1 },
  mapInstructions: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: COLORS.card },
  instructionsText: { flex: 1, marginLeft: 10, fontSize: 14, color: COLORS.text },
});

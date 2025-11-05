import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, ActivityIndicator, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { ref, set, push, get, remove } from 'firebase/database';

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

const calculateDeliveryFee = (distance) => {
  const segments = Math.ceil(distance / 2);
  return segments * 30;
};

export default function MedicinePaymentScreen({ route, navigation }) {
  const { cart, totalAmount } = route.params || {};
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const BRANCHES = {
    limpopo: { 
      id: 'limpopo',
      name: 'Limpopo Polokwane Clinic', 
      latitude: -23.9062, 
      longitude: 29.4560,
      address: 'Polokwane, Limpopo'
    },
    johannesburg: { 
      id: 'johannesburg',
      name: 'Johannesburg Braamfontein Clinic', 
      latitude: -26.1907, 
      longitude: 28.0301,
      address: 'Braamfontein, Johannesburg'
    }
  };

  useEffect(() => {
    loadSavedLocation();
  }, []);

  useEffect(() => {
    if (selectedBranch && deliveryLocation) {
      calculateDeliveryFees();
    } else {
      setDeliveryFee(0);
      setFinalTotal(totalAmount || 0);
    }
  }, [selectedBranch, deliveryLocation, totalAmount]);

  const loadSavedLocation = async () => {
    try {
      const user = auth.currentUser;
      const locSnap = await get(ref(db, `users/${user.uid}/deliveryLocation`));
      if (locSnap.exists()) {
        const loc = locSnap.val();
        setDeliveryLocation(loc);
        setLocationAddress(loc.address || 'Saved location');
      }
    } catch (error) {
      console.log('Error loading saved location:', error);
    }
  };

  const calculateDeliveryFees = () => {
    if (!selectedBranch || !deliveryLocation) return;

    const branch = BRANCHES[selectedBranch];
    const distance = calculateDistance(
      deliveryLocation.latitude,
      deliveryLocation.longitude,
      branch.latitude,
      branch.longitude
    );
    const roundedDistance = Math.round(distance * 100) / 100;
    const delivery = calculateDeliveryFee(distance);
    
    setDistanceKm(roundedDistance);
    setDeliveryFee(delivery);
    setFinalTotal((totalAmount || 0) + delivery);
  };

  const selectBranch = (branchId) => {
    setSelectedBranch(branchId);
  };

  const openLocationPicker = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to select delivery location.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setMapRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });

      setShowMapModal(true);
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location');
    }
  };

  const onMapPress = async (e) => {
    const coords = e.nativeEvent.coordinate;
    setDeliveryLocation(coords);
    
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
    if (deliveryLocation) {
      setShowMapModal(false);
    }
  };

  const proceedToPayment = () => {
    if (!selectedBranch) {
      Alert.alert('Select Branch', 'Please choose which branch to order from');
      return;
    }
    if (!deliveryLocation) {
      Alert.alert('Select Location', 'Please select your delivery location');
      return;
    }
    setShowPaymentForm(true);
  };

  const formatCardNumber = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim();
  };

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const processPayment = async () => {
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
      Alert.alert('Missing Details', 'Please enter all card details');
      return;
    }

    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 13) {
      Alert.alert('Invalid Card', 'Please enter a valid card number');
      return;
    }

    setProcessing(true);

    try {
      const user = auth.currentUser;
      const orderId = push(ref(db, 'orders')).key;
      
      const orderData = {
        id: orderId,
        userId: user.uid,
        userEmail: user.email,
        items: cart,
        branch: selectedBranch,
        branchName: BRANCHES[selectedBranch].name,
        deliveryLocation,
        deliveryAddress: locationAddress,
        distance: distanceKm,
        costs: {
          medicineTotal: totalAmount,
          deliveryFee,
          finalTotal
        },
        paymentMethod: 'card',
        cardLast4: cleanCardNumber.slice(-4),
        status: 'paid',
        timestamp: Date.now()
      };

      await set(ref(db, `orders/${orderId}`), orderData);

      await remove(ref(db, `carts/${user.uid}`));

      await set(ref(db, `users/${user.uid}/deliveryLocation`), {
        ...deliveryLocation,
        address: locationAddress,
        lastUpdated: Date.now()
      });

      const notificationId = push(ref(db, `notifications/${user.uid}`)).key;
      const notification = {
        id: notificationId,
        userId: user.uid,
        title: 'Medicine Purchase Successful',
        message: `You successfully purchased medicine worth R${finalTotal} from ${BRANCHES[selectedBranch].name}. Your order will be delivered to ${locationAddress}. Delivery fee: R${deliveryFee} (${distanceKm}km distance).`,
        type: 'medicine_purchase',
        orderId,
        branchName: BRANCHES[selectedBranch].name,
        medicineTotal: totalAmount,
        deliveryFee,
        finalTotal,
        deliveryAddress: locationAddress,
        distance: distanceKm,
        read: false,
        timestamp: Date.now(),
      };

      await set(ref(db, `notifications/${user.uid}/${notificationId}`), notification);

      Alert.alert(
        'Payment Successful!',
        `Thank you! Your medicine order has been placed successfully.\n\nOrder Total: R${finalTotal}\nFrom: ${BRANCHES[selectedBranch].name}\nDelivery to: ${locationAddress}\nDelivery fee: R${deliveryFee} (${distanceKm}km)\n\nYour medicines will be prepared and delivered soon!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PatientTabs', { screen: 'Home' })
          }
        ]
      );

    } catch (error) {
      console.error('Medicine payment error:', error);
      Alert.alert('Payment Failed', 'There was an error processing your payment. Please try again.');
    }

    setProcessing(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Medicine Payment</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Branch</Text>
        <Text style={styles.sectionSubtitle}>Choose which clinic to order from</Text>

        {Object.values(BRANCHES).map((branch) => (
          <TouchableOpacity
            key={branch.id}
            style={[
              styles.branchOption,
              selectedBranch === branch.id && styles.selectedBranch
            ]}
            onPress={() => selectBranch(branch.id)}
          >
            <View style={styles.branchContent}>
              <Ionicons 
                name="storefront" 
                size={28} 
                color={selectedBranch === branch.id ? 'white' : COLORS.primary} 
              />
              <View style={styles.branchInfo}>
                <Text style={[
                  styles.branchName,
                  selectedBranch === branch.id && styles.selectedText
                ]}>
                  {branch.name}
                </Text>
                <Text style={[
                  styles.branchAddress,
                  selectedBranch === branch.id && styles.selectedText
                ]}>
                  📍 {branch.address}
                </Text>
              </View>
              {selectedBranch === branch.id && (
                <Ionicons name="checkmark-circle" size={24} color="white" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Location</Text>
        <TouchableOpacity style={styles.locationCard} onPress={openLocationPicker}>
          <Ionicons name="location" size={24} color={COLORS.primary} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              {locationAddress || 'Tap to select delivery location'}
            </Text>
            <Text style={styles.locationSubText}>
              {deliveryLocation && selectedBranch
                ? `${distanceKm}km from ${BRANCHES[selectedBranch]?.name} | Delivery: R${deliveryFee}`
                : 'Select branch and location to calculate delivery fee'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
        </TouchableOpacity>
      </View>

      {cart && cart.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.orderItemName}>{item.name} x{item.quantity}</Text>
              <Text style={styles.orderItemPrice}>R{item.price * item.quantity}</Text>
            </View>
          ))}
        </View>
      )}

      {selectedBranch && deliveryLocation && (
        <View style={styles.totalSection}>
          <View style={styles.totalCard}>
            <Text style={styles.totalTitle}>Payment Summary</Text>
            
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Medicine Total</Text>
              <Text style={styles.costValue}>R{totalAmount || 0}</Text>
            </View>
            
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Delivery Fee ({distanceKm}km)</Text>
              <Text style={styles.costValue}>R{deliveryFee}</Text>
            </View>
            
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>From: {BRANCHES[selectedBranch]?.name}</Text>
              <Text style={styles.costValue}>Selected</Text>
            </View>
            
            <View style={styles.totalDivider} />
            <View style={styles.costRow}>
              <Text style={styles.finalTotalLabel}>Final Total</Text>
              <Text style={styles.finalTotalValue}>R{finalTotal}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.payButton}
            onPress={proceedToPayment}
          >
            <Ionicons name="card" size={22} color="white" />
            <Text style={styles.payButtonText}>Proceed to Payment - R{finalTotal}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showPaymentForm} animationType="slide">
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={() => setShowPaymentForm(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.formTitle}>Card Payment</Text>
            <View />
          </View>

          <ScrollView style={styles.formContent}>
            <View style={styles.paymentSummary}>
              <Text style={styles.summaryTitle}>Final Order Summary</Text>
              <Text style={styles.summaryText}>🏥 From: {BRANCHES[selectedBranch]?.name}</Text>
              <Text style={styles.summaryText}>📍 To: {locationAddress}</Text>
              <Text style={styles.summaryText}>📦 Medicine: R{totalAmount}</Text>
              <Text style={styles.summaryText}>🚚 Delivery: R{deliveryFee} ({distanceKm}km)</Text>
              <Text style={styles.summaryText}>💰 Total: R{finalTotal}</Text>
            </View>

            <View style={styles.cardForm}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Full name as on card"
                placeholderTextColor={COLORS.lightGray}
                value={cardName}
                onChangeText={setCardName}
              />

              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={COLORS.lightGray}
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="numeric"
                maxLength={19}
              />

              <View style={styles.cardRow}>
                <View style={styles.cardHalf}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor={COLORS.lightGray}
                    value={cardExpiry}
                    onChangeText={(text) => setCardExpiry(formatExpiry(text))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={styles.cardHalf}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor={COLORS.lightGray}
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={[styles.confirmPaymentButton, processing && styles.processingButton]} 
            onPress={processPayment}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size={24} color="white" />
            ) : (
              <Ionicons name="card" size={24} color="white" />
            )}
            <Text style={styles.confirmPaymentText}>
              {processing ? 'Processing Payment...' : `Pay R${finalTotal}`}
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
            <Text style={styles.mapTitle}>Select Delivery Location</Text>
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
              {deliveryLocation && (
                <Marker
                  coordinate={deliveryLocation}
                  title="Delivery Location"
                  description={selectedBranch ? `Distance: ${distanceKm}km | Fee: R${deliveryFee}` : 'Select branch first'}
                  pinColor={COLORS.success}
                />
              )}
              {selectedBranch && BRANCHES[selectedBranch] && (
                <Marker
                  coordinate={BRANCHES[selectedBranch]}
                  title={BRANCHES[selectedBranch].name}
                  description="Medicine Branch"
                  pinColor={COLORS.primary}
                />
              )}
            </MapView>
          )}

          <View style={styles.mapInstructions}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.instructionsText}>
              Tap on map to select delivery location. Delivery fee: R30 per 2km from selected branch.
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
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginLeft: 15 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  sectionSubtitle: { fontSize: 14, color: COLORS.lightGray, marginBottom: 15 },
  branchOption: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 18, marginBottom: 12, borderWidth: 2, borderColor: COLORS.lightGray },
  selectedBranch: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  branchContent: { flexDirection: 'row', alignItems: 'center' },
  branchInfo: { flex: 1, marginLeft: 15 },
  branchName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  branchAddress: { fontSize: 14, color: COLORS.lightGray, marginTop: 3 },
  selectedText: { color: 'white' },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 18, borderRadius: SIZES.radius, borderWidth: 2, borderColor: selectedBranch && deliveryLocation ? COLORS.success : COLORS.primary },
  locationInfo: { flex: 1, marginLeft: 12 },
  locationText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  locationSubText: { fontSize: 13, color: COLORS.lightGray, marginTop: 4 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  orderItemName: { fontSize: 14, color: COLORS.text, flex: 1 },
  orderItemPrice: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  totalSection: { padding: 20 },
  totalCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: SIZES.radius, borderWidth: 3, borderColor: COLORS.success, marginBottom: 20 },
  totalTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  costLabel: { fontSize: 14, color: COLORS.text, flex: 1 },
  costValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  totalDivider: { height: 2, backgroundColor: COLORS.success, marginVertical: 15 },
  finalTotalLabel: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  finalTotalValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.success },
  payButton: { backgroundColor: COLORS.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: SIZES.radius, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  payButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  formContainer: { flex: 1, backgroundColor: COLORS.background },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  formContent: { flex: 1, padding: 20 },
  paymentSummary: { backgroundColor: COLORS.success + '15', padding: 18, borderRadius: SIZES.radius, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: COLORS.success },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  summaryText: { fontSize: 14, color: COLORS.text, marginBottom: 6 },
  cardForm: { backgroundColor: COLORS.card, padding: 20, borderRadius: SIZES.radius },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 15, fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 15 },
  cardRow: { flexDirection: 'row', gap: 15 },
  cardHalf: { flex: 1 },
  confirmPaymentButton: { backgroundColor: COLORS.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: SIZES.radius, margin: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  processingButton: { opacity: 0.7 },
  confirmPaymentText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  mapContainer: { flex: 1, backgroundColor: COLORS.background },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  mapTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  confirmText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  map: { flex: 1 },
  mapInstructions: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: COLORS.card },
  instructionsText: { flex: 1, marginLeft: 10, fontSize: 14, color: COLORS.text },
});

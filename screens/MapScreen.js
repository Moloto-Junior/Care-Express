import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { ref, set, push } from 'firebase/database';

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
  return segments * 50;
};

export default function MapScreen({ route, navigation }) {
  const { cartItems = [], cartTotal = 0 } = route.params || {};
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBranchModal, setShowBranchModal] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [distance, setDistance] = useState(0);
  const [totalAmount, setTotalAmount] = useState(cartTotal);
  const [locationAddress, setLocationAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');

  const PHARMACY_BRANCHES = [
    {
      id: 'limpopo',
      name: 'Limpopo Polokwane Pharmacy',
      address: 'Polokwane, Limpopo',
      coordinates: { latitude: -23.9062, longitude: 29.4560 },
      description: 'Full pharmacy services with prescription medicines',
      color: '#4CAF50'
    },
    {
      id: 'johannesburg',
      name: 'Johannesburg Braamfontein Pharmacy',
      address: 'Braamfontein, Johannesburg',
      coordinates: { latitude: -26.1907, longitude: 28.0301 },
      description: 'Complete medication dispensary and health products',
      color: '#2196F3'
    }
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (selectedLocation && selectedBranch) {
      calculateDeliveryFees();
    }
  }, [selectedLocation, selectedBranch]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required for delivery.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setMapRegion(region);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      const address = await getAddressFromCoords(location.coords.latitude, location.coords.longitude);
      setLocationAddress(address);

    } catch (error) {
      Alert.alert('Error', 'Could not get your location. Please try again.');
    }
    setLoading(false);
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result[0]) {
        const addr = result[0];
        return `${addr.street || ''} ${addr.city || ''} ${addr.region || ''}`.trim() || 'Current location';
      }
    } catch (error) {
      console.log('Reverse geocoding error:', error);
    }
    return 'Selected location';
  };

  const calculateDeliveryFees = () => {
    if (!selectedLocation || !selectedBranch) return;

    const branchCoords = selectedBranch.coordinates;
    const dist = calculateDistance(
      selectedLocation.latitude,
      selectedLocation.longitude,
      branchCoords.latitude,
      branchCoords.longitude
    );

    const roundedDistance = Math.round(dist * 100) / 100;
    const deliveryCharge = calculateDeliveryFee(dist);
    const total = cartTotal + deliveryCharge;

    setDistance(roundedDistance);
    setDeliveryFee(deliveryCharge);
    setTotalAmount(total);

    console.log(`Delivery from ${selectedBranch.name}:`);
    console.log(`Distance: ${roundedDistance}km`);
    console.log(`Segments (per 2km): ${Math.ceil(dist / 2)}`);
    console.log(`Delivery fee: R${deliveryCharge} (R50 per 2km)`);
    console.log(`Medicine total: R${cartTotal}`);
    console.log(`Total amount: R${total}`);
  };

  const selectBranch = (branch) => {
    setSelectedBranch(branch);
    setShowBranchModal(false);
  };

  const onMapPress = async (e) => {
    const coords = e.nativeEvent.coordinate;
    setSelectedLocation(coords);
    
    const address = await getAddressFromCoords(coords.latitude, coords.longitude);
    setLocationAddress(address);
  };

  const confirmDeliveryDetails = () => {
    if (!selectedLocation || !selectedBranch) {
      Alert.alert('Incomplete Selection', 'Please select both delivery location and pharmacy branch');
      return;
    }

    setShowPaymentModal(true);
  };

  const validatePaymentDetails = () => {
    if (!cardNumber.trim() || cardNumber.length < 16) {
      Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number');
      return false;
    }

    if (!expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      Alert.alert('Invalid Expiry', 'Please enter expiry date in MM/YY format');
      return false;
    }

    if (!cvv.trim() || cvv.length < 3) {
      Alert.alert('Invalid CVV', 'Please enter a valid 3-digit CVV');
      return false;
    }

    if (!cardHolderName.trim()) {
      Alert.alert('Missing Name', 'Please enter card holder name');
      return false;
    }

    return true;
  };

  const processPayment = async () => {
    if (!validatePaymentDetails()) return;

    setProcessing(true);

    try {
      const user = auth.currentUser;
      const orderId = push(ref(db, 'medicineOrders')).key;
      
      const orderData = {
        id: orderId,
        patientId: user.uid,
        patientName: user.displayName || user.email,
        deliveryLocation: {
          ...selectedLocation,
          address: locationAddress
        },
        pharmacyBranch: selectedBranch,
        cartItems,
        medicineTotal: cartTotal,
        deliveryFee,
        distance,
        totalAmount,
        paymentMethod: 'card',
        paymentDetails: {
          cardNumber: `****-****-****-${cardNumber.slice(-4)}`,
          cardHolderName
        },
        status: 'confirmed',
        timestamp: Date.now()
      };

      await set(ref(db, `medicineOrders/${orderId}`), orderData);

      await set(ref(db, `users/${user.uid}/deliveryLocation`), {
        ...selectedLocation,
        address: locationAddress,
        lastUpdated: Date.now()
      });

      const notificationId = push(ref(db, `notifications/${user.uid}`)).key;
      const notification = {
        id: notificationId,
        userId: user.uid,
        title: 'Medicine Order Confirmed',
        message: `Your medicine order from ${selectedBranch.name} has been confirmed. Total: R${totalAmount.toFixed(2)}. Delivery to: ${locationAddress}`,
        type: 'medicine_order',
        orderId,
        pharmacyBranch: selectedBranch.id,
        read: false,
        timestamp: Date.now(),
      };

      await set(ref(db, `notifications/${user.uid}/${notificationId}`), notification);

      Alert.alert(
        'Order Successful!',
        `Your medicine order has been placed successfully.\n\nOrder ID: ${orderId.slice(-8)}\nTotal Paid: R${totalAmount.toFixed(2)}\nDelivery: ${locationAddress}\n\nYour medicines will be delivered from ${selectedBranch.name}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPaymentModal(false);
              navigation.navigate('PatientTabs', { screen: 'Home' });
            }
          }
        ]
      );

    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Payment Failed', 'There was an error processing your payment. Please try again.');
    }

    setProcessing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
              title="Delivery Location"
              description={`${locationAddress} | Distance: ${distance}km`}
              pinColor={COLORS.primary}
            />
          )}
          
          {selectedBranch && (
            <Marker
              coordinate={selectedBranch.coordinates}
              title={selectedBranch.name}
              description="Selected Pharmacy"
              pinColor={selectedBranch.color}
            />
          )}

          {PHARMACY_BRANCHES.map(branch => (
            <Marker
              key={branch.id}
              coordinate={branch.coordinates}
              title={branch.name}
              description={branch.description}
              pinColor={selectedBranch?.id === branch.id ? branch.color : 'gray'}
              opacity={selectedBranch?.id === branch.id ? 1 : 0.6}
            />
          ))}
        </MapView>
      )}

      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        
        <View style={styles.branchSelector}>
          <Text style={styles.sectionTitle}>Selected Pharmacy</Text>
          <TouchableOpacity 
            style={styles.selectedBranchCard}
            onPress={() => setShowBranchModal(true)}
          >
            {selectedBranch ? (
              <>
                <View style={styles.branchIcon}>
                  <Ionicons name="medical" size={24} color={selectedBranch.color} />
                </View>
                <View style={styles.branchDetails}>
                  <Text style={styles.branchName}>{selectedBranch.name}</Text>
                  <Text style={styles.branchAddress}>{selectedBranch.address}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={COLORS.lightGray} />
              </>
            ) : (
              <>
                <View style={styles.branchIcon}>
                  <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.branchDetails}>
                  <Text style={styles.branchName}>Select Pharmacy Branch</Text>
                  <Text style={styles.branchAddress}>Choose where to order from</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={COLORS.lightGray} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {selectedLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.sectionTitle}>Delivery Location</Text>
            <View style={styles.locationCard}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <View style={styles.locationDetails}>
                <Text style={styles.locationText}>{locationAddress}</Text>
                <Text style={styles.coordinatesText}>
                  Tap map to change location
                </Text>
              </View>
            </View>
          </View>
        )}

        {selectedBranch && selectedLocation && (
          <View style={styles.pricingCard}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Medicine Total</Text>
              <Text style={styles.priceValue}>R{cartTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Distance from {selectedBranch.name}</Text>
              <Text style={styles.priceValue}>{distance} km</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee (R50 per 2km)</Text>
              <Text style={styles.priceValue}>R{deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>R{totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.confirmButton, 
            (!selectedBranch || !selectedLocation) && styles.disabledButton
          ]} 
          onPress={confirmDeliveryDetails}
          disabled={!selectedBranch || !selectedLocation}
        >
          <Ionicons name="card" size={24} color="white" />
          <Text style={styles.confirmButtonText}>
            Confirm & Pay R{totalAmount.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showBranchModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Pharmacy Branch</Text>
              <TouchableOpacity onPress={() => setShowBranchModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.branchList}>
              {PHARMACY_BRANCHES.map(branch => (
                <TouchableOpacity
                  key={branch.id}
                  style={[
                    styles.branchOption,
                    selectedBranch?.id === branch.id && styles.selectedBranchOption
                  ]}
                  onPress={() => selectBranch(branch)}
                >
                  <View style={styles.branchOptionIcon}>
                    <Ionicons name="medical" size={30} color={branch.color} />
                  </View>
                  <View style={styles.branchOptionDetails}>
                    <Text style={styles.branchOptionName}>{branch.name}</Text>
                    <Text style={styles.branchOptionAddress}>{branch.address}</Text>
                    <Text style={styles.branchOptionDescription}>{branch.description}</Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedBranch?.id === branch.id && styles.radioButtonSelected
                  ]}>
                    {selectedBranch?.id === branch.id && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Text style={styles.modalNote}>
                Delivery fee: R50 per 2km from selected branch
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPaymentModal} animationType="slide">
        <View style={styles.paymentContainer}>
          <View style={styles.paymentHeader}>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.paymentTitle}>Payment Details</Text>
            <View />
          </View>

          <ScrollView style={styles.paymentContent}>
            <View style={styles.orderSummaryCard}>
              <Text style={styles.cardTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Medicine Total:</Text>
                <Text style={styles.summaryValue}>R{cartTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery ({distance}km from {selectedBranch?.name}):</Text>
                <Text style={styles.summaryValue}>R{deliveryFee.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotal}>Total Amount:</Text>
                <Text style={styles.summaryTotalValue}>R{totalAmount.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.paymentFormCard}>
              <Text style={styles.cardTitle}>Card Details</Text>
              
              <Text style={styles.inputLabel}>Card Holder Name</Text>
              <TextInput
                style={styles.paymentInput}
                value={cardHolderName}
                onChangeText={setCardHolderName}
                placeholder="John Doe"
                placeholderTextColor={COLORS.lightGray}
              />

              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.paymentInput}
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="1234 5678 9012 3456"
                keyboardType="numeric"
                maxLength={16}
                placeholderTextColor={COLORS.lightGray}
              />

              <View style={styles.inputRow}>
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={[styles.paymentInput, styles.halfInput]}
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    placeholder="MM/YY"
                    maxLength={5}
                    placeholderTextColor={COLORS.lightGray}
                  />
                </View>
                
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={[styles.paymentInput, styles.halfInput]}
                    value={cvv}
                    onChangeText={setCvv}
                    placeholder="123"
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                    placeholderTextColor={COLORS.lightGray}
                  />
                </View>
              </View>
            </View>

            <View style={styles.deliveryInfoCard}>
              <Text style={styles.cardTitle}>Delivery Information</Text>
              <Text style={styles.deliveryText}>📍 {locationAddress}</Text>
              <Text style={styles.deliveryText}>🏥 From: {selectedBranch?.name}</Text>
              <Text style={styles.deliveryText}>📏 Distance: {distance}km</Text>
              <Text style={styles.deliveryText}>🚚 Delivery: R50 per 2km = R{deliveryFee.toFixed(2)}</Text>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={[styles.payButton, processing && styles.processingButton]} 
            onPress={processPayment}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size={24} color="white" />
            ) : (
              <Ionicons name="card" size={24} color="white" />
            )}
            <Text style={styles.payButtonText}>
              {processing ? 'Processing...' : `Pay R${totalAmount.toFixed(2)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  branchSelector: {
    marginBottom: 20,
  },
  selectedBranchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  branchIcon: {
    marginRight: 12,
  },
  branchDetails: {
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  branchAddress: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 2,
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  locationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  coordinatesText: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 2,
  },
  pricingCard: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: SIZES.radius,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray + '40',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radius,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  branchList: {
    padding: 20,
  },
  branchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  selectedBranchOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  branchOptionIcon: {
    marginRight: 15,
  },
  branchOptionDetails: {
    flex: 1,
  },
  branchOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  branchOptionAddress: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginBottom: 2,
  },
  branchOptionDescription: {
    fontSize: 11,
    color: COLORS.lightGray,
    fontStyle: 'italic',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  modalNote: {
    fontSize: 12,
    color: COLORS.lightGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  paymentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  paymentContent: {
    flex: 1,
    padding: 20,
  },
  orderSummaryCard: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: SIZES.radius,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.lightGray + '40',
    marginVertical: 10,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentFormCard: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: SIZES.radius,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
    marginTop: 10,
  },
  paymentInput: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInputContainer: {
    flex: 1,
  },
  halfInput: {
    marginTop: 0,
  },
  deliveryInfoCard: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: SIZES.radius,
    marginBottom: 20,
  },
  deliveryText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radius,
    paddingVertical: 15,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  processingButton: {
    opacity: 0.7,
  },
  payButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

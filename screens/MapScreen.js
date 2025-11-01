import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { auth, db } from '../firebaseConfig';
import { ref, set, get } from 'firebase/database';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetchLocation = async () => {
      const user = auth.currentUser;
      try {
        const snapshot = await get(ref(db, `users/${user.uid}/deliveryLocation`));
        if (snapshot.exists()) {
          const loc = snapshot.val();
          setMarker(loc);
          setLocation({
            latitude: loc.latitude,
            longitude: loc.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          getAddressFromCoords(loc.latitude, loc.longitude);
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Please allow location access to set delivery address.');
            setLoading(false);
            return;
          }

          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          
          const initialLoc = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          
          setLocation(initialLoc);
          setMarker({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          getAddressFromCoords(loc.coords.latitude, loc.coords.longitude);
        }
      } catch (error) {
        console.log('Error fetching location:', error);
        Alert.alert('Error', 'Could not fetch location. Please try again.');
      }
      setLoading(false);
    };
    fetchLocation();
  }, []);

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result[0]) {
        const addr = result[0];
        const addressText = `${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.postalCode || ''}`.trim();
        setAddress(addressText || 'Unknown address');
      }
    } catch (error) {
      console.log('Error getting address:', error);
      setAddress('Address not available');
    }
  };

  const onMapPress = (e) => {
    const coords = e.nativeEvent.coordinate;
    setMarker(coords);
    getAddressFromCoords(coords.latitude, coords.longitude);
  };

  const saveLocation = async () => {
    if (!marker) {
      Alert.alert('Error', 'Please select a location by tapping on the map.');
      return;
    }
    
    setLoading(true);
    try {
      const user = auth.currentUser;
      await set(ref(db, `users/${user.uid}/deliveryLocation`), {
        latitude: marker.latitude,
        longitude: marker.longitude,
        address,
        timestamp: Date.now(),
      });
      
      Alert.alert('Success', 'Delivery location saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save location.');
      console.log(error);
    }
    setLoading(false);
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newLoc = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      
      setMarker(newLoc);
      setLocation({
        ...newLoc,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      getAddressFromCoords(newLoc.latitude, newLoc.longitude);
    } catch (error) {
      Alert.alert('Error', 'Could not get current location');
    }
    setLoading(false);
  };

  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={location}
        onPress={onMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {marker && (
          <Marker
            coordinate={marker}
            pinColor={COLORS.primary}
          />
        )}
      </MapView>

      {address && (
        <View style={styles.addressCard}>
          <Ionicons name="location" size={24} color={COLORS.primary} />
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>Delivery Address</Text>
            <Text style={styles.addressText}>{address}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
        <Ionicons name="locate" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={styles.instructionsCard}>
        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
        <Text style={styles.instructionsText}>Tap anywhere on the map to set your delivery location</Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveLocation}>
        <Ionicons name="checkmark-circle" size={24} color="white" style={{ marginRight: 10 }} />
        <Text style={styles.saveButtonText}>Save Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  addressCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addressInfo: {
    flex: 1,
    marginLeft: 10,
  },
  addressLabel: {
    fontSize: 12,
    color: COLORS.lightGray,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
  },
  currentLocationButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: COLORS.card,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instructionsCard: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  instructionsText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: COLORS.text,
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
},
});    
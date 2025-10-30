// src/screens/SearchMedicineScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Image } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';

// Medicine images mapping
const medicineImages = {
  'paracetamol': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
  'ibuprofen': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
  'amoxicillin': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop',
  'vitamin': 'https://images.unsplash.com/photo-1526424382096-74a93e105682?w=200&h=200&fit=crop',
  'aspirin': 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
  'antibiotic': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop',
  'default': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
};

const getMedicineImage = (name) => {
  const lowercaseName = name.toLowerCase();
  for (const key in medicineImages) {
    if (lowercaseName.includes(key)) {
      return medicineImages[key];
    }
  }
  return medicineImages.default;
};

export default function SearchMedicineScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [filteredMeds, setFilteredMeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);

  const fetchMedicines = async (query = '') => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:${query || 'paracetamol'}&limit=20`);
      const data = await response.json();
      
      if (data.results) {
        const medicineList = data.results.map((item, index) => {
          const name = item.openfda?.brand_name?.[0] || item.openfda?.generic_name?.[0] || 'Unknown Medicine';
          return {
            id: index.toString(),
            name,
            genericName: item.openfda?.generic_name?.[0] || 'N/A',
            manufacturer: item.openfda?.manufacturer_name?.[0] || 'N/A',
            price: Math.floor(Math.random() * (500 - 25 + 1)) + 25,
            description: item.purpose?.[0] || item.description?.[0] || 'No description available',
            image: getMedicineImage(name),
          };
        });
        setMedicines(medicineList);
        setFilteredMeds(medicineList);
      } else {
        setMedicines([]);
        setFilteredMeds([]);
      }
    } catch (error) {
      console.log('Error fetching medicines:', error);
      const localMeds = [
        { id: '1', name: 'Paracetamol', genericName: 'Acetaminophen', manufacturer: 'Generic', price: 25, description: 'Pain relief and fever reducer', image: medicineImages.paracetamol },
        { id: '2', name: 'Ibuprofen', genericName: 'Ibuprofen', manufacturer: 'Generic', price: 35, description: 'Anti-inflammatory pain reliever', image: medicineImages.ibuprofen },
        { id: '3', name: 'Amoxicillin', genericName: 'Amoxicillin', manufacturer: 'Generic', price: 85, description: 'Antibiotic for bacterial infections', image: medicineImages.amoxicillin },
        { id: '4', name: 'Vitamin C', genericName: 'Ascorbic Acid', manufacturer: 'Generic', price: 45, description: 'Immune system support', image: medicineImages.vitamin },
        { id: '5', name: 'Aspirin', genericName: 'Acetylsalicylic Acid', manufacturer: 'Generic', price: 20, description: 'Pain relief and blood thinner', image: medicineImages.aspirin },
      ];
      setMedicines(localMeds);
      setFilteredMeds(localMeds);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredMeds(medicines);
      return;
    }
    const results = medicines.filter(med =>
      med.name.toLowerCase().includes(search.toLowerCase()) ||
      med.genericName.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredMeds(results);
  }, [search, medicines]);

  const addToCart = (medicine) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === medicine.id);
      if (existing) {
        return prev.map(item =>
          item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...medicine, quantity: 1 }];
    });
    Alert.alert('Added to Cart', `${medicine.name} added successfully!`);
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.lightGray} style={styles.searchIcon} />
        <TextInput
          placeholder="Search medicines..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholderTextColor={COLORS.lightGray}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => { setSearch(''); fetchMedicines(); }}>
            <Ionicons name="close-circle" size={20} color={COLORS.lightGray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Button */}
      <TouchableOpacity style={styles.searchButton} onPress={() => fetchMedicines(search)}>
        <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

      {/* Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart', { cart, setCart })}
        >
          <Ionicons name="cart" size={24} color="#fff" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
          </View>
          <Text style={styles.cartButtonText}>View Cart (R{getTotalPrice()})</Text>
        </TouchableOpacity>
      )}

      {/* Medicine List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredMeds}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="medical-outline" size={60} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No medicines found</Text>
              <Text style={styles.emptySubText}>Try searching for a different medicine</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.medicineCard}>
              {/* Medicine Image */}
              <Image 
                source={{ uri: item.image }} 
                style={styles.medicineImage}
                resizeMode="cover"
              />
              
              <View style={styles.medicineInfo}>
                <Text style={styles.medicineName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.medicineGeneric} numberOfLines={1}>{item.genericName}</Text>
                <Text style={styles.medicineManufacturer} numberOfLines={1}>{item.manufacturer}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.medicinePrice}>R {item.price}</Text>
                  <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
                    <Ionicons name="add-circle" size={32} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    paddingHorizontal: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: SIZES.font,
  },
  cartButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    padding: 15,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    right: 15,
    top: 5,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: SIZES.font,
  },
  medicineCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  medicineImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: COLORS.lightGray,
  },
  medicineInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  medicineGeneric: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 2,
  },
  medicineManufacturer: {
    fontSize: 11,
    color: COLORS.lightGray,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  medicinePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  addButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    padding: SIZES.padding,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 5,
    textAlign: 'center',
  },
});
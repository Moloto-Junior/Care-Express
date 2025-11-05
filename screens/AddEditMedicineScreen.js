import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { auth, db } from '../firebaseConfig';
import { ref, push, update } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { generateMedicinePrice } from '../utils/MedicineConfig';

export default function AddEditMedicineScreen({ navigation, route }) {
  const [search, setSearch] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(route?.params?.medicine || null);

  const fetchMedicines = async (query = 'paracetamol') => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${query}&limit=20`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch medicines from FDA API');
      }

      const data = await response.json();

      if (data.results) {
        const list = data.results.map((item, index) => {
          const name =
            item.openfda?.brand_name?.[0] ||
            item.openfda?.generic_name?.[0] ||
            'Unknown';
          return {
            id: `${name}_${item.openfda?.manufacturer_name?.[0] || 'Unknown'}_${index}`,
            name,
            genericName: item.openfda?.generic_name?.[0] || 'N/A',
            manufacturer: item.openfda?.manufacturer_name?.[0] || 'N/A',
            price: generateMedicinePrice(),
            description: item.purpose?.[0] || item.description?.[0] || 'No description',
            quantity: 1,
          };
        });
        setMedicines(list);
      } else {
        setMedicines([]);
        Alert.alert('No Results', 'No medicines found for this search.');
      }
    } catch (err) {
      console.log('Error fetching medicines:', err);
      Alert.alert('Error', 'Failed to fetch medicines. Please try again.');
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const addMedicine = async (med) => {
    try {
      const userId = auth.currentUser.uid;
      const medicineData = {
        ...med,
        addedAt: Date.now(),
      };

      if (editingMedicine && editingMedicine.firebaseKey) {
        // Update existing medicine
        await update(
          ref(db, `pharmacists/${userId}/medicines/${editingMedicine.firebaseKey}`),
          medicineData
        );
        Alert.alert('Success', `${med.name} updated successfully!`);
      } else {
        // Add new medicine
        await push(ref(db, `pharmacists/${userId}/medicines`), medicineData);
        Alert.alert('Success', `${med.name} added to your inventory!`);
      }

      navigation.goBack();
    } catch (error) {
      console.log('Error adding medicine:', error);
      Alert.alert('Error', 'Failed to add medicine. Please try again.');
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const renderMedicine = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => addMedicine(item)}
      activeOpacity={0.7}
    >
      {/* Icon instead of image */}
      <View style={styles.iconContainer}>
        <Ionicons name="medkit" size={32} color={COLORS.primary} />
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.details} numberOfLines={1}>
          {item.genericName} | {item.manufacturer}
        </Text>
        <Text style={styles.priceText}>Price: R{item.price}</Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => addMedicine(item)}>
        <Ionicons name="add-circle" size={28} color={COLORS.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.lightGray} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medicines..."
          placeholderTextColor={COLORS.lightGray}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => fetchMedicines(search)}
        />
        {search !== '' && (
          <TouchableOpacity
            onPress={() => {
              setSearch('');
              fetchMedicines();
            }}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.lightGray} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => fetchMedicines(search)}
        disabled={loading}
      >
        <Text style={styles.searchButtonText}>
          {loading ? 'Searching...' : 'Search'}
        </Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching medicines...</Text>
        </View>
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          renderItem={renderMedicine}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={60} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No medicines found</Text>
              <Text style={styles.emptySubText}>Try a different search term</Text>
            </View>
          }
          contentContainerStyle={medicines.length === 0 && { flexGrow: 1 }}
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
    marginBottom: 10,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.lightGray,
    marginTop: 10,
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  details: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 3,
  },
  priceText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  addBtn: {
    marginLeft: 10,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 6,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, set } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { getMedicineImage, generateMedicinePrice } from '../utils/MedicineConfig';

export default function SelectInitialMedicinesScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (med) => {
    if (selected.find((m) => m.id === med.id)) {
      setSelected((prev) => prev.filter((m) => m.id !== med.id));
    } else {
      if (selected.length < 10) {
        // Limit to 10 medicines
        setSelected((prev) => [...prev, med]);
      } else {
        Alert.alert('Limit Reached', 'You can select up to 10 medicines');
      }
    }
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      Alert.alert('Error', 'Select at least one medicine');
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const medicinesRef = ref(db, `pharmacists/${userId}/medicines`);
      const saveObj = {};

      selected.forEach((m) => {
        saveObj[m.id] = {
          ...m,
          addedAt: Date.now(),
          quantity: 10, // Default quantity
        };
      });

      await set(medicinesRef, saveObj);
      Alert.alert('Success', `${selected.length} medicines added!`, [
        {
          text: 'OK',
          onPress: () => navigation.replace('PharmacistTabs'),
        },
      ]);
    } catch (error) {
      console.log('Error saving medicines:', error);
      Alert.alert('Error', 'Failed to save medicines. Please try again.');
    }
  };

  const fetchMedicines = async (query = '') => {
    setLoading(true);
    try {
      const searchQuery = query || 'paracetamol';
      const response = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${searchQuery}&limit=30`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch medicines');
      }

      const data = await response.json();

      if (data.results) {
        const medicineList = data.results.map((item, index) => {
          const name =
            item.openfda?.brand_name?.[0] ||
            item.openfda?.generic_name?.[0] ||
            'Unknown Medicine';

          return {
            id: `${name}_${item.openfda?.manufacturer_name?.[0] || 'Unknown'}_${index}`,
            name,
            genericName: item.openfda?.generic_name?.[0] || 'N/A',
            manufacturer: item.openfda?.manufacturer_name?.[0] || 'N/A',
            price: generateMedicinePrice(),
            description:
              item.purpose?.[0] || item.description?.[0] || 'No description available',
            image: getMedicineImage(name),
          };
        });

        setMedicines(medicineList);
      } else {
        setMedicines([]);
        Alert.alert('No Results', 'No medicines found for this search.');
      }
    } catch (error) {
      console.log('Error fetching medicines:', error);
      Alert.alert('Error', 'Failed to fetch medicines. Please try again.');
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const renderMedicine = ({ item }) => {
    const isSelected = !!selected.find((m) => m.id === item.id);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && {
            backgroundColor: COLORS.primary,
            borderLeftColor: COLORS.success,
          },
        ]}
        onPress={() => toggleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              onError={(e) => {
                console.log('Image load error:', e.nativeEvent.error);
              }}
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="medkit" size={24} color={COLORS.lightGray} />
            </View>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={[styles.name, isSelected && { color: '#fff' }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.details,
              isSelected && { color: 'rgba(255, 255, 255, 0.8)' },
            ]}
            numberOfLines={1}
          >
            R{item.price} | Qty: 10
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={28} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Medicines</Text>
      <Text style={styles.subHeader}>({selected.length}/10 selected)</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.lightGray} />
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
            <Ionicons name="close" size={20} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => fetchMedicines(search)}
        disabled={loading}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
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
              <Ionicons name="search" size={50} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No medicines found</Text>
              <Text style={styles.emptySubText}>Try a different search term</Text>
            </View>
          }
          contentContainerStyle={medicines.length === 0 && styles.emptyListContent}
        />
      )}

      <TouchableOpacity
        style={[styles.saveButton, selected.length === 0 && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={selected.length === 0}
      >
        <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.saveText}>
          Save & Continue ({selected.length} selected)
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 5,
    color: COLORS.text,
  },
  subHeader: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: SIZES.radius,
    marginBottom: 10,
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
    marginHorizontal: 10,
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 5,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: SIZES.radius,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    width: 50,
    height: 50,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  details: {
    fontSize: 13,
    color: COLORS.lightGray,
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

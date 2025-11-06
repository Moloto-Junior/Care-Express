import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, set } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

const medicineImages = {
  'paracetamol': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
  'ibuprofen': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
  'amoxicillin': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop',
  'vitamin': 'https://images.unsplash.com/photo-1526424382096-74a93e105682?w=200&h=200&fit=crop',
  'aspirin': 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
  'default': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
};

const getMedicineImage = (name) => {
  const lowercaseName = name.toLowerCase();
  for (const key in medicineImages) {
    if (lowercaseName.includes(key)) return medicineImages[key];
  }
  return medicineImages.default;
};

export default function SelectInitialMedicinesScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (med) => {
    if (selected.find(m => m.id === med.id)) {
      setSelected(prev => prev.filter(m => m.id !== med.id));
    } else {
      setSelected(prev => [...prev, med]);
    }
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      Alert.alert('Select at least one medicine');
      return;
    }
    const userId = auth.currentUser.uid;
    const medicinesRef = ref(db, `pharmacists/${userId}/medicines`);
    const saveObj = {};
    selected.forEach(m => { saveObj[m.id] = m; });
    await set(medicinesRef, saveObj);
    navigation.replace('PharmacistTabs');
  };

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
      } else {
        setMedicines([]);
      }
    } catch (error) {
      console.log('Error fetching medicines:', error);
      Alert.alert('Error fetching medicines', 'Try again later');
      setMedicines([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Medicines</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.lightGray} style={{ marginRight: 10 }} />
        <TextInput
          placeholder="Search medicines..."
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, color: COLORS.text }}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => { setSearch(''); fetchMedicines(); }}>
            <Ionicons name="close-circle" size={20} color={COLORS.lightGray} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={styles.searchButton} onPress={() => fetchMedicines(search)}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Search</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 30 }} /> :
        <FlatList
          data={medicines}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isSelected = !!selected.find(m => m.id === item.id);
            return (
              <TouchableOpacity style={[styles.card, isSelected && { borderColor: COLORS.primary, borderWidth: 2 }]} onPress={() => toggleSelect(item)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={{ uri: item.image }} style={{ width: 50, height: 50, borderRadius: 6, marginRight: 10 }} />
                  <View>
                    <Text style={{ fontWeight: '600', color: COLORS.text }}>{item.name}</Text>
                    <Text style={{ color: COLORS.lightGray }}>R{item.price} | Qty: {item.quantity || 10}</Text>
                  </View>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
              </TouchableOpacity>
            );
          }}
        />
      }

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save & Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SIZES.padding, backgroundColor: COLORS.background },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 15, color: COLORS.text },
  searchContainer: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 10, borderRadius: SIZES.radius, marginBottom: 10, alignItems: 'center' },
  searchButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: SIZES.radius, alignItems: 'center', marginBottom: 10 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: 12, borderRadius: SIZES.radius, marginBottom: 10 },
  saveButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: SIZES.radius, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Image } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { auth, db } from '../firebaseConfig';
import { ref, push } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

const medicineImages = {
  paracetamol: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
  ibuprofen: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
  amoxicillin: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop',
  vitamin: 'https://images.unsplash.com/photo-1526424382096-74a93e105682?w=200&h=200&fit=crop',
  aspirin: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
  default: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
};

const getMedicineImage = (name) => {
  const lower = name.toLowerCase();
  for (const key in medicineImages) {
    if (lower.includes(key)) return medicineImages[key];
  }
  return medicineImages.default;
};

export default function AddEditMedicineScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMedicines = async (query = 'paracetamol') => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${query}&limit=20`
      );
      const data = await response.json();
      if (data.results) {
        const list = data.results.map((item, index) => {
          const name = item.openfda?.brand_name?.[0] || item.openfda?.generic_name?.[0] || 'Unknown';
          return {
            id: `${name}_${item.openfda?.manufacturer_name?.[0] || 'Unknown'}_${index}`, // UNIQUE KEY
            name,
            genericName: item.openfda?.generic_name?.[0] || 'N/A',
            manufacturer: item.openfda?.manufacturer_name?.[0] || 'N/A',
            price: Math.floor(Math.random() * (500 - 25 + 1)) + 25,
            description: item.purpose?.[0] || item.description?.[0] || 'No description',
            image: getMedicineImage(name),
          };
        });
        setMedicines(list);
      } else {
        setMedicines([]);
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error fetching medicines');
    }
    setLoading(false);
  };

  const addMedicine = (med) => {
    const userId = auth.currentUser.uid;
    push(ref(db, `pharmacists/${userId}/medicines`), {
      ...med,
      quantity: 1,
    });
    Alert.alert('Medicine Added', `${med.name} added to your inventory!`);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search medicine..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholderTextColor={COLORS.lightGray}
        />
        <TouchableOpacity onPress={() => fetchMedicines(search)}>
          <Ionicons name="search" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id} // UNIQUE key
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.details}>Price: R{item.price}</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => addMedicine(item)}>
                  <Text style={styles.addText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SIZES.padding, backgroundColor: COLORS.background },
  searchContainer: { flexDirection: 'row', marginBottom: 10, backgroundColor: COLORS.card, borderRadius: SIZES.radius, paddingHorizontal: 10, alignItems: 'center' },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: SIZES.font, color: COLORS.text },
  card: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 12, borderRadius: SIZES.radius, marginBottom: 12, alignItems: 'center' },
  image: { width: 60, height: 60, borderRadius: 10, backgroundColor: COLORS.lightGray },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  details: { fontSize: 13, color: COLORS.text, marginTop: 2 },
  addBtn: { marginTop: 6, backgroundColor: COLORS.primary, padding: 6, borderRadius: 6, width: 60, alignItems: 'center' },
  addText: { color: '#fff', fontWeight: 'bold' },
});

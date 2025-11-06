import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue, remove, update } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function ManageInventoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    const userId = auth.currentUser.uid;
    const medicinesRef = ref(db, `pharmacists/${userId}/medicines`);
    const unsubscribe = onValue(medicinesRef, snapshot => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([key, med]) => ({
        id: `${med.name}_${med.manufacturer}_${key}`, // UNIQUE key
        firebaseKey: key,
        ...med,
      }));
      setMedicines(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = (firebaseKey) => {
    Alert.alert(
      "Delete Medicine",
      "Are you sure you want to delete this medicine?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
            const userId = auth.currentUser.uid;
            await remove(ref(db, `pharmacists/${userId}/medicines/${firebaseKey}`));
          } 
        }
      ]
    );
  };

  const decreaseQuantity = (item) => {
    if (item.quantity > 0) {
      const userId = auth.currentUser.uid;
      update(ref(db, `pharmacists/${userId}/medicines/${item.firebaseKey}`), {
        quantity: item.quantity - 1
      });
    } else {
      Alert.alert("Quantity is already zero");
    }
  };

  const increaseQuantity = (item) => {
    const userId = auth.currentUser.uid;
    update(ref(db, `pharmacists/${userId}/medicines/${item.firebaseKey}`), {
      quantity: item.quantity + 1
    });
  };

  const renderMedicine = ({ item }) => (
    <View style={[styles.card, item.quantity <= 5 && { borderLeftColor: COLORS.warning }]}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.details}>Qty: {item.quantity} | Price: R{item.price}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('AddEditMedicine', { medicine: item })}>
          <Ionicons name="create-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => decreaseQuantity(item)} style={{ marginLeft: 15 }}>
          <Ionicons name="remove-circle-outline" size={24} color={COLORS.warning} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => increaseQuantity(item)} style={{ marginLeft: 15 }}>
          <Ionicons name="add-circle-outline" size={24} color={COLORS.success} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.firebaseKey)} style={{ marginLeft: 15 }}>
          <Ionicons name="trash-outline" size={24} color={COLORS.warning} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id} // UNIQUE
        renderItem={renderMedicine}
        contentContainerStyle={{ padding: SIZES.padding }}
      />
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => navigation.navigate('AddEditMedicine')}
      >
        <Ionicons name="add-circle" size={50} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 15, borderRadius: SIZES.radius, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: COLORS.primary, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  image: { width: 50, height: 50, borderRadius: 8, backgroundColor: COLORS.lightGray },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  details: { fontSize: 14, color: COLORS.lightGray, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  addButton: { position: 'absolute', bottom: 20, right: 20 },
});

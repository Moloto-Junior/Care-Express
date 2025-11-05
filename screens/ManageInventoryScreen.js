import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue, remove, update } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function ManageInventoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [filterType, setFilterType] = useState('all'); // all, low, out

  useEffect(() => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    const userId = auth.currentUser.uid;
    const medicinesRef = ref(db, `pharmacists/${userId}/medicines`);

    const unsubscribe = onValue(
      medicinesRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.entries(data).map(([key, med]) => ({
          id: `${med.name}_${med.manufacturer}_${key}`,
          firebaseKey: key,
          ...med,
        }));

        setMedicines(list);
        setLoading(false);
      },
      (error) => {
        console.log('Error fetching medicines:', error);
        Alert.alert('Error', 'Failed to load medicines');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = (firebaseKey, medicineName) => {
    Alert.alert(
      'Delete Medicine',
      `Are you sure you want to delete ${medicineName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = auth.currentUser.uid;
              await remove(ref(db, `pharmacists/${userId}/medicines/${firebaseKey}`));
              Alert.alert('Success', 'Medicine deleted successfully');
            } catch (error) {
              console.log('Error deleting medicine:', error);
              Alert.alert('Error', 'Failed to delete medicine');
            }
          },
        },
      ]
    );
  };

  const decreaseQuantity = (item) => {
    if (item.quantity > 0) {
      const userId = auth.currentUser.uid;
      update(ref(db, `pharmacists/${userId}/medicines/${item.firebaseKey}`), {
        quantity: item.quantity - 1,
      });
    } else {
      Alert.alert('Info', 'Quantity is already zero');
    }
  };

  const increaseQuantity = (item) => {
    const userId = auth.currentUser.uid;
    update(ref(db, `pharmacists/${userId}/medicines/${item.firebaseKey}`), {
      quantity: item.quantity + 1,
    });
  };

  const getFilteredMedicines = () => {
    if (filterType === 'low') {
      return medicines.filter((m) => m.quantity <= 5 && m.quantity > 0);
    } else if (filterType === 'out') {
      return medicines.filter((m) => m.quantity === 0);
    }
    return medicines;
  };

  const renderMedicine = ({ item }) => {
    const isLowStock = item.quantity <= 5 && item.quantity > 0;
    const isOutOfStock = item.quantity === 0;

    return (
      <View style={styles.card}>
        {/* Icon instead of image */}
        <View
          style={[
            styles.iconContainer,
            isOutOfStock && styles.iconContainerOutOfStock,
            isLowStock && styles.iconContainerLowStock,
          ]}
        >
          <Ionicons
            name="medkit"
            size={28}
            color={isOutOfStock ? COLORS.error : isLowStock ? '#FFA500' : COLORS.primary}
          />
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.manufacturer} numberOfLines={1}>
            {item.manufacturer || 'N/A'}
          </Text>
          <View style={styles.detailsRow}>
            <Text style={styles.details}>
              Qty: {item.quantity} | R{item.price || 0}
            </Text>
            {isLowStock && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockText}>Low Stock</Text>
              </View>
            )}
            {isOutOfStock && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => decreaseQuantity(item)}
            style={styles.actionButton}
            disabled={item.quantity === 0}
          >
            <Ionicons
              name="remove-circle"
              size={28}
              color={item.quantity === 0 ? COLORS.lightGray : COLORS.error}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => increaseQuantity(item)} style={styles.actionButton}>
            <Ionicons name="add-circle" size={28} color={COLORS.success} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDelete(item.firebaseKey, item.name)}
            style={styles.actionButton}
          >
            <Ionicons name="trash" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredMedicines = getFilteredMedicines();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            All ({medicines.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filterType === 'low' && styles.filterButtonActive]}
          onPress={() => setFilterType('low')}
        >
          <Text style={[styles.filterText, filterType === 'low' && styles.filterTextActive]}>
            Low Stock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filterType === 'out' && styles.filterButtonActive]}
          onPress={() => setFilterType('out')}
        >
          <Text style={[styles.filterText, filterType === 'out' && styles.filterTextActive]}>
            Out of Stock
          </Text>
        </TouchableOpacity>
      </View>

      {/* Medicines List */}
      {filteredMedicines.length > 0 ? (
        <FlatList
          data={filteredMedicines}
          keyExtractor={(item) => item.id}
          renderItem={renderMedicine}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={60} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No medicines found</Text>
          <Text style={styles.emptySubText}>
            {filterType === 'all'
              ? 'Start by adding medicines'
              : `No ${filterType === 'low' ? 'low stock' : 'out of stock'} medicines`}
          </Text>
        </View>
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddEditMedicine')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
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
  },
  loadingText: {
    color: COLORS.lightGray,
    marginTop: 10,
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterTextActive: {
    color: '#fff',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: SIZES.radius,
    marginHorizontal: SIZES.padding,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  iconContainerLowStock: {
    backgroundColor: '#FFA50020',
    borderColor: '#FFA50040',
  },
  iconContainerOutOfStock: {
    backgroundColor: COLORS.error + '20',
    borderColor: COLORS.error + '40',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  manufacturer: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  details: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  lowStockBadge: {
    marginLeft: 8,
    backgroundColor: '#FFA500',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  lowStockText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  outOfStockBadge: {
    marginLeft: 8,
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  outOfStockText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 8,
    gap: 4,
  },
  actionButton: {
    padding: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 6,
  },
});

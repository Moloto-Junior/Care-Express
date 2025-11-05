import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function PharmacistDashboard({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [unreadClients, setUnreadClients] = useState(0);
  const [unreadDoctors, setUnreadDoctors] = useState(0);
  const [pharmacistName, setPharmacistName] = useState('Pharmacist');

  // Load Pharmacist Info
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const userId = auth.currentUser.uid;
    const userRef = ref(db, `users/${userId}`);
    
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setPharmacistName(snapshot.val().name || 'Pharmacist');
      }
    });
  }, []);

  // Load Medicines
  useEffect(() => {
    const medicinesRef = ref(db, 'medicines');
    const unsubscribeMedicines = onValue(
      medicinesRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setTotalMedicines(Object.keys(data).length);

        // Calculate total revenue (quantity * price)
        const revenue = Object.entries(data).reduce((total, [_, med]) => {
          return total + ((med.quantity || 0) * (med.price || 0));
        }, 0);
        setTotalRevenue(revenue);

        // Find low stock items
        const lowStock = Object.entries(data)
          .filter(([id, med]) => med.quantity <= 5)
          .map(([id, med]) => ({ id, ...med }))
          .sort((a, b) => a.quantity - b.quantity); // Sort by quantity ascending
        
        setLowStockMedicines(lowStock);
        setLoading(false);
      },
      (error) => {
        console.log('Error loading medicines:', error);
        setLoading(false);
      }
    );

    return () => unsubscribeMedicines();
  }, []);

  // Load Unread Messages
  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const usersRef = ref(db, 'users');

    const unsubscribeUsers = onValue(
      usersRef,
      async (snapshot) => {
        const data = snapshot.val() || {};

        const clients = Object.keys(data).filter(
          (uid) => uid !== userId && data[uid].role === 'Patient'
        );
        const doctors = Object.keys(data).filter(
          (uid) => uid !== userId && data[uid].role === 'Doctor'
        );

        const countUnread = async (uids) => {
          let count = 0;
          for (const uid of uids) {
            try {
              const chatId = [userId, uid].sort().join('_');
              const messagesRef = ref(db, `chats/${chatId}/messages`);
              const snapshot = await get(messagesRef);
              if (snapshot.exists()) {
                const msgs = snapshot.val();
                count += Object.values(msgs).filter(
                  (m) => !m.read && m.senderId !== userId
                ).length;
              }
            } catch (error) {
              console.log('Error counting unread:', error);
            }
          }
          return count;
        };

        setUnreadClients(await countUnread(clients));
        setUnreadDoctors(await countUnread(doctors));
      },
      (error) => {
        console.log('Error loading messages:', error);
      }
    );

    return () => unsubscribeUsers();
  }, []);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    // Data will refresh automatically via onValue listeners
    setTimeout(() => setRefreshing(false), 1000);
  };

  const quickActions = [
    {
      name: 'Manage Inventory',
      icon: 'cube',
      screen: 'Inventory',
      color: COLORS.primary,
    },
    {
      name: 'Chat with Patients',
      icon: 'chatbubbles',
      screen: 'Chat',
      color: COLORS.info,
      badge: unreadClients,
    },
    {
      name: 'Add Medicine',
      icon: 'add-circle',
      screen: 'AddEditMedicine',
      color: COLORS.success,
    },
  ];

  const renderQuickAction = (item) => (
    <TouchableOpacity
      // use screen as primary key (fallback to name) to avoid duplicate name collisions
      key={item.screen || item.name}
      style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.color }]}
      onPress={() => navigation.navigate(item.screen)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={item.icon}
        size={36}
        color={item.color}
        style={styles.cardIcon}
      />
      <Text style={styles.cardText}>{item.name}</Text>
      {item.badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.badge > 99 ? '99+' : item.badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderLowStockMedicine = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.listCard,
        {
          borderLeftWidth: 3,
          borderLeftColor:
            item.quantity === 0 ? COLORS.error : COLORS.warning,
        },
      ]}
      onPress={() => navigation.navigate('Inventory')}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.listText} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.listSubText}>
          Quantity: {item.quantity} | Price: R{item.price || 0}
        </Text>
      </View>
      <Ionicons
        name={item.quantity === 0 ? 'alert' : 'alert-circle'}
        size={24}
        color={item.quantity === 0 ? COLORS.error : COLORS.warning}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.welcomeContainer}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.headerName}>{pharmacistName}</Text>
        </View>
        <Ionicons name="notifications" size={28} color={COLORS.primary} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="cube" size={28} color={COLORS.primary} />
          <Text style={styles.statNumber}>{totalMedicines}</Text>
          <Text style={styles.statLabel}>Total Medicines</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: COLORS.warning + '20' },
          ]}
        >
          <Ionicons
            name="alert-circle"
            size={28}
            color={COLORS.warning}
          />
          <Text style={styles.statNumber}>{lowStockMedicines.length}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: COLORS.success + '20' },
          ]}
        >
          <Ionicons name="cash" size={28} color={COLORS.success} />
          <Text style={styles.statNumber}>R{totalRevenue}</Text>
          <Text style={styles.statLabel}>Inventory Value</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {quickActions.map(renderQuickAction)}
      </View>

      {/* Low Stock Medicines */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Low Stock Alert</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Inventory')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>
        {lowStockMedicines.length > 0 ? (
          <FlatList
            data={lowStockMedicines.slice(0, 5)} // Show only top 5
            renderItem={renderLowStockMedicine}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListFooterComponent={
              lowStockMedicines.length > 5 ? (
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={() => navigation.navigate('Inventory')}
                >
                  <Text style={styles.viewMoreText}>
                    View {lowStockMedicines.length - 5} more items
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons
              name="checkmark-circle"
              size={48}
              color={COLORS.success}
            />
            <Text style={styles.emptyText}>All medicines well stocked!</Text>
          </View>
        )}
      </View>

      {/* Daily Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips</Text>
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={36} color={COLORS.primary} />
          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={styles.tipTitle}>Stock Management</Text>
            <Text style={styles.tipText}>
              Regularly check expiry dates and rotate stock.
            </Text>
          </View>
        </View>
        <View style={[styles.tipCard, { marginTop: 10 }]}>
          <Ionicons name="bulb" size={36} color={COLORS.warning} />
          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={styles.tipTitle}>Customer Service</Text>
            <Text style={styles.tipText}>
              Respond to patient inquiries promptly.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.lightGray,
    marginTop: 10,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SIZES.padding,
    paddingBottom: 30,
  },
  welcomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.lightGray,
  },
  headerName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  viewAllText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardIcon: {
    marginRight: 15,
  },
  cardText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  listCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: SIZES.radius,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  listText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  listSubText: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 3,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: COLORS.lightGray,
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  viewMoreButton: {
    padding: 12,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.primary + '20',
    marginTop: 10,
    alignItems: 'center',
  },
  viewMoreText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: SIZES.radius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  tipText: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 3,
    lineHeight: 18,
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { ref, onValue, get } from 'firebase/database';
import { useTheme } from '../ThemeContext';
import { getTranslation } from '../translations';

export default function PharmacistDashboard({ navigation }) {
  const { theme, language } = useTheme();
  const [loading, setLoading] = useState(true);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [unreadClients, setUnreadClients] = useState(0);
  const [unreadDoctors, setUnreadDoctors] = useState(0);

  // Load pharmacist's medicines
  useEffect(() => {
    const userId = auth.currentUser.uid;
    const medicinesRef = ref(db, `pharmacists/${userId}/medicines`);

    const unsubscribe = onValue(medicinesRef, snapshot => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, med]) => ({ id, ...med }));

      setTotalMedicines(list.length);

      const lowStock = list.filter(med => med.quantity < 5);
      setLowStockMedicines(lowStock);

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load unread messages
  useEffect(() => {
    const userId = auth.currentUser.uid;
    const usersRef = ref(db, 'users');

    const unsubscribeUsers = onValue(usersRef, async snapshot => {
      const data = snapshot.val() || {};
      const clients = Object.keys(data).filter(uid => uid !== userId && data[uid].role === 'Patient');
      const doctors = Object.keys(data).filter(uid => uid !== userId && data[uid].role === 'Doctor');

      const countUnread = async (uids) => {
        let count = 0;
        for (const uid of uids) {
          const chatId = [userId, uid].sort().join('_');
          const messagesRef = ref(db, `chats/${chatId}/messages`);
          const snapshot = await get(messagesRef);
          if (snapshot.exists()) {
            const msgs = snapshot.val();
            count += Object.values(msgs).filter(m => !m.read && m.senderId !== userId).length;
          }
        }
        return count;
      };

      setUnreadClients(await countUnread(clients));
      setUnreadDoctors(await countUnread(doctors));
    });

    return () => unsubscribeUsers();
  }, []);

  const quickActions = [
    { name: getTranslation(language, 'manageInventory'), icon: 'cube', screen: 'ManageInventory', color: theme.primary, badge: 0 },
    { name: getTranslation(language, 'chatWithClients'), icon: 'chatbubbles', screen: 'ClientChat', color: theme.secondary, badge: unreadClients },
    { name: getTranslation(language, 'chatWithDoctors'), icon: 'people', screen: 'DoctorChat', color: theme.success, badge: unreadDoctors },
  ];

  const renderQuickAction = (item) => (
    <TouchableOpacity
      key={item.name}
      style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.color, backgroundColor: theme.card }]}
      onPress={() => navigation.navigate(item.screen)}
    >
      <Ionicons name={item.icon} size={36} color={item.color} style={styles.cardIcon} />
      <Text style={[styles.cardText, { color: theme.text }]}>{item.name}</Text>
      {item.badge > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.error }]}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderLowStockMedicine = ({ item }) => (
    <TouchableOpacity 
      style={[styles.listCard, { backgroundColor: theme.card }]} 
      onPress={() => navigation.navigate('ManageInventory')}
    >
      <Text style={[styles.listText, { color: theme.text }]}>{item.name} ({getTranslation(language, 'quantity')}: {item.quantity})</Text>
      <Ionicons name="alert-circle" size={20} color={theme.warning} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={{ padding: 20, paddingBottom: 30 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text, marginBottom: 20 }}>
        {getTranslation(language, 'dashboard')}
      </Text>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statNumber, { color: theme.text }]}>{totalMedicines}</Text>
          <Text style={[styles.statLabel, { color: theme.lightGray }]}>{getTranslation(language, 'totalMedicines')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.warning + '20' }]}>
          <Text style={[styles.statNumber, { color: theme.text }]}>{lowStockMedicines.length}</Text>
          <Text style={[styles.statLabel, { color: theme.lightGray }]}>{getTranslation(language, 'lowStock')}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{getTranslation(language, 'quickActions')}</Text>
        {quickActions.map(renderQuickAction)}
      </View>

      {/* Low Stock Medicines */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{getTranslation(language, 'lowStockMedicines')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ManageInventory')}>
            <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>{getTranslation(language, 'viewAll')} →</Text>
          </TouchableOpacity>
        </View>
        {lowStockMedicines.length > 0 ? (
          <FlatList 
            data={lowStockMedicines} 
            renderItem={renderLowStockMedicine} 
            keyExtractor={item => item.id} 
            scrollEnabled={false}
          />
        ) : (
          <Text style={{ color: theme.lightGray, textAlign: 'center', marginTop: 10 }}>{getTranslation(language, 'noLowStock')}</Text>
        )}
      </View>

      {/* Daily Tip */}
      <View style={[styles.section, { marginBottom: 15 }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{getTranslation(language, 'dailyTip')}</Text>
        <View style={[styles.tipCard, { backgroundColor: theme.card }]}>
          <Ionicons name="information-circle" size={36} color={theme.primary} />
          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={[styles.tipTitle, { color: theme.text }]}>{getTranslation(language, 'checkExpiryDates')}</Text>
            <Text style={[styles.tipText, { color: theme.lightGray }]}>{getTranslation(language, 'expiryTip')}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = {
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { flex: 1, padding: 20, borderRadius: 12, marginRight: 10, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  statNumber: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 14, marginTop: 5 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 20, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  card: { borderRadius: 12, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  cardIcon: { marginRight: 15 },
  cardText: { fontSize: 16, fontWeight: '600' },
  badge: { position: 'absolute', right: 15, top: 10, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  listCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  listText: { fontSize: 14 },
  tipCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tipTitle: { fontSize: 16, fontWeight: '600' },
  tipText: { fontSize: 14, marginTop: 2 },
};

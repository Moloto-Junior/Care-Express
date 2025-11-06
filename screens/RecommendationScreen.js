import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue, update } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function RecommendationScreen({ navigation }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = () => {
    const userId = auth.currentUser.uid;
    const recRef = ref(db, `recommendations/${userId}`);
    
    const unsubscribe = onValue(recRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data)
          .map(id => ({ id, ...data[id] }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setRecommendations(list);
      } else {
        setRecommendations([]);
      }
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = fetchRecommendations();
    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  const markAsRead = async (id) => {
    try {
      const userId = auth.currentUser.uid;
      await update(ref(db, `recommendations/${userId}/${id}`), { read: true });
    } catch (error) {
      console.log('Mark as read error:', error);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getUnreadCount = () => {
    return recommendations.filter(rec => !rec.read).length;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (recommendations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="medical-outline" size={80} color={COLORS.lightGray} />
        <Text style={styles.emptyText}>No Recommendations Yet</Text>
        <Text style={styles.emptySubText}>Your doctor's health recommendations will appear here</Text>
        <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate('BookAppointment')}>
          <Ionicons name="calendar" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{recommendations.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: COLORS.secondary }]}>{getUnreadCount()}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: COLORS.success }]}>{recommendations.length - getUnreadCount()}</Text>
          <Text style={styles.statLabel}>Read</Text>
        </View>
      </View>

      <FlatList
        data={recommendations}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.recCard, !item.read && styles.unreadCard]}
            onPress={() => markAsRead(item.id)}
            activeOpacity={0.7}
          >
            {!item.read && <View style={styles.unreadDot} />}

            <View style={styles.recHeader}>
              <View style={styles.doctorAvatar}>
                <Ionicons name="medical" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.doctorDetails}>
                <Text style={styles.doctorName}>Dr. {item.doctorName || 'Doctor'}</Text>
                <Text style={styles.recDate}>{formatDate(item.timestamp)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
            </View>
            
            <View style={styles.recContent}>
              <Text style={styles.recText} numberOfLines={4}>
                {item.recommendation}
              </Text>
            </View>

            <View style={styles.recFooter}>
              {item.read ? (
                <>
                  <Ionicons name="checkmark-done" size={16} color={COLORS.success} />
                  <Text style={styles.recFooterText}>Read</Text>
                </>
              ) : (
                <>
                  <Ionicons name="mail-unread" size={16} color={COLORS.secondary} />
                  <Text style={[styles.recFooterText, { color: COLORS.secondary }]}>New</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
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
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 30,
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    margin: SIZES.padding,
    padding: 20,
    borderRadius: SIZES.radius,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
  },
  recCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding,
    marginBottom: 12,
    borderRadius: SIZES.radius,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    position: 'relative',
  },
  unreadCard: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: COLORS.secondary,
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.secondary,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  recDate: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 2,
  },
  recContent: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  recText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  recFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recFooterText: {
    fontSize: 12,
    color: COLORS.success,
    marginLeft: 5,
    fontWeight: '600',
  },
});
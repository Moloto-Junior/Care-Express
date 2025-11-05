import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function ClientChatScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const usersRef = ref(db, 'users');

    // Get all patients
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const patientsList = Object.entries(data)
        .filter(([uid, user]) => user.role === 'Patient' && uid !== userId)
        .map(([uid, user]) => ({
          id: uid,
          name: user.name || 'Unknown',
          email: user.email || '',
          role: user.role,
          lastMessage: 'No messages yet',
          timestamp: Date.now(),
        }));

      setChats(patientsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderChat = ({ item }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() =>
        navigation.navigate('IndividualChat', {
          recipientId: item.id,
          recipientName: item.name,
        })
      }
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={28} color={COLORS.primary} />
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>

      <View style={styles.rightSection}>
        <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {chats.length > 0 ? (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChat}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No Chats Yet</Text>
          <Text style={styles.emptySubText}>
            Patients you communicate with will appear here
          </Text>
        </View>
      )}
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
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    marginHorizontal: SIZES.padding,
    marginVertical: 6,
    borderRadius: SIZES.radius,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  lastMessage: {
    fontSize: 13,
    color: COLORS.lightGray,
    marginTop: 4,
  },
  rightSection: {
    marginLeft: 10,
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

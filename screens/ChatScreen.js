import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { ref, onValue, get, update } from 'firebase/database';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const createChatId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
  };

  useEffect(() => {
    const userId = auth.currentUser.uid;
    const userRef = ref(db, `users/${userId}`);

    get(userRef).then(snapshot => {
      if (snapshot.exists()) {
        const role = snapshot.val().role;
        setUserRole(role);

        const usersRef = ref(db, 'users');
        onValue(usersRef, async (snapshot) => {
          const data = snapshot.val();
          if (data) {
            let chatList = [];

            if (role === 'Doctor') {
              chatList = Object.keys(data)
                .filter(uid => uid !== userId && data[uid].role === 'Patient')
                .map(uid => ({
                  id: uid,
                  name: data[uid].name,
                  email: data[uid].email,
                  profilePicture: data[uid].profilePicture,
                  role: data[uid].role,
                }));
            } else {
              chatList = Object.keys(data)
                .filter(uid => uid !== userId && data[uid].role === 'Doctor')
                .map(uid => ({
                  id: uid,
                  name: data[uid].name,
                  email: data[uid].email,
                  profilePicture: data[uid].profilePicture,
                  role: data[uid].role,
                }));
            }

            const chatsWithMessages = await Promise.all(
              chatList.map(async (chat) => {
                const chatId = createChatId(userId, chat.id);
                const messagesRef = ref(db, `chats/${chatId}/messages`);
                
                let lastMessage = 'No messages yet';
                let timestamp = 0;
                let unreadCount = 0;

                try {
                  const snapshot = await get(messagesRef);
                  if (snapshot.exists()) {
                    const msgs = snapshot.val();
                    const messages = Object.keys(msgs)
                      .map(key => ({ ...msgs[key], id: key }))
                      .sort((a, b) => b.timestamp - a.timestamp);
                    
                    if (messages.length > 0) {
                      lastMessage = messages[0].text;
                      timestamp = messages[0].timestamp;
                      unreadCount = messages.filter(m => !m.read && m.senderId !== userId).length;
                    }
                  }
                } catch (error) {
                  console.log('Error fetching messages:', error);
                }

                return { ...chat, lastMessage, timestamp, unreadCount };
              })
            );

            chatsWithMessages.sort((a, b) => b.timestamp - a.timestamp);
            setChats(chatsWithMessages);

            const totalUnread = chatsWithMessages.reduce((sum, chat) => sum + chat.unreadCount, 0);
            setTotalUnreadCount(totalUnread);
          } else {
            setChats([]);
            setTotalUnreadCount(0);
          }
          setLoading(false);
        });
      }
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={80} color={COLORS.lightGray} />
        <Text style={styles.emptyText}>No chats yet</Text>
        <Text style={styles.emptySubText}>
          {userRole === 'Doctor' 
            ? 'Your patients will appear here' 
            : 'Book an appointment to chat with doctors'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.chatIconContainer}>
            <Ionicons name="chatbubbles" size={24} color={COLORS.primary} />
            {totalUnreadCount > 0 && (
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>{totalUnreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        {totalUnreadCount > 0 && (
          <Text style={styles.unreadSummary}>{totalUnreadCount} unread</Text>
        )}
      </View>

      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chatItem, item.unreadCount > 0 && styles.unreadChatItem]}
            onPress={() => {
              const chatId = createChatId(auth.currentUser.uid, item.id);
              navigation.navigate('IndividualChat', { 
                chatId, 
                recipientId: item.id, 
                recipientName: item.name 
              });
            }}
          >
            <View style={styles.avatarContainer}>
              {item.profilePicture ? (
                <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons 
                    name={item.role === 'Doctor' ? 'medical' : 'person'} 
                    size={30} 
                    color={COLORS.primary} 
                  />
                </View>
              )}
              <View style={[styles.statusDot, { backgroundColor: item.unreadCount > 0 ? 'red' : COLORS.success }]} />
            </View>
            
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={[styles.chatName, item.unreadCount > 0 && styles.unreadChatName]}>
                  {item.role === 'Doctor' ? 'Dr. ' : ''}{item.name}
                </Text>
                <View style={styles.timeAndBadge}>
                  <Text style={styles.chatTime}>
                    {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadLastMessage]} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
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
    backgroundColor: COLORS.background 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  emptyText: { 
    color: COLORS.text, 
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubText: {
    color: COLORS.lightGray,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  totalBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  totalBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  unreadSummary: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
    alignItems: 'center',
  },
  unreadChatItem: {
    backgroundColor: COLORS.primary + '05',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.text,
  },
  unreadChatName: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  timeAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.lightGray,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lastMessage: { 
    fontSize: 14, 
    color: COLORS.lightGray,
  },
  unreadLastMessage: {
    color: COLORS.text,
    fontWeight: '500',
  },
});

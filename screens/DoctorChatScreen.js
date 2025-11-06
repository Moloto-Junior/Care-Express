import React, { useEffect, useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, push, onValue, update, remove } from 'firebase/database';

export default function DoctorChatScreen({ route }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const { recipientId, recipientName } = route.params;
  const userId = auth.currentUser.uid;

  // Generate consistent chatId
  const chatId = [userId, recipientId].sort().join('_');
  const chatRef = ref(db, `chats/${chatId}/messages`);

  // Listen for messages and mark as read
  useEffect(() => {
    const unsubscribe = onValue(chatRef, snapshot => {
      const data = snapshot.val() || {};
      const msgs = Object.keys(data).map(id => ({ id, ...data[id] }));

      setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));

      // Mark all unread messages sent by the other user as read
      Object.keys(data).forEach(msgId => {
        const msg = data[msgId];
        if (!msg.readBy?.[userId] && msg.senderId !== userId) {
          const updates = {};
          updates[`chats/${chatId}/messages/${msgId}/readBy/${userId}`] = true;
          update(ref(db), updates);
        }
      });
    });

    return () => unsubscribe();
  }, []);

  // Send message
  const sendMessage = async () => {
    if (text.trim() === '') return;

    const newMsg = {
      senderId: userId,
      text,
      timestamp: Date.now(),
      readBy: { [userId]: true } // sender has read their own message
    };

    await push(chatRef, newMsg);
    setText('');
  };

  // Clear chat
  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      `Are you sure you want to clear the chat with ${recipientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive', 
          onPress: async () => {
            await remove(chatRef);
          } 
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:COLORS.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        style={{ padding:SIZES.padding }}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: item.senderId === userId ? COLORS.primary : COLORS.card,
            alignSelf: item.senderId === userId ? 'flex-end' : 'flex-start',
            padding:10,
            borderRadius:10,
            marginBottom:5
          }}>
            <Text style={{ color: item.senderId === userId ? 'white' : COLORS.text }}>{item.text}</Text>
          </View>
        )}
      />

      <View style={{ flexDirection:'row', padding:SIZES.padding }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message"
          style={{ flex:1, borderWidth:1, borderColor:COLORS.lightGray, borderRadius:12, padding:10, marginRight:10 }}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={{ backgroundColor: COLORS.secondary, padding:12, borderRadius:12, marginRight: 8 }}
        >
          <Text style={{ color:'white', fontWeight:'bold' }}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={clearChat}
          style={{ backgroundColor: COLORS.red, padding:12, borderRadius:12 }}
        >
          <Text style={{ color:'white', fontWeight:'bold' }}>Clear</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

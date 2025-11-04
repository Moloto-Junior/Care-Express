import React, { useEffect, useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, push, onValue, remove } from 'firebase/database';

export default function PatientChatScreen({ route, navigation }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const recipientId = route?.params?.recipientId;
  const recipientName = route?.params?.recipientName;

  if (!recipientId) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:COLORS.background }}>
        <Text>No chat selected</Text>
      </View>
    );
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={clearChat}
          style={{ marginRight: 15 }}
        >
          <Text style={{ color: COLORS.secondary, fontWeight: 'bold' }}>Clear Chat</Text>
        </TouchableOpacity>
      ),
      title: recipientName,
    });

    const chatRef = ref(db, `chats/${auth.currentUser.uid}/${recipientId}`);
    const unsubscribe = onValue(chatRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.keys(data).map(id => ({ id, ...data[id] }));
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, [recipientId]);

  const sendMessage = async () => {
    if (text.trim() === '') return;
    const chatRef = ref(db, `chats/${auth.currentUser.uid}/${recipientId}`);
    const messageData = {
      senderId: auth.currentUser.uid,
      text,
      timestamp: Date.now(),
      read: false
    };
    await push(chatRef, messageData);
    await push(ref(db, `chats/${recipientId}/${auth.currentUser.uid}`), messageData);
    setText('');
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to delete all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: async () => {
            await remove(ref(db, `chats/${auth.currentUser.uid}/${recipientId}`));
            await remove(ref(db, `chats/${recipientId}/${auth.currentUser.uid}`));
            setMessages([]);
          }
        }
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
            backgroundColor: item.senderId === auth.currentUser.uid ? COLORS.primary : COLORS.card,
            alignSelf: item.senderId === auth.currentUser.uid ? 'flex-end' : 'flex-start',
            padding:10,
            borderRadius:10,
            marginBottom:5
          }}>
            <Text style={{ color: item.senderId === auth.currentUser.uid ? 'white' : COLORS.text }}>{item.text}</Text>
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
          style={{ backgroundColor: COLORS.secondary, padding:12, borderRadius:12 }}
        >
          <Text style={{ color:'white', fontWeight:'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

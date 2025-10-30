import React, { useEffect, useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, push, onValue } from 'firebase/database';

export default function PatientChatScreen({ route }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const { recipientId, recipientName } = route.params;

  useEffect(() => {
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
  }, []);

  const sendMessage = async () => {
    if (text.trim() === '') return;
    const chatRef = ref(db, `chats/${auth.currentUser.uid}/${recipientId}`);
    await push(chatRef, {
      senderId: auth.currentUser.uid,
      text,
      timestamp: Date.now()
    });
    await push(ref(db, `chats/${recipientId}/${auth.currentUser.uid}`), {
      senderId: auth.currentUser.uid,
      text,
      timestamp: Date.now()
    });
    setText('');
  };

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:COLORS.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        style={{ padding:SIZES.padding }}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: item.senderId === auth.currentUser.uid ? COLORS.secondary : COLORS.card,
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
          style={{ backgroundColor: COLORS.primary, padding:12, borderRadius:12 }}
        >
          <Text style={{ color:'white', fontWeight:'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// src/screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { ref, get } from 'firebase/database';
import { COLORS } from '../Theme';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkUser = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const snapshot = await get(ref(db, `users/${user.uid}`));
          if (snapshot.exists()) {
            const role = snapshot.val().role;
            navigation.replace(role.toLowerCase() === 'doctor' ? 'DoctorTabs' : 'PatientTabs');
            return;
          }
        } catch (error) {
          console.log('Error checking user role:', error);
        }
      }
      setTimeout(() => navigation.replace('Login'), 2000);
    };
    checkUser();
  }, []);

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: COLORS.background }}>
      <Image source={require('../assets/logo.png')} style={{ width:150, height:150, marginBottom:20 }} />
      <Text style={{ fontSize:26, fontWeight:'bold', color:COLORS.primary }}>
        Care<Text style={{ color:COLORS.secondary }}> Express</Text>
      </Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop:20 }} />
    </View>
  );
}

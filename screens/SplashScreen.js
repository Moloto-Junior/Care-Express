import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, Easing } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { ref, get } from 'firebase/database';
import { COLORS } from '../Theme';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen({ navigation }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      delay: 300,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

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

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
          marginBottom: 20,
        }}
      >
        <View
          style={{
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: COLORS.card,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          <Ionicons name="medical" size={80} color={COLORS.primary} />
        </View>
      </Animated.View>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: COLORS.primary }}>
          Care<Text style={{ color: COLORS.secondary }}> Express</Text>
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.lightGray, textAlign: 'center', marginTop: 8 }}>
          Your Health, Our Priority
        </Text>
      </Animated.View>
      <Animated.View style={{ marginTop: 20, transform: [{ rotate: spin }] }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </Animated.View>
    </View>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Animated, Easing } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { get, ref } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { saveToStorage, STORAGE_KEYS } from '../offlineStorage';
import { COLORS, SIZES } from '../Theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(50)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(logoRotate, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();

    Animated.parallel([
      Animated.timing(formSlide, { toValue: 0, duration: 600, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(formOpacity, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const rotate = logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const snapshot = await get(ref(db, `users/${user.uid}`));

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const role = userData.role?.toLowerCase();

        await saveToStorage(STORAGE_KEYS.USER_DATA, userData);

        switch(role) {
          case 'doctor':
            navigation.replace('DoctorTabs');
            break;
          case 'patient':
            navigation.replace('PatientTabs');
            break;
          case 'pharmacist':
            navigation.replace('PharmacistTabs');
            break;
          default:
            Alert.alert('Error', 'Unknown user role');
        }
      } else {
        Alert.alert('Error', 'User data not found');
      }
    } catch (error) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Animated.View style={{ transform: [{ scale: logoScale }, { rotate }, { scale: pulseAnim }] }}>
            <View style={styles.logoCircle}>
              <Ionicons name="medical" size={60} color={COLORS.primary} />
            </View>
          </Animated.View>
          <Animated.View style={{ opacity: formOpacity }}>
            <Text style={styles.logoText}>Care<Text style={styles.logoTextSecondary}>Express</Text></Text>
            <Text style={styles.tagline}>Your Health, Our Priority</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.formContainer, { transform: [{ translateY: formSlide }], opacity: formOpacity }]}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor={COLORS.lightGray}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              placeholderTextColor={COLORS.lightGray}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.lightGray} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin} style={[styles.loginButton, loading && styles.loginButtonDisabled]} disabled={loading}>
            <Text style={styles.loginButtonText}>{loading ? 'Signing In...' : 'Login'}</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: SIZES.padding },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 8 },
  logoText: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary },
  logoTextSecondary: { color: COLORS.secondary },
  tagline: { fontSize: 14, color: COLORS.lightGray, marginTop: 5 },
  formContainer: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 5 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 14, color: COLORS.lightGray, textAlign: 'center', marginBottom: 25 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.lightGray, paddingHorizontal: 15, marginBottom: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: COLORS.text },
  loginButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: SIZES.radius, alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  loginButtonDisabled: { backgroundColor: COLORS.lightGray },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  registerText: { color: COLORS.text, fontSize: 14 },
  registerLink: { color: COLORS.secondary, fontSize: 14, fontWeight: 'bold' },
});

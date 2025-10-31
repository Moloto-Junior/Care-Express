import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Image, ActivityIndicator } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { ref, set, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import LottieView from 'lottie-react-native'; // Added for animation

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Patient');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Doctor states
  const [specialty, setSpecialty] = useState('');
  const [branch, setBranch] = useState('Limpopo');
  const [licenseUri, setLicenseUri] = useState(null);
  const [uploadingLicense, setUploadingLicense] = useState(false);

  // Patient-specific states
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [medicalAid, setMedicalAid] = useState(false);
  const [medicalAidNumber, setMedicalAidNumber] = useState('');

  const [extras, setExtras] = useState('');

  const pickLicense = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload a license.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
      });
      if (!result.canceled) setLicenseUri(result.assets[0].uri);
    } catch (error) {
      console.log('Pick license error:', error);
      Alert.alert('Error', 'Failed to pick license image.');
    }
  };

  const uploadLicenseToStorage = async (uri, uid) => {
    if (!uri) return null;
    try {
      setUploadingLicense(true);
      const storage = getStorage();
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = storageRef(storage, `licenses/${uid}.jpg`);
      await uploadBytes(fileRef, blob);
      const url = await getDownloadURL(fileRef);
      return url;
    } catch (error) {
      console.log('Upload license error:', error);
      return null;
    } finally {
      setUploadingLicense(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Base user data
      const userData = {
        uid: user.uid,
        name,
        email,
        role,
        createdAt: Date.now(),
      };

      if (role === 'Doctor') {
        userData.specialty = specialty || 'General Practitioner';
        userData.branch = branch?.toLowerCase() || 'limpopo';
        userData.verified = false;
        userData.license = null;
      }

      if (role === 'Patient') {
        userData.age = age;
        userData.address = address;
        userData.medicalAid = medicalAid;
        userData.medicalAidNumber = medicalAid ? medicalAidNumber : '';
        userData.extras = extras;
      }

      // Save initial user record
      await set(ref(db, `users/${user.uid}`), userData);

      // Upload doctor license if needed
      if (role === 'Doctor' && licenseUri) {
        const licenseUrl = await uploadLicenseToStorage(licenseUri, user.uid);
        if (licenseUrl) {
          await update(ref(db, `users/${user.uid}`), {
            license: licenseUrl,
            verified: true,
          });
        } else console.log('License upload failed.');
      }

      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.replace(role.toLowerCase() === 'doctor' ? 'DoctorTabs' : 'PatientTabs'),
        },
      ]);
    } catch (error) {
      Alert.alert('Registration Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      
      {/* Floating background animation */}
      <LottieView
        source={require('../assets/animations/health.json')} // replace with your JSON file
        autoPlay
        loop
        style={styles.backgroundAnimation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="medical" size={50} color={COLORS.primary} />
          </View>
          <Text style={styles.logoText}>
            Care<Text style={styles.logoTextSecondary}>Express</Text>
          </Text>
          <Text style={styles.tagline}>Join us today</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          {/* Name */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
            <TextInput placeholder="Full Name" value={name} onChangeText={setName} style={styles.input} placeholderTextColor={COLORS.lightGray} />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} placeholderTextColor={COLORS.lightGray} />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
            <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} style={styles.input} placeholderTextColor={COLORS.lightGray} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.lightGray} />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
            <TextInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} style={styles.input} placeholderTextColor={COLORS.lightGray} />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.lightGray} />
            </TouchableOpacity>
          </View>

          {/* Role Selection */}
          <Text style={styles.roleLabel}>I am a:</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity onPress={() => setRole('Patient')} style={[styles.roleButton, role === 'Patient' && styles.roleButtonActive]}>
              <Ionicons name="person" size={24} color={role === 'Patient' ? '#fff' : COLORS.primary} />
              <Text style={[styles.roleText, role === 'Patient' && styles.roleTextActive]}>Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRole('Doctor')} style={[styles.roleButton, role === 'Doctor' && styles.roleButtonActive]}>
              <Ionicons name="medical" size={24} color={role === 'Doctor' ? '#fff' : COLORS.primary} />
              <Text style={[styles.roleText, role === 'Doctor' && styles.roleTextActive]}>Doctor</Text>
            </TouchableOpacity>
          </View>

          {/* Doctor fields */}
          {role === 'Doctor' && (
            <>
              <Text style={styles.label}>Specialty</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="school-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
                <TextInput placeholder="Specialty" value={specialty} onChangeText={setSpecialty} style={styles.input} placeholderTextColor={COLORS.lightGray} />
              </View>

              <Text style={styles.label}>Branch</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <TouchableOpacity onPress={() => setBranch('Limpopo')} style={[styles.branchButton, branch === 'Limpopo' && styles.branchButtonActive]}>
                  <Text style={[styles.branchText, branch === 'Limpopo' && styles.branchTextActive]}>Limpopo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setBranch('Johannesburg')} style={[styles.branchButton, branch === 'Johannesburg' && styles.branchButtonActive]}>
                  <Text style={[styles.branchText, branch === 'Johannesburg' && styles.branchTextActive]}>Johannesburg</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Upload Proof (License / Certificate)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={styles.uploadButton} onPress={pickLicense}>
                  <Ionicons name="cloud-upload-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.uploadButtonText}>{licenseUri ? 'Change File' : 'Upload File'}</Text>
                </TouchableOpacity>
                {licenseUri && <Image source={{ uri: licenseUri }} style={{ width: 60, height: 60, marginLeft: 12, borderRadius: 6 }} />}
              </View>

              {uploadingLicense && (
                <View style={{ marginTop: 10 }}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={{ color: COLORS.lightGray, marginTop: 6 }}>Uploading license...</Text>
                </View>
              )}
            </>
          )}

          {/* Patient fields */}
          {role === 'Patient' && (
            <>
              <Text style={styles.label}>Age</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="time-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
                <TextInput placeholder="Enter age" value={age} onChangeText={setAge} keyboardType="numeric" style={styles.input} placeholderTextColor={COLORS.lightGray} />
              </View>

              <Text style={styles.label}>Home Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="home-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
                <TextInput placeholder="Enter address" value={address} onChangeText={setAddress} style={styles.input} placeholderTextColor={COLORS.lightGray} />
              </View>

              <Text style={styles.label}>Medical Aid</Text>
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <TouchableOpacity onPress={() => setMedicalAid(true)} style={[styles.branchButton, medicalAid && styles.branchButtonActive]}>
                  <Text style={[styles.branchText, medicalAid && styles.branchTextActive]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMedicalAid(false)} style={[styles.branchButton, !medicalAid && styles.branchButtonActive]}>
                  <Text style={[styles.branchText, !medicalAid && styles.branchTextActive]}>No</Text>
                </TouchableOpacity>
              </View>

              {medicalAid && (
                <>
                  <Text style={styles.label}>Medical Aid Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
                    <TextInput placeholder="Enter number" value={medicalAidNumber} onChangeText={setMedicalAidNumber} style={styles.input} placeholderTextColor={COLORS.lightGray} />
                  </View>
                </>
              )}

              <Text style={styles.label}>Extras</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
                <TextInput placeholder="Any extra info" value={extras} onChangeText={setExtras} style={styles.input} placeholderTextColor={COLORS.lightGray} />
              </View>
            </>
          )}

          <TouchableOpacity onPress={handleRegister} style={[styles.registerButton, loading && styles.registerButtonDisabled]} disabled={loading}>
            <Text style={styles.registerButtonText}>{loading ? 'Creating Account...' : 'Register'}</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: SIZES.padding, paddingTop: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 8 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
  logoTextSecondary: { color: COLORS.secondary },
  tagline: { fontSize: 14, color: COLORS.lightGray, marginTop: 5 },
  formContainer: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 5 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 14, color: COLORS.lightGray, textAlign: 'center', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.lightGray, paddingHorizontal: 15, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: COLORS.text },
  roleLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 10, marginBottom: 12 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  roleButton: { flex: 1, backgroundColor: COLORS.background, borderWidth: 2, borderColor: COLORS.primary, padding: 15, borderRadius: SIZES.radius, alignItems: 'center', marginHorizontal: 5 },
  roleButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleText: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold', marginTop: 5 },
  roleTextActive: { color: '#fff' },
  branchButton: { flex: 1, borderWidth: 1, borderColor: COLORS.lightGray, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 6, backgroundColor: COLORS.background },
  branchButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  branchText: { color: COLORS.text, fontWeight: '600' },
  branchTextActive: { color: '#fff' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.lightGray, backgroundColor: COLORS.background },
  uploadButtonText: { marginLeft: 8, color: COLORS.text, fontWeight: '600' },
  registerButton: { backgroundColor: COLORS.secondary, padding: 16, borderRadius: SIZES.radius, alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  registerButtonDisabled: { backgroundColor: COLORS.lightGray },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: COLORS.text, fontSize: 14 },
  loginLink: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 10, marginBottom: 8 },
  backgroundAnimation: { // Added animation style
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    opacity: 0.3,
  },
});

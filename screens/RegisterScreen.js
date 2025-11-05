import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { ref, set, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function RegisterScreen({ navigation }) {
  // Basic fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Patient');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Doctor/Pharmacist fields
  const [specialty, setSpecialty] = useState('');
  const [branch, setBranch] = useState('Limpopo');
  const [licenseUri, setLicenseUri] = useState(null);
  const [uploadingLicense, setUploadingLicense] = useState(false);

  // Patient fields
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [medicalAid, setMedicalAid] = useState(false);
  const [medicalAidNumber, setMedicalAidNumber] = useState('');
  const [extras, setExtras] = useState('');

  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(50)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const heartbeatAnim = useRef(new Animated.Value(1)).current;

  // Animation setup
  useEffect(() => {
    // Logo animations
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Form animations
    Animated.parallel([
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Heartbeat animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeatAnim, {
          toValue: 1.1,
          duration: 150,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1.1,
          duration: 150,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    ).start();
  }, []);

  const rotate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // License picker
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
      if (!result.canceled) {
        setLicenseUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Pick license error:', error);
      Alert.alert('Error', 'Failed to pick license image.');
    }
  };

  // Upload license to Firebase Storage
  const uploadLicenseToStorage = async (uri, uid) => {
    if (!uri) return null;
    try {
      setUploadingLicense(true);
      const storage = getStorage();
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = storageRef(storage, `licenses/${uid}_${Date.now()}.jpg`);
      await uploadBytes(fileRef, blob);
      const url = await getDownloadURL(fileRef);
      return url;
    } catch (error) {
      console.log('Upload license error:', error);
      Alert.alert('Error', 'Failed to upload license');
      return null;
    } finally {
      setUploadingLicense(false);
    }
  };

  // Validation
  const validateInputs = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    // Role-specific validations
    if ((role === 'Doctor' || role === 'Pharmacist') && !specialty.trim()) {
      Alert.alert('Error', `Please enter your ${role.toLowerCase()} specialty`);
      return false;
    }

    if (role === 'Patient') {
      if (!age.trim()) {
        Alert.alert('Error', 'Please enter your age');
        return false;
      }
      if (isNaN(age) || age < 1 || age > 120) {
        Alert.alert('Error', 'Please enter a valid age');
        return false;
      }
      if (!address.trim()) {
        Alert.alert('Error', 'Please enter your address');
        return false;
      }
    }

    return true;
  };

  // Handle registration
  const handleRegister = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Prepare user data
      const userData = {
        uid: user.uid,
        name,
        email,
        role,
        createdAt: Date.now(),
        profilePicture: null,
      };

      // Add role-specific data
      if (role === 'Doctor' || role === 'Pharmacist') {
        userData.specialty = specialty.trim();
        userData.branch = branch.toLowerCase();
        userData.verified = false;
        userData.license = null;
      }

      if (role === 'Patient') {
        userData.age = parseInt(age);
        userData.address = address.trim();
        userData.medicalAid = medicalAid;
        userData.medicalAidNumber = medicalAid ? medicalAidNumber.trim() : '';
        userData.extras = extras.trim();
      }

      // Save user data to database
      await set(ref(db, `users/${user.uid}`), userData);

      // Upload license if provided
      if ((role === 'Doctor' || role === 'Pharmacist') && licenseUri) {
        const licenseUrl = await uploadLicenseToStorage(licenseUri, user.uid);
        if (licenseUrl) {
          await update(ref(db, `users/${user.uid}`), {
            license: licenseUrl,
            verified: true,
          });
        }
      }

      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (role === 'Patient') {
              navigation.replace('PatientTabs');
            } else if (role === 'Doctor') {
              navigation.replace('DoctorTabs');
            } else if (role === 'Pharmacist') {
              navigation.replace('SelectInitialMedicines');
            }
          },
        },
      ]);
    } catch (error) {
      console.log('Registration error:', error);
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={{
              transform: [{ scale: logoScale }, { rotate }, { scale: pulseAnim }],
            }}
          >
            <View style={styles.logoCircle}>
              <Animated.View style={{ transform: [{ scale: heartbeatAnim }] }}>
                <Ionicons name="medical" size={50} color={COLORS.primary} />
              </Animated.View>
            </View>
          </Animated.View>
          <Animated.View style={{ opacity: formOpacity }}>
            <Text style={styles.logoText}>
              Care<Text style={styles.logoTextSecondary}>Express</Text>
            </Text>
            <Text style={styles.tagline}>Join us today</Text>
          </Animated.View>
        </View>

        {/* Form Section */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              transform: [{ translateY: formSlide }],
              opacity: formOpacity,
            },
          ]}
        >
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholderTextColor={COLORS.lightGray}
            />
          </View>

          {/* Email Input */}
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

          {/* Password Input */}
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
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.lightGray}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              placeholderTextColor={COLORS.lightGray}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.lightGray}
              />
            </TouchableOpacity>
          </View>

          {/* Role Selection */}
          <Text style={styles.roleLabel}>I am a:</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              onPress={() => {
                setRole('Patient');
                setSpecialty('');
                setLicenseUri(null);
              }}
              style={[styles.roleButton, role === 'Patient' && styles.roleButtonActive]}
            >
              <Ionicons
                name="person"
                size={24}
                color={role === 'Patient' ? '#fff' : COLORS.primary}
              />
              <Text style={[styles.roleText, role === 'Patient' && styles.roleTextActive]}>
                Patient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setRole('Doctor');
                setAge('');
                setAddress('');
              }}
              style={[styles.roleButton, role === 'Doctor' && styles.roleButtonActive]}
            >
              <Ionicons
                name="medical"
                size={24}
                color={role === 'Doctor' ? '#fff' : COLORS.primary}
              />
              <Text style={[styles.roleText, role === 'Doctor' && styles.roleTextActive]}>
                Doctor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setRole('Pharmacist');
                setAge('');
                setAddress('');
              }}
              style={[styles.roleButton, role === 'Pharmacist' && styles.roleButtonActive]}
            >
              <Ionicons
                name="medkit-outline"
                size={24}
                color={role === 'Pharmacist' ? '#fff' : COLORS.primary}
              />
              <Text style={[styles.roleText, role === 'Pharmacist' && styles.roleTextActive]}>
                Pharmacist
              </Text>
            </TouchableOpacity>
          </View>

          {/* Doctor/Pharmacist Fields */}
          {(role === 'Doctor' || role === 'Pharmacist') && (
            <>
              <Text style={styles.label}>Specialty</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="school-outline"
                  size={20}
                  color={COLORS.lightGray}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder={`${role} Specialty`}
                  value={specialty}
                  onChangeText={setSpecialty}
                  style={styles.input}
                  placeholderTextColor={COLORS.lightGray}
                />
              </View>

              <Text style={styles.label}>Branch/Location</Text>
              <View style={styles.branchContainer}>
                <TouchableOpacity
                  onPress={() => setBranch('Limpopo')}
                  style={[styles.branchButton, branch === 'Limpopo' && styles.branchButtonActive]}
                >
                  <Text style={[styles.branchText, branch === 'Limpopo' && styles.branchTextActive]}>
                    Limpopo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setBranch('Johannesburg')}
                  style={[
                    styles.branchButton,
                    branch === 'Johannesburg' && styles.branchButtonActive,
                  ]}
                >
                  <Text
                    style={[styles.branchText, branch === 'Johannesburg' && styles.branchTextActive]}
                  >
                    Johannesburg
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Upload License/Certificate</Text>
              <View style={styles.uploadContainer}>
                <TouchableOpacity style={styles.uploadButton} onPress={pickLicense}>
                  <Ionicons name="cloud-upload-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.uploadButtonText}>
                    {licenseUri ? 'Change File' : 'Upload File'}
                  </Text>
                </TouchableOpacity>
                {licenseUri && (
                  <Image
                    source={{ uri: licenseUri }}
                    style={styles.licensePreview}
                  />
                )}
              </View>

              {uploadingLicense && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.uploadingText}>Uploading license...</Text>
                </View>
              )}
            </>
          )}

          {/* Patient Fields */}
          {role === 'Patient' && (
            <>
              <Text style={styles.label}>Age</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={COLORS.lightGray}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Enter age"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor={COLORS.lightGray}
                />
              </View>

              <Text style={styles.label}>Home Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="home-outline"
                  size={20}
                  color={COLORS.lightGray}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Enter address"
                  value={address}
                  onChangeText={setAddress}
                  style={styles.input}
                  placeholderTextColor={COLORS.lightGray}
                />
              </View>

              <Text style={styles.label}>Medical Aid?</Text>
              <View style={styles.branchContainer}>
                <TouchableOpacity
                  onPress={() => setMedicalAid(true)}
                  style={[styles.branchButton, medicalAid && styles.branchButtonActive]}
                >
                  <Text style={[styles.branchText, medicalAid && styles.branchTextActive]}>
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMedicalAid(false)}
                  style={[styles.branchButton, !medicalAid && styles.branchButtonActive]}
                >
                  <Text style={[styles.branchText, !medicalAid && styles.branchTextActive]}>
                    No
                  </Text>
                </TouchableOpacity>
              </View>

              {medicalAid && (
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={COLORS.lightGray}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Medical Aid Number"
                    value={medicalAidNumber}
                    onChangeText={setMedicalAidNumber}
                    style={styles.input}
                    placeholderTextColor={COLORS.lightGray}
                  />
                </View>
              )}

              <Text style={styles.label}>Additional Notes</Text>
              <View style={[styles.inputContainer, { minHeight: 80 }]}>
                <TextInput
                  placeholder="Any medical conditions or allergies..."
                  value={extras}
                  onChangeText={setExtras}
                  style={[styles.input, { paddingTop: 10 }]}
                  placeholderTextColor={COLORS.lightGray}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </>
          )}

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.signInContainer}>
            <Text style={styles.signInText}>
              Already have an account?{' '}
              <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.padding,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  logoTextSecondary: {
    color: COLORS.secondary,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.lightGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: 15,
    marginBottom: 12,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  roleButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 15,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  roleTextActive: {
    color: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 8,
  },
  branchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  branchButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  branchButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  branchText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  branchTextActive: {
    color: '#fff',
  },
  uploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.background,
  },
  uploadButtonText: {
    marginLeft: 8,
    color: COLORS.text,
    fontWeight: '600',
  },
  licensePreview: {
    width: 60,
    height: 60,
    marginLeft: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  uploadingContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  uploadingText: {
    color: COLORS.lightGray,
    marginTop: 6,
    fontSize: 12,
  },
  registerButton: {
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  registerButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signInContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  signInText: {
    color: COLORS.text,
    fontSize: 14,
  },
  signInLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

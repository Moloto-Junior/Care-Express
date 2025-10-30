// src/screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { ref, update, get } from 'firebase/database';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@env';

export default function ProfileScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [userData, setUserData] = useState({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const uid = route.params?.uid || auth.currentUser.uid;
    try {
      const snapshot = await get(ref(db, `users/${uid}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserData(data);
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setRole(data.role || '');
        setImage(data.profilePicture || null);
      }
    } catch (error) {
      console.log('Error fetching user:', error);
      Alert.alert('Error', 'Failed to load profile data');
    }
    setLoading(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload a photo.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images, // <- fixed deprecated line
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        uploadImageToCloudinary(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Pick image error:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take a photo.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        uploadImageToCloudinary(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Take photo error:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const removePhoto = async () => {
    const user = auth.currentUser;
    setImage(null);
    try {
      await update(ref(db, `users/${user.uid}`), { profilePicture: null });
      Alert.alert('Success', 'Profile picture removed.');
    } catch (error) {
      console.log('Remove photo error:', error);
      Alert.alert('Error', 'Failed to remove photo.');
    }
  };

  const uploadImageToCloudinary = async (uri) => {
    if (!uri) return;

    setUploading(true);
    const user = auth.currentUser;

    try {
      console.log('Uploading image from URI:', uri);

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: `${user.uid}.jpg`,
      });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.secure_url) {
        console.log('Cloudinary URL:', data.secure_url);
        setImage(data.secure_url);

        await update(ref(db, `users/${user.uid}`), {
          profilePicture: data.secure_url,
        });

        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        console.log('Cloudinary error:', data);
        Alert.alert('Error', 'Failed to upload image.');
      }

    } catch (error) {
      console.log('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Remove Photo', onPress: removePhoto, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const updateProfile = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and email cannot be empty.');
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    try {
      await update(ref(db, `users/${user.uid}`), {
        name,
        email,
        phone,
        profilePicture: image,
      });

      Alert.alert('Success', 'Profile updated successfully!');
      fetchUser();
    } catch (error) {
      console.log('Update error:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
    setLoading(false);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
    header: { alignItems: 'center', paddingTop: 40, paddingBottom: 30, backgroundColor: theme.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff' },
    avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
    cameraButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.secondary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
    uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
    roleBadge: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginTop: 15 },
    roleText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    form: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: theme.text, marginTop: 15, marginBottom: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 15 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 12, fontSize: 16, color: theme.text },
    updateButton: { backgroundColor: theme.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30, flexDirection: 'row', justifyContent: 'center' },
    updateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    settingsButton: { backgroundColor: theme.card, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 15, flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    settingsButtonText: { color: theme.text, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarContainer} onPress={showImageOptions}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={60} color="#fff" />
            </View>
          )}
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
          <View style={styles.cameraButton}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{role}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color={theme.lightGray} style={styles.inputIcon} />
          <TextInput
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor={theme.placeholder}
          />
        </View>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={theme.lightGray} style={styles.inputIcon} />
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor={theme.placeholder}
          />
        </View>

        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color={theme.lightGray} style={styles.inputIcon} />
          <TextInput
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
            placeholderTextColor={theme.placeholder}
          />
        </View>

        <TouchableOpacity style={styles.updateButton} onPress={updateProfile}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.updateButtonText}>Update Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings" size={20} color={theme.text} />
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

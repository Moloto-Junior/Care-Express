import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { getTranslation } from '../translations';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

export default function SettingsScreen({ navigation }) {
  const { theme, isDarkMode, toggleTheme, language, changeLanguage } = useTheme();
  const [showLanguages, setShowLanguages] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
    { code: 'zu', name: 'isiZulu', flag: '🇿🇦' },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handlePrivacySecurity = () => {
    Alert.alert(
      'Privacy & Security',
      'Your data is encrypted and secure. We never share your information with third parties.\n\nAll your medical records, appointments, and personal information are stored securely in our database with end-to-end encryption.',
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'How can we help you?',
      [
        {
          text: 'Contact Support',
          onPress: () =>
            Alert.alert(
              'Contact Support',
              'Email: support@careexpress.com\nPhone: +27 71 645 2095\n\nTap below to reach us directly.',
              [
                {
                  text: 'Send Email',
                  onPress: () => Linking.openURL('mailto:support@careexpress.com'),
                },
                {
                  text: 'Call Support',
                  onPress: () => Linking.openURL('tel:+27123456789'),
                },
                { text: 'Close', style: 'cancel' },
              ]
            ),
        },
        {
          text: 'FAQ',
          onPress: () =>
            Alert.alert(
              'FAQ',
              '1. How do I book an appointment?\n2. How do I find doctors?\n3. Is my data secure?\n4. How do I update my profile?\n\nFor detailed answers, contact support.',
              [{ text: 'Close', style: 'cancel' }]
            ),
        },
        {
         text: 'Close', 
        style: 'cancel',
      },
        {
          text: 'Report a Problem',
          onPress: () =>
            Alert.alert(
              'Report Problem',
              'Please email us at support@careexpress.com with details of the issue.',
              [{ text: 'Close', style: 'cancel' }]
            ),
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };
  

  const handleTermsConditions = () => {
    Alert.alert(
      'Terms & Conditions',
      'CareExpress Terms of Service\n\nLast updated: January 2025\n\n1. Acceptance of Terms\n2. User Responsibilities\n3. Privacy Policy\n4. Medical Disclaimer\n5. Data Security\n\nBy using this app, you agree to our terms.',
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const handleAboutApp = () => {
    Alert.alert(
      'About CareExpress',
      '🏥 CareExpress v1.0.0\n\nYour Complete Healthcare Solution\n\n📋 Features:\n\n👨‍⚕️ For Patients:\n• Search and order medicines with API integration\n• View registered doctors and their profiles\n• Book appointments with doctors\n• Real-time chat with healthcare providers\n• Add medicines to cart and checkout\n• Secure payment processing\n• Track delivery with map location\n• Receive notifications for orders, appointments, and deliveries\n• Upload and manage profile pictures\n\n🩺 For Doctors:\n• View and manage patient appointments\n• Chat with patients in real-time\n• Receive appointment notifications\n• View patient profiles and medical history\n• Manage professional profile with photo\n\n🔒 Security:\n• All data stored securely in Firebase database\n• End-to-end encrypted communications\n• HIPAA compliant medical records\n\n📍 Powered by:\n• Firebase Realtime Database\n• Google Maps API for delivery tracking\n• Medicine Search API\n• Secure Payment Gateway\n\n© 2025 CareExpress. All rights reserved.',
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    section: {
      backgroundColor: theme.card,
      marginTop: 20,
      marginHorizontal: 20,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      opacity: 0.6,
      marginHorizontal: 20,
      marginTop: 30,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    settingItemLast: {
      borderBottomWidth: 0,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    settingText: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
    },
    settingValue: {
      fontSize: 14,
      color: theme.lightGray,
      marginRight: 8,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    languageFlag: {
      fontSize: 24,
      marginRight: 12,
    },
    languageName: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
    },
    selectedLanguage: {
      fontWeight: 'bold',
      color: theme.primary,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.secondary,
      marginHorizontal: 20,
      marginTop: 30,
      marginBottom: 30,
      padding: 16,
      borderRadius: 12,
    },
    logoutText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ padding: 20, paddingTop: 60 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.text }}>
          {getTranslation(language, 'settings')}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>APPEARANCE</Text>
      <View style={styles.section}>
        <TouchableOpacity style={[styles.settingItem, styles.settingItemLast]}>
          <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#4A9EFF' : '#007BFF' }]}>
            <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color="#fff" />
          </View>
          <Text style={styles.settingText}>{getTranslation(language, 'darkMode')}</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.lightGray, true: theme.primary }}
            thumbColor="#fff"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>LANGUAGE</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.settingItem, !showLanguages && styles.settingItemLast]}
          onPress={() => setShowLanguages(!showLanguages)}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="language" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>{getTranslation(language, 'language')}</Text>
          <Text style={styles.settingValue}>
            {languages.find(l => l.code === language)?.name}
          </Text>
          <Ionicons
            name={showLanguages ? 'chevron-up' : 'chevron-forward'}
            size={20}
            color={theme.lightGray}
          />
        </TouchableOpacity>

        {showLanguages && languages.map((lang, index) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.languageItem, index === languages.length - 1 && styles.settingItemLast]}
            onPress={() => {
              changeLanguage(lang.code);
              setShowLanguages(false);
            }}
          >
            <Text style={styles.languageFlag}>{lang.flag}</Text>
            <Text style={[styles.languageName, language === lang.code && styles.selectedLanguage]}>
              {lang.name}
            </Text>
            {language === lang.code && (
              <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>ACCOUNT</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.settingItem]}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="person" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.lightGray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem]}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.lightGray} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingItem, styles.settingItemLast]}
          onPress={handlePrivacySecurity}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>Privacy & Security</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.lightGray} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>ABOUT</Text>
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.settingItem]}
          onPress={handleHelpSupport}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="help-circle" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.lightGray} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingItem]}
          onPress={handleTermsConditions}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>Terms & Conditions</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.lightGray} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingItem, styles.settingItemLast]}
          onPress={handleAboutApp}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>About App</Text>
          <Text style={styles.settingValue}>v1.0.0</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.lightGray} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

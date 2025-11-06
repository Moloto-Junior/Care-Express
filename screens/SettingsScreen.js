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
    { code: 'tn', name: 'Setswana', flag: '🇧🇼' },
  ];

  const handleLogout = () => {
    Alert.alert(
      getTranslation(language, 'logout') || 'Logout',
      getTranslation(language, 'logoutConfirmation') || 'Are you sure you want to logout?',
      [
        { text: getTranslation(language, 'cancel'), style: 'cancel' },
        {
          text: getTranslation(language, 'logout') || 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (error) {
              Alert.alert(getTranslation(language, 'error') || 'Error', getTranslation(language, 'logoutFailed') || 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handlePrivacySecurity = () => {
    Alert.alert(
      getTranslation(language, 'privacySecurity') || 'Privacy & Security',
      getTranslation(language, 'privacyDescription') || 'Your data is encrypted and secure. We never share your information with third parties.',
      [{ text: getTranslation(language, 'close') || 'Close', style: 'cancel' }]
    );
  };

  const handleHelpSupport = () => {
    Alert.alert(
      getTranslation(language, 'helpSupport') || 'Help & Support',
      getTranslation(language, 'helpDescription') || 'How can we help you?',
      [
        {
          text: getTranslation(language, 'contactSupport') || 'Contact Support',
          onPress: () =>
            Linking.openURL('mailto:support@careexpress.com'),
        },
        { text: getTranslation(language, 'close') || 'Close', style: 'cancel' },
      ]
    );
  };

  const handleTermsConditions = () => {
    Alert.alert(
      getTranslation(language, 'termsConditions') || 'Terms & Conditions',
      getTranslation(language, 'termsDescription') || 'CareExpress Terms of Service\n\nBy using this app, you agree to our terms.',
      [{ text: getTranslation(language, 'close') || 'Close', style: 'cancel' }]
    );
  };

  const handleAboutApp = () => {
    Alert.alert(
      getTranslation(language, 'aboutApp') || 'About CareExpress',
      getTranslation(language, 'aboutDescription') || 'CareExpress v1.0.0\nYour Complete Healthcare Solution',
      [{ text: getTranslation(language, 'close') || 'Close', style: 'cancel' }]
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    section: { backgroundColor: theme.card, marginTop: 20, marginHorizontal: 20, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: theme.text, opacity: 0.6, marginHorizontal: 20, marginTop: 30, marginBottom: 10, textTransform: 'uppercase' },
    settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
    settingItemLast: { borderBottomWidth: 0 },
    iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    settingText: { flex: 1, fontSize: 16, color: theme.text },
    settingValue: { fontSize: 14, color: theme.lightGray, marginRight: 8 },
    languageItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
    languageFlag: { fontSize: 24, marginRight: 12 },
    languageName: { flex: 1, fontSize: 16, color: theme.text },
    selectedLanguage: { fontWeight: 'bold', color: theme.primary },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.secondary, marginHorizontal: 20, marginTop: 30, marginBottom: 30, padding: 16, borderRadius: 12 },
    logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ padding: 20, paddingTop: 60 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.text }}>
          {getTranslation(language, 'settings')}
        </Text>
      </View>

      {/* Appearance */}
      <Text style={styles.sectionTitle}>{getTranslation(language, 'appearance') || 'Appearance'}</Text>
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

      {/* Language */}
      <Text style={styles.sectionTitle}>{getTranslation(language, 'language')}</Text>
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
          <Ionicons name={showLanguages ? 'chevron-up' : 'chevron-forward'} size={20} color={theme.lightGray} />
        </TouchableOpacity>

        {showLanguages && languages.map((lang, index) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.languageItem, index === languages.length - 1 && styles.settingItemLast]}
            onPress={() => { changeLanguage(lang.code); setShowLanguages(false); }}
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

      {/* Account & About */}
      <Text style={styles.sectionTitle}>{getTranslation(language, 'account')}</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.iconContainer}>
            <Ionicons name="person" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>{getTranslation(language, 'editProfile')}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.lightGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Notifications')}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>{getTranslation(language, 'notifications')}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.lightGray} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, styles.settingItemLast]} onPress={handlePrivacySecurity}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>{getTranslation(language, 'privacySecurity')}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.lightGray} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{getTranslation(language, 'about')}</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.settingItem} onPress={handleHelpSupport}>
          <View style={styles.iconContainer}>
            <Ionicons name="help-circle" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>{getTranslation(language, 'helpSupport')}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.lightGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleTermsConditions}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>{getTranslation(language, 'termsConditions')}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.lightGray} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, styles.settingItemLast]} onPress={handleAboutApp}>
          <View style={styles.iconContainer}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
          </View>
          <Text style={styles.settingText}>{getTranslation(language, 'aboutApp')}</Text>
          <Text style={styles.settingValue}>v1.0.0</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.lightGray} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#fff" />
        <Text style={styles.logoutText}>{getTranslation(language, 'logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

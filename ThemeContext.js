// src/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Light Theme Colors
const lightTheme = {
  primary: '#007BFF',
  secondary: '#FF3B3B',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#333333',
  lightGray: '#ccc',
  success: '#28A745',
  border: '#E0E0E0',
  placeholder: '#999999',
};

// Dark Theme Colors
const darkTheme = {
  primary: '#4A9EFF',
  secondary: '#FF6B6B',
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  lightGray: '#666666',
  success: '#4CAF50',
  border: '#333333',
  placeholder: '#888888',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedLanguage = await AsyncStorage.getItem('language');
      
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
      if (savedLanguage !== null) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.log('Error loading preferences:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const changeLanguage = async (lang) => {
    try {
      setLanguage(lang);
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        toggleTheme,
        language,
        changeLanguage,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
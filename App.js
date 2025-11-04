import React from 'react';
import AppNavigator from './Navigation';
import { ThemeProvider } from './ThemeContext';
import { NotificationProvider } from './NotificationContext';
import 'react-native-get-random-values';
import OfflineBanner from './components/OfflineBanner'; 

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <OfflineBanner /> 
        <AppNavigator />
      </NotificationProvider>
    </ThemeProvider>
  );
}

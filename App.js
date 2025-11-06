import React from 'react';
import AppNavigator from './Navigation';
import { ThemeProvider, useTheme } from './ThemeContext';
import { NotificationProvider } from './NotificationContext';
import 'react-native-get-random-values';
import OfflineBanner from './components/OfflineBanner'; 

function AppWrapper() {
  const { isLoading } = useTheme();

  if (isLoading) return null; // or a splash/loading screen

  return <AppNavigator />;
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <OfflineBanner />
        <AppWrapper />
      </NotificationProvider>
    </ThemeProvider>
  );
}

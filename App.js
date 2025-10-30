// App.js
import React from 'react';
import AppNavigator from './Navigation';
import { ThemeProvider } from './ThemeContext';
import 'react-native-get-random-values';

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
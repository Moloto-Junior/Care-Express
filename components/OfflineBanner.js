import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Ionicons } from '@expo/vector-icons';

export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const [showOnline, setShowOnline] = useState(false);
  const [prevStatus, setPrevStatus] = useState(true); 
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!prevStatus && isOnline) {
      setShowOnline(true);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowOnline(false));
      }, 5000);
    }

    setPrevStatus(isOnline);
  }, [isOnline]);

  if (!isOnline && !showOnline) {
    return (
      <View style={styles.offlineBanner}>
        <Ionicons name="cloud-offline" size={16} color="#fff" />
        <Text style={styles.text}>  You are currently offline</Text>
      </View>
    );
  }

  if (showOnline) {
    return (
      <Animated.View style={[styles.onlineBanner, { opacity: fadeAnim }]}>
        <Ionicons name="cloud" size={16} color="#fff" />
        <Text style={styles.text}>  You are back online</Text>
      </Animated.View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBanner: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

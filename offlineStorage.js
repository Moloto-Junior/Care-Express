import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  USER_DATA: '@user_data',
  APPOINTMENTS: '@appointments',
  DOCTORS: '@doctors',
  MESSAGES: '@messages',
  CART: '@cart',
  MEDICINES: '@medicines',
};

export const saveToStorage = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Save error:', error);
    return false;
  }
};

export const getFromStorage = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Get error:', error);
    return null;
  }
};

export const removeFromStorage = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Remove error:', error);
    return false;
  }
};
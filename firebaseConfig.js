import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBqI1qZ8r5E0W4fHOPmzqhXkIeNxTj3YWM",
  authDomain: "careexpress-3d167.firebaseapp.com",
  databaseURL: "https://careexpress-3d167-default-rtdb.firebaseio.com",
  projectId: "careexpress-3d167",
  storageBucket: "careexpress-3d167.appspot.com",
  messagingSenderId: "552702939513",
  appId: "1:552702939513:web:7800f00573aa1d53679fa8"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getDatabase(app);

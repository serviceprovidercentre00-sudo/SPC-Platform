// @ts-nocheck
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence 
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAk0HvWSO7rhaWWJfabnS7mm1XCiQ6E-0M",
  authDomain: "spcproject-c45b4-5c782.firebaseapp.com",
  projectId: "spcproject-c45b4-5c782",
  storageBucket: "spcproject-c45b4-5c782.firebasestorage.app",
  messagingSenderId: "240621722636",
  appId: "1:240621722636:android:f04a79a3f431d93be62229" 
};

// 1. App Initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Auth Initialization (Singleton Pattern)
let auth;

if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // Mobile par hum check karte hain ki kya auth pehle se initialized hai?
  try {
    auth = getAuth(app);
  } catch (e) {
    // Agar initialize nahi hua hai, tabhi initializeAuth call karte hain
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
}

const db = getFirestore(app);

export { auth, db, app };
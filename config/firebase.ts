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

// Aapka confirmed firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAk0HvWSO7rhaWWJfabnS7mm1XCiQ6E-0M",
  authDomain: "spcproject-c45b4-5c782.firebaseapp.com",
  projectId: "spcproject-c45b4-5c782",
  storageBucket: "spcproject-c45b4-5c782.firebasestorage.app",
  messagingSenderId: "240621722636",
  appId: "1:240621722636:android:f04a79a3f431d93be62229" 
};

// Singleton initialization (Avoids multiple app instances)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;

try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    // Mobile Persistence setup
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} catch (error) {
  // Re-initialization error handling for development hot-reloads
  auth = getAuth(app);
}

const db = getFirestore(app);

// Exports for other files like auth.tsx and cart.tsx
export { auth, db, app };
// @ts-nocheck
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAk0HvWSO7rhaWWJfabnS7mm1XCiQ6E-0M",
  authDomain: "spcproject-c45b4-5c782.firebaseapp.com",
  projectId: "spcproject-c45b4-5c782",
  storageBucket: "spcproject-c45b4-5c782.firebasestorage.app",
  messagingSenderId: "240621722636",
  appId: "1:240621722636:android:f04a79a3f431d93be62229",
};

// 1. App Initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Auth setup (Safe Initialization)
let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    // Agar mobile par Auth pehle se initialize nahi hai, tabhi initializeAuth karein
    auth = getAuth(app);
  } catch (e) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
}

// 3. Firestore
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

// 4. Storage (Make sure it's properly initialized with the app instance)
const storage = getStorage(app);

export { app, auth, db, storage };


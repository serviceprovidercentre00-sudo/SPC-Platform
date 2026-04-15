// @ts-nocheck
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 
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

// 2. Auth setup (Strict checks for Web vs Native)
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // Mobile par persistence ke liye
  auth = getAuth(app);
  if (!auth.currentUser) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
}

// 3. Firestore (Best configuration for Web/Mobile)
// 'experimentalForceLongPolling' use kiya hai jo Web 404/Connection errors ko rokta hai
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false, 
});

// 4. Storage
const storage = getStorage(app); 

export { auth, db, storage, app };
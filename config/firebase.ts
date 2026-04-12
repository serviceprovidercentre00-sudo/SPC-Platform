// @ts-nocheck
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore"; // initializeFirestore add kiya
import { getStorage } from "firebase/storage"; 
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence 
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Aapka original config (Makkhan jaisa hai)
const firebaseConfig = {
  apiKey: "AIzaSyAk0HvWSO7rhaWWJfabnS7mm1XCiQ6E-0M",
  authDomain: "spcproject-c45b4-5c782.firebaseapp.com",
  projectId: "spcproject-c45b4-5c782",
  storageBucket: "spcproject-c45b4-5c782.firebasestorage.app",
  messagingSenderId: "240621722636",
  appId: "1:240621722636:android:f04a79a3f431d93be62229" 
};

// 1. Firebase App Initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Auth setup with Persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = getAuth(app);
  } catch (e) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
}

// 3. Firestore Initialization (Extra power ke sath)
// Maine yahan long polling enable ki hai taki connection stable rahe
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

// 4. Storage Initialization
const storage = getStorage(app); 

// Sabhi ko export karna
export { auth, db, storage, app };
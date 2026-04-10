// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TouchableOpacity, View, Image
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Isse "Component not registered" wala error solve ho jayega
export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Agar user logged in hai toh tabs par bhejo
        router.replace('/(tabs)');
      }
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  const syncUserToDb = async (user) => {
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || 'SPC User',
        email: user.email || '',
        photoURL: user.photoURL || '',
        role: 'user',
        address: 'Patna, Bihar',
        lastLogin: serverTimestamp(),
      }, { merge: true });
    } catch (e) { 
      console.error("Firestore Error:", e); 
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      
      // Note: Mobile par agar Firebase configuration sahi hai toh popup kaam karega.
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await syncUserToDb(result.user);
        router.replace('/(tabs)');
      }
    } catch (error) { 
      console.log("Google Login Error:", error);
      Alert.alert("SPC Error", "Google login nahi ho paya. Ek baar Firebase Console mein Google Provider check karein."); 
    } finally { 
      setLoading(false); 
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
             <Text style={styles.brand}>SPC PATNA</Text>
             <Text style={styles.motto}>Premium Home Services</Text>
          </View>

          <Text style={styles.welcomeText}>Welcome! Please sign in to continue.</Text>

          <TouchableOpacity 
            style={styles.googleBtn} 
            onPress={handleGoogleLogin} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#002D62" />
            ) : (
              <>
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
                  style={styles.googleIcon} 
                />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerText}>Secure Login by Google</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#002D62' },
  loader: { flex: 1, backgroundColor: '#002D62', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  card: { backgroundColor: '#FFF', padding: 35, borderRadius: 30, elevation: 15, alignItems: 'center' },
  logoContainer: { marginBottom: 30 },
  brand: { fontSize: 36, fontWeight: 'bold', color: '#002D62', textAlign: 'center' },
  motto: { textAlign: 'center', color: '#D4AF37', fontWeight: '600', fontSize: 14 },
  welcomeText: { color: '#64748B', marginBottom: 30, fontSize: 16, textAlign: 'center' },
  googleBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
      }
    }),
  },
  googleIcon: { width: 24, height: 24, marginRight: 15 },
  googleBtnText: { color: '#1E293B', fontWeight: 'bold', fontSize: 18 },
  footerText: { marginTop: 25, color: '#94A3B8', fontSize: 12 },
});
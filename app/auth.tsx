// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, 
  getRedirectResult, onAuthStateChanged, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPhoneNumber, RecaptchaVerifier
} from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthScreen = () => {
  const [authMode, setAuthMode] = useState('phone'); 
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmData, setConfirmData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const recaptchaVerifier = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.replace('/(tabs)');
      setCheckingAuth(false);
    });

    if (Platform.OS !== 'web') {
      getRedirectResult(auth).then((result) => {
        if (result) syncUserToDb(result.user);
      }).catch(err => console.log("Redirect Result Error:", err));
    }
    return unsubscribe;
  }, []);

  const syncUserToDb = async (user) => {
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || name || 'SPC User',
        email: user.email || email || '',
        phone: user.phoneNumber || phone || '',
        role: 'user',
        address: 'Patna, Bihar',
        lastLogin: serverTimestamp(),
      }, { merge: true });
    } catch (e) { console.error("Firestore Error:", e); }
  };

  // --- PHONE OTP LOGIC ---
  const handlePhoneSubmit = async () => {
    if (!phone || phone.length < 10) return Alert.alert("SPC", "10-digit number dalein.");
    setLoading(true);
    try {
      const phoneNumber = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier.current);
      setConfirmData(confirmation);
      Alert.alert("SPC", "OTP bhej diya gaya hai.");
    } catch (error) {
      console.log("OTP Error:", error);
      Alert.alert("Error", "OTP nahi gaya. Network check karein.");
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (!otp) return Alert.alert("Error", "OTP bhariye.");
    setLoading(true);
    try {
      const result = await confirmData.confirm(otp);
      await syncUserToDb(result.user);
    } catch (error) { Alert.alert("Error", "Galat OTP!"); }
    finally { setLoading(false); }
  };

  // --- EMAIL AUTH LOGIC ---
  const handleEmailAuth = async () => {
    if (!email || !password) return Alert.alert("Error", "Email aur Password bhariye.");
    setLoading(true);
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      await syncUserToDb(userCredential.user);
    } catch (error) {
      Alert.alert("Auth Error", error.message);
    } finally { setLoading(false); }
  };

  // --- GOOGLE LOGIN ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      if (Platform.OS === 'web') {
        const result = await signInWithPopup(auth, provider);
        await syncUserToDb(result.user);
      } else {
        await signInWithRedirect(auth, provider);
      }
    } catch (error) { Alert.alert("Error", "Google login failed."); }
    finally { setLoading(false); }
  };

  if (checkingAuth) return <View style={styles.loader}><ActivityIndicator size="large" color="#D4AF37" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {Platform.OS !== 'web' && (
        <FirebaseRecaptchaVerifierModal 
          ref={recaptchaVerifier} 
          firebaseConfig={auth.app.options} 
          attemptInvisibleVerification={true} 
        />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.brand}>SPC PATNA</Text>
          <Text style={styles.motto}>Premium Home Services</Text>

          <View style={styles.tabBar}>
            <TouchableOpacity onPress={() => {setAuthMode('phone'); setConfirmData(null);}} style={[styles.tab, authMode === 'phone' && styles.activeTab]}>
              <Text style={[styles.tabText, authMode === 'phone' && styles.activeTabText]}>Mobile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAuthMode('email')} style={[styles.tab, authMode === 'email' && styles.activeTab]}>
              <Text style={[styles.tabText, authMode === 'email' && styles.activeTabText]}>Email</Text>
            </TouchableOpacity>
          </View>

          {authMode === 'phone' ? (
            <View>
              {!confirmData ? (
                <>
                  <TextInput style={styles.input} placeholder="Enter Mobile Number" keyboardType="phone-pad" onChangeText={setPhone} maxLength={10} placeholderTextColor="#94A3B8" />
                  <TouchableOpacity style={styles.mainBtn} onPress={handlePhoneSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="#002D62" /> : <Text style={styles.btnText}>SEND OTP</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput style={styles.input} placeholder="6-digit OTP" keyboardType="number-pad" onChangeText={setOtp} maxLength={6} placeholderTextColor="#94A3B8" />
                  <TouchableOpacity style={styles.mainBtn} onPress={verifyOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#002D62" /> : <Text style={styles.btnText}>VERIFY OTP</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <View>
              {!isLogin && <TextInput style={styles.input} placeholder="Full Name" onChangeText={setName} placeholderTextColor="#94A3B8" />}
              <TextInput style={styles.input} placeholder="Email Address" onChangeText={setEmail} autoCapitalize="none" placeholderTextColor="#94A3B8" />
              <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} placeholderTextColor="#94A3B8" />
              <TouchableOpacity style={styles.mainBtn} onPress={handleEmailAuth} disabled={loading}>
                {loading ? <ActivityIndicator color="#002D62" /> : <Text style={styles.btnText}>{isLogin ? 'LOGIN' : 'REGISTER'}</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.separator}><View style={styles.line} /><Text style={styles.orText}>OR</Text><View style={styles.line} /></View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
            <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={styles.googleIcon} />
            <Text style={styles.googleBtnText}>Google Se Judein</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
            <Text style={styles.switchText}>{isLogin ? "Naya Account Banayein" : "Account Hai? Login Karein"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ... Styles wahi rahenge jo aapne bheje hain ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#002D62' },
  loader: { flex: 1, backgroundColor: '#002D62', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFF', padding: 25, borderRadius: 30, elevation: 10 },
  brand: { fontSize: 32, fontWeight: 'bold', color: '#002D62', textAlign: 'center' },
  motto: { textAlign: 'center', color: '#D4AF37', marginBottom: 20, fontWeight: '600' },
  tabBar: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, marginBottom: 20, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FFF', elevation: 2 },
  tabText: { color: '#64748B', fontWeight: 'bold' },
  activeTabText: { color: '#002D62' },
  input: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  mainBtn: { backgroundColor: '#D4AF37', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#002D62', fontWeight: 'bold', fontSize: 16 },
  separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText: { marginHorizontal: 10, color: '#94A3B8', fontWeight: 'bold' },
  googleBtn: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  googleIcon: { width: 22, height: 22, marginRight: 10 },
  googleBtnText: { color: '#1E293B', fontWeight: 'bold' },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#002D62', fontWeight: 'bold' }
});

export default AuthScreen;
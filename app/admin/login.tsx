// @ts-nocheck
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Platform,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  // Refs for smooth focus transition
  const passwordRef = useRef(null);

  const handleLogin = async () => {
    // Basic Validation
    if (!email.trim() || !password) {
      const msg = "Bhai, Email aur Password bharna zaroori hai!";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Input Required", msg);
      return;
    }

    setLoading(true);
    try {
      // Login attempt
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      
      console.log("✅ Admin Authenticated:", userCredential.user.uid);
      
      // Dashboard par redirect
      router.replace('/admin'); 
    } catch (error) {
      console.error("❌ Login Error Code:", error.code);
      
      let errorMessage = "Access Denied! Details galat hain.";
      
      // Detailed Error Messages
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = "Email ka format sahi nahi hai.";
          break;
        case 'auth/user-not-found':
          errorMessage = "Ye Admin registered nahi hai.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Password galat hai, firse check karein.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Bahut zyada attempts! Thodi der baad try karein.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Internet connection check karein.";
          break;
      }

      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert("Security Alert", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <View style={styles.iconHeader}>
            <Ionicons name="shield-checkmark" size={60} color="#D4AF37" />
          </View>
          
          <Text style={styles.title}>SPC ADMIN GATE</Text>
          <Text style={styles.subtitle}>Authorized Personnel Access Only</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#D4AF37" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Admin Email" 
              placeholderTextColor="#94A3B8"
              value={email} 
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current.focus()}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#D4AF37" style={styles.inputIcon} />
            <TextInput 
              ref={passwordRef}
              style={styles.input} 
              placeholder="Secret Password" 
              placeholderTextColor="#94A3B8"
              value={password} 
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
               <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={handleLogin} 
            style={[styles.btn, loading && { opacity: 0.7 }]} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#001529" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.btnText}>UNLOCK SYSTEM</Text>
                <Ionicons name="chevron-forward" size={18} color="#001529" />
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={styles.footerInfo}>Patna HQ Security v2.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { 
    backgroundColor: '#001c3d', 
    padding: 30, 
    borderRadius: 30, 
    borderWidth: 1, 
    borderColor: '#D4AF37',
    elevation: 20,
    shadowColor: '#D4AF37',
    shadowOpacity: 0.1,
    shadowRadius: 20
  },
  iconHeader: { alignItems: 'center', marginBottom: 15 },
  title: { color: '#D4AF37', fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  subtitle: { color: '#64748B', textAlign: 'center', marginBottom: 35, fontSize: 12, letterSpacing: 0.5 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    marginBottom: 20,
    paddingHorizontal: 15
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 18, fontSize: 16, color: '#000', fontWeight: '500' },
  eyeIcon: { padding: 5 },
  btn: { backgroundColor: '#D4AF37', padding: 20, borderRadius: 15, marginTop: 10 },
  btnContent: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#001529', fontWeight: '900', fontSize: 16, marginRight: 5 },
  footerInfo: { textAlign: 'center', color: '#334155', marginTop: 25, fontSize: 10, letterSpacing: 1, fontWeight: 'bold' }
});
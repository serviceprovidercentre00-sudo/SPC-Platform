// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      // Sirf aapka email aur password kaam karega
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/admin/'); // Login hote hi dashboard par
    } catch (error) {
      Alert.alert("Access Denied", "Galat details! Hackers ke liye yahan jagah nahi hai.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SPC SECURITY CHECK</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Admin Email" 
        value={email} 
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Secret Password" 
        value={password} 
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity onPress={handleLogin} style={styles.btn}>
        <Text style={{color:'#fff', fontWeight:'bold'}}>UNLOCK SYSTEM</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529', justifyContent: 'center', padding: 30 },
  title: { color: '#D4AF37', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  btn: { backgroundColor: '#D4AF37', padding: 18, borderRadius: 10, alignItems: 'center' }
});
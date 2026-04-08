// @ts-nocheck
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../config/firebase';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Profile States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (curr) => {
      setUser(curr);
      if (curr) {
        // Firestore se user ka purana data lana
        const userDoc = await getDoc(doc(db, "users", curr.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.displayName || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleUpdateProfile = async () => {
    if (!name || !phone) {
      Alert.alert("Error", "Name aur Phone number zaroori hai.");
      return;
    }
    
    setUpdating(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        displayName: name,
        phone: phone,
        address: address,
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      Alert.alert("Success! 🎉", "Aapka profile update ho gaya hai.");
    } catch (error) {
      console.error(error);
      Alert.alert("Update Failed", "Data save karne mein problem aayi.");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#002D62" />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContent}>
          <View style={styles.iconCircle}><Text style={{ fontSize: 60 }}>👤</Text></View>
          <Text style={styles.guestTitle}>Aapka Account</Text>
          <Text style={styles.guestSub}>Bookings manage karne ke liye login karein.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/auth')}>
            <Text style={styles.primaryBtnText}>LOGIN / SIGNUP ➔</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitial}>{name ? name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userStatus}>SPC Premium Member ✅</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>EDIT PROFILE DETAILS</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Apna Naam Likhein" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="WhatsApp Number" keyboardType="numeric" maxLength={10} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Default Address (Patna)</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Ghar ka pata" multiline />
          </View>

          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateProfile} disabled={updating}>
            {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.updateBtnText}>SAVE CHANGES</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout from Account</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>SPC Patna - v1.0.5</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  guestContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  guestTitle: { fontSize: 24, fontWeight: 'bold', color: '#002D62' },
  guestSub: { textAlign: 'center', color: '#64748B', marginBottom: 30 },
  primaryBtn: { backgroundColor: '#002D62', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: 'bold' },
  profileHeader: { alignItems: 'center', padding: 30, backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarInitial: { fontSize: 28, color: '#FFF', fontWeight: 'bold' },
  userEmail: { fontSize: 16, color: '#64748B' },
  userStatus: { fontSize: 12, color: '#10B981', fontWeight: '600', marginTop: 5 },
  formSection: { padding: 20, marginTop: 10 },
  sectionLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold', marginBottom: 15 },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 13, color: '#002D62', fontWeight: '600', marginBottom: 5 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, borderWeight: 1, borderColor: '#E2E8F0', fontSize: 15 },
  updateBtn: { backgroundColor: '#002D62', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  updateBtnText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 16 },
  logoutBtn: { margin: 20, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  logoutBtnText: { color: '#EF4444', fontWeight: '600' },
  versionText: { textAlign: 'center', color: '#CBD5E1', fontSize: 10, marginBottom: 20 }
});
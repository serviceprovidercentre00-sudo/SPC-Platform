// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
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
      Alert.alert("Required", "Naam aur Phone number zaroori hai.");
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
      Alert.alert("Error", "Update nahi ho paya.");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
      { text: "Nahi", style: "cancel" },
      { text: "Haan", onPress: async () => {
          await signOut(auth);
          router.replace('/');
      }}
    ]);
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
          <View style={styles.iconCircle}>
             <Ionicons name="person-circle" size={100} color="#002D62" />
          </View>
          <Text style={styles.guestTitle}>Account Login</Text>
          <Text style={styles.guestSub}>Bookings aur payments track karne ke liye login karein.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/auth')}>
            <Text style={styles.primaryBtnText}>LOGIN / SIGNUP ➔</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002D62" />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Profile Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitial}>
              {name ? name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userNameText}>{name || 'SPC User'}</Text>
          <Text style={styles.userEmailText}>{user.email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.premiumBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#D4AF37" />
              <Text style={styles.premiumText}>Verified Member</Text>
            </View>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>ACCOUNT SETTINGS</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#002D62" style={styles.inputIcon} />
            <View style={{flex: 1}}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="Name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#002D62" style={styles.inputIcon} />
            <View style={{flex: 1}}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput 
                style={styles.input} 
                value={phone} 
                onChangeText={setPhone} 
                placeholder="WhatsApp No" 
                keyboardType="numeric" 
                maxLength={10} 
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#002D62" style={styles.inputIcon} />
            <View style={{flex: 1}}>
              <Text style={styles.label}>Service Address (Patna)</Text>
              <TextInput 
                style={[styles.input, {height: 60}]} 
                value={address} 
                onChangeText={setAddress} 
                placeholder="Street, Area, Landmark..." 
                multiline
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateProfile} disabled={updating}>
            {updating ? <ActivityIndicator color="#002D62" /> : <Text style={styles.updateBtnText}>SAVE CHANGES</Text>}
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('tel:+918409372138')}>
                <Ionicons name="help-buoy-outline" size={22} color="#64748B" />
                <Text style={styles.menuText}>Support Helpdesk</Text>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text style={[styles.menuText, {color: '#EF4444'}]}>Logout</Text>
            </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Service Provider Centre | v1.0.5</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  guestContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  iconCircle: { marginBottom: 20 },
  guestTitle: { fontSize: 24, fontWeight: 'bold', color: '#002D62' },
  guestSub: { textAlign: 'center', color: '#64748B', marginBottom: 30, lineHeight: 20 },
  primaryBtn: { backgroundColor: '#002D62', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 5 },
  primaryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  headerCard: { backgroundColor: '#002D62', padding: 30, alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 10 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 3, borderColor: '#D4AF37' },
  avatarInitial: { fontSize: 32, color: '#002D62', fontWeight: 'bold' },
  userNameText: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  userEmailText: { fontSize: 14, color: '#CBD5E1', marginTop: 4 },
  badgeRow: { marginTop: 12 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.15)', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#D4AF37' },
  premiumText: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },

  formSection: { padding: 20, marginTop: 10 },
  sectionLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold', marginBottom: 20, letterSpacing: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 16, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', elevation: 2 },
  inputIcon: { marginRight: 15 },
  label: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  input: { fontSize: 15, color: '#1E293B', paddingVertical: 5, fontWeight: '500' },

  updateBtn: { backgroundColor: '#D4AF37', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, elevation: 3 },
  updateBtnText: { color: '#002D62', fontWeight: 'bold', fontSize: 16 },

  menuBox: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 20, paddingVertical: 5, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  menuText: { flex: 1, marginLeft: 15, fontSize: 15, fontWeight: '600', color: '#1E293B' },

  versionText: { textAlign: 'center', color: '#CBD5E1', fontSize: 11, marginVertical: 30 }
});
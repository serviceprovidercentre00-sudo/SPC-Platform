// @ts-nocheck
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
  View,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as Location from 'expo-location'; 
import { auth, db } from '../../config/firebase';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (curr) => {
      if (curr) {
        setUser(curr);
        try {
          const userDoc = await getDoc(doc(db, "users", curr.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setName(data.displayName || '');
            setPhone(data.phone || '');
            setAddress(data.address || '');
            setIsEditing(!(data.displayName && data.phone));
          } else {
            setIsEditing(true);
          }
        } catch (err) {
          console.error("Firestore Error:", err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Location allow karein.");
      return;
    }

    setUpdating(true);
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;

      if (Platform.OS === 'web') {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        if (data.display_name) setAddress(data.display_name);
        else setAddress(`Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`);
      } else {
        let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocode.length > 0) {
          let item = reverseGeocode[0];
          setAddress(`${item.name || ''}, ${item.street || ''}, ${item.city || 'Patna'}`);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Location nahi mil saki.");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name || !phone) {
      Alert.alert("Required", "Naam aur Phone number zaroori hai.");
      return;
    }
    setUpdating(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        displayName: name,
        phone: phone,
        address: address,
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setIsEditing(false);
      Alert.alert("Success!", "Profile update ho gayi.");
    } catch (error) {
      Alert.alert("Error", "Save nahi ho paya.");
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 LOGOUT FIXED LOGIC
  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await signOut(auth);
        setUser(null);
        
        if (Platform.OS === 'web') {
          // Web par hard redirect zaroori hai session clear karne ke liye
          window.location.href = '/auth';
        } else {
          router.replace('/auth');
        }
      } catch (e) {
        Alert.alert("Error", "Logout fail.");
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("Kya aap logout karna chahte hain?")) performLogout();
    } else {
      Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
        { text: "Nahi", style: "cancel" },
        { text: "Haan", onPress: performLogout }
      ]);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#002D62" /></View>;

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContent}>
          <Ionicons name="person-circle" size={100} color="#002D62" />
          <Text style={styles.guestTitle}>Account Login</Text>
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
        <View style={styles.headerCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitial}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
          </View>
          <Text style={styles.userNameText}>{name || 'SPC User'}</Text>
          <Text style={styles.userEmailText}>{user.email}</Text>
          <TouchableOpacity style={styles.editToggle} onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editToggleText}>{isEditing ? "Cancel" : "Edit Profile"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>ACCOUNT SETTINGS</Text>
          {[
            { label: 'Full Name', value: name, setter: setName, icon: 'person-outline' },
            { label: 'Phone Number', value: phone, setter: setPhone, icon: 'call-outline', type: 'numeric' }
          ].map((item, index) => (
            <View key={index} style={styles.inputCard}>
              <Ionicons name={item.icon} size={20} color="#002D62" style={styles.inputIcon} />
              <View style={{flex: 1}}>
                <Text style={styles.label}>{item.label}</Text>
                {isEditing ? (
                  <TextInput style={styles.input} value={item.value} onChangeText={item.setter} keyboardType={item.type || 'default'} />
                ) : (
                  <Text style={styles.detailValue}>{item.value || 'Not set'}</Text>
                )}
              </View>
            </View>
          ))}

          <View style={styles.inputCard}>
            <Ionicons name="location-outline" size={20} color="#002D62" style={styles.inputIcon} />
            <View style={{flex: 1}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={styles.label}>Address (Patna Area)</Text>
                {isEditing && (
                  <TouchableOpacity onPress={getCurrentLocation}>
                    <Text style={{fontSize: 11, color: '#D4AF37', fontWeight: 'bold'}}>AUTO-FILL</Text>
                  </TouchableOpacity>
                )}
              </View>
              {isEditing ? (
                <TextInput style={[styles.input, {minHeight: 50}]} value={address} onChangeText={setAddress} multiline />
              ) : (
                <Text style={styles.detailValue}>{address || 'Not set'}</Text>
              )}
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateProfile} disabled={updating}>
              {updating ? <ActivityIndicator color="#002D62" /> : <Text style={styles.updateBtnText}>SAVE DETAILS</Text>}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.menuBox}>
          <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('tel:+918409372138')}>
            <Ionicons name="help-buoy-outline" size={22} color="#64748B" />
            <Text style={styles.menuText}>Support Helpdesk</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={[styles.menuText, {color: '#EF4444'}]}>Logout Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  guestContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  guestTitle: { fontSize: 24, fontWeight: 'bold', color: '#002D62', marginBottom: 20 },
  primaryBtn: { backgroundColor: '#002D62', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: 'bold' },
  headerCard: { backgroundColor: '#002D62', padding: 30, alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 3, borderColor: '#D4AF37' },
  avatarInitial: { fontSize: 32, color: '#002D62', fontWeight: 'bold' },
  userNameText: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  userEmailText: { fontSize: 14, color: '#CBD5E1', marginTop: 4 },
  editToggle: { marginTop: 15, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 5, borderRadius: 15 },
  editToggleText: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold' },
  formSection: { padding: 20 },
  sectionLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold', marginBottom: 15 },
  inputCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 16, 
    marginBottom: 15,
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' },
      android: { elevation: 3 },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
    })
  },
  inputIcon: { marginRight: 15 },
  label: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  input: { fontSize: 15, color: '#1E293B', marginTop: 5 },
  detailValue: { fontSize: 15, color: '#1E293B', fontWeight: 'bold', marginTop: 5 },
  updateBtn: { backgroundColor: '#D4AF37', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  updateBtnText: { color: '#002D62', fontWeight: 'bold' },
  menuBox: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 20, marginBottom: 40 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  menuText: { flex: 1, marginLeft: 15, fontSize: 15, fontWeight: '600' }
});
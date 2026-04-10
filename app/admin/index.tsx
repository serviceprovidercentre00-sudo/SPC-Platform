// @ts-nocheck
import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Image, Linking, Platform 
} from 'react-native';

// Firebase Imports
import { db } from '../../config/firebase'; 
import { 
  collection, addDoc, serverTimestamp, query, onSnapshot, orderBy 
} from "firebase/firestore";
import * as ImagePicker from 'expo-image-picker';

export default function AdminMain() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passkey, setPasskey] = useState('');
  const SECRET_ADMIN_KEY = "SPC_PATNA_2026"; 

  if (!isAdmin) {
    return (
      <View style={styles.authContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.lockCard}>
          <Text style={styles.lockEmoji}>🔐</Text>
          <Text style={styles.lockTitle}>SPC CONTROL CENTER</Text>
          <TextInput 
            style={styles.authInput} 
            placeholder="Enter Admin Key" 
            placeholderTextColor="#999"
            secureTextEntry={true}
            onChangeText={setPasskey}
          />
          <TouchableOpacity 
            style={styles.unlockBtn} 
            onPress={() => passkey === SECRET_ADMIN_KEY ? setIsAdmin(true) : Alert.alert("Access Denied", "Wrong Key")}
          >
            <Text style={styles.unlockBtnText}>LOGIN AS ADMIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(false);

  // Data States
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // Form States
  const [serviceForm, setServiceForm] = useState({ name: '', price: '', image: null });
  const [techForm, setTechForm] = useState({ name: '', phone: '', skill: '', image: null });
  const [adForm, setAdForm] = useState({ title: '', image: null });

  useEffect(() => {
    // 1. Real-time Bookings (Orders)
    const unsubBookings = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Real-time Technicians (Workers)
    const unsubTechs = onSnapshot(query(collection(db, "workers"), orderBy("createdAt", "desc")), (snap) => {
      setTechnicians(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Real-time Users (Customers)
    const unsubUsers = onSnapshot(query(collection(db, "users"), orderBy("lastLogin", "desc")), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubBookings(); unsubTechs(); unsubUsers(); };
  }, []);

  // --- Image Upload (Cloudinary) ---
  const uploadToCloudinary = async (uri) => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;
      formData.append('file', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type: type,
        name: filename || 'upload.jpg',
      });
      formData.append('upload_preset', 'spc_uploads'); 
      formData.append('cloud_name', 'dmp860spk');

      const response = await fetch('https://api.cloudinary.com/v1_1/dmp860spk/image/upload', { method: 'POST', body: formData });
      const data = await response.json();
      return data.secure_url || null;
    } catch (err) { return null; }
  };

  const pickImage = async (setter) => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.3 });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  const handleSave = async (col, data, reset) => {
    if (!data.name && !data.title) return Alert.alert("Error", "Details bhariye!");
    setLoading(true);
    try {
      let finalData = { ...data };
      if (data.image) {
        const url = await uploadToCloudinary(data.image);
        if (url) { finalData.image = url; finalData.img = url; }
      }
      if (finalData.price) finalData.price = Number(finalData.price);
      await addDoc(collection(db, col), { ...finalData, createdAt: serverTimestamp() });
      Alert.alert("Success", "Data Published!");
      reset();
    } catch (e) { Alert.alert("Error", e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'SPC Admin Panel', headerShown: true }} />
      
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'bookings', label: '📥 Orders' },
            { id: 'users', label: '👥 Customers' },
            { id: 'services', label: '🛠️ Services' },
            { id: 'techs', label: '👷 Workers' },
            { id: 'ads', label: '🖼️ Banners' },
            { id: 'payments', label: '💰 Payments' }
          ].map((tab) => (
            <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} style={[styles.tab, activeTab === tab.id && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && <ActivityIndicator size="large" color="#002D62" style={{margin:20}} />}

        {/* 1. ORDERS TAB */}
        {activeTab === 'bookings' && bookings.map(item => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.statusBadge}>NEW ORDER</Text>
            <Text style={styles.boldText}>User: {item.customerName || 'Customer'}</Text>
            <Text style={styles.smallText}>📍 {item.customerAddress}</Text>
            <Text style={styles.smallText}>📱 {item.customerPhone}</Text>
            <Text style={styles.itemTag}>Services: {item.items?.map(i => i.name).join(', ')}</Text>
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${item.customerPhone}`)}>
              <Text style={styles.btnText}>CALL CUSTOMER</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* 2. CUSTOMERS TAB (Users only) */}
        {activeTab === 'users' && users.map(u => (
          <View key={u.id} style={styles.userCard}>
            <Text style={styles.boldText}>👤 {u.name || 'No Name'}</Text>
            <Text style={styles.smallText}>✉️ {u.email}</Text>
            <Text style={styles.smallText}>📞 {u.phone || 'No Phone'}</Text>
            <Text style={styles.smallText}>📍 {u.address || 'Patna'}</Text>
          </View>
        ))}

        {/* 3. ADD SERVICE */}
        {activeTab === 'services' && (
          <View style={styles.formCard}>
            <TextInput style={styles.input} placeholder="Service Name" value={serviceForm.name} onChangeText={t => setServiceForm({...serviceForm, name: t})} />
            <TextInput style={styles.input} placeholder="Price (₹)" keyboardType="numeric" value={serviceForm.price} onChangeText={t => setServiceForm({...serviceForm, price: t})} />
            <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage((uri) => setServiceForm({...serviceForm, image: uri}))}>
              {serviceForm.image ? <Image source={{uri: serviceForm.image}} style={styles.previewImg} /> : <Text>📷 Select Image</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={() => handleSave("services", serviceForm, () => setServiceForm({name:'', price:'', image:null}))}>
              <Text style={styles.btnText}>PUBLISH SERVICE</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. WORKERS TAB */}
        {activeTab === 'techs' && (
          <View>
            <View style={styles.formCard}>
              <TextInput style={styles.input} placeholder="Worker Name" value={techForm.name} onChangeText={t => setTechForm({...techForm, name: t})} />
              <TextInput style={styles.input} placeholder="Skill (AC, Plumber...)" value={techForm.skill} onChangeText={t => setTechForm({...techForm, skill: t})} />
              <TouchableOpacity style={styles.saveBtn} onPress={() => handleSave("workers", techForm, () => setTechForm({name:'', phone:'', skill:'', image:null}))}>
                <Text style={styles.btnText}>ADD WORKER</Text>
              </TouchableOpacity>
            </View>
            {technicians.map(t => (
              <View key={t.id} style={styles.card}><Text style={styles.boldText}>👷 {t.name} ({t.skill})</Text></View>
            ))}
          </View>
        )}

        {/* 5. PAYMENTS TAB */}
        {activeTab === 'ads' && (
           <View style={styles.formCard}>
              <TextInput style={styles.input} placeholder="Banner Title" value={adForm.title} onChangeText={t => setAdForm({...adForm, title: t})} />
              <TouchableOpacity style={styles.adBox} onPress={() => pickImage((uri) => setAdForm({...adForm, image: uri}))}>
                {adForm.image ? <Image source={{uri: adForm.image}} style={styles.previewImg} /> : <Text>🖼️ Upload Banner</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, {backgroundColor:'#D4AF37'}]} onPress={() => handleSave("banners", adForm, () => setAdForm({title:'', image:null}))}>
                <Text style={[styles.btnText, {color:'#002D62'}]}>SAVE BANNER</Text>
              </TouchableOpacity>
           </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.card}>
            <Text style={styles.boldText}>💰 Payment Status</Text>
            <Text style={{marginTop:10, color:'#666'}}>Orders ke sath payment status update karne ka feature testing mein hai.</Text>
            {bookings.map(b => b.paymentStatus && (
               <View key={b.id} style={styles.itemTag}>
                  <Text>{b.customerName}: {b.paymentStatus}</Text>
               </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F3F5' },
  authContainer: { flex: 1, backgroundColor: '#002D62', justifyContent: 'center', padding: 30 },
  lockCard: { backgroundColor: '#FFF', padding: 40, borderRadius: 25, alignItems: 'center' },
  lockEmoji: { fontSize: 50, marginBottom: 15 },
  lockTitle: { fontSize: 20, fontWeight: 'bold', color: '#002D62', marginBottom: 25 },
  authInput: { width: '100%', height: 50, borderBottomWidth: 2, borderColor: '#D4AF37', marginBottom: 30, textAlign: 'center', fontSize: 18 },
  unlockBtn: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
  unlockBtnText: { color: '#002D62', fontWeight: 'bold' },
  tabBar: { backgroundColor: '#002D62', height: 60 },
  tab: { paddingHorizontal: 20, justifyContent: 'center' },
  activeTab: { borderBottomWidth: 4, borderBottomColor: '#D4AF37' },
  tabText: { color: '#CCC', fontSize: 13 },
  activeTabText: { color: '#D4AF37', fontWeight: 'bold' },
  content: { padding: 15 },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 12, elevation: 3, borderLeftWidth: 4, borderLeftColor: '#D4AF37' },
  userCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#DDD' },
  formCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, elevation: 4 },
  input: { backgroundColor: '#F9F9F9', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  uploadBox: { height: 100, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 15, overflow:'hidden' },
  adBox: { height: 150, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 15, overflow:'hidden' },
  previewImg: { width: '100%', height: '100%' },
  saveBtn: { backgroundColor: '#002D62', padding: 15, borderRadius: 10, alignItems: 'center' },
  callBtn: { backgroundColor: '#28A745', padding: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  boldText: { fontSize: 16, fontWeight: 'bold' },
  smallText: { fontSize: 12, color: '#666', marginTop: 3 },
  statusBadge: { backgroundColor: '#D4AF37', alignSelf: 'flex-start', padding: 3, borderRadius: 4, fontSize: 9, fontWeight: 'bold', marginBottom: 5 },
  itemTag: { backgroundColor: '#F0F0F0', padding: 8, borderRadius: 5, marginTop: 5 }
});
import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Image, Linking, Platform 
} from 'react-native';

// Firebase Imports
import { db } from '../../config/firebase'; 
import { 
  collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, getDocs 
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

  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  const [serviceForm, setServiceForm] = useState({ name: '', price: '', image: null });
  const [techForm, setTechForm] = useState({ name: '', phone: '', skill: '', image: null });
  const [adForm, setAdForm] = useState({ title: '', image: null });

  useEffect(() => {
    const qBookings = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubBookings = onSnapshot(qBookings, (snap) => setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    const qTechs = query(collection(db, "workers"), orderBy("createdAt", "desc"));
    const unsubTechs = onSnapshot(qTechs, (snap) => setTechnicians(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(doc => doc.data()));
    };
    fetchUsers();

    return () => { unsubBookings(); unsubTechs(); };
  }, []);

  // --- INTERNAL FIX: Cloudinary Upload (Android Friendly) ---
  const uploadToCloudinary = async (uri: string) => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('file', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type: type,
        name: filename || 'upload.jpg',
      } as any);

      formData.append('upload_preset', 'spc_uploads'); 
      formData.append('cloud_name', 'dmp860spk');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dmp860spk/image/upload', 
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      return data.secure_url || null;
    } catch (err) {
      console.log("Upload Error:", err);
      return null;
    }
  };

  const pickImage = async (setter: Function) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.3,
    });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  // --- INTERNAL FIX: Dual Field Mapping (img & image) ---
  const handleSave = async (col: string, data: any, reset: Function) => {
    if (!data.name && !data.title) {
        Alert.alert("Error", "Please fill name/title");
        return;
    }
    setLoading(true);
    try {
      let finalData = { ...data };
      if (data.image) {
        const imageUrl = await uploadToCloudinary(data.image);
        if (imageUrl) {
          finalData.image = imageUrl;   // Naye code ke liye
          finalData.img = imageUrl;     // Purane code ke liye
          finalData.imageUrl = imageUrl; // Safe side ke liye
        }
      }
      
      // Price format fix
      if (finalData.price) finalData.price = Number(finalData.price);

      await addDoc(collection(db, col), { ...finalData, createdAt: serverTimestamp() });
      Alert.alert("Success", "Data Published to SPC App!");
      reset();
    } catch (e: any) { 
      Alert.alert("Error", e.message); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'SPC Admin', headerShown: true }} />
      
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'bookings', label: '📥 Bookings' },
            { id: 'users', label: '👥 Users' },
            { id: 'services', label: '🛠️ Add Service' },
            { id: 'techs', label: '👷 Technicians' },
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
        {loading && <ActivityIndicator size="large" color="#002D62" style={{margin: 20}} />}

        {activeTab === 'bookings' && (
          bookings.map(item => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.statusBadge}>NEW ORDER</Text>
              <Text style={styles.boldText}>Customer: {item.customerName || 'User'}</Text>
              <Text style={styles.smallText}>📞 {item.customerPhone}</Text>
              <Text style={styles.smallText}>📍 {item.customerAddress}</Text>
              <Text style={styles.itemTag}>Service: {item.items?.map((i: any) => i.name).join(', ')}</Text>
              <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${item.customerPhone}`)}>
                <Text style={styles.btnText}>CALL NOW</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {activeTab === 'users' && (
          users.map((u, index) => (
            <View key={index} style={styles.userCard}>
              <Text style={styles.boldText}>{u.name || 'Anonymous'}</Text>
              <Text style={styles.smallText}>✉️ {u.email}</Text>
              <Text style={styles.smallText}>Joined: {u.createdAt?.toDate().toLocaleDateString()}</Text>
            </View>
          ))
        )}

        {activeTab === 'services' && (
          <View style={styles.formCard}>
            <TextInput style={styles.input} placeholder="Service Name (e.g. AC Repair)" value={serviceForm.name} onChangeText={t => setServiceForm({...serviceForm, name: t})} />
            <TextInput style={styles.input} placeholder="Price (₹)" keyboardType="numeric" value={serviceForm.price} onChangeText={t => setServiceForm({...serviceForm, price: t})} />
            <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage((uri:any) => setServiceForm({...serviceForm, image: uri}))}>
              {serviceForm.image ? <Image source={{uri: serviceForm.image}} style={styles.previewImg} /> : <Text>📷 Select Service Image</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={() => handleSave("services", serviceForm, () => setServiceForm({name:'', price:'', image:null}))}>
              <Text style={styles.btnText}>ADD TO APP</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'techs' && (
          <View>
            <View style={styles.formCard}>
              <TextInput style={styles.input} placeholder="Worker Name" value={techForm.name} onChangeText={t => setTechForm({...techForm, name: t})} />
              <TextInput style={styles.input} placeholder="Phone Number" keyboardType="numeric" value={techForm.phone} onChangeText={t => setTechForm({...techForm, phone: t})} />
              <TextInput style={styles.input} placeholder="Specialty (AC, Fridge, etc.)" value={techForm.skill} onChangeText={t => setTechForm({...techForm, skill: t})} />
              <TouchableOpacity style={styles.saveBtn} onPress={() => handleSave("workers", techForm, () => setTechForm({name:'', phone:'', skill:'', image:null}))}>
                <Text style={styles.btnText}>REGISTER TECHNICIAN</Text>
              </TouchableOpacity>
            </View>
            {technicians.map(t => (
              <View key={t.id} style={styles.card}>
                <Text style={styles.boldText}>👷 {t.name}</Text>
                <Text style={styles.smallText}>Skill: {t.skill} | 📞 {t.phone}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'ads' && (
          <View style={styles.formCard}>
            <TextInput style={styles.input} placeholder="Banner Title" value={adForm.title} onChangeText={t => setAdForm({...adForm, title: t})} />
            <TouchableOpacity style={styles.adBox} onPress={() => pickImage((uri:any) => setAdForm({...adForm, image: uri}))}>
              {adForm.image ? <Image source={{uri: adForm.image}} style={styles.previewImg} /> : <Text>🖼️ Upload Banner (16:9)</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, {backgroundColor: '#D4AF37'}]} onPress={() => handleSave("banners", adForm, () => setAdForm({title:'', image:null}))}>
              <Text style={[styles.btnText, {color: '#002D62'}]}>PUBLISH BANNER</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.card}>
            <Text style={styles.boldText}>Total Revenue: ₹0.00</Text>
            <Text style={styles.smallText}>Online payments integration is pending.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F3F5' },
  authContainer: { flex: 1, backgroundColor: '#002D62', justifyContent: 'center', padding: 30 },
  lockCard: { backgroundColor: '#FFF', padding: 40, borderRadius: 25, alignItems: 'center', elevation: 10 },
  lockEmoji: { fontSize: 50, marginBottom: 15 },
  lockTitle: { fontSize: 22, fontWeight: 'bold', color: '#002D62', marginBottom: 25 },
  authInput: { width: '100%', height: 50, borderBottomWidth: 2, borderColor: '#D4AF37', marginBottom: 30, textAlign: 'center', fontSize: 20, color: '#333' },
  unlockBtn: { backgroundColor: '#D4AF37', paddingVertical: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
  unlockBtnText: { color: '#002D62', fontWeight: 'bold', fontSize: 16 },
  tabBar: { backgroundColor: '#002D62', height: 60 },
  tab: { paddingHorizontal: 20, justifyContent: 'center', height: '100%' },
  activeTab: { borderBottomWidth: 4, borderBottomColor: '#D4AF37' },
  tabText: { color: '#CCC', fontWeight: '600' },
  activeTabText: { color: '#D4AF37' },
  content: { padding: 15 },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 3, borderLeftWidth: 5, borderLeftColor: '#D4AF37' },
  userCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  formCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, elevation: 5, marginBottom: 20 },
  input: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  uploadBox: { height: 120, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CCC', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  adBox: { height: 180, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CCC', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%' },
  saveBtn: { backgroundColor: '#002D62', padding: 18, borderRadius: 10, alignItems: 'center' },
  callBtn: { backgroundColor: '#28A745', padding: 12, borderRadius: 8, marginTop: 15, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  boldText: { fontSize: 17, fontWeight: 'bold', color: '#222' },
  smallText: { fontSize: 13, color: '#666', marginTop: 4 },
  statusBadge: { backgroundColor: '#D4AF37', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, fontSize: 10, color: '#002D62', fontWeight: 'bold', marginBottom: 5 },
  itemTag: { backgroundColor: '#F0F0F0', padding: 8, borderRadius: 5, marginTop: 10, fontSize: 12, color: '#444' }
});

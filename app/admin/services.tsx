// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { db } from '../../config/firebase'; 
import { collection, onSnapshot, doc, deleteDoc, addDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', desc: '', image: null });
  const [editId, setEditId] = useState(null); 
  const [modalVisible, setModalVisible] = useState(false);

  const CLOUD_NAME = "dq5nnb1kn";
  const UPLOAD_PRESET = "spc_preset";

  // --- DATA FETCHING (Service Page par data laane ke liye) ---
  useEffect(() => {
    console.log("Database se connect ho raha hai...");
    const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log("Total Services Mili:", data.length); // Console mein check karein
      setServices(data);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      setLoading(false);
      // Agar yahan error aaye toh iska matlab Rules ka chakkar hai
      Alert.alert("Connection Error", "Firestore Rules check karein!");
    });

    return () => unsubscribe();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', // Naya format
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setForm({ ...form, image: result.assets[0].uri });
    }
  };

  const uploadToCloudinary = async (fileUri) => {
    if (!fileUri || fileUri.startsWith('http')) return fileUri;

    const data = new FormData();
    if (Platform.OS === 'web') {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      data.append('file', blob);
    } else {
      data.append('file', { uri: fileUri, type: 'image/jpeg', name: 'upload.jpg' });
    }

    data.append('upload_preset', UPLOAD_PRESET);
    data.append('cloud_name', CLOUD_NAME);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: data,
    });

    const result = await res.json();
    if (result.secure_url) return result.secure_url;
    throw new Error(result.error?.message || "Upload Failed");
  };

  const saveService = async () => {
    if (!form.name || !form.price || !form.image) {
      return Alert.alert("Wait!", "Sab details bhariye.");
    }
    setBtnLoading(true);
    try {
      const finalUrl = await uploadToCloudinary(form.image);
      const payload = {
        name: form.name,
        price: form.price,
        desc: form.desc || '',
        image: finalUrl,
        updatedAt: serverTimestamp(),
      };

      if (editId) {
        await updateDoc(doc(db, "services", editId), payload);
        Alert.alert("Success", "Update ho gaya!");
      } else {
        await addDoc(collection(db, "services"), { ...payload, createdAt: serverTimestamp() });
        Alert.alert("Success", "Nayi Service Add ho gayi!");
      }
      resetForm();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setBtnLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', price: '', desc: '', image: null });
    setEditId(null);
    setModalVisible(false);
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, price: item.price, desc: item.desc || '', image: item.image });
    setEditId(item.id);
    setModalVisible(true);
  };

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#D4AF37" />
      <Text style={{color:'#fff', marginTop:10}}>Loading Services...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Button */}
      <View style={{padding: 15}}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={24} color="#001529" />
          <Text style={styles.addBtnText}>ADD NEW SERVICE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 100 }}>
        {services.length === 0 ? (
          <Text style={styles.emptyText}>Koi service nahi mili. Nayi add karein!</Text>
        ) : (
          services.map((s) => (
            <View key={s.id} style={styles.card}>
              <Image source={{ uri: s.image }} style={styles.cardImg} />
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.cardTitle}>{s.name}</Text>
                <Text style={styles.cardPrice}>₹{s.price}</Text>
              </View>
              <View style={{flexDirection:'row'}}>
                 <TouchableOpacity onPress={() => handleEdit(s)}><Ionicons name="pencil" size={22} color="#D4AF37" /></TouchableOpacity>
                 <TouchableOpacity onPress={() => deleteDoc(doc(db, "services", s.id))} style={{marginLeft:15}}><Ionicons name="trash" size={22} color="#FF4D4D" /></TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal Wahi Rahega */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={pickImage} style={styles.picker}>
              {form.image ? <Image source={{ uri: form.image }} style={{width:'100%', height:'100%'}} /> : <Ionicons name="camera" size={40} color="#D4AF37" />}
            </TouchableOpacity>
            <TextInput style={styles.input} placeholder="Service Name" value={form.name} onChangeText={t => setForm({...form, name:t})} placeholderTextColor="#666" />
            <TextInput style={styles.input} placeholder="Price" keyboardType="numeric" value={form.price} onChangeText={t => setForm({...form, price:t})} placeholderTextColor="#666" />
            <TextInput style={[styles.input, {height:60}]} placeholder="Description" multiline value={form.desc} onChangeText={t => setForm({...form, desc:t})} placeholderTextColor="#666" />
            
            <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:10}}>
               <TouchableOpacity onPress={resetForm} style={styles.btnCancel}><Text style={{color:'#fff'}}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={saveService} style={styles.btnSave}>
                  {btnLoading ? <ActivityIndicator color="#000" /> : <Text style={{fontWeight:'bold'}}>Save</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  loaderContainer: { flex:1, backgroundColor:'#001529', justifyContent:'center', alignItems:'center' },
  addBtn: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center' },
  addBtnText: { color: '#001529', fontWeight: 'bold', marginLeft: 10 },
  card: { backgroundColor: '#002140', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardImg: { width: 55, height: 55, borderRadius: 8 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cardPrice: { color: '#D4AF37', marginTop: 2 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 50 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#002140', padding: 20, borderRadius: 20 },
  picker: { height: 140, backgroundColor: '#001529', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#D4AF37', borderStyle: 'dashed' },
  input: { backgroundColor: '#001529', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  btnCancel: { backgroundColor: '#333', padding: 15, borderRadius: 10, flex: 0.45, alignItems: 'center' },
  btnSave: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 10, flex: 0.45, alignItems: 'center' }
});
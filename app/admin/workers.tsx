// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { db } from '../../config/firebase'; 
import { collection, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function AdminWorkers() {
  const [workers, setWorkers] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]); // Naya state pending applications ke liye
  const [activeTab, setActiveTab] = useState('approved'); // Tab switch logic
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', category: '', address: '', image: null });

  const CLOUD_NAME = "dq5nnb1kn";
  const UPLOAD_PRESET = "spc_preset";

  useEffect(() => {
    // 1. Approved Workers fetch karein
    const qApproved = query(collection(db, "workers"));
    const unsubApproved = onSnapshot(qApproved, (snapshot) => {
      setWorkers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // 2. Pending Applications fetch karein (Jo join-worker.tsx se aayi hain)
    const qPending = query(collection(db, "worker_applications"), where("status", "==", "pending"));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingWorkers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubApproved(); unsubPending(); };
  }, []);

  // --- Image Upload Logic (Same as your original) ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.5,
    });
    if (!result.canceled) setForm({ ...form, image: result.assets[0].uri });
  };

  const uploadToCloudinary = async (fileUri) => {
    if (!fileUri || fileUri.startsWith('http')) return fileUri;
    const data = new FormData();
    if (Platform.OS === 'web') {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      data.append('file', blob);
    } else {
      data.append('file', { uri: fileUri, type: 'image/jpeg', name: 'worker.jpg' });
    }
    data.append('upload_preset', UPLOAD_PRESET);
    data.append('cloud_name', CLOUD_NAME);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: data });
    const result = await res.json();
    return result.secure_url;
  };

  // --- Save New Worker (Manual Add) ---
  const saveWorker = async () => {
    if (!form.name || !form.category || !form.phone || !form.image) {
      return Alert.alert("Wait!", "Photo, Name, Category aur Number zaroori hai.");
    }
    setBtnLoading(true);
    try {
      const imageUrl = await uploadToCloudinary(form.image);
      await addDoc(collection(db, "workers"), { ...form, image: imageUrl, createdAt: serverTimestamp() });
      setForm({ name: '', email: '', phone: '', category: '', address: '', image: null });
      setModalVisible(false);
      Alert.alert("Success", "Worker add ho gaya!");
    } catch (e) { alert("Error: " + e.message); } finally { setBtnLoading(false); }
  };

  // --- Approve Worker Logic ---
  const handleApprove = async (worker) => {
    setBtnLoading(true);
    try {
      // 1. Approved collection mein dalein
      await addDoc(collection(db, "workers"), {
        name: worker.name,
        phone: worker.phone,
        category: worker.skill || 'General',
        address: worker.area || '',
        image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // Default image agar nahi hai
        createdAt: serverTimestamp()
      });
      // 2. Pending se hatayein
      await deleteDoc(doc(db, "worker_applications", worker.id));
      Alert.alert("Approved", `${worker.name} ab SPC ka partner hai!`);
    } catch (e) { alert(e.message); } finally { setBtnLoading(false); }
  };

  const handleDelete = async (id, collectionName = "workers") => {
    const confirm = Platform.OS === 'web' ? window.confirm("Hatayein?") : true;
    if (confirm) await deleteDoc(doc(db, collectionName, id));
  };

  if (loading) return <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SPC Workers</Text>
          <Text style={{color: '#aaa', fontSize: 12}}>Patna Operations Control</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={24} color="#001529" />
          <Text style={{fontWeight:'bold', marginLeft:5}}>ADD NEW</Text>
        </TouchableOpacity>
      </View>

      {/* TABS Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setActiveTab('approved')} style={[styles.tab, activeTab === 'approved' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>Approved ({workers.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('pending')} style={[styles.tab, activeTab === 'pending' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending ({pendingWorkers.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {activeTab === 'approved' ? (
          // Approved Workers List
          workers.map((w) => (
            <View key={w.id} style={styles.workerCard}>
              <Image source={{ uri: w.image }} style={styles.workerImg} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.workerName}>{w.name}</Text>
                <Text style={styles.workerCat}>{w.category}</Text>
                <Text style={styles.workerInfo}>{w.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(w.id)}>
                <Ionicons name="trash-outline" size={22} color="#FF4D4D" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          // Pending Applications List
          pendingWorkers.map((w) => (
            <View key={w.id} style={[styles.workerCard, {borderColor: '#D4AF37', borderWidth: 0.5}]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{w.name} (Applicant)</Text>
                <Text style={styles.workerCat}>Skill: {w.skill}</Text>
                <Text style={styles.workerInfo}>Area: {w.area} | Exp: {w.experience}</Text>
                <Text style={[styles.workerInfo, {marginTop: 5, color: '#D4AF37'}]}>Mob: {w.phone}</Text>
              </View>
              <View style={{flexDirection: 'row', gap: 10}}>
                <TouchableOpacity onPress={() => handleApprove(w)} style={styles.smallApproveBtn}>
                  <Ionicons name="checkmark-circle" size={24} color="#28A745" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(w.id, "worker_applications")}>
                  <Ionicons name="close-circle" size={24} color="#FF4D4D" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal for Manual Add (Same as your original) */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Worker Details</Text>
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {form.image ? <Image source={{ uri: form.image }} style={{width:'100%', height:'100%'}} /> : <Ionicons name="camera" size={40} color="#D4AF37" />}
            </TouchableOpacity>
            <TextInput style={styles.input} placeholder="Worker Name" value={form.name} onChangeText={t => setForm({...form, name:t})} placeholderTextColor="#888" />
            <TextInput style={styles.input} placeholder="Category (Ex: Electrician)" value={form.category} onChangeText={t => setForm({...form, category:t})} placeholderTextColor="#888" />
            <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={t => setForm({...form, email:t})} placeholderTextColor="#888" />
            <TextInput style={styles.input} placeholder="Phone Number" keyboardType="numeric" value={form.phone} onChangeText={t => setForm({...form, phone:t})} placeholderTextColor="#888" />
            <TextInput style={[styles.input, {height:60}]} placeholder="Address" multiline value={form.address} onChangeText={t => setForm({...form, address:t})} placeholderTextColor="#888" />
            <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:15, marginBottom: 30}}>
               <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancel}><Text style={{color:'#fff'}}>Close</Text></TouchableOpacity>
               <TouchableOpacity onPress={saveWorker} style={styles.btnSave}>
                  {btnLoading ? <ActivityIndicator color="#000" /> : <Text style={{fontWeight:'bold'}}>Save Worker</Text>}
               </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  loader: { flex: 1, backgroundColor: '#001529', justifyContent: 'center' },
  header: { padding: 20, backgroundColor: '#002140', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#D4AF37', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: '#001529', borderBottomWidth: 1, borderColor: '#002140' },
  tab: { flex: 1, padding: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderColor: '#D4AF37' },
  tabText: { color: '#888', fontWeight: 'bold' },
  activeTabText: { color: '#D4AF37' },
  workerCard: { backgroundColor: '#002140', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  workerImg: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#D4AF37' },
  workerName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  workerCat: { color: '#D4AF37', fontSize: 13, marginBottom: 2 },
  workerInfo: { color: '#aaa', fontSize: 11 },
  smallApproveBtn: { padding: 5 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#002140', padding: 20, borderRadius: 20, maxHeight: '90%' },
  modalTitle: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  imagePicker: { height: 120, width: 120, alignSelf: 'center', backgroundColor: '#001529', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#D4AF37' },
  input: { backgroundColor: '#001529', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  btnCancel: { backgroundColor: '#444', padding: 15, borderRadius: 10, flex: 0.45, alignItems: 'center' },
  btnSave: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 10, flex: 0.45, alignItems: 'center' }
});
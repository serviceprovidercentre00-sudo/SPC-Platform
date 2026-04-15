// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, Modal, Platform, SafeAreaView } from 'react-native';
import { db } from '../../config/firebase'; 
import { collection, onSnapshot, doc, deleteDoc, addDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  
  // Main Form
  const [form, setForm] = useState({ name: '', price: '', desc: '', image: null, parts: [] });
  
  // Naya Part input state
  const [partInput, setPartInput] = useState({ name: '', price: '', model: '', company: '', image: null });
  
  const [editId, setEditId] = useState(null); 
  const [modalVisible, setModalVisible] = useState(false);

  const CLOUD_NAME = "dq5nnb1kn";
  const UPLOAD_PRESET = "spc_preset";

  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setServices(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- IMAGE PICKER (Service aur Parts dono ke liye) ---
  const pickImage = async (type) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      if (type === 'main') {
        setForm({ ...form, image: result.assets[0].uri });
      } else {
        setPartInput({ ...partInput, image: result.assets[0].uri });
      }
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
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: data });
    const result = await res.json();
    return result.secure_url;
  };

  // --- PARTS KO LIST MEIN ADD/DELETE KARNA (UI Level) ---
  const addPartToList = () => {
    if (!partInput.name || !partInput.price || !partInput.image) {
      return Alert.alert("Wait!", "Part ki Photo, Naam aur Price bhariye.");
    }
    const newPart = { ...partInput, id: Date.now().toString() };
    setForm({ ...form, parts: [...form.parts, newPart] });
    setPartInput({ name: '', price: '', model: '', company: '', image: null }); // Reset part input
  };

  const removePartFromList = (partId) => {
    setForm({ ...form, parts: form.parts.filter(p => p.id !== partId) });
  };

  // --- SERVICE SAVE LOGIC ---
  const saveService = async () => {
    if (!form.name || !form.price || !form.image) {
      return Alert.alert("Wait!", "Sab details bhariye.");
    }
    setBtnLoading(true);
    try {
      // Step 1: Main Image Upload
      const finalUrl = await uploadToCloudinary(form.image);

      // Step 2: Parts Images Upload (Parallel)
      const uploadedParts = await Promise.all(form.parts.map(async (p) => {
        const pUrl = await uploadToCloudinary(p.image);
        return { ...p, image: pUrl };
      }));

      const payload = {
        name: form.name,
        price: form.price,
        desc: form.desc || '',
        image: finalUrl,
        parts: uploadedParts,
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
    setForm({ name: '', price: '', desc: '', image: null, parts: [] });
    setPartInput({ name: '', price: '', model: '', company: '', image: null });
    setEditId(null);
    setModalVisible(false);
  };

  const handleEdit = (item) => {
    setForm({ 
      name: item.name, 
      price: item.price, 
      desc: item.desc || '', 
      image: item.image, 
      parts: item.parts || [] 
    });
    setEditId(item.id);
    setModalVisible(true);
  };

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#D4AF37" />
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
        {services.map((s) => (
          <View key={s.id} style={styles.card}>
            <Image source={{ uri: s.image }} style={styles.cardImg} />
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <Text style={styles.cardTitle}>{s.name}</Text>
              <Text style={styles.cardPrice}>₹{s.price} | {s.parts?.length || 0} Parts</Text>
            </View>
            <View style={{flexDirection:'row'}}>
               <TouchableOpacity onPress={() => handleEdit(s)}><Ionicons name="pencil" size={22} color="#D4AF37" /></TouchableOpacity>
               {/* DELETE WORKING BUTTON */}
               <TouchableOpacity onPress={() => deleteDoc(doc(db, "services", s.id))} style={{marginLeft:15}}><Ionicons name="trash" size={22} color="#FF4D4D" /></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={{flex:1, backgroundColor: '#001529'}}>
          <ScrollView contentContainerStyle={{padding: 20}}>
            <Text style={styles.modalTitle}>{editId ? "Edit Service" : "Add Service"}</Text>
            
            <TouchableOpacity onPress={() => pickImage('main')} style={styles.picker}>
              {form.image ? <Image source={{ uri: form.image }} style={{width:'100%', height:'100%'}} /> : <Ionicons name="camera" size={40} color="#D4AF37" />}
            </TouchableOpacity>
            
            <TextInput style={styles.input} placeholder="Service Name" value={form.name} onChangeText={t => setForm({...form, name:t})} placeholderTextColor="#666" />
            <TextInput style={styles.input} placeholder="Price" keyboardType="numeric" value={form.price} onChangeText={t => setForm({...form, price:t})} placeholderTextColor="#666" />
            <TextInput style={[styles.input, {height:60}]} placeholder="Description" multiline value={form.desc} onChangeText={t => setForm({...form, desc:t})} placeholderTextColor="#666" />

            <View style={styles.hr} />

            {/* --- PARTS ADD SECTION --- */}
            <Text style={styles.sectionLabel}>ADD PART DETAILS</Text>
            <View style={styles.partBox}>
              <View style={{flexDirection:'row', gap:10}}>
                <TouchableOpacity onPress={() => pickImage('part')} style={styles.partPicker}>
                  {partInput.image ? <Image source={{ uri: partInput.image }} style={{width:'100%', height:'100%'}} /> : <Ionicons name="image" size={24} color="#D4AF37" />}
                </TouchableOpacity>
                <View style={{flex:1}}>
                  <TextInput style={styles.inputSmall} placeholder="Part Name" value={partInput.name} onChangeText={t => setPartInput({...partInput, name:t})} placeholderTextColor="#666" />
                  <TextInput style={styles.inputSmall} placeholder="Part Price" keyboardType="numeric" value={partInput.price} onChangeText={t => setPartInput({...partInput, price:t})} placeholderTextColor="#666" />
                </View>
              </View>
              <View style={{flexDirection:'row', gap:10, marginTop:10}}>
                <TextInput style={[styles.inputSmall, {flex:1}]} placeholder="Company" value={partInput.company} onChangeText={t => setPartInput({...partInput, company:t})} placeholderTextColor="#666" />
                <TextInput style={[styles.inputSmall, {flex:1}]} placeholder="Model No." value={partInput.model} onChangeText={t => setPartInput({...partInput, model:t})} placeholderTextColor="#666" />
              </View>
              <TouchableOpacity style={styles.addPartBtn} onPress={addPartToList}>
                <Text style={{fontWeight:'bold', color:'#001529'}}>+ ADD PART TO LIST</Text>
              </TouchableOpacity>
            </View>

            {/* LIST OF ADDED PARTS */}
            {form.parts.map((p) => (
              <View key={p.id} style={styles.partItem}>
                <Image source={{ uri: p.image }} style={styles.partThumb} />
                <View style={{flex:1, marginLeft:10}}>
                  <Text style={{color:'#fff', fontWeight:'bold'}}>{p.name} ({p.company})</Text>
                  <Text style={{color:'#D4AF37', fontSize:12}}>₹{p.price} | {p.model}</Text>
                </View>
                <TouchableOpacity onPress={() => removePartFromList(p.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF4D4D" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:30, marginBottom: 50}}>
               <TouchableOpacity onPress={resetForm} style={styles.btnCancel}><Text style={{color:'#fff'}}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity onPress={saveService} style={styles.btnSave}>
                  {btnLoading ? <ActivityIndicator color="#000" /> : <Text style={{fontWeight:'bold'}}>Save Final</Text>}
               </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
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
  modalTitle: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  picker: { height: 140, backgroundColor: '#001529', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#D4AF37', borderStyle: 'dashed', overflow: 'hidden' },
  input: { backgroundColor: '#001529', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  hr: { height: 1, backgroundColor: '#333', marginVertical: 20 },
  sectionLabel: { color: '#D4AF37', fontWeight: 'bold', marginBottom: 10 },
  partBox: { backgroundColor: '#002140', padding: 15, borderRadius: 15, borderLeftWidth: 4, borderLeftColor: '#D4AF37' },
  partPicker: { width: 80, height: 80, backgroundColor: '#001529', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  inputSmall: { backgroundColor: '#001529', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 5 },
  addPartBtn: { backgroundColor: '#D4AF37', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  partItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#001529', padding: 10, borderRadius: 10, marginTop: 10 },
  partThumb: { width: 40, height: 40, borderRadius: 5 },
  btnCancel: { backgroundColor: '#333', padding: 15, borderRadius: 10, flex: 0.45, alignItems: 'center' },
  btnSave: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 10, flex: 0.45, alignItems: 'center' }
});
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { db } from '../../config/firebase'; 
import { collection, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp, query } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [btnLoading, setBtnLoading] = useState(false);

  useEffect(() => {
    // Sabhi users ko dikhane ke liye orderBy hata diya hai
    const q = query(collection(db, "users"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log("Database se itne users mile:", allUsers.length);
      setUsers(allUsers);
      setLoading(false);
    }, (err) => {
      console.error("Fetch Error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveUser = async () => {
    if (!form.name || !form.email) {
      return Alert.alert("Rukiye!", "Name aur Email bharna zaroori hai.");
    }
    setBtnLoading(true);
    try {
      await addDoc(collection(db, "users"), {
        ...form,
        createdAt: serverTimestamp()
      });
      setForm({ name: '', email: '', phone: '', address: '' });
      setModalVisible(false);
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Web par Alert.alert issues karta hai, isliye confirm use kar rahe hain
    const confirmDelete = Platform.OS === 'web' 
      ? window.confirm("Kya aap is user ko delete karna chahte hain?")
      : true;

    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "users", id));
      } catch (e) {
        alert("Delete nahi ho paya: " + e.message);
      }
    }
  };

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#D4AF37" />
      <Text style={{color:'#fff', marginTop:10}}>Users dhund raha hoon...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.countText}>{users.length} Total Users</Text>
        </View>
        <TouchableOpacity style={styles.addCircle} onPress={() => setModalVisible(true)}>
          <Ionicons name="person-add" size={24} color="#001529" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {users.length === 0 ? (
          <Text style={styles.emptyText}>Database mein koi user nahi mila.</Text>
        ) : (
          users.map((u) => (
            <View key={u.id} style={styles.userCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{u.name ? u.name.charAt(0).toUpperCase() : '?'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.userName}>{u.name || 'No Name'}</Text>
                <Text style={styles.userSub}>{u.email}</Text>
                {u.phone && <Text style={styles.userSub}>{u.phone}</Text>}
              </View>
              <TouchableOpacity onPress={() => handleDelete(u.id)} style={styles.deleteBtn}>
                <Ionicons name="trash" size={22} color="#FF4D4D" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New User</Text>
            <TextInput style={styles.input} placeholder="Full Name" value={form.name} onChangeText={t => setForm({...form, name:t})} placeholderTextColor="#888" />
            <TextInput style={styles.input} placeholder="Email Address" value={form.email} onChangeText={t => setForm({...form, email:t})} placeholderTextColor="#888" />
            <TextInput style={styles.input} placeholder="Phone Number" keyboardType="numeric" value={form.phone} onChangeText={t => setForm({...form, phone:t})} placeholderTextColor="#888" />
            <TextInput style={[styles.input, {height:60}]} placeholder="Full Address" multiline value={form.address} onChangeText={t => setForm({...form, address:t})} placeholderTextColor="#888" />
            
            <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:15}}>
               <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancel}><Text style={{color:'#fff'}}>Close</Text></TouchableOpacity>
               <TouchableOpacity onPress={saveUser} style={styles.btnSave}>
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
  loader: { flex: 1, backgroundColor: '#001529', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#002140', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#D4AF37' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  countText: { color: '#D4AF37', fontSize: 14 },
  addCircle: { backgroundColor: '#D4AF37', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  userCard: { backgroundColor: '#002140', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#001529', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4AF37' },
  avatarText: { color: '#D4AF37', fontWeight: 'bold', fontSize: 18 },
  userName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userSub: { color: '#aaa', fontSize: 12 },
  deleteBtn: { padding: 5 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 50 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#002140', padding: 25, borderRadius: 20 },
  modalTitle: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#001529', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 12 },
  btnCancel: { backgroundColor: '#444', padding: 15, borderRadius: 10, flex: 0.45, alignItems: 'center' },
  btnSave: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 10, flex: 0.45, alignItems: 'center' }
});
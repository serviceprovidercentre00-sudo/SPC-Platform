// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { db, auth } from '../../config/firebase'; 
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore'; // updateDoc add kiya
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user || user.uid !== "PSvi6ahqZ2eyPRbgGx5GoyndCch1") {
        router.replace('/login'); 
      }
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (s) => {
      setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.log("Firestore Error:", err);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- NAYA STATUS UPDATE FUNCTION ---
  const updateStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      Alert.alert("Error", "Status update nahi hua: " + error.message);
    }
  };

  const removeOrder = async (id) => {
    try {
      await deleteDoc(doc(db, "orders", id));
    } catch (error) {
      Alert.alert("Error", "Logout karke Login karein: " + error.message);
    }
  };

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#D4AF37" />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {orders.map((item) => {
          const name = item.userName || item.customerName || item.name || "Unknown";
          const email = item.userEmail || "No Email";
          const amount = item.totalAmount || 0;
          const address = item.address || (item.items && item.items[0]?.address) || "No Address";
          const phone = item.phone || (item.items && item.items[0]?.phone) || "No Number";
          
          // Current status check
          const currentStatus = item.status || "Pending";

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.id}>ID: ...{item.id.slice(-6).toUpperCase()}</Text>
                <TouchableOpacity onPress={() => removeOrder(item.id)} style={styles.delBtn}>
                  <Ionicons name="trash" size={18} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <Text style={styles.mainText}>👤 {name}</Text>
                <Text style={styles.subText}>📍 {address}</Text>
                <Text style={styles.subText}>📞 {phone}</Text>
                
                <View style={styles.divider} />
                
                <View style={styles.row}>
                   <Text style={styles.price}>Total: ₹{amount}</Text>
                   {/* Status Badge */}
                   <View style={[styles.statusBadge, 
                    currentStatus === 'Completed' ? {backgroundColor: '#28A745'} : 
                    currentStatus === 'Accepted' ? {backgroundColor: '#007BFF'} : 
                    {backgroundColor: '#D4AF37'}]}>
                     <Text style={styles.statusText}>{currentStatus}</Text>
                   </View>
                </View>

                {/* --- 3 LEVEL STATUS BUTTONS --- */}
                <View style={styles.statusActions}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, currentStatus === 'Pending' && styles.activeTab]} 
                    onPress={() => updateStatus(item.id, 'Pending')}>
                    <Text style={styles.actionText}>Pending</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtn, currentStatus === 'Accepted' && styles.activeTab]} 
                    onPress={() => updateStatus(item.id, 'Accepted')}>
                    <Text style={styles.actionText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtn, currentStatus === 'Completed' && styles.activeTab]} 
                    onPress={() => updateStatus(item.id, 'Completed')}>
                    <Text style={styles.actionText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  loader: { flex: 1, justifyContent: 'center', backgroundColor: '#001529' },
  card: { backgroundColor: '#002140', borderRadius: 12, padding: 15, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#D4AF37' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { color: '#555', fontSize: 10 },
  delBtn: { backgroundColor: '#FF4D4F', padding: 8, borderRadius: 6 },
  mainText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  subText: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#1E293B', marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  statusActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, gap: 5 },
  actionBtn: { flex: 1, borderWeight: 1, borderColor: '#1E293B', borderWidth: 1, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  activeTab: { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  actionText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' }
});
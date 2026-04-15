// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { db, auth } from '../../config/firebase'; 
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔥 UPDATE: Aapki Nayi UID yahan set kar di hai
  const ADMIN_UID = "sIlwYSIr89To94lAnS12dXtCadb2"; 

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Check if user is logged in AND is the correct admin
      if (!user || user.uid !== ADMIN_UID) {
        console.log("Unauthorized access to Orders");
        router.replace('/admin/login'); 
      }
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    // Real-time listener for orders
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (s) => {
      const fetchedOrders = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(fetchedOrders);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      // Agar permission error hai toh alert dikhao
      if (err.code === 'permission-denied') {
        Alert.alert("Permission Error", "Rules update karein ya login check karein.");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { status: newStatus });
      // Web par chota notification
      if (Platform.OS === 'web') console.log(`Order ${id} marked as ${newStatus}`);
    } catch (error) {
      Alert.alert("Error", "Status update nahi hua: " + error.message);
    }
  };

  const removeOrder = (id) => {
    const deleteAction = async () => {
      try {
        await deleteDoc(doc(db, "orders", id));
      } catch (error) {
        Alert.alert("Error", "Delete nahi hua: " + error.message);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("Kya aap ye order delete karna chahte hain?")) deleteAction();
    } else {
      Alert.alert("Confirm Delete", "Ye order permanent delete ho jayega.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: deleteAction, style: "destructive" }
      ]);
    }
  };

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#D4AF37" />
      <Text style={{color: '#D4AF37', marginTop: 10}}>LOADING ORDERS...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 15 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Manage Orders ({orders.length})</Text>
        
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={50} color="#1E293B" />
            <Text style={styles.emptyText}>Abhi koi naya order nahi aaya hai.</Text>
          </View>
        ) : (
          orders.map((item) => {
            const name = item.userName || item.customerName || item.name || "Unknown Customer";
            const amount = item.totalAmount || 0;
            const address = item.address || "Address Not Provided";
            const phone = item.phone || "No Contact";
            const currentStatus = item.status || "Pending";

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.header}>
                  <Text style={styles.id}>ORD-#{item.id.slice(-6).toUpperCase()}</Text>
                  <TouchableOpacity onPress={() => removeOrder(item.id)} style={styles.delBtn}>
                    <Ionicons name="trash-outline" size={16} color="white" />
                  </TouchableOpacity>
                </View>

                <View style={styles.body}>
                  <Text style={styles.mainText}>{name}</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color="#94A3B8" />
                    <Text style={styles.subText}>{address}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={14} color="#94A3B8" />
                    <Text style={styles.subText}>{phone}</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.row}>
                     <Text style={styles.price}>₹{amount}</Text>
                     <View style={[styles.statusBadge, 
                      currentStatus === 'Completed' ? {backgroundColor: '#1B5E20'} : 
                      currentStatus === 'Accepted' ? {backgroundColor: '#0D47A1'} : 
                      {backgroundColor: '#827717'}]}>
                       <Text style={styles.statusText}>{currentStatus.toUpperCase()}</Text>
                     </View>
                  </View>

                  <View style={styles.statusActions}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, currentStatus === 'Pending' && styles.activeTabPending]} 
                      onPress={() => updateStatus(item.id, 'Pending')}>
                      <Text style={[styles.actionText, currentStatus === 'Pending' && {color: '#D4AF37'}]}>Wait</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionBtn, currentStatus === 'Accepted' && styles.activeTabAccepted]} 
                      onPress={() => updateStatus(item.id, 'Accepted')}>
                      <Text style={[styles.actionText, currentStatus === 'Accepted' && {color: '#007BFF'}]}>Accept</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionBtn, currentStatus === 'Completed' && styles.activeTabCompleted]} 
                      onPress={() => updateStatus(item.id, 'Completed')}>
                      <Text style={[styles.actionText, currentStatus === 'Completed' && {color: '#28A745'}]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001529' },
  pageTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginLeft: 5 },
  card: { backgroundColor: '#002140', borderRadius: 16, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: '#1E293B' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { color: '#64748B', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  delBtn: { backgroundColor: '#922B21', padding: 8, borderRadius: 8 },
  mainText: { color: '#fff', fontSize: 19, fontWeight: 'bold', marginTop: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  subText: { color: '#94A3B8', fontSize: 13, marginLeft: 6 },
  divider: { height: 1, backgroundColor: '#1E293B', marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: '#D4AF37', fontSize: 20, fontWeight: '900' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: 'white', fontSize: 10, fontWeight: '900' },
  statusActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#001529', paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  activeTabPending: { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.05)' },
  activeTabAccepted: { borderColor: '#007BFF', backgroundColor: 'rgba(0, 123, 255, 0.05)' },
  activeTabCompleted: { borderColor: '#28A745', backgroundColor: 'rgba(40, 167, 69, 0.05)' },
  actionText: { color: '#475569', fontSize: 11, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#64748B', marginTop: 10, fontSize: 14 }
});
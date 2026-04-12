// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native';
import { db } from '../../config/firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
    } catch (error) {
      Alert.alert("Error", "Status update nahi ho paya");
    }
  };

  const deleteOrder = (id) => {
    Alert.alert("🚨 Delete Order?", "Kya aap waqai is order ko delete karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => await deleteDoc(doc(db, "orders", id)) }
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color="#D4AF37" style={{ flex: 1, backgroundColor: '#001529' }} />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {orders.length === 0 ? (
          <Text style={styles.noData}>No orders found.</Text>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={[styles.card, { borderLeftColor: getStatusColor(order.status) }]}>
              {/* Header: ID & Delete */}
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>ID: ...{order.id.slice(-6).toUpperCase()}</Text>
                <TouchableOpacity onPress={() => deleteOrder(order.id)}>
                  <Ionicons name="trash-outline" size={20} color="#C0392B" />
                </TouchableOpacity>
              </View>

              {/* Customer Details */}
              <View style={styles.details}>
                <Text style={styles.name}>👤 {order.customerName}</Text>
                <Text style={styles.info}>📍 {order.customerAddress}</Text>
                <Text style={styles.info}>📞 {order.customerPhone}</Text>
                <Text style={styles.service}>🛠️ Service: <Text style={{fontWeight:'bold', color: '#D4AF37'}}>{order.serviceName}</Text></Text>
              </View>

              {/* Payment Method */}
              <View style={styles.paymentBadge}>
                <Ionicons name="cash-outline" size={16} color="#28A745" />
                <Text style={styles.paymentText}> 
                  Payment: {order.paymentMethod === 'online' ? 'Pay on Service' : 'Cash on Service'}
                </Text>
              </View>

              {/* 3-Level Management Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  onPress={() => updateStatus(order.id, 'pending')}
                  style={[styles.statusBtn, order.status === 'pending' && styles.pendingActive]}
                >
                  <Text style={styles.btnText}>Pending</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => updateStatus(order.id, 'processing')}
                  style={[styles.statusBtn, order.status === 'processing' && styles.processingActive]}
                >
                  <Text style={styles.btnText}>Working</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => updateStatus(order.id, 'completed')}
                  style={[styles.statusBtn, order.status === 'completed' && styles.completedActive]}
                >
                  <Text style={styles.btnText}>Done</Text>
                </TouchableOpacity>
              </View>

              {/* Call Customer Button */}
              <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${order.customerPhone}`)}>
                <Ionicons name="call" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8 }}>Call Customer</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const getStatusColor = (status) => {
  if (status === 'completed') return '#28A745';
  if (status === 'processing') return '#007BFF';
  return '#D4AF37';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  noData: { color: '#fff', textAlign: 'center', marginTop: 50 },
  card: { backgroundColor: '#002140', borderRadius: 15, padding: 15, marginBottom: 15, borderLeftWidth: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { color: '#666', fontSize: 12 },
  name: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  info: { color: '#bbb', fontSize: 14, marginTop: 4 },
  service: { color: '#fff', marginTop: 8, fontSize: 15 },
  paymentBadge: { backgroundColor: '#002d5a', padding: 8, borderRadius: 8, marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  paymentText: { color: '#28A745', fontWeight: 'bold', fontSize: 13 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  statusBtn: { backgroundColor: '#162b4d', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, width: '30%', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  pendingActive: { backgroundColor: '#D4AF37' },
  processingActive: { backgroundColor: '#007BFF' },
  completedActive: { backgroundColor: '#28A745' },
  callBtn: { backgroundColor: '#D4AF37', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 10, marginTop: 15 }
});
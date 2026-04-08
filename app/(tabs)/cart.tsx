// @ts-nocheck
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet, Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useCart } from '../../context/CartContext';

export default function CartScreen() {
  const { cartItems = [], clearCart, removeFromCart } = useCart(); 
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const total = (cartItems || []).reduce((sum, item) => sum + Number(item.price || 0), 0);

  const confirmBooking = async () => {
    const user = auth?.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Booking confirm karne ke liye login karein.", [
        { text: "Baad mein", style: "cancel" },
        { text: "Login", onPress: () => router.push('/auth') } 
      ]);
      return;
    }
    if (!cartItems || cartItems.length === 0) return Alert.alert("Cart Khali Hai", "Pehle service select karein.");
    if (!address.trim() || phone.length < 10) return Alert.alert("Details Missing", "Address aur Phone No. bhariye.");

    setLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        items: cartItems.map((item) => ({ id: item.id, name: item.name, price: Number(item.price) })),
        totalAmount: total,
        address, phone, status: 'Pending', createdAt: serverTimestamp(),
      });
      Alert.alert("Success! 🎉", "SPC Patna ko booking mil gayi!");
      clearCart(); 
      router.replace('/'); 
    } catch (e) { Alert.alert("Error", "Server check karein."); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Stack.Screen options={{ title: 'My Booking Cart', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Selected Services ({(cartItems || []).length})</Text>
        {(!cartItems || cartItems.length === 0) ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No services in cart.</Text>
            <TouchableOpacity style={styles.goBtn} onPress={() => router.push('/')}><Text style={styles.goBtnText}>Browse Services</Text></TouchableOpacity>
          </View>
        ) : (
          cartItems.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={{ flex: 1 }}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemPrice}>₹{item.price}</Text></View>
              <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>
            </View>
          ))
        )}
        {cartItems.length > 0 && (
          <View style={styles.footerSection}>
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Service Address</Text>
              <TextInput style={styles.input} placeholder="Address in Patna" onChangeText={setAddress} value={address} />
              <Text style={styles.formLabel}>WhatsApp Number</Text>
              <TextInput style={styles.input} keyboardType="numeric" maxLength={10} onChangeText={setPhone} value={phone} />
            </View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Grand Total:</Text><Text style={styles.totalValue}>₹{total}</Text></View>
            <TouchableOpacity style={styles.bookBtn} onPress={confirmBooking} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.bookBtnText}>CONFIRM ORDER</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#002D62', marginBottom: 15 },
  itemCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemPrice: { color: '#D4AF37', fontWeight: 'bold', fontSize: 15 },
  removeBtn: { padding: 5 },
  removeText: { color: '#FF4444', fontWeight: 'bold', fontSize: 12 },
  emptyBox: { marginTop: 80, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 16, marginBottom: 20 },
  goBtn: { backgroundColor: '#002D62', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 8 },
  goBtnText: { color: '#FFF', fontWeight: 'bold' },
  footerSection: { marginTop: 10 },
  formCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 15, marginBottom: 20 },
  formLabel: { fontSize: 13, fontWeight: 'bold', color: '#002D62', marginBottom: 8 },
  input: { borderBottomWidth: 1, borderColor: '#EEE', paddingVertical: 8, marginBottom: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  totalLabel: { fontSize: 18, color: '#666' },
  totalValue: { fontSize: 26, fontWeight: 'bold', color: '#002D62' },
  bookBtn: { backgroundColor: '#002D62', padding: 18, borderRadius: 15, alignItems: 'center' },
  bookBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});
// Yahan code khatam! Koi extra duplicate export nahi.
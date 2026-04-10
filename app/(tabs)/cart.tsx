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
import { auth, db } from '../../config/firebase'; // Path check kar lein apne folder structure ke hisaab se
import { useCart } from '../../context/CartContext';

export default function CartScreen() {
  const { cartItems = [], clearCart, removeFromCart } = useCart(); 
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Price calculation with safety check
  const total = (cartItems || []).reduce((sum, item) => sum + Number(item.price || 0), 0);

  const confirmBooking = async () => {
    const user = auth?.currentUser;
    
    // 1. Auth Check
    if (!user) {
      Alert.alert("Login Required", "Booking confirm karne ke liye login karein.", [
        { text: "Baad mein", style: "cancel" },
        { text: "Login", onPress: () => router.push('/auth') } 
      ]);
      return;
    }

    // 2. Validation
    if (!cartItems || cartItems.length === 0) {
      return Alert.alert("Cart Khali Hai", "Pehle koi service select karein.");
    }
    if (!address.trim() || phone.length < 10) {
      return Alert.alert("Details Missing", "Kripya sahi Address aur 10-digit Phone No. bhariye.");
    }

    setLoading(true);
    try {
      // 3. Firestore Order Submission
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userName: user.displayName || 'SPC User',
        userEmail: user.email,
        items: cartItems.map((item) => ({ 
          id: item.id, 
          name: item.name, 
          price: Number(item.price) 
        })),
        totalAmount: total,
        address: address.trim(),
        phone: phone.trim(),
        status: 'Pending',
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success! 🎉", "SPC Patna ko aapki booking mil gayi! Hum jald hi call karenge.");
      clearCart(); 
      router.replace('/(tabs)'); // Order ke baad home par bhejo
    } catch (e) { 
      console.error(e);
      Alert.alert("Error", "Server se connection nahi ho paya. Internet check karein."); 
    }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <Stack.Screen options={{ title: 'My Booking Cart', headerShown: true }} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Selected Services ({(cartItems || []).length})</Text>
        
        {(!cartItems || cartItems.length === 0) ? (
          <View style={styles.emptyBox}>
            <Text style={{fontSize: 50}}>🛒</Text>
            <Text style={styles.emptyText}>Aapka cart khali hai.</Text>
            <TouchableOpacity style={styles.goBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.goBtnText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {cartItems.map((item, index) => (
              <View key={item.id || index} style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price}</Text>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.footerSection}>
              <View style={styles.formCard}>
                <Text style={styles.formLabel}>Service Address (Patna)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Street, Area, Landmark..." 
                  onChangeText={setAddress} 
                  value={address} 
                />
                
                <Text style={styles.formLabel}>WhatsApp Number</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric" 
                  maxLength={10} 
                  placeholder="10 digit number"
                  onChangeText={setPhone} 
                  value={phone} 
                />
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total:</Text>
                <Text style={styles.totalValue}>₹{total}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.bookBtn, loading && { opacity: 0.7 }]} 
                onPress={confirmBooking} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.bookBtnText}>CONFIRM ORDER</Text>
                )}
              </TouchableOpacity>
              
              <Text style={styles.infoText}>* Cash on Service (Payment kaam ke baad)</Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#002D62', marginBottom: 15 },
  itemCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 2 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemPrice: { color: '#002D62', fontWeight: 'bold', fontSize: 15, marginTop: 4 },
  removeBtn: { padding: 8, backgroundColor: '#FFF0F0', borderRadius: 8 },
  removeText: { color: '#FF4444', fontWeight: 'bold', fontSize: 12 },
  emptyBox: { marginTop: 80, alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 16, marginBottom: 20, marginTop: 10 },
  goBtn: { backgroundColor: '#002D62', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
  goBtnText: { color: '#FFF', fontWeight: 'bold' },
  footerSection: { marginTop: 10 },
  formCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 15, marginBottom: 20, elevation: 2 },
  formLabel: { fontSize: 13, fontWeight: 'bold', color: '#002D62', marginBottom: 8 },
  input: { borderBottomWidth: 1.5, borderColor: '#F1F5F9', paddingVertical: 10, marginBottom: 20, color: '#1E293B' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, alignItems: 'center' },
  totalLabel: { fontSize: 18, color: '#64748B' },
  totalValue: { fontSize: 28, fontWeight: 'bold', color: '#002D62' },
  bookBtn: { backgroundColor: '#002D62', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 5 },
  bookBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  infoText: { textAlign: 'center', marginTop: 15, color: '#94A3B8', fontSize: 12 }
});
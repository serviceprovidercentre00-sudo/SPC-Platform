// @ts-nocheck
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  StyleSheet, Alert, SafeAreaView, ActivityIndicator, Modal, Image 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { db, auth } from '../config/firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Checkout() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  
  // Cart se last item aur total amount nikalna
  const lastItem = cart && cart.length > 0 ? cart[cart.length - 1] : null;
  const totalAmount = lastItem ? lastItem.totalAmount : 0;

  // States
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); 
  const [showQRModal, setShowQRModal] = useState(false);

  const UPI_ID = "6202379166@ptaxis"; // SPC Patna UPI

  // --- Main Function: Order Save Karna ---
  const saveOrderToAdmin = async () => {
    // Basic Validation
    if (!address.trim() || phone.length < 10) {
      return Alert.alert("Incomplete", "Pata aur Mobile number sahi se bhariye.");
    }

    setLoading(true);
    try {
      const orderData = {
        userId: auth.currentUser?.uid || 'guest_user',
        customerName: auth.currentUser?.displayName || 'Customer',
        serviceName: lastItem?.name || 'Home Service',
        totalPayable: totalAmount,
        address: address,
        phone: phone,
        paymentType: paymentMethod,
        status: 'New Order', // Admin panel ke liye status
        createdAt: serverTimestamp(), // Indexing ke liye zaroori hai
      };

      // 1. Firebase 'orders' collection mein save (Index yahi kaam karega)
      const docRef = await addDoc(collection(db, "orders"), orderData);

      // 2. Success Actions
      setShowQRModal(false);
      clearCart(); // Cart khali karna

      // 3. Redirection: Seedha Cart/Orders History tab par
      router.replace('/(tabs)/cart');

      Alert.alert("🎉 Success", "Aapka order successfully save ho gaya hai!");

    } catch (e) {
      console.error("Firebase Save Error:", e);
      Alert.alert("Error", "Order save nahi hua. Internet check karein.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === 'online') {
      setShowQRModal(true);
    } else {
      saveOrderToAdmin(); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Settings */}
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Finalize Order', 
        headerTintColor: '#D4AF37', 
        headerStyle: { backgroundColor: '#001529' } 
      }} />
      
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Delivery Address Section */}
        <Text style={styles.label}>DELIVERY ADDRESS (PATNA REGION)</Text>
        <TextInput 
          style={styles.input} 
          multiline 
          numberOfLines={3}
          placeholder="Street, Landmark, Area..." 
          placeholderTextColor="#94A3B8" 
          value={address} 
          onChangeText={setAddress} 
        />

        {/* Contact Number Section */}
        <Text style={[styles.label, {marginTop: 20}]}>CONTACT NUMBER</Text>
        <TextInput 
          style={styles.input} 
          keyboardType="numeric" 
          placeholder="10 Digit Mobile Number" 
          placeholderTextColor="#94A3B8" 
          value={phone} 
          onChangeText={setPhone} 
          maxLength={10}
        />

        <View style={styles.divider} />

        {/* Payment Methods */}
        <Text style={[styles.label, {marginBottom: 15}]}>PAYMENT METHOD</Text>
        
        <TouchableOpacity 
          style={[styles.payCard, paymentMethod === 'cash' && styles.activeCard]} 
          onPress={() => setPaymentMethod('cash')}
        >
          <Ionicons name="cash-outline" size={24} color="#D4AF37" />
          <Text style={styles.payText}>Cash After Service</Text>
          {paymentMethod === 'cash' && <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.payCard, paymentMethod === 'online' && styles.activeCard]} 
          onPress={() => setPaymentMethod('online')}
        >
          <Ionicons name="qr-code-outline" size={24} color="#D4AF37" />
          <Text style={styles.payText}>Online UPI / QR Scan</Text>
          {paymentMethod === 'online' && <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />}
        </TouchableOpacity>

        {/* Confirm Button */}
        <TouchableOpacity 
          style={[styles.finalBtn, loading && { opacity: 0.7 }]} 
          onPress={handlePlaceOrder} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#001529" />
          ) : (
            <Text style={styles.finalBtnText}>CONFIRM ORDER - ₹{totalAmount}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal visible={showQRModal} transparent animationType="fade">
         <View style={styles.modalBg}>
            <View style={styles.modalBox}>
               <Text style={styles.modalTitle}>Scan & Pay</Text>
               <View style={styles.qrContainer}>
                  <Image 
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${UPI_ID}%26pn=SPC_Patna%26am=${totalAmount}%26cu=INR` }} 
                    style={styles.qrImage} 
                  />
               </View>
               <Text style={styles.qrHint}>Pay ₹{totalAmount} then click confirm</Text>
               
               <TouchableOpacity style={styles.confirmBtn} onPress={saveOrderToAdmin}>
                  <Text style={styles.confirmBtnText}>I HAVE PAID - PLACE ORDER</Text>
               </TouchableOpacity>

               <TouchableOpacity onPress={() => setShowQRModal(false)} style={{marginTop: 15}}>
                  <Text style={{color: '#94A3B8'}}>Cancel</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  label: { color: '#D4AF37', fontSize: 13, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  input: { 
    backgroundColor: '#002140', 
    color: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#003366',
    fontSize: 16
  },
  divider: { height: 1, backgroundColor: '#003366', marginVertical: 30 },
  payCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#002140', 
    padding: 18, 
    borderRadius: 15, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#003366' 
  },
  activeCard: { borderColor: '#D4AF37', backgroundColor: '#002d54' },
  payText: { color: '#fff', marginLeft: 15, fontSize: 16, flex: 1 },
  finalBtn: { 
    backgroundColor: '#D4AF37', 
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 20,
    elevation: 5
  },
  finalBtnText: { color: '#001529', fontWeight: 'bold', fontSize: 17 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#002140', padding: 25, borderRadius: 25, alignItems: 'center', width: '90%' },
  modalTitle: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  qrContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 15 },
  qrImage: { width: 200, height: 200 },
  qrHint: { color: '#fff', marginBottom: 20, opacity: 0.8 },
  confirmBtn: { backgroundColor: '#D4AF37', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  confirmBtnText: { color: '#001529', fontWeight: 'bold', fontSize: 15 }
});
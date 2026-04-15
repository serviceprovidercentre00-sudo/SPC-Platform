// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, SafeAreaView, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, Linking
} from 'react-native';
import { db, auth } from '../config/firebase'; // Auth import kiya hai userId ke liye

export default function ServiceDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [selectedParts, setSelectedParts] = useState([]);
  const [includeService, setIncludeService] = useState(true);

  // --- Checkout States ---
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  const UPI_ID = "6202379166@ptaxis";

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "services", id), (doc) => {
      if (doc.exists()) {
        setService({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#D4AF37" /></View>;
  if (!service) return <View style={styles.loader}><Text style={{color:'#fff'}}>Service Not Found</Text></View>;

  const serviceCharge = Number(service.price) || 0;
  const availableParts = service.parts || [];
  const partsTotal = selectedParts.reduce((sum, part) => sum + Number(part.price), 0);
  const grandTotal = includeService ? partsTotal + serviceCharge : partsTotal;

  const togglePart = (part) => {
    if (selectedParts.find(p => p.id === part.id)) {
      setSelectedParts(selectedParts.filter(p => p.id !== part.id));
    } else {
      setSelectedParts([...selectedParts, part]);
    }
  };

  // --- Order Logic ---
  const saveOrder = async () => {
    setOrderLoading(true);
    try {
      // Data ko 'orders' collection mein bhej rahe hain
      await addDoc(collection(db, "orders"), {
        userId: auth.currentUser?.uid || 'guest_user',
        serviceId: id,
        serviceName: service.name,
        parts: selectedParts,
        totalAmount: grandTotal,
        customerAddress: address,
        customerPhone: phone,
        paymentMethod: payMethod,
        status: 'New Order', // Admin panel ke liye consistent status
        createdAt: serverTimestamp(),
      });

      setShowCheckout(false);

      // Explore ki jagah seedha Orders page par redirect
      router.replace({
        pathname: '/orders',
        params: { success: 'true' }
      });

    } catch (e) {
      Alert.alert("Error", "Order save nahi ho paya: " + e.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!address || phone.length < 10) {
      return Alert.alert("Details Bhariye", "Pura address aur 10-digit phone number daalein.");
    }

    if (payMethod === 'online') {
      const upiUrl = `upi://pay?pa=${UPI_ID}&pn=SPC_Center&am=${grandTotal}&cu=INR`;
      const canOpen = await Linking.canOpenURL(upiUrl);
      if (canOpen) {
        await Linking.openURL(upiUrl);
        saveOrder();
      } else {
        Alert.alert("Error", "UPI App nahi mila. Cash select karein.");
      }
    } else {
      saveOrder();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Service Details', headerStyle: { backgroundColor: '#001529' }, headerTintColor: '#D4AF37', headerShown: true }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: service.image }} style={styles.banner} />
        
        <View style={styles.content}>
          <Text style={styles.title}>{service.name}</Text>
          <Text style={styles.subTitle}>Select parts & fitting options:</Text>

          {availableParts.map((part, index) => {
            const isSelected = selectedParts.find(p => p.id === part.id);
            return (
              <TouchableOpacity key={part.id || index} style={[styles.partCard, isSelected && styles.activePart]} onPress={() => togglePart(part)}>
                <Image source={{ uri: part.image }} style={styles.partImg} />
                <View style={styles.partDetails}>
                  <Text style={styles.partName}>{part.name}</Text>
                  <Text style={styles.partInfo}>{part.company} | {part.model}</Text>
                  <Text style={styles.partPrice}>₹{part.price}</Text>
                </View>
                <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color={isSelected ? "#D4AF37" : "#64748B"} />
              </TouchableOpacity>
            );
          })}

          <View style={styles.divider} />

          <TouchableOpacity style={[styles.serviceToggle, includeService && styles.activeServiceToggle]} onPress={() => setIncludeService(!includeService)}>
            <View style={styles.toggleIconBg}><Ionicons name="construct" size={20} color="#001529" /></View>
            <View style={{flex: 1, marginLeft: 10}}>
                <Text style={styles.serviceText}>Include Professional Fitting?</Text>
                <Text style={styles.servicePriceTag}>Charge: ₹{serviceCharge}</Text>
            </View>
            <Ionicons name={includeService ? "toggle" : "toggle-outline"} size={35} color={includeService ? "#D4AF37" : "#ccc"} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalVal}>₹{grandTotal}</Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => setShowCheckout(true)}>
          <Text style={styles.btnText}>CONFIRM BOOKING</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCheckout} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Booking</Text>
              <TouchableOpacity onPress={() => setShowCheckout(false)}><Ionicons name="close" size={28} color="#D4AF37" /></TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>FULL DELIVERY ADDRESS</Text>
              <TextInput style={[styles.input, {height: 80}]} multiline placeholder="Enter address..." placeholderTextColor="#666" value={address} onChangeText={setAddress} />

              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <TextInput style={styles.input} keyboardType="phone-pad" placeholder="10 digit number" placeholderTextColor="#666" value={phone} onChangeText={setPhone} maxLength={10} />

              <Text style={styles.inputLabel}>PAYMENT METHOD</Text>
              <View style={styles.payRow}>
                <TouchableOpacity style={[styles.payBtn, payMethod === 'cash' && styles.payBtnActive]} onPress={() => setPayMethod('cash')}>
                  <Ionicons name="cash" size={20} color={payMethod === 'cash' ? "#001529" : "#D4AF37"} />
                  <Text style={[styles.payBtnText, payMethod === 'cash' && styles.payBtnTextActive]}>Cash</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.payBtn, payMethod === 'online' && styles.payBtnActive]} onPress={() => setPayMethod('online')}>
                  <Ionicons name="card" size={20} color={payMethod === 'online' ? "#001529" : "#D4AF37"} />
                  <Text style={[styles.payBtnText, payMethod === 'online' && styles.payBtnTextActive]}>Online (UPI)</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.finalBtn} onPress={handleConfirmBooking} disabled={orderLoading}>
                {orderLoading ? <ActivityIndicator color="#001529" /> : <Text style={styles.finalBtnText}>ORDER NOW - ₹{grandTotal}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001529' },
  banner: { width: '100%', height: 200, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D4AF37' },
  subTitle: { fontSize: 14, color: '#94A3B8', marginVertical: 10 },
  partCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 15, backgroundColor: '#002140', marginBottom: 12, borderWidth: 1, borderColor: '#003366' },
  activePart: { borderColor: '#D4AF37', backgroundColor: '#002d5a' },
  partImg: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#001529' },
  partDetails: { flex: 1, marginLeft: 12 },
  partName: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  partInfo: { fontSize: 11, color: '#94A3B8' },
  partPrice: { fontSize: 16, fontWeight: 'bold', color: '#D4AF37', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#003366', marginVertical: 15 },
  serviceToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#002140', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#003366' },
  activeServiceToggle: { borderColor: '#D4AF37' },
  toggleIconBg: { backgroundColor: '#D4AF37', padding: 8, borderRadius: 10 },
  serviceText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  servicePriceTag: { fontSize: 12, color: '#D4AF37', fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopWidth: 1, borderColor: '#003366', backgroundColor: '#001529' },
  totalLabel: { fontSize: 12, color: '#94A3B8' },
  totalVal: { fontSize: 26, fontWeight: 'bold', color: '#D4AF37' },
  btn: { backgroundColor: '#D4AF37', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 },
  btnText: { color: '#001529', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#001529', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '75%', borderWidth: 1, borderColor: '#003366' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold' },
  inputLabel: { color: '#D4AF37', fontSize: 11, fontWeight: 'bold', marginBottom: 5, marginTop: 15 },
  input: { backgroundColor: '#002140', borderRadius: 12, padding: 15, color: '#FFF', borderWidth: 1, borderColor: '#003366' },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  payBtn: { flex: 0.48, flexDirection: 'row', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#D4AF37', justifyContent: 'center', alignItems: 'center' },
  payBtnActive: { backgroundColor: '#D4AF37' },
  payBtnText: { color: '#D4AF37', marginLeft: 8, fontWeight: 'bold' },
  payBtnTextActive: { color: '#001529' },
  finalBtn: { backgroundColor: '#D4AF37', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, marginBottom: 20 },
  finalBtnText: { color: '#001529', fontWeight: 'bold', fontSize: 16 }
});
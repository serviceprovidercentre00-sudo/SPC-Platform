// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, SafeAreaView, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, Linking, Platform
} from 'react-native';
import { db, auth } from '../config/firebase'; 

export default function ServiceDetails() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [selectedParts, setSelectedParts] = useState([]);
  const [includeService, setIncludeService] = useState(true);

  // Checkout Form States
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  const UPI_ID = "6202379166@ptaxis"; 

  useEffect(() => {
    if (!id) return;
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

  const saveOrder = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert("Login Required", "Please login to continue.");

    setOrderLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        serviceId: id,
        serviceName: service.name,
        parts: selectedParts,
        totalAmount: grandTotal,
        customerAddress: address.trim(),
        customerPhone: phone.trim(),
        paymentMethod: payMethod,
        status: 'Pending',
        createdAt: serverTimestamp(),
      });

      setShowCheckout(false);
      Alert.alert("Success! 🎉", "Aapka order confirm ho gaya hai.");
      
      // FIX: Absolute path with timeout for smooth transition
      setTimeout(() => {
        router.replace('/(tabs)/cart'); 
      }, 300);

    } catch (e) {
      Alert.alert("Error", "Order fail ho gaya. Try again.");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!address.trim() || phone.length < 10) return Alert.alert("Details Missing", "Sahi address aur phone bhariye.");

    if (payMethod === 'online') {
      const upiUrl = `upi://pay?pa=${UPI_ID}&pn=SPC_Patna&am=${grandTotal}&cu=INR`;
      const canOpen = await Linking.canOpenURL(upiUrl);
      if (canOpen) {
        await Linking.openURL(upiUrl);
        saveOrder(); // Background save
      } else {
        Alert.alert("UPI App Error", "PhonePe/GPay nahi mila. Cash use karein.");
      }
    } else {
      saveOrder();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: service.image }} style={styles.banner} />
        <View style={styles.content}>
          <Text style={styles.title}>{service.name}</Text>
          <Text style={styles.description}>{service.description || "SPC Professional Service in Patna."}</Text>
          
          <Text style={styles.sectionTitle}>Select Parts:</Text>
          {availableParts.map((part, index) => {
            const isSelected = selectedParts.find(p => p.id === part.id);
            return (
              <TouchableOpacity key={part.id || index} style={[styles.partCard, isSelected && styles.activePart]} onPress={() => togglePart(part)}>
                <View style={styles.partDetails}>
                  <Text style={styles.partName}>{part.name}</Text>
                  <Text style={styles.partPrice}>₹{part.price}</Text>
                </View>
                <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color={isSelected ? "#D4AF37" : "#64748B"} />
              </TouchableOpacity>
            );
          })}

          <View style={styles.divider} />
          
          <TouchableOpacity style={[styles.serviceToggle, includeService && styles.activeServiceToggle]} onPress={() => setIncludeService(!includeService)}>
            <View style={{flex:1}}>
                <Text style={styles.serviceText}>Include Expert Service?</Text>
                <Text style={styles.servicePriceTag}>Charge: ₹{serviceCharge}</Text>
            </View>
            <Ionicons name={includeService ? "toggle" : "toggle-outline"} size={35} color={includeService ? "#D4AF37" : "#ccc"} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalVal}>₹{grandTotal}</Text></View>
        <TouchableOpacity style={styles.btn} onPress={() => setShowCheckout(true)}>
          <Text style={styles.btnText}>BOOK NOW</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCheckout} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Checkout Details</Text>
                <TouchableOpacity onPress={() => setShowCheckout(false)}><Ionicons name="close" size={28} color="#D4AF37" /></TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>PATNA ADDRESS</Text>
            <TextInput style={styles.input} multiline value={address} onChangeText={setAddress} placeholder="Ghar ka pata..." placeholderTextColor="#64748B" />
            <Text style={styles.inputLabel}>WHATSAPP NO</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={10} placeholder="Mobile number..." placeholderTextColor="#64748B" />
            
            <View style={styles.payRow}>
                <TouchableOpacity style={[styles.payBtn, payMethod === 'cash' && styles.payBtnActive]} onPress={() => setPayMethod('cash')}>
                    <Text style={[styles.payBtnText, payMethod === 'cash' && styles.payBtnTextActive]}>Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.payBtn, payMethod === 'online' && styles.payBtnActive]} onPress={() => setPayMethod('online')}>
                    <Text style={[styles.payBtnText, payMethod === 'online' && styles.payBtnTextActive]}>UPI Pay</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.finalBtn} onPress={handleConfirm} disabled={orderLoading}>
                {orderLoading ? <ActivityIndicator color="#001529" /> : <Text style={styles.finalBtnText}>CONFIRM ORDER - ₹{grandTotal}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { width: '100%', height: 200 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  description: { color: '#94A3B8', marginTop: 5 },
  sectionTitle: { fontSize: 16, color: '#D4AF37', marginVertical: 15, fontWeight: 'bold' },
  partCard: { flexDirection: 'row', padding: 15, backgroundColor: '#002140', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#003366' },
  activePart: { borderColor: '#D4AF37' },
  partDetails: { flex: 1 },
  partName: { color: '#FFF', fontWeight: 'bold' },
  partPrice: { color: '#D4AF37' },
  divider: { height: 1, backgroundColor: '#003366', marginVertical: 15 },
  serviceToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#002140', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#003366' },
  activeServiceToggle: { borderColor: '#D4AF37' },
  serviceText: { color: '#FFF', fontWeight: 'bold' },
  servicePriceTag: { color: '#D4AF37', fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#001529', borderTopWidth: 1, borderColor: '#003366' },
  totalLabel: { color: '#94A3B8', fontSize: 12 },
  totalVal: { color: '#D4AF37', fontSize: 24, fontWeight: 'bold' },
  btn: { backgroundColor: '#D4AF37', paddingHorizontal: 30, borderRadius: 12, justifyContent: 'center' },
  btnText: { color: '#001529', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#001529', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  inputLabel: { color: '#D4AF37', fontSize: 11, marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#002140', padding: 15, color: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#003366' },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  payBtn: { flex: 0.48, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#D4AF37', alignItems: 'center' },
  payBtnActive: { backgroundColor: '#D4AF37' },
  payBtnText: { color: '#D4AF37', fontWeight: 'bold' },
  payBtnTextActive: { color: '#001529' },
  finalBtn: { backgroundColor: '#D4AF37', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 25 },
  finalBtnText: { color: '#001529', fontWeight: 'bold', fontSize: 16 }
});
// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
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

    // --- NAYA: Auto-load User Profile Data ---
    const fetchUserProfile = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.address) setAddress(userData.address);
          if (userData.phone) setPhone(userData.phone);
        }
      }
    };
    fetchUserProfile();

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
    setOrderLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: auth.currentUser?.uid || 'guest_user',
        userName: auth.currentUser?.displayName || 'SPC Customer',
        userEmail: auth.currentUser?.email || '',
        serviceId: id,
        serviceName: service.name,
        parts: selectedParts,
        totalAmount: grandTotal,
        address: address, // Field name consistent with Admin Panel
        phone: phone,
        paymentMethod: payMethod,
        status: 'Pending', 
        createdAt: serverTimestamp(),
      });

      setShowCheckout(false);
      Alert.alert("Success", "Aapka order Patna SPC Center mein book ho gaya hai!");
      router.replace('/orders');

    } catch (e) {
      Alert.alert("Error", "Order save nahi ho paya: " + e.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!address.trim() || phone.length < 10) {
      return Alert.alert("Incomplete Data", "Address aur valid phone number zaroori hai.");
    }

    if (payMethod === 'online') {
      const upiUrl = `upi://pay?pa=${UPI_ID}&pn=SPC_Center&am=${grandTotal}&cu=INR`;
      try {
        const canOpen = await Linking.canOpenURL(upiUrl);
        if (canOpen) {
          await Linking.openURL(upiUrl);
          saveOrder();
        } else {
          Alert.alert("UPI Not Found", "Phone mein koi UPI app nahi mila. Cash on Delivery select karein.");
        }
      } catch (err) {
        saveOrder(); // Fallback for web testing
      }
    } else {
      saveOrder();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Service Checkout', headerStyle: { backgroundColor: '#001529' }, headerTintColor: '#D4AF37', headerShown: true }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: service.image }} style={styles.banner} />
        
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{service.name}</Text>
            <View style={styles.ratingTag}>
                <Ionicons name="star" size={12} color="#001529" />
                <Text style={styles.ratingText}>Top Rated</Text>
            </View>
          </View>
          
          <Text style={styles.subTitle}>Select parts & genuine components:</Text>

          {availableParts.map((part, index) => {
            const isSelected = selectedParts.find(p => p.id === part.id);
            return (
              <TouchableOpacity key={part.id || index} style={[styles.partCard, isSelected && styles.activePart]} onPress={() => togglePart(part)}>
                <Image source={{ uri: part.image }} style={styles.partImg} />
                <View style={styles.partDetails}>
                  <Text style={styles.partName}>{part.name}</Text>
                  <Text style={styles.partInfo}>{part.company} • {part.model}</Text>
                  <View style={styles.badgeRow}>
                     <Text style={styles.partPrice}>₹{part.price}</Text>
                     <View style={styles.warrantyBadge}><Text style={styles.warrantyText}>Genuine</Text></View>
                  </View>
                </View>
                <Ionicons name={isSelected ? "checkmark-circle" : "add-circle-outline"} size={26} color={isSelected ? "#D4AF37" : "#334155"} />
              </TouchableOpacity>
            );
          })}

          <View style={styles.divider} />

          <TouchableOpacity style={[styles.serviceToggle, includeService && styles.activeServiceToggle]} onPress={() => setIncludeService(!includeService)}>
            <View style={styles.toggleIconBg}><Ionicons name="build" size={20} color="#001529" /></View>
            <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.serviceText}>Professional Installation</Text>
                <Text style={styles.servicePriceTag}>Verified Expert Service: ₹{serviceCharge}</Text>
            </View>
            <Ionicons name={includeService ? "checkbox" : "square-outline"} size={24} color={includeService ? "#D4AF37" : "#ccc"} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalVal}>₹{grandTotal}</Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => setShowCheckout(true)}>
          <Text style={styles.btnText}>BOOK SERVICE ➔</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCheckout} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Order Summary</Text>
                <Text style={styles.summaryText}>{selectedParts.length} Parts + Service</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCheckout(false)}><Ionicons name="close-circle" size={32} color="#D4AF37" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.summaryBox}>
                 <Text style={styles.summaryTitle}>Selected Items:</Text>
                 {selectedParts.map(p => (
                   <Text key={p.id} style={styles.summaryItem}>• {p.name} (₹{p.price})</Text>
                 ))}
                 {includeService && <Text style={styles.summaryItem}>• Expert Visit & Fitting (₹{serviceCharge})</Text>}
              </View>

              <Text style={styles.inputLabel}>PATNA DELIVERY ADDRESS</Text>
              <TextInput 
                style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
                multiline 
                placeholder="Ghar ka address, Landmark ke saath..." 
                placeholderTextColor="#64748B" 
                value={address} 
                onChangeText={setAddress} 
              />

              <Text style={styles.inputLabel}>CONTACT NUMBER</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="phone-pad" 
                placeholder="Mobile number..." 
                placeholderTextColor="#64748B" 
                value={phone} 
                onChangeText={setPhone} 
                maxLength={10} 
              />

              <Text style={styles.inputLabel}>PAYMENT METHOD</Text>
              <View style={styles.payRow}>
                <TouchableOpacity style={[styles.payBtn, payMethod === 'cash' && styles.payBtnActive]} onPress={() => setPayMethod('cash')}>
                  <Ionicons name="cash-outline" size={18} color={payMethod === 'cash' ? "#001529" : "#D4AF37"} />
                  <Text style={[styles.payBtnText, payMethod === 'cash' && styles.payBtnTextActive]}>Cash</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.payBtn, payMethod === 'online' && styles.payBtnActive]} onPress={() => setPayMethod('online')}>
                  <Ionicons name="flash-outline" size={18} color={payMethod === 'online' ? "#001529" : "#D4AF37"} />
                  <Text style={[styles.payBtnText, payMethod === 'online' && styles.payBtnTextActive]}>UPI Pay</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.finalBtn} onPress={handleConfirmBooking} disabled={orderLoading}>
                {orderLoading ? <ActivityIndicator color="#001529" /> : <Text style={styles.finalBtnText}>PLACE ORDER - ₹{grandTotal}</Text>}
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
  banner: { width: '100%', height: 220, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#D4AF37' },
  ratingTag: { backgroundColor: '#D4AF37', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 10, fontWeight: 'bold', marginLeft: 4, color: '#001529' },
  subTitle: { fontSize: 13, color: '#64748B', marginTop: 8, marginBottom: 15, letterSpacing: 0.5 },
  partCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, backgroundColor: '#001c3d', marginBottom: 15, borderWidth: 1, borderColor: '#1e293b' },
  activePart: { borderColor: '#D4AF37', backgroundColor: '#00264d' },
  partImg: { width: 65, height: 65, borderRadius: 15, backgroundColor: '#001529' },
  partDetails: { flex: 1, marginLeft: 15 },
  partName: { fontSize: 17, fontWeight: 'bold', color: '#FFF' },
  partInfo: { fontSize: 12, color: '#64748B', marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  partPrice: { fontSize: 18, fontWeight: 'bold', color: '#D4AF37' },
  warrantyBadge: { backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 10 },
  warrantyText: { color: '#D4AF37', fontSize: 9, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 20 },
  serviceToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#001c3d', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  activeServiceToggle: { borderColor: '#D4AF37' },
  toggleIconBg: { backgroundColor: '#D4AF37', padding: 10, borderRadius: 12 },
  serviceText: { fontSize: 15, fontWeight: 'bold', color: '#FFF' },
  servicePriceTag: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderTopWidth: 1, borderColor: '#1e293b', backgroundColor: '#001529' },
  totalLabel: { fontSize: 12, color: '#64748B', fontWeight: 'bold' },
  totalVal: { fontSize: 28, fontWeight: '900', color: '#D4AF37' },
  btn: { backgroundColor: '#D4AF37', paddingVertical: 16, paddingHorizontal: 25, borderRadius: 18, elevation: 10 },
  btnText: { color: '#001529', fontWeight: '900', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#001529', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, height: '85%', borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  modalTitle: { color: '#D4AF37', fontSize: 22, fontWeight: 'bold' },
  summaryText: { color: '#64748B', fontSize: 13 },
  summaryBox: { backgroundColor: '#001c3d', padding: 15, borderRadius: 15, marginBottom: 10 },
  summaryTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  summaryItem: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  inputLabel: { color: '#D4AF37', fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 20, letterSpacing: 1 },
  input: { backgroundColor: '#001c3d', borderRadius: 15, padding: 15, color: '#FFF', borderWidth: 1, borderColor: '#1e293b', fontSize: 15 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  payBtn: { flex: 0.48, flexDirection: 'row', padding: 16, borderRadius: 15, borderWidth: 1, borderColor: '#D4AF37', justifyContent: 'center', alignItems: 'center' },
  payBtnActive: { backgroundColor: '#D4AF37' },
  payBtnText: { color: '#D4AF37', marginLeft: 8, fontWeight: 'bold', fontSize: 14 },
  payBtnTextActive: { color: '#001529' },
  finalBtn: { backgroundColor: '#D4AF37', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 35, marginBottom: 30 },
  finalBtnText: { color: '#001529', fontWeight: '900', fontSize: 16 }
});
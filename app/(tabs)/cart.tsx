// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { auth, db } from '../../config/firebase';
import { useCart } from '../../context/CartContext';

export default function CartScreen() {
  const { cartItems = [], clearCart, removeFromCart } = useCart();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
  const [myOrders, setMyOrders] = useState([]);
  const router = useRouter();

  const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  // Fetch Orders Logic
  useEffect(() => {
    const user = auth?.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "orders"), // Make sure collection name is correct
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const confirmBooking = async () => {
    const user = auth?.currentUser;
    if (!user) {
      Alert.alert("SPC Patna", "Booking ke liye login zaroori hai.", [
        { text: "Login Karein", onPress: () => router.push('/profile') }
      ]);
      return;
    }

    if (cartItems.length === 0) return Alert.alert("Cart Khali Hai", "Pehle koi service select karein.");
    if (!address.trim() || phone.length < 10) return Alert.alert("Details Bhariye", "Address aur 10-digit phone number zaroori hai.");

    setLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0],
        items: cartItems.map((item) => ({ id: item.id, name: item.name, price: Number(item.price) })),
        totalAmount: total,
        address: address.trim(),
        phone: phone.trim(),
        status: 'New Order', // Consistent with Checkout
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success! 🎉", "Aapki booking mil gayi hai. SPC Technician jald hi contact karenge.");
      clearCart();
      setActiveTab('history');
    } catch (e) {
      Alert.alert("Error", "Booking confirm nahi ho saki.");
    } finally {
      setLoading(false);
    }
  };

  const renderTracker = (status) => {
    // UPDATED: Added 'New Order' and 'Accepted' to levels
    const levels = ['New Order', 'Accepted', 'Assigned', 'Completed'];
    
    // Normalize status to match levels (Handle Pending as New Order)
    let currentStatus = status === 'Pending' ? 'New Order' : status;
    const currentIndex = levels.indexOf(currentStatus);
    
    return (
      <View style={styles.trackerContainer}>
        {levels.map((lvl, index) => (
          <View key={lvl} style={styles.stepWrapper}>
            <View style={[styles.dot, index <= currentIndex && styles.activeDot]} />
            <Text style={[styles.stepText, index <= currentIndex && styles.activeStepText]}>
              {lvl === 'New Order' ? 'Booked' : lvl}
            </Text>
            {index < levels.length - 1 && (
              <View style={[styles.line, index < currentIndex && styles.activeLine]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Stack.Screen options={{ 
        title: 'SPC Bookings', 
        headerShown: true,
        headerStyle: { backgroundColor: '#001529' },
        headerTintColor: '#D4AF37'
      }} />
      
      {/* Tab Switcher */}
      <View style={styles.tabHeader}>
        <TouchableOpacity onPress={() => setActiveTab('new')} style={[styles.tab, activeTab === 'new' && styles.activeTabBorder]}>
          <Ionicons name="cart" size={18} color={activeTab === 'new' ? '#D4AF37' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>New Order</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('history')} style={[styles.tab, activeTab === 'history' && styles.activeTabBorder]}>
          <Ionicons name="time" size={18} color={activeTab === 'history' ? '#D4AF37' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Track Status</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'new' ? (
          cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="basket-outline" size={80} color="#CBD5E1" />
              <Text style={styles.emptyTxt}>Aapne koi service select nahi ki hai.</Text>
              <TouchableOpacity style={styles.goHomeBtn} onPress={() => router.push('/')}>
                <Text style={{color: '#FFF', fontWeight: 'bold'}}>Services Dekhein</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Selected Services</Text>
              {cartItems.map(item => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={{flex: 1}}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>DELIVERY ADDRESS (PATNA REGION)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Street, Landmark, Area..." 
                  placeholderTextColor="#94A3B8"
                  onChangeText={setAddress} 
                  value={address}
                  multiline
                />
                <Text style={styles.inputLabel}>CONTACT NUMBER</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="10 Digit Mobile Number" 
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric" 
                  maxLength={10} 
                  onChangeText={setPhone} 
                  value={phone} 
                />
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Payable:</Text>
                  <Text style={styles.totalPrice}>₹{total}</Text>
                </View>

                <TouchableOpacity style={styles.bookBtn} onPress={confirmBooking} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.bookBtnText}>CONFIRM BOOKING</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )
        ) : (
          myOrders.length === 0 ? (
            <View style={styles.emptyContainer}><Text style={styles.emptyTxt}>Abhi tak koi order nahi hai.</Text></View>
          ) : (
            myOrders.map(order => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderID}>ID: #{order.id.slice(0,6).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{order.createdAt?.toDate().toLocaleDateString()}</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                     <Text style={styles.orderTotal}>₹{order.totalPayable || order.totalAmount}</Text>
                     <Text style={[styles.statusBadge, {color: order.status === 'Completed' ? '#059669' : '#D4AF37'}]}>{order.status}</Text>
                  </View>
                </View>
                
                {renderTracker(order.status)}

                {order.technicianName && (
                  <View style={styles.techBox}>
                    <View style={{flex: 1}}>
                      <Text style={styles.techName}>Technician: {order.technicianName}</Text>
                      <Text style={styles.techSub}>Arriving for service</Text>
                    </View>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.technicianPhone}`)} style={styles.callBtn}>
                      <Ionicons name="call" size={18} color="#FFF" />
                      <Text style={{color:'#FFF', fontWeight: 'bold', marginLeft: 5}}>Call</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' }, // Dark background like theme
  tabHeader: { flexDirection: 'row', backgroundColor: '#002140', borderBottomWidth: 1, borderBottomColor: '#003366' },
  tab: { flex: 1, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  activeTabBorder: { borderBottomWidth: 3, borderBottomColor: '#D4AF37' },
  tabText: { color: '#94A3B8', fontWeight: 'bold', fontSize: 14 },
  activeTabText: { color: '#D4AF37' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#D4AF37', marginBottom: 12 },
  itemCard: { backgroundColor: '#002140', padding: 15, borderRadius: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#003366' },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#FFF' },
  itemPrice: { color: '#D4AF37', fontWeight: 'bold', marginTop: 2 },
  removeBtn: { padding: 8 },
  formCard: { backgroundColor: '#002140', padding: 20, borderRadius: 20, marginTop: 10, borderWidth: 1, borderColor: '#003366' },
  inputLabel: { fontSize: 11, fontWeight: 'bold', color: '#D4AF37', marginBottom: 6 },
  input: { backgroundColor: '#001529', borderRadius: 12, padding: 12, marginBottom: 15, color: '#FFF', borderWidth: 1, borderColor: '#003366' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#003366' },
  totalLabel: { fontSize: 16, color: '#94A3B8' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#D4AF37' },
  bookBtn: { backgroundColor: '#D4AF37', padding: 18, borderRadius: 15, alignItems: 'center' },
  bookBtnText: { color: '#001529', fontWeight: 'bold', fontSize: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyTxt: { color: '#94A3B8', marginTop: 15, textAlign: 'center' },
  goHomeBtn: { backgroundColor: '#D4AF37', padding: 12, borderRadius: 10, marginTop: 20 },
  orderCard: { backgroundColor: '#002140', padding: 18, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#003366' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  orderID: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  orderDate: { color: '#94A3B8', fontSize: 12 },
  orderTotal: { fontSize: 18, fontWeight: 'bold', color: '#D4AF37' },
  statusBadge: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  trackerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, marginTop: 10 },
  stepWrapper: { alignItems: 'center', flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#003366', zIndex: 2 },
  activeDot: { backgroundColor: '#D4AF37', borderWidth: 2, borderColor: '#FFF' },
  line: { position: 'absolute', top: 5, left: '50%', width: '100%', height: 2, backgroundColor: '#003366', zIndex: 1 },
  activeLine: { backgroundColor: '#D4AF37' },
  stepText: { fontSize: 9, marginTop: 8, color: '#94A3B8', textAlign: 'center' },
  activeStepText: { color: '#D4AF37', fontWeight: 'bold' },
  techBox: { marginTop: 15, padding: 12, backgroundColor: '#002d54', borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  techName: { fontWeight: 'bold', color: '#FFF', fontSize: 14 },
  techSub: { fontSize: 11, color: '#94A3B8' },
  callBtn: { backgroundColor: '#22C55E', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }
});
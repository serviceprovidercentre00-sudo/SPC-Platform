// @ts-nocheck
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Image, Linking, Platform,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from 'react-native';

import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from '../../config/firebase';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { addToCart, cart } = useCart(); 
  const [services, setServices] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (curr) => setUser(curr));

    const qServices = query(collection(db, "services"), orderBy("createdAt", "desc"));
    const unsubServices = onSnapshot(qServices, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    const qBanners = query(collection(db, "banners"));
    const unsubBanners = onSnapshot(qBanners, (snap) => {
      setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubAuth(); unsubServices(); unsubBanners(); };
  }, []);

  const handleBooking = (item) => {
    const msg = "Service add karne ke liye login karein.";
    if (!user) {
      if (Platform.OS === 'web') {
        if (confirm(msg)) router.push('/auth');
      } else {
        Alert.alert("Login Required", msg, [
          { text: "Cancel" },
          { text: "Login", onPress: () => router.push('/auth') }
        ]);
      }
    } else {
      addToCart(item);
    }
  };

  const filteredServices = services.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002D62" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.nav}>
          <View>
            <Text style={styles.logo}>SPC <Text style={{fontSize:12, color:'#FFF'}}>PATNA</Text></Text>
            <Text style={styles.welcome}>{user ? `Hi, ${user.displayName || user.email?.split('@')[0]}` : 'Welcome to SPC'}</Text>
          </View>
          <TouchableOpacity style={styles.cartIcon} onPress={() => router.push('/cart')}>
            <Text style={{fontSize:22}}>🛒</Text>
            {cart?.length > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{cart.length}</Text></View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Text style={{marginRight:10}}>🔍</Text>
          <TextInput 
            placeholder="Search AC, Laptop, Cleaning..." 
            style={styles.searchInput} 
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8" 
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 30}}>
        
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.bannerArea}>
          {banners.length > 0 ? (
            banners.map((b) => (
              <View key={b.id} style={styles.bannerCard}>
                <Image source={{ uri: b.image || b.imageUrl }} style={styles.imgFull} />
              </View>
            ))
          ) : (
            <View style={styles.defaultBanner}>
              <Text style={styles.defaultBannerText}>3 MAHINE KI KAAM KI ZIMMEDARI 🛠️</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.emergencyBtn} onPress={() => Linking.openURL('tel:+918409372138')}>
          <Text style={styles.emergencyText}>📞 Emergency Repair: Call Now</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Services</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#002D62" style={{marginTop: 20}} />
          ) : (
            filteredServices.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image 
                  source={{ uri: item.image || item.imageUrl || 'https://via.placeholder.com/150' }} 
                  style={styles.cardImg} 
                />
                <View style={styles.cardDetails}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardPrice}>₹{item.price}</Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleBooking(item)}>
                    <Text style={styles.addBtnText}>ADD +</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    backgroundColor: '#002D62', 
    padding: 20, 
    paddingTop: Platform.OS === 'android' ? 45 : 20, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30 
  },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: '#D4AF37', fontSize: 24, fontWeight: 'bold' },
  welcome: { color: '#CBD5E1', fontSize: 13 },
  cartIcon: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 15 },
  badge: { position: 'absolute', right: -6, top: -6, backgroundColor: '#EF4444', borderRadius: 10, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#002D62' },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 10, marginTop: 20, alignItems: 'center', elevation: 5 },
  searchInput: { flex: 1, height: 40, color: '#1E293B' },
  bannerArea: { marginTop: 20 },
  bannerCard: { width: width - 40, height: 180, marginHorizontal: 20, borderRadius: 20, overflow: 'hidden' },
  imgFull: { width: '100%', height: '100%', resizeMode: 'cover' },
  defaultBanner: { width: width - 40, height: 150, marginHorizontal: 20, backgroundColor: '#BAE6FD', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  defaultBannerText: { color: '#002D62', fontWeight: 'bold', fontSize: 16 },
  emergencyBtn: { backgroundColor: '#D4AF37', margin: 20, padding: 16, borderRadius: 15, alignItems: 'center', elevation: 4 },
  emergencyText: { color: '#002D62', fontWeight: '800', fontSize: 15 },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#1E293B' },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 20, marginBottom: 15, elevation: 3 },
  cardImg: { width: 100, height: 100, borderRadius: 15 },
  cardDetails: { flex: 1, marginLeft: 15, justifyContent: 'space-between', paddingVertical: 5 },
  cardName: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  cardPrice: { fontSize: 16, color: '#002D62', fontWeight: '600' },
  addBtn: { backgroundColor: '#002D62', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, alignSelf: 'flex-start' },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 }
});
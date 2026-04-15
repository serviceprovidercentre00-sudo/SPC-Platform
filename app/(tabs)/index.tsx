// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Dimensions, Image, Linking, Platform,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View, Alert
} from 'react-native';
import { auth, db } from '../../config/firebase';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { cartItems, addToCart } = useCart(); // addToCart yahan direct booking ke liye add kiya
  const scrollRef = useRef(null);
  
  const [services, setServices] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (curr) => setUser(curr));

    const unsubCats = onSnapshot(query(collection(db, "categories"), orderBy("name", "asc")), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories([{ id: 'all', name: 'All', icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png' }, ...data]);
    });

    const unsubServices = onSnapshot(query(collection(db, "services"), orderBy("createdAt", "desc")), (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubBanners = onSnapshot(query(collection(db, "banners")), (snap) => {
      const bData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBanners(bData);
    });

    return () => { unsubAuth(); unsubServices(); unsubBanners(); unsubCats(); };
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        let nextIndex = activeBanner + 1;
        if (nextIndex >= banners.length) nextIndex = 0;
        setActiveBanner(nextIndex);
        scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      }, 3500); 
      return () => clearInterval(interval);
    }
  }, [activeBanner, banners]);

  // Quick Book Logic: Direct Cart mein dalo aur Checkout par bhej do
  const handleQuickBook = (item) => {
    addToCart(item);
    router.push('/checkout');
  };

  const filteredServices = services.filter(s => 
    (selectedCat === 'All' || s.category === selectedCat) &&
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
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/cart')}>
            <Ionicons name="cart-outline" size={26} color="#FFF" />
            {cartItems?.length > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{cartItems.length}</Text></View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94A3B8" style={{marginRight: 10}} />
          <TextInput 
            placeholder="Search for any service..." 
            style={styles.searchInput} 
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8" 
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
        
        <View style={styles.catWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 15}}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} onPress={() => setSelectedCat(cat.name)} style={styles.catItem}>
                <View style={[styles.iconBox, selectedCat === cat.name && styles.activeIconBox]}>
                  <Image source={{ uri: cat.icon }} style={styles.catIcon} />
                </View>
                <Text style={[styles.catLabel, selectedCat === cat.name && styles.activeLabel]}>{cat.name}</Text>
                {selectedCat === cat.name && <View style={styles.indicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.bannerContainer}>
          {banners.length > 0 ? (
            <View>
              <ScrollView 
                ref={scrollRef}
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setActiveBanner(Math.round(e.nativeEvent.contentOffset.x / width))}
              >
                {banners.map((b) => (
                  <View key={b.id} style={styles.bannerSlide}>
                    <Image 
                      source={{ uri: b.imageUrl || b.image || b.imgUrl }} 
                      style={styles.bannerImage} 
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
              <View style={styles.dotRow}>
                {banners.map((_, i) => (
                  <View key={i} style={[styles.dot, activeBanner === i && styles.activeDot]} />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.bannerLoading}>
                <ActivityIndicator color="#002D62" />
                <Text style={styles.fallbackTxt}>3 MAHINE KI KAAM KI ZIMMEDARI 🛠️</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.emergencyRow} onPress={() => Linking.openURL('tel:+918409372138')}>
          <Ionicons name="call" size={20} color="#002D62" />
          <Text style={styles.emergencyTxt}>Emergency Repair: Call Now</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{selectedCat} Services</Text>
          <View style={styles.grid}>
            {loading ? <ActivityIndicator size="large" color="#002D62" /> : (
              filteredServices.map((item) => (
                <View key={item.id} style={styles.gridCard}>
                  <Image source={{ uri: item.image || item.imageUrl }} style={styles.cardImg} />
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cardPrice}>Starts ₹{item.price}</Text>
                  
                  {/* NEW QUICK BOOK BUTTON FOR SIMPLE USERS */}
                  <TouchableOpacity 
                    style={styles.quickBookBtn} 
                    onPress={() => handleQuickBook(item)}
                  >
                    <Text style={styles.quickBookTxt}>BOOK NOW</Text>
                  </TouchableOpacity>

                  {/* VIEW DETAILS BUTTON (Path Updated to /[id]) */}
                  <TouchableOpacity 
                    style={styles.viewLink} 
                    onPress={() => router.push({ pathname: `/${item.id}` })}
                  >
                    <Text style={styles.viewLinkTxt}>VIEW DETAILS</Text>
                    <Ionicons name="arrow-forward" size={12} color="#64748B" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Join Our Community</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com/serviceprovidercentre')}>
              <Ionicons name="logo-instagram" size={35} color="#E1306C" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/share/1DzMopBFir/')}>
              <Ionicons name="logo-facebook" size={35} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://whatsapp.com/channel/0029VbBqtdYCXC3I0z25tn2f')}>
              <Ionicons name="logo-whatsapp" size={35} color="#25D366" />
            </TouchableOpacity>
          </View>

          <View style={styles.appBox}>
            <Text style={styles.appHint}>For the best experience, download our app</Text>
            <TouchableOpacity style={styles.playStoreBtn} onPress={() => Alert.alert("Coming Soon", "App jald hi Play Store par aayegi!")}>
              <Ionicons name="logo-google-playstore" size={20} color="#FFF" />
              <Text style={styles.playStoreTxt}>Google Play</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.copyright}>© 2026 Service Provider Centre | Patna</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#002D62', padding: 20, paddingTop: 45, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 8 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: '#D4AF37', fontSize: 24, fontWeight: 'bold' },
  welcome: { color: '#CBD5E1', fontSize: 13 },
  cartBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 15 },
  badge: { position: 'absolute', right: -4, top: -4, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#002D62' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 10, marginTop: 20, alignItems: 'center' },
  searchInput: { flex: 1, height: 40, color: '#1E293B' },

  catWrapper: { marginVertical: 15 },
  catItem: { alignItems: 'center', width: 80, marginHorizontal: 5 },
  iconBox: { width: 55, height: 55, borderRadius: 15, backgroundColor: '#FFF', elevation: 3, justifyContent: 'center', alignItems: 'center' },
  activeIconBox: { backgroundColor: '#002D62' },
  catIcon: { width: 35, height: 35, resizeMode: 'contain' },
  catLabel: { fontSize: 11, marginTop: 6, color: '#64748B', fontWeight: '600' },
  activeLabel: { color: '#002D62' },
  indicator: { height: 3, width: 20, backgroundColor: '#002D62', marginTop: 4, borderRadius: 2 },

  bannerContainer: { height: 190, marginVertical: 10 },
  bannerSlide: { width: width, paddingHorizontal: 20, height: 180 },
  bannerImage: { width: '100%', height: '100%', borderRadius: 20, backgroundColor: '#E2E8F0' },
  dotRow: { flexDirection: 'row', position: 'absolute', bottom: 15, alignSelf: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 3 },
  activeDot: { backgroundColor: '#FFF', width: 18 },
  bannerLoading: { width: width - 40, height: 170, marginHorizontal: 20, backgroundColor: '#E0F2FE', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#002D62' },
  fallbackTxt: { color: '#002D62', fontWeight: 'bold', marginTop: 10 },

  emergencyRow: { backgroundColor: '#D4AF37', margin: 20, padding: 16, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 4 },
  emergencyTxt: { color: '#002D62', fontWeight: '900', fontSize: 15 },

  section: { paddingHorizontal: 15 },
  sectionTitle: { fontSize: 19, fontWeight: 'bold', marginBottom: 15, color: '#1E293B' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 22, padding: 10, marginBottom: 15, elevation: 4 },
  cardImg: { width: '100%', height: 115, borderRadius: 18 },
  cardName: { fontSize: 14, fontWeight: '700', marginTop: 10, color: '#1E293B' },
  cardPrice: { fontSize: 13, color: '#059669', fontWeight: 'bold', marginVertical: 4 },
  
  // NEW STYLE FOR QUICK BOOK BUTTON
  quickBookBtn: { backgroundColor: '#002D62', paddingVertical: 8, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  quickBookTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },

  viewLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 8, marginTop: 5 },
  viewLinkTxt: { color: '#64748B', fontWeight: '600', fontSize: 11 },

  footer: { padding: 30, alignItems: 'center', backgroundColor: '#FFF', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: 25, elevation: 20 },
  footerTitle: { fontSize: 16, fontWeight: 'bold', color: '#002D62', marginBottom: 20 },
  socialIcons: { flexDirection: 'row', gap: 35, marginBottom: 30 },
  appBox: { width: '100%', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  appHint: { fontSize: 12, color: '#94A3B8', marginBottom: 15 },
  playStoreBtn: { flexDirection: 'row', backgroundColor: '#111827', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 14, alignItems: 'center', gap: 10 },
  playStoreTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  copyright: { fontSize: 10, color: '#94A3B8', marginTop: 30 }
});
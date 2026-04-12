// @ts-nocheck
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { auth } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons'; // Expo icons ka use professional look ke liye

const { width } = Dimensions.get('window');

export default function AdminMenu() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // ⚠️ Aapki Protected UID
  const ADMIN_UID = "PSvi6ahqZ2eyPRbgGx5GoyndCch1"; 

  const checkAccess = useCallback(() => {
    const user = auth.currentUser;
    if (user && user.uid === ADMIN_UID) {
      setIsAuth(true);
      setLoading(false);
    } else {
      setTimeout(() => {
        router.replace('/admin/login');
      }, 100);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkAccess();
    }, [checkAccess])
  );

  // Professional Grid Items
  const menuItems = [
    { id: 1, name: 'Orders', icon: 'cart-outline', path: '/admin/orders', color: '#D4AF37' },
    { id: 2, name: 'Services', icon: 'construct-outline', path: '/admin/services', color: '#28A745' },
    { id: 3, name: 'Banners', icon: 'images-outline', path: '/admin/banners', color: '#007BFF' },
    { id: 4, name: 'Workers', icon: 'people-outline', path: '/admin/workers', color: '#6C757D' },
    { id: 5, name: 'Users', icon: 'person-circle-outline', path: '/admin/users', color: '#17A2B8' },
    { id: 6, name: 'Revenue', icon: 'trending-up-outline', path: '/admin/revenue', color: '#E83E8C' },
    { id: 7, name: 'Settings', icon: 'settings-outline', path: '/admin/settings', color: '#5D6D7E' }, // Naya Setting Tab
  ];

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={{color:'#D4AF37', marginTop:10, letterSpacing: 1}}>AUTHENTICATING...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'SPC COMMAND CENTER', 
        headerStyle: {backgroundColor: '#001529'},
        headerTintColor: '#D4AF37',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => null,
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.welcomeText}>Welcome back, Admin</Text>
          <Text style={styles.subText}>SPC Service Management System v2.0</Text>
        </View>

        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card} 
              onPress={() => router.push(item.path)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={styles.cardLabel}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => auth.signOut().then(() => router.replace('/admin/login'))}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>SECURE LOGOUT</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Securely Encrypted for SPC Patna</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' }, // Dark Professional Theme
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001529' },
  scrollContent: { padding: 20 },
  headerSection: { marginBottom: 25, marginTop: 10 },
  welcomeText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subText: { color: '#D4AF37', fontSize: 12, marginTop: 5, opacity: 0.8, letterSpacing: 1 },
  
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  card: { 
    backgroundColor: '#002140', 
    width: (width - 60) / 2, 
    height: 130, 
    borderRadius: 20, 
    padding: 15,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  cardLabel: { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  
  logoutBtn: { 
    flexDirection: 'row',
    backgroundColor: '#C0392B', 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 20,
    elevation: 5
  },
  logoutText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, letterSpacing: 1 },
  footerText: { textAlign: 'center', color: '#444', marginTop: 30, fontSize: 10, letterSpacing: 2 }
});
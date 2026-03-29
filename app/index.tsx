import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform, 
  Dimensions,
  Image
} from 'react-native';
import { Stack } from 'expo-router';

const { width } = Dimensions.get('window');

// Service Data
const SERVICES = [
  { id: 1, name: 'AC Repair', icon: '❄️', desc: 'Expert cooling solutions' },
  { id: 2, name: 'Fridge Service', icon: '🧊', desc: 'Repair & maintenance' },
  { id: 3, name: 'Electronics', icon: '⚡', desc: 'TV, Washing Machine, etc.' },
  { id: 4, name: 'Cyber Services', icon: '💻', desc: 'Online forms & digital help' },
  { id: 5, name: 'Home Wiring', icon: '🔌', desc: 'Safe electrical fitting' },
  { id: 6, name: 'Installation', icon: '🛠️', desc: 'Wall mount & setup' },
];

export default function HomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleAction = (title: string) => {
    if (!isLoggedIn) {
      alert(`Please Login/Signup to access ${title} details.`);
    } else {
      console.log("Navigating to:", title);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Configuration */}
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />

      {/* Custom Navbar */}
      <View style={styles.nav}>
        <View>
          <Text style={styles.logoMain}>SPC</Text>
          <Text style={styles.logoSub}>PLATFORM</Text>
        </View>
        <TouchableOpacity 
          style={styles.authBtn} 
          onPress={() => setIsLoggedIn(!isLoggedIn)}
        >
          <Text style={styles.authBtnText}>{isLoggedIn ? 'MY ACCOUNT' : 'LOGIN / SIGNUP'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Professional Home Services</Text>
          <Text style={styles.heroTagline}>3 Mahine ki kaam ki zimmedari ke saath</Text>
          <View style={styles.divider} />
        </View>

        {/* Services Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Our Top Categories</Text>
          <View style={styles.goldLine} />
        </View>

        <View style={styles.grid}>
          {SERVICES.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => handleAction(item.name)}
            >
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
              <View style={styles.bookNow}>
                <Text style={styles.bookText}>VIEW DETAIL</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trust Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>SPC SERVICE PROVIDER CENTER</Text>
          <Text style={styles.footerCopy}>© 2026 | Trusted & Verified Professionals</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  nav: {
    backgroundColor: '#002D62', // Professional Deep Blue
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37', // Gold Border
  },
  logoMain: {
    color: '#D4AF37', // Gold
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  logoSub: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: -4,
  },
  authBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
  },
  authBtnText: {
    color: '#002D62',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hero: {
    backgroundColor: '#002D62',
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  heroTagline: {
    color: '#D4AF37',
    fontSize: 14,
    marginTop: 10,
    fontStyle: 'italic',
  },
  divider: {
    height: 2,
    width: 50,
    backgroundColor: '#D4AF37',
    marginTop: 15,
  },
  sectionHeader: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  goldLine: {
    height: 3,
    width: 40,
    backgroundColor: '#D4AF37',
    marginTop: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: width > 600 ? '31%' : '47%', // Web pe 3 columns, Mobile pe 2
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 4 },
      web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' }
    }),
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 30,
  },
  cardName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#002D62',
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 11,
    color: '#777',
    textAlign: 'center',
    marginVertical: 5,
  },
  bookNow: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  bookText: {
    fontSize: 10,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  footer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#eee',
    marginTop: 20,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#002D62',
  },
  footerCopy: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
  }
});
import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'About SPC', headerShown: true }} />
      <View style={styles.content}>
        <Text style={styles.title}>SPC Service Provider Center</Text>
        <Text style={styles.tagline}>Patna's Trusted Home Service Partner</Text>
        
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Hum Kaun Hain?</Text>
          <Text style={styles.text}>
            SPC ek service-oriented platform hai jo Patna, Bihar mein home repairs, 
            electronics maintenance aur digital services pradan karta hai. Humara maqsad 
            expert professionals ko sahi waqt par aapke ghar tak pahunchana hai.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Humari Guarantee</Text>
          <Text style={styles.text}>✅ 3 Mahine ki kaam ki zimmedari.</Text>
          <Text style={styles.text}>✅ Trusted aur Verified Workers.</Text>
          <Text style={styles.text}>✅ Sahi Daam, Behtareen Kaam.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#002D62', textAlign: 'center' },
  tagline: { fontSize: 14, color: '#D4AF37', textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#002D62', marginBottom: 10 },
  text: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 5 }
});
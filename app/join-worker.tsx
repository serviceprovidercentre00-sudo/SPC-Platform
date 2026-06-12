import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase'; // Apna firebase config check kar lein
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const COLORS = {
  primaryBlue: '#003366',
  gold: '#D4AF37',
  white: '#FFFFFF',
};

const JoinWorker = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skill: '',
    area: '',
    experience: ''
  });

  const handleSubmit = async () => {
    // Basic Validation
    if (!formData.name || !formData.phone || !formData.skill) {
      Alert.alert("Error", "Kripya zaroori details bharein.");
      return;
    }

    setLoading(true);
    try {
      // Firebase mein 'applications' collection mein data bhej rahe hain
      await addDoc(collection(db, "worker_applications"), {
        ...formData,
        status: 'pending', // Default status pending rahega
        appliedAt: serverTimestamp(),
        role: 'worker'
      });

      Alert.alert(
        "Success!", 
        "Aapka application submit ho gaya hai. SPC Patna Team aapse jald sampark karegi.",
        [{ text: "OK" }]
      );
      
      // Form reset
      setFormData({ name: '', phone: '', skill: '', area: '', experience: '' });
    } catch (error) {
      console.error("Error adding document: ", error);
      Alert.alert("Error", "Kuch galat hua. Kripya phir se koshish karein.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="construct-outline" size={50} color={COLORS.gold} />
        <Text style={styles.title}>Join SPC Patna</Text>
        <Text style={styles.subtitle}>Ek premium service partner banein</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Pura Naam *</Text>
        <TextInput 
          style={styles.input} 
          value={formData.name}
          placeholder="Apna naam likhein" 
          onChangeText={(val) => setFormData({...formData, name: val})}
        />

        <Text style={styles.label}>Mobile Number *</Text>
        <TextInput 
          style={styles.input} 
          value={formData.phone}
          placeholder="10 digit number" 
          keyboardType="phone-pad"
          onChangeText={(val) => setFormData({...formData, phone: val})}
        />

        <Text style={styles.label}>Aapka Hunar (Skill) *</Text>
        <TextInput 
          style={styles.input} 
          value={formData.skill}
          placeholder="e.g. AC Repair, Laptop Specialist" 
          onChangeText={(val) => setFormData({...formData, skill: val})}
        />

        <Text style={styles.label}>Area (Patna mein)</Text>
        <TextInput 
          style={styles.input} 
          value={formData.area}
          placeholder="e.g. Kankarbagh, Danapur" 
          onChangeText={(val) => setFormData({...formData, area: val})}
        />

        <Text style={styles.label}>Experience (Saal mein)</Text>
        <TextInput 
          style={styles.input} 
          value={formData.experience}
          placeholder="e.g. 2 Years" 
          onChangeText={(val) => setFormData({...formData, experience: val})}
        />

        <TouchableOpacity 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.gold} />
          ) : (
            <Text style={styles.submitText}>SUBMIT APPLICATION</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footerNote}>
        SPC Patna: Trusted Home Services
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { 
    backgroundColor: COLORS.primaryBlue, 
    padding: 40, 
    alignItems: 'center',
    borderBottomRightRadius: 50 
  },
  title: { color: COLORS.gold, fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  subtitle: { color: COLORS.white, fontSize: 14, opacity: 0.8 },
  formCard: { 
    backgroundColor: COLORS.white, 
    margin: 20, 
    borderRadius: 20, 
    padding: 25, 
    marginTop: -30,
    elevation: 10 
  },
  label: { fontSize: 14, color: COLORS.primaryBlue, fontWeight: '600', marginBottom: 5 },
  input: { 
    backgroundColor: '#F5F5F5', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  submitBtn: { 
    backgroundColor: COLORS.primaryBlue, 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10
  },
  submitText: { color: COLORS.gold, fontWeight: 'bold', fontSize: 16 },
  footerNote: { textAlign: 'center', color: '#999', fontSize: 11, marginBottom: 30 }
});

export default JoinWorker;
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { db } from '../../config/firebase'; 
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // App Control States
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    appVersion: '1.0.0',
    contactPhone: '',
    contactEmail: '',
    minOrderValue: '0',
    serviceRadius: '15', // km mein
    noticeText: 'Welcome to SPC Services!'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, "settings", "app_config");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        // Agar pehli baar hai toh default settings create karein
        await setDoc(docRef, settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await updateDoc(doc(doc(db, "settings", "app_config")), settings);
      Alert.alert("Success", "Settings updated successfully!");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>App Configuration</Text>
        <Text style={styles.headerSub}>Professional Admin Control</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        
        {/* Section 1: App Status */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APP STATUS</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Maintenance Mode</Text>
              <Text style={styles.rowSub}>Stop all user activities</Text>
            </View>
            <Switch 
              value={settings.maintenanceMode} 
              onValueChange={(v) => setSettings({...settings, maintenanceMode: v})}
              trackColor={{ false: "#333", true: "#D4AF37" }}
            />
          </View>
        </View>

        {/* Section 2: Business Rules */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BUSINESS RULES</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notice Board Text (Scroll Bar)</Text>
            <TextInput 
              style={styles.input} 
              value={settings.noticeText} 
              onChangeText={(t) => setSettings({...settings, noticeText: t})}
              placeholderTextColor="#666"
            />
          </View>

          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View style={[styles.inputGroup, {width: '48%'}]}>
              <Text style={styles.label}>Min Order (₹)</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric"
                value={settings.minOrderValue} 
                onChangeText={(t) => setSettings({...settings, minOrderValue: t})}
              />
            </View>
            <View style={[styles.inputGroup, {width: '48%'}]}>
              <Text style={styles.label}>Radius (KM)</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric"
                value={settings.serviceRadius} 
                onChangeText={(t) => setSettings({...settings, serviceRadius: t})}
              />
            </View>
          </View>
        </View>

        {/* Section 3: Contact Details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUPPORT DETAILS</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Admin Phone</Text>
            <TextInput 
              style={styles.input} 
              value={settings.contactPhone} 
              onChangeText={(t) => setSettings({...settings, contactPhone: t})}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Admin Email</Text>
            <TextInput 
              style={styles.input} 
              value={settings.contactEmail} 
              onChangeText={(t) => setSettings({...settings, contactEmail: t})}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating ? <ActivityIndicator color="#001529" /> : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#001529" />
              <Text style={styles.saveBtnText}>SAVE CONFIGURATION</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>App Version: {settings.appVersion}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  loader: { flex: 1, backgroundColor: '#001529', justifyContent: 'center' },
  header: { padding: 25, backgroundColor: '#002140', borderBottomWidth: 1, borderBottomColor: '#D4AF37' },
  headerTitle: { color: '#D4AF37', fontSize: 22, fontWeight: 'bold' },
  headerSub: { color: '#aaa', fontSize: 12, marginTop: 4 },
  section: { backgroundColor: '#002140', padding: 15, borderRadius: 15, marginBottom: 20 },
  sectionLabel: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  rowSub: { color: '#888', fontSize: 12 },
  inputGroup: { marginBottom: 15 },
  label: { color: '#aaa', fontSize: 12, marginBottom: 8 },
  input: { backgroundColor: '#001529', color: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  saveBtn: { backgroundColor: '#D4AF37', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#001529', fontWeight: 'bold', marginLeft: 10 },
  footerText: { textAlign: 'center', color: '#444', marginTop: 20, marginBottom: 40 }
});
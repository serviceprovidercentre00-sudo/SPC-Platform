// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import { db } from '../../config/firebase'; 
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function AdminRevenue() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Cash, Online

  useEffect(() => {
    // SPC Tip: Humne collection ka naam 'orders' rakha tha naye logic mein
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      setBookings(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtered data calculation with SAFE Checks
  const filteredBookings = bookings.filter(b => {
    // Dono field check kar rahe hain: paymentMethod ya paymentType
    const method = b.paymentMethod || b.paymentType || 'N/A';
    if (filter === 'All') return true;
    return method.toLowerCase().includes(filter.toLowerCase());
  });

  const totalRevenue = filteredBookings.reduce((sum, item) => {
    // totalPayable ya price dono mein se jo mile use add karo
    const amount = item.totalPayable || item.price || 0;
    return sum + Number(amount);
  }, 0);

  // PDF Generate Karne Ka Function
  const createPDF = async () => {
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 20px; }
            h1 { color: #001529; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #D4AF37; color: #001529; }
            .total { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>SPC Service Revenue Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <tr>
              <th>Service</th>
              <th>Customer</th>
              <th>Method</th>
              <th>Amount</th>
            </tr>
            ${filteredBookings.map(b => `
              <tr>
                <td>${b.serviceName || 'Service'}</td>
                <td>${b.customerName || b.userName || 'N/A'}</td>
                <td>${b.paymentMethod || b.paymentType || 'N/A'}</td>
                <td>₹${b.totalPayable || b.price || 0}</td>
              </tr>
            `).join('')}
          </table>
          <div class="total">Total Revenue: ₹${totalRevenue}</div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { 
        mimeType: 'application/pdf', 
        dialogTitle: 'SPC Revenue Report' 
      });
    } catch (error) {
      Alert.alert("Error", "PDF banane mein galti hui.");
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />;

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TOTAL REVENUE (PATNA SPC)</Text>
        <Text style={styles.totalAmount}>₹{totalRevenue}</Text>
        
        <View style={styles.filterRow}>
          {['All', 'Cash', 'Online'].map((f) => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]} 
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && {color: '#001529'}]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 100 }}>
        {filteredBookings.length === 0 ? (
          <Text style={{color: '#94A3B8', textAlign: 'center', marginTop: 50}}>No data found for {filter}</Text>
        ) : (
          filteredBookings.map((b) => (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardMain}>
                <View style={{flex: 1}}>
                  <Text style={styles.serviceText}>{b.serviceName || 'Home Service'}</Text>
                  <Text style={styles.userText}>
                    {b.customerName || b.userName || 'Customer'} • {b.createdAt?.toDate().toLocaleDateString() || 'Recent'}
                  </Text>
                </View>
                <Text style={styles.priceText}>₹{b.totalPayable || b.price || 0}</Text>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={[styles.payBadge, {backgroundColor: (b.paymentMethod || b.paymentType) === 'online' ? '#1a3a5a' : '#2d4a3e'}]}>
                  <Text style={{color: (b.paymentMethod || b.paymentType) === 'online' ? '#4db8ff' : '#4caf50', fontSize: 10, fontWeight: 'bold'}}>
                    {/* SAFE UPPERCASE: crash nahi hoga ab */}
                    {(b.paymentMethod || b.paymentType || 'N/A').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.orderId}>ID: #{b.id?.slice(0,6).toUpperCase()}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Download Button */}
      <TouchableOpacity style={styles.downloadBtn} onPress={createPDF}>
        <Ionicons name="document-text" size={24} color="#001529" />
        <Text style={styles.downloadText}>DOWNLOAD REPORT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  loader: { flex: 1, backgroundColor: '#001529', justifyContent: 'center' },
  header: { padding: 25, backgroundColor: '#002140', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#D4AF37' },
  headerTitle: { color: '#94A3B8', fontSize: 12, letterSpacing: 2, fontWeight: 'bold' },
  totalAmount: { color: '#D4AF37', fontSize: 40, fontWeight: 'bold', marginVertical: 10 },
  filterRow: { flexDirection: 'row', marginTop: 15 },
  filterBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D4AF37', marginRight: 10 },
  filterBtnActive: { backgroundColor: '#D4AF37' },
  filterText: { color: '#D4AF37', fontWeight: 'bold' },
  card: { backgroundColor: '#002140', padding: 18, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#003366' },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userText: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  priceText: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  cardFooter: { marginTop: 12, borderTopWidth: 0.5, borderTopColor: '#003366', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  orderId: { color: '#475569', fontSize: 10, fontWeight: 'bold' },
  downloadBtn: { position: 'absolute', bottom: 30, right: 20, left: 20, backgroundColor: '#D4AF37', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 10 },
  downloadText: { color: '#001529', fontWeight: 'bold', marginLeft: 8, fontSize: 16 }
});
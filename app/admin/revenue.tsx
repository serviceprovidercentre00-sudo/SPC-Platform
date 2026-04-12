// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Share } from 'react-native';
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
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtered data calculation
  const filteredBookings = bookings.filter(b => 
    filter === 'All' ? true : b.paymentMethod === filter
  );

  const totalRevenue = filteredBookings.reduce((sum, item) => sum + Number(item.price || 0), 0);

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
                <td>${b.serviceName}</td>
                <td>${b.userName}</td>
                <td>${b.paymentMethod}</td>
                <td>₹${b.price}</td>
              </tr>
            `).join('')}
          </table>
          <div class="total">Total Revenue: ₹${totalRevenue}</div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Revenue Report Download' });
      }
    } catch (error) {
      alert("PDF banane mein galti hui: " + error.message);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />;

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Total Revenue</Text>
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

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {filteredBookings.map((b) => (
          <View key={b.id} style={styles.card}>
            <View style={styles.cardMain}>
              <View>
                <Text style={styles.serviceText}>{b.serviceName}</Text>
                <Text style={styles.userText}>{b.userName} • {b.createdAt?.toDate().toLocaleDateString()}</Text>
              </View>
              <Text style={styles.priceText}>₹{b.price}</Text>
            </View>
            <View style={styles.cardFooter}>
              <View style={[styles.payBadge, {backgroundColor: b.paymentMethod === 'Online' ? '#1a3a5a' : '#2d4a3e'}]}>
                <Text style={{color: b.paymentMethod === 'Online' ? '#4db8ff' : '#4caf50', fontSize: 10, fontWeight: 'bold'}}>
                  {b.paymentMethod.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Download Button */}
      <TouchableOpacity style={styles.downloadBtn} onPress={createPDF}>
        <Ionicons name="document-text" size={24} color="#001529" />
        <Text style={styles.downloadText}>PDF REPORT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001529' },
  loader: { flex: 1, backgroundColor: '#001529', justifyContent: 'center' },
  header: { padding: 25, backgroundColor: '#002140', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#D4AF37' },
  headerTitle: { color: '#aaa', fontSize: 14, letterSpacing: 1 },
  totalAmount: { color: '#D4AF37', fontSize: 36, fontWeight: 'bold', marginVertical: 10 },
  filterRow: { flexDirection: 'row', marginTop: 15 },
  filterBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D4AF37', marginRight: 10 },
  filterBtnActive: { backgroundColor: '#D4AF37' },
  filterText: { color: '#D4AF37', fontWeight: 'bold' },
  card: { backgroundColor: '#002140', padding: 15, borderRadius: 12, marginBottom: 12 },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userText: { color: '#888', fontSize: 12, marginTop: 2 },
  priceText: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  cardFooter: { marginTop: 10, borderTopWidth: 0.5, borderTopColor: '#333', paddingTop: 10 },
  payBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  downloadBtn: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#D4AF37', padding: 15, borderRadius: 30, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  downloadText: { color: '#001529', fontWeight: 'bold', marginLeft: 8 }
});
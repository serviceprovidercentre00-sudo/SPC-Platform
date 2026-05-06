import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// Colors based on your Blue and Gold premium theme
const COLORS = {
  primaryBlue: "#003366",
  gold: "#D4AF37",
  white: "#FFFFFF",
  lightGray: "#F5F5F5",
  successGreen: "#28A745",
};

const WorkerDashboard = () => {
  const [isOnline, setIsOnline] = useState(false);

  // Mock Data for nearby orders (10-20 KM logic)
  const nearbyOrders = [
    {
      id: "1",
      service: "AC Repair",
      customer: "Amit Kumar",
      distance: "3.5 km",
      price: "₹350",
    },
    {
      id: "2",
      service: "Laptop Service",
      customer: "Suresh Singh",
      distance: "8.2 km",
      price: "₹500",
    },
    {
      id: "3",
      service: "Refrigerator Gas Refill",
      customer: "Vikash Patna",
      distance: "12 km",
      price: "₹1200",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Worker Dashboard</Text>
          <Text style={styles.statusText}>
            {isOnline ? "Online - Ready for Orders" : "Offline"}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={setIsOnline}
          trackColor={{ false: "#767577", true: COLORS.gold }}
          thumbColor={isOnline ? COLORS.white : "#f4f3f4"}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Earnings Card */}
        <View style={styles.earningCard}>
          <Text style={styles.cardTitle}>Today's Earnings</Text>
          <Text style={styles.earningAmount}>₹2,450</Text>
          <Text style={styles.jobsCompleted}>4 Jobs Completed</Text>
        </View>

        <Text style={styles.sectionTitle}>New Orders Near You (10-20 KM)</Text>

        {isOnline ? (
          nearbyOrders.map((item) => (
            <View key={item.id} style={styles.orderCard}>
              <View style={styles.orderInfo}>
                <Text style={styles.serviceName}>{item.service}</Text>
                <Text style={styles.customerName}>{item.customer}</Text>
                <View style={styles.metaInfo}>
                  <Ionicons name="location" size={14} color={COLORS.gold} />
                  <Text style={styles.distanceText}>{item.distance} away</Text>
                </View>
              </View>
              <View style={styles.actionSection}>
                <Text style={styles.priceText}>{item.price}</Text>
                <TouchableOpacity style={styles.acceptButton}>
                  <Text style={styles.acceptButtonText}>Accept Job</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.offlineContainer}>
            <Ionicons
              name="moon-outline"
              size={50}
              color={COLORS.primaryBlue}
            />
            <Text style={styles.offlineText}>
              Go online to start receiving orders near Patna
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  header: {
    backgroundColor: COLORS.primaryBlue,
    padding: 20,
    paddingTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: { color: COLORS.gold, fontSize: 22, fontWeight: "bold" },
  statusText: { color: COLORS.white, fontSize: 14 },
  content: { padding: 20 },
  earningCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.gold,
  },
  cardTitle: { fontSize: 16, color: "#666" },
  earningAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primaryBlue,
    marginVertical: 5,
  },
  jobsCompleted: { color: COLORS.successGreen, fontWeight: "600" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: COLORS.primaryBlue,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 3,
  },
  orderInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: "bold", color: COLORS.primaryBlue },
  customerName: { fontSize: 14, color: "#444", marginVertical: 4 },
  metaInfo: { flexDirection: "row", alignItems: "center" },
  distanceText: { fontSize: 12, color: "#777", marginLeft: 4 },
  actionSection: { alignItems: "flex-end", justifyContent: "space-between" },
  priceText: { fontSize: 18, fontWeight: "bold", color: COLORS.gold },
  acceptButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  acceptButtonText: { color: COLORS.white, fontWeight: "bold", fontSize: 12 },
  offlineContainer: { alignItems: "center", marginTop: 50 },
  offlineText: {
    textAlign: "center",
    color: "#666",
    marginTop: 10,
    fontSize: 16,
  },
});

export default WorkerDashboard;

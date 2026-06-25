// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function StatsCard({ metrics }) {
  const {
    totalEarnings = 0,
    completedJobs = 0,
    activeJobs = 0,
  } = metrics || {};

  return (
    <View style={styles.statsContainer}>
      {/* Total Earnings Card */}
      <View style={[styles.statBox, styles.fullWidth]}>
        <Ionicons name="wallet" size={24} color="#D4AF37" />
        <View style={styles.statInfo}>
          <Text style={styles.statLabel}>Kul Kamai (Earnings)</Text>
          <Text style={styles.earningValue}>
            ₹{totalEarnings.toLocaleString("en-IN")}
          </Text>
        </View>
      </View>

      {/* Row for Completed & Active */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="checkmark-circle" size={22} color="#2E7D32" />
          <Text style={styles.subStatValue}>{completedJobs}</Text>
          <Text style={styles.subStatLabel}>Kaam Pure Kiye</Text>
        </View>

        <View style={styles.statBox}>
          <Ionicons name="time" size={22} color="#0288D1" />
          <Text style={styles.subStatValue}>{activeJobs}</Text>
          <Text style={styles.subStatLabel}>Chalu Kaam (Active)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statBox: {
    backgroundColor: "#002140",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#003366",
  },
  fullWidth: {
    width: "100%",
  },
  statInfo: {
    marginLeft: 15,
  },
  statLabel: {
    color: "#aaa",
    fontSize: 12,
  },
  earningValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 2,
  },
  subStatValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  subStatLabel: {
    color: "#aaa",
    fontSize: 11,
    marginTop: 2,
  },
});

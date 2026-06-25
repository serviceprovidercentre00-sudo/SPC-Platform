// app/worker/[id].tsx
// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../config/firebase"; // Relative path matched with Screenshot 2026-06-17 195855.png

export default function WorkerJobDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const docRef = doc(db, "bookings", id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setJob({ id: docSnap.id, ...docSnap.data() });
      } else {
        Alert.alert("Error", "Job details not found");
        router.back();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // --- ACTIONS HANDLERS ---
  const handleStartJob = async () => {
    try {
      await updateDoc(doc(db, "bookings", id), {
        status: "in_progress",
        startedAt: new Date().toISOString(),
      });
      Alert.alert(
        "Status Updated 🚀",
        "Aapne kaam shuru kar diya hai. Customer ko notification chali gayi hai.",
      );
    } catch (e) {
      Alert.alert("Error", "Could not update status.");
    }
  };

  const handleCompleteJob = async () => {
    Alert.alert(
      "Confirm Completion ✅",
      "Kya aapne kaam poora kar diya hai aur payment collect kar li hai?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Completed",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "bookings", id), {
                status: "completed",
                completedAt: new Date().toISOString(),
              });
              Alert.alert("Great Job! 🏆", "Task successfully completed!");
              router.back();
            } catch (e) {
              Alert.alert("Error", "Could not complete task.");
            }
          },
        },
      ],
    );
  };

  const handleCallCustomer = () => {
    const phone = job?.customerPhone || "+918409372138";
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#002D62" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{ title: "Job Details", headerTintColor: "#002D62" }}
      />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Main Service Identifier Section */}
        <View style={styles.boxCard}>
          <Text style={styles.sectionHeader}>SERVICE TYPE</Text>
          <Text style={styles.mainTitle}>
            {job?.serviceName || "On-Demand Repair"}
          </Text>
          <Text style={styles.priceTag}>
            Order Total Payout: ₹{job?.servicePrice || 0}
          </Text>
        </View>

        {/* Customer Information Panel */}
        <View style={styles.boxCard}>
          <Text style={styles.sectionHeader}>CUSTOMER DETAILS</Text>
          <Text style={styles.infoField}>
            👤 Name: {job?.customerName || "Premium Client"}
          </Text>
          <Text style={styles.infoField}>
            📍 Address: {job?.address || "Patna, Bihar"}
          </Text>

          <TouchableOpacity style={styles.callBtn} onPress={handleCallCustomer}>
            <Ionicons name="call" size={18} color="#FFF" />
            <Text style={styles.callBtnTxt}>Call Customer Directly</Text>
          </TouchableOpacity>
        </View>

        {/* Workflow Action Buttons Based on Status */}
        <View style={{ marginTop: 20 }}>
          {job?.status === "assigned" && (
            <TouchableOpacity style={styles.startBtn} onPress={handleStartJob}>
              <Ionicons name="play" size={20} color="#FFF" />
              <Text style={styles.btnTxt}>START JOB (ON THE WAY)</Text>
            </TouchableOpacity>
          )}

          {job?.status === "in_progress" && (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={handleCompleteJob}
            >
              <Ionicons name="checkmark-done" size={20} color="#FFF" />
              <Text style={styles.btnTxt}>WORK DONE (COLLECT CASH)</Text>
            </TouchableOpacity>
          )}

          {job?.status === "completed" && (
            <View style={styles.successBadgeBox}>
              <Ionicons name="checkmark-circle" size={24} color="#059669" />
              <Text style={styles.successBadgeTxt}>
                This job is successfully completed.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  boxCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 8,
  },
  mainTitle: { fontSize: 20, fontWeight: "900", color: "#002D62" },
  priceTag: { fontSize: 15, fontWeight: "700", color: "#059669", marginTop: 6 },
  infoField: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
    marginBottom: 8,
    lineHeight: 20,
  },
  callBtn: {
    backgroundColor: "#002D62",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  callBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  startBtn: {
    backgroundColor: "#D4AF37",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  completeBtn: {
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  btnTxt: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  successBadgeBox: {
    backgroundColor: "#D1FAE5",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  successBadgeTxt: { color: "#065F46", fontWeight: "700", fontSize: 13 },
});

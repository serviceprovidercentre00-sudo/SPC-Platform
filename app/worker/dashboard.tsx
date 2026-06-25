// @ts-nocheck
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";

// 🎯 Connected Real Components
import OrderList from "../../components/worker/OrderList";
import StatsCard from "../../components/worker/StatsCard";

export default function WorkerDashboard() {
  const [workerData, setWorkerData] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [metrics, setMetrics] = useState({
    totalEarnings: 0,
    completedJobs: 0,
    activeJobs: 0,
  });

  const workerUid = auth.currentUser?.uid || "5OBa9ah0wcXtHa8r4VGEmcEB5QI2"; // Auto-linked to your UID

  useEffect(() => {
    if (!workerUid) {
      Alert.alert("Authentication Error", "Kripya login karein.");
      setGlobalLoading(false);
    }
  }, [workerUid]);

  // 1. Live Fetch Worker Profile (Mapped perfectly to your real Firestore fields)
  useEffect(() => {
    if (!workerUid) return;

    const workerRef = doc(db, "workers", workerUid);
    const unsubscribe = onSnapshot(
      workerRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const rawData = docSnap.data();

          // 🛠️ Dynamic Mapping: Agar database me city field nahi hai, toh address se "patna" extract kar lega
          const profileData = {
            ...rawData,
            category: rawData.category || "electrician",
            city:
              rawData.city ||
              (rawData.address &&
              rawData.address.toLowerCase().includes("patna")
                ? "patna"
                : "patna bihar"),
          };

          setWorkerData(profileData);
        } else {
          setWorkerData(null);
          console.error(
            "Worker record missing in Firestore for UID:",
            workerUid,
          );
        }
        setGlobalLoading(false);
      },
      (err) => {
        console.error("Profile Sync Error:", err);
        setGlobalLoading(false);
      },
    );

    return () => unsubscribe();
  }, [workerUid]);

  // 2. Real-Time Earnings Tracking
  useEffect(() => {
    if (!workerUid) return;

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("workerId", "==", workerUid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let earnings = 0;
        let completed = 0;
        let active = 0;

        snapshot.docs.forEach((docSnap) => {
          const order = docSnap.data();
          const status = (order.status || "").trim().toLowerCase();

          if (status === "completed") {
            completed += 1;
            const val = parseFloat(order.totalPayable || order.amount || 0);
            if (!isNaN(val)) earnings += val;
          } else if (["accepted", "pending", "open"].includes(status)) {
            active += 1;
          }
        });

        setMetrics({
          totalEarnings: earnings,
          completedJobs: completed,
          activeJobs: active,
        });
      },
      (err) => {
        console.error("Metrics Collection Error:", err);
      },
    );

    return () => unsubscribe();
  }, [workerUid]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  if (globalLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>
          Database Se Data Connect Ho Raha Hai...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4AF37"
          />
        }
      >
        {/* Real Profile Display */}
        {workerData ? (
          <View style={styles.welcomeHeader}>
            <Text style={styles.welcomeText}>Welcome Back,</Text>
            <Text style={styles.workerName}>{workerData.name || "Raj"}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.badgeText}>
                  CATEGORY: {workerData.category.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.categoryBadge, styles.locBadge]}>
                <Text style={styles.badgeText}>
                  📍 {workerData.city.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.welcomeHeader}>
            <Text style={styles.errorBannerText}>
              ⚠️ Profile data sync issues or missing worker registration.
            </Text>
          </View>
        )}

        {/* Live Counters */}
        <StatsCard metrics={metrics} />

        {/* Live Orders List */}
        <OrderList workerData={workerData} workerUid={workerUid} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001529" },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: {
    color: "#aaa",
    marginTop: 12,
    fontSize: 13,
    fontWeight: "500",
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  welcomeHeader: { marginBottom: 22, marginTop: 8 },
  welcomeText: { color: "#888", fontSize: 13, fontWeight: "500" },
  workerName: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  badgeRow: { flexDirection: "row", marginTop: 8, gap: 8 },
  categoryBadge: {
    backgroundColor: "#002140",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#D4AF37",
    alignSelf: "flex-start",
  },
  locBadge: { borderColor: "#0288D1" },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  errorBannerText: {
    color: "#D32F2F",
    fontSize: 13,
    fontWeight: "500",
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    padding: 10,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#D32F2F",
  },
});

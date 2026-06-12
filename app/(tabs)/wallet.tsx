// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";

export default function WalletScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Real Data States
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeCard, setActiveCard] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [userCoupons, setUserCoupons] = useState([]);

  const SHOP_LOGO_URI =
    "https://placehold.co/100x100/002140/D4AF37/png?text=SPC+Logo";

  // Real Data Fetching Function
  const fetchWalletAndCardData = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      // 1. User Document se real wallet balance check karein
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // 🔥 FIXED: Dono fields (walletBalance aur welcomeGift) ko safely Number me convert kiya taaki toFixed() crash na kare
        const balance =
          Number(userData.walletBalance) || Number(userData.welcomeGift) || 0;
        setWalletBalance(balance);

        if (userData.activeCard) {
          setActiveCard(userData.activeCard);
          setCardNumber(userData.cardNumber || "");
        } else {
          // Backup check: Orders collection
          const ordersRef = collection(db, "orders");
          const q = query(
            ordersRef,
            where("userId", "==", auth.currentUser.uid),
          );
          const orderSnaps = await getDocs(q);

          if (!orderSnaps.empty) {
            const sortedOrders = orderSnaps.docs.map((d) => d.data());
            const latestOrder = sortedOrders[sortedOrders.length - 1];
            if (
              latestOrder &&
              latestOrder.cardType &&
              latestOrder.cardNumber !== "None"
            ) {
              setActiveCard(latestOrder.cardType);
              setCardNumber(latestOrder.cardNumber);
            }
          }
        }
      }

      // 2. Real Coupon Filter Check
      const ordersRef = collection(db, "orders");
      const couponQuery = query(
        ordersRef,
        where("userId", "==", auth.currentUser.uid),
        where("couponUsed", "==", "SPCFIRST"),
      );
      const couponSnap = await getDocs(couponQuery);

      if (couponSnap.empty) {
        setUserCoupons([
          {
            code: "SPCFIRST",
            description: "Get flat ₹50 OFF on your checkout service rate.",
            value: "₹50 Off",
          },
        ]);
      } else {
        setUserCoupons([]);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletAndCardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletAndCardData();
  };

  // 🔥 SAFE RENDERING CHECK: walletBalance ko securely decimal format me set karne ke liye logic
  const displayBalance =
    typeof walletBalance === "number"
      ? walletBalance.toFixed(2)
      : Number(walletBalance || 0).toFixed(2);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={{ color: "#94A3B8", marginTop: 10, fontWeight: "600" }}>
          Loading Live SPC Wallet...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "SPC Wallet",
          headerTintColor: "#D4AF37",
          headerStyle: { backgroundColor: "#001529" },
          headerRight: () => (
            <Image
              source={{ uri: SHOP_LOGO_URI }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4AF37"
          />
        }
      >
        {/* SECTION 1: REAL WALLET BALANCE CARD (FIXED & ALIGNED) */}
        <View style={styles.walletBalanceCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text style={styles.walletLabel}>TOTAL REWARD BALANCE</Text>
              <Text style={styles.walletAmount}>₹{displayBalance}</Text>
            </View>
            <View style={styles.walletIconCircle}>
              <Ionicons name="wallet" size={32} color="#001529" />
            </View>
          </View>
          <View style={styles.walletDivider} />
          <Text style={styles.walletHint}>
            * Aap is balance ka max 10% har naye order ki booking par automatic
            use kar sakte hain.
          </Text>
        </View>

        {/* SECTION 2: MEMBERSHIP STATUS */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>YOUR MEMBERSHIP CARD</Text>

          {activeCard ? (
            <View
              style={[
                styles.membershipVisualCard,
                activeCard === "Platinum"
                  ? styles.platCard
                  : activeCard === "Golden"
                    ? styles.goldCard
                    : styles.silvCard,
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    styles.mCardType,
                    (activeCard === "Platinum" || activeCard === "Silver") && {
                      color: "#FFF",
                    },
                  ]}
                >
                  {activeCard.toUpperCase()} MEMBER
                </Text>
                <Ionicons
                  name="ribbon"
                  size={24}
                  color={activeCard === "Golden" ? "#001529" : "#FFF"}
                />
              </View>

              <Text
                style={[
                  styles.mCardNumber,
                  (activeCard === "Platinum" || activeCard === "Silver") && {
                    color: "#FFF",
                  },
                ]}
              >
                {cardNumber
                  ? cardNumber.replace(/.(?=.{4})/g, "*")
                  : "•••• •••• •••• 0000"}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <Text
                  style={[
                    styles.mCardBenefit,
                    (activeCard === "Platinum" || activeCard === "Silver") && {
                      color: "#E2E8F0",
                    },
                  ]}
                >
                  ✅ 5% Extra Off Activated
                </Text>
                <Text
                  style={[
                    styles.mCardBrand,
                    (activeCard === "Platinum" || activeCard === "Silver") && {
                      color: "#FFF",
                    },
                  ]}
                >
                  SPC PATNA
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noCardBox}>
              <Ionicons
                name="card-outline"
                size={36}
                color="#94A3B8"
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.noDataText}>
                No Active Membership Card Linked
              </Text>
              <Text style={styles.subNoDataText}>
                Checkout ke waqt apna valid premium loyalty card number apply
                karein.
              </Text>
            </View>
          )}
        </View>

        {/* SECTION 3: AVAILABLE COUPONS */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>AVAILABLE COUPONS FOR YOU</Text>

          {userCoupons.length > 0 ? (
            userCoupons.map((coupon, index) => (
              <View key={index} style={styles.couponCard}>
                <View style={styles.couponLeft}>
                  <Text style={styles.couponCodeText}>{coupon.code}</Text>
                </View>
                <View style={styles.couponRight}>
                  <Text style={styles.couponValueTag}>{coupon.value}</Text>
                  <Text style={styles.couponDesc}>{coupon.description}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noCardBox}>
              <Ionicons
                name="pricetag-outline"
                size={32}
                color="#94A3B8"
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.noDataText}>No Coupons Available</Text>
              <Text style={styles.subNoDataText}>
                Aapne apne account ke saare codes use kar liye hain.
              </Text>
            </View>
          )}
        </View>

        {/* QUICK ROUTER REDIRECT NAVIGATION */}
        <TouchableOpacity
          style={styles.bookNowBtn}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.bookNowTxt}>BOOK A SERVICE NOW</Text>
          <Ionicons name="arrow-forward" size={16} color="#001529" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001529" },
  loaderContainer: {
    flex: 1,
    backgroundColor: "#001529",
    justifyContent: "center",
    alignItems: "center",
  },
  headerLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#D4AF37",
    marginRight: 10,
  },
  walletBalanceCard: {
    backgroundColor: "#D4AF37",
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 15,
    marginTop: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  walletLabel: {
    color: "#001529",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  walletAmount: {
    color: "#001529",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 5,
  },
  walletIconCircle: {
    backgroundColor: "rgba(255,255,255,0.4)",
    padding: 12,
    borderRadius: 25,
  },
  walletDivider: {
    height: 1,
    backgroundColor: "rgba(0,21,41,0.15)",
    marginVertical: 12,
  },
  walletHint: {
    color: "#001529",
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.8,
  },
  sectionBox: {
    backgroundColor: "#002140",
    padding: 15,
    borderRadius: 16,
    marginHorizontal: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#003366",
  },
  sectionTitle: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 12,
  },
  membershipVisualCard: {
    padding: 18,
    borderRadius: 14,
    minHeight: 120,
    justifyContent: "space-between",
  },
  silvCard: { backgroundColor: "#7F8C8D" },
  goldCard: { backgroundColor: "#F1C40F" },
  platCard: { backgroundColor: "#34495E" },
  mCardType: {
    color: "#001529",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  mCardNumber: {
    color: "#001529",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginVertical: 10,
  },
  mCardBenefit: { color: "#001529", fontSize: 11, fontWeight: "bold" },
  mCardBrand: {
    color: "#001529",
    fontSize: 12,
    fontWeight: "900",
    opacity: 0.7,
  },
  noCardBox: {
    backgroundColor: "#001529",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#003366",
    borderStyle: "dashed",
  },
  noDataText: { color: "#FFF", fontSize: 13, fontWeight: "bold", marginTop: 5 },
  subNoDataText: {
    color: "#94A3B8",
    fontSize: 11,
    textAlign: "center",
    marginTop: 3,
  },
  couponCard: {
    flexDirection: "row",
    backgroundColor: "#001529",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#003366",
    overflow: "hidden",
    marginTop: 5,
  },
  couponLeft: {
    backgroundColor: "#003366",
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#002140",
    borderStyle: "dashed",
  },
  couponCodeText: {
    color: "#D4AF37",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  couponRight: { flex: 1, padding: 12, justifyContent: "center" },
  couponValueTag: { color: "#00cc66", fontWeight: "bold", fontSize: 14 },
  couponDesc: { color: "#94A3B8", fontSize: 11, marginTop: 2 },
  bookNowBtn: {
    flexDirection: "row",
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 15,
    marginTop: 25,
  },
  bookNowTxt: { color: "#001529", fontWeight: "bold", fontSize: 14 },
});

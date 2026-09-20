// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Stack } from "expo-router";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";
import { useCart } from "../../context/CartContext";

export default function CartScreen() {
  const { cartItems = [], clearCart, removeFromCart } = useCart();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("new");
  const [myOrders, setMyOrders] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  const PLATFORM_FEE = 49;
  const GST_RATE = 0.18;

  // 1. REALTIME FIRESTORE ORDER LISTENER
  useEffect(() => {
    const user = auth?.currentUser;
    if (!user) {
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    const q = query(collection(db, "orders"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Newest orders first
        orders.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });

        setMyOrders(orders);
        setIsFetching(false);
      },
      (error) => {
        console.error("Firestore Orders Fetch Error:", error);
        setIsFetching(false);
      },
    );

    return () => unsubscribe();
  }, [auth?.currentUser]);

  // 2. ORDER STATUS HELPER
  const getStatusStyle = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("done") || s.includes("complete") || s.includes("finish"))
      return { color: "#22C55E", label: "Completed", bg: "#22C55E20" };
    if (s.includes("accept") || s.includes("assigned") || s.includes("process"))
      return { color: "#3B82F6", label: "Accepted", bg: "#3B82F620" };
    if (s.includes("cancel") || s.includes("reject"))
      return { color: "#EF4444", label: "Cancelled", bg: "#EF444420" };
    return { color: "#F59E0B", label: "Waiting", bg: "#F59E0B20" };
  };

  // 3. AUTO LOCATION FETCHING
  const handleLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert(
          "Permission Required",
          "Please allow location access",
        );
      }
      setLoading(true);
      let loc = await Location.getCurrentPositionAsync({});
      let res = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (res && res.length > 0) {
        let a = res[0];
        const formattedAddr = [a.name, a.street, a.city, a.region]
          .filter(Boolean)
          .join(", ");
        setAddress(formattedAddr);
      }
    } catch (e) {
      Alert.alert("Location Error", "Could not fetch location automatically.");
    } finally {
      setLoading(false);
    }
  };

  const parsePrice = (v) =>
    parseFloat(String(v || 0).replace(/[^0-9.]/g, "")) || 0;

  const { totalBill } = useMemo(() => {
    const sub = cartItems.reduce((s, i) => s + parsePrice(i.price), 0);
    return { totalBill: sub + PLATFORM_FEE + Math.round(sub * GST_RATE) };
  }, [cartItems]);

  // 4. PLACE ORDER FUNCTION
  const placeOrder = async () => {
    const user = auth?.currentUser;
    if (!user) {
      return Alert.alert("Login Required", "Please login to book a service.");
    }
    if (!address.trim()) {
      return Alert.alert(
        "Address Missing",
        "Please enter full delivery address.",
      );
    }
    if (!phone || phone.trim().length < 10) {
      return Alert.alert(
        "Phone Invalid",
        "Please enter a valid 10-digit number.",
      );
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userName: user.displayName || user.email || "Customer",
        items: cartItems,
        totalAmount: totalBill,
        address: address.trim(),
        phone: phone.trim(),
        status: "Wait",
        createdAt: serverTimestamp(),
      });

      clearCart();
      setActiveTab("history");
      Alert.alert("Success 🎉", "Booking request sent! Checking for worker...");
    } catch (e) {
      Alert.alert("Booking Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Stack.Screen
        options={{
          title: "SPC Booking Center",
          headerStyle: { backgroundColor: "#001529" },
          headerTintColor: "#D4AF37",
        }}
      />

      {/* TOP TAB SWITCHER */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          onPress={() => setActiveTab("new")}
          style={[styles.tab, activeTab === "new" && styles.activeTab]}
        >
          <Ionicons
            name="cart-outline"
            size={18}
            color={activeTab === "new" ? "#D4AF37" : "#94A3B8"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              color: activeTab === "new" ? "#D4AF37" : "#94A3B8",
              fontWeight: "bold",
            }}
          >
            BOOKING ({cartItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("history")}
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={activeTab === "history" ? "#D4AF37" : "#94A3B8"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              color: activeTab === "history" ? "#D4AF37" : "#94A3B8",
              fontWeight: "bold",
            }}
          >
            MY HISTORY ({myOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 40 }}>
        {/* --- TAB 1: NEW BOOKING CART --- */}
        {activeTab === "new" ? (
          cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="basket-outline" size={60} color="#64748B" />
              <Text style={styles.empty}>Your Cart is Empty</Text>
              <Text style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>
                Add services to proceed with booking
              </Text>
            </View>
          ) : (
            <View>
              {/* CART ITEMS LIST */}
              {cartItems.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {item.name}
                    </Text>
                    <Text style={{ color: "#D4AF37", marginTop: 2 }}>
                      ₹{item.price}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFromCart && removeFromCart(i)}
                    style={{ padding: 6 }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* LOCATION BUTTON */}
              <TouchableOpacity onPress={handleLocation} style={styles.locBtn}>
                <Ionicons
                  name="location"
                  size={18}
                  color="#001529"
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: "#001529", fontWeight: "bold" }}>
                  AUTO DETECT MY LOCATION
                </Text>
              </TouchableOpacity>

              {/* INPUT FIELDS */}
              <TextInput
                style={styles.input}
                placeholder="Full Service Address"
                placeholderTextColor="#64748B"
                value={address}
                onChangeText={setAddress}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="10-Digit Phone Number"
                placeholderTextColor="#64748B"
                value={phone}
                onChangeText={setPhone}
                keyboardType="numeric"
                maxLength={10}
              />

              {/* SUBMIT BUTTON */}
              <TouchableOpacity
                style={[styles.mainBtn, loading && { opacity: 0.7 }]}
                onPress={placeOrder}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#001529" />
                ) : (
                  <Text style={styles.mainBtnText}>
                    BOOK NOW (₹{totalBill})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )
        ) : isFetching ? (
          /* --- TAB 2: MY HISTORY --- */
          <ActivityIndicator
            size="large"
            color="#D4AF37"
            style={{ marginTop: 50 }}
          />
        ) : myOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#64748B" />
            <Text style={styles.empty}>No Order History Found</Text>
          </View>
        ) : (
          myOrders.map((order) => {
            const statusUI = getStatusStyle(order.status);

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* CARD HEADER */}
                <View style={styles.cardHeader}>
                  <Text style={styles.orderId}>
                    ID: #{order.id.slice(-6).toUpperCase()}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusUI.bg },
                    ]}
                  >
                    <Text
                      style={{
                        color: statusUI.color,
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      {statusUI.label.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* ITEMS DISPLAY */}
                <View style={{ marginVertical: 4 }}>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((it, idx) => (
                      <Text key={idx} style={styles.itemText}>
                        • {it.name} (₹{it.price})
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.itemText}>
                      • {order.serviceName || "Service Request"}
                    </Text>
                  )}
                </View>

                {/* ADDRESS & PHONE */}
                <Text style={styles.metaText}>📍 {order.address}</Text>
                <Text style={styles.metaText}>📞 {order.phone}</Text>

                <Text style={styles.totalPrice}>
                  Total Amount: ₹{order.totalAmount}
                </Text>

                {/* WORKER DETAILS SECTION */}
                {order.workerDetails ? (
                  <View style={styles.workerRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        👤 {order.workerDetails.name}
                      </Text>
                      <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                        Assigned SPC Expert
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(`tel:${order.workerDetails.phone}`)
                      }
                      style={styles.callBtn}
                    >
                      <Ionicons name="call" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.pendingWorkerBox}>
                    <Ionicons name="sync-outline" size={14} color="#F59E0B" />
                    <Text style={styles.pendingWorkerText}>
                      Searching for available worker...
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001529" },
  tabHeader: { flexDirection: "row", backgroundColor: "#002140" },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#D4AF37" },
  itemRow: {
    backgroundColor: "#002140",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  input: {
    backgroundColor: "#002140",
    color: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    fontSize: 14,
  },
  locBtn: {
    backgroundColor: "#D4AF37",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    flexDirection: "row",
  },
  mainBtn: {
    backgroundColor: "#D4AF37",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },
  mainBtnText: { color: "#001529", fontWeight: "bold", fontSize: 15 },
  orderCard: {
    backgroundColor: "#002140",
    padding: 16,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: { color: "#94A3B8", fontWeight: "bold", fontSize: 13 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  divider: { height: 1, backgroundColor: "#1e293b", marginVertical: 10 },
  itemText: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 3 },
  metaText: { color: "#94A3B8", fontSize: 12, marginTop: 4 },
  totalPrice: {
    color: "#D4AF37",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 8,
  },
  workerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#001529",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  callBtn: { backgroundColor: "#22C55E", padding: 10, borderRadius: 50 },
  pendingWorkerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#001529",
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  pendingWorkerText: {
    color: "#F59E0B",
    fontSize: 12,
    marginLeft: 6,
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  empty: { color: "#94A3B8", fontSize: 16, fontWeight: "bold", marginTop: 10 },
});

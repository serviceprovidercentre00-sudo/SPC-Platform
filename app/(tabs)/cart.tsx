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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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

  useEffect(() => {
    const user = auth?.currentUser;
    if (!user) {
      setIsFetching(false);
      return;
    }
    const q = query(collection(db, "orders"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const sortedOrders = orders.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        );
        setMyOrders(sortedOrders);
        setIsFetching(false);
      },
      (error) => {
        console.log("Firebase Error:", error.message);
        setIsFetching(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("done") || s.includes("complete"))
      return { color: "#22C55E", label: "Done" };
    if (s.includes("accept")) return { color: "#3B82F6", label: "Accepted" };
    return { color: "#F59E0B", label: "Wait" };
  };

  // --- LOCATION LOGIC ---
  const handleLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Error", "Permission required");
    setLoading(true);
    try {
      let loc = await Location.getCurrentPositionAsync({});
      let res = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (res.length > 0) {
        let a = res[0];
        setAddress(
          `${a.name || ""}, ${a.street || ""}, ${a.city}, ${a.region}`,
        );
      }
    } catch (e) {
      Alert.alert("Error", "Location not found");
    }
    setLoading(false);
  };

  const parsePrice = (v) =>
    parseFloat(String(v || 0).replace(/[^0-9.]/g, "")) || 0;
  const { totalBill } = useMemo(() => {
    const sub = cartItems.reduce((s, i) => s + parsePrice(i.price), 0);
    return { totalBill: sub + PLATFORM_FEE + Math.round(sub * GST_RATE) };
  }, [cartItems]);

  const placeOrder = async () => {
    const user = auth?.currentUser;
    if (!user) return Alert.alert("Login", "Please login first");
    if (!address || phone.length < 10)
      return Alert.alert("Details", "Fill address & 10-digit phone");

    setLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userName: user.displayName || "User",
        items: cartItems, // Cart se items array jayega
        totalAmount: totalBill,
        address,
        phone,
        status: "Wait",
        createdAt: serverTimestamp(),
      });
      clearCart();
      setActiveTab("history");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <Stack.Screen
        options={{
          title: "SPC Booking",
          headerStyle: { backgroundColor: "#001529" },
          headerTintColor: "#D4AF37",
        }}
      />

      <View style={styles.tabHeader}>
        <TouchableOpacity
          onPress={() => setActiveTab("new")}
          style={[styles.tab, activeTab === "new" && styles.activeTab]}
        >
          <Text
            style={{
              color: activeTab === "new" ? "#D4AF37" : "#94A3B8",
              fontWeight: "bold",
            }}
          >
            BOOKING
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("history")}
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
        >
          <Text
            style={{
              color: activeTab === "history" ? "#D4AF37" : "#94A3B8",
              fontWeight: "bold",
            }}
          >
            MY HISTORY
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {activeTab === "new" ? (
          cartItems.length === 0 ? (
            <Text style={styles.empty}>Empty Cart</Text>
          ) : (
            <View>
              {cartItems.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={{ color: "#fff", flex: 1 }}>{item.name}</Text>
                  <Text style={{ color: "#D4AF37" }}>₹{item.price}</Text>
                </View>
              ))}
              <TouchableOpacity onPress={handleLocation} style={styles.locBtn}>
                <Text style={{ color: "#001529", fontWeight: "bold" }}>
                  GET LOCATION
                </Text>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Full Address"
                placeholderTextColor="#64748B"
                value={address}
                onChangeText={setAddress}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#64748B"
                value={phone}
                onChangeText={setPhone}
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity
                style={styles.mainBtn}
                onPress={placeOrder}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.mainBtnText}>
                    BOOK NOW (₹{totalBill})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )
        ) : isFetching ? (
          <ActivityIndicator
            size="large"
            color="#D4AF37"
            style={{ marginTop: 50 }}
          />
        ) : (
          myOrders.map((order) => {
            const statusUI = getStatusStyle(order.status);
            // SERVICE NAME NIKALNE KA LOGIC (Cart ya Direct Service)
            const displayName =
              order.serviceName ||
              (order.items && order.items.length > 0
                ? order.items[0].name
                : "Service Request");

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.orderId}>
                    #{order.id.slice(-6).toUpperCase()}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusUI.color + "20" },
                    ]}
                  >
                    <Text
                      style={{
                        color: statusUI.color,
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    >
                      {statusUI.label.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* YAHA AB SERVICE KA NAAM DIKHEGA */}
                <Text
                  style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}
                >
                  {displayName}
                </Text>
                <Text
                  style={{
                    color: "#D4AF37",
                    fontWeight: "bold",
                    fontSize: 18,
                    marginTop: 5,
                  }}
                >
                  ₹{order.totalAmount}
                </Text>

                {order.workerDetails ? (
                  <View style={styles.workerRow}>
                    <View>
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        {order.workerDetails.name}
                      </Text>
                      <Text style={{ color: "#64748B", fontSize: 10 }}>
                        SPC Expert Assigned
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
                  <Text
                    style={{
                      color: "#64748B",
                      fontSize: 11,
                      marginTop: 10,
                      fontStyle: "italic",
                    }}
                  >
                    Searching for worker...
                  </Text>
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
  tab: { flex: 1, padding: 18, alignItems: "center" },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#D4AF37" },
  itemRow: {
    backgroundColor: "#002140",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
  },
  input: {
    backgroundColor: "#002140",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  locBtn: {
    backgroundColor: "#D4AF37",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  mainBtn: {
    backgroundColor: "#D4AF37",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  mainBtnText: { color: "#001529", fontWeight: "bold" },
  orderCard: {
    backgroundColor: "#002140",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  orderId: { color: "#94A3B8", fontWeight: "bold" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  divider: { height: 1, backgroundColor: "#1e293b", marginVertical: 10 },
  workerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#001529",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  callBtn: { backgroundColor: "#22C55E", padding: 10, borderRadius: 20 },
  empty: { color: "#94A3B8", textAlign: "center", marginTop: 100 },
});

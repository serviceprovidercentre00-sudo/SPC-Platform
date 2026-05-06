// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
  const router = useRouter();

  // Constants
  const PLATFORM_FEE = 49;
  const GST_RATE = 0.18;

  // --- BRAHMASTRA PRICE PARSER ---
  // Ye function kisi bhi kachre (comma, symbol, undefined) ko saaf karke number banayega
  const parsePrice = (val) => {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === "number") return val;

    // Step 1: Comma (,) ko bilkul hata do
    // Step 2: Sirf digits aur decimal point rakho
    const cleaned = String(val)
      .replace(/,/g, "")
      .replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);

    // Agar result abhi bhi Number nahi hai (NaN), toh 0 return karo
    return isNaN(num) ? 0 : num;
  };

  // --- SAFE CALCULATION LOGIC ---
  const { subtotal, gstAmount, finalTotal } = useMemo(() => {
    // 1. Subtotal calculation with safety check
    const sub = Array.isArray(cartItems)
      ? cartItems.reduce((sum, item) => sum + parsePrice(item.price), 0)
      : 0;

    // 2. GST Calculation (Subtotal + Platform Fee par 18%)
    const gst = Math.round((sub + PLATFORM_FEE) * GST_RATE);

    // 3. Final Amount
    const final = sub + PLATFORM_FEE + gst;

    return {
      subtotal: sub,
      gstAmount: gst,
      finalTotal: isNaN(final) ? 0 : final,
    };
  }, [cartItems]);

  useEffect(() => {
    const user = auth?.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMyOrders(ordersData);
    });

    return () => unsubscribe();
  }, []);

  const confirmBooking = async () => {
    const user = auth?.currentUser;
    if (!user) {
      Alert.alert("SPC Patna", "Login zaroori hai.", [
        { text: "Login", onPress: () => router.push("/profile") },
      ]);
      return;
    }

    if (cartItems.length === 0)
      return Alert.alert("Cart Khali", "Service select karein.");
    if (!address.trim() || phone.length < 10)
      return Alert.alert("Details", "Address aur Phone sahi bhariye.");

    setLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0],
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: parsePrice(item.price),
        })),
        subtotal,
        platformFee: PLATFORM_FEE,
        gstAmount,
        totalAmount: finalTotal,
        address: address.trim(),
        phone: phone.trim(),
        status: "New Order",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success! 🎉", "Booking Confirm Ho Gayi!");
      clearCart();
      setActiveTab("history");
    } catch (e) {
      Alert.alert("Error", "Server se connect nahi ho paye.");
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
          title: "SPC Bookings",
          headerStyle: { backgroundColor: "#001529" },
          headerTintColor: "#D4AF37",
        }}
      />

      <View style={styles.tabHeader}>
        <TouchableOpacity
          onPress={() => setActiveTab("new")}
          style={[styles.tab, activeTab === "new" && styles.activeTabBorder]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "new" && styles.activeTabText,
            ]}
          >
            New Order ({cartItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("history")}
          style={[
            styles.tab,
            activeTab === "history" && styles.activeTabBorder,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.activeTabText,
            ]}
          >
            My Orders
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === "new" ? (
          cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTxt}>Cart mein kuch nahi hai.</Text>
            </View>
          ) : (
            <View>
              {cartItems.map((item, idx) => (
                <View key={`${item.id}-${idx}`} style={styles.itemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>
                      ₹{parsePrice(item.price).toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                    <Ionicons name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.formCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Full Address"
                  placeholderTextColor="#94A3B8"
                  onChangeText={setAddress}
                  value={address}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone"
                  keyboardType="numeric"
                  maxLength={10}
                  onChangeText={setPhone}
                  value={phone}
                  placeholderTextColor="#94A3B8"
                />

                <View style={styles.billBox}>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Items Total</Text>
                    <Text style={styles.billValue}>
                      ₹{subtotal.toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Platform Charge</Text>
                    <Text style={styles.billValue}>₹{PLATFORM_FEE}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>GST (18%)</Text>
                    <Text style={styles.billValue}>
                      ₹{gstAmount.toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalPrice}>
                      ₹{finalTotal.toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={confirmBooking}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#001529" />
                  ) : (
                    <Text style={styles.bookBtnText}>CONFIRM ORDER</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )
        ) : (
          myOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderID}>ID: #{order.id.slice(0, 6)}</Text>
                <Text style={styles.orderTotal}>
                  ₹{parsePrice(order.totalAmount).toLocaleString("en-IN")}
                </Text>
              </View>
              {/* Status logic can be added here */}
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001529" },
  tabHeader: { flexDirection: "row", backgroundColor: "#002140" },
  tab: { flex: 1, padding: 16, alignItems: "center" },
  activeTabBorder: { borderBottomWidth: 3, borderBottomColor: "#D4AF37" },
  tabText: { color: "#94A3B8", fontWeight: "bold" },
  activeTabText: { color: "#D4AF37" },
  scrollContent: { padding: 16 },
  itemCard: {
    backgroundColor: "#002140",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  itemName: { color: "#FFF", fontWeight: "bold" },
  itemPrice: { color: "#D4AF37", marginTop: 4 },
  formCard: {
    backgroundColor: "#002140",
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#001529",
    color: "#FFF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  billBox: {
    backgroundColor: "#001529",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  billLabel: { color: "#94A3B8" },
  billValue: { color: "#FFF" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 10,
    marginTop: 5,
  },
  totalLabel: { color: "#D4AF37", fontWeight: "bold", fontSize: 16 },
  totalPrice: { color: "#D4AF37", fontWeight: "bold", fontSize: 18 },
  bookBtn: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  bookBtnText: { color: "#001529", fontWeight: "bold", fontSize: 16 },
  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyTxt: { color: "#94A3B8" },
  orderCard: {
    backgroundColor: "#002140",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  orderID: { color: "#FFF", fontWeight: "bold" },
  orderTotal: { color: "#D4AF37", fontWeight: "bold" },
});

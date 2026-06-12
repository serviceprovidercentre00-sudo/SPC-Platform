// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebase";
import { useCart } from "../context/CartContext";

export default function ServiceDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { calculateBill } = useCart();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [selectedParts, setSelectedParts] = useState([]);
  const [includeService, setIncludeService] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "services", id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setService({ id: docSnapshot.id, ...docSnapshot.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const bill = useMemo(() => {
    return calculateBill(selectedParts, includeService, service?.price || 0);
  }, [selectedParts, includeService, service]);

  const saveOrder = async () => {
    if (!address || !phone)
      return Alert.alert("Details", "Address aur Phone bhariye");

    setOrderLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: auth.currentUser?.uid || "guest",
        userName: auth.currentUser?.displayName || "User",
        serviceName: service?.name,
        // Ye field CartScreen ke 'My Orders' tab ke liye zaroori hai
        totalAmount: bill.grandTotal,
        billBreakup: bill,
        address: address.trim(),
        phone: phone.trim(),
        status: "New Order",
        callTriggered: false,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success 🎉", "Order successfully book ho gaya!");
      setShowCheckout(false);
      // Redirect to Cart page showing My Orders tab
      router.replace("/cart");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Service Details",
          headerStyle: { backgroundColor: "#001529" },
          headerTintColor: "#D4AF37",
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: service?.image }} style={styles.banner} />
        <View style={styles.content}>
          <Text style={styles.title}>{service?.name}</Text>
          <Text style={styles.subTitle}>Select required parts:</Text>

          {service?.parts?.map((part, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.partCard,
                selectedParts.find((p) => p.id === part.id) &&
                  styles.activePart,
              ]}
              onPress={() => {
                const exists = selectedParts.find((p) => p.id === part.id);
                setSelectedParts(
                  exists
                    ? selectedParts.filter((p) => p.id !== part.id)
                    : [...selectedParts, part],
                );
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.partName}>{part.name}</Text>
                <Text style={styles.partPrice}>₹{part.price}</Text>
              </View>
              <Ionicons
                name={
                  selectedParts.find((p) => p.id === part.id)
                    ? "checkmark-circle"
                    : "add-circle-outline"
                }
                size={24}
                color="#D4AF37"
              />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.serviceToggle}
            onPress={() => setIncludeService(!includeService)}
          >
            <Text style={{ color: "#fff" }}>
              Include Service Charge (₹{service?.price})
            </Text>
            <Ionicons
              name={includeService ? "checkbox" : "square-outline"}
              size={24}
              color="#D4AF37"
            />
          </TouchableOpacity>

          <View style={styles.billBox}>
            <Text
              style={{ color: "#D4AF37", fontWeight: "bold", marginBottom: 10 }}
            >
              Bill Summary
            </Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal</Text>
              <Text style={styles.billValue}>₹{bill.subTotal}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Grand Total</Text>
              <Text
                style={[
                  styles.billValue,
                  { color: "#D4AF37", fontWeight: "bold" },
                ]}
              >
                ₹{bill.grandTotal}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Payable</Text>
          <Text style={styles.totalVal}>₹{bill.grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setShowCheckout(true)}
        >
          <Text style={styles.btnText}>BOOK NOW</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCheckout} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delivery Details</Text>
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
              keyboardType="phone-pad"
              maxLength={10}
            />
            <TouchableOpacity
              style={styles.finalBtn}
              onPress={saveOrder}
              disabled={orderLoading}
            >
              {orderLoading ? (
                <ActivityIndicator color="#001529" />
              ) : (
                <Text style={styles.finalBtnText}>CONFIRM ORDER</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCheckout(false)}>
              <Text
                style={{ color: "#D4AF37", textAlign: "center", marginTop: 15 }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001529" },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#001529",
  },
  banner: { width: "100%", height: 200, backgroundColor: "#002140" },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  subTitle: { color: "#64748B", marginBottom: 15 },
  partCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#002140",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  activePart: { borderColor: "#D4AF37" },
  partName: { color: "#fff" },
  partPrice: { color: "#D4AF37", fontSize: 12 },
  serviceToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#002140",
    borderRadius: 12,
    marginTop: 10,
  },
  billBox: {
    backgroundColor: "#002140",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  billLabel: { color: "#64748B" },
  billValue: { color: "#fff" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#001529",
    borderTopWidth: 1,
    borderColor: "#1e293b",
  },
  totalLabel: { color: "#64748B" },
  totalVal: { fontSize: 20, color: "#D4AF37", fontWeight: "bold" },
  btn: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 25,
    borderRadius: 10,
    justifyContent: "center",
  },
  btnText: { color: "#001529", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#001529",
    padding: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderTopWidth: 1,
    borderColor: "#D4AF37",
  },
  modalTitle: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#002140",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  finalBtn: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  finalBtnText: { color: "#001529", fontWeight: "bold" },
});

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
    const unsub = onSnapshot(doc(db, "services", id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setService({ id: docSnapshot.id, ...docSnapshot.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  // Bill Calculation using Context Logic
  const bill = useMemo(() => {
    return calculateBill(selectedParts, includeService, service?.price);
  }, [selectedParts, includeService, service]);

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );

  const saveOrder = async () => {
    if (!address || !phone)
      return Alert.alert("Required", "Address aur Phone zaroori hai");
    setOrderLoading(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: auth.currentUser?.uid || "guest",
        serviceName: service.name,
        billBreakup: bill, // Poora breakup save hoga
        address,
        phone,
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      setShowCheckout(false);
      router.replace("/orders");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setOrderLoading(false);
    }
  };

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
        <Image source={{ uri: service.image }} style={styles.banner} />
        <View style={styles.content}>
          <Text style={styles.title}>{service.name}</Text>

          <View style={styles.sectionHeader}>
            <Text style={styles.subTitle}>Select required parts:</Text>
          </View>

          {service.parts?.map((part, index) => (
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
              <View style={styles.partDetails}>
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
            <Text style={styles.serviceText}>
              Include Service Charge (₹{service.price})
            </Text>
            <Ionicons
              name={includeService ? "checkbox" : "square-outline"}
              size={24}
              color="#D4AF37"
            />
          </TouchableOpacity>

          {/* --- NEW BILL BOX --- */}
          <View style={styles.billBox}>
            <Text style={styles.billTitle}>Bill Summary</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Items & Service</Text>
              <Text style={styles.billValue}>₹{bill.subTotal}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Platform Fee</Text>
              <Text style={styles.billValue}>₹{bill.platformFee}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>GST (10%)</Text>
              <Text style={styles.billValue}>₹{bill.taxAmount}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.billRow}>
              <Text
                style={[
                  styles.billLabel,
                  { color: "#fff", fontWeight: "bold" },
                ]}
              >
                Grand Total
              </Text>
              <Text
                style={[
                  styles.billValue,
                  { color: "#D4AF37", fontWeight: "bold", fontSize: 16 },
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
          <Text style={styles.totalLabel}>Amount to Pay</Text>
          <Text style={styles.totalVal}>₹{bill.grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setShowCheckout(true)}
        >
          <Text style={styles.btnText}>BOOK NOW</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCheckout} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Booking</Text>
            <TextInput
              style={styles.input}
              placeholder="Service Address"
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
                Go Back
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
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  banner: { width: "100%", height: 200 },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  sectionHeader: { marginBottom: 10 },
  subTitle: { color: "#64748B", fontSize: 14 },
  partCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#001c3d",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  activePart: { borderColor: "#D4AF37" },
  partDetails: { flex: 1 },
  partName: { color: "#fff", fontWeight: "500" },
  partPrice: { color: "#64748B", marginTop: 2 },
  serviceToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#001c3d",
    borderRadius: 12,
    marginTop: 10,
  },
  serviceText: { color: "#fff", fontWeight: "500" },
  billBox: {
    backgroundColor: "#001c3d",
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  billTitle: { color: "#D4AF37", fontWeight: "bold", marginBottom: 10 },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  billLabel: { color: "#64748B", fontSize: 13 },
  billValue: { color: "#fff", fontSize: 13 },
  divider: { height: 1, backgroundColor: "#1e293b", marginVertical: 10 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#001529",
    borderTopWidth: 1,
    borderColor: "#1e293b",
  },
  totalLabel: { color: "#64748B", fontSize: 12 },
  totalVal: { fontSize: 22, color: "#D4AF37", fontWeight: "bold" },
  btn: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 30,
    justifyContent: "center",
    borderRadius: 10,
  },
  btnText: { color: "#001529", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#001529",
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 2,
    borderColor: "#D4AF37",
  },
  modalTitle: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#001c3d",
    color: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWide: 1,
    borderColor: "#1e293b",
  },
  finalBtn: {
    backgroundColor: "#D4AF37",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  finalBtnText: { color: "#001529", fontWeight: "bold", fontSize: 16 },
});

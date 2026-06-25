// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import QRCodeStyled from "react-native-qrcode-styled";
import { db } from "../../config/firebase";

// Modular Child Import
import SignaturePanel from "./SignaturePanel";

const SPC_MAIN_UPI = "spc.cyber@ybl";
const BUSINESS_NAME = "Service Provider Centre";

export default function OrderList({ workerData, workerUid }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("status", "in", [
        "New Order",
        "new order",
        "open",
        "pending",
        "accepted",
      ]),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filtered = allOrders.filter((order) => {
          if (order.workerId === workerUid) return true;

          const orderStatus = (order.status || "").trim().toLowerCase();
          const allowedStatuses = ["new order", "open", "pending"];
          const isStatusMatch = allowedStatuses.includes(orderStatus);

          const orderCat = (order.category || "").trim().toLowerCase();
          const workerCat = (workerData?.category || "").trim().toLowerCase();
          const isCategoryMatch =
            workerCat === "general" ||
            workerCat === "" ||
            orderCat === workerCat;

          const workerLoc = (
            workerData?.location ||
            workerData?.city ||
            "patna"
          )
            .trim()
            .toLowerCase();
          const orderLocationStr = (
            order.location ||
            order.city ||
            order.address ||
            ""
          )
            .trim()
            .toLowerCase();
          const isLocationMatch = orderLocationStr.includes(workerLoc);

          return isStatusMatch && isCategoryMatch && isLocationMatch;
        });

        setOrders(filtered);
        setOrdersLoading(false);
      },
      (err) => {
        console.error("Order List Sync Error:", err);
        setOrdersLoading(false);
      },
    );

    return () => unsubscribe();
  }, [workerData, workerUid]);

  const handleAcceptOrder = async (orderId) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "accepted",
        workerId: workerUid,
        workerName: workerData?.name || "SPC Professional",
        workerPhone: workerData?.phone || "",
      });
      Alert.alert(
        "Kaam Accepted! 🎉",
        "Niche diye gaye forms ko fill karke submit karein.",
      );
    } catch (error) {
      Alert.alert("Error", "Order accept nahi ho paya.");
    }
  };

  if (ordersLoading)
    return <ActivityIndicator color="#D4AF37" style={{ marginTop: 20 }} />;
  if (orders.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          Aapki Location me koi active order nahi mila.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>
        Kaam / Active Orders ({orders.length})
      </Text>
      {orders.map((order) => (
        <OrderItem
          key={order.id}
          order={order}
          workerUid={workerUid}
          onAccept={handleAcceptOrder}
        />
      ))}
    </View>
  );
}

// 📦 ISOLATED ORDER ROW COMPONENT (Isolates form states completely)
function OrderItem({ order, workerUid, onAccept }) {
  const [warrantyMonths, setWarrantyMonths] = useState("3"); // 3 Mahine Ki Kaam Ki Zimmedari default
  const [sealId, setSealId] = useState("");
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const isMyJob = order.workerId === workerUid;

  const handleFinalSubmit = async () => {
    if (!sealId.trim()) {
      Alert.alert(
        "Seal ID Missing",
        "Kripya Warranty Seal Sticker ID darj karein.",
      );
      return;
    }
    if (!isSigned) {
      Alert.alert(
        "Signature Missing",
        "Client ka digital signature zaroori hai.",
      );
      return;
    }

    try {
      const orderRef = doc(db, "orders", order.id);
      const expiryDate = new Date();
      expiryDate.setMonth(
        expiryDate.getMonth() + parseInt(warrantyMonths || "3"),
      );

      await updateDoc(orderRef, {
        status: "completed",
        completedAt: new Date().toISOString(),
        warrantyMonths: parseInt(warrantyMonths),
        warrantyExpiry: expiryDate.toISOString(),
        warrantySealId: sealId,
        hasDigitalSignature: true,
        paymentStatus: showPaymentQR
          ? "Online Checking (Main Account)"
          : "Cash Received by Worker",
      });

      Alert.alert("Kaam Completed! ✅", "Order closed successfully.");
      setSealId("");
      setIsSigned(false);
    } catch (err) {
      Alert.alert("Error", "Server sync failure.");
    }
  };

  return (
    <View style={[styles.orderCard, isMyJob && styles.myOrderCard]}>
      {/* Card Header */}
      <View style={styles.orderHeader}>
        <Text style={styles.orderIdText}>
          ID: #{order.id.slice(0, 8).toUpperCase()}
        </Text>
        <View
          style={[
            styles.statusTag,
            { backgroundColor: isMyJob ? "#2E7D32" : "#D4AF37" },
          ]}
        >
          <Text style={styles.statusText}>
            {isMyJob ? "ASSIGNED TO YOU" : "AVAILABLE"}
          </Text>
        </View>
      </View>

      {/* Details Section */}
      <Text style={styles.detailLine}>
        <Text style={styles.label}>Service:</Text>{" "}
        {order.serviceName || "General Repair"}
      </Text>
      <Text style={styles.detailLine}>
        <Text style={styles.label}>Customer:</Text>{" "}
        {order.customerName || "SPC Customer"}
      </Text>
      <Text style={styles.detailLine}>
        <Text style={styles.label}>Address:</Text>{" "}
        {order.address || "Patna, Bihar"}
      </Text>
      <Text style={styles.detailLine}>
        <Text style={styles.label}>Amount Due:</Text> ₹
        {order.totalPayable || order.amount || "0"}
      </Text>

      {isMyJob ? (
        <View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${order.phone}`)}
            >
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.btnText}>Call Client</Text>
            </TouchableOpacity>
          </View>

          {/* SPC Form Options Upfront Panel */}
          <View style={styles.integratedPanel}>
            <Text style={styles.panelHeading}>
              ⚙️ SPC WORKING CONTROL OPTIONS
            </Text>

            <Text style={styles.inputLabel}>Warranty Duration (Months):</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={warrantyMonths}
              onChangeText={setWarrantyMonths}
            />

            <Text style={styles.inputLabel}>Warranty Seal Sticker ID:</Text>
            <TextInput
              style={styles.textInput}
              value={sealId}
              onChangeText={setSealId}
              placeholder="SPC-PTN-XXXX"
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>Payment Settlement Mode:</Text>
            <View style={{ flexDirection: "row", marginBottom: 10 }}>
              <TouchableOpacity
                style={[
                  styles.payModeBox,
                  !showPaymentQR && styles.payModeBoxActive,
                ]}
                onPress={() => setShowPaymentQR(false)}
              >
                <Text style={styles.payModeText}>Cash Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.payModeBox,
                  showPaymentQR && styles.payModeBoxActive,
                ]}
                onPress={() => setShowPaymentQR(true)}
              >
                <Text style={styles.payModeText}>Online QR Pay</Text>
              </TouchableOpacity>
            </View>

            {showPaymentQR && (
              <View style={styles.qrBlock}>
                <Text style={styles.qrTitle}>Scan to Pay Main SPC Account</Text>
                <QRCodeStyled
                  data={`upi://pay?pa=${SPC_MAIN_UPI}&pn=${encodeURIComponent(BUSINESS_NAME)}&am=${order.totalPayable || 0}&cu=INR&tn=${encodeURIComponent("SPC-" + order.id.slice(0, 6))}`}
                  size={120}
                  color={"#001529"}
                  backgroundColor={"#ffffff"}
                  padding={6}
                  pieceSize={3}
                />
              </View>
            )}

            <Text style={styles.inputLabel}>
              Customer Digital Signature Pad:
            </Text>
            <SignaturePanel
              onSignatureChange={(signed) => setIsSigned(signed)}
            />

            <TouchableOpacity
              style={styles.submitJobBtn}
              onPress={handleFinalSubmit}
            >
              <Text style={styles.submitJobBtnText}>
                VERIFY & CLOSE ORDER NOW
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => onAccept(order.id)}
        >
          <Text style={styles.acceptBtnText}>ACCEPT THIS JOB</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  emptyCard: {
    backgroundColor: "#002140",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  emptyText: { color: "#aaa", textAlign: "center", fontSize: 13 },
  orderCard: {
    backgroundColor: "#002140",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: "#003366",
  },
  myOrderCard: { borderColor: "#2E7D32", borderWidth: 1 },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderIdText: { color: "#fff", fontWeight: "bold" },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: "#001529", fontWeight: "bold", fontSize: 10 },
  detailLine: { color: "#ccc", fontSize: 13, marginBottom: 4 },
  label: { color: "#777", fontWeight: "bold" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 10,
  },
  callBtn: {
    backgroundColor: "#0288D1",
    padding: 10,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold", marginLeft: 5, fontSize: 13 },
  acceptBtn: {
    backgroundColor: "#D4AF37",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  acceptBtnText: { color: "#001529", fontWeight: "bold" },
  integratedPanel: {
    marginTop: 10,
    backgroundColor: "#001529",
    padding: 12,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#D4AF37",
  },
  panelHeading: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderColor: "#333",
    paddingBottom: 4,
  },
  inputLabel: {
    color: "#aaa",
    fontSize: 11,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "bold",
  },
  textInput: {
    backgroundColor: "#002140",
    color: "#fff",
    padding: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#003366",
    fontSize: 13,
  },
  payModeBox: {
    flex: 1,
    backgroundColor: "#002140",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 2,
    borderWidth: 0.5,
    borderColor: "#003366",
  },
  payModeBoxActive: { borderColor: "#D4AF37", backgroundColor: "#003366" },
  payModeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  qrBlock: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 6,
    marginVertical: 8,
  },
  qrTitle: { color: "#000", fontSize: 11, fontWeight: "bold", marginBottom: 5 },
  submitJobBtn: {
    backgroundColor: "#D4AF37",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 15,
  },
  submitJobBtnText: { color: "#001529", fontWeight: "bold", fontSize: 12 },
});

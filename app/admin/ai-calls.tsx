// @ts-nocheck
import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    setDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { db } from "../../config/firebase";

export default function AICallsDashboard() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Normal Number Mapping States
  const [normalNumber, setNormalNumber] = useState("");
  const [webhookUrl, setWebhookUrl] = useState(
    "https://api.spc.platform/v1/inbound-ai",
  );
  const [isSaving, setIsSaving] = useState(false);

  // Live Track Inbound/Outbound AI Calls from Firestore
  useEffect(() => {
    const callsRef = collection(db, "ai_calls");
    const q = query(callsRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedCalls = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCalls(fetchedCalls);
        setLoading(false);
      },
      (err) => {
        console.error("AI Calls Fetch Error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Normal Number configuration ko save karne ka function
  const handleSaveConfig = async () => {
    if (!normalNumber || normalNumber.length < 10) {
      Alert.alert(
        "Invalid Number",
        "Kripya ek valid 10-digit ka normal number enter karein.",
      );
      return;
    }

    setIsSaving(true);
    try {
      // Config data save dynamic collection me bina kisi rigid mapping crash ke
      await setDoc(
        doc(db, "system_config", "ai_telephony"),
        {
          mappedNormalNumber: normalNumber,
          webhookRouteUrl: webhookUrl,
          status: "active",
          lastUpdated: new Date(),
        },
        { merge: true },
      );

      Alert.alert(
        "AI Pro Activated",
        "Aapka normal number AI cloud trunk se successfully connect ho gaya hai. Ab incoming calls directly AI active handle karega!",
      );
    } catch (error) {
      console.error("Save config error:", error);
      Alert.alert("Error", "Configuration save nahi ho payi.");
    } finally {
      setIsSaving(false);
    }
  };

  const openCallDetails = (callItem) => {
    setSelectedCall(callItem);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>
          AI Telephony Control Sync Ho Raha Hai...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎙️ PRO AI Telephony & Control</Text>
          <Text style={styles.headerSub}>
            Inbound and Outbound Voice Server Engine
          </Text>
        </View>

        {/* ⚙️ CONFIGURATION BLOCK: Add Normal Number Mapping */}
        <View style={styles.configCard}>
          <Text style={styles.configTitle}>
            ⛓️ Map Your Normal Phone Number
          </Text>
          <Text style={styles.configSub}>
            Jis number par customer call karega, use AI system routing se
            connect karein:
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ex: +91 9876543210 (Apna Normal Number dalein)"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            value={normalNumber}
            onChangeText={setNormalNumber}
          />

          <Text
            style={
              (styles.configSub, { marginTop: 10, color: "#aaa", fontSize: 11 })
            }
          >
            Backend Webhook Redirect Address:
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: "#001529", color: "#888" },
            ]}
            editable={false}
            value={webhookUrl}
          />

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveConfig}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#001529" />
            ) : (
              <Text style={styles.saveBtnText}>
                ACTIVATE INBOUND AI ROUTING
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Counter Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{calls.length}</Text>
            <Text style={styles.statLabel}>Total Calls Processed</Text>
          </View>
          <View style={[styles.statBox, { borderColor: "#4CAF50" }]}>
            <Text style={[styles.statNum, { color: "#4CAF50" }]}>
              {calls.filter((c) => c.created_order_id).length}
            </Text>
            <Text style={styles.statLabel}>Orders Automatically Booked</Text>
          </View>
        </View>

        {/* Call Logs Heading */}
        <Text style={styles.sectionHeading}>
          📋 Live Call Analytics & Recording Transcripts
        </Text>

        {/* Call Logs List */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 30 }}>
          {calls.length === 0 ? (
            <Text style={styles.emptyText}>
              Abhi tak koi inbound/outbound AI call trace nahi mila.
            </Text>
          ) : (
            calls.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.callCard}
                onPress={() => openCallDetails(item)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.phoneText}>
                    {item.direction === "inbound" ? "📥 " : "📤 "}
                    {item.customerPhone || "Customer Call"}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.status === "completed" ? "#1e4620" : "#5c3c00",
                      },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {(item.status || "Ongoing").toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.summaryText} numberOfLines={2}>
                  {item.summary ||
                    "AI Summary text data process ho raha hai..."}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.timeText}>
                    {item.timestamp?.toDate
                      ? item.timestamp.toDate().toLocaleString()
                      : "Just Now"}
                  </Text>
                  {item.created_order_id && (
                    <View style={styles.orderLinkedBadge}>
                      <Text style={styles.orderLinkedText}>
                        🛒 Order Auto-Booked
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* 📜 Conversation Transcript Modal */}
      {selectedCall && (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Call Transcript Details</Text>
              <Text style={styles.modalSub}>
                {selectedCall.customerPhone} (
                {selectedCall.direction || "Inbound"})
              </Text>

              <ScrollView style={styles.transcriptBox}>
                {selectedCall.transcript &&
                selectedCall.transcript.length > 0 ? (
                  selectedCall.transcript.map((msg, index) => (
                    <View
                      key={index}
                      style={[
                        styles.chatBubble,
                        msg.role === "ai"
                          ? styles.aiBubble
                          : styles.customerBubble,
                      ]}
                    >
                      <Text style={styles.bubbleRole}>
                        {msg.role === "ai"
                          ? "🤖 AI Assistant:"
                          : "👤 Customer:"}
                      </Text>
                      <Text style={styles.bubbleText}>{msg.text}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    Is call ki live chat recording clear text me fetch nahi hui.
                  </Text>
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Close Transcripts</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001529" },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#aaa", marginTop: 12, fontSize: 13 },
  header: { padding: 16, borderBottomWidth: 0.5, borderColor: "#002140" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerSub: { color: "#888", fontSize: 12, marginTop: 4 },
  sectionHeading: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "bold",
    paddingHorizontal: 16,
    marginTop: 15,
    marginBottom: 8,
  },
  configCard: {
    backgroundColor: "#002140",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  configTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  configSub: { color: "#888", fontSize: 12, marginBottom: 10, lineHeight: 16 },
  input: {
    backgroundColor: "#002d59",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 0.5,
    borderColor: "#1f3a52",
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  saveBtnText: {
    color: "#001529",
    fontWeight: "bold",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#002140",
    padding: 14,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#1f3a52",
    alignItems: "center",
  },
  statNum: { color: "#D4AF37", fontSize: 22, fontWeight: "bold" },
  statLabel: { color: "#aaa", fontSize: 10, marginTop: 4, textAlign: "center" },
  callCard: {
    backgroundColor: "#002140",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#1f3a52",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phoneText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  summaryText: { color: "#ccc", fontSize: 13, marginTop: 8, lineHeight: 18 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    borderTopWidth: 0.5,
    borderColor: "#1f3a52",
    paddingTop: 8,
  },
  timeText: { color: "#666", fontSize: 11 },
  orderLinkedBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#4CAF50",
  },
  orderLinkedText: { color: "#4CAF50", fontSize: 11, fontWeight: "bold" },
  emptyText: {
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#001529",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "85%",
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  modalSub: { color: "#888", fontSize: 13, marginTop: 2, marginBottom: 16 },
  transcriptBox: { marginBottom: 16 },
  chatBubble: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: "85%",
  },
  aiBubble: {
    backgroundColor: "#002140",
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderColor: "#D4AF37",
  },
  customerBubble: { backgroundColor: "#1f3a52", alignSelf: "flex-end" },
  bubbleRole: {
    color: "#888",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bubbleText: { color: "#fff", fontSize: 13, lineHeight: 18 },
  closeButton: {
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  closeBtnText: { color: "#001529", fontWeight: "bold", fontSize: 15 },
});

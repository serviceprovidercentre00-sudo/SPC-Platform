// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";

export default function AICallsManagement() {
  // Form States
  const [phoneNumber, setPhoneNumber] = useState("");
  const [targetName, setTargetName] = useState("");
  const [callMode, setCallMode] = useState("custom_prompt"); // Modes: custom_prompt | staff_interview | vendor_onboarding | order_confirm
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("hi-IN");
  const [loading, setLoading] = useState(false);

  // Stats Counters (Pahle wala System)
  const [stats, setStats] = useState({
    totalCalls: 48,
    confirmed: 38,
    failed: 4,
    inProgress: 6,
  });

  // Sample Call Logs (Old + New Mix Logs)
  const [callLogs, setCallLogs] = useState([
    {
      id: "1",
      name: "Ramesh Sharma",
      phone: "+91 98765 43210",
      type: "Vendor Onboarding",
      status: "INTERESTED",
      summary:
        "Wholesaler AC parts 12% commission par dene ko raazi ho gaye hain.",
      time: "10 min ago",
    },
    {
      id: "2",
      name: "Amit Kumar",
      phone: "+91 91234 56789",
      type: "Staff Interview",
      status: "SCHEDULED",
      summary: "Electrician position ke liye ready hai, kal Patna HQ aayega.",
      time: "25 min ago",
    },
    {
      id: "3",
      name: "Priya Singh",
      phone: "+91 99887 76655",
      type: "Order Confirmation",
      status: "CONFIRMED",
      summary: "AC Repair service 4 PM ke liye confirm ki gayi.",
      time: "1 hour ago",
    },
  ]);

  // Mode Auto-fill Helper Text
  const handleModeChange = (mode) => {
    setCallMode(mode);
    if (mode === "staff_interview") {
      setCustomPrompt(
        "Pucho ki kya wo SPC Platform ke sath Electrician/Technician ka kaam karne me interested hain? Unka salary expectation aur experience pucho.",
      );
    } else if (mode === "vendor_onboarding") {
      setCustomPrompt(
        "Pucho ki kya wo apna spare parts/wholesale stock hamare platform par listing karke bechne ko tayar hain? 10% commission model offer karo.",
      );
    } else if (mode === "order_confirm") {
      setCustomPrompt(
        "Aaj 4 PM ki AC service booking confirm karo aur 1 dabane ko kaho.",
      );
    } else {
      setCustomPrompt("");
    }
  };

  // Trigger AI Voice Agent Call
  const handleInitiateCall = async () => {
    if (!phoneNumber.trim()) {
      const msg = "Bhai, Phone number daalna zaroori hai!";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Input Required", msg);
      return;
    }

    if (!customPrompt.trim()) {
      const msg = "AI ke liye instructions/prompt daalna zaroori hai!";
      Platform.OS === "web" ? alert(msg) : Alert.alert("Prompt Required", msg);
      return;
    }

    setLoading(true);

    try {
      // 1. Save Call Trigger Request to Firebase Firestore
      const callData = {
        phoneNumber: phoneNumber.trim(),
        targetName: targetName.trim() || "Unknown Recipient",
        callMode: callMode,
        instructions: customPrompt.trim(),
        language: selectedLanguage,
        status: "QUEUED",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "ai_calls"), callData);

      // 2. Add Local State to show instant log on UI
      const newLog = {
        id: Date.now().toString(),
        name: targetName.trim() || "Target Person",
        phone: phoneNumber.trim(),
        type:
          callMode === "staff_interview"
            ? "Staff Interview"
            : callMode === "vendor_onboarding"
              ? "Vendor Onboarding"
              : callMode === "order_confirm"
                ? "Order Confirm"
                : "Custom AI Agent",
        status: "CALLING...",
        summary: `Instruction: ${customPrompt.slice(0, 50)}...`,
        time: "Just Now",
      };

      setCallLogs([newLog, ...callLogs]);
      setStats((prev) => ({ ...prev, totalCalls: prev.totalCalls + 1 }));

      const successMsg = `🚀 AI Agent ${phoneNumber} par call connect kar raha hai!`;
      Platform.OS === "web"
        ? alert(successMsg)
        : Alert.alert("Call Initiated", successMsg);

      // Reset Inputs
      setPhoneNumber("");
      setTargetName("");
      setCustomPrompt("");
    } catch (error) {
      console.error("Error triggering AI call:", error);
      const errMsg = "Call initiate nahi ho paya. Network check karein.";
      Platform.OS === "web" ? alert(errMsg) : Alert.alert("Error", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
    >
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI VOICE COMMAND CENTER</Text>
          <Text style={styles.subtitle}>Patna HQ Dynamic Voice Agent v3.0</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={16} color="#D4AF37" />
          <Text style={styles.badgeText}>REALTIME AI AGENT</Text>
        </View>
      </View>

      {/* TOP ANALYTICS CARDS (Pahle wala Status Bar) */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: "#3B82F6" }]}>
          <Ionicons name="call" size={24} color="#3B82F6" />
          <Text style={styles.statNumber}>{stats.totalCalls}</Text>
          <Text style={styles.statLabel}>Total Calls</Text>
        </View>

        <View style={[styles.statCard, { borderColor: "#10B981" }]}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.statNumber}>{stats.confirmed}</Text>
          <Text style={styles.statLabel}>Converted / Agreed</Text>
        </View>

        <View style={[styles.statCard, { borderColor: "#F59E0B" }]}>
          <Ionicons name="sync" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>Active Queues</Text>
        </View>

        <View style={[styles.statCard, { borderColor: "#EF4444" }]}>
          <Ionicons name="close-circle" size={24} color="#EF4444" />
          <Text style={styles.statNumber}>{stats.failed}</Text>
          <Text style={styles.statLabel}>Failed / Busy</Text>
        </View>
      </View>

      {/* DYNAMIC AI TRIGGER FORM */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          <Ionicons name="hardware-chip-outline" size={20} color="#D4AF37" />{" "}
          Initiate Smart AI Call
        </Text>

        {/* MODE SELECTOR BUTTONS */}
        <Text style={styles.inputLabel}>Select AI Calling Objective:</Text>
        <View style={styles.modeGrid}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              callMode === "custom_prompt" && styles.modeBtnActive,
            ]}
            onPress={() => handleModeChange("custom_prompt")}
          >
            <Ionicons
              name="chatbubbles"
              size={18}
              color={callMode === "custom_prompt" ? "#001529" : "#D4AF37"}
            />
            <Text
              style={[
                styles.modeBtnText,
                callMode === "custom_prompt" && styles.modeBtnTextActive,
              ]}
            >
              Custom Direct Prompt
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              callMode === "staff_interview" && styles.modeBtnActive,
            ]}
            onPress={() => handleModeChange("staff_interview")}
          >
            <Ionicons
              name="people"
              size={18}
              color={callMode === "staff_interview" ? "#001529" : "#D4AF37"}
            />
            <Text
              style={[
                styles.modeBtnText,
                callMode === "staff_interview" && styles.modeBtnTextActive,
              ]}
            >
              Staff Interview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              callMode === "vendor_onboarding" && styles.modeBtnActive,
            ]}
            onPress={() => handleModeChange("vendor_onboarding")}
          >
            <Ionicons
              name="business"
              size={18}
              color={callMode === "vendor_onboarding" ? "#001529" : "#D4AF37"}
            />
            <Text
              style={[
                styles.modeBtnText,
                callMode === "vendor_onboarding" && styles.modeBtnTextActive,
              ]}
            >
              Wholesaler Onboarding
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              callMode === "order_confirm" && styles.modeBtnActive,
            ]}
            onPress={() => handleModeChange("order_confirm")}
          >
            <Ionicons
              name="checkmark-done"
              size={18}
              color={callMode === "order_confirm" ? "#001529" : "#D4AF37"}
            />
            <Text
              style={[
                styles.modeBtnText,
                callMode === "order_confirm" && styles.modeBtnTextActive,
              ]}
            >
              Order Confirm (Old)
            </Text>
          </TouchableOpacity>
        </View>

        {/* INPUT FIELDS */}
        <View style={styles.rowInputs}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.inputLabel}>
              Target Person Name (Optional):
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramesh ji (Wholesaler)"
              placeholderTextColor="#64748B"
              value={targetName}
              onChangeText={setTargetName}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Phone Number (*):</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 9876543210"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
        </View>

        {/* INSTRUCTIONS / PROMPT TEXTAREA */}
        <Text style={styles.inputLabel}>
          AI Instructions / Syllabus (Kya baat karni hai?):
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Yahan AI ko hidayat dein... Jaise: Unse pucho ki kya wo AC parts supply karenge aur 10% discount denge?"
          placeholderTextColor="#64748B"
          multiline={true}
          numberOfLines={4}
          value={customPrompt}
          onChangeText={setCustomPrompt}
        />

        {/* TRIGGER BUTTON */}
        <TouchableOpacity
          style={[styles.triggerBtn, loading && { opacity: 0.7 }]}
          onPress={handleInitiateCall}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#001529" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="call"
                size={20}
                color="#001529"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.triggerBtnText}>EXECUTE AI CALL NOW</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* LIVE CALL LOGS TABLE */}
      <View style={styles.logsCard}>
        <Text style={styles.formTitle}>
          <Ionicons name="list" size={20} color="#D4AF37" /> Call Transcripts &
          Outcomes
        </Text>

        {callLogs.map((log) => (
          <View key={log.id} style={styles.logRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.logName}>{log.name}</Text>
                <Text style={styles.logPhone}>({log.phone})</Text>
              </View>

              <View style={{ flexDirection: "row", marginTop: 4 }}>
                <Text style={styles.logTypeTag}>{log.type}</Text>
                <Text style={styles.logTime}>{log.time}</Text>
              </View>

              <Text style={styles.logSummary}>{log.summary}</Text>
            </View>

            <View style={styles.statusBadgeContainer}>
              <Text
                style={[
                  styles.statusBadge,
                  log.status === "INTERESTED" || log.status === "CONFIRMED"
                    ? { backgroundColor: "#10B981" }
                    : log.status === "CALLING..."
                      ? { backgroundColor: "#F59E0B" }
                      : { backgroundColor: "#3B82F6" },
                ]}
              >
                {log.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001529" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#D4AF37",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subtitle: { color: "#64748B", fontSize: 12 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#001c3d",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  badgeText: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 5,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: "23%",
    backgroundColor: "#001c3d",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 140,
    marginBottom: 10,
  },
  statNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 5,
  },
  statLabel: { color: "#94A3B8", fontSize: 11, textAlign: "center" },
  formCard: {
    backgroundColor: "#001c3d",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D4AF37",
    marginBottom: 20,
  },
  formTitle: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  inputLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 8,
    marginTop: 10,
    fontWeight: "bold",
  },
  modeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4AF37",
    backgroundColor: "#001529",
  },
  modeBtnActive: { backgroundColor: "#D4AF37" },
  modeBtnText: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },
  modeBtnTextActive: { color: "#001529" },
  rowInputs: { flexDirection: "row", justifyContent: "space-between" },
  input: {
    backgroundColor: "#001529",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 14,
  },
  textArea: { height: 90, textAlignVertical: "top" },
  triggerBtn: {
    backgroundColor: "#D4AF37",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  triggerBtnText: {
    color: "#001529",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  logsCard: {
    backgroundColor: "#001c3d",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#001529",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  logName: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  logPhone: { color: "#94A3B8", fontSize: 12, marginLeft: 6 },
  logTypeTag: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "bold",
    marginRight: 10,
  },
  logTime: { color: "#64748B", fontSize: 11 },
  logSummary: { color: "#CBD5E1", fontSize: 12, marginTop: 6 },
  statusBadgeContainer: { justifyContent: "center" },
  statusBadge: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
});

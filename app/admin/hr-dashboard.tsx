// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { db } from "../../config/firebase";

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState("staff");
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [complaints, setComplaints] = useState([]);

  // Modal Controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // 📝 Extended Form Inputs (Business Logic Requirements)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [skill, setSkill] = useState(""); // e.g. AC Repair, Electrician, Delivery
  const [salary, setSalary] = useState("");
  const [commission, setCommission] = useState("");
  const [location, setLocation] = useState(""); // Service area in Patna
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Edit states
  const [editStatus, setEditStatus] = useState("");
  const [editDocStatus, setEditDocStatus] = useState("");

  useEffect(() => {
    fetchHRData();
  }, []);

  // Fetch from Live Database
  const fetchHRData = async () => {
    setLoading(true);
    try {
      const staffQuery = query(
        collection(db, "users"),
        where("role", "==", "delivery_boy"),
      );
      const staffSnapshot = await getDocs(staffQuery);

      const realStaffData = [];
      staffSnapshot.forEach((doc) => {
        const data = doc.data();
        realStaffData.push({
          id: doc.id,
          name: data.displayName || data.name || "SPC Staff",
          phone: data.phone || "No Contact",
          skill: data.skill || "General Delivery",
          salary: data.salary || "0",
          commission: data.commission || "0",
          location: data.location || "Patna Central",
          email: data.email || "No Email",
          address: data.address || "Not Provided",
          status: data.status || "Pending",
          attendance: data.attendance || "Offline",
          payoutDue: data.walletBalance || data.wallet || 0,
          totalWorkDone: data.totalWorkDone || data.completedOrders || 0, // Real counter tracked by HR
          docStatus: data.docStatus || "Pending Verification",
        });
      });
      setStaffList(realStaffData);

      const complaintsSnapshot = await getDocs(
        query(collection(db, "complaints")),
      );
      const realComplaintsData = [];
      complaintsSnapshot.forEach((doc) => {
        const data = doc.data();
        realComplaintsData.push({
          id: doc.id,
          staffName: data.staffName || "Unknown Staff",
          issue: data.issue || "No description",
          status: data.status || "Open",
        });
      });
      setComplaints(realComplaintsData);
    } catch (error) {
      Alert.alert("Database Error", "Live database sync fail ho gaya.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 1. ADD NEW WORKER WITH ALL BUSINESS SPECIFICATIONS
  const handleAddNewStaff = async () => {
    if (!name || !phone || !skill || !salary || !location) {
      Alert.alert(
        "Error",
        "Kripya zaroori fields (Name, Phone, Skill, Salary, Location) zaroor fill karein.",
      );
      return;
    }

    try {
      setLoading(true);
      const newStaffId = "spc_staff_" + Date.now();

      // Save full mapping ledger directly to Firestore
      await setDoc(doc(db, "users", newStaffId), {
        name: name,
        displayName: name,
        phone: phone,
        skill: skill,
        salary: Number(salary),
        commission: Number(commission || 0),
        location: location,
        email: email,
        address: address,
        role: "delivery_boy",
        status: "Active",
        attendance: "Offline",
        docStatus: "Pending Verification",
        walletBalance: 0,
        totalWorkDone: 0, // Initalize work counter at 0
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        "Success 🎉",
        `${name} ka complete profile database me register ho gaya.`,
      );
      setIsAddModalOpen(false);
      // Reset form states
      setName("");
      setPhone("");
      setSkill("");
      setSalary("");
      setCommission("");
      setLocation("");
      setEmail("");
      setAddress("");
      fetchHRData();
    } catch (e) {
      Alert.alert("Error", "Profile save karne me database error aaya.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 2. DELETE STAFF (IF WORKER LEAVES THE COMPANY)
  const handleDeleteStaff = (id, staffName) => {
    Alert.alert(
      "Terminate Worker Profile",
      `Kya aap pakka ${staffName} ka record database se permanently delete karna chahte hain? Ye staff system se hat jayega.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete Permanently",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, "users", id));
              Alert.alert("Deleted", "Staff data successfully remove ho gaya.");
              fetchHRData();
            } catch (e) {
              Alert.alert("Error", "Delete action process nahi ho paya.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // 🔥 3. EDIT STATUS CHANGES
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      await updateDoc(doc(db, "users", selectedStaff.id), {
        status: editStatus,
        docStatus: editDocStatus,
      });
      setIsEditModalOpen(false);
      fetchHRData();
    } catch (e) {
      Alert.alert("Error", "Update save nahi ho saka.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002D62" />

      {/* Header Panel */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            SPC WORKFORCE & OPERATION MANAGER
          </Text>
          <Text style={styles.headerSubtitle}>Real-Time Control Room</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={styles.addStaffBtn}
            onPress={() => setIsAddModalOpen(true)}
          >
            <Ionicons name="person-add" size={16} color="#002D62" />
            <Text style={styles.addStaffBtnTxt}>ADD WORKER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchHRData}>
            <Ionicons name="refresh" size={18} color="#D4AF37" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs Navigation */}
      <View style={styles.tabBar}>
        {[
          { id: "staff", label: "Profiles & Skills", icon: "people" },
          { id: "metrics", label: "Work Tracker", icon: "analytics" },
          { id: "payouts", label: "Salary & Comm.", icon: "wallet" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabItem,
              activeTab === tab.id && styles.activeTabItem,
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? "#002D62" : "#94A3B8"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Switch Content Layout */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 15 }}>
        {/* TAB 1: MASTER PROFILES WITH RELEVANT PARAMETERS & DELETE CONTROLS */}
        {activeTab === "staff" &&
          staffList.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.skillBadge}>🛠️ Skill: {item.skill}</Text>
                  <Text style={styles.cardDetail}>
                    📍 Region: {item.location}
                  </Text>
                  <Text style={styles.cardDetail}>📞 Phone: {item.phone}</Text>
                  <Text style={styles.cardDetail}>✉️ Email: {item.email}</Text>
                </View>
                <View style={{ gap: 8, alignItems: "flex-end" }}>
                  <TouchableOpacity
                    style={styles.editIconBtn}
                    onPress={() => {
                      setSelectedStaff(item);
                      setEditStatus(item.status);
                      setEditDocStatus(item.docStatus);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#002D62" />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: "#002D62",
                      }}
                    >
                      EDIT
                    </Text>
                  </TouchableOpacity>

                  {/* 🗑️ DELETE WORKER ACTION BUTTON */}
                  <TouchableOpacity
                    style={styles.deleteIconBtn}
                    onPress={() => handleDeleteStaff(item.id, item.name)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: "#EF4444",
                      }}
                    >
                      REMOVE
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

        {/* TAB 2: WORK PERFORMANCE TRACKER (KITNA KAAM KIYA COUNTER) */}
        {activeTab === "metrics" &&
          staffList.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardDetail}>
                    Skill Stack: {item.skill}
                  </Text>
                </View>
                <View style={styles.workCounterBox}>
                  <Text style={styles.counterNum}>{item.totalWorkDone}</Text>
                  <Text style={styles.counterLabel}>Jobs Done</Text>
                </View>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(item.totalWorkDone * 5, 100)}%` },
                  ]}
                />
              </View>
            </View>
          ))}

        {/* TAB 3: SALARY & COMMISSION STRUCTURING CONTROL */}
        {activeTab === "payouts" &&
          staffList.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardDetail}>
                    Base Salary:{" "}
                    <Text style={{ fontWeight: "bold", color: "#1E293B" }}>
                      ₹{item.salary}/mo
                    </Text>
                  </Text>
                  <Text style={styles.cardDetail}>
                    Commission Layer:{" "}
                    <Text style={{ fontWeight: "bold", color: "#D4AF37" }}>
                      {item.commission}% Per Job
                    </Text>
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 10, color: "#94A3B8" }}>
                    Current Ledger Wallet
                  </Text>
                  <Text style={styles.moneyValue}>
                    ₹{Number(item.payoutDue).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
      </ScrollView>

      {/* ➕ MODAL: ADVANCED ADD NEW WORKER CONSOLE */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={{
              justifyContent: "center",
              paddingVertical: 40,
            }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Register New Workforce Profile
              </Text>

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="E.g. Ramesh Kumar"
              />

              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="numeric"
                placeholder="E.g. 91234xxxxx"
              />

              <Text style={styles.inputLabel}>Skill Designation *</Text>
              <TextInput
                style={styles.input}
                value={skill}
                onChangeText={setSkill}
                placeholder="E.g. AC Repair Technician / Electrician"
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Base Salary (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    value={salary}
                    onChangeText={setSalary}
                    keyboardType="numeric"
                    placeholder="15000"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Commission (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={commission}
                    onChangeText={setCommission}
                    keyboardType="numeric"
                    placeholder="5"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Operational Location Area *</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="E.g. Kankarbagh, Patna"
              />

              <Text style={styles.inputLabel}>Email ID (Optional)</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="ramesh@spc.com"
              />

              <Text style={styles.inputLabel}>Home Address Details</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={address}
                onChangeText={setAddress}
                multiline
                placeholder="Enter complete full address details"
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#64748B" }]}
                  onPress={() => setIsAddModalOpen(false)}
                >
                  <Text style={styles.modalBtnTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#002D62" }]}
                  onPress={handleAddNewStaff}
                >
                  <Text style={styles.modalBtnTxt}>Save To Database</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* EDIT MODAL PANEL */}
      <Modal visible={isEditModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modify Access Control</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#64748B" }]}
                onPress={() => setIsEditModalOpen(false)}
              >
                <Text style={styles.modalBtnTxt}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#002D62" }]}
                onPress={handleSaveChanges}
              >
                <Text style={styles.modalBtnTxt}>Apply Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#002D62",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: "#D4AF37",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  headerSubtitle: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  refreshBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 8,
    borderRadius: 10,
    justifyContent: "center",
  },
  addStaffBtn: {
    backgroundColor: "#D4AF37",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 36,
  },
  addStaffBtnTxt: { color: "#002D62", fontSize: 11, fontWeight: "bold" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 15,
    padding: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 2,
  },
  activeTabItem: { backgroundColor: "#F0F4F8" },
  tabText: { fontSize: 9, fontWeight: "bold", color: "#94A3B8" },
  activeTabText: { color: "#002D62" },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#1E293B" },
  skillBadge: {
    fontSize: 12,
    color: "#002D62",
    backgroundColor: "#EFF6FF",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    fontWeight: "600",
  },
  cardDetail: { fontSize: 12, color: "#64748B", marginTop: 3 },
  editIconBtn: {
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  deleteIconBtn: {
    backgroundColor: "#FEE2E2",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  workCounterBox: {
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#CCFBF1",
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    minWidth: 70,
  },
  counterNum: { fontSize: 20, fontWeight: "bold", color: "#0D9488" },
  counterLabel: { fontSize: 10, color: "#14B8A6", fontWeight: "bold" },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: "#10B981" },
  moneyValue: { fontSize: 16, fontWeight: "bold", color: "#10B981" },

  // Form CSS Layouts
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: { backgroundColor: "#FFF", padding: 20, borderRadius: 24 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#002D62",
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#F1F5F9",
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
    color: "#1E293B",
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  modalBtnTxt: { color: "#FFF", fontWeight: "bold", fontSize: 13 },
});

// @ts-nocheck
import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../config/firebase";

export default function BranchesDashboard() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Live Sync Branches data from Firestore
  useEffect(() => {
    const branchesRef = collection(db, "branches");
    const q = query(branchesRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedBranches = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBranches(fetchedBranches);
        setLoading(false);
      },
      (err) => {
        console.error("Branches Fetch Error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Toggle Branch Status (Active / Suspended)
  const toggleBranchStatus = async (branchId, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const docRef = doc(db, "branches", branchId);
      await updateDoc(docRef, { status: nextStatus });
      Alert.alert(
        "Status Updated",
        `Branch ko ${nextStatus} status par set kar diya gaya hai.`,
      );
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating branch status:", error);
      Alert.alert("Error", "Branch status badalne me dikkat aayi.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>
          SPC Branches Sync Ho Rahi Hain...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏢 Franchise & Branch Network</Text>
        <Text style={styles.headerSub}>
          Allotted SPC branches, unki location aur partner controls
        </Text>
      </View>

      {/* Branch Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{branches.length}</Text>
          <Text style={styles.statLabel}>Total Branches</Text>
        </View>
        <View style={[styles.statBox, { borderColor: "#4CAF50" }]}>
          <Text style={[styles.statNum, { color: "#4CAF50" }]}>
            {branches.filter((b) => b.status === "active").length}
          </Text>
          <Text style={[styles.statLabel, { color: "#4CAF50" }]}>
            Active Partner Hubs
          </Text>
        </View>
      </View>

      {/* Branches List */}
      <FlatList
        data={branches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Abhi tak koi branch network create nahi kiya gaya hai.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.branchCard}
            onPress={() => {
              setSelectedBranch(item);
              setModalVisible(true);
            }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.branchNameText}>
                📍 {item.branchName || "Unnamed Branch"}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === "active" ? "#1e4620" : "#5c1d1d",
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {(item.status || "Pending").toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.partnerText}>
              Franchise Owner: {item.ownerName || "N/A"}
            </Text>
            <Text style={styles.partnerText}>
              Location: {item.location || "Patna"}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={styles.timeText}>ID: {item.id}</Text>
              <Text style={styles.phoneText}>
                📞 {item.phone || "No Contact"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 🏛️ Branch Detail / Administration Modal */}
      {selectedBranch && (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Branch Control Panel</Text>
              <Text style={styles.modalSub}>{selectedBranch.branchName}</Text>

              <ScrollView style={styles.detailsBox}>
                <Text style={styles.detailLabel}>Franchise Owner:</Text>
                <Text style={styles.detailValue}>
                  {selectedBranch.ownerName}
                </Text>

                <Text style={styles.detailLabel}>Primary Contact:</Text>
                <Text style={styles.detailValue}>{selectedBranch.phone}</Text>

                <Text style={styles.detailLabel}>Operational Territory:</Text>
                <Text style={styles.detailValue}>
                  {selectedBranch.location}
                </Text>

                <Text style={styles.detailLabel}>
                  Authorized Branch Capabilities:
                </Text>
                <Text style={styles.detailValue}>
                  {selectedBranch.allocatedServices
                    ? selectedBranch.allocatedServices.join(", ").toUpperCase()
                    : "Cyber Services & Home Repairs Enabled"}
                </Text>
              </ScrollView>

              {/* Status Management Action Button */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor:
                      selectedBranch.status === "active"
                        ? "#F44336"
                        : "#4CAF50",
                  },
                ]}
                onPress={() =>
                  toggleBranchStatus(selectedBranch.id, selectedBranch.status)
                }
              >
                <Text style={styles.actionBtnText}>
                  {selectedBranch.status === "active"
                    ? "Block / Suspend Branch"
                    : "Activate Branch Portal"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Close Window</Text>
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
  headerSub: { color: "#888", fontSize: 12, marginTop: 4, lineHeight: 16 },
  statsRow: { flexDirection: "row", padding: 16, gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: "#002140",
    padding: 16,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#1f3a52",
    alignItems: "center",
  },
  statNum: { fontSize: 24, fontWeight: "bold", color: "#D4AF37" },
  statLabel: { fontSize: 11, marginTop: 4, color: "#aaa", fontWeight: "500" },
  listContainer: { padding: 16 },
  branchCard: {
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
    marginBottom: 8,
  },
  branchNameText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  partnerText: { color: "#ccc", fontSize: 13, marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    borderTopWidth: 0.5,
    borderColor: "#1f3a52",
    paddingTop: 8,
  },
  timeText: { color: "#555", fontSize: 11 },
  phoneText: { color: "#D4AF37", fontSize: 13, fontWeight: "500" },
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
  modalSub: { color: "#888", fontSize: 12, marginTop: 2, marginBottom: 16 },
  detailsBox: { marginBottom: 16 },
  detailLabel: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 10,
  },
  detailValue: { color: "#fff", fontSize: 14, marginTop: 2, lineHeight: 20 },
  actionButton: {
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 10,
  },
  actionBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  closeButton: {
    backgroundColor: "#002140",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#666",
  },
  closeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});

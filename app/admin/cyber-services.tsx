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

export default function CyberServicesDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Live Sync Cyber Services Orders from Firestore
  useEffect(() => {
    const cyberRef = collection(db, "cyber_applications");
    const q = query(cyberRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedApps = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setApplications(fetchedApps);
        setLoading(false);
      },
      (err) => {
        console.error("Cyber Services Fetch Error:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Update Application Status (e.g., Pending -> Submitted)
  const updateStatus = async (appId, newStatus) => {
    try {
      const docRef = doc(db, "cyber_applications", appId);
      await updateDoc(docRef, { status: newStatus });
      Alert.alert(
        "Success",
        `Status badal kar ${newStatus} kar diya gaya hai.`,
      );
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Status update nahi ho paya.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>
          Cyber Portal Applications Sync Ho Rahi Hain...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🖥️ Cyber Services Portal</Text>
        <Text style={styles.headerSub}>
          Online Form Filling, Government Schemes aur ID Verification Requests
        </Text>
      </View>

      {/* Cyber Statistics Counter */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>
            {applications.filter((a) => a.status === "pending").length}
          </Text>
          <Text style={(styles.statLabel, { color: "#FF9800" })}>
            Pending Forms
          </Text>
        </View>
        <View style={[styles.statBox, { borderColor: "#4CAF50" }]}>
          <Text style={[styles.statNum, { color: "#4CAF50" }]}>
            {applications.filter((a) => a.status === "submitted").length}
          </Text>
          <Text style={(styles.statLabel, { color: "#4CAF50" })}>
            Completed Forms
          </Text>
        </View>
      </View>

      {/* Applications List */}
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Abhi tak koi cyber service request nahi aayi hai.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.appCard}
            onPress={() => {
              setSelectedApp(item);
              setModalVisible(true);
            }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.formNameText}>
                📝 {item.formName || "General Form filling"}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === "submitted"
                        ? "#1e4620"
                        : item.status === "rejected"
                          ? "#5c1d1d"
                          : "#5c3c00",
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {(item.status || "Pending").toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.clientText}>
              Applicant: {item.applicantName || "Unknown"}
            </Text>
            <Text style={styles.clientText}>
              Phone: {item.customerPhone || "N/A"}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={styles.timeText}>
                {item.timestamp?.toDate
                  ? item.timestamp.toDate().toLocaleDateString()
                  : "Today"}
              </Text>
              <Text style={styles.priceText}>₹{item.serviceCharge || "0"}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 📑 Detail View & Action Modal */}
      {selectedApp && (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Application Details</Text>
              <Text style={styles.modalSub}>ID: {selectedApp.id}</Text>

              <ScrollView style={styles.detailsBox}>
                <Text style={styles.detailLabel}>Form Type:</Text>
                <Text style={styles.detailValue}>{selectedApp.formName}</Text>

                <Text style={styles.detailLabel}>Applicant Name:</Text>
                <Text style={styles.detailValue}>
                  {selectedApp.applicantName}
                </Text>

                <Text style={styles.detailLabel}>Contact Number:</Text>
                <Text style={styles.detailValue}>
                  {selectedApp.customerPhone}
                </Text>

                <Text style={styles.detailLabel}>
                  Identity / Document Details:
                </Text>
                <Text style={styles.detailValue}>
                  {selectedApp.identityDocType
                    ? `${selectedApp.identityDocType} Submitted`
                    : "Documents uploaded on portal"}
                </Text>

                <Text style={styles.detailLabel}>Additional Instructions:</Text>
                <Text
                  style={
                    (styles.detailValue, { color: "#bbb", fontStyle: "italic" })
                  }
                >
                  {selectedApp.notes ||
                    "No extra instructions provided by customer."}
                </Text>
              </ScrollView>

              {/* Status Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
                  onPress={() => updateStatus(selectedApp.id, "submitted")}
                >
                  <Text style={styles.actionBtnText}>Mark Submitted</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#F44336" }]}
                  onPress={() => updateStatus(selectedApp.id, "rejected")}
                >
                  <Text style={styles.actionBtnText}>Reject Form</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Close Panel</Text>
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
  statNum: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 11, marginTop: 4, fontWeight: "bold" },
  listContainer: { padding: 16 },
  appCard: {
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
  formNameText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  clientText: { color: "#ccc", fontSize: 13, marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    borderTopWidth: 0.5,
    borderColor: "#1f3a52",
    paddingTop: 8,
  },
  timeText: { color: "#666", fontSize: 12 },
  priceText: { color: "#D4AF37", fontSize: 14, fontWeight: "bold" },
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
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  actionButton: { flex: 1, padding: 12, borderRadius: 6, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
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

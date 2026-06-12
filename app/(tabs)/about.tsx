// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase"; // Aapke firebase config ka sahi path

export default function AboutScreen() {
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Real Branches from Firestore Database
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "branches"));
        const branchList = [];
        querySnapshot.forEach((doc) => {
          branchList.push({ id: doc.id, ...doc.data() });
        });
        setBranches(branchList);
      } catch (error) {
        console.log("Branch fetch error: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // Support & Social Links Functions
  const handleCallSupport = () => {
    Linking.openURL("tel:+919876543210").catch(() =>
      Alert.alert("Error", "Call nahi lagaya ja saka."),
    );
  };

  const openSocialLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Link open nahi kiya ja saka."),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002D62" />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SPC Company Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Brand Logo & Introduction */}
        <View style={styles.logoSection}>
          <View style={styles.logoPlaceholder}>
            <Ionicons name="business" size={45} color="#D4AF37" />
          </View>
          <Text style={styles.brandName}>Service Provider Center (SPC)</Text>
          <Text style={styles.tagline}>
            Patna's Leading Home Repair & Cyber Services Network
          </Text>
        </View>

        {/* 🌟 2. Trust Shield: 3-Month Guarantee */}
        <View style={styles.guaranteeCard}>
          <Ionicons name="ribbon" size={30} color="#002D62" />
          <View style={styles.guaranteeTextContainer}>
            <Text style={styles.guaranteeTitle}>
              3 MAHINE KI KAAM KI ZIMMEDARI
            </Text>
            <Text style={styles.guaranteeDesc}>
              Hum hawa me baat nahi karte! SPC ke har mechanical repair,
              plumbing, aur wiring par poore 3 mahine ki full warranty milti
              hai.
            </Text>
          </View>
        </View>

        {/* 🏢 3. Company Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Hamare Baare Mein</Text>
          <Text style={styles.paraText}>
            Service Provider Center (SPC) ek aisi vyavastha hai jo Bihar ke
            logon ko unke ghar par hi saari aam aur jaroori suvidhayein deti
            hai. Hamara maqsad transparent pricing, background-verified staff,
            aur on-time delivery ke sath Patna ke har ghar ka bharosa banna hai.
          </Text>
        </View>

        {/* 🤝 4. Help & Support Desk */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Help & Support Center</Text>
          <Text style={styles.paraText2}>
            Kya aapko kisi service ke baare me poochna hai? Ya aapko app me koi
            dikkat aa rahi hai? Hamari team se turant baat karein:
          </Text>

          <View style={styles.supportRow}>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={handleCallSupport}
            >
              <Ionicons name="call" size={18} color="#FFF" />
              <Text style={styles.btnText}>Direct Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={() => openSocialLink("https://wa.me/919876543210")}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
              <Text style={styles.btnText}>WhatsApp Chat</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.ticketBtn}
            onPress={() => router.push("/orders")}
          >
            <Ionicons
              name="chatbox-ellipses-outline"
              size={18}
              color="#002D62"
            />
            <Text style={styles.ticketBtnText}>
              Raise a Service Query / Complaint
            </Text>
          </TouchableOpacity>
        </View>

        {/* 📍 5. Dynamic Company Branches Section */}
        <Text style={styles.sectionTitleOuter}>
          🏢 Our Branches & Locations (Patna Area)
        </Text>

        {loading ? (
          <ActivityIndicator
            size="small"
            color="#002D62"
            style={{ marginVertical: 15 }}
          />
        ) : branches.length === 0 ? (
          <View style={styles.emptyBranchBox}>
            <Ionicons name="location-outline" size={24} color="#94A3B8" />
            <Text style={styles.emptyBranchText}>
              Filhal koi branch active nahi hai.
            </Text>
          </View>
        ) : (
          branches.map((branch) => (
            <View key={branch.id} style={styles.branchCard}>
              <View style={styles.branchHeader}>
                <Text style={styles.branchName}>
                  {branch.name || "SPC Branch"}
                </Text>
                <View style={styles.areaBadge}>
                  <Text style={styles.areaBadgeText}>
                    {branch.area || "Patna"}
                  </Text>
                </View>
              </View>
              <Text style={styles.branchDetail}>
                <Text style={styles.boldLabel}>📍 Landmark:</Text>{" "}
                {branch.landmark || "Not specified"}
              </Text>
              <Text style={styles.branchDetail}>
                <Text style={styles.boldLabel}>⏰ Timings:</Text>{" "}
                {branch.timing || "9 AM - 8 PM"}
              </Text>
            </View>
          ))
        )}

        {/* 🌐 6. Connect On Social Media Section */}
        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>Connect With Us</Text>
          <View style={styles.socialIconsRow}>
            {/* Facebook */}
            <TouchableOpacity
              style={[styles.socialIconCircle, { backgroundColor: "#1877F2" }]}
              onPress={() => openSocialLink("https://facebook.com/yourpage")}
            >
              <Ionicons name="logo-facebook" size={22} color="#FFF" />
            </TouchableOpacity>

            {/* Instagram */}
            <TouchableOpacity
              style={[styles.socialIconCircle, { backgroundColor: "#E1306C" }]}
              onPress={() =>
                openSocialLink("https://instagram.com/yourprofile")
              }
            >
              <Ionicons name="logo-instagram" size={22} color="#FFF" />
            </TouchableOpacity>

            {/* WhatsApp Channel/Community */}
            <TouchableOpacity
              style={[styles.socialIconCircle, { backgroundColor: "#25D366" }]}
              onPress={() => openSocialLink("https://wa.me/919876543210")}
            >
              <Ionicons name="logo-whatsapp" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Designed & Managed in Patna, Bihar 🇮🇳
          </Text>
          <Text style={styles.versionText}>
            SPC Corporate App • Version 1.2.5
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#002D62",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  backButton: { padding: 5 },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  scrollContent: { padding: 20 },
  logoSection: { alignItems: "center", marginBottom: 20 },
  logoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#002D62",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "center",
  },
  tagline: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 10,
  },

  guaranteeCard: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  guaranteeTextContainer: { flex: 1 },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#002D62",
    letterSpacing: 0.3,
  },
  guaranteeDesc: {
    fontSize: 11,
    color: "#475569",
    marginTop: 3,
    lineHeight: 16,
  },

  section: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#002D62",
    marginBottom: 10,
  },
  sectionTitleOuter: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#002D62",
    marginTop: 5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  paraText: { fontSize: 13, color: "#475569", lineHeight: 20 },
  paraText2: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 12,
  },

  supportRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  callBtn: {
    flex: 1,
    backgroundColor: "#002D62",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  whatsappBtn: {
    flex: 1,
    backgroundColor: "#25D366",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: { color: "#FFF", fontSize: 13, fontWeight: "bold" },
  ticketBtn: {
    borderWidth: 1,
    borderColor: "#002D62",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F0F4F8",
  },
  ticketBtnText: { color: "#002D62", fontSize: 12, fontWeight: "bold" },

  // Empty State
  emptyBranchBox: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  emptyBranchText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 6,
    fontWeight: "500",
  },

  // Branch Cards
  branchCard: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  branchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  branchName: { fontSize: 14, fontWeight: "bold", color: "#1E293B" },
  areaBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  areaBadgeText: { fontSize: 10, color: "#002D62", fontWeight: "bold" },
  branchDetail: { fontSize: 12, color: "#475569", marginTop: 2 },
  boldLabel: { fontWeight: "600", color: "#1E293B" },

  // Social Media Section Styles
  socialSection: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  socialTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },
  socialIconsRow: { flexDirection: "row", gap: 20, justifyContent: "center" },
  socialIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  footer: { alignItems: "center", marginTop: 25, marginBottom: 15 },
  footerText: { fontSize: 11, color: "#94A3B8", fontWeight: "500" },
  versionText: { fontSize: 10, color: "#CBD5E1", marginTop: 2 },
});

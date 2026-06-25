// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../config/firebase";

const { width } = Dimensions.get("window");

// COLORS - Blue and Gold Premium Theme
const COLORS = {
  primary: "#001529", // Deep Navy
  cardBg: "#002140", // Lighter Navy
  gold: "#D4AF37", // Premium Gold
  white: "#FFFFFF",
  danger: "#922B21", // Soft Red
};

export default function AdminMenu() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // ⚠️ SECURITY: Protected Admin UID
  const ADMIN_UID = "sIlwYSIr89To94lAnS12dXtCadb2";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      let isValidUser = user && user.uid === ADMIN_UID;

      // WEB COMPATIBILITY LAYER: Refresh security verification
      if (!isValidUser && Platform.OS === "web") {
        const localToken = localStorage.getItem("adminToken");
        if (localToken === ADMIN_UID) {
          isValidUser = true;
        }
      }

      if (isValidUser) {
        setIsAuth(true);
        setLoading(false);
      } else {
        setIsAuth(false);
        setLoading(false);
        setTimeout(() => {
          router.replace("/admin/login");
        }, 500);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // MENU ITEMS - All 12 Management Portals (Including HR Dashboard)
  const menuItems = [
    {
      id: 1,
      name: "Orders",
      icon: "cart-outline",
      path: "/admin/orders",
      color: COLORS.gold,
    },
    {
      id: 2,
      name: "Services",
      icon: "construct-outline",
      path: "/admin/services",
      color: "#28A745",
    },
    {
      id: 3,
      name: "Cyber Portal",
      icon: "desktop-outline",
      path: "/admin/cyber-services",
      color: "#00FFFF",
    },
    {
      id: 4,
      name: "AI Inbound",
      icon: "mic-outline",
      path: "/admin/ai-calls",
      color: "#FF1493",
    },
    {
      id: 5,
      name: "Branches",
      icon: "git-branch-outline",
      path: "/admin/branches",
      color: "#ADFF2F",
    },
    {
      id: 6,
      name: "HR Head",
      icon: "shield-checkmark-outline",
      path: "/admin/hr-dashboard",
      color: "#FFD700", // Gold Accent for HR Management
    },
    {
      id: 7,
      name: "Banners",
      icon: "images-outline",
      path: "/admin/banners",
      color: "#007BFF",
    },
    {
      id: 8,
      name: "Workers",
      icon: "people-outline",
      path: "/admin/workers",
      color: "#FF8C00",
    },
    {
      id: 9,
      name: "Wholesalers",
      icon: "business-outline",
      path: "/admin/wholesalers",
      color: "#9B59B6",
    },
    {
      id: 10,
      name: "User Logs",
      icon: "person-outline",
      path: "/admin/users",
      color: "#17A2B8",
    },
    {
      id: 11,
      name: "Revenue",
      icon: "bar-chart-outline",
      path: "/admin/revenue",
      color: "#E83E8C",
    },
    {
      id: 12,
      name: "Settings",
      icon: "settings-outline",
      path: "/admin/settings",
      color: "#5D6D7E",
    },
  ];

  const handleLogout = async () => {
    const logoutAction = async () => {
      try {
        // Clear Web Token session completely
        if (Platform.OS === "web") {
          localStorage.removeItem("adminToken");
        }
        await signOut(auth);
        router.replace("/admin/login");
      } catch (error) {
        console.error("Logout Error:", error);
      }
    };

    if (Platform.OS === "web") {
      if (confirm("System lock karein?")) logoutAction();
    } else {
      Alert.alert("Security Check", "Lock Command Center?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: logoutAction, style: "destructive" },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loaderText}>SECURE AUTHENTICATION...</Text>
      </View>
    );
  }

  if (!isAuth) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.welcomeText}>System Administrator</Text>
          <Text style={styles.subText}>PATNA OPERATIONS CONTROL v2.0</Text>
        </View>

        {/* Dashboard Grid */}
        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(item.path)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: item.color + "15" },
                ]}
              >
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={styles.cardLabel}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* System Lock Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="lock-closed" size={20} color="#fff" />
          <Text style={styles.logoutText}>CLOSE COMMAND CENTER</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>© 2026 SPC Platform • Patna Hub</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  loaderText: {
    color: COLORS.gold,
    marginTop: 15,
    letterSpacing: 2,
    fontSize: 12,
  },
  scrollContent: { padding: 25 },
  headerSection: { marginBottom: 35 },
  welcomeText: { color: COLORS.white, fontSize: 28, fontWeight: "bold" },
  subText: {
    color: COLORS.gold,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: COLORS.cardBg,
    width: Platform.OS === "web" ? "23%" : (width - 65) / 2,
    height: 140,
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#112240",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  logoutBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.danger,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 10,
    letterSpacing: 1,
  },
  footerText: {
    textAlign: "center",
    color: "#1B2C3D",
    marginTop: 40,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

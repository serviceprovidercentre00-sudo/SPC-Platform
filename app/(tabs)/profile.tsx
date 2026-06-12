// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Core Editable States (Image URL input state removed from UI)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profilePic, setProfilePic] = useState("");

  // Aapka original real database field state (Jo sahi reward dikha raha tha)
  const [walletBalance, setWalletBalance] = useState(0);

  // 💳 Aapki Personal UPI ID jahan customer ka real paisa direct aayega
  const MY_UPI_ID = "rajeevranjankumar76098@oksbi";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (curr) => {
      if (curr) {
        setUser(curr);
        try {
          const userDoc = await getDoc(doc(db, "users", curr.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setName(data.displayName || data.name || "");
            setPhone(data.phone || curr.phoneNumber || "");
            setAddress(data.address || "");
            setProfilePic(data.profilePic || data.avatar || "");

            // 🔥 Aapka original fetching logic (Reward balance absolute fix)
            setWalletBalance(data.walletBalance || data.wallet || 0);

            setIsEditing(!(data.displayName || data.name));
          } else {
            setPhone(curr.phoneNumber || "");
            setIsEditing(true);
          }
        } catch (err) {
          console.error("Firestore Error:", err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // GPS Auto location logic block
  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Location settings access allow karein.",
      );
      return;
    }

    setUpdating(true);
    try {
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;

      if (Platform.OS === "web") {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        );
        const data = await response.json();
        if (data.display_name) setAddress(data.display_name);
        else
          setAddress(
            `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`,
          );
      } else {
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (reverseGeocode.length > 0) {
          let item = reverseGeocode[0];
          setAddress(
            `${item.name || ""}, ${item.street || ""}, ${item.city || "Patna"}`,
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", "Location fetch nahi ho saki.");
    } finally {
      setUpdating(false);
    }
  };

  // Profile data transaction handler to firestore
  const handleUpdateProfile = async () => {
    if (!name) {
      Alert.alert("Required", "Full Name field fill karna zaroori hai.");
      return;
    }
    setUpdating(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: name,
          phone: phone,
          address: address,
          profilePic: profilePic, // Puraani save value bani rahegi
          email: user.email || "",
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      setIsEditing(false);
      Alert.alert("Success 🎉", "Aapki details safe aur update ho gayi hain.");
    } catch (error) {
      Alert.alert("Error", "Database profile link error.");
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 DIRECT ONLINE PAYMENT DEEP-LINKING LOGIC
  const handleDirectOnlinePayment = () => {
    const testAmount = "100";
    const businessName = "SPC Service Provider Center";
    const upiUrl = `upi://pay?pa=${MY_UPI_ID}&pn=${encodeURIComponent(businessName)}&am=${testAmount}&cu=INR`;

    Linking.canOpenURL(upiUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(upiUrl);
        } else {
          Alert.alert(
            "UPI Application Missing",
            `Aapke device me koi UPI app nahi mila. Kripya is ID par manually transfer karein:\n\nUPI ID: ${MY_UPI_ID}\nAmount: ₹${testAmount}`,
          );
        }
      })
      .catch(() => {
        Alert.alert("Error", "Payment interface load nahi ho saka.");
      });
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await signOut(auth);
        setUser(null);
        if (Platform.OS === "web") {
          window.location.href = "/auth";
        } else {
          router.replace("/auth");
        }
      } catch (e) {
        Alert.alert("Error", "Logout process incomplete.");
      }
    };

    if (Platform.OS === "web") {
      if (confirm("Kya aap logout karna chahte hain?")) performLogout();
    } else {
      Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
        { text: "Nahi", style: "cancel" },
        { text: "Haan", onPress: performLogout },
      ]);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#002D62" />
      </View>
    );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContent}>
          <Ionicons name="person-circle" size={100} color="#002D62" />
          <Text style={styles.guestTitle}>Account Session</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/auth")}
          >
            <Text style={styles.primaryBtnText}>LOGIN / SIGNUP VIA OTP ➔</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002D62" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Dynamic Header Frame */}
        <View style={styles.headerCard}>
          <View style={styles.avatarWrapper}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraIconBadge}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="camera" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userNameText}>{name || "SPC Customer"}</Text>
          <Text style={styles.userEmailText}>
            {user.email ||
              user.phoneNumber ||
              phone ||
              "Authentication Confirmed"}
          </Text>

          <TouchableOpacity
            style={styles.editToggle}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={styles.editToggleText}>
              {isEditing ? "View Mode" : "Edit Profile Details"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🛠️ Sahi Wallet Card: ADD CASH hatakar "PAY ONLINE" UPI trigger lagaya */}
        <View style={styles.walletCardRow}>
          <View style={styles.walletLeftColumn}>
            <Text style={styles.walletMiniTitle}>SPC SECURE WALLET</Text>
            <Text style={styles.walletMoneyText}>
              ₹{walletBalance.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addMoneyClickBtn}
            onPress={handleDirectOnlinePayment}
          >
            <Ionicons name="phone-portrait-outline" size={16} color="#002D62" />
            <Text style={styles.addMoneyText}>PAY ONLINE</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Input Matrix Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>PERSONAL DETAILS MANAGEMENT</Text>

          {/* 🛠️ Image URL field ko is loop list se permanently hata diya hai */}
          {[
            {
              label: "Your Full Name",
              value: name,
              setter: setName,
              icon: "person-outline",
              placeholder: "Enter account holder name",
            },
            {
              label: "Phone Number Contact",
              value: phone,
              setter: setPhone,
              icon: "call-outline",
              type: "numeric",
              placeholder: "Enter secondary active contact number",
            },
          ].map((item, index) => (
            <View key={index} style={styles.inputCard}>
              <Ionicons
                name={item.icon}
                size={20}
                color="#002D62"
                style={styles.inputIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{item.label}</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={item.value}
                    onChangeText={item.setter}
                    placeholder={item.placeholder}
                    placeholderTextColor="#94A3B8"
                    keyboardType={item.type || "default"}
                    outlineStyle="none"
                  />
                ) : (
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {item.value || "Field empty / Not configure"}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {/* Patna Local Area Address Component Layout */}
          <View style={styles.inputCard}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#002D62"
              style={styles.inputIcon}
            />
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.label}>
                  Service Address (Patna Region Only)
                </Text>
                {isEditing && (
                  <TouchableOpacity onPress={getCurrentLocation}>
                    <Text style={styles.autoFillBtnTxt}>GPS AUTO-FILL</Text>
                  </TouchableOpacity>
                )}
              </View>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { minHeight: 50 }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter house details / sector coordinates locality"
                  placeholderTextColor="#94A3B8"
                  multiline
                  outlineStyle="none"
                />
              ) : (
                <Text style={styles.detailValue}>
                  {address || "No active operational address configure"}
                </Text>
              )}
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity
              style={styles.updateBtn}
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#002D62" />
              ) : (
                <Text style={styles.updateBtnText}>SAVE MODIFIED DETAILS</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Dashboard Actions Link Rows */}
        <View style={styles.menuBox}>
          <Text
            style={[
              styles.sectionLabel,
              { paddingHorizontal: 15, paddingTop: 15, marginBottom: 5 },
            ]}
          >
            ACTIVITY TRACKER
          </Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/orders")}
          >
            <View style={styles.menuLeftBlock}>
              <Ionicons name="receipt-outline" size={22} color="#002D62" />
              <Text style={styles.menuText}>My Active Bookings / Orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                "Transactions History",
                "No active transaction records on this cluster pipeline.",
              )
            }
          >
            <View style={styles.menuLeftBlock}>
              <Ionicons name="card-outline" size={22} color="#002D62" />
              <Text style={styles.menuText}>
                Wallet Transactions Statements
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL("tel:+918409372138")}
          >
            <View style={styles.menuLeftBlock}>
              <Ionicons name="help-buoy-outline" size={22} color="#64748B" />
              <Text style={styles.menuText}>SPC Premium Support Helpdesk</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuLeftBlock}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text style={[styles.menuText, { color: "#EF4444" }]}>
                Logout Secure Account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  guestContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#002D62",
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: "#002D62",
    width: "100%",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  primaryBtnText: { color: "#FFF", fontWeight: "bold" },
  headerCard: {
    backgroundColor: "#002D62",
    padding: 30,
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  avatarWrapper: { position: "relative", marginBottom: 15 },
  avatarImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: "#D4AF37",
  },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#D4AF37",
  },
  avatarInitial: { fontSize: 34, color: "#002D62", fontWeight: "bold" },
  cameraIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 2,
    backgroundColor: "#D4AF37",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#002D62",
  },
  userNameText: { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  userEmailText: { fontSize: 13, color: "#CBD5E1", marginTop: 4 },
  editToggle: {
    marginTop: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 15,
  },
  editToggleText: { color: "#D4AF37", fontSize: 12, fontWeight: "bold" },
  walletCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#002140",
    padding: 20,
    borderRadius: 22,
    marginHorizontal: 20,
    marginTop: -20,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  walletLeftColumn: { flexDirection: "column" },
  walletMiniTitle: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  walletMoneyText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 2,
  },
  addMoneyClickBtn: {
    backgroundColor: "#D4AF37",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addMoneyText: { color: "#002D62", fontWeight: "bold", fontSize: 12 },
  formSection: { padding: 20 },
  sectionLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "900",
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" },
      android: { elevation: 3 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  inputIcon: { marginRight: 15 },
  label: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  input: { fontSize: 15, color: "#1E293B", marginTop: 5, fontWeight: "500" },
  detailValue: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "bold",
    marginTop: 5,
  },
  autoFillBtnTxt: { fontSize: 11, color: "#D4AF37", fontWeight: "bold" },
  updateBtn: {
    backgroundColor: "#D4AF37",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  updateBtnText: { color: "#002D62", fontWeight: "bold", fontSize: 15 },
  menuBox: {
    marginHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 24,
    marginBottom: 40,
    paddingBottom: 10,
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" },
      android: { elevation: 3 },
    }),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuLeftBlock: { flexDirection: "row", alignItems: "center", gap: 14 },
  menuText: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
});

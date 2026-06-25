// @ts-nocheck
import { Stack, useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebase";

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showSplash, setShowSplash] = useState(true); // 🚀 Amazon/Flipkart Style Preloader State

  // Reward Modal States
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);

  // Email/Password States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and SignUp

  const router = useRouter();

  // 🔥 1. INITIALIZATION EFFECT: Auth check & Preloader Timer 🔥
  useEffect(() => {
    // Auth State Observer
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Agar pehle se login hai toh modal ka jhanjhat nahi seedhe main screen
        router.replace("/(tabs)");
      }
      setCheckingAuth(false);
    });

    // Amazon/Flipkart style preloader timer (2.5 Seconds)
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => {
      unsubscribe();
      clearTimeout(splashTimer);
    };
  }, []);

  // 🔥 2. CORE REWARD ENGINE: Welcome bonus credit mechanism 🔥
  const syncUserToDb = async (user, isEmailLogin = false) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let welcomeGiftAmount = 0;
      let isNewUser = false;

      if (!userSnap.exists()) {
        isNewUser = true;
        welcomeGiftAmount = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
      }

      const userData = {
        uid: user.uid,
        name:
          user.displayName ||
          (isEmailLogin
            ? `SPC User (${user.email?.split("@")[0] || "User"})`
            : "SPC User"),
        email: user.email || email || "",
        phoneNumber: user.phoneNumber || "",
        photoURL:
          user.photoURL ||
          "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        role: "user",
        address: "Patna, Bihar",
        lastLogin: serverTimestamp(),
      };

      if (isNewUser) {
        userData.welcomeGift = welcomeGiftAmount;
        userData.walletBalance = welcomeGiftAmount;
        userData.createdAt = serverTimestamp();
      }

      await setDoc(userRef, userData, { merge: true });

      if (isNewUser) {
        // Boring Alert ki jagah state open karke premium modal popup display hoga
        setRewardAmount(welcomeGiftAmount);
        setShowRewardModal(true);
      } else {
        // Agar puraana user hai toh seedhe home dashboard bhej do
        router.replace("/(tabs)");
      }
    } catch (e) {
      console.error("Firestore Sync Error:", e);
    }
  };

  // ─── EMAIL & PASSWORD LOGIN / SIGNUP HANDLER ───
  const handleEmailAuth = async () => {
    if (!email || !password) {
      alert("Kripya Email aur Password dono bharein.");
      return;
    }
    if (password.length < 6) {
      alert("Password kam se kam 6 characters ka hona chahiye.");
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isSignUp) {
        // Naya Account Banane Ke Liye
        result = await createUserWithEmailAndPassword(auth, email, password);
        if (result.user) {
          await syncUserToDb(result.user, true);
        }
      } else {
        // Puraana Account Login Karne Ke Liye
        result = await signInWithEmailAndPassword(auth, email, password);
        if (result.user) {
          router.replace("/(tabs)");
        }
      }
    } catch (error) {
      console.log("Email Auth Error:", error);
      let errorMsg = "Authentication fail ho gaya.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMsg = "Galat Email ya Password darj kiya hai.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMsg = "Yeh email pehle se register hai. Login karein.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "Email format sahi nahi hai.";
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ─── GOOGLE LOGIN HANDLER ───
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await syncUserToDb(result.user, false);
      }
    } catch (error) {
      console.log("Google Login Error:", error);
      alert("Google login nahi ho paya.");
    } finally {
      setLoading(false);
    }
  };

  // 🛍️ AMAZON/FLIPKART STYLE BRAND PRELOADER DISPLAY
  if (showSplash || checkingAuth) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashLogoBox}>
          <Text style={styles.splashBrand}>SPC</Text>
          <Text style={styles.splashSubBrand}>PATNA</Text>
        </View>
        <ActivityIndicator
          size="large"
          color="#D4AF37"
          style={{ marginTop: 35 }}
        />
        <Text style={styles.splashLoadingTxt}>Loading Premium Services...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Text style={styles.brand}>SPC PATNA</Text>
            <Text style={styles.motto}>Premium Home Services</Text>
          </View>

          <Text style={styles.welcomeText}>
            {isSignUp
              ? "Create an account to claim your Welcome Reward!"
              : "Welcome back! Login via Email or Google to manage bookings."}
          </Text>

          {/* 📧 EMAIL/PASSWORD FORM CONTAINER */}
          <View style={styles.formBox}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Enter Email Address"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={styles.textInputStyle}
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Enter Password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={true}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                style={styles.textInputStyle}
                editable={!loading}
              />
            </View>

            {/* Main Action Button */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, loading && { opacity: 0.7 }]}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.actionBtnTxt}>
                  {isSignUp ? "Sign Up & Claim Reward 🎁" : "Login to Account"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Login / SignUp option */}
            <TouchableOpacity
              style={{ marginTop: 15 }}
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              <Text style={styles.toggleTxt}>
                {isSignUp
                  ? "Already have an account? Login"
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider Line */}
          <View style={styles.dividerRow}>
            <View style={styles.hairline} />
            <Text style={styles.dividerTxt}>OR</Text>
            <View style={styles.hairline} />
          </View>

          {/* 🌐 GOOGLE AUTH BUTTON COMPONENT */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading && isSignUp ? (
              <ActivityIndicator color="#002D62" />
            ) : (
              <>
                <Image
                  source={{
                    uri: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
                  }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Secure Login Powered by SPC Firebase
          </Text>
        </View>
      </ScrollView>

      {/* 🎁 PROFESSIONAL INTERACTIVE REWARD POPUP MODAL WINDOW */}
      {showRewardModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.rewardCard}>
            <Text style={styles.congratsTitle}>🎉 CONGRATULATIONS! 🎉</Text>

            <View style={styles.giftIconBox}>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/4142/4142144.png",
                }}
                style={styles.giftImage}
              />
            </View>

            <Text style={styles.rewardSubTitle}>Welcome to SPC Patna</Text>
            <Text style={styles.amountTxt}>₹{rewardAmount}</Text>

            <Text style={styles.rewardDescription}>
              Aapka sign up reward aapke account wallet balance me credit kar
              diya gaya hai.
            </Text>

            {/* Button jo user ko wallet page par bhejega */}
            <TouchableOpacity
              style={styles.walletRedirectBtn}
              onPress={() => {
                setShowRewardModal(false);
                router.replace("/(tabs)/wallet"); // 💰 Redirects straight to the wallet tab screen
              }}
            >
              <Text style={styles.walletBtnTxt}>Go to Wallet 💰</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#002D62" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 25 },
  card: {
    backgroundColor: "#FFF",
    padding: 30,
    borderRadius: 30,
    elevation: 15,
    alignItems: "center",
    width: "100%",
    maxWidth: 450,
    alignSelf: "center",
  },
  logoContainer: { marginBottom: 20 },
  brand: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#002D62",
    textAlign: "center",
  },
  motto: {
    textAlign: "center",
    color: "#D4AF37",
    fontWeight: "600",
    fontSize: 14,
  },
  welcomeText: {
    color: "#64748B",
    marginBottom: 25,
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 5,
    lineHeight: 20,
  },
  formBox: { width: "100%", alignItems: "center", marginBottom: 5 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 15,
    width: "100%",
    height: 55,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  textInputStyle: {
    flex: 1,
    height: "100%",
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "500",
    outlineStyle: "none",
  },
  primaryActionBtn: {
    backgroundColor: "#002D62",
    width: "100%",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    elevation: 2,
  },
  actionBtnTxt: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  toggleTxt: {
    color: "#002D62",
    fontWeight: "bold",
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 20,
  },
  hairline: { flex: 1, height: 1.2, backgroundColor: "#E2E8F0" },
  dividerTxt: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 15,
  },
  googleBtn: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      web: { boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" },
    }),
  },
  googleIcon: { width: 22, height: 22, marginRight: 15 },
  googleBtnText: { color: "#1E293B", fontWeight: "bold", fontSize: 16 },
  footerText: { marginTop: 25, color: "#94A3B8", fontSize: 11 },

  // ─── AMAZON/FLIPKART STYLE PRELOADER PRE-LAUNCH CODES ───
  splashContainer: {
    flex: 1,
    backgroundColor: "#002D62",
    justifyContent: "center",
    alignItems: "center",
  },
  splashLogoBox: {
    alignItems: "center",
  },
  splashBrand: {
    fontSize: 55,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 4,
  },
  splashSubBrand: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#D4AF37",
    letterSpacing: 6,
    marginTop: -5,
  },
  splashLoadingTxt: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 15,
    fontWeight: "500",
  },

  // ─── PREMIUM OVERLAY POPUP MODAL CODES ───
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 45, 98, 0.85)", // Dark Blue Blur Contrast Window
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  rewardCard: {
    backgroundColor: "#FFF",
    width: "90%",
    maxWidth: 380,
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 20 },
      web: { boxShadow: "0px 10px 30px rgba(0,0,0,0.3)" },
    }),
  },
  congratsTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#059669",
    textAlign: "center",
    marginBottom: 15,
  },
  giftIconBox: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  giftImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  rewardSubTitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  amountTxt: {
    fontSize: 48,
    fontWeight: "900",
    color: "#002D62",
    marginVertical: 10,
  },
  rewardDescription: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  walletRedirectBtn: {
    backgroundColor: "#D4AF37", // Premium Gold Color Style
    width: "100%",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  walletBtnTxt: {
    color: "#002D62",
    fontSize: 16,
    fontWeight: "bold",
  },
});

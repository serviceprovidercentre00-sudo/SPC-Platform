// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../../config/firebase";

export default function WorkerAuth() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleWorkerLogin = async () => {
    // Inputs standard trimming taaki space background mesh na karein
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const cleanPassword = password ? password.trim() : "";

    if (!cleanEmail || !cleanPassword) {
      Alert.alert("Dhyan Dein!", "Kripya email aur password dono bharein.");
      return;
    }

    setLoading(true);

    try {
      // 1. Core Sign In implementation
      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        cleanPassword,
      );
      const user = userCredential.user;

      // 2. Target checking using collection validation
      const workerDoc = await getDoc(doc(db, "workers", user.uid));

      if (workerDoc.exists()) {
        // Validation check safe passed
        Alert.alert(
          "Swagat Hai 🎉",
          `${workerDoc.data().name || "Worker"}, login safal raha!`,
        );

        // 3. Move onto worker dashboard route
        router.replace("/worker/dashboard");
      } else {
        // Agar account Firebase Auth me hai par roles restricted hai
        Alert.alert(
          "Access Denied",
          "Ye account worker collection me registered nahi hai.",
        );
        await auth.signOut();
      }
    } catch (error) {
      console.log("Login Failure Trace:", error.code, error.message);

      let errorMsg = "Login nahi ho paya. Details verify karein.";
      if (error.code === "auth/invalid-email") {
        errorMsg = "Email ka format galat hai.";
      } else if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errorMsg = "Galat Email ya Password! Sahi details dalein.";
      } else if (error.code === "auth/too-many-requests") {
        errorMsg =
          "Jyada bar galat input ke karan ye block hai, thodi der baad try karein.";
      }

      Alert.alert("Login Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="construct-outline" size={45} color="#D4AF37" />
          </View>
          <Text style={styles.title}>SPC Worker</Text>
          <Text style={styles.subtitle}>Service Provider Center Control</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Worker System Login</Text>

          {/* Email field */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#888"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Registered Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password field */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#888"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter Password"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {/* Action Trigger */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleWorkerLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#001529" />
            ) : (
              <Text style={styles.loginBtnText}>LOGIN TO DASHBOARD</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>Patna Service Operations, Bihar</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001529" },
  scrollContainer: {
    flexGrow: 1,
    justifycontent: "center",
    padding: 20,
    justifyContent: "center",
  },
  logoSection: { alignItems: "center", marginBottom: 40 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#002140",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D4AF37",
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#D4AF37",
    letterSpacing: 1,
  },
  subtitle: { fontSize: 13, color: "#aaa", marginTop: 4 },
  formCard: {
    backgroundColor: "#002140",
    padding: 25,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#003366",
  },
  formTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#001529",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#002c54",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#fff", paddingVertical: 14, fontSize: 15 },
  eyeIcon: { padding: 5 },
  loginBtn: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  loginBtnText: {
    color: "#001529",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  footerText: {
    textAlign: "center",
    color: "#666",
    fontSize: 12,
    marginTop: 30,
  },
});

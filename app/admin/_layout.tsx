// @ts-nocheck
import { Slot, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { auth } from "../../config/firebase";

export default function AdminLayout() {
  const [initializing, setInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // ⚠️ SECURITY: Protected Admin UID
  const ADMIN_UID = "sIlwYSIr89To94lAnS12dXtCadb2";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      let loggedIn = user && user.uid === ADMIN_UID;

      // Web Refresh compatibility layer check
      if (!loggedIn && Platform.OS === "web") {
        const localToken = localStorage.getItem("adminToken");
        if (localToken === ADMIN_UID) loggedIn = true;
      }

      setIsAuthenticated(loggedIn);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  // Loading Screen jab tak authentication scan verify ho raha ho
  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#001529",
        }}
      >
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const inLoginPage = segments.includes("login");

  // 🎯 LIVE PROTECTION LAYER: Agar unknown person hai aur login page par nahi hai
  if (!isAuthenticated && !inLoginPage) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#001529",
        }}
      >
        <Text
          style={{
            color: "#FF4D4F",
            fontSize: 24,
            fontWeight: "bold",
            letterSpacing: 2,
          }}
        >
          UNKNOWN
        </Text>
      </View>
    );
  }

  return <Slot />;
}

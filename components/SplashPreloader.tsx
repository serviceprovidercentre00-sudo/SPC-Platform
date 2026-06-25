// components/SplashPreloader.tsx
// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

export default function SplashPreloader({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Professional Dynamic Taglines for engagement
  const [loadingText, setLoadingText] = useState(
    "Initializing Premium Workspace...",
  );

  useEffect(() => {
    // 1. Initial Content Fade-In
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // 2. High-End Pulse Glow Effect on Logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 3. Smooth Linear Progress Bar (10 Seconds)
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 10000, // Matches your 10 seconds requirement perfectly
      useNativeDriver: false, // width depends on layouts layout layout layout layout layout
    }).start();

    // 4. Dynamic Text Rotator to keep users engaged
    const textInterval = setInterval(() => {
      setLoadingText((prev) => {
        if (prev.includes("Initializing"))
          return "Connecting with Certified Experts...";
        if (prev.includes("Experts")) return "Securing Encrypted Gateway...";
        if (prev.includes("Securing")) return "Finalizing Custom Experience...";
        return "Welcome to SPC Premium Hub...";
      });
    }, 2400);

    // 5. App Transition Trigger after 10 seconds
    const mainTimer = setTimeout(() => {
      clearInterval(textInterval);
      if (onFinish) onFinish();
    }, 10000);

    return () => {
      clearInterval(textInterval);
      clearTimeout(mainTimer);
    };
  }, []);

  // Interpolating progress value to percentage string
  const widthPercent = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.splashContainer}>
      <Animated.View style={[styles.brandWrapper, { opacity: fadeAnim }]}>
        {/* Glowing Logo Frame */}
        <Animated.View
          style={[
            styles.logoCircleContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logoImageFile}
          />
        </Animated.View>

        {/* Main Short Premium Brand Title */}
        <Text style={styles.mainBrandText}>SPC</Text>

        {/* Signature Branding Definition */}
        <Text style={styles.fullFormText}>SERVICE PROVIDER CENTRE</Text>

        <View style={styles.locationBadge}>
          <Text style={styles.locationTxt}>PATNA</Text>
        </View>
      </Animated.View>

      {/* ─── MODERN PROGRESS LOADING SECTION ─── */}
      <View style={styles.loadingControlCenter}>
        {/* Dynamic Engaged Text */}
        <Text style={styles.loadingFooterTxt}>{loadingText}</Text>

        {/* Premium Corporate Progress Track */}
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[styles.progressBarFill, { width: widthPercent }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#002D62", // Signature Rich Navy Blue
    justifyContent: "space-between", // Pushes brand to center, progress bar to bottom cleanly
    alignItems: "center",
    paddingVertical: 60,
  },
  brandWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    flex: 1, // Centers the content perfectly vertically
  },
  logoCircleContainer: {
    width: 115,
    height: 115,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
  },
  logoImageFile: {
    width: "82%",
    height: "82%",
    resizeMode: "contain",
  },
  mainBrandText: {
    fontSize: 56,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 5,
    textAlign: "center",
  },
  fullFormText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D4AF37", // Matte Premium Gold
    letterSpacing: 4,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 30,
  },
  locationBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 25,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  locationTxt: {
    color: "#E2E8F0",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 5,
  },

  // ─── BOTTOM CONTROLS STYLES ───
  loadingControlCenter: {
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingFooterTxt: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: "center",
    height: 18, // Fixed height prevents subtle text height jumps during change
  },
  progressBarTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#D4AF37", // Gold loader stream moving forward smoothly
    borderRadius: 2,
  },
});

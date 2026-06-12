// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../config/firebase"; // Apne path ke hissab se check kar lena bhai

export default function ServiceDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Params se primary details nikal rahe hain
  const { id, name, price, image, category } = params;
  const basePrice = Number(price) || 0;
  const platformCharge = 20;

  // State jisme database ke dynamic parts load honge
  const [dbParts, setDbParts] = useState([]);
  const [loadingParts, setLoadingParts] = useState(true);
  const [partsTotal, setPartsTotal] = useState(0);

  // 🔥 ACTION 1: Firebase se is specific service ka live 'parts' array nikalna
  useEffect(() => {
    if (!id) {
      setLoadingParts(false);
      return;
    }

    // Direct us service document ko target kar rahe hain jispar user ne click kiya hai
    const serviceRef = doc(db, "services", id);

    const unsubServiceDoc = onSnapshot(serviceRef, (docSnap) => {
      if (docSnap.exists()) {
        const serviceData = docSnap.data();

        // Agar database me 'parts' array hai, toh use state me set karo aur extra 'selected' flag jodo
        if (serviceData.parts && Array.isArray(serviceData.parts)) {
          const formattedParts = serviceData.parts.map((part, index) => ({
            ...part,
            // Agar database me id na ho toh index ko hi unique id bana lo selection track karne ke liye
            uniqueId: part.id || `part-${index}`,
            selected: false,
          }));
          setDbParts(formattedParts);
        } else {
          setDbParts([]);
        }
      }
      setLoadingParts(false);
    });

    return () => unsubServiceDoc();
  }, [id]);

  // Selected parts ka live total calculate karne ke liye loop
  useEffect(() => {
    const total = dbParts
      .filter((part) => part.selected)
      .reduce((sum, part) => sum + (Number(part.price) || 0), 0);
    setPartsTotal(total);
  }, [dbParts]);

  // Checkbox select/deselect handler
  const togglePartSelection = (uniqueId) => {
    setDbParts((prevParts) =>
      prevParts.map((part) =>
        part.uniqueId === uniqueId
          ? { ...part, selected: !part.selected }
          : part,
      ),
    );
  };

  const finalTotalAmount = basePrice + partsTotal + platformCharge;

  const handleDirectCheckout = () => {
    const activePartsNames = dbParts
      .filter((part) => part.selected)
      .map((part) => part.name || part.partName)
      .join(", ");

    const finalItemName = activePartsNames
      ? `${name || "Home Service"} (+ Parts: ${activePartsNames})`
      : name || "Home Service";

    router.push({
      pathname: "/checkout",
      params: {
        serviceId: id || Date.now().toString(),
        serviceName: finalItemName,
        servicePrice: basePrice,
        partsPrice: partsTotal,
        image: image || "",
        category: category || "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: name || "Service Details",
          headerTintColor: "#D4AF37",
          headerStyle: { backgroundColor: "#001529" },
        }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {image && (
          <Image
            source={{ uri: image }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.infoSection}>
          <Text style={styles.titleText}>{name || "Premium Home Service"}</Text>
          <Text style={styles.categoryBadge}>{category || "SPC Service"}</Text>
          <Text style={styles.priceHeroText}>
            Visiting / Base Rate: ₹{basePrice}
          </Text>
        </View>

        {/* Dynamic Parts Box */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>
            SELECT REQUIRED PARTS / SPARES
          </Text>
          <Text style={styles.sectionSubtitle}>
            Admin panel se upload kiye gaye genuine parts:
          </Text>

          {loadingParts ? (
            <ActivityIndicator
              size="small"
              color="#D4AF37"
              style={{ marginVertical: 15 }}
            />
          ) : dbParts.length > 0 ? (
            dbParts.map((part) => (
              <TouchableOpacity
                key={part.uniqueId}
                style={[
                  styles.partCard,
                  part.selected && styles.partCardActive,
                ]}
                onPress={() => togglePartSelection(part.uniqueId)}
              >
                <View style={styles.partInfo}>
                  <Ionicons
                    name={part.selected ? "checkbox" : "square-outline"}
                    size={20}
                    color={part.selected ? "#00cc66" : "#94A3B8"}
                  />

                  {/* 🔥 ACTION 2: Direct Admin Panel waali image load ho rahi hai */}
                  {part.image || part.imageUrl ? (
                    <Image
                      source={{ uri: part.image || part.imageUrl }}
                      style={styles.partThumbnail}
                    />
                  ) : (
                    // Fallback block agar kisi part me image missing ho
                    <View style={styles.partFallbackIconBox}>
                      <Ionicons name="build" size={16} color="#94A3B8" />
                    </View>
                  )}

                  <Text
                    style={[
                      styles.partNameText,
                      part.selected && styles.textWhite,
                    ]}
                    numberOfLines={1}
                  >
                    {part.name || part.partName}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.partPriceText,
                    part.selected && { color: "#00cc66" },
                  ]}
                >
                  ₹{part.price || 0}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noPartsText}>
              No extra parts required for this service. 👍
            </Text>
          )}
        </View>

        {/* Breakdown Receipt */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>LIVE ESTIMATION BREAKDOWN</Text>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Base Service Cost</Text>
            <Text style={styles.receiptValue}>₹{basePrice}</Text>
          </View>
          {partsTotal > 0 && (
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Spares/Parts Total</Text>
              <Text style={[styles.receiptValue, { color: "#00cc66" }]}>
                + ₹{partsTotal}
              </Text>
            </View>
          )}
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Platform Convenience Fee</Text>
            <Text style={styles.receiptValue}>₹{platformCharge}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.receiptRow}>
            <Text
              style={[
                styles.receiptLabel,
                { fontWeight: "bold", color: "#D4AF37" },
              ]}
            >
              Estimated Total
            </Text>
            <Text
              style={[styles.receiptValue, { fontSize: 16, color: "#D4AF37" }]}
            >
              ₹{finalTotalAmount}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryBookingBtn}
          onPress={handleDirectCheckout}
        >
          <Ionicons name="flash" size={18} color="#001529" />
          <Text style={styles.bookingBtnText}>BOOK NOW & PROCEED</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001529" },
  bannerImage: { width: "100%", height: 220 },
  infoSection: { padding: 20, backgroundColor: "#002140" },
  titleText: { fontSize: 22, fontWeight: "bold", color: "#FFF" },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#003366",
    color: "#D4AF37",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 8,
  },
  priceHeroText: {
    fontSize: 16,
    color: "#D4AF37",
    fontWeight: "600",
    marginTop: 12,
  },
  sectionBox: {
    backgroundColor: "#002140",
    padding: 15,
    borderRadius: 16,
    marginHorizontal: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#003366",
  },
  sectionTitle: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 4,
    marginBottom: 12,
  },
  partCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#001529",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#003366",
  },
  partCardActive: { borderColor: "#00cc66", backgroundColor: "#002547" },
  partInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },

  // Dynamic Cloudinary Admin Images styling
  partThumbnail: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#FFF",
    resizeMode: "contain",
  },
  partFallbackIconBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#003366",
    justifyContent: "center",
    alignItems: "center",
  },

  partNameText: { color: "#94A3B8", fontSize: 13, flex: 1, marginLeft: 2 },
  textWhite: { color: "#FFF", fontWeight: "500" },
  partPriceText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 10,
  },
  noPartsText: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    marginVertical: 10,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  receiptLabel: { color: "#94A3B8", fontSize: 13 },
  receiptValue: { color: "#FFF", fontWeight: "600", fontSize: 13 },
  divider: { height: 1, backgroundColor: "#003366", marginVertical: 8 },
  primaryBookingBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D4AF37",
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 15,
    marginTop: 25,
  },
  bookingBtnText: { color: "#001529", fontWeight: "bold", fontSize: 15 },
});

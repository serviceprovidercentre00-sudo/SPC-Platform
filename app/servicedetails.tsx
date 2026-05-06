// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "../context/CartContext"; // Cart Context Import kiya

export default function ServiceDetails() {
  const router = useRouter();
  const { addToCart } = useCart(); // Cart function

  // URL se data le rahe hain
  const { id, name, price, description, category, image } =
    useLocalSearchParams();

  // --- SAFE PRICE PARSER ---
  const parsePrice = (val) => {
    if (!val) return 0;
    const cleaned = String(val)
      .replace(/,/g, "")
      .replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const displayPrice = parsePrice(price);

  const handleAddToCart = () => {
    const item = {
      id: id || Date.now().toString(),
      name: name || "Unknown Service",
      price: displayPrice, // Number format mein bhej rahe hain
      image: image,
      category: category,
    };

    addToCart(item);
    Alert.alert("SPC Patna", "Service cart mein add ho gayi hai!", [
      { text: "Check Out", onPress: () => router.push("/cart") },
      { text: "More Services", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#001529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <TouchableOpacity onPress={() => router.push("/cart")}>
          <Ionicons name="cart-outline" size={24} color="#001529" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{
            uri: (image as string) || "https://via.placeholder.com/400x250",
          }}
          style={styles.image}
        />

        <View style={styles.contentContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {category || "General Service"}
            </Text>
          </View>

          <Text style={styles.title}>{name || "Service Name"}</Text>
          {/* Price display with safety */}
          <Text style={styles.price}>
            ₹{displayPrice.toLocaleString("en-IN")}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this Service</Text>
          <Text style={styles.description}>
            {description ||
              "SPC provide high-quality home repairs with a 3-month guarantee."}
          </Text>

          <View style={styles.policyCard}>
            <Ionicons name="shield-checkmark" size={24} color="#D4AF37" />
            <Text style={styles.policyText}>
              3 Mahine ki Kaam ki Zimmedari (SPC Warranty)
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookButton} onPress={handleAddToCart}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#001529" },
  image: { width: "100%", height: 250 },
  contentContainer: { padding: 20 },
  categoryBadge: {
    backgroundColor: "#f1f4f9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  categoryText: { color: "#001529", fontSize: 12, fontWeight: "600" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#001529",
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: "700",
    color: "#D4AF37",
    marginBottom: 15,
  },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 15 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#001529",
    marginBottom: 10,
  },
  description: { fontSize: 14, color: "#555", lineHeight: 22 },
  policyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdf9ea",
    padding: 15,
    borderRadius: 10,
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#f3e5ab",
  },
  policyText: {
    marginLeft: 10,
    fontSize: 13,
    color: "#001529",
    fontWeight: "500",
  },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  bookButton: {
    backgroundColor: "#001529",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  bookButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

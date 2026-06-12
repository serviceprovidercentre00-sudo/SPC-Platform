import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  primaryBlue: "#003366",
  gold: "#D4AF37",
  white: "#FFFFFF",
  lightGray: "#F5F5F5",
  borderGray: "#E0E0E0",
};

const WholesalerInventory = () => {
  // Inventory state
  const [inventory, setInventory] = useState([
    { id: "1", name: "LG AC Compressor", stock: 5, price: "₹4500" },
    { id: "2", name: "Samsung Fridge Fan Motor", stock: 12, price: "₹850" },
  ]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wholesaler Portal</Text>
        <Text style={styles.headerSubtitle}>Manage Your Spare Parts</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Items</Text>
            <Text style={styles.statValue}>{inventory.length}</Text>
          </View>
          <View
            style={[
              styles.statBox,
              { borderLeftWidth: 1, borderColor: COLORS.borderGray },
            ]}
          >
            <Text style={styles.statLabel}>Low Stock</Text>
            <Text style={[styles.statValue, { color: "red" }]}>1</Text>
          </View>
        </View>

        {/* Add Product Section */}
        <View style={styles.addSection}>
          <Text style={styles.sectionTitle}>Add New Spare Part</Text>
          <TextInput
            style={styles.input}
            placeholder="Part Name (e.g. Copper Pipe)"
            placeholderTextColor="#999"
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 10 }]}
              placeholder="Wholesale Price"
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Stock Qty"
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Add to Inventory</Text>
          </TouchableOpacity>
        </View>

        {/* Inventory List */}
        <Text style={styles.sectionTitle}>Current Inventory</Text>
        {inventory.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemStock}>In Stock: {item.stock} units</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.itemPrice}>{item.price}</Text>
              <TouchableOpacity>
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={COLORS.primaryBlue}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  header: {
    backgroundColor: COLORS.primaryBlue,
    padding: 20,
    paddingTop: 50,
    borderBottomRightRadius: 30,
  },
  headerTitle: { color: COLORS.gold, fontSize: 24, fontWeight: "bold" },
  headerSubtitle: { color: COLORS.white, fontSize: 14, opacity: 0.8 },
  content: { padding: 20 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
    elevation: 3,
  },
  statBox: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: 12, color: "#666" },
  statValue: { fontSize: 20, fontWeight: "bold", color: COLORS.primaryBlue },
  addSection: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: COLORS.primaryBlue,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    color: "#333",
  },
  row: { flexDirection: "row" },
  addButton: {
    backgroundColor: COLORS.gold,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  addButtonText: {
    color: COLORS.primaryBlue,
    fontWeight: "bold",
    fontSize: 16,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryBlue,
  },
  itemName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  itemStock: { fontSize: 13, color: "#666", marginTop: 2 },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.gold,
    marginBottom: 5,
  },
});

export default WholesalerInventory;

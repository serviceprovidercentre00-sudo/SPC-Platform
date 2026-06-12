// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebase";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const router = useRouter();
  const { clearCart } = useCart();
  const params = useLocalSearchParams();

  // Basic Input States
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showQRModal, setShowQRModal] = useState(false);

  // Dynamic Routing Fields
  const [servicePrice, setServicePrice] = useState(0);
  const [extraPartsPrice, setExtraPartsPrice] = useState(0);
  const [serviceName, setServiceName] = useState("Home Service");

  // Fixed Fees Structure
  const platformFee = 20;

  // Membership & Discounts
  const [selectedCard, setSelectedCard] = useState("Silver");
  const [cardNumber, setCardNumber] = useState("");
  const [cardDiscount, setCardDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);

  // 🔥 RESTORED GIFT WALLET STATES
  const [userGiftWallet, setUserGiftWallet] = useState(0);
  const [useWalletBalance, setUseWalletBalance] = useState(false);

  const UPI_ID = "6202379166@ptaxis";
  const SHOP_LOGO_URI =
    "https://placehold.co/100x100/002140/D4AF37/png?text=SPC+Logo";

  // Data Loading Lifecycle
  useEffect(() => {
    if (params) {
      setServicePrice(Number(params.servicePrice) || 0);
      setExtraPartsPrice(Number(params.partsPrice) || 0);
      setServiceName(params.serviceName || "Home Service");
    }

    // Fetch welcomeGift balance safely
    const fetchUserWallet = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists() && userDoc.data().welcomeGift !== undefined) {
            setUserGiftWallet(Number(userDoc.data().welcomeGift));
          } else {
            setUserGiftWallet(150); // Default fallback
          }
        } catch (e) {
          setUserGiftWallet(150);
        }
      } else {
        setUserGiftWallet(150);
      }
    };
    fetchUserWallet();
  }, [params]);

  // Handle Card Discount
  useEffect(() => {
    if (cardNumber.trim().length > 4) {
      setCardDiscount(servicePrice * 0.05);
    } else {
      setCardDiscount(0);
    }
  }, [cardNumber, servicePrice]);

  // GPS Auto-location Tracker
  const fetchCurrentGPSLocation = async () => {
    setFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location settings verify karein.");
        setFetchingLocation(false);
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      let response = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (response && response.length > 0) {
        const place = response[0];
        let fullAddressString = `${place.street || ""}, ${place.subregion || place.city || "Patna"}, ${place.region || "Bihar"}`;
        setAddress(fullAddressString.replace(/^,\s*,?/, "").trim());
      } else {
        setAddress("Patna, Bihar");
      }
    } catch (error) {
      setAddress("Patna, Bihar");
    } finally {
      setFetchingLocation(false);
    }
  };

  useEffect(() => {
    fetchCurrentGPSLocation();
  }, []);

  // Wallet Deduction Calculations (Max 10% of base rate allowed)
  const maxWalletAllowed = servicePrice * 0.1;
  const walletDiscountApplied = useWalletBalance
    ? Math.min(userGiftWallet, maxWalletAllowed)
    : 0;

  const subTotalAmount = servicePrice + extraPartsPrice;
  const totalAfterDiscounts =
    subTotalAmount - couponDiscount - walletDiscountApplied - cardDiscount;
  const finalAmount =
    (totalAfterDiscounts > 0 ? totalAfterDiscounts : 0) + platformFee;

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === "SPCFIRST") {
      setCouponDiscount(50);
      Alert.alert("🎉 Applied", "Coupon applied successfully!");
    } else {
      Alert.alert("Invalid", "Yeh coupon sahi nahi hai.");
      setCouponDiscount(0);
    }
  };

  const saveOrderToAdmin = async () => {
    if (!address.trim() || phone.length < 10) {
      return Alert.alert(
        "Incomplete",
        "Address aur Mobile number enter karein.",
      );
    }

    setLoading(true);
    try {
      const orderData = {
        userId: auth.currentUser?.uid || "guest_user",
        customerName: auth.currentUser?.displayName || "Customer",
        serviceName: serviceName,
        cardType: selectedCard,
        cardNumber: cardNumber || "None",
        basePrice: servicePrice,
        extraPartsPrice: extraPartsPrice,
        couponUsed: couponDiscount > 0 ? couponCode : "None",
        walletDiscount: walletDiscountApplied,
        cardDiscount: cardDiscount,
        platformFee: platformFee,
        totalPayable: finalAmount,
        address: address,
        phone: phone,
        paymentType: paymentMethod,
        status: "New Order",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), orderData);

      // Deduct used wallet amount from Firebase database
      if (useWalletBalance && auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          welcomeGift: userGiftWallet - walletDiscountApplied,
        });
      }

      setShowQRModal(false);
      clearCart();
      router.replace("/(tabs)/cart");
      Alert.alert("🎉 Order Success", "Booking securely logged!");
    } catch (e) {
      Alert.alert("Error", "Order save nahi hua.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Finalize Order",
          headerTintColor: "#D4AF37",
          headerStyle: { backgroundColor: "#001529" },
          headerRight: () => (
            <Image
              source={{ uri: SHOP_LOGO_URI }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Address Input Section */}
        <View style={styles.sectionBox}>
          <View style={styles.labelRow}>
            <Text style={styles.sourceTextLabel}>DELIVERY ADDRESS</Text>
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={fetchCurrentGPSLocation}
              disabled={fetchingLocation}
            >
              {fetchingLocation ? (
                <ActivityIndicator size="small" color="#00cc66" />
              ) : (
                <View style={styles.innerLocBtn}>
                  <Ionicons name="location" size={14} color="#00cc66" />
                  <Text style={styles.locationBtnText}> Auto GPS</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={2}
            placeholder="Complete Home Address..."
            placeholderTextColor="#94A3B8"
            value={address}
            onChangeText={setAddress}
          />

          <Text style={[styles.sourceTextLabel, { marginTop: 15 }]}>
            MOBILE NUMBER
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="10 Digit Number"
            placeholderTextColor="#94A3B8"
            value={phone}
            onChangeText={setPhone}
            maxLength={10}
          />
        </View>

        {/* 🔥 RESTORED WELCOME GIFT WALLET MODULE */}
        <View style={[styles.sectionBox, styles.walletBox]}>
          <View style={styles.walletHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Ionicons name="gift" size={20} color="#D4AF37" />
              <View>
                <Text style={styles.walletTitle}>Welcome Gift Wallet</Text>
                <Text style={styles.walletSubtitle}>
                  Available Balance: ₹{userGiftWallet}
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: "#001529", true: "#00cc66" }}
              thumbColor={useWalletBalance ? "#FFF" : "#94A3B8"}
              value={useWalletBalance}
              onValueChange={setUseWalletBalance}
              disabled={userGiftWallet <= 0}
            />
          </View>
          {useWalletBalance && (
            <Text style={styles.walletAppliedText}>
              🎉 Applying ₹{walletDiscountApplied.toFixed(2)} (10% of base price
              limit applied)
            </Text>
          )}
        </View>

        {/* Membership Section */}
        <View style={styles.sectionBox}>
          <Text style={styles.sourceTextLabel}>MEMBERSHIP SELECTOR</Text>
          <View style={styles.cardRow}>
            {["Silver", "Golden", "Platinum"].map((card) => (
              <TouchableOpacity
                key={card}
                style={[
                  styles.cardTypeBtn,
                  selectedCard === card && styles.activeCardBtn,
                ]}
                onPress={() => setSelectedCard(card)}
              >
                <Text
                  style={[
                    styles.cardTypeTxt,
                    selectedCard === card && styles.activeCardTxt,
                  ]}
                >
                  {card}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { marginTop: 12 }]}
            placeholder="Card Serial Key (Optional)..."
            placeholderTextColor="#94A3B8"
            value={cardNumber}
            onChangeText={setCardNumber}
          />
        </View>

        {/* Coupons */}
        <View style={styles.sectionBox}>
          <Text style={styles.sourceTextLabel}>OFFER COUPON CODE</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginTop: 0 }]}
              placeholder="Code (e.g., SPCFIRST)"
              placeholderTextColor="#94A3B8"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApplyCoupon}
            >
              <Text style={styles.applyBtnTxt}>APPLY</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Gateways Selector */}
        <View style={styles.sectionBox}>
          <Text style={styles.sourceTextLabel}>CHOOSE PAYMENT CHANNEL</Text>
          <TouchableOpacity
            style={[
              styles.payCard,
              paymentMethod === "cash" && styles.activePayCard,
            ]}
            onPress={() => setPaymentMethod("cash")}
          >
            <Ionicons name="cash-outline" size={20} color="#D4AF37" />
            <Text style={styles.payText}>Cash On Delivery / After Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.payCard,
              paymentMethod === "online" && styles.activePayCard,
            ]}
            onPress={() => setPaymentMethod("online")}
          >
            <Ionicons name="qr-code-outline" size={20} color="#D4AF37" />
            <Text style={styles.payText}>Instant UPI Payment Gateway</Text>
          </TouchableOpacity>
        </View>

        {/* Prices Summary Breakup */}
        <View style={styles.sectionBox}>
          <Text style={styles.sourceTextLabel}>FINAL BILL RECEIPT</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Base Visiting Fee</Text>
            <Text style={styles.billValue}>₹{servicePrice}</Text>
          </View>

          {extraPartsPrice > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Spares & Parts Costs</Text>
              <Text style={[styles.billValue, { color: "#00cc66" }]}>
                + ₹{extraPartsPrice}
              </Text>
            </View>
          )}

          {walletDiscountApplied > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Wallet Cash Used</Text>
              <Text style={[styles.billValue, { color: "#00cc66" }]}>
                - ₹{walletDiscountApplied.toFixed(2)}
              </Text>
            </View>
          )}

          {cardDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Membership Reward Save</Text>
              <Text style={[styles.billValue, { color: "#00cc66" }]}>
                - ₹{cardDiscount.toFixed(2)}
              </Text>
            </View>
          )}

          {couponDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Coupon Deduction</Text>
              <Text style={[styles.billValue, { color: "#00cc66" }]}>
                - ₹{couponDiscount}
              </Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Convenience Fee</Text>
            <Text style={styles.billValue}>₹{platformFee}</Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billRow}>
            <Text
              style={[
                styles.billLabel,
                { fontWeight: "bold", color: "#D4AF37" },
              ]}
            >
              Grand Payable Total
            </Text>
            <Text
              style={[styles.billValue, { fontSize: 18, color: "#D4AF37" }]}
            >
              ₹{finalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.finalBtn}
          onPress={() =>
            paymentMethod === "online"
              ? setShowQRModal(true)
              : saveOrderToAdmin()
          }
        >
          <Text style={styles.finalBtnText}>
            CONFIRM ORDER - ₹{finalAmount.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* QR Modal Engine */}
      <Modal visible={showQRModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Scan Dynamic UPI Code</Text>
            <View style={styles.qrContainer}>
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${UPI_ID}%26pn=SPC_Patna%26am=${finalAmount.toFixed(2)}%26cu=INR`,
                }}
                style={styles.qrImage}
              />
            </View>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={saveOrderToAdmin}
            >
              <Text style={styles.confirmBtnText}>VERIFY & PLACE BOOKING</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowQRModal(false)}
              style={{ marginTop: 15 }}
            >
              <Text style={{ color: "#94A3B8" }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001529" },
  sectionBox: {
    backgroundColor: "#002140",
    padding: 15,
    borderRadius: 16,
    marginHorizontal: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#003366",
  },
  walletBox: {
    borderColor: "#D4AF37",
    borderWidth: 1,
    backgroundColor: "#002b54",
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletTitle: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  walletSubtitle: { color: "#D4AF37", fontSize: 12, marginTop: 2 },
  walletAppliedText: {
    color: "#00cc66",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 10,
    fontStyle: "italic",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sourceTextLabel: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 6,
  },
  headerLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#D4AF37",
    marginRight: 10,
  },
  locationBtn: {
    backgroundColor: "#001529",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00cc66",
  },
  innerLocBtn: { flexDirection: "row", alignItems: "center" },
  locationBtnText: { color: "#00cc66", fontSize: 11, fontWeight: "600" },
  input: {
    backgroundColor: "#001529",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#003366",
    fontSize: 14,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  cardTypeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#003366",
    backgroundColor: "#001529",
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeCardBtn: { backgroundColor: "#D4AF37", borderColor: "#D4AF37" },
  cardTypeTxt: { color: "#D4AF37", fontWeight: "bold", fontSize: 12 },
  activeCardTxt: { color: "#001529" },
  couponRow: { flexDirection: "row", gap: 10 },
  applyBtn: {
    backgroundColor: "#D4AF37",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  applyBtnTxt: { color: "#001529", fontWeight: "bold", fontSize: 13 },
  payCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#001529",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#003366",
  },
  activePayCard: { borderColor: "#D4AF37", backgroundColor: "#002547" },
  payText: { color: "#fff", marginLeft: 12, fontSize: 14, flex: 1 },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  billLabel: { fontSize: 13, color: "#94A3B8" },
  billValue: { fontSize: 13, fontWeight: "bold", color: "#FFF" },
  billDivider: { height: 1, backgroundColor: "#003366", marginVertical: 8 },
  finalBtn: {
    backgroundColor: "#D4AF37",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 20,
  },
  finalBtnText: { color: "#001529", fontWeight: "bold", fontSize: 16 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#002140",
    padding: 25,
    borderRadius: 25,
    alignItems: "center",
    width: "90%",
    borderWidth: 1,
    borderColor: "#003366",
  },
  modalTitle: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  qrContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  qrImage: { width: 180, height: 180 },
  confirmBtn: {
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  confirmBtnText: { color: "#001529", fontWeight: "bold", fontSize: 14 },
});

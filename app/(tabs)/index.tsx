// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { useCart } from "../../context/CartContext";

const { width: windowWidth } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { cartItems, addToCart } = useCart();
  const scrollRef = useRef(null);

  const [services, setServices] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("All");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);
  const [currentWidth, setCurrentWidth] = useState(windowWidth);

  // Screen size listener for layout flexibility
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setCurrentWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const isDesktop = currentWidth > 900;
  const isTablet = currentWidth > 600 && currentWidth <= 900;

  const bannerWidth = isDesktop ? currentWidth - 80 : currentWidth - 40;
  const bannerHeight = isDesktop ? 340 : 180;

  let cardWidth = "48%";
  if (isDesktop) {
    cardWidth = "23.5%";
  } else if (isTablet) {
    cardWidth = "31%";
  }

  // --- AI EMERGENCY SYSTEM CALL HANDLER ---
  const VAPI_PUBLIC_KEY = "YOUR_VAPI_PUBLIC_KEY";
  const VAPI_ASSISTANT_ID = "YOUR_ASSISTANT_ID";

  const handleEmergencyAICall = async () => {
    const userPhone = user?.phoneNumber || "+918409372138";
    Alert.alert(
      "SPC Emergency AI",
      "Do you want to talk with our AI Assistant?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Me",
          onPress: async () => {
            try {
              const res = await fetch("https://api.vapi.ai/call/phone", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${VAPI_PUBLIC_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  customer: { number: userPhone },
                  assistantId: VAPI_ASSISTANT_ID,
                }),
              });
              if (res.ok) {
                Alert.alert(
                  "Connecting",
                  "AI Assistant is dialing your number...",
                );
              } else {
                Linking.openURL("tel:+918409372138");
              }
            } catch (e) {
              Linking.openURL("tel:+918409372138");
            }
          },
        },
      ],
    );
  };

  // --- FIREBASE REAL-TIME SUBSCRIPTIONS ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (curr) => setUser(curr));

    const unsubCats = onSnapshot(
      query(collection(db, "categories"), orderBy("name", "asc")),
      (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCategories([
          {
            id: "all",
            name: "All",
            icon: "https://cdn-icons-png.flaticon.com/512/3081/3081840.png",
          },
          ...data,
        ]);
      },
    );

    const unsubServices = onSnapshot(
      query(collection(db, "services"), orderBy("createdAt", "desc")),
      (snap) => {
        setServices(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
    );

    const unsubBanners = onSnapshot(
      query(collection(db, "banners")),
      (snap) => {
        setBanners(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
    );

    return () => {
      unsubAuth();
      unsubServices();
      unsubBanners();
      unsubCats();
    };
  }, []);

  // --- AUTOMATIC FLUID BANNER SLIDER ---
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setActiveBanner((prevIndex) => {
        const nextIndex = prevIndex + 1 >= banners.length ? 0 : prevIndex + 1;
        scrollRef.current?.scrollTo({
          x: nextIndex * bannerWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [banners, bannerWidth]);

  const handleScrollEnd = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / bannerWidth);
    if (currentIndex >= 0 && currentIndex < banners.length) {
      setActiveBanner(currentIndex);
    }
  };

  // --- NAVIGATION ACTION ROUTERS ---
  const handleQuickBook = (item) => {
    addToCart(item);
    router.push({
      pathname: "/checkout",
      params: {
        serviceId: item.id || Date.now().toString(),
        serviceName: item.name || "Home Service",
        servicePrice: item.price || 0,
        partsPrice: 0,
      },
    });
  };

  const handleViewServiceDetails = (item) => {
    router.push({
      pathname: "/servicedetails",
      params: {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image || item.imageUrl || "",
        category: item.category || "",
      },
    });
  };

  // URL Opening Safety Wrapper
  const handleOpenURL = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this link at the moment");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong while opening the link");
    }
  };

  const filteredServices = services.filter(
    (s) =>
      (selectedCat === "All" || s.category === selectedCat) &&
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#002D62" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header Branding Panel */}
        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
          <View style={[styles.nav, isDesktop && styles.navDesktop]}>
            <View style={styles.logoLayoutRow}>
              <View style={styles.logoBox}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logoImgFile}
                />
              </View>
              <View style={styles.logoTextStack}>
                <Text style={styles.logoMainText}>SPC</Text>
                <Text style={styles.welcomeSubText}>
                  {user
                    ? `Hi, ${user.displayName || user.email?.split("@")[0]}`
                    : "Welcome to SPC"}
                </Text>
              </View>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 20 }}
            >
              {isDesktop && (
                <View style={[styles.searchBar, { marginTop: 0, width: 400 }]}>
                  <Ionicons
                    name="search"
                    size={20}
                    color="#94A3B8"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    placeholder="Search for any service..."
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.cartBtn}
                onPress={() => router.push("/cart")}
              >
                <Ionicons name="cart-outline" size={26} color="#FFF" />
                {cartItems?.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartItems.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {!isDesktop && (
            <View style={styles.searchBar}>
              <Ionicons
                name="search"
                size={20}
                color="#94A3B8"
                style={{ marginRight: 10 }}
              />
              <TextInput
                placeholder="Search for any service..."
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}
        </View>

        {/* Categories Section */}
        <View
          style={[
            styles.contentWrapper,
            isDesktop && styles.contentWrapperDesktop,
          ]}
        >
          <View style={styles.catWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 5 }}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCat(cat.name)}
                  style={styles.catItem}
                >
                  <View
                    style={[
                      styles.iconBox,
                      selectedCat === cat.name && styles.activeIconBox,
                    ]}
                  >
                    <Image source={{ uri: cat.icon }} style={styles.catIcon} />
                  </View>
                  <Text
                    style={[
                      styles.catLabel,
                      selectedCat === cat.name && styles.activeLabel,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  {selectedCat === cat.name && (
                    <View style={styles.indicator} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Banner Slider Section */}
          <View style={[styles.bannerContainer, { height: bannerHeight + 25 }]}>
            {banners.length > 0 ? (
              <View style={{ width: bannerWidth, height: bannerHeight }}>
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  pagingEnabled
                  decelerationRate="fast"
                  snapToInterval={bannerWidth}
                  snapToAlignment="center"
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleScrollEnd}
                >
                  {banners.map((b) => (
                    <View
                      key={b.id}
                      style={{ width: bannerWidth, height: bannerHeight }}
                    >
                      <Image
                        source={{ uri: b.imageUrl || b.image || b.imgUrl }}
                        style={styles.bannerImage}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.dotRow}>
                  {banners.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        activeBanner === i && styles.activeDot,
                      ]}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.bannerLoading,
                  { width: bannerWidth, height: bannerHeight },
                ]}
              >
                <ActivityIndicator color="#002D62" />
                <Text style={styles.fallbackTxt}>
                  3 MAHINE KI KAAM KI ZIMMEDARI 🛠️
                </Text>
              </View>
            )}
          </View>

          {/* AI Hotline Emergency Trigger Row */}
          <TouchableOpacity
            style={[
              styles.emergencyRow,
              isDesktop && styles.emergencyRowDesktop,
            ]}
            onPress={handleEmergencyAICall}
          >
            <Ionicons name="call" size={22} color="#002D62" />
            <Text style={styles.emergencyTxt}>Emergency Repair: Call Now</Text>
          </TouchableOpacity>

          {/* Core Services Grid Display */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{selectedCat} Services</Text>
            <View style={styles.grid}>
              {loading ? (
                <ActivityIndicator size="large" color="#002D62" />
              ) : (
                filteredServices.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.gridCard, { width: cardWidth }]}
                  >
                    <Image
                      source={{ uri: item.image || item.imageUrl }}
                      style={styles.cardImg}
                    />
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardPrice}>Starts ₹{item.price}</Text>

                    <TouchableOpacity
                      style={styles.quickBookBtn}
                      onPress={() => handleQuickBook(item)}
                    >
                      <Text style={styles.quickBookTxt}>BOOK NOW</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.viewLink}
                      onPress={() => handleViewServiceDetails(item)}
                    >
                      <Text style={styles.viewLinkTxt}>VIEW DETAILS</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={12}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* Global Branding Footer Component */}
        <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
          <Text style={styles.proFooterTitle}>Connect With Us</Text>

          {/* Professional Social Badges Row */}
          <View style={styles.proSocialRow}>
            <TouchableOpacity
              style={styles.proSocialLink}
              onPress={() =>
                handleOpenURL("https://www.facebook.com/share/1DzMopBFir/")
              }
            >
              <Ionicons name="logo-facebook" size={18} color="#1877F2" />
              <Text style={styles.proSocialText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.proSocialLink}
              onPress={() =>
                handleOpenURL("https://instagram.com/serviceprovidercentre")
              }
            >
              <Ionicons name="logo-instagram" size={18} color="#E1306C" />
              <Text style={styles.proSocialText}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.proSocialLink}
              onPress={() =>
                handleOpenURL(
                  "https://whatsapp.com/channel/0029VbBqtdYCXC3I0z25tn2f",
                )
              }
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={styles.proSocialText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Corporate Legal Links - Working URLs */}
          <View style={styles.legalLinksRow}>
            <TouchableOpacity
              onPress={() => handleOpenURL("https://www.google.com")}
            >
              <Text style={styles.legalLinkText}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>•</Text>
            <TouchableOpacity
              onPress={() => handleOpenURL("https://en.wikipedia.org")}
            >
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          {/* Clean Copyright Structure */}
          <View style={styles.copyrightContainer}>
            <Text style={styles.copyrightText}>
              © 2026 Service Provider Centre. All Rights Reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  contentWrapper: { width: "100%", paddingHorizontal: 0 },
  contentWrapperDesktop: {
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 40,
  },
  header: {
    backgroundColor: "#002D62",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 45,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerDesktop: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 25,
    paddingHorizontal: 40,
  },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navDesktop: { maxWidth: 1120, width: "100%", alignSelf: "center" },
  logoLayoutRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoBox: {
    width: 46,
    height: 46,
    backgroundColor: "#FFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoImgFile: { width: "85%", height: "85%", resizeMode: "contain" },
  logoTextStack: { flexDirection: "column", justifyContent: "center" },
  logoMainText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  welcomeSubText: { color: "#CBD5E1", fontSize: 11, marginTop: 1 },
  cartBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    borderRadius: 15,
  },
  badge: {
    position: "absolute",
    right: -4,
    top: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#002D62",
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 20,
    alignItems: "center",
  },
  searchInput: { flex: 1, height: 40, color: "#1E293B", outlineStyle: "none" },
  catWrapper: { marginVertical: 20 },
  catItem: { alignItems: "center", width: 90, marginHorizontal: 5 },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#FFF",
    elevation: 3,
    shadowColor: "#94A3B8",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIconBox: { backgroundColor: "#002D62" },
  catIcon: { width: 36, height: 36, resizeMode: "contain" },
  catLabel: { fontSize: 12, marginTop: 6, color: "#64748B", fontWeight: "600" },
  activeLabel: { color: "#002D62" },
  indicator: {
    height: 3,
    width: 20,
    backgroundColor: "#002D62",
    marginTop: 4,
    borderRadius: 2,
  },
  bannerContainer: { marginVertical: 15, alignItems: "center" },
  bannerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  dotRow: {
    flexDirection: "row",
    position: "absolute",
    bottom: -20,
    alignSelf: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,45,98,0.2)",
    marginHorizontal: 3,
  },
  activeDot: { backgroundColor: "#002D62", width: 18 },
  bannerLoading: {
    backgroundColor: "#E0F2FE",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#002D62",
  },
  fallbackTxt: { color: "#002D62", fontWeight: "bold", marginTop: 10 },
  emergencyRow: {
    backgroundColor: "#D4AF37",
    marginHorizontal: 15,
    marginVertical: 20,
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    elevation: 4,
  },
  emergencyRowDesktop: { marginHorizontal: 0, padding: 20, borderRadius: 22 },
  emergencyTxt: { color: "#002D62", fontWeight: "900", fontSize: 16 },
  section: { paddingHorizontal: 15, marginTop: 10 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1E293B",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: "2%",
  },
  gridCard: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 12,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardImg: {
    width: "100%",
    height: 130,
    borderRadius: 18,
    resizeMode: "cover",
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
    color: "#1E293B",
  },
  cardPrice: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "bold",
    marginVertical: 5,
  },
  quickBookBtn: {
    backgroundColor: "#002D62",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },
  quickBookTxt: { color: "#FFF", fontWeight: "bold", fontSize: 12 },
  viewLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingTop: 8,
    marginTop: 5,
  },
  viewLinkTxt: { color: "#64748B", fontWeight: "600", fontSize: 12 },

  // --- CLEAN FOOTER STYLES WITHOUT REGIONAL LABELS ---
  footer: {
    paddingVertical: 35,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    marginTop: 40,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 5,
  },
  footerDesktop: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: 60,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    elevation: 0,
  },
  proFooterTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 15,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  proSocialRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 25,
  },
  proSocialLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  proSocialText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  legalLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
    paddingTop: 5,
  },
  legalLinkText: {
    fontSize: 12,
    color: "#002D62",
    fontWeight: "500",
  },
  legalDot: {
    fontSize: 12,
    color: "#94A3B8",
  },
  copyrightContainer: {
    alignItems: "center",
    marginTop: 5,
  },
  copyrightText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "400",
    textAlign: "center",
  },
});

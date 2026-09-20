// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Head from "expo-router/head";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Footer from "../../components/Footer";
import { db } from "../../config/firebase";
import { useCart } from "../../context/CartContext";

const { width: windowWidth } = Dimensions.get("window");

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addToCart } = useCart();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentWidth, setCurrentWidth] = useState(windowWidth);

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setCurrentWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const isDesktop = currentWidth > 900;

  useEffect(() => {
    async function fetchServiceData() {
      if (!id) return;
      try {
        const cleanId = String(id).replace("-patna", "").replace("-fatwah", "");
        const docRef = doc(db, "services", cleanId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() });
        } else {
          setService({
            id: String(id),
            name: String(id).replace(/-/g, " ").toUpperCase(),
            price: "299",
            category: "Home Repair",
            rating: "4.8",
            description:
              "Fast & reliable doorstep home utility service by SPC experts.",
          });
        }
      } catch (err) {
        console.error("Firestore Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchServiceData();
  }, [id]);

  const serviceName = service?.name || "Home Utility Service";
  const servicePrice = service?.price || "199";
  const serviceCategory = service?.category || "Utility";
  const serviceImage =
    service?.image ||
    service?.imageUrl ||
    "https://spc-platform.vercel.app/logo.png";

  // Programmatic Dynamic SEO Data
  const targetCity = String(id).includes("fatwah") ? "Fatwah" : "Patna";
  const seoTitle = `Best ${serviceName} in ${targetCity} | SPC Service Provider Center`;
  const seoDescription = `Book professional ${serviceName} in ${targetCity} starting at ₹${servicePrice}. Verified mechanics, 90-day warranty & quick doorstep assistance.`;
  const canonicalUrl = `https://spc-platform.vercel.app/services/${id}`;

  // JSON-LD Schema Code for LocalBusiness & Service
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "SPC Service Provider Center",
    image: serviceImage,
    telephone: "+918409372138",
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      addressLocality: targetCity,
      addressRegion: "Bihar",
      countryName: "IN",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Home Utility Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: serviceName,
            description: seoDescription,
          },
          price: servicePrice,
          priceCurrency: "INR",
        },
      ],
    },
  };

  const handleBookNow = () => {
    const itemToBook = service || {
      id: String(id),
      name: serviceName,
      price: servicePrice,
    };
    addToCart(itemToBook);
    router.push({
      pathname: "/checkout",
      params: {
        serviceId: itemToBook.id,
        serviceName: serviceName,
        servicePrice: servicePrice,
        partsPrice: 0,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#002D62" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#002D62" />

      {/* SEO Head Tags & Schema Injection */}
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={serviceImage} />

        {/* JSON-LD Schema Injection */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLdSchema)}
        </script>
      </Head>

      <Stack.Screen
        options={{
          headerTitle: `${serviceName} (${targetCity})`,
          headerStyle: { backgroundColor: "#002D62" },
          headerTintColor: "#FFF",
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View
          style={[styles.mainWrapper, isDesktop && styles.mainWrapperDesktop]}
        >
          <Image source={{ uri: serviceImage }} style={styles.bannerImage} />

          <View style={styles.detailsCard}>
            <View style={styles.badgeRow}>
              <Text style={styles.categoryBadge}>
                {serviceCategory.toUpperCase()}
              </Text>
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingTxt}>{service?.rating || "4.8"}</Text>
              </View>
            </View>

            <Text style={styles.titleText}>
              {serviceName} in {targetCity}
            </Text>
            <Text style={styles.priceText}>Starts at ₹{servicePrice}</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionHeading}>Service Details</Text>
            <Text style={styles.descriptionText}>
              {service?.description ||
                `Get expert ${serviceName} delivered at your location in ${targetCity}. Transparent upfront pricing, 90-day warranty, and certified mechanics.`}
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={18} color="#059669" />
                <Text style={styles.featureTxt}>3 Months Guarantee</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="people" size={18} color="#059669" />
                <Text style={styles.featureTxt}>
                  Verified & Background Checked Professionals
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.bookBtn} onPress={handleBookNow}>
              <Text style={styles.bookBtnTxt}>BOOK SERVICE NOW</Text>
            </TouchableOpacity>
          </View>

          <Footer isDesktop={isDesktop} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1 },
  mainWrapper: { width: "100%" },
  mainWrapperDesktop: {
    maxWidth: 1000,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  bannerImage: { width: "100%", height: 260, resizeMode: "cover" },
  detailsCard: {
    backgroundColor: "#FFF",
    marginTop: -25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 22,
    elevation: 4,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "#E0F2FE",
    color: "#002D62",
    fontWeight: "bold",
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingBox: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingTxt: { fontSize: 13, fontWeight: "bold", color: "#1E293B" },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
    marginTop: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
    marginTop: 6,
  },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 18 },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },
  descriptionText: { fontSize: 14, color: "#64748B", lineHeight: 22 },
  featuresList: { marginTop: 16, gap: 10 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureTxt: { fontSize: 13, color: "#334155", fontWeight: "600" },
  bookBtn: {
    backgroundColor: "#002D62",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 25,
  },
  bookBtnTxt: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
});

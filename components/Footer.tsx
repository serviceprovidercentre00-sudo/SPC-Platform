// components/Footer.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface ReviewStructure {
  id: string;
  user: string;
  rating: number;
  comment: string;
  serviceName: string;
}

interface FooterProps {
  isDesktop: boolean;
  handleOpenURL: (url: string) => void;
  realCustomerReviews?: ReviewStructure[];
}

export default function Footer({
  isDesktop,
  handleOpenURL,
  realCustomerReviews = [],
}: FooterProps) {
  return (
    <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
      <View style={styles.accentLine} />

      {/* ⭐ DYNAMIC REVIEWS SYSTEM ⭐ */}
      {realCustomerReviews.length > 0 && (
        <>
          <Text style={styles.proFooterTitle}>What Customers Say</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reviewsCarousel}
          >
            {realCustomerReviews.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>
                    {rev.user || "Anonymous"}
                  </Text>
                  <View style={styles.starsRow}>
                    {[...Array(Number(rev.rating || 5))].map((_, i) => (
                      <Ionicons key={i} name="star" size={12} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewComment} numberOfLines={2}>
                  "{rev.comment}"
                </Text>
                <Text style={styles.reviewServiceTag}>{rev.serviceName}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.brandDivider} />
        </>
      )}

      {/* Social Section */}
      <Text style={styles.proFooterTitle}>Connect With Us</Text>
      <View style={styles.proSocialRow}>
        <TouchableOpacity
          style={[styles.proSocialLink, styles.fbBorder]}
          onPress={() =>
            handleOpenURL("https://www.facebook.com/share/1DzMopBFir/")
          }
          activeOpacity={0.7}
        >
          <Ionicons name="logo-facebook" size={20} color="#1877F2" />
          <Text style={styles.proSocialText}>Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.proSocialLink, styles.instaBorder]}
          onPress={() =>
            handleOpenURL("https://instagram.com/serviceprovidercentre")
          }
          activeOpacity={0.7}
        >
          <Ionicons name="logo-instagram" size={20} color="#E1306C" />
          <Text style={styles.proSocialText}>Instagram</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.proSocialLink, styles.waBorder]}
          onPress={() =>
            handleOpenURL(
              "https://whatsapp.com/channel/0029VbBqtdYCXC3I0z25tn2f",
            )
          }
          activeOpacity={0.7}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          <Text style={styles.proSocialText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Legal Links */}
      <View style={styles.legalLinksRow}>
        <TouchableOpacity
          onPress={() => handleOpenURL("https://www.google.com")}
          activeOpacity={0.6}
        >
          <Text style={styles.legalLinkText}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={styles.legalDot}>•</Text>
        <TouchableOpacity
          onPress={() => handleOpenURL("https://en.wikipedia.org")}
          activeOpacity={0.6}
        >
          <Text style={styles.legalLinkText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.brandDivider} />

      {/* Copyright */}
      <View style={styles.copyrightContainer}>
        <Text style={styles.copyrightText}>
          © 2026 Service Provider Centre. All Rights Reserved.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: "100%",
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 4,
  },
  footerDesktop: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: 30,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  accentLine: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginBottom: 20,
  },
  proFooterTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 15,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  reviewsCarousel: {
    paddingHorizontal: 4,
    paddingBottom: 15,
    gap: 12,
  },
  reviewCard: {
    width: 240,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewUser: { fontSize: 12, fontWeight: "700", color: "#1E293B" },
  starsRow: { flexDirection: "row", gap: 2 },
  reviewComment: {
    fontSize: 12,
    color: "#475569",
    fontStyle: "italic",
    lineHeight: 16,
  },
  reviewServiceTag: {
    fontSize: 10,
    fontWeight: "600",
    color: "#002D62",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  proSocialRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 25,
    width: "100%",
  },
  proSocialLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    borderColor: "#E2E8F0",
    borderWidth: 1,
  },
  fbBorder: { borderColor: "#E0F2FE" },
  instaBorder: { borderColor: "#FCE7F3" },
  waBorder: { borderColor: "#DCFCE7" },
  proSocialText: { fontSize: 13, fontWeight: "600", color: "#334155" },
  legalLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  legalLinkText: { fontSize: 13, color: "#002D62", fontWeight: "600" },
  legalDot: { fontSize: 12, color: "#CBD5E1" },
  brandDivider: {
    width: "85%",
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 15,
  },
  copyrightContainer: { alignItems: "center" },
  copyrightText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
    textAlign: "center",
  },
});

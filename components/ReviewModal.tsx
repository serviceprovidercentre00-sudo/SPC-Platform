import { Ionicons } from "@expo/vector-icons";
import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../config/firebase";

// 🛠️ TYPESCRIPT PROPS INTERFACE DEFINITION
interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  userName?: string | null; // Optional or nullable type safely handled
}

export default function ReviewModal({
  visible,
  onClose,
  bookingId,
  serviceId,
  serviceName,
  userId,
  userName,
}: ReviewModalProps) {
  // 🛠️ ASSIGNED TYPE HERE
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmitReview = async () => {
    if (!rating) {
      Alert.alert("Error", "Please select a star rating!");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save review to global 'completed_reviews' collection
      await addDoc(collection(db, "completed_reviews"), {
        bookingId,
        serviceId,
        serviceName,
        userId,
        userName: userName || "Anonymous Customer",
        rating,
        reviewText,
        timestamp: serverTimestamp(),
      });

      // 2. Update booking status so user isn't asked to review again
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        reviewSubmitted: true,
      });

      Alert.alert(
        "Thank You!",
        "Aapka review successfully submit ho gaya hai. ❤️",
      );
      setReviewText("");
      setRating(5);
      onClose();
    } catch (error) {
      console.error("Review submit error: ", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Rate Your Experience</Text>
          <Text style={styles.serviceNameTxt}>{serviceName}</Text>

          {/* Star Rating Row */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={36}
                  color="#F59E0B"
                  style={{ marginHorizontal: 5 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Comment TextInput */}
          <TextInput
            placeholder="Write your review here (optional)..."
            style={styles.reviewInput}
            multiline
            numberOfLines={4}
            value={reviewText}
            onChangeText={setReviewText}
            placeholderTextColor="#94A3B8"
          />

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmitReview}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnTxt}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 450,
    alignItems: "center",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 5,
  },
  serviceNameTxt: {
    fontSize: 15,
    color: "#002D62",
    fontWeight: "600",
    marginBottom: 20,
  },
  starRow: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  reviewInput: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  btnRow: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  cancelBtnTxt: { color: "#64748B", fontWeight: "bold" },
  submitBtn: {
    flex: 2,
    backgroundColor: "#002D62",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  submitBtnTxt: { color: "#FFF", fontWeight: "bold" },
});

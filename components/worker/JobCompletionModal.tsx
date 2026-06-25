// @ts-nocheck
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function JobCompletionModal({ visible, onClose, orderId }) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Order Updates Verified</Text>
          <Text style={styles.modalBody}>
            Order ID #{orderId?.slice(0, 8).toUpperCase()} ka warranty sticker
            successfully attach ho chuka hai aur summary push ho gayi hai.
          </Text>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.btnText}>Theek Hai</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#002140",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    borderWidth: 1,
    borderColor: "#D4AF37",
    alignItems: "center",
  },
  modalTitle: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalBody: {
    color: "#ccc",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  closeBtn: {
    backgroundColor: "#D4AF37",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  btnText: {
    color: "#001529",
    fontWeight: "bold",
    fontSize: 13,
  },
});

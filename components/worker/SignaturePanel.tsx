// @ts-nocheck
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
// Note: digital signature pad package should draw smoothly inside this wrapper view.
// Providing standard touch simulation signature container logic.

export default function SignaturePanel({ onSignatureChange }) {
  const [signed, setSigned] = useState(false);

  const handleSimulateSign = () => {
    setSigned(true);
    onSignatureChange(true);
  };

  const handleClear = () => {
    setSigned(false);
    onSignatureChange(false);
  };

  return (
    <View style={styles.signatureContainer}>
      <View style={[styles.canvasMock, signed && styles.canvasSigned]}>
        {signed ? (
          <Text style={styles.signedText}>✍️ Customer Signature Recorded</Text>
        ) : (
          <Text style={styles.placeholderText}>
            Customer se boliye screen par ungli se sign karein
          </Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        {!signed ? (
          <TouchableOpacity style={styles.signBtn} onPress={handleSimulateSign}>
            <Text style={styles.btnText}>Sign Pad Active karein</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.btnText}>Clear / Resign</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  signatureContainer: {
    marginVertical: 5,
  },
  canvasMock: {
    height: 100,
    backgroundColor: "#002140",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#003366",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  canvasSigned: {
    borderColor: "#2E7D32",
    borderStyle: "solid",
  },
  placeholderText: {
    color: "#666",
    fontSize: 11,
    textAlign: "center",
  },
  signedText: {
    color: "#4CAF50",
    fontSize: 13,
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
  },
  signBtn: {
    backgroundColor: "#003366",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  clearBtn: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  btnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});

// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../config/firebase";

export default function AdminWholesalers() {
  const [wholesalers, setWholesalers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    category: "",
    address: "",
    image: null,
  });

  const CLOUD_NAME = "dq5nnb1kn";
  const UPLOAD_PRESET = "spc_preset";

  useEffect(() => {
    const q = query(collection(db, "wholesalers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWholesalers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3], // Wholesaler shop ke liye thoda wider image sahi rahega
      quality: 0.5,
    });
    if (!result.canceled) {
      setForm({ ...form, image: result.assets[0].uri });
    }
  };

  const uploadToCloudinary = async (fileUri) => {
    if (!fileUri || fileUri.startsWith("http")) return fileUri;
    const data = new FormData();
    if (Platform.OS === "web") {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      data.append("file", blob);
    } else {
      data.append("file", {
        uri: fileUri,
        type: "image/jpeg",
        name: "shop.jpg",
      });
    }
    data.append("upload_preset", UPLOAD_PRESET);
    data.append("cloud_name", CLOUD_NAME);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data,
      },
    );
    const result = await res.json();
    return result.secure_url;
  };

  const saveWholesaler = async () => {
    if (!form.shopName || !form.category || !form.phone || !form.image) {
      return Alert.alert(
        "Rukiye!",
        "Shop Name, Category, Photo aur Number zaroori hai.",
      );
    }
    setBtnLoading(true);
    try {
      const imageUrl = await uploadToCloudinary(form.image);
      await addDoc(collection(db, "wholesalers"), {
        ...form,
        image: imageUrl,
        role: "wholesaler",
        createdAt: serverTimestamp(),
      });
      setForm({
        shopName: "",
        ownerName: "",
        phone: "",
        category: "",
        address: "",
        image: null,
      });
      setModalVisible(false);
      Alert.alert("Success", "Wholesaler list mein shamil ho gaya!");
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm =
      Platform.OS === "web" ? window.confirm("Wholesaler ko hatayein?") : true;
    if (confirm) await deleteDoc(doc(db, "wholesalers", id));
  };

  if (loading)
    return (
      <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Wholesalers List ({wholesalers.length})
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="business" size={20} color="#001529" />
          <Text style={{ fontWeight: "bold", marginLeft: 5 }}>ADD SHOP</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {wholesalers.map((w) => (
          <View key={w.id} style={styles.shopCard}>
            <Image source={{ uri: w.image }} style={styles.shopImg} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.shopName}>{w.shopName}</Text>
              <Text style={styles.categoryTag}>{w.category}</Text>
              <Text style={styles.ownerInfo}>Owner: {w.ownerName}</Text>
              <Text style={styles.contactInfo}>
                {w.phone} | {w.address}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(w.id)}>
              <Ionicons name="trash-outline" size={22} color="#FF4D4D" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Modal for Adding Wholesaler */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wholesaler Registration</Text>

            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {form.image ? (
                <Image
                  source={{ uri: form.image }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Ionicons name="camera" size={40} color="#D4AF37" />
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Shop Name (Ex: Patna Electronics)"
              value={form.shopName}
              onChangeText={(t) => setForm({ ...form, shopName: t })}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Category (Ex: AC Spares, Plumbing)"
              value={form.category}
              onChangeText={(t) => setForm({ ...form, category: t })}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Owner Name"
              value={form.ownerName}
              onChangeText={(t) => setForm({ ...form, ownerName: t })}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="numeric"
              value={form.phone}
              onChangeText={(t) => setForm({ ...form, phone: t })}
              placeholderTextColor="#888"
            />
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Shop Address"
              multiline
              value={form.address}
              onChangeText={(t) => setForm({ ...form, address: t })}
              placeholderTextColor="#888"
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 15,
                marginBottom: 30,
              }}
            >
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.btnCancel}
              >
                <Text style={{ color: "#fff" }}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveWholesaler} style={styles.btnSave}>
                {btnLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={{ fontWeight: "bold" }}>Save Shop</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001529" },
  loader: { flex: 1, backgroundColor: "#001529", justifyContent: "center" },
  header: {
    padding: 20,
    backgroundColor: "#002140",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "#D4AF37", fontSize: 18, fontWeight: "bold" },
  addBtn: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  shopCard: {
    backgroundColor: "#002140",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  shopImg: {
    width: 70,
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  shopName: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  categoryTag: { color: "#D4AF37", fontSize: 12, fontWeight: "600" },
  ownerInfo: { color: "#ccc", fontSize: 12, marginTop: 2 },
  contactInfo: { color: "#888", fontSize: 11 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#002140",
    padding: 20,
    borderRadius: 20,
    maxHeight: "90%",
  },
  modalTitle: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  imagePicker: {
    height: 140,
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#001529",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  input: {
    backgroundColor: "#001529",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  btnCancel: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 10,
    flex: 0.45,
    alignItems: "center",
  },
  btnSave: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 10,
    flex: 0.45,
    alignItems: "center",
  },
});

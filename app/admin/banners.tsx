// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";

export default function BannersScreen() {
  const [banners, setBanners] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- CONFIG ---
  const CLOUD_NAME = "dmp860spk";
  const UPLOAD_PRESET = "spc_uploads";
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  useEffect(() => {
    const q = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setBanners(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const pickImage = async () => {
    try {
      // FIX: MediaTypeOptions use kiya hai jo latest version ke liye sahi hai
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (err) {
      console.log("Picker Error:", err);
      Alert.alert("Error", "Image select nahi ho payi");
    }
  };

  const uploadToCloudinary = async () => {
    if (!image) return Alert.alert("Error", "Pehle photo select karein");

    setLoading(true);
    try {
      // Web Fix: Fetch image and convert to blob
      const response = await fetch(image);
      const blob = await response.blob();

      const data = new FormData();
      data.append("file", blob);
      data.append("upload_preset", UPLOAD_PRESET);
      data.append("cloud_name", CLOUD_NAME);

      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: data,
      });

      const file = await res.json();

      if (file.secure_url) {
        await addDoc(collection(db, "banners"), {
          image: file.secure_url,
          active: true,
          createdAt: serverTimestamp(),
        });
        setImage(null);
        Alert.alert("Success 🎉", "Banner live ho gaya!");
      } else {
        console.error("Cloudinary Error:", file);
        throw new Error(file.error?.message || "Upload failed");
      }
    } catch (e) {
      console.error("Upload Error:", e);
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.head}>Admin: Manage Banners</Text>

      <TouchableOpacity onPress={pickImage} style={styles.box}>
        {image ? (
          <Image source={{ uri: image }} style={styles.full} />
        ) : (
          <View style={{ alignItems: "center" }}>
            <Ionicons name="camera" size={50} color="#ddd" />
            <Text style={{ color: "#aaa", marginTop: 10 }}>
              Tap to Select Banner Image
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={uploadToCloudinary}
        style={[styles.btn, { backgroundColor: loading ? "#ccc" : "#000" }]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>UPLOAD BANNER</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.subHead}>Current Banners</Text>

      {banners.map((b) => (
        <View key={b.id} style={styles.card}>
          <Image source={{ uri: b.image }} style={styles.img} />
          <TouchableOpacity
            onPress={() => deleteDoc(doc(db, "banners", b.id))}
            style={styles.del}
          >
            <Ionicons name="trash" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },
  head: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  box: {
    height: 200,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  full: { width: "100%", height: "100%" },
  btn: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  subHead: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  card: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
    backgroundColor: "#fff",
  },
  img: { width: "100%", height: 180 },
  del: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "red",
    padding: 8,
    borderRadius: 50,
  },
});

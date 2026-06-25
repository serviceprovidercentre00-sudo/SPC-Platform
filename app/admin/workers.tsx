// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
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

// ⚠️ APNE FIREBASE KI REAL CONFIG DETAILS YAHAN DAALEIN (Taaki worker creation fail na ho)
const firebaseConfig = {
  apiKey: "AIzaSyAk0HvWSO7rhaWWJfabnS7mm1XCiQ6E-0M",
  authDomain: "spc-app-xxxx.firebaseapp.com",
  projectId: "spc-app-xxxx",
  storageBucket: "spc-app-xxxx.appspot.com",
  messagingSenderId: "xxxxxx",
  appId: "xxxxxx",
};

export default function AdminWorkers() {
  const [workers, setWorkers] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [activeTab, setActiveTab] = useState("approved");
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    address: "",
    password: "",
    image: null,
  });

  const CLOUD_NAME = "dq5nnb1kn";
  const UPLOAD_PRESET = "spc_preset";

  useEffect(() => {
    // Approved Workers Snapshot Listener with error handler
    const qApproved = query(collection(db, "workers"));
    const unsubApproved = onSnapshot(
      qApproved,
      (snapshot) => {
        setWorkers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => console.log("Approved stream error:", err),
    );

    // Pending Applications Snapshot Listener with error handler
    const qPending = query(
      collection(db, "worker_applications"),
      where("status", "==", "pending"),
    );
    const unsubPending = onSnapshot(
      qPending,
      (snapshot) => {
        setPendingWorkers(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
        );
      },
      (err) => console.log("Pending stream error:", err),
    );

    return () => {
      unsubApproved();
      unsubPending();
    };
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setForm({ ...form, image: result.assets[0].uri });
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
        name: "worker.jpg",
      });
    }
    data.append("upload_preset", UPLOAD_PRESET);
    data.append("cloud_name", CLOUD_NAME);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: data },
    );
    const result = await res.json();
    return result.secure_url;
  };

  const saveWorker = async () => {
    if (
      !form.name ||
      !form.category ||
      !form.phone ||
      !form.image ||
      !form.email ||
      !form.password
    ) {
      return Alert.alert("Wait!", "Sabhi fields aur photo zaroori hain.");
    }
    if (form.password.trim().length < 6) {
      return Alert.alert(
        "Security",
        "Password kam se kam 6 characters ka hona chahiye.",
      );
    }

    setBtnLoading(true);

    // Admin session ko secure rakhne ke liye isolated secondary auth instance
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, "SecondaryAppInstance");
    } catch (err) {
      secondaryApp = getApp("SecondaryAppInstance");
    }

    const secondaryAuth = getAuth(secondaryApp);

    try {
      const imageUrl = await uploadToCloudinary(form.image);

      // 1. Auth account creation with strict trimming
      const cleanEmail = form.email.trim().toLowerCase();
      const cleanPassword = form.password.trim();

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        cleanEmail,
        cleanPassword,
      );
      const secureUid = userCredential.user.uid;

      // 2. Firestore document mapping using exact UID as document ID
      await setDoc(doc(db, "workers", secureUid), {
        uid: secureUid,
        name: form.name,
        category: form.category,
        email: cleanEmail,
        phone: form.phone,
        address: form.address,
        image: imageUrl,
        role: "worker", // Explicit flag for dashboard check
        createdAt: serverTimestamp(),
      });

      // 3. Immediately log out secondary instance so it doesn't conflict
      await signOut(secondaryAuth);

      setForm({
        name: "",
        email: "",
        phone: "",
        category: "",
        address: "",
        password: "",
        image: null,
      });
      setModalVisible(false);
      Alert.alert(
        "Success 🎉",
        `${form.name} ka account ban gaya. Ab ye login kar sakte hain!`,
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", e.message || "Account banane me dikkat aayi.");
    } finally {
      setBtnLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm =
      Platform.OS === "web"
        ? window.confirm("Kya aap is worker ko hatana chahte hain?")
        : true;
    if (confirm) await deleteDoc(doc(db, "workers", id));
  };

  if (loading)
    return (
      <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SPC Workers Management</Text>
          <Text style={{ color: "#aaa", fontSize: 12 }}>
            Patna Operations Control
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color="#001529" />
          <Text style={{ fontWeight: "bold", marginLeft: 5 }}>ADD WORKER</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab("approved")}
          style={[styles.tab, activeTab === "approved" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "approved" && styles.activeTabText,
            ]}
          >
            Active Workers ({workers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("pending")}
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pending" && styles.activeTabText,
            ]}
          >
            Applicants ({pendingWorkers.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {activeTab === "approved"
          ? workers.map((w) => (
              <View key={w.id} style={styles.workerCard}>
                <Image source={{ uri: w.image }} style={styles.workerImg} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.workerName}>{w.name}</Text>
                  <Text style={styles.workerCat}>{w.category}</Text>
                  <Text style={styles.workerInfo}>{w.email}</Text>
                  <Text style={styles.workerInfo}>Mob: {w.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(w.id)}>
                  <Ionicons name="trash-outline" size={22} color="#FF4D4D" />
                </TouchableOpacity>
              </View>
            ))
          : pendingWorkers.map((w) => (
              <View
                key={w.id}
                style={[
                  styles.workerCard,
                  { borderColor: "#D4AF37", borderWidth: 0.5 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.workerName}>{w.name}</Text>
                  <Text style={styles.workerCat}>Skill: {w.skill}</Text>
                  <Text style={styles.workerInfo}>Area: {w.area}</Text>
                  <Text
                    style={[
                      styles.workerInfo,
                      { color: "#D4AF37", marginTop: 3 },
                    ]}
                  >
                    Phone: {w.phone}
                  </Text>
                </View>
              </View>
            ))}
      </ScrollView>

      {/* Modal for adding new worker */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Worker Credentials</Text>

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
              placeholder="Full Name"
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Category (e.g., Electrician, Plumber)"
              value={form.category}
              onChangeText={(t) => setForm({ ...form, category: t })}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Login Email ID"
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
              placeholderTextColor="#888"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Create Password (Min 6 Char)"
              secureTextEntry={true}
              value={form.password}
              onChangeText={(t) => setForm({ ...form, password: t })}
              placeholderTextColor="#888"
              autoCapitalize="none"
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
              placeholder="Address"
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
              <TouchableOpacity onPress={saveWorker} style={styles.btnSave}>
                {btnLoading ? (
                  <ActivityIndicator color="#001529" />
                ) : (
                  <Text style={{ fontWeight: "bold", color: "#001529" }}>
                    Save Worker
                  </Text>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#001529",
    borderBottomWidth: 1,
    borderColor: "#002140",
  },
  tab: { flex: 1, padding: 15, alignItems: "center" },
  activeTab: { borderBottomWidth: 2, borderColor: "#D4AF37" },
  tabText: { color: "#888", fontWeight: "bold" },
  activeTabText: { color: "#D4AF37" },
  workerCard: {
    backgroundColor: "#002140",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  workerImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  workerName: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  workerCat: { color: "#D4AF37", fontSize: 13, marginBottom: 2 },
  workerInfo: { color: "#aaa", fontSize: 11 },
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  imagePicker: {
    height: 100,
    width: 100,
    alignSelf: "center",
    backgroundColor: "#001529",
    borderRadius: 50,
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

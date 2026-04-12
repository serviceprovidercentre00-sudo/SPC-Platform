// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, deleteDoc, addDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

export default function BannersScreen() {
  const [banners, setBanners] = useState([]);
  const [image, setImage] = useState(null);

  useEffect(() => {
    return onSnapshot(collection(db, "banners"), s => setBanners(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const pick = async () => {
    let res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.5 });
    if (!res.canceled) setImage(res.assets[0].uri);
  };

  const upload = async () => {
    if(!image) return Alert.alert("Error", "Select image first");
    await addDoc(collection(db, "banners"), { image });
    setImage(null);
    Alert.alert("Success", "Banner Uploaded");
  };

  return (
    <ScrollView style={{padding: 15}}>
      <TouchableOpacity onPress={pick} style={styles.box}>
        {image ? <Image source={{uri: image}} style={styles.full} /> : <Text>➕ Tap to Select Banner</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={upload} style={styles.btn}><Text style={{color:'#fff'}}>PUBLISH BANNER</Text></TouchableOpacity>

      {banners.map(b => (
        <View key={b.id} style={styles.card}>
          <Image source={{uri: b.image}} style={styles.bannerImg} />
          <TouchableOpacity onPress={() => deleteDoc(doc(db, "banners", b.id))} style={styles.delBadge}><Text style={{color:'#fff'}}>DELETE</Text></TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  box: { height: 150, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginBottom: 10, overflow:'hidden' },
  full: { width: '100%', height: '100%' },
  btn: { backgroundColor: '#002D62', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  card: { marginBottom: 15, position: 'relative' },
  bannerImg: { width: '100%', height: 160, borderRadius: 12 },
  delBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'red', padding: 5, borderRadius: 5 }
});
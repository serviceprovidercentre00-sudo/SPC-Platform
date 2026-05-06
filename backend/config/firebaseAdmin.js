const admin = require("firebase-admin");
const path = require("path");

// Ye aapki nayi download ki hui file ka path hai
const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    console.log(
      "🔐 Firebase Admin SDK: Auth Successful with Project spcproject-c45b4-5c782",
    );
  } catch (error) {
    console.error("❌ Firebase Initialization Error:", error.message);
  }
}

const db = admin.firestore();
module.exports = { admin, db };

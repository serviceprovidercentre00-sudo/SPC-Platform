const express = require("express");
const { db } = require("./config/firebaseAdmin");
const { handleOrderCall } = require("./controllers/aiCallController");
const apiRoutes = require("./routes/api");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use("/api", apiRoutes);

const checkOrders = async () => {
  try {
    console.log("🔍 Database Check: Scanning for 'New Order'...");

    const ordersRef = db.collection("orders");

    // Aapke database ke hisaab se "New Order" check kar rahe hain
    const snapshot = await ordersRef.where("status", "==", "New Order").get();

    if (snapshot.empty) {
      console.log("😴 No 'New Order' found.");
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const orderId = doc.id;

      // Agar callTriggered field nahi hai ya false hai, tabhi call karein
      if (!data.callTriggered) {
        console.log(
          `🎯 Match Found! Order [${orderId}] from ${data.customerName || "Customer"}`,
        );

        // Hum handleOrderCall ko data bhej rahe hain
        handleOrderCall(orderId, {
          userName: data.customerName, // Aapke field ka naam customerName hai
          phone: data.phone,
        });
      }
    });
  } catch (err) {
    console.error("❌ Monitor Error:", err.message);
  }
};

// Har 30 seconds mein check karega
setInterval(checkOrders, 30000);
checkOrders();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`-------------------------------------------`);
  console.log(`✅ SPC Backend Operational on Port ${PORT}`);
  console.log(`📡 Project ID: spcproject-c45b4-5c782`);
  console.log(`-------------------------------------------`);
});

const { db } = require("../config/firebaseAdmin");
const { triggerCall } = require("../services/vapiService");

/**
 * Handle User/Customer Calls
 * Injected logic to prevent infinite loops.
 */
const handleOrderCall = async (orderId, orderData) => {
  try {
    const nameToCall =
      orderData.customerName || orderData.userName || "Customer";
    const phoneToCall = orderData.phone;

    console.log(
      `🎯 Processing Order [${orderId}]: Prevent loop by updating status first.`,
    );

    // STEP 1: Loop Rokne ke liye Status turant badlein
    // Isse scanner agli baar is order ko pick nahi karega
    await db.collection("orders").doc(orderId).update({
      callTriggered: true,
      status: "Call Initiated", // 'New Order' se badal diya gaya
    });

    // STEP 2: Ab call trigger karein
    const response = await triggerCall("USER", {
      name: nameToCall,
      phone: phoneToCall,
    });

    // STEP 3: Call ID milne par database update karein
    if (response && response.id) {
      await db.collection("orders").doc(orderId).update({
        vapiCallId: response.id,
        status: "Verification In Progress",
        lastUpdated: new Date().toISOString(),
      });
      console.log(
        `✅ [SUCCESS] Call dispatched to ${nameToCall}. ID: ${response.id}`,
      );
    }
  } catch (err) {
    console.error(`❌ [ERROR] Order ${orderId} failed:`, err.message);

    // STEP 4: Agar error aaye toh status 'Failed' karein taaki loop na bane
    await db.collection("orders").doc(orderId).update({
      status: "Call Failed",
      errorLog: err.message,
    });
  }
};

/**
 * Handle Worker Calls
 */
const callWorkerForJob = async (workerId, jobDetails) => {
  try {
    console.log(`📡 [WORKER] Calling: ${jobDetails.workerName}`);

    const response = await triggerCall("WORKER", {
      name: jobDetails.workerName,
      phone: jobDetails.workerPhone,
    });

    console.log(`✅ [WORKER] Call dispatched successfully.`);
  } catch (err) {
    console.error("❌ [WORKER] Call Fail:", err.message);
  }
};

module.exports = { handleOrderCall, callWorkerForJob };

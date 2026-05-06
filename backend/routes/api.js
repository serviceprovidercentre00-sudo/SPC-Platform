const express = require("express");
const router = express.Router();
const { callWorkerForJob } = require("../controllers/aiCallController");

// 1. Manual Trigger Route (App se worker ko call lagane ke liye)
router.post("/call-worker", async (req, res) => {
  const { workerId, workerName, workerPhone } = req.body;
  try {
    await callWorkerForJob(workerId, { workerName, workerPhone });
    res.status(200).json({ success: true, message: "Worker call initiated" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Webhook Route (AI ki call khatam hone par feedback lene ke liye)
// Iska use hum tab karenge jab hum status auto-confirm ka logic jodeinge
router.post("/webhook/vapi", async (req, res) => {
  console.log("📩 Webhook received from Vapi:", req.body.message.type);
  // Yahan hum call success/fail ka logic baad mein handle kar sakte hain
  res.status(200).send("OK");
});

module.exports = router;

const axios = require("axios");
require("dotenv").config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const TWILIO_PHONE_ID = "2378e9d4-8934-406a-a99d-c71d973bdc76";

/**
 * Optimized Vapi Service
 * Fixes: Undefined 'id' error & Loop prevention
 */
const triggerCall = async (type, userData) => {
  // 1. Phone number formatting
  let cleanPhone = userData.phone.toString().replace(/\D/g, "");
  if (cleanPhone.length === 10) cleanPhone = `+91${cleanPhone}`;
  else if (!cleanPhone.startsWith("+")) cleanPhone = `+${cleanPhone}`;

  // 2. Name cleaning to prevent API rejection
  const cleanName = userData.name ? userData.name.split(" ")[0] : "Customer";

  // 3. Dynamic Personas
  let assistantPrompt = "";
  let firstMessage = "";

  if (type === "USER") {
    assistantPrompt =
      "Aap SPC Patna ki Swara hain. Customer ko inform kijiye ki technician 30 mins mein pahuch jayega. Natural Hinglish bolein.";
    firstMessage = `Namaste ${cleanName}, main SPC Patna se Swara bol rahi hoon. Aapne jo service book ki thi, uske liye ye call hai.`;
  } else if (type === "WORKER") {
    assistantPrompt =
      "Aap SPC Office se bol rahi hain. Worker ko naya kaam assign kijiye.";
    firstMessage = `Hello ${cleanName}, SPC office se naya kaam assign hua hai. Kya aap ready hain?`;
  } else if (type === "WHOLESALER") {
    assistantPrompt =
      "Aap SPC purchase department se hain. Inventory check karni hai.";
    firstMessage = `Namaste ${cleanName} ji, SPC Patna se enquiry ke liye call kiya hai.`;
  }

  console.log(`📡 [VAPI] Calling ${type}: ${cleanName} (${cleanPhone})`);

  try {
    const response = await axios.post(
      "https://api.vapi.ai/call/phone",
      {
        assistantId: "4b2f4c82-36fd-4450-8776-083410540e6d",
        phoneNumberId: TWILIO_PHONE_ID,
        customer: { number: cleanPhone, name: cleanName },
        assistantOverrides: {
          voice: {
            provider: "azure",
            voiceId: "hi-IN-SwaraNeural",
            speed: 0.85,
          },
          fillersEnabled: true,
          backchannelingEnabled: true,
          backgroundSound: "office",
          firstMessage: firstMessage,
          model: {
            provider: "openai",
            model: "gpt-4o", // Faster model for lower latency
            messages: [{ role: "system", content: assistantPrompt }],
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    // CRITICAL: .data return karna zaroori hai controller ke liye
    return response.data;
  } catch (err) {
    if (err.response) {
      console.error(
        "🔥 VAPI ERROR:",
        JSON.stringify(err.response.data, null, 2),
      );
    } else {
      console.error("🔥 CONNECTION ERROR:", err.message);
    }
    throw err;
  }
};

module.exports = { triggerCall };

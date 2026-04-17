const admin = require("firebase-admin");
const axios = require("axios");
const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

// --- 1. FIREBASE SETUP ---
const serviceAccount = require("./serviceAccountKey.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

// --- 2. CONFIGURATION (Production IDs) ---
const VAPI_API_KEY = process.env.VAPI_API_KEY;
const ASSISTANT_ID = "4b2f4c82-36fd-4450-8776-083410540e6d"; 
const TWILIO_PHONE_ID = "2378e9d4-8934-406a-a99d-c71d973bdc76"; // Twilio linked ID

// --- 3. AI CALL FUNCTION ---
const triggerAICall = async (orderId, userData) => {
    try {
        console.log(`☎️ Outbound Call Triggered for: ${userData.name} (+91${userData.phone})`);

        const response = await axios.post('https://api.vapi.ai/call/phone', {
            assistantId: ASSISTANT_ID,
            phoneNumberId: TWILIO_PHONE_ID,
            customer: {
                number: `+91${userData.phone}`,
                name: userData.name
            },
            // Assistant ko aur natural banane ke liye yahan extra settings di hain
            assistantOverrides: {
                voice: {
                    provider: "azure",
                    voiceId: "hi-IN-SwaraNeural", // Aapki pasandida natural voice
                    speed: 0.85
                },
                // Background office noise for "Human Feel"
                backgroundSound: "office" 
            }
        }, {
            headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ Call Success! CallID: ${response.data.id}`);

        // Firestore update: Takki admin ko pata chale call gayi hai
        await db.collection('orders').doc(orderId).update({
            callTriggered: true,
            vapiCallId: response.data.id,
            status: "Verification In Progress"
        });

    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error("❌ AI Call Failed:", JSON.stringify(errorData));
    }
};

// --- 4. FIRESTORE REAL-TIME LISTENER ---
const startMonitoring = () => {
    console.log("🚀 SPC Patna Server is Online. Monitoring Orders...");

    db.collection('orders').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const order = change.doc.data();
                const orderId = change.doc.id;

                // Condition: Naya order ho aur pehle call na gayi ho
                if (order.status === 'Pending' || !order.callTriggered) {
                    
                    // Testing ke liye 10s rakha hai, Production mein ise 10 * 60 * 1000 kar dena
                    const waitTime = 10000; 
                    
                    console.log(`📦 New Order [${orderId}] from ${order.userName || "Customer"}. Waiting ${waitTime/1000}s...`);

                    setTimeout(() => {
                        triggerAICall(orderId, {
                            name: order.userName || "Customer",
                            phone: order.phone || order.customerPhone
                        });
                    }, waitTime);
                }
            }
        });
    });
};

// --- 5. SERVER START ---
startMonitoring();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`✅ SPC Backend Live on Port ${PORT}`);
    console.log(`📡 Connection: Firebase -> Vapi -> Twilio`);
    console.log(`-------------------------------------------`);
});
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.json());

// Twilio credentials from .env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// Predefined emergency contacts (Replace with actual numbers)
const emergencyContacts = [
    "+1234567890",
    "+1987654321"
];

// Endpoint to send location via Twilio
app.post("/send-location", async (req, res) => {
    const { latitude, longitude, googleMapsLink } = req.body;
    if (!latitude || !longitude || !googleMapsLink) {
        return res.status(400).json({ success: false, error: "Missing location data" });
    }

    const message = `🚨 Emergency Alert 🚨\nLive location: ${googleMapsLink}`;

    try {
        // Send message to all emergency contacts
        const sendMessages = emergencyContacts.map(phone =>
            client.messages.create({
                from: fromNumber,
                to: phone,
                body: message
            })
        );

        await Promise.all(sendMessages);
        console.log("Location alert sent successfully!");
        res.json({ success: true });
    } catch (error) {
        console.error("Twilio Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


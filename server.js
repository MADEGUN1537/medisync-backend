require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Twilio credentials (used environment variables)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// to enable CORS
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'https://madegun1537.github.io'], // my frontend URL
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.options('/send-sms', cors());

// Send SMS endpoint
app.post('/send-sms', async (req, res) => {
    console.log('Received /send-sms request:', req.body, 'Headers:', req.headers);
    const { to, body } = req.body;
    const authHeader = req.headers.authorization;

    //to  validate authorization
    if (authHeader !== 'Bearer my-unique-token-123') { 
        console.error('Unauthorized request, invalid token:', authHeader);
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // to validate payload
    if (!to || !body) {
        console.error('Invalid payload:', { to, body });
        return res.status(400).json({ status: 'error', message: 'Missing to or body' });
    }

    // to validate phone number format
    if (!/^\+\d{10,15}$/.test(to)) {
        console.error('Invalid phone number format:', to);
        return res.status(400).json({ status: 'error', message: 'Invalid phone number format' });
    }

    try {
        const message = await client.messages.create({
            to: to,
            from: twilioPhone,
            body: body
        });
        console.log(`SMS sent to ${to.slice(0, -4) + "****"} (SID: ${message.sid})`);
        res.json({ status: 'success', sid: message.sid });
    } catch (error) {
        console.error('Twilio API error:', error.message, 'Code:', error.code, 'MoreInfo:', error.moreInfo);
        res.status(500).json({ status: 'error', message: error.message, code: error.code });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

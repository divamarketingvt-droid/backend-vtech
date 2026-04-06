const express = require("express");
const nodemailer = require("nodemailer");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// CONFIGURATION
// ==========================================
const EMAIL_USER = "kovendan16@gmail.com";
const EMAIL_PASS = "bopv udhz zhnv cxzb";
const ADMIN_EMAIL = "kovendan16@gmail.com"; // Main Recipient

// ==========================================
// DEPARTMENT EMAIL CONFIGURATION (FOR CC)
// ==========================================
const DEPARTMENT_EMAILS = {
  service: "kovendan16@gmail.com", 
  career: "hr@verifitech.com", 
  support: "koventhanfreelance@gmail.com", 
  default: ADMIN_EMAIL, 
};

// ZOHO CONFIGURATION
const ZOHO_CONFIG = {
  clientId: process.env.ZOHO_CLIENT_ID || "1000.90OF8B9CSCDZZCEA3I37G3YT98O2HM",
  clientSecret:
    process.env.ZOHO_CLIENT_SECRET ||
    "4d809ec3434feb0b06d70a64a5122f9cd2e5b12c2d",
  refreshToken: process.env.ZOHO_REFRESH_TOKEN || "YOUR_REFRESH_TOKEN",
  accessToken:
    process.env.ZOHO_ACCESS_TOKEN ||
    "1000.1fd24389cab8d999cf9e1607eb9a83a5.60c3071b629b9110b8984ce0bc66ccde",
  apiDomain: "https://www.zohoapis.in",
};

// Helper: Refresh Zoho Access Token
const refreshZohoToken = async () => {
  try {
    console.log("🔄 Refreshing Zoho Token...");
    const response = await axios.post(
      `https://accounts.zoho.in/oauth/v2/token?refresh_token=${ZOHO_CONFIG.refreshToken}&client_id=${ZOHO_CONFIG.clientId}&client_secret=${ZOHO_CONFIG.clientSecret}&grant_type=refresh_token`,
      {}
    );

    if (response.data.access_token) {
      ZOHO_CONFIG.accessToken = response.data.access_token;
      console.log("✅ Zoho Token Refreshed Successfully.");
      return true;
    } else {
      console.error("❌ Refresh failed:", response.data);
      return false;
    }
  } catch (err) {
    console.error("❌ Error refreshing token:", err.message);
    return false;
  }
};

// ==========================================
// MIDDLEWARE
// ==========================================
const allowedOrigins = [
  "https://backend-vtech.onrender.com",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
  "null",
  undefined,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1)
        callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve all static files in public folder
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html on all other routes (for frontend routing)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================================
// STORAGE & HELPERS
// ==========================================
const blockedDomains = [
  "yahoo.com",
  "yahoo.co.in",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
];
const otpStore = new Map();
const verifiedEmails = new Set();

const isBusinessEmail = (email) => {
  if (!email) return false;
  const domain = email.split("@")[1];
  return domain ? !blockedDomains.includes(domain.toLowerCase()) : false;
};

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// FIXED NODemailer TRANSPORTER
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  tls: { rejectUnauthorized: false },
  
  // FIX: Enable pooling
  pool: true,
  maxConnections: 1,
  maxMessages: 5,
  connectionTimeout: 60000, 
  socketTimeout: 60000,
  
  // FIX: Force IPv4
  dns: {
    lookup: function(hostname, options, callback) {
      require('dns').resolve4(hostname, options, function(err, addresses) {
        if (err) return callback(err);
        callback(null, addresses[0], 4);
      });
    }
  }
});

// ==========================================
// API ROUTES
// ==========================================

// 1. SEND OTP
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  if (!isBusinessEmail(email))
    return res
      .status(400)
      .json({ success: false, message: "Please use a business email." });

  try {
    const otp = generateOTP();
    otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    verifiedEmails.delete(email);

    await transporter.sendMail({
      from: `"Verifitech Support" <${EMAIL

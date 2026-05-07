const express = require("express");
const nodemailer = require("nodemailer");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ==========================================
   CONFIG
========================================== */

const EMAIL_USER = "kovendan16@gmail.com";
const EMAIL_PASS = "bopv udhz zhnv cxzb";
const ADMIN_EMAIL = "kovendan16@gmail.com";

const DEPARTMENT_EMAILS = {
  service: "kovendan16@gmail.com",
  career: "hr@verifitech.com",
  support: "csb.2@verifitech.email",
  default: ADMIN_EMAIL,
};

const ZOHO_CONFIG = {
  clientId: "1000.90OF8B9CSCDZZCEA3I37G3YT98O2HM",
  clientSecret: "4d809ec3434feb0b06d70a64a5122f9cd2e5b12c2d",
  refreshToken: "YOUR_REFRESH_TOKEN",
  accessToken: "1000.1fd24389cab8d999cf9e1607eb9a83a5.60c3071b629b9110b8984ce0bc66ccde",
  apiDomain: "https://www.zohoapis.in",
};

/* ==========================================
   MIDDLEWARE
========================================== */

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://violet-wasp-111896.hostingersite.com",
  "https://backend-vtech.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    callback(null, true); // allow all temporarily
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

/* ==========================================
   STATIC FILES
========================================== */

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ==========================================
   HELPERS
========================================== */

const blockedDomains = [
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "gmail.com",
  "icloud.com"
];

const otpStore = new Map();
const verifiedEmails = new Set();

function isBusinessEmail(email) {
  if (!email) return false;
  const domain = email.split("@")[1];
  return domain ? !blockedDomains.includes(domain.toLowerCase()) : false;
}

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

/* ==========================================
   ROUTES
========================================== */

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server running" });
});

/* SEND OTP */
app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ success: false, message: "Email required" });

    if (!isBusinessEmail(email))
      return res.status(400).json({ success: false, message: "Use business email" });

    const otp = generateOTP();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: "Your OTP",
      html: `<h2>Your OTP: ${otp}</h2>`
    });

    res.json({ success: true, message: "OTP sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "OTP failed" });
  }
});

/* VERIFY OTP */
app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const data = otpStore.get(email);

  if (!data)
    return res.status(400).json({ success: false, message: "OTP not found" });

  if (Date.now() > data.expiresAt)
    return res.status(400).json({ success: false, message: "OTP expired" });

  if (data.otp !== otp)
    return res.status(400).json({ success: false, message: "Invalid OTP" });

  otpStore.delete(email);
  verifiedEmails.add(email);

  res.json({ success: true, message: "Verified" });
});

/* CHAT REQUEST */
app.post("/api/submit-request", async (req, res) => {
  try {
    const {
      firstName,
      email,
      phone,
      company,
      department,
      serviceType,
      issueDescription
    } = req.body;

    if (!firstName || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email required"
      });
    }

    const ccEmail =
      DEPARTMENT_EMAILS[department] || DEPARTMENT_EMAILS.default;

    await transporter.sendMail({
      from: EMAIL_USER,
      to: ADMIN_EMAIL,
      cc: ccEmail,
      replyTo: email,
      subject: `New Request - ${firstName}`,
      html: `
        <h2>New Request</h2>
        <p>Name: ${firstName}</p>
        <p>Email: ${email}</p>
        <p>Phone: ${phone || ""}</p>
        <p>Company: ${company || ""}</p>
        <p>Department: ${department || ""}</p>
        <p>Service: ${serviceType || ""}</p>
        <p>Description: ${issueDescription || ""}</p>
      `
    });

    res.json({
      success: true,
      message: "Submitted successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to submit"
    });
  }
});

/* CONTACT FORM */
app.post("/api/submit-contact", async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    await transporter.sendMail({
      from: EMAIL_USER,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: "New Contact Form",
      html: `
        <h2>Contact Form</h2>
        <p>Name: ${fullName}</p>
        <p>Email: ${email}</p>
        <p>Phone: ${phone}</p>
        <p>Message: ${message}</p>
      `
    });

    res.json({
      success: true,
      message: "Contact submitted"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Contact failed"
    });
  }
});

/* FALLBACK */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* START */
app.listen(PORT, () => {
  console.log(`🚀 Server running on PORT ${PORT}`);
});

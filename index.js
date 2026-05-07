const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");

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
  default: ADMIN_EMAIL
};

/* ==========================================
   MIDDLEWARE
========================================== */

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

/* ==========================================
   MAIL TRANSPORTER
========================================== */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000
});

transporter.verify((err) => {
  if (err) console.log("❌ SMTP ERROR:", err.message);
  else console.log("✅ SMTP READY");
});
/* ========================================== MEMORY STORE (OTP) ========================================== */ const otpStore = new Map(); const verifiedEmails = new Set(); /* ========================================== HELPERS ========================================== */ function generateOTP() { return Math.floor(1000 + Math.random() * 9000).toString(); } function isBusinessEmail(email) { const blocked = [ "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com" ]; const domain = email?.split("@")[1]; return domain ? !blocked.includes(domain.toLowerCase()) : false; } /* ========================================== HEALTH CHECK ========================================== */ app.get("/api/health", (req, res) => { res.json({ success: true, message: "Server running" }); }); /* ========================================== 1. SEND OTP ========================================== */ app.post("/api/send-otp", async (req, res) => { const { email } = req.body; if (!email) { return res.status(400).json({ success: false, message: "Email required" }); } if (!isBusinessEmail(email)) { return res.status(400).json({ success: false, message: "Please use business email only" }); } try { const otp = generateOTP(); otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); verifiedEmails.delete(email); await transporter.sendMail({ from: "Verifitech OTP" <${EMAIL_USER}>, to: email, subject: "Your OTP Code", html: <div style="text-align:center;font-family:Arial"> <h2>Email Verification</h2> <p>Your OTP is:</p> <h1 style="letter-spacing:6px">${otp}</h1> <p>Valid for 5 minutes</p> </div> }); console.log("✅ OTP SENT:", email); res.json({ success: true, message: "OTP sent" }); } catch (err) { console.error(err); res.status(500).json({ success: false, message: "OTP failed" }); } }); /* ========================================== 2. VERIFY OTP ========================================== */ app.post("/api/verify-otp", (req, res) => { const { email, otp } = req.body; const data = otpStore.get(email); if (!data) { return res.status(400).json({ success: false, message: "OTP not found" }); } if (Date.now() > data.expiresAt) { otpStore.delete(email); return res.status(400).json({ success: false, message: "OTP expired" }); } if (data.otp !== otp) { return res.status(400).json({ success: false, message: "Invalid OTP" }); } otpStore.delete(email); verifiedEmails.add(email); res.json({ success: true, message: "Email verified" }); }); /* ========================================== 3. SUBMIT TRIAL (OTP PROTECTED) ========================================== */ app.post("/api/submit-trial", async (req, res) => { const { leadData, selectedChecks } = req.body; if (!leadData?.email || !verifiedEmails.has(leadData.email)) { return res.status(403).json({ success: false, message: "Email not verified" }); } try { const checksHtml = selectedChecks?.length ? selectedChecks.map(c => <li>${JSON.stringify(c)}</li>).join("") : "<li>None selected</li>"; await transporter.sendMail({ from: "Verifitech Website" <${EMAIL_USER}>, to: ADMIN_EMAIL, replyTo: leadData.email, subject: New Trial Lead: ${leadData.name}, html: <h2>New Trial Request</h2> <p><b>Name:</b> ${leadData.name}</p> <p><b>Email:</b> ${leadData.email}</p> <p><b>Phone:</b> ${leadData.phone || "N/A"}</p> <p><b>Company:</b> ${leadData.company || "N/A"}</p> <h3>Services</h3> <ul>${checksHtml}</ul> }); verifiedEmails.delete(leadData.email); res.json({ success: true, message: "Trial submitted" }); } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Submission failed" }); } });

/* ==========================================
   4. CHAT REQUEST
========================================== */

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

    const ccEmail = DEPARTMENT_EMAILS[department] || DEPARTMENT_EMAILS.default;

    await transporter.sendMail({
      from: `"Website" <${EMAIL_USER}>`,
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
        <p>Service: ${serviceType || ""}</p>
        <p>Message: ${issueDescription || ""}</p>
      `
    });

    res.json({ success: true, message: "Submitted" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================
   5. CONTACT FORM
========================================== */

app.post("/api/submit-contact", async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    await transporter.sendMail({
      from: `"Contact" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `Contact - ${fullName}`,
      html: `
        <h2>Contact Form</h2>
        <p>Name: ${fullName}</p>
        <p>Email: ${email}</p>
        <p>Phone: ${phone || ""}</p>
        <p>Message: ${message || ""}</p>
      `
    });

    res.json({ success: true, message: "Contact sent" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================
   4. CHAT REQUEST
========================================== */

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

    const ccEmail = DEPARTMENT_EMAILS[department] || DEPARTMENT_EMAILS.default;

    await transporter.sendMail({
      from: `"Website" <${EMAIL_USER}>`,
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
        <p>Service: ${serviceType || ""}</p>
        <p>Message: ${issueDescription || ""}</p>
      `
    });

    res.json({ success: true, message: "Submitted" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================
   5. CONTACT FORM
========================================== */

app.post("/api/submit-contact", async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    await transporter.sendMail({
      from: `"Contact" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `Contact - ${fullName}`,
      html: `
        <h2>Contact Form</h2>
        <p>Name: ${fullName}</p>
        <p>Email: ${email}</p>
        <p>Phone: ${phone || ""}</p>
        <p>Message: ${message || ""}</p>
      `
    });

    res.json({ success: true, message: "Contact sent" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================
   START SERVER
========================================== */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

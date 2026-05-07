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

const otpStore = new Map();
const verifiedEmails = new Set();

/* ==========================================
   BUSINESS EMAIL CHECK
========================================== */

function isBusinessEmail(email) {
  if (!email) return false;

  const blockedDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com"
  ];

  const domain = email.split("@")[1];

  return domain
    ? !blockedDomains.includes(domain.toLowerCase())
    : false;
}

/* ==========================================
   OTP GENERATOR
========================================== */

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/* ==========================================
   MAIL CONFIG
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

/* CHECK SMTP */
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ SMTP ERROR:", error.message);
  } else {
    console.log("✅ SMTP READY");
  }
});

/* ==========================================
   ROUTES
========================================== */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server running"
  });
});

/* ==========================================
   SEND OTP
========================================== */

app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required"
      });
    }

    if (!isBusinessEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Use business email only"
      });
    }

    const otp = generateOTP();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    const info = await transporter.sendMail({
      from: `"OTP Verification" <${EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes.</p>
      `
    });

    console.log("✅ OTP SENT:", info.messageId);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (err) {
    console.log("❌ OTP ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/* ==========================================
   VERIFY OTP
========================================== */

app.post("/api/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;

    const data = otpStore.get(email);

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "OTP not found"
      });
    }

    if (Date.now() > data.expiresAt) {
      otpStore.delete(email);

      return res.status(400).json({
        success: false,
        message: "OTP expired"
      });
    }

    if (data.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    otpStore.delete(email);
    verifiedEmails.add(email);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (err) {
    console.log("❌ VERIFY ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Verification failed"
    });
  }
});

/*
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

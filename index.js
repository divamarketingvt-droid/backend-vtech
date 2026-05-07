const express = require("express");
const nodemailer = require("nodemailer");
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

/* ==========================================
   STATIC WEBSITE
========================================== */

app.use(express.static(path.join(__dirname, "public")));

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

/* CHECK SMTP ON START */
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ SMTP ERROR:", error.message);
  } else {
    console.log("✅ SMTP READY");
  }
});

/* ==========================================
   HEALTH CHECK
========================================== */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server running"
  });
});

/* ==========================================
   CHAT REQUEST
========================================== */

app.post("/api/submit-request", async (req, res) => {
  try {
    console.log("📥 Chat Request:", req.body);

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

    const info = await transporter.sendMail({
      from: `"Verifitech Website" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      cc: ccEmail,
      replyTo: email,
      subject: `New Request - ${firstName}`,
      html: `
        <h2>New Website Request</h2>
        <p><strong>Name:</strong> ${firstName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || ""}</p>
        <p><strong>Company:</strong> ${company || ""}</p>
        <p><strong>Department:</strong> ${department || ""}</p>
        <p><strong>Service:</strong> ${serviceType || ""}</p>
        <p><strong>Description:</strong> ${issueDescription || ""}</p>
      `
    });

    console.log("✅ MAIL SENT:", info.messageId);

    return res.status(200).json({
      success: true,
      message: "Submitted successfully"
    });

  } catch (err) {
    console.log("❌ CHAT ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/* ==========================================
   CONTACT FORM
========================================== */

app.post("/api/submit-contact", async (req, res) => {
  try {
    console.log("📥 Contact Form:", req.body);

    const {
      fullName,
      email,
      phone,
      message
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email required"
      });
    }

    const info = await transporter.sendMail({
      from: `"Website Contact" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `New Contact - ${fullName}`,
      html: `
        <h2>New Contact Form</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || ""}</p>
        <p><strong>Message:</strong> ${message || ""}</p>
      `
    });

    console.log("✅ CONTACT MAIL SENT:", info.messageId);

    return res.status(200).json({
      success: true,
      message: "Contact submitted"
    });

  } catch (err) {
    console.log("❌ CONTACT ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/* ==========================================
   START SERVER
========================================== */

app.listen(PORT, () => {
  console.log(`🚀 Server running on PORT ${PORT}`);
});

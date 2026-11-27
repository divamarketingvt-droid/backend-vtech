require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const blogRoutes = require("./blog/routes");
const { preloaderMiddleware } = require("./blog/preloader");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

/* ==========================================
   CONFIG
========================================== */

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || EMAIL_USER;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn("⚠️  EMAIL_USER / EMAIL_PASS missing in .env — emails will fail");
}

const DEPARTMENT_EMAILS = {
  service: "connect@verifitech.com",
  career: "hr@verifitech.com",
  support: [
    "csb.1@verifitech.email",
    "csb.2@verifitech.email",
    "csb.3@verifitech.email"
  ],
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
   DYNAMIC SITEMAP (site pages + blog posts)
   Must come before express.static so it wins over public/sitemap.xml,
   which is still used as the list of normal site pages.
========================================== */

app.get("/sitemap.xml", blogRoutes.sitemapHandler);

/* ==========================================
   SITE-WIDE PRELOADER (Verifitech logo loading screen)
   Adds it to every .html page in public/ — see blog/preloader.js.
   Turn off with PRELOADER=false in .env
========================================== */

app.use(preloaderMiddleware(path.join(__dirname, "public")));

/* ==========================================
   STATIC WEBSITE
========================================== */

app.use(
  express.static(path.join(__dirname, "public"), {
    extensions: ["html"]
  })
);

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
  if (err) {
    console.log("❌ SMTP ERROR:", err.message);
  } else {
    console.log("✅ SMTP READY");
  }
});

/* ==========================================
   MEMORY STORE (OTP)
========================================== */

const otpStore = new Map();
const verifiedEmails = new Set();

/* ==========================================
   HELPERS
========================================== */

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function isBusinessEmail(email) {
  const blocked = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com"
  ];

  const domain = email?.split("@")[1];

  return domain
    ? !blocked.includes(domain.toLowerCase())
    : false;
}

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
   1. SEND OTP
========================================== */

app.post("/api/send-otp", async (req, res) => {

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
      message: "Please use business email only"
    });
  }

  try {

    const otp = generateOTP();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    verifiedEmails.delete(email);

    await transporter.sendMail({
      from: `"Verifitech OTP" <${EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <div style="text-align:center;font-family:Arial">

          <h2>Email Verification</h2>

          <p>Your OTP is:</p>

          <h1 style="letter-spacing:6px">
            ${otp}
          </h1>

          <p>Valid for 5 minutes</p>

        </div>
      `
    });

    console.log("✅ OTP SENT:", email);

    res.json({
      success: true,
      message: "OTP sent"
    });

  } catch (err) {

    console.error("❌ OTP ERROR:", err);

    res.status(500).json({
      success: false,
      message: "OTP failed"
    });
  }
});

/* ==========================================
   2. VERIFY OTP
========================================== */

app.post("/api/verify-otp", (req, res) => {

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

  res.json({
    success: true,
    message: "Email verified"
  });
});

/* ==========================================
   3. SUBMIT TRIAL
========================================== */

app.post("/api/submit-trial", async (req, res) => {

  const { leadData, selectedChecks } = req.body;

  if (
    !leadData?.email ||
    !verifiedEmails.has(leadData.email)
  ) {
    return res.status(403).json({
      success: false,
      message: "Email not verified"
    });
  }

  try {

    const checksHtml =
      selectedChecks?.length
        ? selectedChecks
            .map(c => `<li>${JSON.stringify(c)}</li>`)
            .join("")
        : "<li>None selected</li>";

    await transporter.sendMail({
      from: `"Verifitech Website" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      replyTo: leadData.email,
      subject: `New Trial Lead: ${leadData.name}`,

      html: `
        <h2>New Trial Request</h2>

        <p>
          <b>Name:</b>
          ${leadData.name}
        </p>

        <p>
          <b>Email:</b>
          ${leadData.email}
        </p>

        <p>
          <b>Phone:</b>
          ${leadData.phone || "N/A"}
        </p>

        <p>
          <b>Company:</b>
          ${leadData.company || "N/A"}
        </p>

        <h3>Services</h3>

        <ul>
          ${checksHtml}
        </ul>
      `
    });

    verifiedEmails.delete(leadData.email);

    res.json({
      success: true,
      message: "Trial submitted"
    });

  } catch (err) {

    console.error("❌ TRIAL ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Submission failed"
    });
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

    const ccEmail =
      DEPARTMENT_EMAILS[department] ||
      DEPARTMENT_EMAILS.default;

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

    res.json({
      success: true,
      message: "Submitted"
    });

  } catch (err) {

    console.error("❌ REQUEST ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/* ==========================================
   5. CONTACT FORM
========================================== */

app.post("/api/submit-contact", async (req, res) => {

  try {

    const {
      fullName,
      email,
      phone,
      message
    } = req.body;

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

    res.json({
      success: true,
      message: "Contact sent"
    });

  } catch (err) {

    console.error("❌ CONTACT ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


/* ==========================================
   6. MINT SOLUTIONS (UAE) ENQUIRY FORM
========================================== */

const MINT_ENQUIRY_RECIPIENTS = (
  process.env.MINT_ENQUIRY_TO ||
  "ranjith20112@gmail.com,kovendan16@gmail.com"
).split(",").map(e => e.trim()).filter(Boolean);

const MINT_ENQUIRY_CC = (process.env.MINT_ENQUIRY_CC || "")
  .split(",").map(e => e.trim()).filter(Boolean);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

app.post("/api/submit-mint-enquiry", async (req, res) => {

  const {
    fullName,
    company,
    email,
    phone,
    interest,
    message
  } = req.body || {};

  if (!fullName || !company || !email) {
    return res.status(400).json({
      success: false,
      message: "Name, company and email are required"
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email address"
    });
  }

  try {

    await transporter.sendMail({
      from: `"New Enquiry" <${EMAIL_USER}>`,
      to: MINT_ENQUIRY_RECIPIENTS,
      ...(MINT_ENQUIRY_CC.length && { cc: MINT_ENQUIRY_CC }),
      replyTo: email,
      subject: `New UAE Enquiry - ${String(fullName).slice(0, 100)}`,
      html: `
        <h2>New Enquiry Received - Verifitech</h2>
        <p><b>Name:</b> ${escapeHtml(fullName)}</p>
        <p><b>Company:</b> ${escapeHtml(company)}</p>
        <p><b>Email:</b> ${escapeHtml(email)}</p>
        <p><b>Phone:</b> ${escapeHtml(phone) || "N/A"}</p>
        <p><b>Interested In:</b> ${escapeHtml(interest) || "N/A"}</p>
        <p><b>Message:</b><br>${escapeHtml(message).replace(/\n/g, "<br>") || "N/A"}</p>
      `
    });

    console.log("✅ MINT ENQUIRY SENT:", email);

    // Auto-reply to the visitor (a failure here does not fail the enquiry)
    if (process.env.MINT_AUTOREPLY !== "false") {
      transporter.sendMail({
        from: `"Verifitech" <${EMAIL_USER}>`,
        to: email,
        subject: "We received your enquiry - Verifitech",
        html: `
          <div style="font-family:Arial,sans-serif;font-size:15px;color:#222;line-height:1.6">
            <p>Hi ${escapeHtml(fullName)},</p>
            <p>Thank you for contacting Verifitech. We have received your enquiry
            ${interest ? `about <b>${escapeHtml(interest)}</b>` : ""} and our team
            will get back to you within one business day.</p>
            <p><b>Your details:</b><br>
              Company: ${escapeHtml(company)}<br>
              Phone: ${escapeHtml(phone) || "N/A"}<br>
              Message: ${escapeHtml(message).replace(/\n/g, "<br>") || "N/A"}
            </p>
            <p>Regards,<br>Team Verifitech<br>+91 9176663777</p>
            <p style="font-size:12px;color:#888">This is an automated message. Please do not reply to this email.</p>
          </div>
        `
      })
        .then(() => console.log("✅ MINT AUTO-REPLY SENT:", email))
        .catch(err => console.error("❌ MINT AUTO-REPLY ERROR:", err.message));
    }

    res.json({
      success: true,
      message: "Enquiry sent"
    });

  } catch (err) {

    console.error("❌ MINT ENQUIRY ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to send enquiry"
    });
  }
});


/* ==========================================
   BLOG (own posts + admin panel)
   /blog/:slug, /blog/category/:slug, /blog-admin,
   /api/blogs, /api/blog-admin/*  — see blog/routes.js
========================================== */

app.use(blogRoutes);


/* =========================================================
   CUSTOM 404 ERROR PAGE
   IMPORTANT: KEEP THIS AFTER ALL YOUR ROUTES
========================================================= */

app.use((req, res, next) => {

  // API URLs should return JSON
  if (req.path.startsWith("/api/")) {

    return res.status(404).json({
      success: false,
      message: "API endpoint not found"
    });

  }

  // Normal website URL → custom 404 page (public/404/404.html)
  res.status(404).sendFile(
    path.join(__dirname, "public", "404", "404.html"),
    (err) => {
      if (err && !res.headersSent) res.status(404).type("text").send("404 - Page not found");
    }
  );

});


/* =========================================================
   GLOBAL ERROR HANDLER
   IMPORTANT: THIS MUST BE THE LAST app.use()
========================================================= */

app.use((err, req, res, next) => {

  console.error("❌ GLOBAL SERVER ERROR:", err);

  // API request → JSON response
  if (req.path.startsWith("/api/")) {

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }

  if (res.headersSent) return next(err);

  // Website request → custom error page (500.html in the project root)
  res.status(500).sendFile(
    path.join(__dirname, "500.html"),
    (sendErr) => {
      if (sendErr && !res.headersSent) res.status(500).type("text").send("500 - Something went wrong");
    }
  );

});


/* ==========================================
   START SERVER
========================================== */

app.listen(PORT, () => {

  console.log(`✅ Server running on port ${PORT}`);

});

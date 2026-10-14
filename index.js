
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// 1. BASIC CONFIGURATION
// --------------------------------------------------

app.disable("x-powered-by");

app.use(
  cors({
    origin: [
      "https://verifitech.com",
      "https://www.verifitech.com",
      "http://localhost:3000",
      "http://localhost:5000",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5000"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// --------------------------------------------------
// 2. EMAIL CONFIGURATION
// --------------------------------------------------

// Configure these values in your hosting environment.
// Never place your real email password in this file.
const EMAIL_USER = "ranjith20112@gmail.com";
const EMAIL_PASS = "ctrcjjgomatpfmoz"; // Added quotes and removed spaces if it's an app password
const ADMIN_EMAIL = "connect@verifitech.com" || EMAIL_USER;
if (!EMAIL_USER || !EMAIL_PASS) {
  console.error(
    "Email configuration missing. Set EMAIL_USER and EMAIL_PASS."
  );
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000
});

// Check SMTP credentials when the server starts.
if (EMAIL_USER && EMAIL_PASS) {
  transporter.verify()
    .then(() => {
      console.log("SMTP connection and authentication successful.");
    })
    .catch((err) => {
      console.error("SMTP verification failed:", {
        message: err.message,
        code: err.code,
        responseCode: err.responseCode
      });
    });
}

// --------------------------------------------------
// 3. OTP STORAGE
// --------------------------------------------------

// This uses in-memory storage. OTPs are lost if the
// server restarts, and storage is not shared between
// multiple server instances.

const otpStore = new Map();
const verifiedEmails = new Set();

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_RESEND_DELAY_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const blockedEmailDomains = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "mail.com"
]);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isBusinessEmail(email) {
  if (!isValidEmail(email)) return false;

  const domain = email.split("@")[1];

  return !blockedEmailDomains.has(domain);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return replacements[char];
  });
}

function getSafeError(err) {
  return {
    message: err.message,
    code: err.code,
    command: err.command,
    responseCode: err.responseCode
  };
}

// --------------------------------------------------
// 4. HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server running"
  });
});

// --------------------------------------------------
// 5. SEND OTP
// --------------------------------------------------

app.post("/api/send-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address."
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    if (!isBusinessEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please use your business email address."
      });
    }

    if (!EMAIL_USER || !EMAIL_PASS) {
      console.error("OTP cannot be sent: email credentials are missing.");

      return res.status(500).json({
        success: false,
        message: "Email service is not configured. Please contact support."
      });
    }

    const existing = otpStore.get(email);
    const now = Date.now();

    // Prevent rapid resend requests.
    if (
      existing &&
      existing.lastSentAt &&
      now - existing.lastSentAt < OTP_RESEND_DELAY_MS
    ) {
      const secondsRemaining = Math.ceil(
        (OTP_RESEND_DELAY_MS - (now - existing.lastSentAt)) / 1000
      );

      return res.status(429).json({
        success: false,
        message: `Please wait ${secondsRemaining} seconds before requesting another OTP.`
      });
    }

    // Four-digit OTP to match your existing frontend.
    const otp = String(
      Math.floor(1000 + Math.random() * 9000)
    );

    const mailOptions = {
      from: `"Verifitech" <${EMAIL_USER}>`,
      to: email,
      subject: "Your Verifitech Email Verification OTP",
      text: [
        "Hello,",
        "",
        `Your Verifitech verification code is: ${otp}`,
        "",
        "This code expires in 5 minutes.",
        "If you did not request this code, please ignore this email.",
        "",
        "Regards,",
        "Verifitech Team"
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#1f2937">
          <h2 style="color:#0f766e">Verifitech Email Verification</h2>
          <p>Hello,</p>
          <p>Use the following code to verify your email address:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:18px;background:#f3f4f6;text-align:center;border-radius:8px">
            ${otp}
          </div>
          <p>This code expires in <strong>5 minutes</strong>.</p>
          <p>If you did not request this code, please ignore this email.</p>
          <p>Regards,<br>Verifitech Team</p>
        </div>
      `
    };

    // Send the email first. Save the OTP only if sending succeeds.
    await transporter.sendMail(mailOptions);

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      lastSentAt: Date.now(),
      attempts: 0
    });

    // A newly sent OTP requires verification again.
    verifiedEmails.delete(email);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your business email."
    });
  } catch (err) {
    console.error("OTP EMAIL ERROR:", getSafeError(err));

    return res.status(500).json({
      success: false,
      message: "Unable to send OTP. Please try again later."
    });
  }
});

// --------------------------------------------------
// 6. VERIFY OTP
// --------------------------------------------------

app.post("/api/verify-otp", (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!isValidEmail(email) || !/^\d{4}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email and 4-digit OTP."
      });
    }

    const record = otpStore.get(email);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new OTP."
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      verifiedEmails.delete(email);

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP."
      });
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      otpStore.delete(email);
      verifiedEmails.delete(email);

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new OTP."
      });
    }

    if (record.otp !== otp) {
      record.attempts += 1;

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP. Please try again."
      });
    }

    otpStore.delete(email);
    verifiedEmails.add(email);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully."
    });
  } catch (err) {
    console.error("OTP VERIFICATION ERROR:", getSafeError(err));

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP. Please try again."
    });
  }
});

// --------------------------------------------------
// 7. REUSABLE FORM EMAIL FUNCTION
// --------------------------------------------------

async function sendFormEmail(subject, formData, replyTo) {
  if (!EMAIL_USER || !EMAIL_PASS || !ADMIN_EMAIL) {
    throw new Error("Email configuration is incomplete.");
  }

  const safeData = Object.entries(formData || {})
    .filter(([key]) => !/password|otp|token|secret/i.test(key))
    .map(([key, value]) => {
      const displayValue =
        typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : String(value ?? "");

      return `<tr>
        <td style="padding:8px;border:1px solid #ddd;font-weight:bold">
          ${escapeHtml(key)}
        </td>
        <td style="padding:8px;border:1px solid #ddd">
          ${escapeHtml(displayValue)}
        </td>
      </tr>`;
    })
    .join("");

  const mailOptions = {
    from: `"Verifitech Website" <${EMAIL_USER}>`,
    to: ADMIN_EMAIL,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>${escapeHtml(subject)}</h2>
        <table style="border-collapse:collapse;width:100%">
          ${safeData}
        </table>
      </div>
    `
  };

  // Only set Reply-To when a valid email was provided.
  if (replyTo && isValidEmail(replyTo)) {
    mailOptions.replyTo = replyTo;
  }

  return transporter.sendMail(mailOptions);
}

// --------------------------------------------------
// 8. SUBMIT TRIAL FORM
// --------------------------------------------------

app.post("/api/submit-trial", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
      });
    }

    if (!verifiedEmails.has(email)) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before submitting the trial form."
      });
    }

    await sendFormEmail(
      "New Verifitech Free Trial Request",
      req.body,
      email
    );

    // Consume verification after successful submission.
    verifiedEmails.delete(email);

    return res.status(200).json({
      success: true,
      message: "Your trial request has been submitted successfully."
    });
  } catch (err) {
    console.error("TRIAL SUBMISSION ERROR:", getSafeError(err));

    return res.status(500).json({
      success: false,
      message: "Unable to submit your trial request. Please try again."
    });
  }
});

// --------------------------------------------------
// 9. SUBMIT REQUEST FORM
// --------------------------------------------------

app.post("/api/submit-request", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide your request details."
      });
    }

    await sendFormEmail(
      "New Verifitech Website Request",
      req.body,
      email
    );

    return res.status(200).json({
      success: true,
      message: "Your request has been submitted successfully."
    });
  } catch (err) {
    console.error("REQUEST SUBMISSION ERROR:", getSafeError(err));

    return res.status(500).json({
      success: false,
      message: "Unable to submit your request. Please try again."
    });
  }
});

// --------------------------------------------------
// 10. SUBMIT CONTACT FORM
// --------------------------------------------------

app.post("/api/submit-contact", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide your contact details."
      });
    }

    await sendFormEmail(
      "New Verifitech Contact Form Submission",
      req.body,
      email
    );

    return res.status(200).json({
      success: true,
      message: "Your message has been submitted successfully."
    });
  } catch (err) {
    console.error("CONTACT SUBMISSION ERROR:", getSafeError(err));

    return res.status(500).json({
      success: false,
      message: "Unable to submit your message. Please try again."
    });
  }
});

// --------------------------------------------------
// 11. SERVE WEBSITE FILES
// --------------------------------------------------

app.use(
  express.static(path.join(__dirname, "public"), {
    extensions: ["html"]
  })
);

// --------------------------------------------------
// 12. NOT-FOUND HANDLER
// --------------------------------------------------

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

// --------------------------------------------------
// 13. GENERAL ERROR HANDLER
// --------------------------------------------------

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", getSafeError(err));

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "An internal server error occurred."
  });
});

// --------------------------------------------------
// 14. START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`Verifitech server running on port ${PORT}`);
});

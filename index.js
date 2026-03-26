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
const EMAIL_USER = process.env.EMAIL_USER || "kovendan16@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "bsjr nvji izgg jvvs";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "kovendan16@gmail.com";

// ==========================================
// DEPARTMENT EMAIL CONFIGURATION (NEW)
// ==========================================
const DEPARTMENT_EMAILS = {
  service: "kovendan16@gmail.com", // Replace with actual service email
  career: "hr@verifitech.com", // Replace with actual HR email
  support: "koventhanfreelance@gmail.com", // Replace with actual Support email
  default: ADMIN_EMAIL, // Fallback email
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
/*const STATIC_PATH = path.join(__dirname, "public", "index.html");
app.use(express.static(STATIC_PATH));*/

// ==========================================
// STORAGE & HELPERS
// ==========================================
const blockedDomains = [
  "gmail.com",
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

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
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
      from: `"Verifitech Support" <${EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - Verifitech Free Trial",
      html: `<div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;"><h2 style="color: #1ac2c1;">Email Verification</h2><p>Your OTP is:</p><div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">${otp}</div><p>Valid for 5 minutes.</p></div>`,
    });

    console.log(`✅ OTP sent to ${email}`);
    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});

// 2. VERIFY OTP
app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const storedData = otpStore.get(email);

  if (!storedData)
    return res.status(400).json({ success: false, message: "No OTP found." });
  if (Date.now() > storedData.expiresAt)
    return res.status(400).json({ success: false, message: "OTP expired." });

  if (storedData.otp === otp) {
    otpStore.delete(email);
    verifiedEmails.add(email);
    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }
});

// 3. SUBMIT TRIAL
app.post("/api/submit-trial", async (req, res) => {
  const { leadData, selectedChecks, candidateData } = req.body;

  if (!leadData || !leadData.email || !verifiedEmails.has(leadData.email)) {
    return res
      .status(403)
      .json({ success: false, message: "Email not verified." });
  }

  // --- PREPARE DATA ---
  let checksListHtml = "<li>None selected</li>";
  let checksTextForZoho = "None selected";

  if (selectedChecks && selectedChecks.length > 0) {
    checksListHtml = selectedChecks
      .map((c) => {
        if (typeof c === "object" && c !== null) {
          const details = Object.entries(c)
            .map(([key, val]) => `<strong>${key}:</strong> ${val}`)
            .join(" | ");
          return `<li>${details}</li>`;
        }
        return `<li>${c}</li>`;
      })
      .join("");
    checksTextForZoho = JSON.stringify(selectedChecks);
  }

  // --- SEND EMAIL ---
  try {
    console.log("📧 Sending Trial email...");
    await transporter.sendMail({
      from: `"Verifitech Website" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      replyTo: leadData.email,
      subject: `New Trial Lead: ${leadData.company || leadData.name}`,
      html: `<h2>New Free Trial Request</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <h3>Lead Details</h3>
        <ul><li>Name: ${leadData.name}</li><li>Email: ${
        leadData.email
      }</li><li>Phone: ${leadData.phone || "N/A"}</li><li>Company: ${
        leadData.company || "N/A"
      }</li></ul>
        <h3>Selected Services</h3><ul>${checksListHtml}</ul>`,
    });
    console.log("✅ Email sent.");
  } catch (err) {
    console.error("❌ Email failed:", err);
  }

  // --- SEND TO ZOHO ---
  try {
    console.log("☁️ Sending to Zoho...");

    const nameParts = (leadData.name || "Unknown Lead").split(" ");
    const zohoPayload = {
      data: [
        {
          First_Name: nameParts[0],
          Last_Name:
            nameParts.length > 1 ? nameParts.slice(1).join(" ") : "N/A",
          Email: leadData.email,
          Phone: leadData.phone,
          Company: leadData.company || "Not Provided",
          Lead_Source: "Website Free Trial",
          Description: `Services: ${checksTextForZoho}`,
        },
      ],
    };

    const ZOHO_API_URL = `${ZOHO_CONFIG.apiDomain}/crm/v2/Leads`;

    let response = await axios.post(ZOHO_API_URL, zohoPayload, {
      headers: { Authorization: `Zoho-oauthtoken ${ZOHO_CONFIG.accessToken}` },
    });

    if (response.data && response.data.code === "INVALID_TOKEN") {
      console.log("⚠️ Token invalid, refreshing...");
      const refreshed = await refreshZohoToken();
      if (refreshed) {
        response = await axios.post(ZOHO_API_URL, zohoPayload, {
          headers: {
            Authorization: `Zoho-oauthtoken ${ZOHO_CONFIG.accessToken}`,
          },
        });
      }
    }

    console.log("✅ Data pushed to Zoho CRM.");
  } catch (zohoErr) {
    if (zohoErr.response && zohoErr.response.status === 401) {
      const refreshed = await refreshZohoToken();
      if (refreshed) {
        try {
          await axios.post(
            `${ZOHO_CONFIG.apiDomain}/crm/v2/Leads`,
            zohoPayload,
            {
              headers: {
                Authorization: `Zoho-oauthtoken ${ZOHO_CONFIG.accessToken}`,
              },
            }
          );
          console.log("✅ Data pushed to Zoho CRM (after retry).");
        } catch (retryErr) {
          console.error(
            "❌ Zoho failed after retry:",
            retryErr.response?.data || retryErr.message
          );
        }
      }
    } else {
      console.error(
        "❌ Zoho CRM error:",
        zohoErr.response?.data || zohoErr.message
      );
    }
  }

  verifiedEmails.delete(leadData.email);
  res
    .status(200)
    .json({ success: true, message: "Trial started successfully!" });
});

// ==========================================
// ==========================================
// ==========================================
// 4. CHATBOT SUBMISSION (UPDATED, NON-BLOCKING)
// ==========================================
app.post("/api/submit-request", (req, res) => {
  console.log("📦 Chat Request Received:", req.body);

  const {
    firstName,
    email,
    phone,
    company,
    department,
    serviceType,
    issueDescription,
  } = req.body;

  if (!firstName || !email) {
    return res
      .status(400)
      .json({ success: false, message: "Name and Email are required." });
  }

  const recipientEmail =
    DEPARTMENT_EMAILS[department] || DEPARTMENT_EMAILS.default;
  console.log(
    `📩 Routing email to: ${recipientEmail} (Dept: ${department || "General"})`
  );

  // Respond immediately to frontend
  res.status(200).json({
    success: true,
    message: "Request submitted successfully",
    data: { emailSentTo: recipientEmail },
  });

  // --- Background async processing ---
  (async () => {
    try {
      // 1️⃣ Send Email Notification
      console.log("📧 Sending Chat Lead email...");
      await transporter.sendMail({
        from: `"Verifitech Chat" <${EMAIL_USER}>`,
        to: recipientEmail,
        replyTo: email,
        subject: `New Chat Request: ${department || "General"} - ${firstName}`,
        html: `
          <h2>New Chat Request</h2>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <h3>User Details</h3>
          <ul>
            <li><strong>Name:</strong> ${firstName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phone || "Not Provided"}</li>
            <li><strong>Company:</strong> ${company || "Not Provided"}</li>
          </ul>
          <h3>Request Details</h3>
          <ul>
            <li><strong>Department:</strong> ${department || "N/A"}</li>
            <li><strong>Service:</strong> ${serviceType || "N/A"}</li>
            <li><strong>Description:</strong> ${issueDescription || "N/A"}</li>
          </ul>
        `,
      });
      console.log("✅ Chat email sent.");
    } catch (emailErr) {
      console.error("❌ Chat email failed:", emailErr.message);
    }

    try {
      // 2️⃣ Send to Zoho CRM
      console.log("☁️ Sending Chat Lead to Zoho...");
      const zohoPayload = {
        data: [
          {
            First_Name: firstName.split(" ")[0],
            Last_Name: firstName.split(" ").slice(1).join(" ") || "N/A",
            Email: email,
            Phone: phone,
            Company: company || "Not Provided",
            Lead_Source: "Website Chatbot",
            Description: `Dept: ${department}, Service: ${serviceType}, Issue: ${
              issueDescription || "N/A"
            }`,
          },
        ],
      };

      const ZOHO_API_URL = `${ZOHO_CONFIG.apiDomain}/crm/v2/Leads`;

      let response = await axios.post(ZOHO_API_URL, zohoPayload, {
        headers: { Authorization: `Zoho-oauthtoken ${ZOHO_CONFIG.accessToken}` },
      });

      if (response.data && response.data.code === "INVALID_TOKEN") {
        console.log("⚠️ Zoho token invalid, refreshing...");
        const refreshed = await refreshZohoToken();
        if (refreshed) {
          await axios.post(ZOHO_API_URL, zohoPayload, {
            headers: { Authorization: `Zoho-oauthtoken ${ZOHO_CONFIG.accessToken}` },
          });
        }
      }

      console.log("✅ Chat lead pushed to Zoho.");
    } catch (zohoErr) {
      console.error("❌ Zoho Chat Error:", zohoErr.response?.data || zohoErr.message);
    }
  })();
});
// ==========================================
// 5. CONTACT PAGE SUBMISSION (NEW)
// ==========================================
app.post("/api/submit-contact", async (req, res) => {
  console.log("📬 Contact Form Request Received:", req.body);

  const { fullName, email, phone, company, lookingFor, message, userType } =
    req.body;

  // 1. Basic Validation
  if (!fullName || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: "Name, Email, and Phone are required.",
    });
  }

  // 2. Business Email Validation (For Business User Type)
  if (userType === "business" && !isBusinessEmail(email)) {
    return res.status(400).json({
      success: false,
      message:
        "Please enter a valid business email address (Gmail, Yahoo, etc. are not accepted).",
    });
  }

  // 3. OTP Verification Check
  // Ensure the user verified their email via OTP before submitting
  if (!verifiedEmails.has(email)) {
    return res.status(403).json({
      success: false,
      message: "Email not verified. Please verify your email with OTP first.",
    });
  }

  // 4. Determine Recipient (Sales Email)
  const recipientEmail = DEPARTMENT_EMAILS.service; // or ADMIN_EMAIL

  // 5. Send Email Notification
  try {
    console.log("📧 Sending Contact Form email...");
    await transporter.sendMail({
      from: `"Verifitech Website" <${EMAIL_USER}>`,
      to: recipientEmail,
      replyTo: email,
      subject: `New Contact Lead: ${fullName} - ${company || "Individual"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #1ac2c1; border-bottom: 2px solid #1ac2c1; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          
          <h3 style="background: #f9f9f9; padding: 10px;">User Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Type:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-transform: capitalize;">${
                userType || "N/A"
              }</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Company:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${
                company || "Not Provided"
              }</td>
            </tr>
          </table>

          <h3 style="background: #f9f9f9; padding: 10px; margin-top: 20px;">Inquiry Details</h3>
          <p><strong>Service Interested In:</strong> ${
            lookingFor || "Not Specified"
          }</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
            ${message || "No message provided."}
          </div>
        </div>
      `,
    });
    console.log("✅ Contact email sent.");
  } catch (emailErr) {
    console.error("❌ Contact email failed:", emailErr);
    // Continue execution even if email fails to try Zoho
  }

  // 6. Push to Zoho CRM
  try {
    console.log("☁️ Sending Contact Lead to Zoho...");

    const nameParts = (fullName || "Unknown Lead").split(" ");
    const zohoPayload = {
      data: [
        {
          First_Name: nameParts[0],
          Last_Name: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "-",
          Email: email,
          Phone: phone,
          Company: company || "Not Provided",
          Lead_Source: "Contact Page",
          Description: `User Type: ${userType}\nService: ${lookingFor}\nMessage: ${
            message || "N/A"
          }`,
        },
      ],
    };

    const ZOHO_API_URL = `${ZOHO_CONFIG.apiDomain}/crm/v2/Leads`;

    // Attempt 1
    let response = await axios.post(ZOHO_API_URL, zohoPayload, {
      headers: { Authorization: `Zoho-oauthtoken ${ZOHO_CONFIG.accessToken}` },
    });

    // Retry if token expired
    if (response.data && response.data.code === "INVALID_TOKEN") {
      console.log("⚠️ Token invalid, refreshing...");
      const refreshed = await refreshZohoToken();
      if (refreshed) {
        await axios.post(ZOHO_API_URL, zohoPayload, {
          headers: {
            Authorization: `Zoho-oauthtoken ${ZOHO_CONFIG.accessToken}`,
          },
        });
      }
    }
    console.log("✅ Contact lead pushed to Zoho.");
  } catch (zohoErr) {
    // Handle 401 errors specifically
    if (zohoErr.response && zohoErr.response.status === 401) {
      const refreshed = await refreshZohoToken();
      if (refreshed) {
        try {
          await axios.post(
            `${ZOHO_CONFIG.apiDomain}/crm/v2/Leads`,
            zohoPayload,
            {
              headers: {
                Authorization: `Zoho-oauthtoken ${ZOHO_CONFIG.accessToken}`,
              },
            }
          );
          console.log("✅ Zoho retry successful.");
        } catch (retryErr) {
          console.error("❌ Zoho Contact Retry failed:", retryErr.message);
        }
      }
    } else {
      console.error("❌ Zoho Contact Error:", zohoErr.message);
    }
  }

  // 7. Cleanup and Respond
  verifiedEmails.delete(email); // Remove from verified set after use

  res.status(200).json({
    success: true,
    message: "Thank you! Your request has been submitted successfully.",
  });
});
// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

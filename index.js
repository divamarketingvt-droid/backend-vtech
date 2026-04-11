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
  support: "csb.2@verifitech.email", 
  default: ADMIN_EMAIL, 
};

// ZOHO CONFIGURATION
// NOTE: We keep this config for other routes (Trial/Chatbot) if they use the API.
// But the Contact Form route below uses the Public Form URL method.
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
  "http://127.0.0.1:5500", // Added for Live Server
  "http://localhost:5500",  // Added for Live Server
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
  
  pool: true,
  maxConnections: 1,
  maxMessages: 5,
  connectionTimeout: 60000, 
  socketTimeout: 60000,
  family: 4, 
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

  // Using API Method for Trial (Keeping original logic here)
  try {
    console.log("☁️ Sending Trial to Zoho (API Method)...");
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
      const refreshed = await refreshZohoToken();
      if (refreshed) {
        response = await axios.post(ZOHO_API_URL, zohoPayload, {
          headers: { Authorization: `Zoho-oauthtoken ${ZOHO_CONFIG.accessToken}` },
        });
      }
    }
    console.log("✅ Data pushed to Zoho CRM.");
  } catch (zohoErr) {
    console.error("❌ Zoho Error Details:", zohoErr.response ? zohoErr.response.data : zohoErr.message);
  }

  verifiedEmails.delete(leadData.email);
  res
    .status(200)
    .json({ success: true, message: "Trial started successfully!" });
});

// ==========================================
// 4. CHATBOT SUBMISSION (OTP REMOVED)
// ==========================================
app.post("/api/submit-request", async (req, res) => {
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

  const ccEmail = (department && DEPARTMENT_EMAILS[department]) 
    ? DEPARTMENT_EMAILS[department] 
    : DEPARTMENT_EMAILS.default;
  
  console.log(
    `📩 Preparing Email -> TO: ${ADMIN_EMAIL}, CC: ${ccEmail}`
  );

  try {
    // 1️⃣ Send Email Notification
    console.log("📧 Sending Chat Lead email...");
    await transporter.sendMail({
      from: `"Verifitech Chat" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      cc: ccEmail,
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
    console.log("✅ Chat email sent successfully.");

    // 2️⃣ Send to Zoho CRM (async) - Keeping API method for Chatbot
    (async () => {
      try {
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
        await axios.post(ZOHO_API_URL, zohoPayload, {
          headers: { Authorization: `Zoho-oauthtoken ${ZOHO_CONFIG.accessToken}` },
        });
        console.log("✅ Chat lead pushed to Zoho.");
      } catch (zohoErr) {
        console.error("❌ Zoho Chat Error Details:", zohoErr.response ? zohoErr.response.data : zohoErr.message);
      }
    })();

    res.status(200).json({
      success: true,
      message: "Request submitted and email sent successfully",
      data: { emailSentTo: ADMIN_EMAIL, cc: ccEmail },
    });
  } catch (emailErr) {
    console.error("❌ Chat email failed:", emailErr.message);
    res.status(500).json({
      success: false,
      message: "Failed to send email. Please check server logs.",
      error: emailErr.message,
    });
  }
});

// ==========================================
// 5. CONTACT PAGE SUBMISSION (UPDATED: NO TOKEN METHOD)
// ==========================================
// 5. CONTACT PAGE SUBMISSION (FIXED - MOCK BROWSER)
// ==========================================
app.post("/api/submit-contact", async (req, res) => {
  console.log("📬 Contact Request Received:", JSON.stringify(req.body, null, 2));

  const { 
    fullName = "", 
    email = "", 
    phone = "", 
    company = "", 
    lookingFor = "", 
    message = "", 
    userType = "business" 
  } = req.body;

  if (!fullName || !email || !phone) {
    return res.status(400).json({ success: false, message: "Missing required details (Name, Email, Phone)." });
  }

  // Select URL based on user type
  const ZOHO_FORM_URL = userType === 'business' 
    ? "https://forms.zohopublic.in/verifitech/form/Contact11/formperma/gXG2SmjNMF39gOdkUirlDiuaugqo5NYbAzWLT0fozlc"
    : "https://forms.zohopublic.in/verifitech/form/CandidateDetails2/formperma/AfduEJIOaK67PrjduhiIWWGB33ST3cueCfYEH0f4S2o";

  try {
    const formData = new URLSearchParams();
    
    // Common Fields
    formData.append('SingleLine', fullName);             
    formData.append('Email', email);                      
    formData.append('PhoneNumber_countrycode', phone);    
    formData.append('Dropdown1', lookingFor);              
    formData.append('MultiLine', message);                 
    formData.append('isLogin', 'false'); 
    formData.append('privacy', 'True');

    // Only append Company if Business
    if (userType === 'business' && company) {
      formData.append('SingleLine1', company);
    }

    console.log(`📤 Sending to Zoho Form (${userType})...`);

    // CRITICAL FIX: Mimic a real Browser to avoid 403/404 Access Denied
    const response = await axios.post(ZOHO_FORM_URL, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Origin': 'https://forms.zohopublic.in',
        'Referer': ZOHO_FORM_URL
      },
      maxRedirects: 5, 
      validateStatus: (status) => status >= 200 && status < 400
    });

    console.log("✅ Zoho Response Status:", response.status);
    res.status(200).json({ success: true, message: "Form submitted successfully" });

  } catch (error) {
    console.error("❌ Zoho Form Error Details:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }
    res.status(500).json({ success: false, message: "Failed to submit form to Zoho.", error: error.message });
  }
});
// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)

);

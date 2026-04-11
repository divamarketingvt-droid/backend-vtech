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
  "http://127.0.0.1:5500",
  "http://localhost:5500",
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

// Serve index.html on all other routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================================
// STORAGE & HELPERS
// ==========================================
const blockedDomains = [
  "yahoo.com", "yahoo.co.in", "hotmail.com", "outlook.com", "aol.com", 
  "icloud.com", "mail.com", "protonmail.com", "zoho.com", "yandex.com", "gmx.com"
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
  port: 465,
  secure: true,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  tls: { rejectUnauthorized: false },
  pool: true,
  maxConnections: 1,
  maxMessages: 5,
  connectionTimeout: 60000, 
  socketTimeout: 60000,
});

// ==========================================
// API ROUTES
// ==========================================

// 1. SEND OTP
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ success: false, message: "Email is required" });
  if (!isBusinessEmail(email))
    return res.status(400).json({ success: false, message: "Please use a business email." });

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
    return res.status(200).json({ success: true, message: "Email verified successfully" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }
});

// 3. SUBMIT TRIAL
app.post("/api/submit-trial", async (req, res) => {
  const { leadData, selectedChecks, candidateData } = req.body;

  if (!leadData || !leadData.email || !verifiedEmails.has(leadData.email)) {
    return res.status(403).json({ success: false, message: "Email not verified." });
  }

  let checksListHtml = "<li>None selected</li>";
  let checksTextForZoho = "None selected";

  if (selectedChecks && selectedChecks.length > 0) {
    checksListHtml = selectedChecks.map((c) => {
        if (typeof c === "object" && c !== null) {
          const details = Object.entries(c).map(([key, val]) => `<strong>${key}:</strong> ${val}`).join(" | ");
          return `<li>${details}</li>`;
        }
        return `<li>${c}</li>`;
      }).join("");
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
        <ul><li>Name: ${leadData.name}</li><li>Email: ${leadData.email}</li><li>Phone: ${leadData.phone || "N/A"}</li><li>Company: ${leadData.company || "N/A"}</li></ul>
        <h3>Selected Services</h3><ul>${checksListHtml}</ul>`,
    });
    console.log("✅ Email sent.");
  } catch (err) {
    console.error("❌ Email failed:", err);
  }

  // Using API Method for Trial
  try {
    console.log("☁️ Sending Trial to Zoho (API Method)...");
    const nameParts = (leadData.name || "Unknown Lead").split(" ");
    const zohoPayload = {
      data: [{
        First_Name: nameParts[0],
        Last_Name: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "N/A",
        Email: leadData.email,
        Phone: leadData.phone,
        Company: leadData.company || "Not Provided",
        Lead_Source: "Website Free Trial",
        Description: `Services: ${checksTextForZoho}`,
      }],
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
  res.status(200).json({ success: true, message: "Trial started successfully!" });
});

// ==========================================
// 4. CHATBOT SUBMISSION
// ==========================================
app.post("/api/submit-request", async (req, res) => {
  console.log("📦 Chat Request Received:", req.body);
  const { firstName, email, phone, company, department, serviceType, issueDescription } = req.body;

  if (!firstName || !email) {
    return res.status(400).json({ success: false, message: "Name and Email are required." });
  }

  const ccEmail = (department && DEPARTMENT_EMAILS[department]) ? DEPARTMENT_EMAILS[department] : DEPARTMENT_EMAILS.default;
  
  try {
    // 1️⃣ Send Email
    await transporter.sendMail({
      from: `"Verifitech Chat" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      cc: ccEmail,
      replyTo: email,
      subject: `New Chat Request: ${department || "General"} - ${firstName}`,
      html: `<h2>New Chat Request</h2><p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <h3>User Details</h3><ul><li><strong>Name:</strong> ${firstName}</li><li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone || "Not Provided"}</li><li><strong>Company:</strong> ${company || "Not Provided"}</li></ul>
        <h3>Request Details</h3><ul><li><strong>Department:</strong> ${department || "N/A"}</li><li><strong>Service:</strong> ${serviceType || "N/A"}</li><li><strong>Description:</strong> ${issueDescription || "N/A"}</li></ul>`,
    });
    console.log("✅ Chat email sent.");

    // 2️⃣ Send to Zoho CRM
    (async () => {
      try {
        const zohoPayload = {
          data: [{
            First_Name: firstName.split(" ")[0],
            Last_Name: firstName.split(" ").slice(1).join(" ") || "N/A",
            Email: email,
            Phone: phone,
            Company: company || "Not Provided",
            Lead_Source: "Website Chatbot",
            Description: `Dept: ${department}, Service: ${serviceType}, Issue: ${issueDescription || "N/A"}`,
          }],
        };
        await axios.post(`${ZOHO_CONFIG.apiDomain}/crm/v2/Leads`, zohoPayload, {
          headers: { Authorization: `Zoho-oauthtoken ${ZOHO_CONFIG.accessToken}` },
        });
        console.log("✅ Chat lead pushed to Zoho.");
      } catch (zohoErr) {
        console.error("❌ Zoho Chat Error:", zohoErr.message);
      }
    })();

    res.status(200).json({ success: true, message: "Request submitted successfully" });
  } catch (emailErr) {
    console.error("❌ Chat email failed:", emailErr.message);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// ==========================================
// 5. CONTACT PAGE SUBMISSION (FIXED - MOCK BROWSER)
// ==========================================
// ==========================================
// 5. CONTACT PAGE SUBMISSION (PUPPETEER METHOD)
// ==========================================
app.post("/api/submit-contact", async (req, res) => {
  console.log("📬 Contact Request Received:", JSON.stringify(req.body, null, 2));

  // FIX 1: Extract variables using correct names from Frontend
  const { 
    userType, 
    fullName, 
    email, 
    phone, 
    company, 
    lookingFor, 
    message 
  } = req.body;

  // FIX 2: Validation
  if (!fullName || !email || !phone) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required details (Name, Email, Phone)." 
    });
  }

  // Select Zoho Form URL based on user type
  const ZOHO_FORM_URL = userType === 'business' 
    ? "https://forms.zohopublic.in/verifitech/form/Contact11/formperma/gXG2SmjNMF39gOdkUirlDiuaugqo5NYbAzWLT0fozlc"
    : "https://forms.zohopublic.in/verifitech/form/CandidateDetails2/formperma/AfduEJIOaK67PrjduhiIWWGB33ST3cueCfYEH0f4S2o";

  let browser;

  try {
    console.log(`🚀 Launching Headless Browser for Zoho...`);
    
    // Launch Puppeteer (configured for Render/Cloud environments)
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // Helps with low-memory environments
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set User Agent to look like a real Chrome browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    console.log(`📍 Navigating to Form: ${userType}`);
    await page.goto(ZOHO_FORM_URL, { waitUntil: 'networkidle2' });

    // ==========================================
    // FILLING THE FORM FIELDS
    // ==========================================

    // 1. Full Name (SingleLine)
    try {
      await page.waitForSelector('input[name="SingleLine"]', { timeout: 5000 });
      await page.type('input[name="SingleLine"]', fullName, { delay: 50 });
      console.log("✅ Typed Name");
    } catch (e) { console.log("⚠️ Name field not found or skipped"); }

    // 2. Email (Email)
    try {
      await page.type('input[name="Email"]', email, { delay: 50 });
      console.log("✅ Typed Email");
    } catch (e) { console.log("⚠️ Email field not found or skipped"); }

    // 3. Phone (PhoneNumber_countrycode)
    try {
      // Sometimes Zoho phone inputs are tricky, we try to click focus then type
      await page.click('input[name="PhoneNumber_countrycode"]');
      await page.type('input[name="PhoneNumber_countrycode"]', phone, { delay: 50 });
      console.log("✅ Typed Phone");
    } catch (e) { console.log("⚠️ Phone field not found or skipped"); }

    // 4. Dropdown (Dropdown1)
    try {
      // Click dropdown to open options
      await page.click('select[name="Dropdown1"]');
      // Select the option by value
      await page.select('select[name="Dropdown1"]', lookingFor);
      console.log(`✅ Selected Dropdown: ${lookingFor}`);
    } catch (e) { console.log("⚠️ Dropdown not found or skipped"); }

    // 5. Message (MultiLine)
    if (message) {
      try {
        await page.type('textarea[name="MultiLine"]', message, { delay: 50 });
        console.log("✅ Typed Message");
      } catch (e) { console.log("⚠️ Message field not found or skipped"); }
    }

    // 6. Business Only: Company Name (SingleLine1)
    if (userType === 'business' && company) {
      try {
        await page.type('input[name="SingleLine1"]', company, { delay: 50 });
        console.log("✅ Typed Company");
      } catch (e) { console.log("⚠️ Company field not found or skipped"); }
    }

    // 7. Privacy Checkbox (Required by Zoho)
    try {
      // Check if privacy checkbox exists and is unchecked, then check it
      const privacyChecked = await page.$eval('input[name="privacy"]', el => el.checked);
      if (!privacyChecked) {
        await page.click('input[name="privacy"]');
        console.log("✅ Checked Privacy");
      }
    } catch (e) {
      // Sometimes privacy is a label or different structure
      try {
        // Try clicking the label associated with privacy
        await page.click('label:has-text("Privacy")'); 
        console.log("✅ Checked Privacy (via Label)");
      } catch (err) {
        console.log("⚠️ Could not find privacy checkbox (might be auto-checked or missing)");
      }
    }

    // ==========================================
    // SUBMIT
    // ==========================================
    
    // Wait a moment for UI to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find the submit button
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      console.log("🖱️ Clicking Submit Button...");
      await submitButton.click();
      
      // Wait for navigation after submit
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {
        console.log("⚠️ Navigation timeout or redirect blocked (might still be successful)");
      });

      console.log("✅ Form Submitted Successfully (Browser)");
      
      // Close browser
      await browser.close();
      
      return res.status(200).json({ 
        success: true, 
        message: "Form submitted successfully via Browser" 
      });
    } else {
      throw new Error("Submit button not found on the page.");
    }

  } catch (error) {
    console.error("❌ Puppeteer Error:", error.message);
    if (browser) await browser.close();
    
    return res.status(500).json({ 
      success: false, 
      message: "Failed to submit form to Zoho.", 
      error: error.message 
    });
  }
});
// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

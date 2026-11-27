/* =========================================================
   BLOG ADMIN LOGIN NOTIFICATION
   ---------------------------------------------------------
   Emails the address(es) in BLOG_LOGIN_NOTIFY_TO (.env) every time
   someone logs in to /blog-admin. Uses the same Gmail account as the
   rest of the site (EMAIL_USER / EMAIL_PASS).

   .env:
     BLOG_LOGIN_NOTIFY_TO=connect@verifitech.com      (comma-separated; empty = off)
========================================================= */

const nodemailer = require("nodemailer");

let transporter = null;
function getTransporter() {
  if (!transporter && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000
    });
  }
  return transporter;
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function recipients() {
  return String(process.env.BLOG_LOGIN_NOTIFY_TO || "")
    .split(",").map((e) => e.trim()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

// Short, readable browser + OS from the user-agent string
function describeBrowser(ua) {
  ua = String(ua || "");
  const browser =
    /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Unknown browser";
  const os =
    /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" :
    /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Unknown OS";
  return `${browser} on ${os}`;
}

// Fire-and-forget: never delays or breaks the login
function notifyLogin({ user, ip, userAgent }) {
  const to = recipients();
  const t = getTransporter();
  if (!to.length || !t) return;

  const when = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium"
  }) + " (IST)";
  const device = describeBrowser(userAgent);
  const name = user.name || user.username;
  const site = (process.env.SITE_URL || "https://www.verifitech.com").replace(/\/+$/, "");

  const row = (k, v) =>
    `<tr><td style="padding:8px 12px;color:#64748b;white-space:nowrap;vertical-align:top">${k}</td>` +
    `<td style="padding:8px 12px;color:#0f172a;font-weight:600">${v}</td></tr>`;

  t.sendMail({
    from: `"Verifitech Blog Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Blog admin login: ${name} (${user.username})`,
    text:
      `Someone logged in to the Verifitech blog admin.\n\n` +
      `User: ${name} (${user.username})\nTime: ${when}\nIP address: ${ip}\nDevice: ${device}\n` +
      `Browser details: ${userAgent || "-"}\n\n` +
      `If this wasn't you or your team, change the password now:\n` +
      `node blog/set-password.js ${user.username} <new-password>\n`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#1ac2c1;color:#fff;padding:16px 20px;font-size:18px;font-weight:700">🔐 Blog admin login</div>
        <div style="padding:16px 20px">
          <p style="margin:0 0 12px;color:#334155">Someone just logged in to the <a href="${esc(site)}/blog-admin" style="color:#16a8a7">Verifitech blog admin</a>.</p>
          <table style="border-collapse:collapse;width:100%;background:#f8fafc;border-radius:8px">
            ${row("User", `${esc(name)} (${esc(user.username)})`)}
            ${row("Time", esc(when))}
            ${row("IP address", esc(ip))}
            ${row("Device", esc(device))}
            ${row("Browser details", `<span style="font-weight:400;font-size:12px;color:#475569">${esc(userAgent || "-")}</span>`)}
          </table>
          <p style="margin:16px 0 0;padding:10px 12px;background:#fef2f2;color:#991b1b;border-radius:8px;font-size:13px">
            Not you or your team? Change the password right away:<br>
            <code>node blog/set-password.js ${esc(user.username)} &lt;new-password&gt;</code>
          </p>
        </div>
      </div>`
  })
    .then(() => console.log(`✅ BLOG LOGIN ALERT SENT: ${user.username} → ${to.join(", ")}`))
    .catch((err) => console.error("❌ BLOG LOGIN ALERT FAILED:", err.message));
}

module.exports = { notifyLogin, describeBrowser };

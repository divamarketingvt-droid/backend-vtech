/* =========================================================
   BLOG ADMIN AUTH
   ---------------------------------------------------------
   1. Login payload is encrypted in the browser (RSA-OAEP 2048 / SHA-256)
      with a one-time key from /api/blog-admin/login-key, so the
      username/password never travel or appear as plain text.
   2. Passwords are stored only as scrypt hashes (data/blog-config.js).
      Set one with:  node blog/set-password.js <username> <new-password>
   3. Session = JWT (HS256) in an HttpOnly, SameSite=Strict cookie.
      Logout revokes the token.
========================================================= */

const crypto = require("crypto");
const { getConfig } = require("./store");

const COOKIE = "vt_blog_token";

/* ---------------- password hashing (scrypt) ---------------- */

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "base64");
  const expected = Buffer.from(parts[2], "base64");
  const actual = crypto.scryptSync(String(password), salt, expected.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(actual, expected);
}

const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString("hex"));

function checkLogin(username, password) {
  const { users } = getConfig();
  const user = users.find((u) => u.username === username);
  if (!user) { verifyPassword(password, DUMMY_HASH); return null; } // same timing as a real check
  if (user.passwordHash) return verifyPassword(password, user.passwordHash) ? user : null;
  if (user.password) {
    // Old plain-text entry still works, but warn loudly
    console.warn(`⚠️  Blog user "${user.username}" has a plain-text password. Run: node blog/set-password.js ${user.username} <new-password>`);
    const a = Buffer.from(String(user.password));
    const b = Buffer.from(String(password));
    return a.length === b.length && crypto.timingSafeEqual(a, b) ? user : null;
  }
  return null;
}

/* ---------------- encrypted login payload ---------------- */

// New RSA key pair every time the server starts (kept only in memory)
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const PUBLIC_KEY_B64 = publicKey.export({ type: "spki", format: "der" }).toString("base64");

const nonces = new Map(); // nonce -> expiry (one-time use, 2 minutes)

function issueLoginKey() {
  const now = Date.now();
  for (const [n, exp] of nonces) if (exp < now) nonces.delete(n);
  if (nonces.size > 5000) nonces.clear();
  const nonce = crypto.randomBytes(18).toString("base64url");
  nonces.set(nonce, now + 2 * 60 * 1000);
  return { publicKey: PUBLIC_KEY_B64, nonce, alg: "RSA-OAEP-256" };
}

// Returns { username, password } or throws
function decryptLogin(payloadB64) {
  let data;
  try {
    const plain = crypto.privateDecrypt(
      { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      Buffer.from(String(payloadB64 || ""), "base64")
    );
    data = JSON.parse(plain.toString("utf8"));
  } catch {
    throw new Error("Login form expired. Please reload the page and try again.");
  }
  const exp = nonces.get(data.n);
  nonces.delete(data.n); // one-time: a captured request cannot be replayed
  if (!exp || exp < Date.now()) throw new Error("Login form expired. Please reload the page and try again.");
  return { username: String(data.u || "").trim(), password: String(data.p || "") };
}

/* ---------------- JWT (HS256) ---------------- */

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const revoked = new Map(); // jti -> exp (logged-out tokens)

function jwtSecret() {
  const { sessionSecret } = getConfig();
  return sessionSecret;
}

function signJwt(payload) {
  const head = b64url({ alg: "HS256", typ: "JWT" });
  const body = b64url(payload);
  const sig = crypto.createHmac("sha256", jwtSecret()).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

function verifyJwt(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [head, body, sig] = parts;
  try {
    const header = JSON.parse(Buffer.from(head, "base64url").toString());
    if (header.alg !== "HS256" || header.typ !== "JWT") return null; // never accept "none" or other algs
    const expected = crypto.createHmac("sha256", jwtSecret()).update(`${head}.${body}`).digest();
    const given = Buffer.from(sig, "base64url");
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
    const claims = JSON.parse(Buffer.from(body, "base64url").toString());
    const now = Math.floor(Date.now() / 1000);
    if (!claims.exp || claims.exp < now) return null;
    if (claims.iss !== "verifitech-blog") return null;
    if (revoked.has(claims.jti)) return null;
    return claims;
  } catch {
    return null;
  }
}

/* ---------------- cookies ---------------- */

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function isHttps(req) {
  return req.secure || req.headers["x-forwarded-proto"] === "https";
}

function createSession(res, req, user) {
  const { sessionHours } = getConfig();
  const hours = sessionHours || 8;
  const now = Math.floor(Date.now() / 1000);
  const token = signJwt({
    iss: "verifitech-blog",
    sub: user.username,
    name: user.name || user.username,
    iat: now,
    exp: now + hours * 3600,
    jti: crypto.randomUUID()
  });
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${hours * 3600}${isHttps(req) ? "; Secure" : ""}`
  );
}

function clearSession(req, res) {
  const claims = verifyJwt(parseCookies(req)[COOKIE]);
  if (claims) {
    revoked.set(claims.jti, claims.exp);
    const now = Math.floor(Date.now() / 1000);
    for (const [j, exp] of revoked) if (exp < now) revoked.delete(j);
  }
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${isHttps(req) ? "; Secure" : ""}`);
}

function getSessionUser(req) {
  const claims = verifyJwt(parseCookies(req)[COOKIE]);
  if (!claims) return null;
  const { users } = getConfig();
  return users.find((u) => u.username === claims.sub) || null; // removed users lose access immediately
}

/* ---------------- brute-force protection: 10 failures / IP / 15 min ---------------- */

const failures = new Map();
function tooManyAttempts(ip) {
  const f = failures.get(ip);
  if (!f) return false;
  if (Date.now() > f.reset) { failures.delete(ip); return false; }
  return f.count >= 10;
}
function recordFailure(ip) {
  const f = failures.get(ip) || { count: 0, reset: Date.now() + 15 * 60 * 1000 };
  f.count++;
  failures.set(ip, f);
}
function clearFailures(ip) { failures.delete(ip); }

/* ---------------- middleware ---------------- */

function requireApiAuth(req, res, next) {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ success: false, message: "Login required" });
  req.blogUser = user;
  next();
}

function requirePageAuth(req, res, next) {
  const user = getSessionUser(req);
  if (!user) return res.redirect("/blog-admin/login");
  req.blogUser = user;
  next();
}

module.exports = {
  hashPassword,
  checkLogin,
  issueLoginKey,
  decryptLogin,
  createSession,
  clearSession,
  getSessionUser,
  tooManyAttempts,
  recordFailure,
  clearFailures,
  requireApiAuth,
  requirePageAuth
};

/* =========================================================
   BLOG STORE — reads/writes the data/*.js files
========================================================= */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const POSTS_FILE = path.join(DATA_DIR, "blog-posts.js");
const CATEGORIES_FILE = path.join(DATA_DIR, "blog-categories.js");
const CONFIG_FILE = path.join(DATA_DIR, "blog-config.js");
const SETTINGS_FILE = path.join(DATA_DIR, "blog-settings.js");

const DEFAULT_SETTINGS = {
  headCode: "",
  footerCode: "",
  defaultExternalRel: "dofollow",
  externalNewTab: true,
  sitemapIncludeStatic: true,
  sitemapExclude: [],
  postChangefreq: "monthly",
  postPriority: "0.7"
};

function load(file) {
  delete require.cache[require.resolve(file)];
  return require(file);
}

function save(file, header, data) {
  const body =
    `/* ${header} */\n` +
    `module.exports = ${JSON.stringify(data, null, 2)};\n`;
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, body, "utf8");
  fs.renameSync(tmp, file); // atomic replace
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

// .env values win over data/blog-config.js
const crypto = require("crypto");
let tempSecret;
function getConfig() {
  const cfg = { ...load(CONFIG_FILE) };
  if (process.env.SITE_URL) cfg.siteUrl = process.env.SITE_URL.replace(/\/+$/, "");
  if (process.env.BLOG_SESSION_HOURS) cfg.sessionHours = Number(process.env.BLOG_SESSION_HOURS) || cfg.sessionHours;
  cfg.sessionSecret = process.env.BLOG_JWT_SECRET || cfg.sessionSecret;
  if (!cfg.sessionSecret || cfg.sessionSecret.length < 32) {
    if (!tempSecret) {
      tempSecret = crypto.randomBytes(48).toString("base64url");
      console.warn("⚠️  BLOG_JWT_SECRET missing/short in .env — using a temporary one (admins are logged out on every restart).");
    }
    cfg.sessionSecret = tempSecret;
  }
  return cfg;
}

const getPosts = () => load(POSTS_FILE);
const savePosts = (posts) =>
  save(POSTS_FILE, "Blog posts — created from /blog-admin (auto-updated by the server).", posts);

const getCategories = () => load(CATEGORIES_FILE);
const saveCategories = (cats) =>
  save(CATEGORIES_FILE, "Blog categories — managed from /blog-admin (auto-updated by the server).", cats);

function getSettings() {
  try { return { ...DEFAULT_SETTINGS, ...load(SETTINGS_FILE) }; }
  catch { return { ...DEFAULT_SETTINGS }; }
}
const saveSettings = (settings) =>
  save(SETTINGS_FILE, "Blog settings — managed from /blog-admin → Settings (auto-updated by the server).", settings);

module.exports = {
  slugify,
  getSettings,
  saveSettings,
  getConfig,
  getPosts,
  savePosts,
  getCategories,
  saveCategories
};

/* =========================================================
   BLOG ROUTES
   - Public:  /blog/:slug, /blog/category/:slug, /blog-sitemap.xml,
              /api/blogs, /api/blog-categories
   - Admin:   /blog-admin/login, /blog-admin, /api/blog-admin/*
========================================================= */

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ejs = require("ejs");

const store = require("./store");
const auth = require("./auth");
const { injectPreloader } = require("./preloader");
const { notifyLogin } = require("./notify");

const router = express.Router();

const ROOT = path.join(__dirname, "..");
const VIEWS = path.join(ROOT, "view");
const ADMIN_DIR = path.join(ROOT, "admin");
const UPLOAD_DIR = path.join(ROOT, "public", "uploads", "blog");

/* ---------------- helpers ---------------- */

function stripHtml(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function readingTime(html) {
  return Math.max(1, Math.ceil(stripHtml(html).split(" ").length / 200));
}

// Basic sanitizer for admin-written HTML: drops scripts, event handlers and javascript: links.
function sanitizeHtml(html) {
  return String(html || "")
    .replace(/<\s*(script|style|object|embed|form)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|object|embed|form|link|meta)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*(javascript|vbscript|data:text\/html)[^"']*\2/gi, '$1="#"')
    .replace(/<iframe(?![^>]*src=["']https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\/)[^>]*>[\s\S]*?<\/iframe>/gi, "");
}

function uniqueSlug(base, posts, ignoreId) {
  let slug = store.slugify(base) || "post";
  let n = 2;
  const taken = (s) => posts.some((p) => p.slug === s && p.id !== ignoreId);
  const root = slug;
  while (taken(slug)) slug = `${root}-${n++}`;
  return slug;
}

function categoryNames(slugs, cats) {
  return (slugs || [])
    .map((s) => cats.find((c) => c.slug === s))
    .filter(Boolean);
}

function postSummary(p, cats) {
  return {
    id: p.id,
    slug: p.slug,
    url: `/blog/${p.slug}`,
    title: p.title,
    excerpt: p.excerpt,
    featuredImage: p.featuredImage,
    featuredImageAlt: p.featuredImageAlt || p.title,
    categories: categoryNames(p.categories, cats),
    tags: p.tags || [],
    author: p.author,
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
    readingTime: readingTime(p.content),
    searchText: stripHtml(p.content).slice(0, 3000)
  };
}

const published = (posts) =>
  posts
    .filter((p) => p.status === "published")
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

function buildPostFromBody(body, existing, posts, cats, user) {
  const now = new Date().toISOString();
  const title = String(body.title || "").trim();
  if (!title) throw new Error("Title is required");

  const content = sanitizeHtml(body.content);
  const status = body.status === "published" ? "published" : "draft";
  const validCats = (Array.isArray(body.categories) ? body.categories : [])
    .filter((s) => cats.some((c) => c.slug === s));

  const excerpt =
    String(body.excerpt || "").trim() ||
    stripHtml(content).slice(0, 160);

  const robotsIndex = body.robotsIndex === "noindex" || (body.robotsIndex === undefined && body.noindex) ? "noindex" : "index";
  const robotsFollow = body.robotsFollow === "nofollow" ? "nofollow" : "follow";

  const linkRel = {};
  if (body.linkRel && typeof body.linkRel === "object") {
    Object.entries(body.linkRel).forEach(([href, rel]) => {
      if (REL_OPTIONS.includes(rel) && href.length < 2000) linkRel[href] = rel;
    });
  }

  const canonicalUrl = String(body.canonicalUrl || "").trim();
  if (canonicalUrl && !/^https?:\/\/[^\s"<>]+$/i.test(canonicalUrl)) {
    throw new Error("Canonical URL must start with http:// or https://");
  }

  const post = {
    id: existing ? existing.id : crypto.randomUUID(),
    slug: uniqueSlug(body.slug || title, posts, existing && existing.id),
    title,
    metaTitle: String(body.metaTitle || "").trim(),
    metaDescription: String(body.metaDescription || "").trim() || excerpt.slice(0, 160),
    focusKeyword: String(body.focusKeyword || "").trim(),
    tags: String(Array.isArray(body.tags) ? body.tags.join(",") : body.tags || "")
      .split(",").map((t) => t.trim()).filter(Boolean),
    excerpt,
    content,
    featuredImage: String(body.featuredImage || "").trim(),
    featuredImageAlt: String(body.featuredImageAlt || "").trim(),
    categories: validCats,
    author: String(body.author || "").trim() || (existing && existing.author) || user.name || user.username,
    status,
    robotsIndex,
    robotsFollow,
    noindex: robotsIndex === "noindex",
    canonicalUrl,
    linkRel,
    ogTitle: String(body.ogTitle || "").trim().slice(0, 200),
    ogDescription: String(body.ogDescription || "").trim().slice(0, 500),
    ogImage: String(body.ogImage || "").trim(),
    ogImageAlt: String(body.ogImageAlt || "").trim().slice(0, 300),
    ogType: ["article", "website"].includes(body.ogType) ? body.ogType : "article",
    twitterCard: body.twitterCard === "summary" ? "summary" : "summary_large_image",
    customHead: String(body.customHead || "").slice(0, 20000),
    customScripts: String(body.customScripts || "").slice(0, 20000),
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
    publishedAt:
      existing && existing.publishedAt
        ? existing.publishedAt
        : status === "published" ? now : null
  };
  if (status === "published" && !post.publishedAt) post.publishedAt = now;
  return post;
}

/* ---------- link rel (dofollow / nofollow / sponsored / ugc) ---------- */

const REL_OPTIONS = ["dofollow", "nofollow", "sponsored", "ugc"];

function isExternal(href, siteUrl) {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return host !== new URL(siteUrl).hostname.replace(/^www\./, "");
  } catch { return false; }
}

function decodeAttr(s) {
  return String(s).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

// Rewrites every <a> in the post: per-link choice first, otherwise the site default for external links.
function applyLinkRel(html, linkRel, settings, siteUrl) {
  return String(html || "").replace(/<a\b([^>]*)>/gi, (tag, attrs) => {
    const m = /\shref\s*=\s*(["'])(.*?)\1/i.exec(attrs);
    if (!m) return tag;
    const href = decodeAttr(m[2]);
    const external = isExternal(href, siteUrl);
    const choice = (linkRel || {})[href] || (external ? settings.defaultExternalRel : "dofollow");

    const rel = [];
    if (choice === "nofollow") rel.push("nofollow");
    if (choice === "sponsored") rel.push("sponsored", "nofollow");
    if (choice === "ugc") rel.push("ugc", "nofollow");

    const newTab = external && settings.externalNewTab;
    if (newTab) rel.push("noopener", "noreferrer");

    let clean = attrs.replace(/\s(rel|target)\s*=\s*(["']).*?\2/gi, "");
    if (rel.length) clean += ` rel="${rel.join(" ")}"`;
    if (newTab) clean += ' target="_blank"';
    return `<a${clean}>`;
  });
}

function robotsFor(post) {
  return `${post.robotsIndex || (post.noindex ? "noindex" : "index")}, ${post.robotsFollow || "follow"}`;
}

// In the sitemap only if indexable and not canonicalised to another URL
const isIndexable = (p, siteUrl) =>
  (p.robotsIndex || (p.noindex ? "noindex" : "index")) === "index" &&
  (!p.canonicalUrl || p.canonicalUrl === `${siteUrl}/blog/${p.slug}`);

/* ---------- dynamic sitemap ---------- */

const STATIC_SITEMAP = path.join(ROOT, "public", "sitemap.xml");

function xmlEsc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Returns [{ loc, lastmod, changefreq, priority, image, source }]
function sitemapEntries({ blogOnly = false } = {}) {
  const { siteUrl } = store.getConfig();
  const settings = store.getSettings();
  const exclude = new Set((settings.sitemapExclude || []).map((u) => u.trim()).filter(Boolean));
  const seen = new Set();
  const out = [];
  const add = (e) => {
    if (!e.loc || seen.has(e.loc) || exclude.has(e.loc)) return;
    seen.add(e.loc);
    out.push(e);
  };

  if (!blogOnly && settings.sitemapIncludeStatic && fs.existsSync(STATIC_SITEMAP)) {
    const xml = fs.readFileSync(STATIC_SITEMAP, "utf8");
    const pick = (block, tag) => ((new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, "i").exec(block) || [])[1] || "").trim();
    (xml.match(/<url>[\s\S]*?<\/url>/gi) || []).forEach((b) => add({
      loc: decodeAttr(pick(b, "loc")),
      lastmod: pick(b, "lastmod"),
      changefreq: pick(b, "changefreq"),
      priority: pick(b, "priority"),
      source: "page"
    }));
  }

  if (!blogOnly) add({ loc: `${siteUrl}/resources/blog`, changefreq: "daily", priority: "0.8", source: "blog" });

  const posts = published(store.getPosts()).filter((p) => isIndexable(p, siteUrl));
  posts.forEach((p) => add({
    loc: `${siteUrl}/blog/${p.slug}`,
    lastmod: (p.updatedAt || p.publishedAt).slice(0, 10),
    changefreq: settings.postChangefreq || "monthly",
    priority: settings.postPriority || "0.7",
    image: p.featuredImage ? { loc: absUrl(siteUrl, p.featuredImage), title: p.featuredImageAlt || p.title } : null,
    title: p.title,
    source: "post"
  }));

  store.getCategories()
    .filter((c) => posts.some((p) => (p.categories || []).includes(c.slug)))
    .forEach((c) => add({ loc: `${siteUrl}/blog/category/${c.slug}`, changefreq: "weekly", priority: "0.5", title: c.name, source: "category" }));

  return out;
}

function sitemapXml(entries) {
  const rows = entries.map((e) =>
    "  <url>\n" +
    `    <loc>${xmlEsc(e.loc)}</loc>\n` +
    (e.lastmod ? `    <lastmod>${xmlEsc(e.lastmod)}</lastmod>\n` : "") +
    (e.changefreq ? `    <changefreq>${xmlEsc(e.changefreq)}</changefreq>\n` : "") +
    (e.priority ? `    <priority>${xmlEsc(e.priority)}</priority>\n` : "") +
    (e.image ? `    <image:image><image:loc>${xmlEsc(e.image.loc)}</image:loc><image:title>${xmlEsc(e.image.title)}</image:title></image:image>\n` : "") +
    "  </url>");
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    rows.join("\n") + "\n</urlset>\n";
}

function sendSitemap(blogOnly) {
  return (req, res) => {
    res.set("Cache-Control", "public, max-age=300");
    res.type("application/xml").send(sitemapXml(sitemapEntries({ blogOnly })));
  };
}

function absUrl(siteUrl, url) {
  if (!url) return `${siteUrl}/verifitech-og-banner.jpg`;
  return /^https?:\/\//i.test(url) ? url : siteUrl + (url.startsWith("/") ? url : "/" + url);
}

/* =========================================================
   PUBLIC API
========================================================= */

router.get("/api/blogs", (req, res) => {
  const cats = store.getCategories();
  let posts = published(store.getPosts());
  if (req.query.category && req.query.category !== "all") {
    posts = posts.filter((p) => (p.categories || []).includes(req.query.category));
  }
  res.json({ success: true, posts: posts.map((p) => postSummary(p, cats)) });
});

router.get("/api/blog-categories", (req, res) => {
  const posts = published(store.getPosts());
  const cats = store.getCategories().map((c) => ({
    ...c,
    count: posts.filter((p) => (p.categories || []).includes(c.slug)).length
  }));
  res.json({ success: true, categories: cats });
});

/* =========================================================
   PUBLIC SEO PAGES
========================================================= */

router.get("/blog", (req, res) => res.redirect(301, "/resources/blog"));

// /sitemap.xml (whole site + blog) is mounted before express.static in index.js
router.get("/blog-sitemap.xml", sendSitemap(true));

router.get("/blog/category/:slug", async (req, res, next) => {
  try {
    const cats = store.getCategories();
    const category = cats.find((c) => c.slug === req.params.slug);
    if (!category) return next();
    const { siteUrl } = store.getConfig();
    const posts = published(store.getPosts())
      .filter((p) => (p.categories || []).includes(category.slug))
      .map((p) => postSummary(p, cats));
    const html = await ejs.renderFile(path.join(VIEWS, "blog-list.ejs"), {
      siteUrl, category, categories: cats, posts, settings: store.getSettings()
    });
    res.send(injectPreloader(html));
  } catch (err) { next(err); }
});

router.get("/blog/:slug", async (req, res, next) => {
  try {
    const posts = store.getPosts();
    const post = posts.find((p) => p.slug === req.params.slug);
    if (!post) return next(); // → 404 page

    const isAdmin = !!auth.getSessionUser(req);
    if (post.status !== "published" && !isAdmin) return next();

    const { siteUrl } = store.getConfig();
    const cats = store.getCategories();
    const postCats = categoryNames(post.categories, cats);

    const related = published(posts)
      .filter((p) => p.id !== post.id)
      .map((p) => ({ p, score: (p.categories || []).filter((c) => (post.categories || []).includes(c)).length }))
      .sort((a, b) => b.score - a.score || new Date(b.p.publishedAt) - new Date(a.p.publishedAt))
      .slice(0, 3)
      .map((x) => postSummary(x.p, cats));

    const settings = store.getSettings();
    const canonical = post.canonicalUrl || `${siteUrl}/blog/${post.slug}`;
    const image = absUrl(siteUrl, post.featuredImage);

    const jsonLd = [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.metaDescription,
        image,
        datePublished: post.publishedAt || post.createdAt,
        dateModified: post.updatedAt,
        author: { "@type": "Organization", name: post.author || "Verifitech" },
        publisher: {
          "@type": "Organization",
          name: "Verifitech",
          logo: { "@type": "ImageObject", url: `${siteUrl}/android-chrome-512x512.png` }
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        keywords: [post.focusKeyword, ...(post.tags || [])].filter(Boolean).join(", "),
        articleSection: postCats.map((c) => c.name)
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/resources/blog` },
          ...(postCats[0] ? [{ "@type": "ListItem", position: 3, name: postCats[0].name, item: `${siteUrl}/blog/category/${postCats[0].slug}` }] : []),
          { "@type": "ListItem", position: postCats[0] ? 4 : 3, name: post.title, item: canonical }
        ]
      }
    ];

    const html = await ejs.renderFile(path.join(VIEWS, "blog-post.ejs"), {
      siteUrl,
      post: { ...post, content: applyLinkRel(post.content, post.linkRel, settings, siteUrl) },
      settings,
      robots: robotsFor(post),
      postCats,
      related,
      canonical,
      image,
      og: {
        type: post.ogType || "article",
        title: post.ogTitle || post.metaTitle || post.title,
        description: post.ogDescription || post.metaDescription,
        image: absUrl(siteUrl, post.ogImage || post.featuredImage),
        imageAlt: post.ogImageAlt || (post.ogImage ? post.title : post.featuredImageAlt || post.title),
        twitterCard: post.twitterCard || "summary_large_image"
      },
      readTime: readingTime(post.content),
      isPreview: post.status !== "published",
      jsonLd: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
    });
    res.send(injectPreloader(html));
  } catch (err) { next(err); }
});

/* =========================================================
   ADMIN PAGES
========================================================= */

router.get("/blog-admin/login", (req, res) => {
  if (auth.getSessionUser(req)) return res.redirect("/blog-admin");
  res.sendFile(path.join(ADMIN_DIR, "login.html"));
});

router.get("/blog-admin", auth.requirePageAuth, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(ADMIN_DIR, "dashboard.html"));
});

/* =========================================================
   ADMIN API
========================================================= */

// One-time public key + nonce for encrypting the login form in the browser
router.get("/api/blog-admin/login-key", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ success: true, ...auth.issueLoginKey() });
});

router.post("/api/blog-admin/login", (req, res) => {
  res.set("Cache-Control", "no-store");
  const ip = req.ip;
  if (auth.tooManyAttempts(ip)) {
    return res.status(429).json({ success: false, message: "Too many attempts. Try again in 15 minutes." });
  }
  let creds;
  try {
    creds = auth.decryptLogin(req.body && req.body.payload); // plain-text logins are not accepted
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  const user = auth.checkLogin(creds.username, creds.password);
  if (!user) {
    auth.recordFailure(ip);
    return res.status(401).json({ success: false, message: "Invalid username or password" });
  }
  auth.clearFailures(ip);
  auth.createSession(res, req, user);
  notifyLogin({ user, ip, userAgent: req.get("user-agent") }); // email alert (BLOG_LOGIN_NOTIFY_TO in .env)
  res.json({ success: true, user: { username: user.username, name: user.name } });
});

router.post("/api/blog-admin/logout", (req, res) => {
  auth.clearSession(req, res);
  res.json({ success: true });
});

router.use("/api/blog-admin", auth.requireApiAuth);

router.get("/api/blog-admin/me", (req, res) => {
  res.json({ success: true, user: { username: req.blogUser.username, name: req.blogUser.name } });
});

router.get("/api/blog-admin/posts", (req, res) => {
  const posts = store.getPosts()
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ success: true, posts });
});

router.get("/api/blog-admin/posts/:id", (req, res) => {
  const post = store.getPosts().find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ success: false, message: "Post not found" });
  res.json({ success: true, post });
});

router.post("/api/blog-admin/posts", (req, res) => {
  try {
    const posts = store.getPosts();
    const post = buildPostFromBody(req.body || {}, null, posts, store.getCategories(), req.blogUser);
    posts.push(post);
    store.savePosts(posts);
    res.json({ success: true, post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put("/api/blog-admin/posts/:id", (req, res) => {
  try {
    const posts = store.getPosts();
    const i = posts.findIndex((p) => p.id === req.params.id);
    if (i === -1) return res.status(404).json({ success: false, message: "Post not found" });
    posts[i] = buildPostFromBody(req.body || {}, posts[i], posts, store.getCategories(), req.blogUser);
    store.savePosts(posts);
    res.json({ success: true, post: posts[i] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete("/api/blog-admin/posts/:id", (req, res) => {
  const posts = store.getPosts();
  const next = posts.filter((p) => p.id !== req.params.id);
  if (next.length === posts.length) return res.status(404).json({ success: false, message: "Post not found" });
  store.savePosts(next);
  res.json({ success: true });
});

router.post("/api/blog-admin/categories", (req, res) => {
  const name = String((req.body && req.body.name) || "").trim();
  if (!name) return res.status(400).json({ success: false, message: "Category name is required" });
  const slug = store.slugify((req.body && req.body.slug) || name);
  const cats = store.getCategories();
  const existing = cats.find((c) => c.slug === slug);
  if (existing) return res.json({ success: true, category: existing, categories: cats });
  const category = { slug, name };
  cats.push(category);
  store.saveCategories(cats);
  res.json({ success: true, category, categories: cats });
});

router.delete("/api/blog-admin/categories/:slug", (req, res) => {
  const slug = req.params.slug;
  const cats = store.getCategories().filter((c) => c.slug !== slug);
  store.saveCategories(cats);
  const posts = store.getPosts();
  posts.forEach((p) => { p.categories = (p.categories || []).filter((c) => c !== slug); });
  store.savePosts(posts);
  res.json({ success: true, categories: cats });
});

const IMAGE_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

router.post("/api/blog-admin/upload", (req, res) => {
  const { dataUrl, filename } = req.body || {};
  const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/.exec(String(dataUrl || ""));
  if (!m) return res.status(400).json({ success: false, message: "Only PNG, JPG, WEBP or GIF images are allowed" });
  const buffer = Buffer.from(m[2], "base64");
  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({ success: false, message: "Image must be under 5 MB" });
  }
  const base = store.slugify(String(filename || "image").replace(/\.[a-z0-9]+$/i, "")) || "image";
  const name = `${Date.now()}-${base}.${IMAGE_TYPES[m[1]]}`;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);
  res.json({ success: true, url: `/uploads/blog/${name}` });
});

router.get("/api/blog-admin/categories", (req, res) => {
  res.json({ success: true, categories: store.getCategories() });
});

/* ---------- settings: global head/footer code, link defaults, sitemap ---------- */

router.get("/api/blog-admin/settings", (req, res) => {
  const { siteUrl } = store.getConfig();
  res.json({ success: true, settings: store.getSettings(), siteUrl });
});

router.put("/api/blog-admin/settings", (req, res) => {
  const b = req.body || {};
  const current = store.getSettings();
  const priority = parseFloat(b.postPriority);
  const settings = {
    ...current,
    headCode: String(b.headCode ?? current.headCode).slice(0, 50000),
    footerCode: String(b.footerCode ?? current.footerCode).slice(0, 50000),
    defaultExternalRel: REL_OPTIONS.includes(b.defaultExternalRel) ? b.defaultExternalRel : current.defaultExternalRel,
    externalNewTab: b.externalNewTab === undefined ? current.externalNewTab : !!b.externalNewTab,
    sitemapIncludeStatic: b.sitemapIncludeStatic === undefined ? current.sitemapIncludeStatic : !!b.sitemapIncludeStatic,
    sitemapExclude: (Array.isArray(b.sitemapExclude) ? b.sitemapExclude : String(b.sitemapExclude || "").split(/\r?\n/))
      .map((u) => String(u).trim()).filter(Boolean).slice(0, 1000),
    postChangefreq: ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].includes(b.postChangefreq)
      ? b.postChangefreq : current.postChangefreq,
    postPriority: priority >= 0 && priority <= 1 ? priority.toFixed(1) : current.postPriority
  };
  store.saveSettings(settings);
  res.json({ success: true, settings });
});

router.get("/api/blog-admin/sitemap", (req, res) => {
  const entries = sitemapEntries();
  const count = (s) => entries.filter((e) => e.source === s).length;
  res.json({
    success: true,
    counts: { total: entries.length, pages: count("page"), posts: count("post"), categories: count("category") },
    entries
  });
});

module.exports = router;
module.exports.sitemapHandler = sendSitemap(false);

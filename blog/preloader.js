/* =========================================================
   SITE-WIDE PRELOADER
   ---------------------------------------------------------
   Adds a Verifitech-logo loading screen to every HTML page the
   server sends — without editing the HTML files themselves.

   - Shown instantly, fades out as soon as the page content is ready
     (at least 0.4 s so it doesn't flash, 2.5 s at the most).
   - Pages that already have their own preloader (id="vtPreloader",
     e.g. /resources/blog which waits for its articles) are left alone.
   - Turn it off for a page by adding  data-no-preloader  to <body>,
     or for the whole site with PRELOADER=false in .env.
========================================================= */

const fs = require("fs");
const path = require("path");

const LOGO = "/assets/logos/verifitech-logo.svg";

const SNIPPET = `
<!-- Site preloader (added by the server: blog/preloader.js) -->
<div id="vtPreloader" role="status" aria-live="polite" aria-label="Loading page">
  <img src="${LOGO}" alt="Verifitech logo" width="190" height="107" class="vt-pre-logo">
  <div class="vt-pre-bar"><span></span></div>
</div>
<style>
  #vtPreloader{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
    background:radial-gradient(circle at 50% 40%,#e0f7f7 0%,#fff 60%);transition:opacity .4s ease,visibility .4s ease}
  #vtPreloader.vt-hide{opacity:0;visibility:hidden;pointer-events:none}
  #vtPreloader .vt-pre-logo{width:190px;max-width:60vw;height:auto;animation:vtPulse 1.6s ease-in-out infinite}
  #vtPreloader .vt-pre-bar{width:170px;max-width:50vw;height:4px;border-radius:4px;background:rgba(26,194,193,.18);overflow:hidden}
  #vtPreloader .vt-pre-bar span{display:block;width:40%;height:100%;border-radius:4px;background:#1ac2c1;animation:vtSlide 1.1s ease-in-out infinite}
  @keyframes vtPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.04);opacity:.85}}
  @keyframes vtSlide{0%{transform:translateX(-100%)}100%{transform:translateX(260%)}}
  @media (prefers-reduced-motion:reduce){#vtPreloader .vt-pre-logo,#vtPreloader .vt-pre-bar span{animation:none}}
  @media print{#vtPreloader{display:none}}
</style>
<noscript><style>#vtPreloader{display:none}</style></noscript>
<script>
(function(){
  var done=false;
  function hide(){
    if(done)return;done=true;
    var el=document.getElementById('vtPreloader');
    if(!el)return;
    el.classList.add('vt-hide');
    setTimeout(function(){el.remove();},500);
  }
  window.hidePreloader=hide;
  var start=Date.now();
  // Hide once the page content is ready (shown at least 0.4 s so it doesn't flash)
  function ready(){setTimeout(hide,Math.max(0,400-(Date.now()-start)));}
  if(document.readyState!=='loading')ready();
  else document.addEventListener('DOMContentLoaded',ready);
  window.addEventListener('load',hide);
  setTimeout(hide,2500);                                   // never block the page for long
  window.addEventListener('pageshow',function(e){if(e.persisted)hide();}); // back/forward cache
})();
</script>
`;

const BODY_TAG = /<body(\s[^>]*)?>/i;

// Adds the preloader right after <body>, unless the page opts out or has its own
function injectPreloader(html) {
  if (process.env.PRELOADER === "false") return html;
  if (html.includes('id="vtPreloader"')) return html;
  const m = BODY_TAG.exec(html);
  if (!m || /data-no-preloader/i.test(m[0])) return html;
  const at = m.index + m[0].length;
  return html.slice(0, at) + SNIPPET + html.slice(at);
}

/* ---------- middleware for the static .html pages in public/ ---------- */

function preloaderMiddleware(publicDir) {
  const root = path.resolve(publicDir);
  const cache = new Map(); // file -> { mtimeMs, html }

  function resolveHtml(urlPath) {
    let p;
    try { p = decodeURIComponent(urlPath); } catch { return null; }
    if (p.includes("\0")) return null;
    const candidates = p.endsWith("/")
      ? [p + "index.html"]
      : /\.html?$/i.test(p) ? [p] : [p + ".html", p + "/index.html"];
    for (const c of candidates) {
      const file = path.resolve(root, "." + c);
      if (file !== root && !file.startsWith(root + path.sep)) continue; // stay inside public/
      try { if (fs.statSync(file).isFile()) return file; } catch { /* try next */ }
    }
    return null;
  }

  return function (req, res, next) {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (process.env.PRELOADER === "false") return next();
    if (req.path.startsWith("/api/") || req.path.startsWith("/blog-admin")) return next();
    // Same rule as express.static: a folder URL without "/" is redirected, so leave those to it
    const file = resolveHtml(req.path);
    if (!file) return next();
    if (!req.path.endsWith("/") && !/\.html?$/i.test(req.path) && file.endsWith(path.sep + "index.html") &&
        !fs.existsSync(path.resolve(root, "." + req.path + ".html"))) {
      return next();
    }

    let stat;
    try { stat = fs.statSync(file); } catch { return next(); }
    let entry = cache.get(file);
    if (!entry || entry.mtimeMs !== stat.mtimeMs) {
      try {
        entry = { mtimeMs: stat.mtimeMs, html: injectPreloader(fs.readFileSync(file, "utf8")) };
      } catch { return next(); }
      cache.set(file, entry);
      if (cache.size > 500) cache.delete(cache.keys().next().value);
    }
    res.set("Last-Modified", stat.mtime.toUTCString());
    res.type("html").send(entry.html);
  };
}

module.exports = { injectPreloader, preloaderMiddleware };

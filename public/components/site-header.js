/*
 * Verifitech — reusable site header
 * ---------------------------------
 * Usage (put this where the header should appear, right after <body>):
 *
 *   <script src="/components/site-header.js"></script>
 *   <site-header></site-header>
 *
 * Edit the menu ONCE here and every page updates.
 * Requires Bootstrap 5 CSS + JS on the page (bootstrap JS is auto-loaded if missing).
 */
(function () {
  // Work out the site root from where this script was loaded, so the
  // component works on the live site, with `npm start`, with VS Code
  // Live Server, and when a page is opened straight from disk.
  var SCRIPT = document.currentScript;
  var SITE_ROOT = SCRIPT ? new URL("../", SCRIPT.src).href : location.origin + "/";
  // Only the real server (live site / `npm start` on port 3000) understands
  // links without ".html"; everywhere else we add it.
  var LOCAL = location.protocol === "file:" ||
    (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(location.hostname) && location.port !== "3000");
  function fixLinks(root) {
    root.querySelectorAll('a[href^="/"]').forEach(function (a) {
      var p = a.getAttribute("href").slice(1);
      if (LOCAL) p = p === "" ? "index.html" : p + ".html";
      a.setAttribute("href", new URL(p, SITE_ROOT).href);
    });
  }
  if (customElements.get("site-header")) return;

  var STYLE_ID = "site-header-styles";
  var CSS = String.raw`
site-header {
  display: block;
  font-family: 'Inter', sans-serif;
  --primary: #1ac2c1;
  --primary-dark: #16a8a7;
  --primary-light: #e0f7f7;
  --dark: #0f172a;
  --navy: #1e293b;
  --gray: #64748b;
}
site-header .navbar-brand img { width: 165px; height: auto; }
site-header .nav-link.active, site-header .dropdown-item.active { color: var(--primary); background: transparent; }
site-header .dropdown-item.active { background: var(--primary-light); }
site-header .navbar { z-index: 1050; }
site-header .dropdown-menu { z-index: 1060; position: absolute; }
site-header .dropdown-item { position: relative; z-index: 1061; }
site-header .navbar { padding: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0, 0, 0, 0.05); height: 80px; }
site-header .navbar.scrolled { box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08); }
site-header .navbar-collapse { background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(12px); border-radius: 12px; padding: 1rem; margin-top: 0.5rem; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15); }
@media (min-width: 992px) {
  site-header .navbar-collapse { background: transparent; backdrop-filter: none; padding: 0; margin-top: 0; box-shadow: none; }
}
site-header .navbar-brand { font-weight: 800; font-size: 1.8rem; color: var(--dark); letter-spacing: -0.5px; display: flex; flex-direction: column; line-height: 1.1; transition: color 0.3s; }
site-header .navbar-brand img { object-fit: contain; display: block; }
site-header .navbar-brand span { color: var(--primary); }
site-header .nav-link { font-weight: 600; color: var(--navy); margin: 0 0.6rem; position: relative; font-size: 0.9rem; transition: all 0.3s ease; padding: 2rem 0.5rem !important; display: flex; align-items: center; gap: 4px; }
site-header .nav-link:hover { color: var(--primary); }
site-header .dropdown-menu { border: none; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15); border-radius: 12px; padding: 1rem; margin-top: 0.5rem; min-width: 280px; border-top: 3px solid var(--primary); transition: all 0.3s ease; }
site-header .dropdown-menu.mega-menu { min-width: 600px; padding: 1.5rem; }
site-header .dropdown-item { padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.9rem; font-weight: 500; color: var(--navy); transition: all 0.3s ease; display: flex; align-items: center; gap: 10px; }
site-header .dropdown-item:hover { background: var(--primary-light); color: var(--primary); transform: translateX(5px); }
site-header .dropdown-item i { font-size: 1.1rem; color: var(--primary); transition: color 0.3s; }
site-header .dropdown-header { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); margin-bottom: 0.5rem; padding: 0.5rem 1rem; }
site-header .dropdown-divider { margin: 0.8rem 0; opacity: 0.1; }
site-header .btn-sales { background: var(--primary); color: white !important; border: none; padding: 0.6rem 1.5rem; border-radius: 6px; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease; white-space: nowrap; margin-left: 1rem; box-shadow: 0 4px 15px rgba(26, 194, 193, 0.3); }
site-header .btn-sales:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(26, 194, 193, 0.4); }
site-header .btn-login { background-color: #ffffff !important; color: #00bfa5 !important; border: 1px solid #00bfa5 !important; box-shadow: 0 2px 8px rgba(0, 191, 165, 0.3) !important; padding: 8px 24px; border-radius: 6px; font-weight: 500; text-decoration: none; transition: all 0.3s ease; margin: 12px; }
site-header .btn-login:hover { background-color: #00bfa5 !important; color: #ffffff !important; box-shadow: 0 4px 12px rgba(0, 191, 165, 0.4) !important; transform: translateY(-1px); }
site-header .country-selector { display: flex; align-items: center; gap: 6px; padding: 0.5rem; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.85rem; font-weight: 600; color: var(--navy); cursor: pointer; transition: all 0.3s ease; margin-left: 1rem; }
site-header .country-selector:hover { border-color: var(--primary); color: var(--primary); }
site-header .country-selector.dropdown-toggle::after { display: none !important; content: none !important; border: none !important; }
site-header .country-selector i.bi-chevron-down { font-size: 0.7rem; color: var(--navy); transition: transform 0.3s ease; }
site-header .country-selector:hover i.bi-chevron-down { color: var(--primary); }
site-header .country-selector[aria-expanded="true"] i.bi-chevron-down { transform: rotate(180deg); }
site-header .country-flag { font-size: 1.2rem; }
@media (max-width: 991px) {
  site-header .navbar-collapse { background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(12px); border-radius: 12px; padding: 1rem; margin-top: 0.5rem; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15); }
  site-header .nav-link { padding: 1rem 0.5rem !important; justify-content: space-between; }
  site-header .dropdown-arrow { margin-left: auto; font-size: 0.7rem; }
  site-header .dropdown-menu { border: none; padding-left: 1rem; background: rgba(26, 194, 193, 0.03); margin-top: 0.5rem; }
  site-header .dropdown-menu.mega-menu { min-width: 100%; }
  site-header .country-selector { margin-left: 0; margin-top: 0.5rem; }
}
@media (max-width: 375px) {
  site-header .navbar-brand img { width: 140px; }
}
@media (max-width: 991.98px) {
  site-header .navbar { height: auto; min-height: 80px; }
  site-header .navbar > .container { min-height: 80px; }
  site-header .navbar-brand img { max-width: 180px; height: 60px; width: auto; }
  site-header .navbar-collapse { width: 100%; max-height: calc(100vh - 90px); overflow-y: auto; overflow-x: hidden; }
  site-header .navbar-nav { width: 100%; }
  site-header .nav-link { padding: 0.75rem 0.5rem !important; margin: 0; width: 100%; }
  site-header .dropdown-menu { position: static !important; float: none; width: 100%; min-width: 0; margin-top: 0; box-shadow: none; border-top: 2px solid var(--primary); }
  site-header .dropdown-menu.mega-menu { min-width: 0; padding: 0.75rem; }
  site-header .dropdown-menu.mega-menu .row { display: block; }
  site-header .dropdown-menu.mega-menu .col-md-6 { width: 100%; }
  site-header .btn-login, site-header .btn-sales { margin: 0.5rem 0; }
  site-header .country-selector { margin: 0.5rem 0; }
  site-header .navbar-collapse > .d-flex { flex-wrap: wrap; gap: 0.5rem; width: 100%; }
}
@media (min-width: 992px) {
  site-header .navbar-collapse { align-items: center; }
}
`;

  var HTML = `
<nav class="navbar navbar-expand-lg fixed-top">
  <div class="container">
    <a class="navbar-brand" href="/">
      <img
        src="https://wp.verifitech.com/wp-content/uploads/2022/05/verifitech-logo.svg"
        alt="Verifitech - Background Verification &amp; Employee Screening Services"
        title="Verifitech - Enterprise Background Verification Solutions"
        width="165" height="50"
      />
    </a>

    <button class="navbar-toggler border-0 shadow-none" type="button"
      data-bs-toggle="collapse" data-bs-target="#navbarNav"
      aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav mx-auto">
        <!-- SOLUTIONS -->
        <li class="nav-item dropdown">
          <a class="nav-link" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Solutions <span class="dropdown-arrow">▾</span>
          </a>
          <div class="dropdown-menu mega-menu">
            <div class="row">
              <div class="col-md-6">
                <div class="dropdown-header">Verification Services</div>
                <a href="/checks/id-verification" class="dropdown-item"><i class="bi bi-person-badge"></i> ID Verification</a>
                <a href="/checks/address-verification" class="dropdown-item"><i class="bi bi-geo-alt"></i> Address Verification</a>
                <a href="/checks/employment" class="dropdown-item"><i class="bi bi-briefcase"></i> Employment Verification</a>
                <a href="/checks/education-check" class="dropdown-item"><i class="bi bi-mortarboard"></i> Education Verification</a>
                <a href="/checks/court-verification" class="dropdown-item"><i class="bi bi-shield-exclamation"></i> Court Record Verification</a>
                <a href="/checks/reference" class="dropdown-item"><i class="bi bi-people"></i> Reference Check</a>
                <a href="/checks/DIN-verification" class="dropdown-item"><i class="fa-regular fa-id-card"></i> DIN Verification</a>
                <a href="/checks/Directorship-check" class="dropdown-item"><i class="fa-regular fa-user"></i> Directorship</a>
              </div>
              <div class="col-md-6">
                <div class="dropdown-header">Specialized Checks</div>
                <a href="/checks/global-check" class="dropdown-item"><i class="bi bi-globe"></i> Global Database Verification</a>
                <a href="/checks/credit-check" class="dropdown-item"><i class="bi bi-credit-card"></i> Credit Check</a>
                <a href="/checks/gap-verification" class="dropdown-item"><i class="bi bi-calendar-x"></i> Gap Check</a>
                <a href="/checks/socialmeidaverification" class="dropdown-item"><i class="bi bi-share"></i> Social Media Verification</a>
                <a href="/checks/Police-clearance" class="dropdown-item"><i class="bi bi-shield-check"></i>police Clearance</a>
                <a href="/checks/drug-test" class="dropdown-item"><i class="bi bi-capsule"></i> Drug Test Screening</a>
                <a href="/checks/vendor" class="dropdown-item"><i class="fa-solid fa-magnifying-glass"></i> Vendor Due Diligence</a>
                <a href="/checks/passport-verification" class="dropdown-item"><i class="fa-solid fa-passport"></i> Passport Verification</a>
              </div>
            </div>
          </div>
        </li> 

        <!-- PRODUCTS -->
        <li class="nav-item dropdown">
          <a class="nav-link" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Products <span class="dropdown-arrow">▾</span>
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="/products/exitinterview"><i class="bi bi-box-arrow-right"></i> Exit Interviews</a></li>
            <li><a class="dropdown-item" href="/products/pm"><i class="bi bi-graph-up"></i> Psychometric</a></li>
            <li><a class="dropdown-item" href="/products/HRMS"><i class="bi bi-laptop"></i> HRMS</a></li>
            <li><a class="dropdown-item" href="/products/DMS"><i class="fa-regular fa-file"></i> DMS</a></li>
          </ul>
        </li>

        <!-- INDUSTRY -->
        <li class="nav-item dropdown">
          <a class="nav-link" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Industry <span class="dropdown-arrow">▾</span>
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="/industries/banks"><i class="bi bi-bank"></i> Banking &amp; Financial Services</a></li>
            <li><a class="dropdown-item" href="/industries/healthcare"><i class="bi bi-heart-pulse"></i> Healthcare and Pharma</a></li>
            <li><a class="dropdown-item" href="/industries/education"><i class="bi bi-book"></i> Education</a></li>
            <li><a class="dropdown-item" href="/industries/manufacturing"><i class="bi bi-building-gear"></i> Manufacturing</a></li>
            <li><a class="dropdown-item" href="/industries/IT-ITES"><i class="bi bi-laptop"></i> IT/ITeS</a></li>
            <li><a class="dropdown-item" href="/industries/FMCG"><i class="bi bi-box"></i> FMCG</a></li>
            <li><a class="dropdown-item" href="/industries/Logistics"><i class="bi bi-truck"></i> Logistics</a></li>
            <li><a class="dropdown-item" href="/industries/Realestate-%26-constructation"><i class="bi bi-house"></i> Real Estate &amp; Construction</a></li>
            <li><a class="dropdown-item" href="/industries/Retail%20%26%20E-commerce"><i class="bi bi-shop"></i> Retail &amp; E-commerce</a></li>
            <li><a class="dropdown-item" href="/industries/travel-industries"><i class="bi bi-airplane"></i> Travel and Hospitality</a></li>
            <li><a class="dropdown-item" href="/industries/staffing"><i class="bi bi-person-workspace"></i> Staffing and Recruitment</a></li>
            <li><a class="dropdown-item" href="/industries/telecom"><i class="bi bi-broadcast"></i> Telecom</a></li>
          </ul>
        </li>

        <!-- RESOURCES -->
        <li class="nav-item dropdown">
          <a class="nav-link" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Resources <span class="dropdown-arrow">▾</span>
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="/resources/blog"><i class="bi bi-journal-text"></i> Blogs</a></li>
            <li><a class="dropdown-item" href="/resources/whitepapers"><i class="bi bi-file-earmark-text"></i> Whitepapers</a></li>
            <li><a class="dropdown-item" href="/resources/casestudy"><i class="bi bi-star"></i> Case Study</a></li>
            <li><a class="dropdown-item" href="/resources/webinar"><i class="bi bi-camera-video"></i> Webinar</a></li>
            <li><a class="dropdown-item" href="/products/api"><i class="bi bi-plug"></i> API</a></li>
          </ul>
        </li>

        <!-- COMPANY -->
        <li class="nav-item dropdown">
          <a class="nav-link" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Company <span class="dropdown-arrow">▾</span>
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="/company/partnership"><i class="bi bi-hand-thumbs-up"></i> Partnership</a></li>
            <li><a class="dropdown-item" href="/company/aboutus"><i class="bi bi-info-circle"></i> About Us</a></li>
            <li><a class="dropdown-item" href="/company/careers"><i class="bi bi-briefcase"></i> Careers</a></li>
          </ul>
        </li>

        <!-- HELP CENTER -->
        <li class="nav-item dropdown">
          <a class="nav-link" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Help Center <span class="dropdown-arrow">▾</span>
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="/helpcenter/customer"><i class="bi bi-building"></i> For Customers</a></li>
            <li><a class="dropdown-item" href="/helpcenter/partner"><i class="bi bi-people"></i> For Partners</a></li>
          </ul>
        </li>
      </ul>

      <div class="d-flex align-items-center gap-3">
        <a href="https://web.verifitech.com/" target="_blank" rel="noopener" class="btn-login">Login</a>
      </div>

      <div class="d-flex align-items-center">
        <a href="/contact/contact" class="btn btn-sales">Contact</a>
        <div class="dropdown">
          <div class="country-selector dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" tabindex="0">
            <span class="country-flag" id="current-flag">🇮🇳</span>
            <span id="current-country">India</span>
            <i class="bi bi-chevron-down ms-1" style="font-size: 0.7rem"></i>
          </div>
          <ul class="dropdown-menu dropdown-menu-end" style="min-width: 180px">
            <li><a href="/" class="dropdown-item country-option" data-country="India" data-flag="🇮🇳"><span class="country-flag">🇮🇳</span> India</a></li>
            <li><a href="/countries/usa" class="dropdown-item country-option" data-country="USA" data-flag="🇺🇸"><span class="country-flag">🇺🇸</span> USA</a></li>
            <li><a href="/countries/UAE" class="dropdown-item country-option" data-country="UAE" data-flag="🇦🇪"><span class="country-flag">🇦🇪</span> UAE</a></li>
            <li><a href="/countries/aus" class="dropdown-item country-option" data-country="Australia" data-flag="🇦🇺"><span class="country-flag">🇦🇺</span> Australia</a></li>
            <li><a href="/countries/uk" class="dropdown-item country-option" data-country="UK" data-flag="🇬🇧"><span class="country-flag">🇬🇧</span> UK</a></li>
            <li><a href="/countries/singapore" class="dropdown-item country-option" data-country="Singapore" data-flag="🇸🇬"><span class="country-flag">🇸🇬</span> Singapore</a></li>
            <li><a href="/countries/Ireland" class="dropdown-item country-option" data-country="Ireland" data-flag="🇮🇪"><span class="country-flag">🇮🇪</span> Ireland</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</nav>
`;

  // Normalise a path so "/checks/employment.html", "/checks/employment" and
  // "/checks/employment/" all compare equal.
  function norm(p) {
    try { p = decodeURIComponent(p); } catch (e) {}
    p = p.replace(/\/index(\.html)?$/i, "/").replace(/\.html$/i, "").replace(/\/+$/, "");
    return (p || "/").toLowerCase();
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  // Pages that don't use Bootstrap still need its CSS, icons and font for the header.
  function ensureCss() {
    var need = [
      ["bootstrap.min.css", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"],
      ["bootstrap-icons", "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"],
      ["font-awesome", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"],
      ["family=Inter", "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"]
    ];
    need.forEach(function (n) {
      if (document.querySelector('link[href*="' + n[0] + '"]')) return;
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = n[1];
      document.head.insertBefore(l, document.head.firstChild);
    });
  }

  // A few pages don't load Bootstrap's JS; dropdowns need it.
  function ensureBootstrapJs() {
    if (window.bootstrap || document.querySelector('script[src*="bootstrap.bundle"],script[src*="bootstrap.min.js"]')) return;
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
    s.defer = true;
    document.head.appendChild(s);
  }

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      ensureStyles();
      ensureCss();
      // <site-header spacer> reserves room under the fixed header on pages
      // whose own CSS doesn't already push content down.
      this.innerHTML = HTML + (this.hasAttribute("spacer") ? '<div class="site-header-spacer" style="height:80px"></div>' : "");
      fixLinks(this);
      this.markActive();
      this.bind();
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ensureBootstrapJs, { once: true });
      } else {
        ensureBootstrapJs();
      }
    }

    markActive() {
      var here = norm(location.pathname);
      this.querySelectorAll(".navbar-nav a.dropdown-item[href]").forEach(function (a) {
        if (norm(new URL(a.href).pathname) === here) {
          a.classList.add("active");
          var top = a.closest(".nav-item");
          if (top) top.querySelector(".nav-link").classList.add("active");
        }
      });
      // Show the current country in the selector.
      var self = this;
      this.querySelectorAll(".country-option").forEach(function (a) {
        if (norm(new URL(a.href).pathname) === here && here !== "/") {
          self.querySelector("#current-flag").textContent = a.dataset.flag;
          self.querySelector("#current-country").textContent = a.dataset.country;
        }
      });
      // Hide the country already shown in the selector, so the dropdown
      // lists only the other countries (e.g. on /countries/aus, no Australia).
      var current = self.querySelector("#current-country").textContent.trim();
      this.querySelectorAll(".country-option").forEach(function (a) {
        if (a.dataset.country === current) a.closest("li").style.display = "none";
      });
    }

    bind() {
      var navbar = this.querySelector(".navbar");
      var onScroll = function () { navbar.classList.toggle("scrolled", window.scrollY > 50); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      // Close the mobile menu after a link is chosen.
      var collapse = this.querySelector(".navbar-collapse");
      this.querySelectorAll(".navbar-nav .dropdown-item").forEach(function (item) {
        item.addEventListener("click", function () {
          if (collapse.classList.contains("show") && window.bootstrap) {
            window.bootstrap.Collapse.getOrCreateInstance(collapse).hide();
          }
        });
      });
    }
  }

  customElements.define("site-header", SiteHeader);
})();

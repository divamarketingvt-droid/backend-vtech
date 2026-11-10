/*
 * Verifitech — reusable site footer
 * ---------------------------------
 * Usage (put this where the footer should appear, just before the page's scripts):
 *
 *   <script src="/components/site-footer.js"></script>
 *   <site-footer></site-footer>
 *
 * Edit the footer ONCE here and every page updates.
 * Includes the newsletter (Zoho) form, links, social icons and the floating call button.
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
  if (customElements.get("site-footer")) return;

  var STYLE_ID = "site-footer-styles";
  var CSS = String.raw`
site-footer {
  display: block;
  font-family: 'Inter', sans-serif;
  --primary: #1ac2c1;
  --primary-dark: #16a8a7;
  --primary-light: #e0f7f7;
  --dark: #0f172a;
  --navy: #1e293b;
  --gray: #64748b;
}
site-footer .input-group-wrapper { display: flex; gap: 12px; align-items: flex-start; }
@media (max-width: 991px) { site-footer .input-group-wrapper { flex-direction: column; } }
site-footer .zf-errorMessage.show { display: flex; }
site-footer .footer { background: #f8fafc; color: var(--dark); padding: 80px 0 40px; }
site-footer .footer-brand { font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem; display: block; color: var(--dark); text-decoration: none; }
site-footer .footer-brand span { color: var(--primary); }
site-footer .footer-desc { color: var(--gray); margin-bottom: 2rem; max-width: 300px; line-height: 1.8; }
site-footer .footer h5 { font-weight: 700; margin-bottom: 1.5rem; color: var(--dark); font-size: 1.1rem; }
site-footer .footer-links { list-style: none; padding: 0; }
site-footer .footer-links li { margin-bottom: 1rem; }
site-footer .footer-links a { color: var(--gray); text-decoration: none; transition: all 0.3s; display: inline-block; }
site-footer .footer-links a:hover { color: var(--primary); transform: translateX(5px); }
site-footer .footer-bottom { margin-top: 60px; padding-top: 30px; border-top: 1px solid #cbd5e1; text-align: center; color: var(--gray); font-size: 0.9rem; }
site-footer .social-icons { display: flex; gap: 1rem; margin-top: 2rem; }
site-footer .social-icon { width: 44px; height: 44px; border-radius: 50%; background: rgba(15, 23, 42, 0.1); display: flex; align-items: center; justify-content: center; color: var(--dark); transition: all 0.3s; text-decoration: none; }
site-footer .social-icon:hover { background: var(--primary); transform: translateY(-3px); color: white; }
site-footer .newsletter-footer-section { background: linear-gradient(135deg, rgba(26, 194, 193, 0.1) 0%, rgba(26, 194, 193, 0.05) 100%); border-radius: 20px; padding: 40px; margin-bottom: 50px; border: 1px solid rgba(26, 194, 193, 0.2); position: relative; overflow: hidden; }
site-footer .newsletter-footer-section::before { content: ''; position: absolute; top: -50%; right: -10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(26, 194, 193, 0.15) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
site-footer .newsletter-icon-footer { width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.8rem; flex-shrink: 0; box-shadow: 0 8px 20px rgba(26, 194, 193, 0.3); }
site-footer .newsletter-title { font-size: 1.5rem; font-weight: 700; color: var(--dark); margin-bottom: 0.25rem; }
site-footer .newsletter-subtitle { color: var(--gray); font-size: 0.95rem; margin: 0; line-height: 1.5; }
site-footer .newsletter-form-footer { width: 100%; position: relative; z-index: 2; }
site-footer .zf-tempContDiv { flex: 1; position: relative; margin: 0; padding: 0; }
site-footer .newsletter-input { width: 100%; padding: 14px 20px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; color: var(--dark); background: white; transition: all 0.3s ease; min-width: 0; font-family: 'Inter', sans-serif; margin: 0; }
site-footer .newsletter-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(26, 194, 193, 0.1); }
site-footer .newsletter-input::placeholder { color: #94a3b8; }
site-footer .zf-errorMessage { color: #ef4444; font-size: 0.85rem; margin-top: 6px; margin-bottom: 0; display: none; align-items: center; gap: 4px; font-weight: 500; }
site-footer .zf-errorMessage::before { content: '\F332'; font-family: 'bootstrap-icons'; font-size: 0.8rem; }
site-footer .newsletter-btn { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color: white; border: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; white-space: nowrap; box-shadow: 0 4px 15px rgba(26, 194, 193, 0.3); font-family: 'Inter', sans-serif; height: fit-content; }
site-footer .newsletter-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(26, 194, 193, 0.4); }
site-footer .newsletter-btn i { transition: transform 0.3s ease; }
site-footer .newsletter-btn:hover i { transform: translateX(4px); }
site-footer .newsletter-btn:disabled { opacity: 0.7; cursor: not-allowed; }
site-footer .newsletter-disclaimer { color: var(--gray); font-size: 0.85rem; margin: 8px 0 0 0; display: flex; align-items: center; gap: 6px; }
site-footer .newsletter-disclaimer i { color: var(--primary); }
site-footer .zf-error { border-color: #ef4444 !important; background-color: #fef2f2 !important; }
site-footer .zf-success { border-color: #10b981 !important; background-color: #f0fdf4 !important; }
site-footer .footer-main-content { margin-top: 20px; }
site-footer .footer-logo { width: 180px; height: auto; margin-bottom: 20px; }
site-footer .footer-description { font-size: 14px; line-height: 1.6; max-width: 280px; color: var(--gray); }
site-footer .footer-heading { color: #1a1a1a; font-size: 16px; font-weight: 600; margin-bottom: 20px; }
site-footer .social-links { display: flex; justify-content: flex-end; gap: 15px; }
site-footer .copyright { font-size: 14px; margin: 0; color: var(--gray); }
site-footer .float-tooltip { position: absolute; right: 70px; background: #333; color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px; white-space: nowrap; opacity: 0; visibility: hidden; transition: all 0.3s ease; pointer-events: none; }
site-footer .float-tooltip::after { content: ''; position: absolute; right: -5px; top: 50%; transform: translateY(-50%); border-top: 5px solid transparent; border-bottom: 5px solid transparent; border-left: 5px solid #333; }
site-footer .whatsapp-float:hover .float-tooltip { opacity: 1; visibility: visible; right: 75px; }
@media (max-width: 991px) {
  site-footer .newsletter-footer-section { padding: 30px 20px; text-align: center; margin-bottom: 40px; }
  site-footer .newsletter-footer-section .d-flex.align-items-center.gap-3 { flex-direction: column; text-align: center; gap: 1rem !important; }
  site-footer .newsletter-icon-footer { margin: 0 auto; width: 50px; height: 50px; font-size: 1.5rem; }
  site-footer .newsletter-title { font-size: 1.25rem; }
  site-footer .newsletter-subtitle { font-size: 0.9rem; max-width: 100%; }
  site-footer .zf-tempContDiv { width: 100%; }
  site-footer .newsletter-input { width: 100%; padding: 12px 16px; font-size: 16px; }
  site-footer .newsletter-btn { width: 100%; justify-content: center; padding: 12px 24px; }
  site-footer .footer .col-lg-2 { flex: 0 0 33.333%; max-width: 33.333%; }
  site-footer .footer .col-lg-3 { flex: 0 0 100%; max-width: 100%; text-align: center; }
  site-footer .footer-logo { margin: 0 auto 20px; display: block; }
  site-footer .footer-description { max-width: 100%; margin: 0 auto 2rem; }
  site-footer .social-links { justify-content: center; margin-top: 20px; }
  site-footer .copyright { text-align: center; }
}
@media (max-width: 767px) {
  site-footer .newsletter-footer-section { padding: 24px 16px; margin-bottom: 30px; border-radius: 16px; }
  site-footer .newsletter-footer-section::before { width: 200px; height: 200px; top: -30%; right: -20%; }
  site-footer .newsletter-icon-footer { width: 48px; height: 48px; font-size: 1.25rem; border-radius: 12px; }
  site-footer .newsletter-title { font-size: 1.15rem; margin-bottom: 0.5rem; }
  site-footer .newsletter-subtitle { font-size: 0.85rem; line-height: 1.4; }
  site-footer .newsletter-disclaimer { justify-content: center; font-size: 0.8rem; }
  site-footer .footer .col-lg-2, site-footer .footer .col-lg-3, site-footer .footer .col-md-6 { flex: 0 0 100%; max-width: 100%; text-align: center; margin-bottom: 2rem; }
  site-footer .footer-links { display: flex; flex-direction: column; align-items: center; }
  site-footer .footer-heading { margin-bottom: 1rem; }
  site-footer .float-tooltip { display: none; }
}
@media (max-width: 375px) {
  site-footer .newsletter-footer-section { padding: 20px 12px; }
  site-footer .newsletter-title { font-size: 1.1rem; }
  site-footer .newsletter-input { padding: 10px 14px; font-size: 16px; }
  site-footer .newsletter-btn { padding: 10px 20px; font-size: 0.95rem; }
}
@media (max-width: 767px) {
  site-footer .footer-main-content { margin-top: 10px; }
  site-footer .social-links { justify-content: center; margin-top: 1rem; }
  site-footer .copyright { text-align: center; margin-bottom: 1rem; }
}
@media (min-width: 992px) {
  site-footer .newsletter-footer-section .d-flex.align-items-center.gap-3 { justify-content: flex-start; }
  site-footer .newsletter-icon-footer { flex-shrink: 0; }
}
site-footer .support-dashboard-float .float-tooltip { right: 70px; }
site-footer .support-dashboard-float:hover .float-tooltip { opacity: 1; visibility: visible; right: 75px; }
site-footer .call-float { position: fixed; bottom: 100px; right: 30px; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: 0 4px 20px rgba(26, 194, 193, 0.4); z-index: 9999; transition: all 0.3s ease; border: 3px solid rgba(255, 255, 255, 0.3); animation: call-pulse 2s infinite; }
site-footer .call-float:hover { transform: scale(1.1); color: white; box-shadow: 0 6px 25px rgba(26, 194, 193, 0.6); animation: none; }
site-footer .call-float i { font-size: 1.6rem; }
site-footer .call-float .float-tooltip { right: 70px; }
site-footer .call-float:hover .float-tooltip { opacity: 1; visibility: visible; right: 75px; }
@keyframes call-pulse {
  0% {
    box-shadow: 0 4px 20px rgba(26, 194, 193, 0.4);
  }
  50% {
    box-shadow: 0 4px 30px rgba(26, 194, 193, 0.7), 0 0 0 12px rgba(26, 194, 193, 0);
  }
  100% {
    box-shadow: 0 4px 20px rgba(26, 194, 193, 0.4);
  }
}
`;

  var YEAR = new Date().getFullYear();

  var HTML = `
<footer class="footer">
  <div class="container">
    <!-- Newsletter (Zoho form) -->
    <div class="newsletter-footer-section">
      <div class="row align-items-center">
        <div class="col-lg-6 mb-4 mb-lg-0">
          <div class="d-flex align-items-center gap-3 newsletter-header-content">
            <div class="newsletter-icon-footer"><i class="bi bi-envelope-open"></i></div>
            <div class="newsletter-text-content">
              <h2 class="newsletter-title">Stay Updated</h2>
              <p class="newsletter-subtitle">Get the latest insights on background verification, compliance updates, and industry trends.</p>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <form
            action="https://forms.zohopublic.in/verifitech/form/EmailForm/formperma/SKIJ3QipRaWUwFKnGbpchcOlGRfoBCpr-GTyQfdQAUQ/htmlRecords/submit"
            name="form" method="POST" accept-charset="UTF-8" enctype="multipart/form-data"
            id="form" class="newsletter-form-footer" novalidate>
            <input type="hidden" name="zf_referrer_name" value="">
            <input type="hidden" name="zf_redirect_url" value="">
            <input type="hidden" name="zc_gad" value="">
            <div class="input-group-wrapper">
              <div class="zf-tempContDiv">
                <input type="text" name="Email" checktype="c5" value="" maxlength="255" fieldType="9"
                  placeholder="Enter your work email" class="newsletter-input" id="Email" aria-label="Work email" />
                <p id="Email_error" class="zf-errorMessage">Please enter a valid email address</p>
              </div>
              <button type="submit" class="newsletter-btn zf-submitColor">
                Subscribe <i class="bi bi-arrow-right"></i>
              </button>
            </div>
            <p class="newsletter-disclaimer"><i class="bi bi-shield-check"></i> We respect your privacy. No spam, ever.</p>
          </form>
        </div>
      </div>
    </div>

    <div class="row footer-main-content">
      <div class="col-lg-3 col-md-6 mb-4 mb-lg-0">
        <div class="footer-brand">
          <img src="https://wp.verifitech.com/wp-content/uploads/2022/05/verifitech-logo.svg"
            alt="Verifitech - Background Verification &amp; Employee Screening Services"
            title="Verifitech - Enterprise Background Verification Solutions"
            class="footer-logo" loading="lazy" />
        </div>
        <p class="footer-description">
          Verifitech provides global background verification services for enterprises,
          covering identity, employment, education, address and criminal record checks through API, bulk upload and field verification.
        </p>
      </div>

      <div class="col-lg-2 col-md-6 mb-4 mb-lg-0">
        <div class="footer-column">
          <h2 class="footer-heading">Solutions</h2>
          <ul class="footer-links">
            <li><a href="/checks/employment">Employment Check</a></li>
            <li><a href="/checks/education-check">Education Verification</a></li>
            <li><a href="/checks/reference">Reference Checks</a></li>
            <li><a href="/checks/gap-verification">Gap Analysis</a></li>
          </ul>
        </div>
      </div>

      <div class="col-lg-2 col-md-6 mb-4 mb-lg-0">
        <h2 class="footer-heading">Company</h2>
        <ul class="footer-links">
          <li><a href="/company/aboutus">About Us</a></li>
          <li><a href="/company/partnership">Partnership</a></li>
          <li><a href="/company/careers">Careers</a></li>
          <li><a href="/contact/contact">Contact</a></li>
        </ul>
      </div>

      <div class="col-lg-2 col-md-6 mb-4 mb-lg-0">
        <h2 class="footer-heading">Resources</h2>
        <ul class="footer-links">
          <li><a href="/resources/blog">Blog</a></li>
          <li><a href="/resources/casestudy">Case Studies</a></li>
        </ul>
      </div>

      <div class="col-lg-2 col-md-6 mb-4 mb-lg-0">
        <h2 class="footer-heading">Our policy</h2>
        <ul class="footer-links">
          <li><a href="/Privacy-policy-pages/disclaimer">Disclaimer</a></li>
          <li><a href="/Privacy-policy-pages/terms%20-and%20-conditions">Terms of Service</a></li>
          <li><a href="/Privacy-policy-pages/privacypolicy">Privacy Policy</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="row align-items-center">
        <div class="col-md-6">
          <p class="copyright">© ${YEAR} Verifitech Private Limited. All rights reserved.</p>
        </div>
        <div class="col-md-6">
          <div class="social-links">
            <a href="https://www.linkedin.com/company/verifitech/" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Visit Verifitech on LinkedIn" title="Verifitech on LinkedIn"><i class="bi bi-linkedin" aria-hidden="true"></i></a>
            <a href="https://www.facebook.com/VerifiTechInfo/" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Visit Verifitech on Facebook" title="Verifitech on Facebook"><i class="bi bi-facebook" aria-hidden="true"></i></a>
            <a href="https://m.youtube.com/@verifitechindia4689" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Visit Verifitech on YouTube" title="Verifitech on YouTube"><i class="bi bi-youtube" aria-hidden="true"></i></a>
            <a href="https://www.instagram.com/verifitech/reels/" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Visit Verifitech on Instagram" title="Verifitech on Instagram"><i class="bi bi-instagram" aria-hidden="true"></i></a>
            <a href="https://wa.me/919176663777" target="_blank" rel="noopener noreferrer" class="social-icon site-footer-whatsapp" aria-label="Chat with Verifitech on WhatsApp" title="Chat with Verifitech on WhatsApp"><i class="bi bi-whatsapp" aria-hidden="true"></i></a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Floating call button -->
  <a href="tel:+919176663777" class="call-float" aria-label="Call Us">
    <i class="bi bi-telephone-fill"></i>
    <span class="float-tooltip">Call Us</span>
  </a>
</footer>
`;

  var WHATSAPP_NUMBER = "919176663777";
  var WHATSAPP_MESSAGE = "Hi Verifitech Team,\n\nI am interested in your background verification services. Please share more details.";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  // Pages that don't use Bootstrap still need its CSS and icons for the footer.
  function ensureCss() {
    [
      ["bootstrap.min.css", "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"],
      ["bootstrap-icons", "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"]
    ].forEach(function (n) {
      if (document.querySelector('link[href*="' + n[0] + '"]')) return;
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = n[1];
      document.head.insertBefore(l, document.head.firstChild);
    });
  }

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      ensureStyles();
      ensureCss();
      this.innerHTML = HTML;
      fixLinks(this);
      this.bind();
    }

    bind() {
      // Newsletter: validate before sending to Zoho.
      var form = this.querySelector(".newsletter-form-footer");
      var input = form.querySelector(".newsletter-input");
      var error = form.querySelector(".zf-errorMessage");
      form.addEventListener("submit", function (e) {
        var ok = isEmail(input.value.trim());
        input.classList.toggle("zf-error", !ok);
        error.classList.toggle("show", !ok);
        if (!ok) { e.preventDefault(); input.focus(); return; }
        input.classList.add("zf-success");
        form.querySelector("button[type=submit]").disabled = true;
      });
      input.addEventListener("input", function () {
        input.classList.remove("zf-error");
        error.classList.remove("show");
      });

      // WhatsApp: include the current page title in the message.
      this.querySelector(".site-footer-whatsapp").addEventListener("click", function (e) {
        e.preventDefault();
        var msg = WHATSAPP_MESSAGE + (document.title ? "\n\nI am currently viewing: " + document.title : "");
        window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
      });
    }
  }

  customElements.define("site-footer", SiteFooter);
})();

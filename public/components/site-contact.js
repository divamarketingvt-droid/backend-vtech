/*
 * Verifitech — reusable "Contact Us" section
 * ------------------------------------------
 * Usage (put this where the section should appear, e.g. just above the footer):
 *
 *   <script src="/components/site-contact.js"></script>
 *   <site-contact></site-contact>
 *
 * Two tabs:
 *   Business   -> Zoho "Business" form (Full Name, Email, Contact Number,
 *                 Dropdown). "What are you looking for?" lists every check in
 *                 /checks, plus "Other" (shows a text box). On a check page,
 *                 that check is pre-selected.
 *   Individual -> Zoho "individualForm" (First/Last Name, Email,
 *                 What are you looking for?).
 *
 * Edit the list of checks ONCE here (CHECKS below) and every page updates.
 */
(function () {
  var SCRIPT = document.currentScript;
  var SITE_ROOT = SCRIPT ? new URL("../", SCRIPT.src).href : location.origin + "/";
  var LOCAL = location.protocol === "file:" ||
    (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(location.hostname) && location.port !== "3000");
  function fixLinks(root) {
    root.querySelectorAll('a[href^="/"]').forEach(function (a) {
      var p = a.getAttribute("href").slice(1);
      if (LOCAL) p = p === "" ? "index.html" : p + ".html";
      a.setAttribute("href", new URL(p, SITE_ROOT).href);
    });
  }
  if (customElements.get("site-contact")) return;

  var BUSINESS_ACTION = "https://forms.zohopublic.in/verifitech/form/Business/formperma/XUBS3dnmwo5a4C36XBthKqE5L9kT7Ei7yWL4ykhSU6I/htmlRecords/submit";
  var CANDIDATE_ACTION = "https://forms.zohopublic.in/verifitech/form/individualForm/formperma/adF_Mk-7JfNB7gTETrJGUsHWyETMV-B5sonAI4JNEJI/htmlRecords/submit";

  // Every page in /checks.  file = page name in /checks, label = what the user sees,
  // zoho = the exact option text in the Zoho "Business" form's "Dropdown" field
  // (Zoho ignores values it doesn't know, so these must match Zoho letter for letter).
  var CHECKS = [
    { file: "id-verification",         label: "ID Verification",              zoho: "ID Verification" },
    { file: "address-verification",    label: "Address Verification",         zoho: "Address Verification" },
    { file: "employment",              label: "Employment Verification",      zoho: "Employment Verification" },
    { file: "education-check",         label: "Education Verification",       zoho: "Education Verification" },
    { file: "court-verification",      label: "Court Record Verification",    zoho: "Court Record Verification" },
    { file: "reference",               label: "Reference Check",              zoho: "Reference Check" },
    { file: "DIN-verification",        label: "DIN Verification",             zoho: "DIN Verification" },
    { file: "Directorship-check",      label: "Directorship Check",           zoho: "Directorship" },
    { file: "global-check",            label: "Global Database Verification", zoho: "Global DataBase Verification" },
    { file: "credit-check",            label: "Credit Check",                 zoho: "Credit Check" },
    { file: "gap-verification",        label: "Gap Verification",             zoho: "Gap Check" },
    { file: "socialmeidaverification", label: "Social Media Verification",    zoho: "Social Media Verification" },
    { file: "Police-clearance",        label: "Police Clearance",             zoho: "Police Clearance" },
    { file: "drug-test",               label: "Drug Test Screening",          zoho: "Drug Test Screening" },
    { file: "vendor",                  label: "Vendor Due Diligence",         zoho: "Vendor Due Diligence" },
    { file: "passport-verification",   label: "Passport Verification",        zoho: "Passport Verification" }
  ];
  // "Other" option at the end of the Business dropdown. When chosen, a text box
  // appears so the visitor can type what they need. The Zoho form has no "Other"
  // option yet; set zoho to its exact text once it is added in Zoho.
  var OTHER = { label: "Other", zoho: "" };

  var STYLE_ID = "site-contact-styles";
  var CSS = String.raw`
site-contact {
  display: block;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --sc-primary: #0aa8a7;
  --sc-primary-dark: #08908f;
  --sc-primary-light: #d9f6f6;
  --sc-dark: #0b1b3f;
  --sc-text: #3b4a63;
  --sc-border: #cfd6e0;
  background: #fbfcfd;
  padding: 80px 16px;
}
site-contact *, site-contact *::before, site-contact *::after { box-sizing: border-box; }
site-contact .sc-wrap { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.15fr 1fr; gap: 48px; align-items: center; }
site-contact .sc-badge { display: inline-block; background: var(--sc-primary-light); color: var(--sc-primary-dark); font-weight: 600; font-size: 1rem; padding: 8px 18px; border-radius: 999px; margin-bottom: 20px; }
site-contact .sc-title { font-size: clamp(2rem, 3.6vw, 3.25rem); line-height: 1.1; font-weight: 800; color: var(--sc-dark); letter-spacing: -0.02em; margin: 0 0 20px; }
site-contact .sc-title span { color: var(--sc-primary); }
site-contact .sc-lead { font-size: 1.1rem; line-height: 1.6; color: var(--sc-text); margin: 0 0 28px; max-width: 520px; }
site-contact .sc-points { list-style: none; padding: 0; margin: 0; display: grid; gap: 14px; }
site-contact .sc-points li { display: flex; align-items: center; gap: 16px; font-size: 1.05rem; color: var(--sc-dark); }
site-contact .sc-ico { width: 44px; height: 44px; flex: 0 0 44px; border-radius: 50%; background: var(--sc-primary-light); display: grid; place-items: center; color: #1d4ed8; }
site-contact .sc-ico svg { width: 22px; height: 22px; }

site-contact .sc-card { background: #fff; border: 1px solid #e3e8ee; border-radius: 20px; padding: 32px; box-shadow: 0 10px 40px rgba(15, 23, 42, 0.06); }
site-contact .sc-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
site-contact .sc-tab { display: flex; align-items: center; justify-content: center; gap: 12px; height: 60px; border-radius: 10px; border: 1.5px solid var(--sc-border); background: #fff; color: var(--sc-dark); font: inherit; font-size: 1.05rem; font-weight: 700; cursor: pointer; transition: background .2s, color .2s, border-color .2s; }
site-contact .sc-tab svg { width: 24px; height: 24px; }
site-contact .sc-tab:hover { border-color: var(--sc-primary); }
site-contact .sc-tab[aria-selected="true"] { background: var(--sc-primary); border-color: var(--sc-primary); color: #fff; }
site-contact .sc-tab:focus-visible, site-contact .sc-input:focus-visible, site-contact .sc-submit:focus-visible { outline: 3px solid rgba(10, 168, 167, .35); outline-offset: 2px; }

site-contact form { display: grid; gap: 18px; }
site-contact form[hidden] { display: none; }
site-contact .sc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
site-contact .sc-field { position: relative; }
site-contact .sc-wrap > *, site-contact form, site-contact .sc-field, site-contact .sc-ms-btn { min-width: 0; }
site-contact .sc-input { width: 100%; height: 56px; padding: 0 18px; border: 1.5px solid var(--sc-border); border-radius: 8px; background: #fff; color: var(--sc-dark); font: inherit; font-size: 1rem; transition: border-color .2s, box-shadow .2s; }
site-contact .sc-input::placeholder { color: #5b6880; }
site-contact .sc-input:focus { outline: none; border-color: var(--sc-primary); box-shadow: 0 0 0 3px rgba(10, 168, 167, .15); }
site-contact .sc-ms-btn { display: flex; align-items: center; text-align: left; padding-right: 44px; cursor: pointer; color: #5b6880; }
site-contact .sc-ms-btn.has-value { color: var(--sc-dark); }
site-contact .sc-ms-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
site-contact .sc-ms-btn[aria-expanded="true"] { border-color: var(--sc-primary); box-shadow: 0 0 0 3px rgba(10, 168, 167, .15); }
site-contact .sc-ms-panel { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 20; background: #fff; border: 1.5px solid var(--sc-border); border-radius: 10px; box-shadow: 0 16px 40px rgba(15, 23, 42, .14); padding: 12px; }
site-contact .sc-ms-panel[hidden] { display: none; }
site-contact .sc-ms-hint { margin: 0 4px 8px; font-size: .8rem; font-weight: 600; color: var(--sc-text); text-transform: uppercase; letter-spacing: .04em; }
site-contact .sc-ms-list { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 8px; max-height: 260px; overflow-y: auto; }
site-contact .sc-ms-opt { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 6px; font-size: .92rem; color: var(--sc-dark); cursor: pointer; line-height: 1.3; }
site-contact .sc-ms-opt:hover { background: #f1fafa; }
site-contact .sc-ms-opt input { width: 18px; height: 18px; flex: 0 0 18px; margin: 0; accent-color: var(--sc-primary); cursor: pointer; }
site-contact .sc-ms-done { display: block; width: 100%; margin-top: 10px; height: 40px; border: 0; border-radius: 6px; background: var(--sc-primary-light); color: var(--sc-primary-dark); font: inherit; font-weight: 700; cursor: pointer; }
site-contact .sc-ms-done:hover { background: #c4efef; }
site-contact .sc-ms-btn, site-contact select.sc-input { appearance: none; -webkit-appearance: none; padding-right: 44px; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235b6880' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 18px center; }
site-contact select.sc-input:invalid { color: #5b6880; }
site-contact select.sc-input option { color: var(--sc-dark); }
site-contact .sc-field.sc-bad .sc-input { border-color: #dc2626; }
site-contact .sc-err { display: none; color: #dc2626; font-size: .82rem; margin-top: 6px; }
site-contact .sc-field.sc-bad .sc-err { display: block; }
site-contact .sc-submit { height: 56px; border: 0; border-radius: 8px; background: var(--sc-primary); color: #fff; font: inherit; font-size: 1.15rem; font-weight: 700; cursor: pointer; transition: background .2s, transform .2s; }
site-contact .sc-submit:hover { background: var(--sc-primary-dark); }
site-contact .sc-submit:disabled { opacity: .7; cursor: wait; }
site-contact .sc-note { text-align: center; font-size: .9rem; color: var(--sc-text); margin: 4px 0 0; }
site-contact .sc-note a { color: var(--sc-primary); text-decoration: none; }
site-contact .sc-note a:hover { text-decoration: underline; }
site-contact .sc-done { display: none; text-align: center; padding: 32px 8px; }
site-contact .sc-done.show { display: block; }
site-contact .sc-done h3 { color: var(--sc-dark); font-size: 1.5rem; margin: 12px 0 8px; }
site-contact .sc-done p { color: var(--sc-text); margin: 0 0 20px; }
site-contact .sc-done .sc-check { width: 64px; height: 64px; margin: 0 auto; border-radius: 50%; background: var(--sc-primary-light); color: var(--sc-primary); display: grid; place-items: center; }
site-contact .sc-again { background: none; border: 1.5px solid var(--sc-primary); color: var(--sc-primary); border-radius: 8px; padding: 10px 22px; font: inherit; font-weight: 600; cursor: pointer; }
site-contact .sc-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }

@media (max-width: 991px) {
  site-contact { padding: 56px 16px; }
  site-contact .sc-wrap { grid-template-columns: 1fr; gap: 36px; }
}
@media (max-width: 575px) {
  site-contact .sc-card { padding: 20px; border-radius: 16px; }
  site-contact .sc-row { grid-template-columns: 1fr; }
  site-contact .sc-ms-list { grid-template-columns: 1fr; }
  site-contact .sc-tabs { gap: 10px; }
  site-contact .sc-tab { height: 52px; font-size: .95rem; gap: 8px; }
}
`;

  var ICON = {
    briefcase: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 3h6a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H2V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm0 3h6V5H9v1Zm-7 7h8v1a2 2 0 0 0 4 0v-1h8v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5Z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3.2"/><path d="M6.2 18.4a7 7 0 0 1 11.6 0"/></svg>',
    headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19a3 3 0 0 1-3 3h-3"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16v12H8l-4 4V4Z"/><path d="M8.5 10h.01M12 10h.01M15.5 10h.01" stroke-linecap="round" stroke-width="2.6"/></svg>',
    tick: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7"/></svg>'
  };

  function field(inner, err) {
    return '<div class="sc-field">' + inner + '<div class="sc-err">' + err + '</div></div>';
  }

  function template(uid, preselect) {
    function box(label, on) {
      return '<label class="sc-ms-opt"><input type="checkbox" name="Looking" value="' + label + '"' + (on ? " checked" : "") + '><span>' + label + '</span></label>';
    }
    var opts = CHECKS.map(function (c) { return box(c.label, c.file === preselect); }).join("") + box(OTHER.label, false);
    var hidden = '<input type="hidden" name="zf_referrer_name" value=""><input type="hidden" name="zf_redirect_url" value=""><input type="hidden" name="zc_gad" value="">';
    return '' +
'<section class="sc-wrap" aria-labelledby="' + uid + '-title">' +
'  <div>' +
'    <span class="sc-badge">Contact Us</span>' +
'    <h2 class="sc-title" id="' + uid + '-title">Let’s Build a<br>More Trusted <span>Tomorrow</span></h2>' +
'    <p class="sc-lead">Have a question or need assistance? Our team is here to help with all your background verification needs.</p>' +
'    <ul class="sc-points">' +
'      <li><span class="sc-ico">' + ICON.headset + '</span>Get expert support</li>' +
'      <li><span class="sc-ico">' + ICON.bolt + '</span>Explore our solutions</li>' +
'      <li><span class="sc-ico">' + ICON.chat + '</span>Discuss your requirements</li>' +
'    </ul>' +
'  </div>' +
'  <div class="sc-card">' +
'    <div class="sc-body">' +
'    <div class="sc-tabs" role="tablist">' +
'      <button type="button" class="sc-tab" role="tab" id="' + uid + '-tb" aria-controls="' + uid + '-fb" aria-selected="true" data-tab="business">' + ICON.briefcase + 'Business</button>' +
'      <button type="button" class="sc-tab" role="tab" id="' + uid + '-ti" aria-controls="' + uid + '-fi" aria-selected="false" tabindex="-1" data-tab="individual">' + ICON.user + 'Individual</button>' +
'    </div>' +

'    <form id="' + uid + '-fb" role="tabpanel" aria-labelledby="' + uid + '-tb" data-form="business" action="' + BUSINESS_ACTION + '" method="POST" novalidate>' + hidden +
         field('<input class="sc-input" name="SingleLine" placeholder="Full Name" aria-label="Full Name" autocomplete="name" maxlength="255" required>', "Please enter your name") +
'      <div class="sc-row">' +
           field('<input class="sc-input" type="email" name="Email" placeholder="Business Email" aria-label="Business Email" autocomplete="email" maxlength="255" required data-business>', "Please enter a valid business email") +
           field('<input class="sc-input" type="tel" name="PhoneNumber_countrycode" placeholder="Contact Number" aria-label="Contact Number" autocomplete="tel" maxlength="20" required>', "Please enter a valid contact number") +
'      </div>' +
         field('<input class="sc-input" name="SingleLine1" placeholder="Company" aria-label="Company" autocomplete="organization" maxlength="255" required>', "Please enter your company") +
'      <div class="sc-field sc-ms">' +
'        <button type="button" class="sc-input sc-ms-btn" aria-haspopup="true" aria-expanded="false" aria-controls="' + uid + '-ms"><span class="sc-ms-text">What are you looking for?</span></button>' +
'        <div class="sc-ms-panel" id="' + uid + '-ms" role="group" aria-label="What are you looking for? (choose one or more)" hidden>' +
'          <p class="sc-ms-hint">Select all that apply</p>' +
'          <div class="sc-ms-list">' + opts + '</div>' +
'          <button type="button" class="sc-ms-done">Done</button>' +
'        </div>' +
'        <div class="sc-err">Please choose at least one check</div>' +
'      </div>' +
'      <div class="sc-other" hidden>' +
           field('<input class="sc-input" name="OtherText" placeholder="Please tell us what you need" aria-label="Please tell us what you need" maxlength="500" required disabled>', "Please tell us what you need") +
'      </div>' +
'      <button type="submit" class="sc-submit">Submit</button>' +
'      <p class="sc-note">By submitting this form, you are agreeing to our <a href="/Privacy-policy-pages/privacypolicy">privacy policy</a>.</p>' +
'    </form>' +

'    <form id="' + uid + '-fi" role="tabpanel" aria-labelledby="' + uid + '-ti" data-form="individual" action="' + CANDIDATE_ACTION + '" method="POST" novalidate hidden>' + hidden +
'      <div class="sc-row">' +
           field('<input class="sc-input" name="Name_First" placeholder="First Name" aria-label="First Name" autocomplete="given-name" maxlength="255" required>', "Please enter your first name") +
           field('<input class="sc-input" name="Name_Last" placeholder="Last Name" aria-label="Last Name" autocomplete="family-name" maxlength="255" required>', "Please enter your last name") +
'      </div>' +
         field('<input class="sc-input" type="email" name="Email" placeholder="Email Address" aria-label="Email Address" autocomplete="email" maxlength="255" required>', "Please enter a valid email") +
         field('<input class="sc-input" name="SingleLine" placeholder="What are you looking for?" aria-label="What are you looking for?" maxlength="500" required>', "Please tell us what you are looking for") +
'      <button type="submit" class="sc-submit">Submit</button>' +
'      <p class="sc-note">By submitting this form, you are agreeing to our <a href="/Privacy-policy-pages/privacypolicy">privacy policy</a>.</p>' +
'    </form>' +
'    </div>' +

'    <div class="sc-done" role="status" aria-live="polite">' +
'      <div class="sc-check">' + ICON.tick + '</div>' +
'      <h3>Thank you<span class="sc-name"></span>!</h3>' +
'      <p>Our team will get back to you shortly.</p>' +
'      <button type="button" class="sc-again">Submit another request</button>' +
'    </div>' +
'  </div>' +
'</section>';
  }

  var FREE_DOMAINS = ["gmail.com", "yahoo.com", "yahoo.co.in", "yahoo.co.uk", "hotmail.com", "outlook.com", "live.com", "icloud.com", "aol.com", "rediffmail.com", "protonmail.com", "zoho.com", "ymail.com", "msn.com"];

  function check(input) {
    var v = input.value.trim();
    var ok = v !== "";
    if (ok && input.type === "email") {
      ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (ok && input.hasAttribute("data-business")) ok = FREE_DOMAINS.indexOf(v.split("@")[1].toLowerCase()) === -1;
    }
    if (ok && input.type === "tel") ok = /^\+?[\d\s()-]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7;
    input.closest(".sc-field").classList.toggle("sc-bad", !ok);
    input.setAttribute("aria-invalid", ok ? "false" : "true");
    return ok;
  }

  // Which check page are we on? (so it can be pre-selected)
  function currentCheck() {
    var m = decodeURIComponent(location.pathname).match(/\/checks\/([^\/]+?)(?:\.html)?\/?$/);
    if (!m) return "";
    var f = m[1].toLowerCase();
    for (var i = 0; i < CHECKS.length; i++) if (CHECKS[i].file.toLowerCase() === f) return CHECKS[i].file;
    return "";
  }

  var counter = 0;

  class SiteContact extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = "1";
      if (!document.getElementById(STYLE_ID)) {
        var s = document.createElement("style");
        s.id = STYLE_ID;
        s.textContent = CSS;
        document.head.appendChild(s);
      }
      if (!this.id) this.id = counter === 0 ? "contact-form" : "contact-form-" + counter;
      this.innerHTML = template("sc" + (counter++), currentCheck());
      fixLinks(this);

      var self = this;
      var tabs = this.querySelectorAll(".sc-tab");
      var forms = this.querySelectorAll("form");
      var body = this.querySelector(".sc-body");
      var done = this.querySelector(".sc-done");

      function select(name, focus) {
        tabs.forEach(function (t) {
          var on = t.dataset.tab === name;
          t.setAttribute("aria-selected", on);
          t.tabIndex = on ? 0 : -1;
          if (on && focus) t.focus();
        });
        forms.forEach(function (f) { f.hidden = f.dataset.form !== name; });
      }
      tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { select(t.dataset.tab); });
        t.addEventListener("keydown", function (e) {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            select(tabs[(i + 1) % tabs.length].dataset.tab, true);
          }
        });
      });

      forms.forEach(function (form) {
        var inputs = form.querySelectorAll(".sc-input:not(.sc-ms-btn)");

        // Business: "What are you looking for?" — dropdown of checkboxes (pick one or more).
        var ms = form.querySelector(".sc-ms");
        var msBtn, msPanel, msText, boxes, otherBox, otherInput;
        function picked() {
          return Array.prototype.filter.call(boxes, function (b) { return b.checked; }).map(function (b) { return b.value; });
        }
        function refresh() {
          var list = picked();
          msText.textContent = !list.length ? "What are you looking for?"
            : list.length <= 2 ? list.join(", ")
            : list.slice(0, 2).join(", ") + " +" + (list.length - 2) + " more";
          msBtn.classList.toggle("has-value", list.length > 0);
          var other = list.indexOf(OTHER.label) !== -1;
          otherBox.hidden = !other;
          otherInput.disabled = !other;
          if (!other) otherInput.closest(".sc-field").classList.remove("sc-bad");
          if (list.length) ms.classList.remove("sc-bad");
        }
        function openMs(open) {
          msPanel.hidden = !open;
          msBtn.setAttribute("aria-expanded", open);
        }
        function checkMs() {
          var ok = picked().length > 0;
          ms.classList.toggle("sc-bad", !ok);
          msBtn.setAttribute("aria-invalid", ok ? "false" : "true");
          return ok;
        }
        if (ms) {
          msBtn = ms.querySelector(".sc-ms-btn");
          msPanel = ms.querySelector(".sc-ms-panel");
          msText = ms.querySelector(".sc-ms-text");
          boxes = ms.querySelectorAll('input[type="checkbox"]');
          otherBox = form.querySelector(".sc-other");
          otherInput = otherBox.querySelector("input");
          msBtn.addEventListener("click", function () { openMs(msPanel.hidden); });
          ms.querySelector(".sc-ms-done").addEventListener("click", function () { openMs(false); msBtn.focus(); });
          boxes.forEach(function (b) {
            b.addEventListener("change", function () {
              refresh();
              if (b.value === OTHER.label && b.checked) { openMs(false); otherInput.focus(); }
            });
          });
          document.addEventListener("click", function (e) {
            if (!msPanel.hidden && !ms.contains(e.target)) openMs(false);
          });
          ms.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && !msPanel.hidden) { openMs(false); msBtn.focus(); }
          });
          refresh();
        }

        inputs.forEach(function (inp) {
          var ev = inp.tagName === "SELECT" ? "change" : "blur";
          inp.addEventListener(ev, function () { check(inp); });
          inp.addEventListener("input", function () {
            if (inp.closest(".sc-field").classList.contains("sc-bad")) check(inp);
          });
        });

        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var ok = true, first = null;
          inputs.forEach(function (inp) {
            if (!inp.disabled && !check(inp)) { ok = false; first = first || inp; }
          });
          if (ms && !checkMs()) {
            ok = false;
            if (!first || msBtn.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING) first = msBtn;
          }
          if (!ok) { first.focus(); return; }

          form.querySelector('[name="zf_referrer_name"]').value = location.href;

          var data = new FormData(form);
          var name;
          if (form.dataset.form === "business") {
            // Zoho "Business" form fields: SingleLine (Full Name), Email,
            // PhoneNumber_countrycode, Dropdown (one value).
            var list = picked();
            var firstCheck = CHECKS.filter(function (x) { return list.indexOf(x.label) !== -1; })[0];
            var zohoValue = firstCheck ? firstCheck.zoho : OTHER.zoho;
            data.delete("Looking");
            data.delete("OtherText");    // no matching field in the Zoho form yet
            data.delete("SingleLine1");  // Company: no matching field in the Zoho form yet
            if (zohoValue) data.set("Dropdown", zohoValue);
            name = data.get("SingleLine");
          } else {
            // Zoho "individualForm" fields: Name_First, Name_Last, Email,
            // SingleLine (What are you looking for?).
            name = data.get("Name_First");
          }

          var btn = form.querySelector(".sc-submit");
          btn.disabled = true;
          btn.textContent = "Submitting…";

          fetch(form.action, { method: "POST", body: data, mode: "no-cors" })
            .then(function () {
              self.querySelector(".sc-name").textContent = name ? ", " + String(name).trim().split(/\s+/)[0] : "";
              body.hidden = true;
              done.classList.add("show");
              form.reset();
              if (ms) { refresh(); ms.classList.remove("sc-bad"); }
            })
            .catch(function () {
              alert("Sorry, something went wrong. Please try again or email connect@verifitech.com.");
            })
            .then(function () {
              btn.disabled = false;
              btn.textContent = "Submit";
            });
        });
      });

      this.querySelector(".sc-again").addEventListener("click", function () {
        done.classList.remove("show");
        body.hidden = false;
      });
    }
  }

  customElements.define("site-contact", SiteContact);
})();

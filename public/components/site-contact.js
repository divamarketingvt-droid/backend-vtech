/*
 * Verifitech — reusable "Contact Us" section
 * ------------------------------------------
 * Usage (put this where the section should appear, e.g. just above the footer):
 *
 *   <script src="/components/site-contact.js"></script>
 *   <site-contact></site-contact>
 *
 * Two tabs:
 *   Business   -> Zoho "Contact11" form. "What are you looking for?" lists every
 *                 check in /checks, plus "Other" (shows a text box). On a check
 *                 page, that check is pre-selected.
 *   Individual -> Zoho "CandidateDetails2" form (name + email). The typed
 *                 "What are you looking for?" is emailed via /api/submit-contact.
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

  var BUSINESS_ACTION = "https://forms.zohopublic.in/verifitech/form/Contact11/formperma/9sK-SF3CwyblvIWCRgSvNK2NNjTYicXeIaw3s4zV1G8/htmlRecords/submit";
  var CANDIDATE_ACTION = "https://forms.zohopublic.in/verifitech/form/CandidateDetails2/formperma/AAu_pxyF_x894Jj90mWKsHv6Hxj0dBzqM11f4Zhz1bQ/htmlRecords/submit";

  // Every page in /checks.  file = page name in /checks, label = what the user sees,
  // zoho = an option that already exists in the Zoho "Dropdown1" field (Zoho rejects
  // values it doesn't know). The exact check chosen is always sent in the message too.
  // Once you add all these labels as options in Zoho, set zoho = label.
  var CHECKS = [
    { file: "id-verification",         label: "ID Verification",              zoho: "Identity Verification" },
    { file: "address-verification",    label: "Address Verification",         zoho: "Address Verification" },
    { file: "employment",              label: "Employment Verification",      zoho: "Employment Verification" },
    { file: "education-check",         label: "Education Verification",       zoho: "Education Verification" },
    { file: "court-verification",      label: "Court Record Verification",    zoho: "Criminal Record Check" },
    { file: "reference",               label: "Reference Check",              zoho: "Reference Check" },
    { file: "DIN-verification",        label: "DIN Verification",             zoho: "Identity Verification" },
    { file: "Directorship-check",      label: "Directorship Check",           zoho: "Identity Verification" },
    { file: "global-check",            label: "Global Database Verification", zoho: "Criminal Record Check" },
    { file: "credit-check",            label: "Credit Check",                 zoho: "Employment Verification" },
    { file: "gap-verification",        label: "Gap Verification",             zoho: "Employment Verification" },
    { file: "socialmeidaverification", label: "Social Media Verification",    zoho: "Reference Check" },
    { file: "Police-clearance",        label: "Police Clearance",             zoho: "Criminal Record Check" },
    { file: "drug-test",               label: "Drug Test Screening",          zoho: "Criminal Record Check" },
    { file: "vendor",                  label: "Vendor Due Diligence",         zoho: "Reference Check" },
    { file: "passport-verification",   label: "Passport Verification",        zoho: "Identity Verification" }
  ];
  // "Other" option at the end of the Business dropdown. When chosen, a text box
  // appears so the visitor can type what they need. Change zoho to "Other" once
  // that option exists in the Zoho dropdown.
  var OTHER = { label: "Other", zoho: "Employment Verification" };

  // Zoho's candidate form has no message field, so the Individual tab's
  // "What are you looking for?" text is also emailed through the site's own API.
  var CONTACT_API = SITE_ROOT + "api/submit-contact";

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
site-contact .sc-input { width: 100%; height: 56px; padding: 0 18px; border: 1.5px solid var(--sc-border); border-radius: 8px; background: #fff; color: var(--sc-dark); font: inherit; font-size: 1rem; transition: border-color .2s, box-shadow .2s; }
site-contact .sc-input::placeholder { color: #5b6880; }
site-contact .sc-input:focus { outline: none; border-color: var(--sc-primary); box-shadow: 0 0 0 3px rgba(10, 168, 167, .15); }
site-contact select.sc-input { appearance: none; -webkit-appearance: none; padding-right: 44px; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235b6880' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 18px center; }
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
    var opts = CHECKS.map(function (c) {
      return '<option value="' + c.label + '"' + (c.file === preselect ? " selected" : "") + ">" + c.label + "</option>";
    }).join("");
    var hidden = '<input type="hidden" name="zf_referrer_name" value=""><input type="hidden" name="zf_redirect_url" value=""><input type="hidden" name="zc_gad" value=""><input type="hidden" name="Date" value="">';
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
'      <input type="hidden" name="MultiLine" value="">' +
         field('<input class="sc-input" name="SingleLine" placeholder="Full Name" aria-label="Full Name" autocomplete="name" maxlength="255" required>', "Please enter your name") +
'      <div class="sc-row">' +
           field('<input class="sc-input" type="email" name="Email" placeholder="Business Email" aria-label="Business Email" autocomplete="email" maxlength="255" required data-business>', "Please enter a valid business email") +
           field('<input class="sc-input" type="tel" name="PhoneNumber_countrycode" placeholder="Contact Number" aria-label="Contact Number" autocomplete="tel" maxlength="20" required>', "Please enter a valid contact number") +
'      </div>' +
         field('<input class="sc-input" name="SingleLine1" placeholder="Company" aria-label="Company" autocomplete="organization" maxlength="255" required>', "Please enter your company") +
         field('<select class="sc-input" name="Dropdown1" aria-label="What are you looking for?" required><option value="" disabled' + (preselect ? "" : " selected") + '>What are you looking for?</option>' + opts + '<option value="' + OTHER.label + '">' + OTHER.label + '</option></select>', "Please choose a check") +
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
         field('<input class="sc-input" name="LookingFor" placeholder="What are you looking for?" aria-label="What are you looking for?" maxlength="500" required>', "Please tell us what you are looking for") +
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
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function today() {
    var d = new Date();
    return String(d.getDate()).padStart(2, "0") + "-" + MONTHS[d.getMonth()] + "-" + d.getFullYear();
  }

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
        var inputs = form.querySelectorAll(".sc-input");
        // Business: show a text box when "Other" is chosen in the dropdown.
        var dropdown = form.querySelector('[name="Dropdown1"]');
        var otherBox = form.querySelector(".sc-other");
        var otherInput = otherBox && otherBox.querySelector("input");
        function toggleOther() {
          var on = dropdown.value === OTHER.label;
          otherBox.hidden = !on;
          otherInput.disabled = !on;
          if (!on) otherInput.closest(".sc-field").classList.remove("sc-bad");
        }
        if (otherBox) dropdown.addEventListener("change", function () {
          toggleOther();
          if (!otherBox.hidden) otherInput.focus();
        });
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
          if (!ok) { first.focus(); return; }

          form.querySelector('[name="Date"]').value = today();
          form.querySelector('[name="zf_referrer_name"]').value = location.href;

          var data = new FormData(form);
          var name;
          if (form.dataset.form === "business") {
            var label = data.get("Dropdown1");
            var c = CHECKS.filter(function (x) { return x.label === label; })[0];
            var wanted = label;
            if (label === OTHER.label) wanted = "Other - " + String(data.get("OtherText") || "").trim();
            data.delete("OtherText");
            data.set("Dropdown1", c ? c.zoho : OTHER.zoho);
            data.set("MultiLine", "Looking for: " + wanted + "\nPage: " + location.href);
            name = data.get("SingleLine");
          } else {
            name = data.get("Name_First");
            var looking = String(data.get("LookingFor") || "").trim();
            data.delete("LookingFor");
            // Zoho's candidate form can't store this text, so email it too (best effort).
            fetch(CONTACT_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fullName: (data.get("Name_First") + " " + data.get("Name_Last")).trim(),
                email: data.get("Email"),
                phone: "",
                message: "Individual enquiry - Looking for: " + looking + " (Page: " + location.href + ")"
              })
            }).catch(function () {});
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
              if (otherBox) toggleOther();
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

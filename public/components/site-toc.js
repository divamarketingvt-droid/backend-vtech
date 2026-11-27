/*
 * Verifitech — Table of contents
 * ------------------------------
 * Builds an "On this page" box from the headings of an article.
 *
 *   <script src="/components/site-toc.js"></script>
 *   vtBuildToc({
 *     root:  element (or array of elements) holding the article,
 *     mount: element where the box goes,
 *     selector: 'h2, h3',   // headings to list (optional)
 *     minItems: 2,          // hide the box if fewer headings (optional)
 *     flat: false           // true = one numbered list, no sub-levels (optional)
 *   });
 *
 * Clicking an entry scrolls smoothly WITHOUT changing the URL hash,
 * so it is safe on pages that use #post-123 / #case-123 for routing.
 */
(function () {
  var STYLE_ID = 'vt-toc-styles';
  var CSS =
    '.vt-toc{background:#fff;border:1px solid #e2e8f0;border-left:4px solid #1ac2c1;border-radius:14px;' +
    'padding:1rem 1.25rem;margin:0 0 2rem;box-shadow:0 4px 20px rgba(15,23,42,.05);font-family:inherit}' +
    '.vt-toc summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:.5rem;font-weight:700;' +
    'font-size:1rem;color:#0f172a}' +
    '.vt-toc summary::-webkit-details-marker{display:none}' +
    '.vt-toc summary .vt-toc-count{margin-left:auto;font-size:.75rem;font-weight:600;color:#64748b}' +
    '.vt-toc summary .vt-toc-chev{transition:transform .2s;color:#1ac2c1}' +
    '.vt-toc details[open] summary .vt-toc-chev{transform:rotate(180deg)}' +
    '.vt-toc ol{list-style:none;margin:.75rem 0 0;padding:0;counter-reset:vt-toc}' +
    '.vt-toc li{margin:0}' +
    '.vt-toc a{display:block;padding:.35rem .5rem;border-radius:8px;color:#334155;text-decoration:none;' +
    'font-size:.92rem;line-height:1.4}' +
    '.vt-toc a:hover,.vt-toc a:focus-visible{background:#e0f7f7;color:#16a8a7}' +
    '.vt-toc a.vt-active{color:#16a8a7;font-weight:600;background:#f0fbfb}' +
    '.vt-toc li.vt-l2>a::before{counter-increment:vt-toc;content:counter(vt-toc) ". ";color:#1ac2c1;font-weight:700}' +
    '.vt-toc li.vt-l3>a{padding-left:1.75rem;font-size:.86rem;color:#64748b}' +
    '.vt-toc-target{scroll-margin-top:110px}';

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function slug(text) {
    return String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';
  }

  function esc(t) {
    var d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  var observer = null;

  window.vtBuildToc = function (opts) {
    var mount = opts && opts.mount;
    if (!mount) return 0;
    var roots = [].concat(opts.root || []).filter(Boolean);
    var selector = opts.selector || 'h2, h3';
    var minItems = opts.minItems || 2;

    var heads = [];
    roots.forEach(function (r) {
      if (r.matches && r.matches(selector)) heads.push(r);
      [].forEach.call(r.querySelectorAll(selector), function (h) { heads.push(h); });
    });
    heads = heads.filter(function (h) {
      return h.textContent.trim() && h.offsetParent !== null; // visible headings with text
    });

    if (observer) { observer.disconnect(); observer = null; }
    if (heads.length < minItems) { mount.innerHTML = ''; mount.hidden = true; return 0; }

    addStyles();
    var used = {};
    var items = heads.map(function (h) {
      var id = h.id;
      if (!id) {
        var base = 'toc-' + slug(h.textContent), n = 2;
        id = base;
        while (used[id] || document.getElementById(id)) id = base + '-' + n++;
        h.id = id;
      }
      used[id] = true;
      h.classList.add('vt-toc-target');
      var level = opts.flat ? 2 : (h.tagName === 'H3' || h.tagName === 'H4' ? 3 : 2);
      return '<li class="vt-l' + level + '"><a href="#' + id + '" data-toc-id="' + id + '">' +
        esc(h.textContent.trim()) + '</a></li>';
    });

    mount.hidden = false;
    mount.innerHTML =
      '<nav class="vt-toc" aria-label="Table of contents"><details open>' +
      '<summary><i class="bi bi-list-ul" style="color:#1ac2c1"></i> Table of contents' +
      '<span class="vt-toc-count">' + heads.length + ' sections</span>' +
      '<i class="bi bi-chevron-down vt-toc-chev"></i></summary>' +
      '<ol>' + items.join('') + '</ol></details></nav>';

    var links = mount.querySelectorAll('a[data-toc-id]');
    [].forEach.call(links, function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); // keep #post-… / #case-… routing intact
        var t = document.getElementById(a.getAttribute('data-toc-id'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Highlight the section being read
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          [].forEach.call(links, function (l) {
            l.classList.toggle('vt-active', l.getAttribute('data-toc-id') === en.target.id);
          });
        });
      }, { rootMargin: '-110px 0px -65% 0px' });
      heads.forEach(function (h) { observer.observe(h); });
    }
    return heads.length;
  };
})();

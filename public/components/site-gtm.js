/*
 * Verifitech — Google Tag Manager
 * -------------------------------
 * Usage (put this as high in <head> as possible, on every page):
 *
 *   <script src="/components/site-gtm.js"></script>
 *
 * Change the container ID ONCE here and every page updates.
 * Safe to include more than once: it only loads GTM a single time per page.
 */
(function (w, d) {
  var GTM_ID = "GTM-WLJ5C8CJ";

  // dataLayer + gtag() helper, available to any script on the page.
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };

  // Don't load the container twice (e.g. a page that also has the inline snippet).
  if (w.gtmLoaded || d.querySelector('script[src*="googletagmanager.com/gtm.js?id=' + GTM_ID + '"]')) return;
  w.gtmLoaded = true;

  // Standard GTM start event, so "All Pages" / page-view triggers fire.
  w.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  w.gtag("js", new Date());

  var s = d.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_ID;
  var first = d.getElementsByTagName("script")[0];
  if (first && first.parentNode) first.parentNode.insertBefore(s, first);
  else (d.head || d.documentElement).appendChild(s);
})(window, document);

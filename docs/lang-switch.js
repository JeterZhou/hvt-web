/* Legacy compatibility loader. Main site behavior has moved to site.js. */
(() => {
  if (document.querySelector('script[data-hvt-site-script]')) return;
  const script = document.createElement('script');
  script.src = './site.js';
  script.defer = true;
  script.dataset.hvtSiteScript = 'true';
  document.head.appendChild(script);
})();

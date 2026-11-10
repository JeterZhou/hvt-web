(() => {
  'use strict';

  const STORAGE_KEY = 'hvt_lang';
  const THEME_STORAGE_KEY = 'hvt_theme';

  function preferredLanguage() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('lang');
    if (fromQuery === 'zh' || fromQuery === 'en') return fromQuery;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'zh' || saved === 'en') return saved;
    } catch (_) {}
    const navLang = (navigator.language || '').toLowerCase();
    return navLang.startsWith('zh') ? 'zh' : 'en';
  }

  function setDocumentTitle(lang) {
    const source = document.body;
    if (!source) return;
    const title = lang === 'zh' ? source.dataset.titleZh : source.dataset.titleEn;
    if (title) document.title = title;
  }

  function updateLocalizedAttributes(lang) {
    document.querySelectorAll('[data-aria-zh][data-aria-en]').forEach((el) => {
      el.setAttribute('aria-label', lang === 'zh' ? el.dataset.ariaZh : el.dataset.ariaEn);
    });
    document.querySelectorAll('[data-title-zh-label][data-title-en-label]').forEach((el) => {
      el.setAttribute('title', lang === 'zh' ? el.dataset.titleZhLabel : el.dataset.titleEnLabel);
    });
  }

  function applyLanguage(lang) {
    const next = lang === 'zh' ? 'zh' : 'en';
    document.body.dataset.lang = next;
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
    setDocumentTitle(next);
    updateLocalizedAttributes(next);
    const toggle = document.querySelector('[data-lang-toggle]');
    if (toggle) {
      toggle.textContent = next === 'zh' ? 'EN' : '中文';
      toggle.setAttribute('aria-pressed', next === 'en' ? 'true' : 'false');
      toggle.setAttribute('title', next === 'zh' ? 'Switch to English' : '切换为中文');
      toggle.setAttribute('aria-label', next === 'zh' ? 'Switch to English' : '切换为中文');
    }
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
  }

  function initLanguageToggle() {
    const toggle = document.querySelector('[data-lang-toggle]');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      applyLanguage(document.body.dataset.lang === 'zh' ? 'en' : 'zh');
    });
    applyLanguage(preferredLanguage());
  }

  function applyTheme(theme) {
    const next = theme === 'light' ? 'light' : 'dark';
    document.body.dataset.theme = next;
    const toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;

    const light = next === 'light';
    const icon = toggle.querySelector('.tool-icon');
    if (icon) icon.textContent = light ? '☀' : '☾';
    const zh = toggle.querySelector('.lang-zh');
    if (zh) zh.textContent = light ? '浅色' : '深色';
    const en = toggle.querySelector('.lang-en');
    if (en) en.textContent = light ? 'Light' : 'Dark';
    toggle.setAttribute('aria-pressed', String(light));
    toggle.dataset.ariaZh = light ? '切换到深色主题' : '切换到浅色主题';
    toggle.dataset.ariaEn = light ? 'Switch to dark theme' : 'Switch to light theme';
    toggle.setAttribute('aria-label', document.body.dataset.lang === 'zh'
      ? toggle.dataset.ariaZh
      : toggle.dataset.ariaEn);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch (_) {}
  }

  function initThemeToggle() {
    const toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;

    let savedTheme = 'dark';
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') savedTheme = saved;
    } catch (_) {}
    applyTheme(savedTheme);
    toggle.addEventListener('click', () => {
      applyTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light');
    });
  }

  function initNavToggle() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav-wrap]');
    if (!toggle || !nav) return;

    const closeMenu = () => {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    const openMenu = () => {
      document.body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', () => {
      const isOpen = document.body.classList.contains('nav-open');
      if (isOpen) closeMenu();
      else openMenu();
    });

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', (event) => {
      if (!document.body.classList.contains('nav-open')) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      closeMenu();
    });
  }

  function highlightCurrentPage() {
    const page = document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll(`[data-nav-page]`).forEach((link) => {
      if (link.dataset.navPage === page) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function initYear() {
    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    highlightCurrentPage();
    initNavToggle();
    initLanguageToggle();
    initThemeToggle();
    initYear();
  }, { once: true });
})();

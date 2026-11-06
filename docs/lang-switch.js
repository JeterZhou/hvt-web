/*
 * Human vs Trojan | GitHub Pages entrance language switch
 * Place this file in docs/lang-switch.js and load it from docs/index.html:
 *   <script src="./lang-switch.js" defer></script>
 *
 * This script translates the existing welcome page without replacing its
 * 'Play Now' link, so the working CloudBase game URL is preserved.
 * It does not load CloudBase SDK or modify the game itself.
 */
(() => {
  'use strict';

  function initialize() {
    const main = document.querySelector('body > main');
    if (!main) return;

    // Designed for the HVT entrance markup (two h2 and three direct p children).
    const paragraphs = Array.from(main.querySelectorAll(':scope > p'));
    const headings = Array.from(main.querySelectorAll(':scope > h2'));
    const links = Array.from(main.querySelectorAll(':scope > a'));

    if (paragraphs.length < 3 || headings.length < 2 || links.length < 2) {
      console.warn('[HVT entrance] Cannot find the expected welcome page elements; the existing page was left unchanged.');
      return;
    }

    const [eyebrow, zhDescription, enDescription] = paragraphs;
    const [zhHeading, enHeading] = headings;
    const [playLink, repositoryLink] = links;

    const translations = {
      zh: {
        eyebrow: '双人网络攻防竞技场',
        heading: '浏览器实时攻防对抗',
        description: '欢迎来到 Human vs Trojan 网页端。与朋友一起体验双人实时网络攻防对抗。',
        play: '开始游戏',
        repository: '项目仓库',
        title: 'Human vs Trojan｜双人网络攻防竞技场',
        switchLabel: '切换为英文',
      },
      en: {
        eyebrow: 'CYBER ARENA / TWO-PLAYER EXPERIENCE',
        heading: 'Real-Time Cyber Arena',
        description: 'Welcome to Human vs Trojan. Experience a real-time, two-player browser-based cyber arena with your friends.',
        play: 'Play Now',
        repository: 'GitHub Repository',
        title: 'Human vs Trojan | Real-Time Cyber Arena',
        switchLabel: 'Switch to Chinese',
      },
    };

    const css = document.createElement('style');
    css.textContent = `
      .hvt-i18n-hidden { display: none !important; }
      #hvtEntryLangToggle {
        position: fixed;
        top: 22px;
        right: 26px;
        z-index: 100;
        min-width: 48px;
        min-height: 40px;
        padding: 7px 13px;
        border: 1px solid #39708b;
        border-radius: 999px;
        background: #0d2534;
        color: #dcefff;
        font: 600 13px/1.3 system-ui, -apple-system, "Segoe UI", sans-serif;
        cursor: pointer;
        transition: background-color 140ms ease, border-color 140ms ease;
      }
      #hvtEntryLangToggle:hover { background: #164158; border-color: #76b4d0; }
      #hvtEntryLangToggle:focus-visible { outline: 3px solid #80d1ee; outline-offset: 4px; }
      @media (max-width: 480px) {
        #hvtEntryLangToggle { top: 13px; right: 13px; min-height: 36px; }
      }
      @media (prefers-reduced-motion: reduce) {
        #hvtEntryLangToggle { transition: none; }
      }
    `;
    document.head.append(css);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'hvtEntryLangToggle';
    document.body.append(toggle);

    function setHidden(node, hide) {
      node.classList.toggle('hvt-i18n-hidden', hide);
      node.setAttribute('aria-hidden', hide ? 'true' : 'false');
    }

    function preferredLanguage() {
      const param = new URLSearchParams(window.location.search).get('lang');
      if (param === 'zh' || param === 'en') return param;
      try {
        return window.localStorage.getItem('hvt_lang') === 'en' ? 'en' : 'zh';
      } catch (_) {
        return 'zh';
      }
    }

    let currentLanguage = 'zh';
    function applyLanguage(lang) {
      currentLanguage = lang === 'en' ? 'en' : 'zh';
      const t = translations[currentLanguage];

      eyebrow.textContent = t.eyebrow;
      zhHeading.textContent = translations.zh.heading;
      enHeading.textContent = translations.en.heading;
      zhDescription.textContent = translations.zh.description;
      enDescription.textContent = translations.en.description;

      setHidden(zhHeading, currentLanguage !== 'zh');
      setHidden(zhDescription, currentLanguage !== 'zh');
      setHidden(enHeading, currentLanguage !== 'en');
      setHidden(enDescription, currentLanguage !== 'en');

      // Only change visible labels. Do not touch href/target attributes.
      playLink.textContent = t.play;
      repositoryLink.textContent = t.repository;
      toggle.textContent = currentLanguage === 'zh' ? 'EN' : '中文';
      toggle.title = t.switchLabel;
      toggle.setAttribute('aria-label', t.switchLabel);
      document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
      document.title = t.title;
      try { window.localStorage.setItem('hvt_lang', currentLanguage); } catch (_) { /* local storage may be blocked */ }
    }

    toggle.addEventListener('click', () => {
      applyLanguage(currentLanguage === 'zh' ? 'en' : 'zh');
    });

    applyLanguage(preferredLanguage());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();

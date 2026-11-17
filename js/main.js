/* Progressive enhancement only. All content and navigation work without JS. */
(() => {
  'use strict';
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  // Keep sticky section titles clear of the header, including wrapped mobile nav.
  const masthead = document.querySelector('.masthead');
  function measureHeader() {
    if (masthead) root.style.setProperty('--masthead-height', `${masthead.getBoundingClientRect().height}px`);
  }
  measureHeader();
  if ('ResizeObserver' in window && masthead) new ResizeObserver(measureHeader).observe(masthead);
  else window.addEventListener('resize', measureHeader);

  function updateThemeButton() {
    const dark = root.dataset.theme === 'dark';
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', dark ? '#14296c' : '#fff9f0');
    toggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  }
  if (toggle) {
    toggle.hidden = false;
    updateThemeButton();
    toggle.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
      updateThemeButton();
    });
  }
  const navLinks = [...document.querySelectorAll('.header-inner nav a')];
  const sections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
  let pending = false;
  function updateActive() {
    let active = -1;
    const offset = document.querySelector('.masthead').offsetHeight + 80;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= offset) active = index;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 3) active = sections.length - 1;
    navLinks.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    pending = false;
  }
  function scheduleUpdate() {
    if (!pending) { pending = true; requestAnimationFrame(updateActive); }
  }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  updateActive();
})();

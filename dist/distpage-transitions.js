// ========================================
// SEAMLESS PAGE TRANSITION SYSTEM (OPTIMIZED)
// ========================================

(function() {
  'use strict';
  
  const TRANSITION_DURATION = 600; 
  const CACHE_DURATION = 5 * 60 * 1000; 
  const pageCache = new Map();
  let activeObservers = []; // Track observers for cleanup
  let isTransitioning = false;
  let currentPath = window.location.pathname;

  // 1. CREATE OVERLAY
  function createTransitionOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'page-transition-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(255, 255, 255, 0.98); opacity: 0;
      pointer-events: none; z-index: 9998;
      transition: opacity ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1);
    `;
    if (document.documentElement.classList.contains('dark')) {
      overlay.style.background = 'rgba(0, 0, 0, 0.98)';
    }
    document.body.appendChild(overlay);
    return overlay;
  }
  
  const overlay = createTransitionOverlay();

  // 2. FETCH & EXTRACT CONTENT
  async function fetchPage(url) {
    const cached = pageCache.get(url);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) return cached.html;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Page not found');
      const html = await response.text();
      pageCache.set(url, { html, timestamp: Date.now() });
      return html;
    } catch (error) { return null; }
  }

  function extractContent(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return {
      title: doc.title,
      body: doc.body.innerHTML,
      bodyClasses: doc.body.className
    };
  }

  // 3. RE-INITIALIZE (Cleaned version of File 2)
  function reinitializeScripts() {
    // ✅ FIX: Clean up old observers to prevent memory leaks
    activeObservers.forEach(obs => obs.disconnect());
    activeObservers = [];

    // Reset Mobile Menu
    const mobileMenu = document.getElementById('menu');
    if (mobileMenu) {
      mobileMenu.classList.remove('h-auto', 'opacity-100');
      mobileMenu.classList.add('h-0', 'opacity-0');
    }

    // Re-initialize Alpine.js
    if (window.Alpine) { window.Alpine.initTree(document.body); }

    // Re-initialize Observers (Only once)
    setTimeout(() => {
      // Text Container Observers
      const textObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('start-animation');
            textObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      
      document.querySelectorAll('.text-container').forEach(el => textObserver.observe(el));
      activeObservers.push(textObserver); // Track it for cleanup

      // Grid Item Observers
      const gridItems = document.querySelectorAll('.grid-item-reveal');
      if (gridItems.length > 0) {
        const gridObserver = new IntersectionObserver((entries) => {
          const visible = entries.filter(e => e.isIntersecting);
          visible.forEach((entry, i) => {
            setTimeout(() => entry.target.classList.add('revealed'), i * 300);
            gridObserver.unobserve(entry.target);
          });
        }, { threshold: 0.1 });
        gridItems.forEach(item => gridObserver.observe(item));
        activeObservers.push(gridObserver); // Track it for cleanup
      }
    }, 100);
  }

  // 4. PERFORM TRANSITION
  async function transitionToPage(url) {
    if (isTransitioning) return;
    isTransitioning = true;
    
    overlay.style.background = document.documentElement.classList.contains('dark') ? 'rgba(0,0,0,0.98)' : 'rgba(255,255,255,0.98)';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';

    const html = await fetchPage(url);
    if (!html) { 
      isTransitioning = false; 
      overlay.style.opacity = '0'; 
      return; 
    }

    await new Promise(r => setTimeout(r, TRANSITION_DURATION));
    window.scrollTo(0, 0);
    
    const content = extractContent(html);
    document.title = content.title;
    document.body.className = content.bodyClasses;
    document.body.innerHTML = content.body;
    document.body.appendChild(overlay);

    reinitializeScripts();
    history.pushState({ path: url }, '', url);
    currentPath = url;

    setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      isTransitioning = false;
    }, 50);
  }

  // 5. INITIALIZE LISTENERS
  document.body.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link || link.getAttribute('href')?.startsWith('#') || link.target === '_blank') return;
    const href = link.getAttribute('href');
    if (href && (href.endsWith('.html') || !href.includes('.'))) {
      e.preventDefault();
      if (href !== currentPath) transitionToPage(href);
    }
  });

  window.addEventListener('popstate', e => transitionToPage(e.state?.path || window.location.pathname));
})();

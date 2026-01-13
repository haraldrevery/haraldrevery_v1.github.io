// ========================================
// SEAMLESS PAGE TRANSITION SYSTEM
// Save this file as: ./dist/page-transitions.js
// Then add to all HTML pages: <script src="./dist/page-transitions.js"></script>
// ========================================

(function() {
  'use strict';
  
  // Configuration
  const TRANSITION_DURATION = 600; // milliseconds
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Cache for storing fetched pages
  const pageCache = new Map();
  
  // Current page info
  let isTransitioning = false;
  let currentPath = window.location.pathname;
  
  // ========================================
  // 1. CREATE TRANSITION OVERLAY
  // ========================================
  function createTransitionOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'page-transition-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--transition-bg, rgba(255, 255, 255, 0.98));
      opacity: 0;
      pointer-events: none;
      z-index: 9998;
      transition: opacity ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    // Set background based on current theme
    if (document.documentElement.classList.contains('dark')) {
      overlay.style.background = 'rgba(0, 0, 0, 0.98)';
    }
    
    document.body.appendChild(overlay);
    return overlay;
  }
  
  const overlay = createTransitionOverlay();
  
  // ========================================
  // 2. FETCH AND CACHE PAGES
  // ========================================
  async function fetchPage(url) {
    const cached = pageCache.get(url);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.html;
    }
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Page not found');
      
      const html = await response.text();
      pageCache.set(url, {
        html: html,
        timestamp: Date.now()
      });
      
      return html;
    } catch (error) {
      console.error('Error fetching page:', error);
      return null;
    }
  }
  
  // ========================================
  // 3. EXTRACT CONTENT FROM HTML
  // ========================================
  function extractContent(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    return {
      title: doc.title,
      body: doc.body.innerHTML,
      darkMode: doc.documentElement.classList.contains('dark'),
      bodyClasses: doc.body.className
    };
  }
  
  // ========================================
  // 4. UPDATE PAGE CONTENT
  // ========================================
  function updatePage(content) {
    // Update title
    document.title = content.title;
    
    // Update body classes
    document.body.className = content.bodyClasses;
    
    // Update body content
    document.body.innerHTML = content.body;
    
    // Re-append overlay (it got removed when we replaced body content)
    document.body.appendChild(overlay);
    
    // Re-initialize scripts that need to run on new content
    reinitializeScripts();
  }
  
  // ========================================
  // 5. RE-INITIALIZE SCRIPTS
  // ========================================
// Store observers globally so we can clean them up
let activeObservers = [];

function reinitializeScripts() {
  // ✅ Clean up old observers first
  activeObservers.forEach(obs => obs.disconnect());
  activeObservers = [];
  
  setTimeout(() => {
    // Text container animations
    const containers = document.querySelectorAll('.text-container');
    containers.forEach(container => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('start-animation');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      observer.observe(container);
      activeObservers.push(observer); // ✅ Track it
    });
    
    // Grid items
    const gridItems = document.querySelectorAll('.grid-item-reveal');
    if (gridItems.length > 0) {
      const gridObserver = new IntersectionObserver((entries) => {
        // ... code ...
      }, { threshold: 0.10 });
      
      gridItems.forEach(item => gridObserver.observe(item));
      activeObservers.push(gridObserver); // ✅ Track it
    }
  }, 100);
}
    
    // Re-initialize Alpine.js components
    if (window.Alpine) {
      window.Alpine.initTree(document.body);
    }
    
    // Re-run word animations
    setTimeout(() => {
      if (typeof window.animateWords === 'function') {
        document.querySelectorAll('h2[data-animate="true"]').forEach(h2 => {
          window.animateWords(h2);
        });
      }
      
      // Text container animations
      const containers = document.querySelectorAll('.text-container');
      containers.forEach(container => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('start-animation');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
        observer.observe(container);
      });
      
      // Grid item animations (for about.html image grid)
      const gridItems = document.querySelectorAll('.grid-item-reveal');
      if (gridItems.length > 0) {
        const gridObserver = new IntersectionObserver((entries) => {
          const visibleEntries = entries.filter(entry => entry.isIntersecting);
          if (visibleEntries.length > 0) {
            visibleEntries.forEach((entry, index) => {
              setTimeout(() => {
                entry.target.classList.add('revealed');
              }, index * 300);
              gridObserver.unobserve(entry.target);
            });
          }
        }, { threshold: 0.10 });
        
        gridItems.forEach(item => gridObserver.observe(item));
      }
    }, 100);
    
    // Re-initialize plexus if on index page
    if (typeof window.restartPlexus === 'function') {
      setTimeout(() => {
        window.restartPlexus();
        if (typeof window.restartLogoAnimations === 'function') {
          window.restartLogoAnimations();
        }
      }, 150);
    }
    
    // Audio player on music page
    if (typeof audioPlayer === 'function' && document.querySelector('[x-data]')) {
      // Alpine will auto-initialize
    }
    
    // Trigger scroll event to show/hide navbar
    setTimeout(() => {
      window.dispatchEvent(new Event('scroll'));
    }, 100);
    
    // Glass card stage on about page
    const stage = document.getElementById('interactive-stage');
    if (stage) {
      const cards = stage.querySelectorAll('.glass-card');
      stage.addEventListener('mouseenter', () => stage.classList.add('fanned'));
      stage.addEventListener('mouseleave', () => stage.classList.remove('fanned'));
      
      cards.forEach(clickedCard => {
        clickedCard.addEventListener('click', (e) => {
          if (!stage.classList.contains('fanned')) {
            stage.classList.add('fanned');
          }
          const clickedPos = parseInt(clickedCard.getAttribute('data-pos'));
          if (clickedPos === 3) return;
          
          const shift = 3 - clickedPos;
          cards.forEach(card => {
            let currentPos = parseInt(card.getAttribute('data-pos'));
            let newPos = currentPos + shift;
            if (newPos > 5) newPos -= 5;
            if (newPos < 1) newPos += 5;
            card.setAttribute('data-pos', newPos);
            for (let i = 1; i <= 5; i++) {
              card.classList.remove(`pos-${i}`);
            }
            card.classList.add(`pos-${newPos}`);
          });
        });
      });
    }
  }
  
  // ========================================
  // 6. PERFORM PAGE TRANSITION
  // ========================================
  async function transitionToPage(url) {
    if (isTransitioning) return;
    isTransitioning = true;
    
    // Update overlay background based on current theme
    if (document.documentElement.classList.contains('dark')) {
      overlay.style.background = 'rgba(0, 0, 0, 0.98)';
    } else {
      overlay.style.background = 'rgba(255, 255, 255, 0.98)';
    }
    
    // 1. Fade out current page
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    
    // 2. Fetch new page while fading out
    const html = await fetchPage(url);
    if (!html) {
      isTransitioning = false;
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      return;
    }
    
    // 3. Wait for fade out to complete
    await new Promise(resolve => setTimeout(resolve, TRANSITION_DURATION));
    
    // 4. Scroll to top instantly (while overlay is visible)
    window.scrollTo(0, 0);
    
    // 5. Update content
    const content = extractContent(html);
    updatePage(content);
    
    // 6. Update URL
    history.pushState({ path: url }, '', url);
    currentPath = url;
    
    // 7. Small delay, then fade in new page
    await new Promise(resolve => setTimeout(resolve, 50));
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    
    isTransitioning = false;
  }
  
  // ========================================
  // 7. INTERCEPT LINK CLICKS
  // ========================================
  function handleLinkClick(e) {
    const link = e.target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    
    // Only intercept internal links
    if (!href || 
        href.startsWith('#') || 
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        link.target === '_blank') {
      return;
    }
    
    // Check if it's a same-domain HTML page
    const isHtmlPage = href.endsWith('.html') || (!href.includes('.') && !href.startsWith('#'));
    
    if (isHtmlPage) {
      e.preventDefault();
      
      // Don't transition if already on this page
      const currentPage = window.location.pathname.split('/').pop();
      const targetPage = href.split('/').pop();
      
      if (targetPage !== currentPage) {
        transitionToPage(href);
      }
    }
  }
  
  // ========================================
  // 8. HANDLE BROWSER BACK/FORWARD
  // ========================================
  window.addEventListener('popstate', async (e) => {
    const path = e.state?.path || window.location.pathname;
    if (path !== currentPath) {
      await transitionToPage(path);
    }
  });
  
  // ========================================
  // 9. INITIALIZE
  // ========================================
  function initialize() {
    // Set initial state
    history.replaceState({ path: currentPath }, '', currentPath);
    
    // Add click listener to body (event delegation)
    document.body.addEventListener('click', handleLinkClick);
    
    // Prefetch linked pages on hover (for better performance)
    let hoverTimeout;
    document.body.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (href && href.endsWith('.html')) {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          fetchPage(href); // Silently prefetch
        }, 100);
      }
    });
    
    console.log('✨ Seamless page transitions initialized');
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
})();


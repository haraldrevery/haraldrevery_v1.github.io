window.addEventListener('load', () => {
  setTimeout(() => {
    // All pages in the site
    const allPages = ["index.html", "music.html", "about.html", "contact.html"];
    
    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Filter out the current page from the preload list
    const pagesToPreload = allPages.filter(page => page !== currentPage);
    
    // 1. For Chrome/Edge (Speculation Rules API)
    const specScript = document.createElement('script');
    specScript.type = 'speculationrules';
    specScript.textContent = JSON.stringify({
      "prerender": [{ "source": "list", "urls": pagesToPreload }]
    });
    document.head.appendChild(specScript);
    
    // 2. For Firefox (Traditional Prefetch)
    pagesToPreload.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }, 3000); // Wait 3 seconds after page load to avoid impacting initial load
});

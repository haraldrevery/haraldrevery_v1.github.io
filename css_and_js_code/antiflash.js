  (function() {
    const stored = localStorage.getItem('darkMode');
    if (stored === 'false') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  })();

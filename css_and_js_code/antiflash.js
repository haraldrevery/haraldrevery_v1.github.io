(function() {
  const stored = localStorage.getItem('darkMode');
  const isDark = stored !== 'false'; // Default to true if null, per your HTML logic

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Target the header immediately to prevent the white flash
  document.addEventListener("DOMContentLoaded", function() {
    const header = document.getElementById('main-header');
    if (header) {
      if (isDark) {
        header.classList.add('dark:bg-black/60');
        header.classList.remove('bg-white/60');
      } else {
        header.classList.add('bg-white/60');
        header.classList.remove('dark:bg-black/60');
      }
    }
  });
})();

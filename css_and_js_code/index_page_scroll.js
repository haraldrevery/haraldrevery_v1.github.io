// Click to scroll thing
  document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('hero-trigger');
    const target = document.getElementById('discography-section');
    if (trigger && target) {
      trigger.addEventListener('click', () => {
        // This scrolls the page so the top of the 'A collection' section
        // aligns with the top of your screen
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
    }
  });
 
// navigation bar pop up when scroll
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
 
    // threshold: 200px (adjust this to decide when it should appear)
    if (scrollTop > 200) {
      // SCROLLED DOWN: Show the navbar
      header.classList.remove('-translate-y-full', 'opacity-0', 'pointer-events-none');
    } else {
      // AT THE TOP: Hide the navbar
      header.classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none');
    }
  });

document.addEventListener('DOMContentLoaded', () => {
  // 1. Fading Words Logic
  const containers = document.querySelectorAll('.text-container');
  containers.forEach(container => {
    const paragraphs = container.querySelectorAll('p');
    paragraphs.forEach(p => {
      const text = p.textContent.trim();
      const words = text.split(/\s+/);
      p.innerHTML = words.map((word) => {
        const randomDelay = (Math.random() * 0.9 + 0.1).toFixed(2);
        return `<span class="word" style="animation-delay: ${randomDelay}s">${word}</span>`;
      }).join(' ');
    });

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

  // 2. Fading Letters Logic
  const headings = document.querySelectorAll('.animated-heading');
  const headingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateWords(entry.target);
        headingObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  headings.forEach(h => headingObserver.observe(h));

  function animateWords(el) {
    const text = el.innerText;
    el.innerHTML = ''; 
    el.style.opacity = '1';
    el.classList.add('active'); 
    const words = text.split(' ');
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap';
      [...word].forEach((char, charIndex) => {
        const letterSpan = document.createElement('span');
        letterSpan.textContent = char;
        letterSpan.className = 'fade-letter';
        letterSpan.style.animationDelay = `${(wordIndex * 5 + charIndex) * 0.05}s`;
        wordSpan.appendChild(letterSpan);
      });
      el.appendChild(wordSpan);
      if (wordIndex < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  // 3. Grid Reveal & Lightbox
  const gridItems = document.querySelectorAll('.grid-item-reveal');
  const gridObserver = new IntersectionObserver((entries) => {
    const visibleEntries = entries.filter(entry => entry.isIntersecting);
    if (visibleEntries.length > 0) {
      visibleEntries.forEach((entry, index) => {
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, index * 96);
        gridObserver.unobserve(entry.target);
      });
    }
  }, { threshold: 0.10 });
  gridItems.forEach(item => gridObserver.observe(item));

  // Initialize Lightbox (including your requested descPosition)
  if (typeof GLightbox === 'function') {
    GLightbox({
      selector: '.glightbox',
      touchNavigation: true,
      loop: true,
      zoomable: true,
      autoplayVideos: true,
      descPosition: 'bottom' // Added from your snippet
    });
  }
});

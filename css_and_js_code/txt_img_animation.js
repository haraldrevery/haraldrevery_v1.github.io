// fading words script 
document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('.text-container');

  containers.forEach(container => {
    const paragraphs = container.querySelectorAll('p');
    
    paragraphs.forEach(p => {
      // Use textContent instead of innerText to ensure we get the text 
      // even if the element is currently invisible/opacity 0
      const text = p.textContent.trim();
      const words = text.split(/\s+/);
      
      p.innerHTML = words.map((word) => {
        // Random delay between 0.1s and 1.0s
        const randomDelay = (Math.random() * 0.9 + 0.1).toFixed(2);
        return `<span class="word" style="animation-delay: ${randomDelay}s">${word}</span>`;
      }).join(' ');
    });

    // Observer to trigger when scrolled into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add the class to the container to start the child animations
          entry.target.classList.add('start-animation');
          observer.unobserve(entry.target);
        }
      });
    }, { 
      // Trigger when 10% of the block is visible
      threshold: 0.1 
    });

    observer.observe(container);
  });
});

      
// fading letters script 
document.addEventListener('DOMContentLoaded', () => {
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

    // Split by space to get individual words
    const words = text.split(' ');

    words.forEach((word, wordIndex) => {
      // Create a wrapper for the word to keep it together
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap'; // This prevents the word itself from breaking

      // Put letters inside the word wrapper
      [...word].forEach((char, charIndex) => {
        const letterSpan = document.createElement('span');
        letterSpan.textContent = char;
        letterSpan.className = 'fade-letter';
        // Calculate delay based on total progress (word index + letter position)
        letterSpan.style.animationDelay = `${(wordIndex * 5 + charIndex) * 0.05}s`;
        wordSpan.appendChild(letterSpan);
      });

      el.appendChild(wordSpan);

      // Add a space after the word (unless it's the last one)
      if (wordIndex < words.length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
    });
  }
});


document.addEventListener('DOMContentLoaded', () => {
  
  // --- 1. Grid Item Reveal Logic ---
  const gridItems = document.querySelectorAll('.grid-item-reveal');
  const observerOptions = {
    threshold: 0.10
  };

  const observer = new IntersectionObserver((entries) => {
    // Filter items entering the viewport
    const visibleEntries = entries.filter(entry => entry.isIntersecting);
    
    if (visibleEntries.length > 0) {
      visibleEntries.forEach((entry, index) => {
        // Stagger the reveal of each image
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, index * 96); // 96ms delay between each image
        
        // Stop observing once revealed
        observer.unobserve(entry.target);
      });
    }
  }, observerOptions);

  gridItems.forEach(item => observer.observe(item));

  // --- 2. Lightbox Initialization ---
  // We initialize GLightbox directly here
  if (typeof GLightbox === 'function') {
    const lightbox = GLightbox({
      selector: '.glightbox',
      touchNavigation: true,
      loop: true,
      zoomable: true,
      autoplayVideos: true
    });
  }

});

/**
 * FADE_IN.JS
 * Handles the initial entrance of the website body.
 * Note: Image reveal logic is handled by the IntersectionObserver 
 * inside index.html to allow for "reveal-on-scroll" effects.
 */

document.addEventListener("DOMContentLoaded", function () {
  const body = document.querySelector("body");
  
  if (body) {
    // Reveal the main page content
    // This works with the 'opacity-0' and 'transition-all' 
    // classes already present on your body tag.
    body.classList.remove("opacity-0");
    body.classList.add("opacity-100");
  }
});

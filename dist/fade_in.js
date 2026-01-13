/**
 * FADE_IN.JS
 * Handles the initial entrance of the website body.
 */

document.addEventListener("DOMContentLoaded", function () {
  const body = document.querySelector("body");
  
  if (body) {
    // requestAnimationFrame ensures the browser has rendered the 
    // initial 'opacity-0' state before we trigger the transition.
    requestAnimationFrame(() => {
      body.classList.remove("opacity-0");
      body.classList.add("opacity-100");
    });
  }
});

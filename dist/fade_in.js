/**
 * FADE_IN.JS (Fixed)
 */
document.addEventListener("DOMContentLoaded", function () {
  const body = document.querySelector("body");
  
  if (body) {
    // requestAnimationFrame ensures the browser renders the 
    // initial 'opacity-0' before starting the transition.
    requestAnimationFrame(() => {
      body.classList.remove("opacity-0");
      body.classList.add("opacity-100");
    });
  }
});

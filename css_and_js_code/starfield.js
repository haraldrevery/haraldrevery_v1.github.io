/* 1. KEEP: 3D Mouse Rotation Logic (Anti-Jitter) */
const TWO_PI = Math.PI * 2;
let targetRotateX = 0, targetRotateY = 0;
let currentRotateX = 0, currentRotateY = 0;
const logoSvg = document.getElementById('main-logo-svg');

document.addEventListener('mousemove', (e) => {
  targetRotateY = ((e.clientX / window.innerWidth) - 0.5) * 40;
  targetRotateX = ((e.clientY / window.innerHeight) - 0.5) * -40;
});

document.addEventListener('mouseout', (e) => {
  if (!e.relatedTarget && !e.toElement) {
    targetRotateY = 0;
    targetRotateX = 0;
  }
});

function smoothRotate() {
  if (logoSvg) {
    currentRotateX += (targetRotateX - currentRotateX) * 0.29;
    currentRotateY += (targetRotateY - currentRotateY) * 0.29;
    logoSvg.style.transform = `translateX(-9.81%) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) translateZ(50px)`;
    const shadowAlpha = document.documentElement.classList.contains('dark') ? 0.1 : 0.3;
    logoSvg.style.filter = `drop-shadow(${(currentRotateY * 0.5).toFixed(1)}px ${(currentRotateX * 0.5).toFixed(1)}px 20px rgba(0,0,0,${shadowAlpha}))`;
  }
  requestAnimationFrame(smoothRotate);
}
smoothRotate();

/* 2. NEW ANIMATION: Parallax Starfield (Ultra-Low Computation) */
let plexusRequestId;
let globalMouseX = 0, globalMouseY = 0;

document.addEventListener('mousemove', (e) => {
  globalMouseX = (e.clientX - window.innerWidth / 2);
  globalMouseY = (e.clientY - window.innerHeight / 2);
});

window.restartPlexus = function() {
  if (plexusRequestId) cancelAnimationFrame(plexusRequestId);
  
  const canvas = document.getElementById('plexus-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // High-res internal dimensions
  const width = 1000, height = 1100;
  const starCount = window.innerWidth < 768 ? 150 : 400;
  const stars = [];

  // Performance Optimization: Pre-render a star to an offscreen canvas
  const starCanvas = document.createElement('canvas');
  starCanvas.width = 10;
  starCanvas.height = 10;
  const sCtx = starCanvas.getContext('2d');
  const gradient = sCtx.createRadialGradient(5, 5, 0, 5, 5, 5);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  sCtx.fillStyle = gradient;
  sCtx.fillRect(0, 0, 10, 10);

  class Star {
    constructor() {
      this.reset();
      // Start stars at random positions across the full field
      this.x = Math.random() * width;
      this.y = Math.random() * height;
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      // Assign to 3 parallax depth layers
      const layer = Math.random();
      if (layer > 0.9) { // Front layer
        this.z = 3;
        this.size = 2.5;
        this.baseSpeed = 1.2;
      } else if (layer > 0.6) { // Middle layer
        this.z = 2;
        this.size = 1.5;
        this.baseSpeed = 0.6;
      } else { // Background layer
        this.z = 1;
        this.size = 0.8;
        this.baseSpeed = 0.2;
      }
      this.alpha = (Math.random() * 0.5 + 0.3).toFixed(2);
    }
    update(mx, my) {
      // Basic movement
      this.y += this.baseSpeed;
      
      // Parallax mouse influence based on depth (z)
      const parallaxX = mx * 0.02 * this.z;
      const parallaxY = my * 0.02 * this.z;

      // Wrap around logic
      if (this.y > height) {
        this.y = 0;
        this.x = Math.random() * width;
      }
      
      this.renderX = this.x + parallaxX;
      this.renderY = this.y + parallaxY;
    }
    draw(ctx, isDark) {
      // Adjust star color for dark/light mode
      ctx.globalAlpha = this.alpha;
      const drawSize = this.size;
      
      // Use the pre-rendered star image for extreme speed
      ctx.drawImage(starCanvas, this.renderX | 0, this.renderY | 0, drawSize, drawSize);
    }
  }

  for (let i = 0; i < starCount; i++) stars.push(new Star());

  function animate() {
    ctx.clearRect(0, 0, width, height);
    const isDark = document.documentElement.classList.contains('dark');
    
    // Invert starfield if in light mode for visibility
    if (!isDark) {
        ctx.filter = 'invert(1)';
    }

    for (let i = 0; i < stars.length; i++) {
      stars[i].update(globalMouseX, globalMouseY);
      stars[i].draw(ctx, isDark);
    }
    
    ctx.filter = 'none';
    ctx.globalAlpha = 1.0;
    plexusRequestId = requestAnimationFrame(animate);
  }
  animate();
};

/* 3. KEEP: Logo Effects Reset Logic */
window.restartLogoAnimations = function() {
  const logoGroup = document.querySelector('#logo-shape-definition.animate-logo');
  const waves = document.querySelectorAll('.wave-echo');
  if (!logoGroup) return;

  const logoPaths = logoGroup.querySelectorAll('path');
  
  logoPaths.forEach(path => {
    path.style.animation = 'none';
    path.style.strokeDashoffset = '4000';
    path.style.fillOpacity = '0';
  });
  
  waves.forEach(wave => {
    wave.style.animation = 'none';
    wave.style.transform = 'scale(5)';
    wave.style.opacity = '0';
    wave.style.strokeWidth = '0.5px';
  });
  
  void logoGroup.offsetWidth;
  
  logoPaths.forEach(path => {
    path.style.animation = 'logoDraw 6s cubic-bezier(.75,.03,.46,.46) forwards';
  });
  
  waves.forEach((wave, index) => {
    setTimeout(() => {
      wave.style.animation = 'implodingWave 3.5s cubic-bezier(0.19, 1, 0.22, 1) forwards';
    }, index * 144); 
  });
};

/* 4. INITIALIZATION */
document.addEventListener('DOMContentLoaded', () => {
  window.restartPlexus();
  setTimeout(() => window.restartLogoAnimations(), 50);
});

document.addEventListener('alpine:init', () => {
    Alpine.data('plexusBackground', () => ({ init() { } }));
});

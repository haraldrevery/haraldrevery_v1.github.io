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

/* 2. UPDATED: High-Density Geometric Starfield */
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
  
  const width = 1000, height = 1100;
  // Increased particle density
  const starCount = window.innerWidth < 768 ? 300 : 850; 
  const stars = [];

  // Optimized Geometric "Diamond" Texture
  const starCanvas = document.createElement('canvas');
  starCanvas.width = 30;
  starCanvas.height = 30;
  const sCtx = starCanvas.getContext('2d');
  
  // Draw Rhombus/Diamond shape to match SVG style
  sCtx.fillStyle = 'white';
  sCtx.beginPath();
  sCtx.moveTo(15, 0);   // Top
  sCtx.lineTo(30, 15);  // Right
  sCtx.lineTo(15, 30);  // Bottom
  sCtx.lineTo(0, 15);   // Left
  sCtx.closePath();
  sCtx.fill();

  class Star {
    constructor() {
      this.reset();
      this.x = Math.random() * width;
      this.y = Math.random() * height;
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      
      const layer = Math.random();
      if (layer > 0.92) { // Hero Diamonds
        this.z = 3.5;
        this.size = Math.random() * 5 + 8; 
        this.baseSpeed = 1.6;
      } else if (layer > 0.7) { // Mid Diamonds
        this.z = 2.2;
        this.size = Math.random() * 3 + 4;
        this.baseSpeed = 0.8;
      } else { // Background Diamonds
        this.z = 1.2;
        this.size = Math.random() * 2 + 2;
        this.baseSpeed = 0.4;
      }
      this.alpha = (Math.random() * 0.5 + 0.2).toFixed(2);
    }
    update(mx, my) {
      this.y += this.baseSpeed;
      
      const parallaxX = mx * 0.03 * this.z;
      const parallaxY = my * 0.03 * this.z;

      if (this.y > height) {
        this.y = -30;
        this.x = Math.random() * width;
      }
      
      this.renderX = this.x + parallaxX;
      this.renderY = this.y + parallaxY;
    }
    draw(ctx) {
      ctx.globalAlpha = this.alpha;
      ctx.drawImage(starCanvas, this.renderX | 0, this.renderY | 0, this.size, this.size);
    }
  }

  for (let i = 0; i < starCount; i++) stars.push(new Star());

  function animate() {
    ctx.clearRect(0, 0, width, height);
    const isDark = document.documentElement.classList.contains('dark');
    
    // Invert field for light mode
    if (!isDark) ctx.filter = 'invert(1)';

    for (let i = 0; i < stars.length; i++) {
      stars[i].update(globalMouseX, globalMouseY);
      stars[i].draw(ctx);
    }
    
    ctx.filter = 'none';
    ctx.globalAlpha = 1.0;
    plexusRequestId = requestAnimationFrame(animate);
  }
  animate();
};

/* 3. KEEP: Slower Logo Effects Reset Logic */
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
  
  // 6s duration (20% slower)
  logoPaths.forEach(path => {
    path.style.animation = 'logoDraw 6s cubic-bezier(.75,.03,.46,.46) forwards';
  });
  
  waves.forEach((wave, index) => {
    setTimeout(() => {
      wave.style.animation = 'implodingWave 3.5s cubic-bezier(0.19, 1, 0.22, 1) forwards';
    }, index * 144); // 20% slower stagger
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

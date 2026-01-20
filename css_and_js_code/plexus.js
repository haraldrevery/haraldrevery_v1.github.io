/* Performance constants */
const TWO_PI = Math.PI * 2;
const SPEED_BOOST_RADIUS_SQ = 62500; 

/* 1. KEEP: 3D Mouse Rotation Logic */
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
    // Removed bitwise truncation to eliminate jitter in rotation
    logoSvg.style.transform = `translateX(-9.81%) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) translateZ(50px)`;
    const shadowAlpha = document.documentElement.classList.contains('dark') ? 0.1 : 0.3;
    logoSvg.style.filter = `drop-shadow(${(currentRotateY * 0.5).toFixed(1)}px ${(currentRotateX * 0.5).toFixed(1)}px 20px rgba(0,0,0,${shadowAlpha}))`;
  }
  requestAnimationFrame(smoothRotate);
}
smoothRotate();

/* 2. OPTIMIZED ANIMATION: Resolution Bump & Wrap-Fix */
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
  
  // Resolution Bump: Ensure we are using the actual CSS dimensions precisely
  const width = 1000, height = 1100;
  
  const trailCount = window.innerWidth < 768 ? 100 : 420;
  const trails = [];

  class Trail {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.segments = []; 
      
      const rand = Math.random();
      if (rand < 0.10) {
        this.maxLength = Math.floor(Math.random() * 400) + 1200; 
      } else if (rand < 0.25) {
        this.maxLength = Math.floor(Math.random() * 200) + 500;
      } else {
        this.maxLength = Math.floor(Math.random() * 100) + 150;
      }
      
      this.baseSpeed = Math.random() < 0.4 ? (Math.random() * 0.4 + 0.3) : (Math.random() * 1.6 + 0.8);
      this.currentSpeed = this.baseSpeed;
      this.angle = Math.random() * TWO_PI;
      this.va = (Math.random() - 0.5) * 0.05; 
      
      // Categorized Opacity Classes: 25%, 50%, 75%, 100%
      const opacityClasses = [0.25, 0.50, 0.75, 1.0];
      this.alpha = opacityClasses[Math.floor(Math.random() * opacityClasses.length)];
    }
    update(mx, my) {
      const dx = mx - this.x;
      const dy = my - this.y;
      const dSq = dx * dx + dy * dy;

      if (dSq < SPEED_BOOST_RADIUS_SQ) {
        const boost = (1 - Math.sqrt(dSq) / 250) * 5.5;
        this.currentSpeed += (this.baseSpeed + boost - this.currentSpeed) * 0.1;
      } else {
        this.currentSpeed += (this.baseSpeed - this.currentSpeed) * 0.05;
      }

      this.angle += this.va;
      if (Math.random() < 0.01) this.va = (Math.random() - 0.5) * 0.08;
      
      this.x += Math.cos(this.angle) * this.currentSpeed;
      this.y += Math.sin(this.angle) * this.currentSpeed;

      this.segments.unshift({x: this.x, y: this.y});
      if (this.segments.length > this.maxLength) this.segments.pop();

      // Fix for "Straight Line Pop" Bug: 
      // We wrap the coordinates, but the rendering loop will check distance 
      // to ensure it doesn't draw a line across the wrap.
      if (this.x < -600) this.x = width + 550;
      else if (this.x > width + 600) this.x = -550;
      if (this.y < -600) this.y = height + 550;
      else if (this.y > height + 600) this.y = -550;
    }
    draw(ctx, rgb) {
      if (this.segments.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${rgb}, ${this.alpha})`;
      ctx.lineWidth = this.alpha > 0.8 ? 1.3 : 0.8;
      
      ctx.moveTo(this.segments[0].x, this.segments[0].y);
      
      for (let i = 1; i < this.segments.length; i++) {
        const p1 = this.segments[i-1];
        const p2 = this.segments[i];
        
        // BUG FIX: If distance between segments is huge, it's a "wrap-around" 
        // We stop drawing this path and start a new one to prevent the straight line.
        if (Math.abs(p1.x - p2.x) > 300 || Math.abs(p1.y - p2.y) > 300) {
           ctx.stroke();
           ctx.beginPath();
           ctx.moveTo(p2.x, p2.y);
           continue;
        }
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    }
  }

  for(let i = 0; i < trailCount; i++) trails.push(new Trail());

  function animate() {
    ctx.clearRect(0, 0, width, height);
    const isDark = document.documentElement.classList.contains('dark');
    const rgb = isDark ? "255, 255, 255" : "0, 0, 0";
    const mx = globalMouseX + width/2;
    const my = globalMouseY + height/2;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < trails.length; i++) {
      trails[i].update(mx, my);
      trails[i].draw(ctx, rgb);
    }

    plexusRequestId = requestAnimationFrame(animate);
  }
  animate();
};

/* 3. KEEP: Restart Logo Animations */
window.restartLogoAnimations = function() {
  const logoGroup = document.querySelector('#logo-shape-definition.animate-logo');
  if (!logoGroup) return;
  const logoPaths = logoGroup.querySelectorAll('path');
  logoPaths.forEach(path => {
    path.style.animation = 'none';
    void path.offsetWidth; 
    path.style.animation = 'logoDraw 5s cubic-bezier(.75,.03,.46,.46) forwards';
  });
};

document.addEventListener('DOMContentLoaded', () => {
  window.restartPlexus();
  setTimeout(() => window.restartLogoAnimations(), 1);
});

// Clean up background integration
document.addEventListener('alpine:init', () => {
    Alpine.data('plexusBackground', () => ({ init() { } }));
});

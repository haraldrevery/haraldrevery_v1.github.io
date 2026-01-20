/* Performance constants */
const TWO_PI = Math.PI * 2;
const SPEED_BOOST_RADIUS_SQ = 62500; // Using squared distance to avoid Math.sqrt

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
    logoSvg.style.transform = `translateX(-9.81%) rotateX(${currentRotateX | 0}deg) rotateY(${currentRotateY | 0}deg) translateZ(50px)`;
    const shadowColor = document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)';
    logoSvg.style.filter = `drop-shadow(${(currentRotateY * 0.5) | 0}px ${(currentRotateX * 0.5) | 0}px 20px ${shadowColor})`;
  }
  requestAnimationFrame(smoothRotate);
}
smoothRotate();

/* 2. OPTIMIZED ANIMATION: Speed-Boost Trails */
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
  const ctx = canvas.getContext('2d', { alpha: true }); // Ensure hardware acceleration
  const width = 1000, height = 1100;
  
  const trailCount = window.innerWidth < 768 ? 100 : 400; // Slightly lower count for performance stability
  const trails = [];

  class Trail {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.segments = new Float32Array(2000); // Pre-allocate memory
      this.segmentCount = 0;
      
      const rand = Math.random();
      if (rand < 0.10) {
        this.maxLength = Math.floor(Math.random() * 400) + 800; // Balanced long lines
      } else if (rand < 0.25) {
        this.maxLength = Math.floor(Math.random() * 200) + 300;
      } else {
        this.maxLength = Math.floor(Math.random() * 100) + 80;
      }
      
      this.baseSpeed = rand < 0.4 ? (Math.random() * 0.4 + 0.3) : (Math.random() * 1.5 + 0.8);
      this.currentSpeed = this.baseSpeed;
      this.angle = Math.random() * TWO_PI;
      this.va = (Math.random() - 0.5) * 0.05; 
      this.alpha = (Math.random() * 0.85 + 0.15).toFixed(2); // Quantize alpha for batching
    }
    update(mx, my) {
      const dx = mx - this.x;
      const dy = my - this.y;
      const dSq = dx * dx + dy * dy;

      if (dSq < SPEED_BOOST_RADIUS_SQ) {
        const boost = (1 - Math.sqrt(dSq) / 250) * 5;
        this.currentSpeed += (this.baseSpeed + boost - this.currentSpeed) * 0.1;
      } else {
        this.currentSpeed += (this.baseSpeed - this.currentSpeed) * 0.05;
      }

      this.angle += this.va;
      if (Math.random() < 0.01) this.va = (Math.random() - 0.5) * 0.08;
      
      this.x += Math.cos(this.angle) * this.currentSpeed;
      this.y += Math.sin(this.angle) * this.currentSpeed;

      // Shift segments (Manual shift is faster than unshift/pop for large arrays)
      for (let i = Math.min(this.segmentCount, this.maxLength - 1); i > 0; i--) {
        this.segments[i * 2] = this.segments[(i - 1) * 2];
        this.segments[i * 2 + 1] = this.segments[(i - 1) * 2 + 1];
      }
      this.segments[0] = this.x;
      this.segments[1] = this.y;
      if (this.segmentCount < this.maxLength) this.segmentCount++;

      // Wrap
      if (this.x < -400) this.x = width + 390;
      else if (this.x > width + 400) this.x = -390;
      if (this.y < -400) this.y = height + 390;
      else if (this.y > height + 400) this.y = -390;
    }
  }

  for(let i = 0; i < trailCount; i++) trails.push(new Trail());

  function animate() {
    ctx.clearRect(0, 0, width, height);
    const isDark = document.documentElement.classList.contains('dark');
    const rgb = isDark ? "255, 255, 255" : "0, 0, 0";
    const mx = globalMouseX + width/2;
    const my = globalMouseY + height/2;

    // Grouping by alpha to reduce Draw Calls
    const groups = {};

    for (let i = 0; i < trailCount; i++) {
      const t = trails[i];
      t.update(mx, my);
      
      if (!groups[t.alpha]) groups[t.alpha] = new Path2D();
      const p = groups[t.alpha];
      
      if (t.segmentCount > 1) {
        p.moveTo(t.segments[0] | 0, t.segments[1] | 0);
        for (let j = 1; j < t.segmentCount; j += 2) { // Skip every other segment for rendering speed
            p.lineTo(t.segments[j * 2] | 0, t.segments[j * 2 + 1] | 0);
        }
      }
    }

    // Single draw call per alpha group
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const alpha in groups) {
      ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
      ctx.lineWidth = alpha > 0.8 ? 1.2 : 0.7;
      ctx.stroke(groups[alpha]);
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

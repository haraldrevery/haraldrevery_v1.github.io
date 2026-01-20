/* Performance constants */
const TWO_PI = Math.PI * 2;

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
    logoSvg.style.transform = `translateX(-9.81%) rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg) translateZ(50px)`;
    const shadowColor = document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)';
    logoSvg.style.filter = `drop-shadow(${currentRotateY * 0.5}px ${currentRotateX * 0.5}px 20px ${shadowColor})`;
  }
  requestAnimationFrame(smoothRotate);
}
smoothRotate();

/* 2. MAIN ANIMATION: High-Density Ultra-Long Trails */
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
  
  const trailCount = window.innerWidth < 768 ? 130 : 475;
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
        // Ultra-Hero Lines: Massive ribbons (1600-2400 segments)
        this.maxLength = Math.floor(Math.random() * 800) + 1600;
      } else if (rand < 0.25) {
        // Standard Long Lines: (400-600 segments)
        this.maxLength = Math.floor(Math.random() * 200) + 400;
      } else {
        // Standard Trails: (120-240 segments)
        this.maxLength = Math.floor(Math.random() * 120) + 120;
      }
      
      this.speed = Math.random() < 0.4 ? (Math.random() * 0.4 + 0.3) : (Math.random() * 1.8 + 0.8);
      this.angle = Math.random() * TWO_PI;
      this.va = (Math.random() - 0.5) * 0.08; 
      this.followsMouse = Math.random() < 0.2;
      this.alpha = Math.random() * (1.0 - 0.15) + 0.15;
    }
    update() {
      if (this.followsMouse) {
        const targetX = globalMouseX + width/2;
        const targetY = globalMouseY + height/2;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const angleToMouse = Math.atan2(dy, dx);
        
        let diff = angleToMouse - this.angle;
        while (diff < -Math.PI) diff += TWO_PI;
        while (diff > Math.PI) diff -= TWO_PI;
        
        this.angle += diff * 0.03 + (this.va * 0.4);
      } else {
        this.angle += this.va;
        if (Math.random() < 0.01) this.va = (Math.random() - 0.5) * 0.1;
      }
      
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;

      this.segments.unshift({x: this.x, y: this.y});
      if (this.segments.length > this.maxLength) this.segments.pop();

      if (this.x < -500) this.x = width + 490;
      if (this.x > width + 500) this.x = -490;
      if (this.y < -500) this.y = height + 490;
      if (this.y > height + 500) this.y = -490;
    }
    draw(isDark) {
      if (this.segments.length < 2) return;
      ctx.beginPath();
      const rgb = isDark ? "255, 255, 255" : "0, 0, 0";
      ctx.strokeStyle = `rgba(${rgb}, ${this.alpha})`;
      ctx.lineWidth = this.maxLength > 1000 ? 1.6 : (this.alpha > 0.8 ? 1.2 : 0.7);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(this.segments[0].x, this.segments[0].y);
      for(let i = 1; i < this.segments.length; i++) {
        ctx.lineTo(this.segments[i].x, this.segments[i].y);
      }
      ctx.stroke();
    }
  }

  for(let i = 0; i < trailCount; i++) trails.push(new Trail());

  function animate() {
    ctx.clearRect(0, 0, width, height);
    const isDark = document.documentElement.classList.contains('dark');
    trails.forEach(t => {
      t.update();
      t.draw(isDark);
    });
    plexusRequestId = requestAnimationFrame(animate);
  }
  animate();
};

/* 3. KEEP: Restart Logo Animations */
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
  });
  
  void logoGroup.offsetWidth; 
  
  logoPaths.forEach(path => {
    path.style.animation = 'logoDraw 5s cubic-bezier(.75,.03,.46,.46) forwards';
  });
  
  waves.forEach((wave, index) => {
    setTimeout(() => {
      wave.style.animation = 'implodingWave 3.5s cubic-bezier(0.19, 1, 0.22, 1) forwards';
    }, index * 100);
  });
};

/* Initial Start */
document.addEventListener('DOMContentLoaded', () => {
  window.restartPlexus();
  setTimeout(() => window.restartLogoAnimations(), 1);
});

/* 4. BACKGROUND: Empty Alpine Init (Trails Removed) */
document.addEventListener('alpine:init', () => {
    Alpine.data('plexusBackground', () => ({
        init() {
            // Background trails removed as requested
        }
    }));
});

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

/* 2. NEW: Canvas Trails Logic (Replaces Plexus) */
let plexusRequestId;
let globalMouseX = 0, globalMouseY = 0;

document.addEventListener('mousemove', (e) => {
  // Map mouse to canvas coordinates (relative to center)
  globalMouseX = (e.clientX - window.innerWidth / 2);
  globalMouseY = (e.clientY - window.innerHeight / 2);
});

window.restartPlexus = function() {
  if (plexusRequestId) cancelAnimationFrame(plexusRequestId);
  
  const canvas = document.getElementById('plexus-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = 1000, height = 1100;
  
  const trailCount = window.innerWidth < 768 ? 15 : 40;
  const trails = [];

  class Trail {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.segments = [];
      this.maxLength = Math.floor(Math.random() * 20) + 10;
      this.speed = Math.random() * 2 + 1;
      this.angle = Math.random() * TWO_PI;
      this.va = (Math.random() - 0.5) * 0.2; // velocity of angle
    }
    update() {
      // Move towards mouse slightly
      const dx = (globalMouseX + width/2) - this.x;
      const dy = (globalMouseY + height/2) - this.y;
      const angleToMouse = Math.atan2(dy, dx);
      
      // Interpolate angle
      this.angle += (angleToMouse - this.angle) * 0.02;
      this.angle += this.va;
      
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;

      this.segments.unshift({x: this.x, y: this.y});
      if (this.segments.length > this.maxLength) this.segments.pop();

      // Wrap around edges
      if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.reset();
    }
    draw(color) {
      if (this.segments.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.moveTo(this.segments[0].x, this.segments[0].y);
      for(let i = 1; i < this.segments.length; i++) {
        ctx.lineTo(this.segments[i].x, this.segments[i].y);
      }
      ctx.stroke();
    }
  }

  for(let i = 0; i < trailCount; i++) trails.push(new Trail());

  function animate() {
    // Semi-transparent clear creates a "ghosting" fade effect
    ctx.clearRect(0, 0, width, height);
    
    const isDark = document.documentElement.classList.contains('dark');
    const color = isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";

    trails.forEach(t => {
      t.update();
      t.draw(color);
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
  
  void logoGroup.offsetWidth; // Force reflow
  
  logoPaths.forEach(path => {
    path.style.animation = 'logoDraw 5s cubic-bezier(.75,.03,.46,.46) forwards';
  });
  
  waves.forEach((wave, index) => {
    setTimeout(() => {
      wave.style.animation = 'implodingWave 3.5s cubic-bezier(0.19, 1, 0.22, 1) forwards';
    }, index * 100);
  });
};

/* Start initially */
document.addEventListener('DOMContentLoaded', () => {
  window.restartPlexus();
  setTimeout(() => window.restartLogoAnimations(), 1);
});

/* 4. NEW: Background Trails (Alpine integration) */
document.addEventListener('alpine:init', () => {
    Alpine.data('plexusBackground', () => ({
        canvas: null,
        ctx: null,
        points: [],
        init() {
            this.canvas = this.$refs.canvas;
            this.ctx = this.canvas.getContext('2d');
            this.handleResize();
            window.addEventListener('resize', () => this.handleResize());
            
            // Create background flow points
            for(let i=0; i<30; i++) {
                this.points.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    history: [],
                    angle: Math.random() * TWO_PI
                });
            }
            this.animate();
        },
        handleResize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        },
        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const isDark = document.documentElement.classList.contains('dark');
            const color = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
            
            this.points.forEach(p => {
                p.angle += (Math.random() - 0.5) * 0.1;
                p.x += Math.cos(p.angle) * 1.2;
                p.y += Math.sin(p.angle) * 1.2;
                
                p.history.unshift({x: p.x, y: p.y});
                if(p.history.length > 50) p.history.pop();
                
                if(p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
                    p.x = Math.random() * this.canvas.width;
                    p.y = Math.random() * this.canvas.height;
                    p.history = [];
                }
                
                this.ctx.beginPath();
                this.ctx.strokeStyle = color;
                if(p.history.length > 1) {
                    this.ctx.moveTo(p.history[0].x, p.history[0].y);
                    p.history.forEach(h => this.ctx.lineTo(h.x, h.y));
                }
                this.ctx.stroke();
            });
            requestAnimationFrame(() => this.animate());
        }
    }));
});

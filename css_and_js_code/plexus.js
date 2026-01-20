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

/* 2. UPDATED: High-Density Mixed Trails */
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
  
  // 400% More lines (approx 100-120 on desktop)
  const trailCount = window.innerWidth < 768 ? 40 : 120;
  const trails = [];

  class Trail {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.segments = [];
      this.maxLength = Math.floor(Math.random() * 80) + 60; 
      
      // Some lines are now significantly slower (0.5 to 4.0 range)
      this.speed = Math.random() < 0.3 ? (Math.random() * 0.5 + 0.5) : (Math.random() * 2.5 + 1.5);
      
      this.angle = Math.random() * TWO_PI;
      this.va = (Math.random() - 0.5) * 0.12; 
      
      // 50% Probability of following mouse
      this.followsMouse = Math.random() > 0.5;
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
        
        this.angle += diff * 0.07 + (this.va * 0.5);
      } else {
        // Natural wandering for the other 50%
        this.angle += this.va;
        if (Math.random() < 0.02) this.va = (Math.random() - 0.5) * 0.12;
      }
      
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;

      this.segments.unshift({x: this.x, y: this.y});
      if (this.segments.length > this.maxLength) this.segments.pop();

      // Wrap-around logic instead of hard reset for "drifters"
      if (this.x < -100) this.x = width + 90;
      if (this.x > width + 100) this.x = -90;
      if (this.y < -100) this.y = height + 90;
      if (this.y > height + 100) this.y = -90;
    }
    draw(color) {
      if (this.segments.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      // Drifters are slightly thinner for visual hierarchy
      ctx.lineWidth = this.followsMouse ? 1.2 : 0.8;
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
    const color = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.25)";

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

/* 4. BACKGROUND: High Density Alpine Flow */
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
            
            const bgCount = window.innerWidth < 768 ? 30 : 80;
            for(let i=0; i < bgCount; i++) {
                this.points.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    history: [],
                    angle: Math.random() * TWO_PI,
                    len: Math.floor(Math.random() * 100) + 100,
                    speed: Math.random() * 1 + 0.3,
                    follows: Math.random() > 0.5
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
            const color = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
            
            this.points.forEach(p => {
                if(p.follows) {
                  const dx = globalMouseX + (window.innerWidth/2) - p.x;
                  const dy = globalMouseY + (window.innerHeight/2) - p.y;
                  p.angle += (Math.atan2(dy, dx) - p.angle) * 0.02;
                }
                
                p.angle += (Math.random() - 0.5) * 0.04;
                p.x += Math.cos(p.angle) * p.speed;
                p.y += Math.sin(p.angle) * p.speed;
                
                p.history.unshift({x: p.x, y: p.y});
                if(p.history.length > p.len) p.history.pop();
                
                if(p.x < -100 || p.x > this.canvas.width + 100 || p.y < -100 || p.y > this.canvas.height + 100) {
                    p.x = Math.random() * this.canvas.width;
                    p.y = Math.random() * this.canvas.height;
                    p.history = [];
                }
                
                if(p.history.length > 1) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = color;
                    this.ctx.lineWidth = 0.6;
                    this.ctx.moveTo(p.history[0].x, p.history[0].y);
                    for(let i=1; i < p.history.length; i++) {
                        this.ctx.lineTo(p.history[i].x, p.history[i].y);
                    }
                    this.ctx.stroke();
                }
            });
            requestAnimationFrame(() => this.animate());
        }
    }));
});

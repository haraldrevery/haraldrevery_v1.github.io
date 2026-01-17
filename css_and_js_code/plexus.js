/* Script 3D mouse rotation */
let targetRotateX = 0, targetRotateY = 0;
let currentRotateX = 0, currentRotateY = 0;
const logoSvg = document.getElementById('main-logo-svg');

// Only add mouse events on non-touch devices
if (!('ontouchstart' in window)) {
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
}

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

/* Plexus */
// 1. GLOBAL SCOPE: Animation ID and Persistent Mouse Coordinates
let plexusRequestId;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

// Update mouse position globally (only on non-touch devices)
if (!('ontouchstart' in window)) {
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
  });
}

window.restartPlexus = function() {
  // Clear previous loop
  if (plexusRequestId) cancelAnimationFrame(plexusRequestId);
  
  const canvas = document.getElementById('plexus-canvas');
  const svg = document.getElementById('main-logo-svg');
  
  if (!canvas || !svg) {
    console.warn('Plexus: Canvas or SVG not found');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('Plexus: Could not get 2d context');
    return;
  }
  
  // Use the dimensions from your original code
  const width = 1000, height = 1100;
  
  // Dynamic Color
  const isDark = document.documentElement.classList.contains('dark');
  const rgb = isDark ? "255, 255, 255" : "26, 26, 26";
  
  // Particle Settings
  const isMobile = window.innerWidth < 768;
  const targetParticleCount = isMobile ? 21 : 421;
  const connectionDistance = isMobile ? 180 : 150;
  const connDistSq = connectionDistance * connectionDistance;
  
  const posX = new Float32Array(targetParticleCount);
  const posY = new Float32Array(targetParticleCount);
  const velX = new Float32Array(targetParticleCount);
  const velY = new Float32Array(targetParticleCount);
  
  let currentParticleCount = 0;
  const startTime = Date.now();
  
  function createParticle(i) {
    posX[i] = Math.random() * width;
    posY[i] = Math.random() * height;
    velX[i] = (Math.random() - 0.5) * 0.8;
    velY[i] = (Math.random() - 0.5) * 0.8;
  }
  
  function animate() {
    // --- PART 1: RESTORE 3D ROTATION (only on desktop) ---
    if (!('ontouchstart' in window)) {
      const rotateX = targetY * -19;
      const rotateY = targetX * 19;
    }
  
    // --- PART 2: PLEXUS ANIMATION ---
    ctx.clearRect(0, 0, width, height);
    const progress = Math.min((Date.now() - startTime) / 3000, 1);
    const targetThisFrame = Math.floor(progress * targetParticleCount);
    
    while (currentParticleCount < targetThisFrame) {
      createParticle(currentParticleCount);
      currentParticleCount++;
    }
    
    // Draw Particles
    ctx.fillStyle = `rgba(${rgb}, 0.8)`;
    for (let i = 0; i < currentParticleCount; i++) {
      posX[i] += velX[i];
      posY[i] += velY[i];
      if (posX[i] < 0 || posX[i] > width) velX[i] *= -1;
      if (posY[i] < 0 || posY[i] > height) velY[i] *= -1;
      ctx.fillRect(posX[i] - 1, posY[i] - 1, 2, 2);
    }
    
    // Draw Lines
    ctx.lineWidth = 0.8;
    for (let i = 0; i < currentParticleCount; i++) {
      const x1 = posX[i], y1 = posY[i];
      for (let j = i + 1; j < currentParticleCount; j++) {
        const dx = x1 - posX[j], dy = y1 - posY[j];
        const distSq = dx * dx + dy * dy;
        if (distSq < connDistSq) {
          const alpha = (1 - Math.sqrt(distSq) / connectionDistance) * 0.8;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(2)})`;
          ctx.moveTo(x1, y1);
          ctx.lineTo(posX[j], posY[j]);
          ctx.stroke();
        }
      }
    }
    
    plexusRequestId = requestAnimationFrame(animate);
  }
  
  animate();
};

// Start initially with error handling
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.restartPlexus();
  } catch (error) {
    console.error('Plexus initialization error:', error);
  }
});

/* restart logo when dark/light mode */
window.restartLogoAnimations = function() {
  const logoGroup = document.querySelector('#logo-shape-definition.animate-logo');
  const waves = document.querySelectorAll('.wave-echo');
  
  if (!logoGroup) {
    console.warn('Logo group not found');
    return;
  }
  
  // Target the paths for logo drawing animation
  const logoPaths = logoGroup.querySelectorAll('path');
  logoPaths.forEach(path => {
    // Reset to initial state
    path.style.animation = 'none';
    path.style.strokeDashoffset = '4000';
    path.style.fillOpacity = '0';
    // Force reflow
    void path.offsetWidth;
    // Re-apply animation
    path.style.animation = 'logoDraw 5s cubic-bezier(.75,.03,.46,.46) forwards';
  });
  
  // Reset waves with extra reflow force
  waves.forEach((wave, index) => {
    wave.style.animation = 'none';
    wave.style.transform = 'scale(5)';
    wave.style.opacity = '0';
    wave.style.strokeWidth = '0.5px';
    // Force reflow per wave
    void wave.offsetWidth;
    // Re-apply with staggered delay
    setTimeout(() => {
      wave.style.animation = 'implodingWave 3.5s cubic-bezier(0.19, 1, 0.22, 1) forwards';
    }, index * 100);
  });
};

setTimeout(() => {
  try {
    window.restartPlexus();
  } catch (error) {
    console.error('Plexus delayed restart error:', error);
  }
}, 150);

setTimeout(() => {
  try {
    window.restartLogoAnimations();
  } catch (error) {
    console.error('Logo animation restart error:', error);
  }
}, 1);

/* Plexus background */
document.addEventListener('alpine:init', () => {
  Alpine.data('plexusBackground', () => ({
    canvas: null,
    ctx: null,
    particles: [],
    startTime: null,
    config: {
      particleCount: 0,
      lineDistance: 0,
      particleSize: 1.59,
      baseSpeed: 0.4,
      lineOpacity: 0.2
    },
    mouse: { x: -9999, y: -9999 },
    isMobile: false,

    init() {
      try {
        this.canvas = this.$refs.canvas;
        
        if (!this.canvas) {
          console.warn('Alpine plexus: Canvas ref not found');
          return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        if (!this.ctx) {
          console.warn('Alpine plexus: Could not get 2d context');
          return;
        }
        
        this.startTime = Date.now();
        this.isMobile = 'ontouchstart' in window || window.innerWidth < 768;
        
        this.config.particleCount = this.isMobile ? 28 : 96;
        this.config.lineDistance = this.isMobile ? 96 : 221;

        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        
        // Only add mouse tracking on desktop
        if (!this.isMobile) {
          window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
          });
        }

        this.animate();
      } catch (error) {
        console.error('Alpine plexus init error:', error);
      }
    },

    handleResize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.isMobile = 'ontouchstart' in window || window.innerWidth < 768;
      this.config.particleCount = this.isMobile ? 28 : 96;
      this.config.lineDistance = this.isMobile ? 96 : 221;
    },

    createParticle() {
      return {
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.config.baseSpeed,
        vy: (Math.random() - 0.5) * this.config.baseSpeed
      };
    },

    animate() {
      if (!this.ctx) return;
      
      try {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Gradually increase target count over 3 seconds
        const progress = Math.min((Date.now() - this.startTime) / 3000, 1);
        const currentTarget = Math.floor(progress * this.config.particleCount);

        while (this.particles.length < currentTarget) {
          this.particles.push(this.createParticle());
        }

        const color = document.documentElement.classList.contains('dark') ? '255, 255, 255' : '0, 0, 0';
        this.ctx.fillStyle = `rgba(${color}, 0.4)`;
        this.ctx.strokeStyle = `rgba(${color}, ${this.config.lineOpacity})`;

        this.particles.forEach((p, i) => {
          // Only apply mouse speed boost on desktop
          let speedMult = 1.0;
          if (!this.isMobile) {
            const dxMouse = p.x - this.mouse.x;
            const dyMouse = p.y - this.mouse.y;
            const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
            speedMult = distMouse < 250 ? 1.96 : 1.0;
          }

          p.x += p.vx * speedMult; 
          p.y += p.vy * speedMult;

          if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, this.config.particleSize, 0, Math.PI * 2);
          this.ctx.fill();

          for (let j = i + 1; j < this.particles.length; j++) {
            const p2 = this.particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < this.config.lineDistance) {
              this.ctx.lineWidth = (1 - dist / this.config.lineDistance) * 1.5;
              this.ctx.beginPath();
              this.ctx.moveTo(p.x, p.y);
              this.ctx.lineTo(p2.x, p2.y);
              this.ctx.stroke();
            }
          }
        });

        requestAnimationFrame(() => this.animate());
      } catch (error) {
        console.error('Alpine plexus animate error:', error);
      }
    }
  }));
});

/* Performance constants */
const TWO_PI = Math.PI * 2;
const MOUSE_INFLUENCE_DIST_SQ = 62500; // 250² for squared distance check

/* Script 3D mouse rotation */
let targetRotateX = 0, targetRotateY = 0;
let currentRotateX = 0, currentRotateY = 0;
const logoSvg = document.getElementById('main-logo-svg');

document.addEventListener('mousemove', (e) => {
  targetRotateY = ((e.clientX / window.innerWidth) - 0.5) * 40;
  targetRotateX = ((e.clientY / window.innerHeight) - 0.5) * -40;
});

// Reset rotation when the mouse truly leaves the browser window
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



  
/* Plexus */
// 1. GLOBAL SCOPE: Animation ID and Persistent Mouse Coordinates
let plexusRequestId;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

// Update mouse position globally so it persists through restarts
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
  mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
});

window.restartPlexus = function() {
  // Clear previous loop
  if (plexusRequestId) cancelAnimationFrame(plexusRequestId);
  
  const canvas = document.getElementById('plexus-canvas');
  const svg = document.getElementById('main-logo-svg');
  if (!canvas || !svg) return;
  
  const ctx = canvas.getContext('2d');
  
  // Use the dimensions from your original code
  const width = 1000, height = 1100;
  
  // Dynamic Color
  const isDark = document.documentElement.classList.contains('dark');
  const rgb = isDark ? "255, 255, 255" : "26, 26, 26";
  
  // Particle Settings
  const isMobile = window.innerWidth < 768;
  const targetParticleCount = isMobile ? 0 : 400;
  const connectionDistance = isMobile ? 0 : 145;
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
    // --- PART 1: RESTORE 3D ROTATION ---
    // Apply the 3D tilt to the SVG
    const rotateX = targetY * -19; // Vertical tilt
    const rotateY = targetX * 19; // Horizontal tilt
  
    // --- PART 2: PLEXUS ANIMATION ---
    ctx.clearRect(0, 0, width, height);
    
    const progress = Math.min((Date.now() - startTime) / 3000, 1);
    const targetThisFrame = Math.floor(progress * targetParticleCount);
    
    while (currentParticleCount < targetThisFrame) {
      createParticle(currentParticleCount);
      currentParticleCount++;
    }
    
    // Draw Particles - set fill style once
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
          // Optimized: use integer math instead of toFixed
          const alpha = Math.round((1 - Math.sqrt(distSq) / connectionDistance) * 80);
          ctx.strokeStyle = `rgba(${rgb}, ${alpha / 100})`;
          ctx.beginPath();
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

// Start initially
document.addEventListener('DOMContentLoaded', () => {
  window.restartPlexus();
});



/*   restart logo when dark/light mode */

window.restartLogoAnimations = function() {
  const logoGroup = document.querySelector('#logo-shape-definition.animate-logo');
  const waves = document.querySelectorAll('.wave-echo');
  if (!logoGroup) return;

  const logoPaths = logoGroup.querySelectorAll('path');
  
  // Phase 1: Remove all animations at once
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
  
  // Single forced reflow for ALL elements
  void logoGroup.offsetWidth;
  
  // Phase 2: Re-apply animations
  logoPaths.forEach(path => {
    path.style.animation = 'logoDraw 5s cubic-bezier(.75,.03,.46,.46) forwards';
  });
  
  waves.forEach((wave, index) => {
    setTimeout(() => {
      wave.style.animation = 'implodingWave 3.5s cubic-bezier(0.19, 1, 0.22, 1) forwards';
    }, index * 100);
  });
};

    

setTimeout(() => window.restartPlexus(), 150);
setTimeout(() => window.restartLogoAnimations(), 1); // logo a bit later


/* Plexus background */

document.addEventListener('alpine:init', () => {
    Alpine.data('plexusBackground', () => ({
        canvas: null,
        ctx: null,
        particles: [],
        startTime: null, // Track when the animation starts for the build-up
        config: {
            particleCount: 0,
            lineDistance: 0,
            particleSize: 1.59,
            baseSpeed: 0.4,
            lineOpacity: 0.2
        },
        mouse: { x: -9999, y: -9999 },

        init() {
            this.canvas = this.$refs.canvas;
            this.ctx = this.canvas.getContext('2d');
            this.startTime = Date.now(); // Set the start time

            const isMobile = window.innerWidth < 768;
            this.config.particleCount = isMobile ? 21 : 96;
            this.config.lineDistance = isMobile ? 299 : 221;

            this.handleResize();
            window.addEventListener('resize', () => this.handleResize());
            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });

            this.animate();
        },

        handleResize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            const isMobile = window.innerWidth < 768;
            this.config.particleCount = isMobile ? 25 : 96;
            this.config.lineDistance = isMobile ? 250 : 221;
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
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // --- RESTORED BUILD-UP LOGIC ---
            // Gradually increase target count over 3 seconds
            const progress = Math.min((Date.now() - this.startTime) / 3000, 1);
            const currentTarget = Math.floor(progress * this.config.particleCount);

            while (this.particles.length < currentTarget) {
                this.particles.push(this.createParticle());
            }

            const color = this.darkMode ? '255, 255, 255' : '0, 0, 0';
            
            // Set fill style once before particle loop
            this.ctx.fillStyle = `rgba(${color}, 0.4)`;

            this.particles.forEach((p, i) => {
                // Optimized: use squared distance to avoid sqrt
                const dxMouse = p.x - this.mouse.x;
                const dyMouse = p.y - this.mouse.y;
                const distSqMouse = dxMouse * dxMouse + dyMouse * dyMouse;
                const speedMult = distSqMouse < MOUSE_INFLUENCE_DIST_SQ ? 1.96 : 1.0;

                p.x += p.vx * speedMult; 
                p.y += p.vy * speedMult;

                if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, this.config.particleSize, 0, TWO_PI);
                this.ctx.fill();

                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist < this.config.lineDistance) {
                        this.ctx.lineWidth = (1 - dist / this.config.lineDistance) * 1.5;
                        this.ctx.strokeStyle = `rgba(${color}, ${this.config.lineOpacity})`;
                        this.ctx.beginPath();
                        this.ctx.moveTo(p.x, p.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.stroke();
                    }
                }
            });

            requestAnimationFrame(() => this.animate());
        }
    }));
});

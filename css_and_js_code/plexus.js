/* Performance constants */
const TWO_PI = Math.PI * 2;
const MOUSE_INFLUENCE_DIST_SQ = 62500; // 250² for squared distance check

/* Script 3D mouse rotation - Preserved Original Settings */
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

/* Logo Plexus Canvas - Optimized with Grid + Batching */
let plexusRequestId;
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
  mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
});

window.restartPlexus = function() {
  if (plexusRequestId) cancelAnimationFrame(plexusRequestId);
  
  const canvas = document.getElementById('plexus-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const width = 1000, height = 1100;
  const isDark = document.documentElement.classList.contains('dark');
  const rgb = isDark ? "255, 255, 255" : "26, 26, 26";
  
  const isMobile = window.innerWidth < 768;
  const targetParticleCount = isMobile ? 0 : 500; // Increased to 500
  const connectionDistance = 145;
  const connDistSq = connectionDistance * connectionDistance;
  
  // Spatial Grid Configuration
  const cellSize = connectionDistance;
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  
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
    ctx.clearRect(0, 0, width, height);
    const progress = Math.min((Date.now() - startTime) / 3000, 1);
    const targetThisFrame = Math.floor(progress * targetParticleCount);
    
    while (currentParticleCount < targetThisFrame) {
      createParticle(currentParticleCount);
      currentParticleCount++;
    }
    
    const grid = Array.from({ length: cols * rows }, () => []);
    
    // Part 1: Update Positions and Rebuild Grid
    ctx.fillStyle = `rgba(${rgb}, 0.8)`;
    for (let i = 0; i < currentParticleCount; i++) {
      posX[i] += velX[i];
      posY[i] += velY[i];
      if (posX[i] < 0 || posX[i] > width) velX[i] *= -1;
      if (posY[i] < 0 || posY[i] > height) velY[i] *= -1;
      
      // Coordinate snapping for performance
      ctx.fillRect((posX[i] - 1) | 0, (posY[i] - 1) | 0, 2, 2);

      const c = Math.floor(posX[i] / cellSize);
      const r = Math.floor(posY[i] / cellSize);
      if (c >= 0 && c < cols && r >= 0 && r < rows) grid[c + r * cols].push(i);
    }
    
    // Part 2: Batch Drawing by Alpha (10 bins)
    const bins = Array.from({ length: 11 }, () => new Path2D());

    for (let i = 0; i < currentParticleCount; i++) {
      const x1 = posX[i], y1 = posY[i];
      const c = Math.floor(x1 / cellSize), r = Math.floor(y1 / cellSize);

      for (let goX = -1; goX <= 1; goX++) {
        for (let goY = -1; goY <= 1; goY++) {
          const nc = c + goX, nr = r + goY;
          if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
            const neighbors = grid[nc + nr * cols];
            for (let j = 0; j < neighbors.length; j++) {
              const targetIdx = neighbors[j];
              if (i >= targetIdx) continue; // ID Check: No double strokes

              const dx = x1 - posX[targetIdx], dy = y1 - posY[targetIdx];
              const dSq = dx * dx + dy * dy;

              if (dSq < connDistSq) {
                const dist = Math.sqrt(dSq);
                const alphaBin = Math.floor((1 - dist / connectionDistance) * 10);
                const path = bins[alphaBin];
                path.moveTo(x1 | 0, y1 | 0); // Bitwise floor
                path.lineTo(posX[targetIdx] | 0, posY[targetIdx] | 0);
              }
            }
          }
        }
      }
    }

    // Render 11 paths instead of hundreds of strokes
    ctx.lineWidth = 0.8;
    for (let b = 0; b <= 10; b++) {
        ctx.strokeStyle = `rgba(${rgb}, ${(b * 8) / 100})`;
        ctx.stroke(bins[b]);
    }
    
    plexusRequestId = requestAnimationFrame(animate);
  }
  animate();
};

/* SVG Logo Restart Logic - Preserved Original */
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
  logoPaths.forEach(path => path.style.animation = 'logoDraw 5s cubic-bezier(.75,.03,.46,.46) forwards');
  waves.forEach((wave, index) => {
    setTimeout(() => {
      wave.style.animation = 'implodingWave 3.5s cubic-bezier(0.19, 1, 0.22, 1) forwards';
    }, index * 100);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  window.restartPlexus();
  setTimeout(() => window.restartLogoAnimations(), 1);
});

/* Plexus Background - Optimized with Grid + Batching + ID Check */
document.addEventListener('alpine:init', () => {
    Alpine.data('plexusBackground', () => ({
        canvas: null,
        ctx: null,
        particles: [],
        startTime: null,
        grid: [],
        cols: 0,
        rows: 0,
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
            this.startTime = Date.now();
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
            this.config.particleCount = isMobile ? 25 : 120; // Slight boost for desktop
            this.config.lineDistance = isMobile ? 250 : 221;
            this.cols = Math.ceil(this.canvas.width / this.config.lineDistance);
            this.rows = Math.ceil(this.canvas.height / this.config.lineDistance);
        },

        createParticle(id) {
            return {
                id: id,
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.config.baseSpeed,
                vy: (Math.random() - 0.5) * this.config.baseSpeed
            };
        },

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const progress = Math.min((Date.now() - this.startTime) / 3000, 1);
            const currentTarget = Math.floor(progress * this.config.particleCount);

            while (this.particles.length < currentTarget) {
                this.particles.push(this.createParticle(this.particles.length));
            }

            const color = this.darkMode ? '255, 255, 255' : '0, 0, 0';
            this.ctx.fillStyle = `rgba(${color}, 0.4)`;
            this.grid = Array.from({ length: this.cols * this.rows }, () => []);

            this.particles.forEach((p) => {
                const dxMouse = p.x - this.mouse.x;
                const dyMouse = p.y - this.mouse.y;
                const distSqMouse = dxMouse * dxMouse + dyMouse * dyMouse;
                const speedMult = distSqMouse < MOUSE_INFLUENCE_DIST_SQ ? 1.96 : 1.0;

                p.x += p.vx * speedMult; 
                p.y += p.vy * speedMult;

                if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

                this.ctx.beginPath();
                this.ctx.arc(p.x | 0, p.y | 0, this.config.particleSize, 0, TWO_PI);
                this.ctx.fill();

                const c = Math.floor(p.x / this.config.lineDistance);
                const r = Math.floor(p.y / this.config.lineDistance);
                if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
                    this.grid[c + r * this.cols].push(p);
                }
            });

            const bins = Array.from({ length: 6 }, () => new Path2D());
            const connDistSq = this.config.lineDistance * this.config.lineDistance;

            this.particles.forEach(p1 => {
                const c = Math.floor(p1.x / this.config.lineDistance);
                const r = Math.floor(p1.y / this.config.lineDistance);

                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const nc = c + i, nr = r + j;
                        if (nc >= 0 && nc < this.cols && nr >= 0 && nr < this.rows) {
                            this.grid[nc + nr * this.cols].forEach(p2 => {
                                if (p1.id >= p2.id) return; // ID Check

                                const dx = p1.x - p2.x, dy = p1.y - p2.y;
                                const dSq = dx * dx + dy * dy;

                                if (dSq < connDistSq) {
                                    const dist = Math.sqrt(dSq);
                                    const alphaBin = Math.floor((1 - dist / this.config.lineDistance) * 5);
                                    const path = bins[alphaBin];
                                    path.moveTo(p1.x | 0, p1.y | 0);
                                    path.lineTo(p2.x | 0, p2.y | 0);
                                }
                            });
                        }
                    }
                }
            });

            for (let b = 0; b <= 5; b++) {
                this.ctx.lineWidth = (b / 5) * 1.5;
                this.ctx.strokeStyle = `rgba(${color}, ${this.config.lineOpacity})`;
                this.ctx.stroke(bins[b]);
            }

            requestAnimationFrame(() => this.animate());
        }
    }));
});

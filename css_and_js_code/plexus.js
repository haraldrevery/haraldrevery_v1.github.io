/* 1. WORKER CODE DEFINITION (Runs on a separate thread) */
const plexusWorkerCode = `
    const TWO_PI = Math.PI * 2;
    let ctx, width, height, isDark, rgb, config, particles = [], startTime, grid = [], cols, rows;
    let mouse = { x: -9999, y: -9999 };
    const MOUSE_INFLUENCE_DIST_SQ = 62500;

    self.onmessage = function(e) {
        if (e.data.type === 'init') {
            const canvas = e.data.canvas;
            ctx = canvas.getContext('2d');
            width = e.data.width;
            height = e.data.height;
            config = e.data.config;
            isDark = e.data.isDark;
            rgb = isDark ? "255, 255, 255" : (e.data.isBackground ? "0, 0, 0" : "26, 26, 26");
            startTime = Date.now();
            
            cols = Math.ceil(width / config.lineDistance);
            rows = Math.ceil(height / config.lineDistance);
            
            animate();
        } else if (e.data.type === 'mouse') {
            mouse = e.data.mouse;
        } else if (e.data.type === 'theme') {
            isDark = e.data.isDark;
            rgb = isDark ? "255, 255, 255" : (e.data.isBackground ? "0, 0, 0" : "26, 26, 26");
        }
    };

    function createParticle(id) {
        return {
            id,
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * (config.baseSpeed || 0.8),
            vy: (Math.random() - 0.5) * (config.baseSpeed || 0.8)
        };
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        const progress = Math.min((Date.now() - startTime) / 3000, 1);
        const currentTarget = Math.floor(progress * config.particleCount);

        while (particles.length < currentTarget) {
            particles.push(createParticle(particles.length));
        }

        ctx.fillStyle = \`rgba(\${rgb}, \${config.isBackground ? 0.4 : 0.8})\`;
        grid = Array.from({ length: cols * rows }, () => []);

        // Physics & Grid
        particles.forEach(p => {
            const dxM = p.x - mouse.x, dyM = p.y - mouse.y;
            const distSqM = dxM * dxM + dyM * dyM;
            const speedMult = distSqM < MOUSE_INFLUENCE_DIST_SQ ? 1.96 : 1.0;

            p.x += p.vx * speedMult;
            p.y += p.vy * speedMult;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.fillRect((p.x - 1) | 0, (p.y - 1) | 0, config.particleSize || 2, config.particleSize || 2);

            const c = Math.floor(p.x / config.lineDistance);
            const r = Math.floor(p.y / config.lineDistance);
            if (c >= 0 && c < cols && r >= 0 && r < rows) grid[c + r * cols].push(p);
        });

        // Batch Drawing (Alpha Binning)
        const binCount = config.isBackground ? 6 : 11;
        const bins = Array.from({ length: binCount }, () => new Path2D());
        const connDistSq = config.lineDistance * config.lineDistance;

        particles.forEach(p1 => {
            const c = Math.floor(p1.x / config.lineDistance);
            const r = Math.floor(p1.y / config.lineDistance);

            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const nc = c + i, nr = r + j;
                    if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
                        grid[nc + nr * cols].forEach(p2 => {
                            if (p1.id >= p2.id) return;
                            const dx = p1.x - p2.x, dy = p1.y - p2.y;
                            const dSq = dx * dx + dy * dy;

                            if (dSq < connDistSq) {
                                const dist = Math.sqrt(dSq);
                                const alphaBin = Math.floor((1 - dist / config.lineDistance) * (binCount - 1));
                                const path = bins[alphaBin];
                                path.moveTo(p1.x | 0, p1.y | 0);
                                path.lineTo(p2.x | 0, p2.y | 0);
                            }
                        });
                    }
                }
            }
        });

        ctx.lineWidth = config.isBackground ? 1.2 : 0.8;
        for (let b = 0; b < binCount; b++) {
            const alpha = config.isBackground ? config.lineOpacity : (b * 8) / 100;
            ctx.strokeStyle = \`rgba(\${rgb}, \${alpha})\`;
            ctx.stroke(bins[b]);
        }

        requestAnimationFrame(animate);
    }
`;

/* 2. MAIN THREAD LOGIC */

const workerBlob = new Blob([plexusWorkerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(workerBlob);

// --- SVG 3D Rotation (Main Thread because it's DOM) ---
let targetRotateX = 0, targetRotateY = 0, currentRotateX = 0, currentRotateY = 0;
const logoSvg = document.getElementById('main-logo-svg');

document.addEventListener('mousemove', (e) => {
  targetRotateY = ((e.clientX / window.innerWidth) - 0.5) * 40;
  targetRotateX = ((e.clientY / window.innerHeight) - 0.5) * -40;
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

// --- Logo Plexus Worker Initialization ---
let logoWorker;
window.restartPlexus = function() {
  if (logoWorker) logoWorker.terminate();
  const canvas = document.getElementById('plexus-canvas');
  if (!canvas || !canvas.transferControlToOffscreen) return;
  
  const offscreen = canvas.transferControlToOffscreen();
  logoWorker = new Worker(workerUrl);
  
  logoWorker.postMessage({
    type: 'init',
    canvas: offscreen,
    width: 1000, height: 1100,
    isDark: document.documentElement.classList.contains('dark'),
    config: { particleCount: window.innerWidth < 768 ? 0 : 500, lineDistance: 145, particleSize: 2 }
  }, [offscreen]);

  window.addEventListener('mousemove', (e) => {
    // Send coordinates relative to logo center
    const mx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2) * 500 + 500;
    const my = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2) * 550 + 550;
    logoWorker.postMessage({ type: 'mouse', mouse: { x: mx, y: my } });
  });
};

// --- Background Plexus (Alpine.js Worker Proxy) ---
document.addEventListener('alpine:init', () => {
  Alpine.data('plexusBackground', () => ({
    worker: null,
    init() {
      const canvas = this.$refs.canvas;
      if (!canvas.transferControlToOffscreen) return;
      const offscreen = canvas.transferControlToOffscreen();
      
      this.worker = new Worker(workerUrl);
      const isMobile = window.innerWidth < 768;
      
      this.worker.postMessage({
        type: 'init',
        canvas: offscreen,
        width: window.innerWidth, height: window.innerHeight,
        isDark: document.documentElement.classList.contains('dark'),
        isBackground: true,
        config: {
          particleCount: isMobile ? 25 : 120,
          lineDistance: isMobile ? 250 : 221,
          particleSize: 1.59,
          baseSpeed: 0.4,
          lineOpacity: 0.2,
          isBackground: true
        }
      }, [offscreen]);

      window.addEventListener('mousemove', (e) => {
        this.worker.postMessage({ type: 'mouse', mouse: { x: e.clientX, y: e.clientY } });
      });
      
      // Watch for theme changes
      const observer = new MutationObserver(() => {
        this.worker.postMessage({ type: 'theme', isDark: document.documentElement.classList.contains('dark'), isBackground: true });
        if (logoWorker) logoWorker.postMessage({ type: 'theme', isDark: document.documentElement.classList.contains('dark') });
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
  }));
});

/* SVG Logo Restart Logic - Preserved */
window.restartLogoAnimations = function() {
  const logoGroup = document.querySelector('#logo-shape-definition.animate-logo');
  if (!logoGroup) return;
  const logoPaths = logoGroup.querySelectorAll('path');
  const waves = document.querySelectorAll('.wave-echo');
  logoPaths.forEach(path => { path.style.animation = 'none'; path.style.strokeDashoffset = '4000'; path.style.fillOpacity = '0'; });
  waves.forEach(wave => { wave.style.animation = 'none'; wave.style.transform = 'scale(5)'; wave.style.opacity = '0'; });
  void logoGroup.offsetWidth;
  logoPaths.forEach(path => path.style.animation = 'logoDraw 5s cubic-bezier(.75,.03,.46,.46) forwards');
  waves.forEach((wave, index) => { setTimeout(() => { wave.style.animation = 'implodingWave 3.5s cubic-bezier(0.19, 1, 0.22, 1) forwards'; }, index * 100); });
};

document.addEventListener('DOMContentLoaded', () => {
  window.restartPlexus();
  setTimeout(() => window.restartLogoAnimations(), 1);
});

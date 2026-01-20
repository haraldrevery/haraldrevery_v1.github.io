/* Performance & Config constants */
const TWO_PI = Math.PI * 2;

/* 1. KEEP: 3D Mouse Rotation Logic (Exactly as original) */
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

/* 2. NEW: Grid Parallax Logic (Replaces Plexus) */
let plexusRequestId;
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
  // Normalized coordinates (-1 to 1)
  mouseX = (e.clientX / window.innerWidth) - 0.5;
  mouseY = (e.clientY / window.innerHeight) - 0.5;
});

window.restartPlexus = function() {
  if (plexusRequestId) cancelAnimationFrame(plexusRequestId);
  
  const canvas = document.getElementById('plexus-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Static internal resolution for the logo-area canvas
  const width = 1000, height = 1100;
  
  function drawGrid(lerpMouseX, lerpMouseY) {
    ctx.clearRect(0, 0, width, height);
    
    const isDark = document.documentElement.classList.contains('dark');
    const color = isDark ? "255, 255, 255" : "0, 0, 0";
    
    // Grid settings
    const layers = [
      { spacing: 60, speed: 15, opacity: 0.05, lineWidth: 1 },
      { spacing: 120, speed: 35, opacity: 0.1, lineWidth: 2 }
    ];

    layers.forEach(layer => {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${color}, ${layer.opacity})`;
      ctx.lineWidth = layer.lineWidth;

      const offsetX = mouseX * layer.speed;
      const offsetY = mouseY * layer.speed;

      // Vertical lines
      for (let x = offsetX % layer.spacing; x < width; x += layer.spacing) {
        ctx.moveTo(x | 0, 0);
        ctx.lineTo(x | 0, height);
      }
      // Horizontal lines
      for (let y = offsetY % layer.spacing; y < height; y += layer.spacing) {
        ctx.moveTo(0, y | 0);
        ctx.lineTo(width, y | 0);
      }
      ctx.stroke();
    });
  }

  function animate() {
    drawGrid();
    plexusRequestId = requestAnimationFrame(animate);
  }
  animate();
};

/* 3. KEEP: Restart Logo Animations (SVG drawing logic) */
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

/* Initial Start */
document.addEventListener('DOMContentLoaded', () => {
  window.restartPlexus();
  setTimeout(() => window.restartLogoAnimations(), 1);
});

/* 4. NEW: Alpine Parallax Background (Replaces Background Plexus) */
document.addEventListener('alpine:init', () => {
    Alpine.data('plexusBackground', () => ({
        canvas: null,
        ctx: null,
        init() {
            this.canvas = this.$refs.canvas;
            this.ctx = this.canvas.getContext('2d');
            this.handleResize();
            window.addEventListener('resize', () => this.handleResize());
            this.animate();
        },
        handleResize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        },
        animate() {
            const ctx = this.ctx;
            const canvas = this.canvas;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const isDark = document.documentElement.classList.contains('dark');
            const color = isDark ? "255, 255, 255" : "0, 0, 0";
            
            // Background grid is subtle and slow
            const spacing = 100;
            const speed = 50; // Pixels of max movement
            
            const offX = (mouseX * speed);
            const offY = (mouseY * speed);

            ctx.beginPath();
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = `rgba(${color}, 0.08)`;

            for (let x = (offX % spacing); x < canvas.width; x += spacing) {
                ctx.moveTo(x | 0, 0);
                ctx.lineTo(x | 0, canvas.height);
            }
            for (let y = (offY % spacing); y < canvas.height; y += spacing) {
                ctx.moveTo(0, y | 0);
                ctx.lineTo(canvas.width, y | 0);
            }
            ctx.stroke();

            // Add subtle "tracking dots" at intersections
            ctx.fillStyle = `rgba(${color}, 0.2)`;
            for (let x = (offX % spacing); x < canvas.width; x += spacing) {
                for (let y = (offY % spacing); y < canvas.height; y += spacing) {
                    ctx.fillRect((x - 1) | 0, (y - 1) | 0, 2, 2);
                }
            }

            requestAnimationFrame(() => this.animate());
        }
    }));
});

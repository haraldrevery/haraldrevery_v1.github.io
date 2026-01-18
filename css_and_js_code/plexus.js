/**
 * UNIFIED PLEXUS V2.1
 * Combined: 3D Logo Rotation, Logo-Specific Plexus, and Full-Screen Background
 */

// 1. GLOBAL STATE
const state = {
    mouseX: 0,
    mouseY: 0,
    targetRotateX: 0,
    targetRotateY: 0,
    currentRotateX: 0,
    currentRotateY: 0,
    isDark: document.documentElement.classList.contains('dark')
};

// Single listener for all effects
document.addEventListener('mousemove', (e) => {
    // Rotation targets
    state.targetRotateY = ((e.clientX / window.innerWidth) - 0.5) * 40;
    state.targetRotateX = ((e.clientY / window.innerHeight) - 0.5) * -40;
    
    // Background coordinates
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
});

// Reset rotation on mouse out
document.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget && !e.toElement) {
        state.targetRotateY = 0;
        state.targetRotateX = 0;
    }
});

// 2. 3D LOGO ROTATION ENGINE
const logoSvg = document.getElementById('main-logo-svg');
function smoothRotate() {
    if (logoSvg) {
        state.currentRotateX += (state.targetRotateX - state.currentRotateX) * 0.29;
        state.currentRotateY += (state.targetRotateY - state.currentRotateY) * 0.29;
        
        logoSvg.style.transform = `translateX(-9.81%) rotateX(${state.currentRotateX}deg) rotateY(${state.currentRotateY}deg) translateZ(50px)`;
        
        const shadowColor = state.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)';
        logoSvg.style.filter = `drop-shadow(${state.currentRotateY * 0.5}px ${state.currentRotateX * 0.5}px 20px ${shadowColor})`;
    }
    requestAnimationFrame(smoothRotate);
}
smoothRotate();

// 3. LOGO-SPECIFIC PLEXUS (The high-density effect)
window.restartPlexus = function() {
    const canvas = document.getElementById('plexus-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 1000, height = 1100;
    
    const isMobile = window.innerWidth < 768;
    const targetCount = isMobile ? 0 : 421;
    const posX = new Float32Array(targetCount);
    const posY = new Float32Array(targetCount);
    const velX = new Float32Array(targetCount);
    const velY = new Float32Array(targetCount);

    for (let i = 0; i < targetCount; i++) {
        posX[i] = Math.random() * width;
        posY[i] = Math.random() * height;
        velX[i] = (Math.random() - 0.5) * 0.8;
        velY[i] = (Math.random() - 0.5) * 0.8;
    }

    function animateLogoPlexus() {
        ctx.clearRect(0, 0, width, height);
        const rgb = state.isDark ? "255, 255, 255" : "26, 26, 26";
        
        ctx.fillStyle = `rgba(${rgb}, 0.8)`;
        ctx.lineWidth = 0.8;

        for (let i = 0; i < targetCount; i++) {
            posX[i] += velX[i];
            posY[i] += velY[i];
            if (posX[i] < 0 || posX[i] > width) velX[i] *= -1;
            if (posY[i] < 0 || posY[i] > height) velY[i] *= -1;
            
            ctx.fillRect(posX[i] - 1, posY[i] - 1, 2, 2);

            for (let j = i + 1; j < targetCount; j++) {
                const dx = posX[i] - posX[j], dy = posY[i] - posY[j];
                const distSq = dx * dx + dy * dy;
                if (distSq < 22500) { // 150px distance
                    const alpha = (1 - Math.sqrt(distSq) / 150) * 0.8;
                    ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(posX[i], posY[i]);
                    ctx.lineTo(posX[j], posY[j]);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animateLogoPlexus);
    }
    animateLogoPlexus();
};

// 4. BACKGROUND PLEXUS (Alpine.js)
document.addEventListener('alpine:init', () => {
    Alpine.data('plexusBackground', () => ({
        canvas: null, ctx: null, particles: [], startTime: Date.now(),
        config: { 
            particleCount: window.innerWidth < 768 ? 40 : 96, 
            lineDistance: 221, 
            particleSize: 1.59 
        },
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
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const progress = Math.min((Date.now() - this.startTime) / 3000, 1);
            const currentTarget = Math.floor(progress * this.config.particleCount);

            while (this.particles.length < currentTarget) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4
                });
            }

            const color = state.isDark ? '255, 255, 255' : '0, 0, 0';
            this.ctx.fillStyle = `rgba(${color}, 0.4)`;
            this.ctx.strokeStyle = `rgba(${color}, 0.2)`;

            this.particles.forEach((p, i) => {
                const distMouse = Math.hypot(p.x - state.mouseX, p.y - state.mouseY);
                const speedMult = distMouse < 250 ? 1.96 : 1.0;

                p.x += p.vx * speedMult;
                p.y += p.vy * speedMult;

                if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, this.config.particleSize, 0, Math.PI * 2);
                this.ctx.fill();

                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const d = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (d < this.config.lineDistance) {
                        this.ctx.lineWidth = (1 - d / this.config.lineDistance) * 1.5;
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

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    window.restartPlexus();
});

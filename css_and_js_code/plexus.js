/* Performance constants */
const TWO_PI = Math.PI * 2;
const MOUSE_INFLUENCE_DIST_SQ = 62500;

/* 1. WORKER CODE DEFINITION (In-memory for modern browsers) */
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
            rgb = isDark ? "255, 255, 255" : (config.isBackground ? "0, 0, 0" : "26, 26, 26");
            startTime = Date.now();
            cols = Math.ceil(width / config.lineDistance);
            rows = Math.ceil(height / config.lineDistance);
            animate();
        } else if (e.data.type === 'mouse') { 
            mouse = e.data.mouse; 
        } else if (e.data.type === 'theme') {
            isDark = e.data.isDark;
            rgb = isDark ? "255, 255, 255" : (config.isBackground ? "0, 0, 0" : "26, 26, 26");
        }
    };

    function animate() {
        ctx.clearRect(0, 0, width, height);
        const progress = Math.min((Date.now() - startTime) / 3000, 1);
        const target = Math.floor(progress * config.particleCount);
        
        while (particles.length < target) {
            particles.push({
                id: particles.length, 
                x: Math.random() * width, 
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * (config.baseSpeed || 0.8),
                vy: (Math.random() - 0.5) * (config.baseSpeed || 0.8)
            });
        }
        
        grid = Array.from({ length: cols * rows }, () => []);
        ctx.fillStyle = 'rgba(' + rgb + ', ' + (config.isBackground ? 0.4 : 0.8) + ')';
        
        particles.forEach(p => {
            const dxM = p.x - mouse.x, dyM = p.y - mouse.y;
            const speedMult = (dxM*dxM + dyM*dyM) < MOUSE_INFLUENCE_DIST_SQ ? 1.96 : 1.0;
            p.x += p.vx * speedMult; 
            p.y += p.vy * speedMult;
            if (p.x < 0 || p.x > width) p.vx *= -1; 
            if (p.y < 0 || p.y > height) p.vy *= -1;
            ctx.fillRect((p.x - 1) | 0, (p.y - 1) | 0, config.particleSize || 2, config.particleSize || 2);
            const c = Math.floor(p.x / config.lineDistance), r = Math.floor(p.y / config.lineDistance);
            if (c >= 0 && c < cols && r >= 0 && r < rows) grid[c + r * cols].push(p);
        });
        
        const binCount = config.isBackground ? 6 : 11;
        const bins = Array.from({ length: binCount }, () => new Path2D());
        const dSqMax = config.lineDistance * config.lineDistance;
        
        particles.forEach(p1 => {
            const c = Math.floor(p1.x / config.lineDistance), r = Math.floor(p1.y / config.lineDistance);
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const nc = c + i, nr = r + j;
                    if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
                        grid[nc + nr * cols].forEach(p2 => {
                            if (p1.id >= p2.id) return;
                            const dx = p1.x - p2.x, dy = p1.y - p2.y, dSq = dx*dx + dy*dy;
                            if (dSq < dSqMax) {
                                const alphaBin = Math.floor((1 - Math.sqrt(dSq) / config.lineDistance) * (binCount - 1));
                                bins[alphaBin].moveTo(p1.x | 0, p1.y | 0); 
                                bins[alphaBin].lineTo(p2.x | 0, p2.y | 0);
                            }
                        });
                    }
                }
            }
        });
        
        ctx.lineWidth = config.isBackground ? 1.2 : 0.8;
        for (let b = 0; b < binCount; b++) {
            ctx.strokeStyle = 'rgba(' + rgb + ', ' + (config.isBackground ? config.lineOpacity : (b * 8) / 100) + ')';
            ctx.stroke(bins[b]);
        }
        requestAnimationFrame(animate);
    }
`;

/* 2. MAIN THREAD LOGIC (Rotation & Fallback) */

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

// --- Logic Wrapper for Logo and Background ---
const createPlexus = (canvas, isBackground, config) => {
    const isDark = () => document.documentElement.classList.contains('dark');
    let mousePos = { x: -9999, y: -9999 };

    // FEATURE CHECK: OffscreenCanvas support (Safari 16.4+, Chrome 69+, Firefox 105+)
    if (typeof OffscreenCanvas !== 'undefined' && canvas.transferControlToOffscreen) {
        const offscreen = canvas.transferControlToOffscreen();
        const blob = new Blob([plexusWorkerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        
        worker.postMessage({ 
            type: 'init', 
            canvas: offscreen, 
            width: canvas.width, 
            height: canvas.height, 
            config, 
            isDark: isDark() 
        }, [offscreen]);
        
        const mouseHandler = (e) => {
            const mx = isBackground ? e.clientX : (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2) * 500 + 500;
            const my = isBackground ? e.clientY : (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2) * 550 + 550;
            worker.postMessage({ type: 'mouse', mouse: { x: mx, y: my } });
        };
        window.addEventListener('mousemove', mouseHandler);
        
        const observer = new MutationObserver(() => worker.postMessage({ type: 'theme', isDark: isDark() }));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        
        return { 
            type: 'worker', 
            worker, 
            cleanup: () => { 
                window.removeEventListener('mousemove', mouseHandler); 
                observer.disconnect();
                worker.terminate(); 
            } 
        };
    } else {
        // FALLBACK: Optimized Main Thread version (Last 10 years compatibility)
        const ctx = canvas.getContext('2d');
        let particles = [], startTime = Date.now();
        const cols = Math.ceil(canvas.width / config.lineDistance);
        const rows = Math.ceil(canvas.height / config.lineDistance);
        
        const frame = () => {
            const rgb = isDark() ? "255, 255, 255" : (isBackground ? "0, 0, 0" : "26, 26, 26");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const target = Math.floor(Math.min((Date.now() - startTime) / 3000, 1) * config.particleCount);
            
            while (particles.length < target) {
                particles.push({ 
                    id: particles.length, 
                    x: Math.random() * canvas.width, 
                    y: Math.random() * canvas.height, 
                    vx: (Math.random()-0.5)*(config.baseSpeed||0.8), 
                    vy: (Math.random()-0.5)*(config.baseSpeed||0.8) 
                });
            }
            
            const grid = Array.from({ length: cols * rows }, () => []);
            ctx.fillStyle = `rgba(${rgb}, ${isBackground ? 0.4 : 0.8})`;
            
            particles.forEach(p => {
                const dxM = p.x - mousePos.x, dyM = p.y - mousePos.y;
                const speedMult = (dxM*dxM + dyM*dyM) < MOUSE_INFLUENCE_DIST_SQ ? 1.96 : 1.0;
                p.x += p.vx * speedMult; 
                p.y += p.vy * speedMult;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1; 
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                ctx.fillRect((p.x - 1) | 0, (p.y - 1) | 0, config.particleSize || 2, config.particleSize || 2);
                const c = Math.floor(p.x / config.lineDistance), r = Math.floor(p.y / config.lineDistance);
                if (c >= 0 && c < cols && r >= 0 && r < rows) grid[c + r * cols].push(p);
            });
            
            const binCount = isBackground ? 6 : 11;
            const bins = Array.from({ length: binCount }, () => new Path2D());
            const dSqMax = config.lineDistance**2;
            
            particles.forEach(p1 => {
                const c = Math.floor(p1.x/config.lineDistance), r = Math.floor(p1.y/config.lineDistance);
                for(let i=-1; i<=1; i++) {
                    for(let j=-1; j<=1; j++) {
                        const nc=c+i, nr=r+j; 
                        if(nc>=0 && nc<cols && nr>=0 && nr<rows) {
                            grid[nc+nr*cols].forEach(p2 => {
                                if(p1.id >= p2.id) return;
                                const dx=p1.x-p2.x, dy=p1.y-p2.y, dSq=dx*dx+dy*dy;
                                if(dSq < dSqMax) {
                                    const alphaBin = Math.floor((1 - Math.sqrt(dSq)/config.lineDistance)*(binCount-1));
                                    bins[alphaBin].moveTo(p1.x|0, p1.y|0); 
                                    bins[alphaBin].lineTo(p2.x|0, p2.y|0);
                                }
                            });
                        }
                    }
                }
            });
            
            ctx.lineWidth = isBackground ? 1.2 : 0.8;
            for(let b=0; b<binCount; b++) { 
                ctx.strokeStyle = `rgba(${rgb}, ${isBackground ? config.lineOpacity : (b*8)/100})`; 
                ctx.stroke(bins[b]); 
            }
            handle.id = requestAnimationFrame(frame);
        };
        
        const mouseHandler = (e) => {
            mousePos.x = isBackground ? e.clientX : (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2) * 500 + 500;
            mousePos.y = isBackground ? e.clientY : (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2) * 550 + 550;
        };
        window.addEventListener('mousemove', mouseHandler);
        
        let handle = { id: requestAnimationFrame(frame) };
        return { 
            type: 'fallback', 
            cleanup: () => { 
                window.removeEventListener('mousemove', mouseHandler); 
                cancelAnimationFrame(handle.id); 
            } 
        };
    }
};

// --- Execution ---
let logoInstance;
window.restartPlexus = function() {
    if (logoInstance) logoInstance.cleanup();
    const canvas = document.getElementById('plexus-canvas');
    if (canvas) {
        canvas.width = 1000; 
        canvas.height = 1100;
        logoInstance = createPlexus(canvas, false, { 
            particleCount: window.innerWidth < 768 ? 0 : 500, 
            lineDistance: 145, 
            particleSize: 2 
        });
    }
};

document.addEventListener('alpine:init', () => {
    Alpine.data('plexusBackground', () => ({
        instance: null,
        init() {
            const canvas = this.$refs.canvas;
            canvas.width = window.innerWidth; 
            canvas.height = window.innerHeight;
            const isMobile = window.innerWidth < 768;
            this.instance = createPlexus(canvas, true, {
                particleCount: isMobile ? 25 : 120, 
                lineDistance: isMobile ? 250 : 221,
                particleSize: 1.59, 
                baseSpeed: 0.4, 
                lineOpacity: 0.2, 
                isBackground: true
            });
        },
        get darkMode() {
            return document.documentElement.classList.contains('dark');
        }
    }));
});

window.restartLogoAnimations = function() {
    const lg = document.querySelector('#logo-shape-definition.animate-logo'); 
    if (!lg) return;
    const lp = lg.querySelectorAll('path'), wv = document.querySelectorAll('.wave-echo');
    lp.forEach(p => { 
        p.style.animation = 'none'; 
        p.style.strokeDashoffset = '4000'; 
        p.style.fillOpacity = '0'; 
    });
    wv.forEach(w => { 
        w.style.animation = 'none'; 
        w.style.transform = 'scale(5)'; 
        w.style.opacity = '0'; 
    });
    void lg.offsetWidth;
    lp.forEach(p => p.style.animation = 'logoDraw 5s cubic-bezier(.75,.03,.46,.46) forwards');
    wv.forEach((w, i) => { 
        setTimeout(() => w.style.animation = 'implodingWave 3.5s cubic-bezier(0.19, 1, 0.22, 1) forwards', i * 100); 
    });
};

document.addEventListener('DOMContentLoaded', () => { 
    window.restartPlexus(); 
    setTimeout(window.restartLogoAnimations, 1); 
});

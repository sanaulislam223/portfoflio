const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const scoreCard = document.getElementById('score-card');
const shieldCard = document.getElementById('shield-card');
const modal = document.getElementById('modal');
const title = document.getElementById('title');
const subtitle = document.getElementById('subtitle');
const actionBtn = document.getElementById('action-btn');

const slowBtn = document.getElementById('slow-btn');
const fastBtn = document.getElementById('fast-btn');
const speedIndicator = document.getElementById('speed-indicator');

function resizeStage() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeStage();

let state = {
    running: false,
    score: 0,
    shield: 100,
    level: 1
};

const input = { ArrowLeft: false, ArrowRight: false };

const pilot = {
    x: 0,
    y: 0,
    w: 34,
    h: 34,
    speed: 5,
    reset: function() {
        this.x = canvas.width / 2 - this.w / 2;
        this.y = canvas.height - 70;
    }
};

let obstacles = [];
let stars = [];

// FPS Tracking Matrix
let lastTime = 0;
const fpsTarget = 60;
const fpsInterval = 1000 / fpsTarget;

function initStars() {
    stars = [];
    for(let i = 0; i < 40; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            v: Math.random() * 1.0 + 0.2
        });
    }
}

// --- DESKTOP CONTROLS (Keyboard listeners) ---
window.addEventListener('keydown', (e) => { if(e.key in input) input[e.key] = true; });
window.addEventListener('keyup', (e) => { if(e.key in input) input[e.key] = false; });
actionBtn.addEventListener('click', bootGame);

// --- MOBILE CONTROLS (Touch Drag Interface) ---
let isDragging = false;

// Ungli screen par rakhte hi coordinate calibrate hoga
canvas.addEventListener('touchstart', (e) => {
    if (!state.running) return;
    isDragging = true;
    handleTouchMove(e);
}, { passive: false });

// Drag gesture updates coordinate alignment vectors
canvas.addEventListener('touchmove', (e) => {
    if (!state.running || !isDragging) return;
    e.preventDefault(); // Mobile page bounce / scroll scroll off karne ke liye
    handleTouchMove(e);
}, { passive: false });

canvas.addEventListener('touchend', () => {
    isDragging = false;
});

function handleTouchMove(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    
    // Canvas coordinate space scale ratios calculation
    const relativeX = touch.clientX - rect.left;
    const scaleX = canvas.width / rect.width;
    const targetCanvasX = relativeX * scaleX;
    
    // Ship ko smooth movement dene ke liye touch ke center point par alignment map kiya
    let destinationX = targetCanvasX - pilot.w / 2;
    
    // Collision detection walls layout tracking boundaries
    if (destinationX < 0) destinationX = 0;
    if (destinationX > canvas.width - pilot.w) destinationX = canvas.width - pilot.w;
    
    pilot.x = destinationX;
}

// Speed configuration panels handlers
slowBtn.addEventListener('click', () => {
    if (pilot.speed > 1) {
        pilot.speed -= 1;
        speedIndicator.textContent = `SPEED: ${pilot.speed}`;
    }
});

fastBtn.addEventListener('click', () => {
    if (pilot.speed < 12) {
        pilot.speed += 1;
        speedIndicator.textContent = `SPEED: ${pilot.speed}`;
    }
});

function bootGame() {
    modal.classList.add('hidden');
    state.running = true;
    state.score = 0;
    state.shield = 100;
    state.level = 1;
    obstacles = [];
    scoreCard.textContent = "SCORE: 0000";
    shieldCard.textContent = "SHIELD: 100%";
    pilot.reset();
    initStars();
    
    lastTime = performance.now();
    runEngine(lastTime);
}

function triggerGameOver() {
    state.running = false;
    title.textContent = "MISSION FAILED";
    title.style.color = "#ff0055";
    title.style.textShadow = "0 0 10px #ff0055";
    subtitle.innerHTML = `Asteroids breached your hull.<br>Final Score: <strong>${state.score}</strong>`;
    actionBtn.textContent = "RETRY FLIGHT";
    modal.classList.remove('hidden');
}

function processPhysics() {
    stars.forEach(star => {
        star.y += star.v;
        if(star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });

    if (!state.running) return;

    state.score += 1;
    if(state.score % 10 === 0) {
        scoreCard.textContent = `SCORE: ${String(state.score).padStart(4, '0')}`;
    }

    state.level = 1 + Math.floor(state.score / 800);

    // Keyboard navigation fallbacks runtime tracking loops
    if (input.ArrowLeft && pilot.x > 0) pilot.x -= pilot.speed;
    if (input.ArrowRight && pilot.x < canvas.width - pilot.w) pilot.x += pilot.speed;

    const activeSpawnThrottle = Math.max(0.012, 0.015 + (state.level * 0.003));
    if (Math.random() < activeSpawnThrottle && obstacles.length < (6 + state.level)) {
        const radius = Math.random() * 14 + 10;
        obstacles.push({
            x: Math.random() * (canvas.width - radius * 2) + radius,
            y: -radius,
            r: radius,
            v: Math.random() * (1.5 + state.level * 0.3) + 1.5
        });
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.y += obs.v;

        if (obs.y - obs.r > canvas.height) {
            obstacles.splice(i, 1);
            continue;
        }

        const testX = Math.max(pilot.x, Math.min(obs.x, pilot.x + pilot.w));
        const testY = Math.max(pilot.y, Math.min(obs.y, pilot.y + pilot.h));
        const distance = Math.hypot(obs.x - testX, obs.y - testY);

        if (distance < obs.r) {
            obstacles.splice(i, 1);
            state.shield -= Math.floor(obs.r * 1.2);
            if (state.shield < 0) state.shield = 0;
            shieldCard.textContent = `SHIELD: ${state.shield}%`;

            if (state.shield <= 0) {
                triggerGameOver();
                break;
            }
        }
    }
}

function renderStage() {
    ctx.fillStyle = '#020208';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(pilot.x + pilot.w / 2, pilot.y);
    ctx.lineTo(pilot.x, pilot.y + pilot.h);
    ctx.lineTo(pilot.x + pilot.w, pilot.y + pilot.h);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.lineWidth = 2;
    obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
        ctx.stroke();
    });

    ctx.shadowBlur = 0;
}

function runEngine(currentTime) {
    if (state.running || !modal.classList.contains('hidden')) {
        requestAnimationFrame(runEngine);
    }

    const elapsed = currentTime - lastTime;

    if (elapsed > fpsInterval) {
        lastTime = currentTime - (elapsed % fpsInterval);
        processPhysics();
        renderStage();
    }
}

initStars();
renderStage();

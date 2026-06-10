const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreCard = document.getElementById('score-card');
const levelCard = document.getElementById('level-card');
const livesDisplay = document.getElementById('lives-display');
const modal = document.getElementById('modal');
const title = document.getElementById('title');
const subtitle = document.getElementById('subtitle');
const actionBtn = document.getElementById('action-btn');

canvas.width = 450;
canvas.height = 620;

let state = {
    running: false,
    score: 0,
    lives: 3,
    level: 1
};

const paddle = {
    w: 80,
    h: 12,
    x: canvas.width / 2 - 40,
    y: canvas.height - 40,
    color: '#00f0ff'
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    r: 7,
    dx: 4,
    dy: -4,
    color: '#ffff00'
};

const brickConfig = {
    rows: 4,
    cols: 6,
    w: 62,
    h: 18,
    padding: 7,
    offsetTop: 40,
    offsetLeft: 20
};

let bricks = [];

function createBrickGrid() {
    bricks = [];
    const rowColors = ['#ff007f', '#ff00ff', '#00f0ff', '#7fff00'];
    
    for (let c = 0; c < brickConfig.cols; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickConfig.rows; r++) {
            const brickX = (c * (brickConfig.w + brickConfig.padding)) + brickConfig.offsetLeft;
            const brickY = (r * (brickConfig.h + brickConfig.padding)) + brickConfig.offsetTop;
            bricks[c][r] = { x: brickX, y: brickY, status: 1, color: rowColors[r % rowColors.length] };
        }
    }
}

function handlePointerMove(clientX) {
    const rect = canvas.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const scaleX = canvas.width / rect.width;
    const pointerX = relativeX * scaleX;

    paddle.x = pointerX - paddle.w / 2;

    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x > canvas.width - paddle.w) paddle.x = canvas.width - paddle.w;
}

// Desktop Mouse Logic
window.addEventListener('mousemove', (e) => {
    if (!state.running) return;
    handlePointerMove(e.clientX);
});

// Mobile Touch Tracking (Array identifier mismatch safely handled via finger tracking)
canvas.addEventListener('touchmove', (e) => {
    if (!state.running) return;
    e.preventDefault();
    if (e.touches && e.touches.length > 0) {
        const finger = e.touches[0];
        handlePointerMove(finger.clientX); 
    }
}, { passive: false });

canvas.addEventListener('touchstart', (e) => {
    if (!state.running) return;
    e.preventDefault();
    if (e.touches && e.touches.length > 0) {
        const finger = e.touches[0];
        handlePointerMove(finger.clientX); 
    }
}, { passive: false });

actionBtn.addEventListener('click', () => {
    bootGame();
});

function bootGame() {
    modal.classList.add('hidden');
    state.score = 0;
    state.lives = 3;
    state.level = 1;
    brickConfig.rows = 4;
    
    scoreCard.textContent = "SCORE: 0000";
    levelCard.textContent = "STAGE: 1";
    updateLivesUI();
    
    resetBallAndPaddle();
    createBrickGrid();
    state.running = true;
    runEngine();
}

function updateLivesUI() {
    let hearts = '';
    for(let i = 0; i < state.lives; i++) hearts += '❤️';
    livesDisplay.textContent = `LIVES: ${hearts || '💀'}`;
}

function resetBallAndPaddle() {
    paddle.x = canvas.width / 2 - paddle.w / 2;
    ball.x = canvas.width / 2;
    ball.y = paddle.y - 15;
    ball.dx = (Math.random() > 0.5 ? 3 : -3) + (state.level * 0.5);
    ball.dy = -(4 + state.level);
}

function advanceStage() {
    state.level += 1;
    levelCard.textContent = `STAGE: ${state.level}`;
    brickConfig.rows = Math.min(6, brickConfig.rows + 1);
    resetBallAndPaddle();
    createBrickGrid();
}

function triggerGameOver(isWin = false) {
    state.running = false;
    modal.classList.remove('hidden');
    if (isWin) {
        title.textContent = "VICTORY ACHIEVED";
        title.style.color = "#7fff00";
        subtitle.innerHTML = `Excellent reflex protocols captain!<br>Final Arcade Score: <strong>${state.score}</strong>`;
        actionBtn.textContent = "PLAY AGAIN";
    } else {
        title.textContent = "GAME OVER";
        title.style.color = "#ff007f";
        subtitle.innerHTML = `Your defense shield dropped to zero.<br>Final Score: <strong>${state.score}</strong>`;
        actionBtn.textContent = "REDEPLOY SHUTTLE";
    }
}

function processCollisions() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.dx > canvas.width - ball.r || ball.x + ball.dx < ball.r) {
        ball.dx = -ball.dx;
    }
    if (ball.y + ball.dy < ball.r) {
        ball.dy = -ball.dy;
    }

    if (ball.y + ball.dy > paddle.y - ball.r && ball.y + ball.dy < paddle.y + paddle.h) {
        if (ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
            let hitPoint = ball.x - (paddle.x + paddle.w / 2);
            hitPoint = hitPoint / (paddle.w / 2);
            
            let angle = hitPoint * (Math.PI / 3);
            let currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);

            ball.dx = currentSpeed * Math.sin(angle);
            ball.dy = -currentSpeed * Math.cos(angle);
        }
    }

    if (ball.y + ball.dy > canvas.height) {
        state.lives -= 1;
        updateLivesUI();
        if (state.lives <= 0) {
            triggerGameOver(false);
            return;
        } else {
            resetBallAndPaddle();
        }
    }

    let dynamicTotalWinFlag = true;
    for (let c = 0; c < brickConfig.cols; c++) {
        for (let r = 0; r < brickConfig.rows; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                dynamicTotalWinFlag = false;
                
                if (ball.x > b.x - ball.r && ball.x < b.x + brickConfig.w + ball.r &&
                    ball.y > b.y - ball.r && ball.y < b.y + brickConfig.h + ball.r) {
                    
                    ball.dy = -ball.dy;
                    b.status = 0;
                    state.score += 25;
                    scoreCard.textContent = `SCORE: ${String(state.score).padStart(4, '0')}`;
                }
            }
        }
    }

    if (dynamicTotalWinFlag) {
        advanceStage();
    }
}

function renderGraphics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let c = 0; c < brickConfig.cols; c++) {
                for (let r = 0; r < brickConfig.rows; r++) {
                    let b = bricks[c][r];
                    if (b.status === 1) {
                        ctx.fillStyle = b.color;
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = b.color;
                        ctx.fillRect(b.x, b.y, brickConfig.w, brickConfig.h);
                    }
                }
            }

            ctx.fillStyle = paddle.color;
            ctx.shadowBlur = 12;
            ctx.shadowColor = paddle.color;
            ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            ctx.fillStyle = ball.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = ball.color;
            ctx.fill();
            ctx.closePath();

            ctx.shadowBlur = 0;
        }

        function runEngine() {
            if (!state.running) return;
            processCollisions();
            renderGraphics();
            requestAnimationFrame(runEngine);
        }

        createBrickGrid();
        renderGraphics();

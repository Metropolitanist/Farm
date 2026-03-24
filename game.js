let ga, vit, clicks, targetX, targetY, score;

// --- 1. HỆ THỐNG ÂM THANH (Web Audio API) ---
// Trình duyệt yêu cầu tương tác người dùng trước khi phát âm thanh
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, type, duration) {
    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) { console.log("Audio not allowed yet"); }
}

const sounds = {
    click: () => playSound(600, 'sine', 0.1),
    success: () => { 
        playSound(800, 'square', 0.1); 
        setTimeout(() => playSound(1000, 'square', 0.1), 100); 
    },
    fail: () => playSound(200, 'sawtooth', 0.3),
    win: () => { 
        [440, 554, 659, 880].forEach((f, i) => 
            setTimeout(() => playSound(f, 'sine', 0.4), i * 150)
        ); 
    }
};

// --- 2. QUẢN LÝ GIAO DIỆN ---
function showElement(id) { document.getElementById(id).classList.remove('hidden'); }
function hideElement(id) { document.getElementById(id).classList.add('hidden'); }

// Bắt đầu từ màn hình giới thiệu
window.startGame = function() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    sounds.click();
    hideElement('story-intro');
    showElement('phase1');
};

// Chơi lại (Bỏ qua giới thiệu)
window.restartGame = function() {
    sounds.click();
    score = 0;
    clicks = Math.floor(Math.random() * 4) + 3;
    generateProblem();

    hideElement('phase2');
    hideElement('final-stats');
    showElement('phase1');
    showElement('action-buttons');

    document.getElementById('inputX').value = '';
    document.getElementById('inputY').value = '';
    document.getElementById('p1-feedback').innerText = '';
    document.getElementById('game-log').innerText = "Vòng mới! Tính toán nhanh để bắt đầu. 🔪";
    document.getElementById('game-log').style.color = "#2d3436";
};

// Khởi tạo ban đầu
function initGame() {
    score = 0;
    clicks = Math.floor(Math.random() * 4) + 3;
    generateProblem();

    showElement('story-intro');
    hideElement('phase1');
    hideElement('phase2');
    hideElement('final-stats');
    showElement('action-buttons');
}

window.onload = initGame;

// --- 3. LOGIC TOÁN HỌC ---
function generateProblem() {
    targetX = Math.floor(Math.random() * 11) + 10;
    targetY = Math.floor(Math.random() * 11) + 10;
    const weights = [1, 1.5, 2, 2.5, 3, 4];
    let a = weights[Math.floor(Math.random() * 3)];
    let b = weights[Math.floor(Math.random() * 3) + 3];
    let totalW = (targetX * a) + (targetY * b);

    document.getElementById('problem-desc').innerHTML = 
        `Nhiệm vụ: Tổng <b>${targetX + targetY}</b> con. Nặng <b>${totalW.toFixed(1)}kg</b>. <br> Gà <b>${a}kg</b>, Vịt <b>${b}kg</b>.`;
    
    // Tỉ lệ con ngon ngẫu nhiên
    ga = { quality: Math.floor(targetX * (Math.random() * 0.4 + 0.3)), total: targetX };
    vit = { quality: Math.floor(targetY * (Math.random() * 0.4 + 0.3)), total: targetY };
}

function checkPhase1() {
    const x = parseInt(document.getElementById('inputX').value);
    const y = parseInt(document.getElementById('inputY').value);
    
    if (x === targetX && y === targetY) {
        sounds.success();
        hideElement('phase1');
        showElement('phase2');
        updateUI();
    } else {
        sounds.fail();
        const fb = document.getElementById('p1-feedback');
        fb.innerText = "❌ Sai rồi! Hãy kiểm tra lại hệ phương trình."; 
        fb.style.color = "#e74c3c";
    }
}

// --- 4. GIAI ĐOẠN THU HOẠCH ---
function slaughter(type) {
    if (clicks <= 0) return;
    let t = (type === 'ga') ? ga : vit;
    if (t.total <= 0) return;

    const log = document.getElementById('game-log');
    const container = document.querySelector('.container');

    if (Math.random() < (t.quality / t.total)) {
        score++; t.quality--;
        sounds.success();
        log.innerText = `✨ Tuyệt vời! Trúng con CHẤT LƯỢNG! 💎`;
        log.style.color = "#27ae60";
        // Hiệu ứng rung màn hình khi trúng
        container.style.animation = "successPop 0.3s ease";
        setTimeout(() => container.style.animation = "", 300);
    } else {
        sounds.click();
        log.innerText = `🍃 Con này bình thường quá...`;
        log.style.color = "#7f8c8d";
    }
    
    t.total--; 
    clicks--; 
    updateUI();
}

function updateUI() {
    document.getElementById('ga_stat').innerText = `${ga.quality}/${ga.total}`;
    document.getElementById('vit_stat').innerText = `${vit.quality}/${vit.total}`;
    document.getElementById('clicks').innerText = clicks;
    
    if (clicks === 0) {
        sounds.win();
        hideElement('action-buttons');
        showElement('final-stats');
        document.getElementById('final-score').innerText = score;
        document.getElementById('rank-text').innerText = score >= 3 ? "🌟 CHỦ TRẠI THÔNG THÁI!" : "🤠 CỐ GẮNG HƠN NHÉ!";
    }
}

// --- 5. HƯỚNG DẪN & LATEX ---
window.toggleHelp = function() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const modal = document.getElementById('help-modal');
    modal.classList.toggle('hidden');
    
    if (!modal.classList.contains('hidden') && window.MathJax) {
        window.MathJax.typesetPromise().catch((err) => console.log(err));
    }
};

// Đóng modal khi bấm ra ngoài
window.onclick = function(event) {
    const modal = document.getElementById('help-modal');
    if (event.target == modal) {
        modal.classList.add('hidden');
    }
};

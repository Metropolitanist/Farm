let ga, vit, clicks, targetX, targetY, score;
let audioCtx;

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(freq, type, duration) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

const sounds = {
    click: () => playSound(600, 'sine', 0.1),
    success: () => { playSound(800, 'square', 0.1); setTimeout(() => playSound(1000, 'square', 0.1), 100); },
    fail: () => playSound(200, 'sawtooth', 0.3),
    win: () => [440, 554, 659, 880].forEach((f, i) => setTimeout(() => playSound(f, 'sine', 0.4), i * 150))
};

window.startGame = function() {
    initAudio(); sounds.click();
    document.getElementById('story-intro').classList.add('hidden');
    document.getElementById('phase1').classList.remove('hidden');
};

window.restartGame = function() {
    sounds.click();
    score = 0;
    // Ngẫu nhiên số lượt mổ từ 3 đến 6 lượt để tạo độ khó khác nhau mỗi ván
    clicks = Math.floor(Math.random() * 4) + 3; 
    generateProblem();
    
    document.getElementById('phase2').classList.add('hidden');
    document.getElementById('final-stats').classList.add('hidden');
    document.getElementById('phase1').classList.remove('hidden');
    document.getElementById('p1-feedback').innerText = '';
    document.getElementById('inputX').value = '';
    document.getElementById('inputY').value = '';
    
    // Cập nhật hiển thị Kỷ lục vĩnh viễn trên Header nếu có
    if (typeof refreshPermanentHighScore === "function") refreshPermanentHighScore();
};

window.checkPhase1 = function() {
    const x = parseInt(document.getElementById('inputX').value);
    const y = parseInt(document.getElementById('inputY').value);
    if (x === targetX && y === targetY) {
        sounds.success();
        document.getElementById('phase1').classList.add('hidden');
        document.getElementById('phase2').classList.remove('hidden');
        updateUI();
    } else {
        sounds.fail();
        document.getElementById('p1-feedback').innerText = "❌ Sai rồi, hãy tính lại nhé!";
    }
};

window.slaughter = function(type) {
    if (clicks <= 0) return;
    let t = (type === 'ga') ? ga : vit;
    if (t.total <= 0) return;

    if (Math.random() < (t.quality / t.total)) {
        score++; t.quality--; sounds.success();
        document.getElementById('game-log').innerText = "✨ Trúng con CHẤT LƯỢNG! 💎";
    } else {
        sounds.click();
        document.getElementById('game-log').innerText = "🍃 Thường thôi, chưa đạt chuẩn...";
    }
    t.total--; clicks--; updateUI();
};

function generateProblem() {
    targetX = Math.floor(Math.random() * 10) + 10;
    targetY = Math.floor(Math.random() * 10) + 10;
    const wList = [1.5, 2, 2.5, 3];
    let a = wList[Math.floor(Math.random() * 2)];
    let b = wList[Math.floor(Math.random() * 2) + 2];
    let totalW = (targetX * a) + (targetY * b);

    document.getElementById('problem-desc').innerHTML = 
        `Tổng <b>${targetX + targetY}</b> con. Cân <b>${totalW.toFixed(1)}kg</b>.<br>Gà <b>${a}kg</b>, Vịt <b>${b}kg</b>.`;
    
    // NGẪU NHIÊN HÓA SỐ CON CHẤT LƯỢNG (Tỉ lệ từ 20% đến 70% mỗi đàn)
    // Điều này khiến người chơi phải quan sát kỹ "Tỉ lệ đạt chuẩn" trước khi quyết định mổ
    ga = { 
        quality: Math.floor(targetX * (Math.random() * 0.5 + 0.2)), 
        total: targetX 
    };
    vit = { 
        quality: Math.floor(targetY * (Math.random() * 0.5 + 0.2)), 
        total: targetY 
    };
}

function refreshPermanentHighScore() {
    const savedScore = localStorage.getItem('tdn_farm_highscore') || 0;
    const globalScoreElem = document.getElementById('global-high-score');
    if (globalScoreElem) {
        globalScoreElem.innerText = savedScore;
    }
}

// 2. Cập nhật logic trong updateUI
function updateUI() {
    // Hiển thị dạng phân số (Số con ngon hiện có / Tổng số con còn lại trong đàn)
    document.getElementById('ga_stat').innerText = `${ga.quality}/${ga.total}`;
    document.getElementById('vit_stat').innerText = `${vit.quality}/${vit.total}`;
    document.getElementById('clicks').innerText = clicks;

    if (clicks === 0) {
        sounds.win();
        
        // Logic lưu High Score
        let currentHighScore = parseInt(localStorage.getItem('tdn_farm_highscore')) || 0;
        if (score > currentHighScore) {
            currentHighScore = score;
            localStorage.setItem('tdn_farm_highscore', currentHighScore);
        }

        document.getElementById('final-stats').classList.remove('hidden');
        document.getElementById('final-score').innerText = score;
        document.getElementById('high-score').innerText = currentHighScore;
        
        // Phân cấp danh hiệu dựa trên điểm số
        let rank = "🤠 Cố gắng ván sau nhé!";
        if (score >= 5) rank = "🏆 Huyền thoại nông gia!";
        else if (score >= 3) rank = "🌟 Siêu cấp chủ trại!";
        
        document.getElementById('rank-text').innerText = rank;
    }
}
window.toggleHelp = function() {
    initAudio();
    const modal = document.getElementById('help-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden') && window.MathJax) window.MathJax.typesetPromise();
};

window.onload = () => { 
    generateProblem(); 
    clicks = 5; 
    score = 0; 
    refreshPermanentHighScore(); 
};

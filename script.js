let audioCtx;
let masterGain;
let instrumentType = 'harmonium';
const activeOscillators = {};

// Keyboard mapping (Piano Layout on QWERTY)
const keyToFreq = {
    'a': 261.63, 'w': 277.18, 's': 293.66, 'e': 311.13, 'd': 329.63,
    'f': 349.23, 't': 369.99, 'g': 392.00, 'y': 415.30, 'h': 440.00,
    'u': 466.16, 'j': 493.88, 'k': 523.25
};

// Kinetic Tracking Variables
let lastMouseX = 0;
let lastMouseY = 0;
let kineticEnergy = 0; // Represents the "air" in the bellows
const orb = document.getElementById('glow-orb');

// Initialize Audio (Browsers require a user click before making sound)
document.getElementById('start-audio').addEventListener('click', function() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0; // Start silent (no air)
        masterGain.connect(audioCtx.destination);
        this.innerText = "Audio Enabled - Start Playing!";
        this.style.backgroundColor = "#6b1524";
        this.style.color = "white";
        kineticLoop(); // Start tracking physics
    }
});

// Instrument Toggle
document.getElementById('btn-harmonium').addEventListener('click', (e) => {
    instrumentType = 'harmonium';
    e.target.classList.add('active');
    document.getElementById('btn-violin').classList.remove('active');
});

document.getElementById('btn-violin').addEventListener('click', (e) => {
    instrumentType = 'violin';
    e.target.classList.add('active');
    document.getElementById('btn-harmonium').classList.remove('active');
});

// Key Press (Note On)
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keyToFreq[key] && !activeOscillators[key] && audioCtx) {
        const osc = audioCtx.createOscillator();
        // Harmonium uses sawtooth (buzzy), Violin uses triangle (smooth)
        osc.type = instrumentType === 'harmonium' ? 'sawtooth' : 'triangle'; 
        osc.frequency.setValueAtTime(keyToFreq[key], audioCtx.currentTime);
        osc.connect(masterGain);
        osc.start();
        activeOscillators[key] = osc;
    }
});

// Key Release (Note Off)
window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (activeOscillators[key]) {
        activeOscillators[key].stop();
        activeOscillators[key].disconnect();
        delete activeOscillators[key];
    }
});

// Track Mouse Movement (The Bellows/Bow)
window.addEventListener('mousemove', (e) => {
    if (!audioCtx) return;
    
    // Calculate how fast the mouse moved
    const deltaX = e.movementX;
    const deltaY = e.movementY;
    const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Add to kinetic energy (cap it so it doesn't get too loud)
    kineticEnergy += speed * 0.05; 
    if (kineticEnergy > 1.0) kineticEnergy = 1.0;
});

// The Physics Loop
function kineticLoop() {
    // Decay the energy constantly (like air leaking out)
    kineticEnergy *= 0.90; 
    
    // Smoothly apply energy to the master volume
    if (masterGain) {
        // Linear ramp prevents clicking sounds when volume changes rapidly
        masterGain.gain.setTargetAtTime(kineticEnergy, audioCtx.currentTime, 0.05);
    }

    // Update Visuals (The glowing orb)
    const glowSize = kineticEnergy * 100;
    const scale = 1 + (kineticEnergy * 2);
    orb.style.boxShadow = `0 0 ${glowSize}px ${glowSize/2}px rgba(107, 21, 36, ${kineticEnergy})`;
    orb.style.transform = `scale(${scale})`;

    // Run this loop 60 times a second
    requestAnimationFrame(kineticLoop);
}

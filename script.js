const DURATION = 25 * 60; // seconds

const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");
const progressEl = document.getElementById("progress");
const card = document.querySelector(".card");

const circumference = 2 * Math.PI * progressEl.r.baseVal.value;
progressEl.style.strokeDasharray = circumference;

let remaining = DURATION;
let endTime = null;
let intervalId = null;
let audioCtx = null;

function format(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function render() {
  timeEl.textContent = format(remaining);
  document.title = `${format(remaining)} · Pomodoro`;
  progressEl.style.strokeDashoffset = circumference * (1 - remaining / DURATION);
}

// Timestamp-based so the countdown stays accurate when the tab is in the background.
function tick() {
  remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
  render();
  if (remaining === 0) finish();
}

function start() {
  // Create the audio context on a user gesture so browsers allow playback later.
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (remaining === 0) remaining = DURATION;
  card.classList.remove("done");
  endTime = Date.now() + remaining * 1000;
  intervalId = setInterval(tick, 250);
  startBtn.textContent = "Pause";
  statusEl.textContent = "Stay focused.";
}

function pause() {
  clearInterval(intervalId);
  intervalId = null;
  startBtn.textContent = "Resume";
  statusEl.textContent = "Paused.";
}

function reset() {
  clearInterval(intervalId);
  intervalId = null;
  remaining = DURATION;
  card.classList.remove("done");
  startBtn.textContent = "Start";
  statusEl.textContent = "Ready when you are.";
  render();
}

function finish() {
  clearInterval(intervalId);
  intervalId = null;
  startBtn.textContent = "Start";
  statusEl.textContent = "Time's up! Take a break.";
  card.classList.add("done");
  playChime();
}

// Three-note chime synthesized with the Web Audio API — no audio file needed.
function playChime() {
  if (!audioCtx) return;
  const notes = [880, 1108.73, 1318.51];
  for (let round = 0; round < 2; round++) {
    notes.forEach((freq, i) => {
      const t = audioCtx.currentTime + round * 1.2 + i * 0.18;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 1);
    });
  }
}

startBtn.addEventListener("click", () => (intervalId ? pause() : start()));
resetBtn.addEventListener("click", reset);

render();

const DEFAULT_MINUTES = 25;

const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");
const progressEl = document.getElementById("progress");
const minutesInput = document.getElementById("minutesInput");
const card = document.querySelector(".card");

const circumference = 2 * Math.PI * progressEl.r.baseVal.value;
progressEl.style.strokeDasharray = circumference;

let duration = DEFAULT_MINUTES * 60; // seconds
let remaining = duration;
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
  progressEl.style.strokeDashoffset = circumference * (1 - remaining / duration);
}

// Reads the minutes field, clamps it to 1–180, and resets the countdown to it.
function applyMinutes() {
  let minutes = parseInt(minutesInput.value, 10);
  if (Number.isNaN(minutes)) minutes = DEFAULT_MINUTES;
  minutes = Math.min(180, Math.max(1, minutes));
  minutesInput.value = minutes;
  duration = minutes * 60;
  remaining = duration;
  card.classList.remove("done");
  render();
}

// Timestamp-based so the countdown stays accurate when the tab is in the background.
function tick() {
  remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
  render();
  if (remaining === 0) finish();
}

function start() {
  // Create/unlock the audio context on a user gesture so browsers allow playback later.
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (remaining === 0) remaining = duration;
  card.classList.remove("done");
  endTime = Date.now() + remaining * 1000;
  intervalId = setInterval(tick, 250);
  minutesInput.disabled = true;
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
  minutesInput.disabled = false;
  startBtn.textContent = "Start";
  statusEl.textContent = "Ready when you are.";
  applyMinutes();
}

function finish() {
  clearInterval(intervalId);
  intervalId = null;
  minutesInput.disabled = false;
  startBtn.textContent = "Start";
  statusEl.textContent = "Time's up! Take a break.";
  card.classList.add("done");
  playChime();
}

// Bell-like chime synthesized with the Web Audio API — no audio file needed.
function playChime() {
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume();
  const notes = [880, 1108.73, 1318.51, 1760];
  for (let round = 0; round < 3; round++) {
    notes.forEach((freq, i) => {
      const t = audioCtx.currentTime + 0.05 + round * 1.4 + i * 0.16;
      // A soft overtone on top of each note gives it a bell-like ring.
      [[freq, 0.35], [freq * 2, 0.08]].forEach(([f, peak]) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(peak, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 1.3);
      });
    });
  }
}

startBtn.addEventListener("click", () => (intervalId ? pause() : start()));
resetBtn.addEventListener("click", reset);
minutesInput.addEventListener("change", () => {
  if (!intervalId) reset();
});

render();

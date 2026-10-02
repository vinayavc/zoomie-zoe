// Web Audio: one shared context, unlocked by a user gesture.
// Phase 2 only needs a rising-pitch blip (plus a low version for hits).

import { CONFIG } from '../config.js';

let ctx = null;
let master = null;

// Call this from inside pointer/key/touch handlers. Safe to call often.
export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = CONFIG.MASTER_VOLUME;
      master.connect(ctx.destination);
    }
    if (ctx.state !== 'running') {
      const p = ctx.resume();
      if (p && p.catch) p.catch(() => {});
      // A silent one-sample buffer helps older iOS Safari wake up.
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(master);
      src.start(0);
    }
  } catch {
    // no audio available; the game still works
  }
}

function tone(type, startHz, endHz, duration, peak) {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startHz, t);
  osc.frequency.exponentialRampToValueAtTime(endHz, t + duration);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

// Loop-capture blip; pitch rises with each chained loop.
export function blip(chain) {
  const step = Math.min(chain, CONFIG.BLIP_MAX_CHAIN) - 1;
  const hz = CONFIG.BLIP_BASE_HZ * Math.pow(2, (step * CONFIG.BLIP_SEMITONES_PER_CHAIN) / 12);
  const detune = 1 + (Math.random() - 0.5) * 0.02;
  tone('triangle', hz * detune, hz * 1.5 * detune, CONFIG.BLIP_TIME, 0.6);
}

// Low dull blip for "ouch" (stunned) and "snap" (leash cut).
export function bonk() {
  tone('sine', 180, 70, 0.16, 0.7);
}

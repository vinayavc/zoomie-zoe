// Web Audio: one shared context, unlocked by a user gesture, plus every
// sound effect in the game. No audio files: each sound is a few oscillators
// and/or a noise burst, through a filter, shaped by a gain envelope.
//
// Envelope rule (no clicks): every gain starts at SILENT, ramps up, and ramps
// back to SILENT before its source stops. Every sound's nodes are
// disconnected when its last source ends (no node leaks).
//
// Press M anywhere to mute/unmute (saved). Audition sounds from the console:
// doxie.sfx.yip(), doxie.sfx.caught(3, 5), doxie.sfx.sigh() ...

import { CONFIG } from '../config.js';
import { getMuted, setMuted } from './storage.js';

const SILENT = 0.0001;   // exponential ramps can't reach 0; this is -80 dB
const TICK_FROM = 10;    // countdown ticks during the last N seconds
const MAX_POPS = 6;      // a huge loop still plays at most this many pops

let ctx = null;
let master = null;       // master volume + mute
let noiseBuf = null;     // 1 s of white noise, shared by every noisy sound
let muted = false;
let muteTouched = false; // the player pressed M before the saved value loaded
let resumeAskedAt = -1e9;

getMuted().then((m) => {
  if (muteTouched) return;
  muted = m;
  applyMute();
});

// ---------------------------------------------------------------- context

// Call this from inside pointer/key/touch handlers. Safe to call often.
export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      // A gentle compressor so stacked sounds (pops + arf + squeak) never clip.
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      comp.attack.value = 0.003;
      comp.release.value = 0.15;
      master = ctx.createGain();
      master.gain.value = muted ? 0 : CONFIG.MASTER_VOLUME;
      master.connect(comp);
      comp.connect(ctx.destination);
      noiseBuf = makeNoise();
    }
    // 'suspended' (autoplay) or 'interrupted' (iOS call / app switch).
    if (ctx.state !== 'running' && ctx.state !== 'closed') {
      resumeAskedAt = performance.now();
      const p = ctx.resume();
      if (p && p.catch) p.catch(() => {});
      // A silent one-sample buffer helps older iOS Safari wake up.
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(master);
      src.onended = () => src.disconnect();
      src.start(0);
    }
  } catch {
    // no audio available; the game still works
  }
}

// Hidden: suspend (saves battery, nothing plays in the background).
// Visible: try to resume; if the browser refuses, the next tap/key does it.
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  try {
    if (document.visibilityState === 'hidden') {
      if (ctx.state === 'running') ctx.suspend().catch(() => {});
    } else if (ctx.state !== 'running' && ctx.state !== 'closed') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // ignore
  }
});

// Any key is a gesture too (arrow keys don't go through main.js's unlock).
// M toggles mute.
window.addEventListener('keydown', (e) => {
  unlockAudio();
  if (e.code === 'KeyM' && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) toggleMute();
});

// ---------------------------------------------------------------- mute

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  muteTouched = true;
  applyMute();
  setMuted(muted);
  return muted;
}

function applyMute() {
  if (!master) return;
  // A 15 ms glide instead of a jump, so muting mid-sound doesn't click.
  master.gain.setTargetAtTime(muted ? 0 : CONFIG.MASTER_VOLUME, ctx.currentTime, 0.015);
}

// ---------------------------------------------------------------- helpers

// Play only when the context runs (or is just resuming from a tap, so the
// very first "yip" isn't lost). Never queue sounds into a long-suspended context.
function ready() {
  if (!ctx || muted) return false;
  if (ctx.state === 'running') return true;
  return ctx.state === 'suspended' && performance.now() - resumeAskedAt < 400;
}

function now() {
  return ctx.currentTime + 0.005;
}

const rnd = (amt) => 1 + (Math.random() - 0.5) * amt; // small random detune
const semis = (n) => Math.pow(2, n / 12);

function makeNoise() {
  const len = ctx.sampleRate;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// A kit collects one sound's nodes; when its last source ends, all are disconnected.
function kit() {
  const nodes = [];
  let last = -1;
  let lastSrc = null;
  return {
    add(n) {
      nodes.push(n);
      return n;
    },
    run(src, t, end, offset = 0) {
      nodes.push(src);
      src.start(t, offset);
      src.stop(end + 0.02);
      if (end >= last) {
        last = end;
        lastSrc = src;
      }
      return src;
    },
    done() {
      if (!lastSrc) return;
      lastSrc.onended = () => {
        for (const n of nodes) {
          try { n.disconnect(); } catch { /* already gone */ }
        }
      };
    },
  };
}

// Automate a param along [[value, secondsAfterT], ...] with exponential ramps.
function sweep(param, t, curve) {
  param.setValueAtTime(curve[0][0], t);
  for (let i = 1; i < curve.length; i++) param.exponentialRampToValueAtTime(curve[i][0], t + curve[i][1]);
}

// Gain envelope: SILENT -> peak in `attack` -> SILENT at `end`.
function env(k, t, attack, peak, end, dest) {
  const g = k.add(ctx.createGain());
  g.gain.setValueAtTime(SILENT, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(SILENT, end);
  g.connect(dest);
  return g;
}

function filter(k, type, hz, q, dest) {
  const f = k.add(ctx.createBiquadFilter());
  f.type = type;
  f.frequency.value = hz;
  f.Q.value = q;
  f.connect(dest);
  return f;
}

// One oscillator with a pitch curve and its own envelope.
function voice(k, type, t, dur, peak, curve, dest = master, attack = 0.006) {
  const end = t + dur;
  const g = env(k, t, attack, peak, end, dest);
  const o = ctx.createOscillator();
  o.type = type;
  sweep(o.frequency, t, curve);
  o.connect(g);
  k.run(o, t, end);
  return o;
}

// Filtered white noise with a filter sweep f0 -> f1 and its own envelope.
function hiss(k, t, dur, peak, type, f0, f1, q, dest = master, attack = 0.01) {
  const end = t + dur;
  const g = env(k, t, attack, peak, end, dest);
  const f = filter(k, type, f0, q, g);
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, end);
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  s.connect(f);
  k.run(s, t, end, Math.random() * 0.8);
}

// A sine LFO added onto one or more params (vibrato, grumble).
function lfo(k, t, end, rate, depth, params) {
  const o = ctx.createOscillator();
  o.frequency.value = rate;
  const d = k.add(ctx.createGain());
  d.gain.value = depth;
  o.connect(d);
  for (const p of params) d.connect(p);
  k.run(o, t, end);
}

// Wrap a sound so it never throws and always cleans up.
function sound(fn) {
  return (...args) => {
    if (!ready()) return;
    try {
      const k = kit();
      fn(k, now(), ...args);
      k.done();
    } catch {
      // a failed sound must never break the game
    }
  };
}

// ---------------------------------------------------------------- sounds

// Round start: a happy two-note "yip-yip". ~0.25 s
const yip = sound((k, t0) => {
  const d = rnd(0.05);
  const lp = filter(k, 'lowpass', 2600, 0.7, master);
  [[0, 1], [0.13, 1.12]].forEach(([off, up]) => {
    const t = t0 + off;
    const c = [[700 * up * d, 0], [1150 * up * d, 0.035], [820 * up * d, 0.11]];
    voice(k, 'triangle', t, 0.11, 0.45, c, lp, 0.008);
    voice(k, 'square', t, 0.09, 0.07, c, lp, 0.008);
  });
});

// Cinch: a rope whoosh, then a small snap. ~0.2 s
const cinch = sound((k, t) => {
  hiss(k, t, 0.17, 0.32, 'bandpass', 350 * rnd(0.1), 2600, 1.2, master, 0.06);
  const s = t + 0.14;
  hiss(k, s, 0.035, 0.35, 'highpass', 2200, 1500, 0.7, master, 0.002);
  voice(k, 'sine', s, 0.06, 0.28, [[1400 * rnd(0.04), 0], [350, 0.05]], master, 0.002);
});

// One caught item: a soft pop. Pitch climbs with the chain and with each
// item in the same loop (capped so it never gets shrill). ~0.09 s
const pop = sound((k, t, chain = 1, i = 0, delay = 0) => {
  const step = Math.min(chain, CONFIG.BLIP_MAX_CHAIN) - 1;
  const st = Math.min(step * CONFIG.BLIP_SEMITONES_PER_CHAIN + i * 2, 19);
  const hz = CONFIG.BLIP_BASE_HZ * semis(st) * rnd(0.02);
  const s = t + delay;
  voice(k, 'sine', s, 0.09, 0.45, [[hz * 1.5, 0], [hz, 0.03], [hz * 0.9, 0.09]], master, 0.004);
  voice(k, 'triangle', s, 0.05, 0.08, [[hz * 2, 0], [hz * 1.6, 0.05]], master, 0.004);
});

// A little "arf!" bark. ~0.17 s
const arf = sound((k, t, delay = 0) => {
  const s = t + delay;
  const d = rnd(0.06);
  const lp = filter(k, 'lowpass', 1700, 1.2, master);
  const c = [[420 * d, 0], [610 * d, 0.03], [480 * d, 0.08], [320 * d, 0.16]];
  voice(k, 'sawtooth', s, 0.16, 0.4, c, lp, 0.01);
  voice(k, 'triangle', s, 0.16, 0.25, c, master, 0.01);
  hiss(k, s, 0.06, 0.14, 'bandpass', 1500, 1000, 1, master, 0.004);
});

// Items caught by one loop: one pop per item (staggered, rising), and an
// "arf!" on top for a big catch (4+). Up to ~0.55 s
function caught(chain = 1, n = 1) {
  const m = Math.min(n, MAX_POPS);
  for (let i = 0; i < m; i++) pop(chain, i, i * 0.055);
  if (n >= 4) arf(m * 0.055 + 0.04);
}

// Dog bump: a bonk, then a grumbly low "boof". ~0.33 s
const boof = sound((k, t) => {
  voice(k, 'sine', t, 0.14, 0.5, [[320, 0], [120, 0.12]], master, 0.003);
  voice(k, 'triangle', t, 0.06, 0.1, [[640, 0], [240, 0.06]], master, 0.003);
  const s = t + 0.07;
  const d = rnd(0.06);
  // grumble: amplitude wobble at ~32 Hz
  const am = k.add(ctx.createGain());
  am.gain.value = 0.6;
  am.connect(master);
  const lp = filter(k, 'lowpass', 650, 2, am);
  voice(k, 'sawtooth', s, 0.26, 0.55, [[150 * d, 0], [210 * d, 0.04], [170 * d, 0.12], [110 * d, 0.24]], lp, 0.02);
  lfo(k, s, s + 0.26, 32, 0.4, [am.gain]);
  hiss(k, s, 0.08, 0.1, 'lowpass', 600, 300, 0.7, master, 0.01);
});

// Leash snapped: a wobbly string twang. ~0.42 s
const twang = sound((k, t) => {
  hiss(k, t, 0.025, 0.18, 'highpass', 2500, 2000, 0.7, master, 0.002);
  const d = rnd(0.05);
  const lp = k.add(ctx.createBiquadFilter());
  lp.type = 'lowpass';
  lp.Q.value = 3;
  lp.connect(master);
  sweep(lp.frequency, t, [[3200, 0], [500, 0.4]]);
  const c = [[262 * d, 0], [200 * d, 0.4]];
  const a = voice(k, 'triangle', t, 0.42, 0.42, c, lp, 0.003);
  const b = voice(k, 'sawtooth', t, 0.42, 0.12, c, lp, 0.003);
  lfo(k, t, t + 0.42, 7, 8, [a.frequency, b.frequency]);
});

// Cheese: a squeaky-toy "squee-eek". ~0.37 s (starts just after the pop)
const squeak = sound((k, t0) => {
  const t = t0 + 0.06;
  const d = rnd(0.04);
  const a = voice(k, 'sine', t, 0.2, 0.32, [[900 * d, 0], [1750 * d, 0.07], [1350 * d, 0.2]], master, 0.01);
  lfo(k, t, t + 0.2, 28, 60, [a.frequency]);
  hiss(k, t, 0.18, 0.05, 'bandpass', 2000, 2400, 3, master, 0.02);
  const t2 = t + 0.22;
  const b = voice(k, 'sine', t2, 0.11, 0.26, [[1100 * d, 0], [1500 * d, 0.05], [1200 * d, 0.11]], master, 0.008);
  lfo(k, t2, t2 + 0.11, 28, 50, [b.frequency]);
});

// Countdown: a soft woodblock tick, a touch higher in the last 3 s. ~0.05 s
const tick = sound((k, t, secondsLeft = 10) => {
  const hz = secondsLeft <= 3 ? 1500 : 1150;
  voice(k, 'sine', t, 0.05, 0.22, [[hz, 0], [hz * 0.8, 0.04]], master, 0.002);
  voice(k, 'triangle', t, 0.02, 0.04, [[hz * 2.7, 0], [hz * 2.4, 0.02]], master, 0.002);
});

// Called every game step: ticks once as the clock crosses each of the last
// TICK_FROM whole seconds (10, 9 ... 1). Silent at 0: the sigh covers that.
function countdown(timeLeft, dt) {
  if (timeLeft <= 0 || timeLeft > TICK_FROM) return;
  const sec = Math.ceil(timeLeft);
  if (sec < Math.ceil(timeLeft + dt)) sfx.tick(sec);
}

// Round over: a sleepy yawn-sigh, "aah-ooo". ~1 s
const sigh = sound((k, t) => {
  const d = rnd(0.04);
  const vowel = k.add(ctx.createBiquadFilter());
  vowel.type = 'lowpass';
  vowel.Q.value = 3;
  vowel.connect(master);
  sweep(vowel.frequency, t, [[700, 0], [1500, 0.3], [450, 0.95]]);
  const c = [[330 * d, 0], [440 * d, 0.25], [400 * d, 0.45], [220 * d, 0.95]];
  const a = voice(k, 'sawtooth', t, 1.0, 0.22, c, vowel, 0.12);
  const b = voice(k, 'triangle', t, 1.0, 0.12, c, master, 0.12);
  lfo(k, t, t + 1.0, 5, 4, [a.frequency, b.frequency]);
  hiss(k, t, 0.9, 0.07, 'bandpass', 900, 500, 0.8, master, 0.2);
});

// For debugging from the console: doxie.sfx.state() -> 'running' | 'suspended' | 'interrupted' | 'none'
const state = () => (ctx ? ctx.state : 'none');

export const sfx = { yip, cinch, pop, arf, caught, boof, twang, squeak, tick, countdown, sigh, isMuted, toggleMute, state };

// Console audition hook: doxie.sfx.<name>() (main.js merges into this object).
(globalThis.doxie ||= {}).sfx = sfx;

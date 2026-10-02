// Fits the fixed 400x600 arena into whatever space is available,
// letterboxed and centered, with a sharp backing store (DPR capped).

import { CONFIG } from '../config.js';

export class View {
  constructor(canvas, stage) {
    this.canvas = canvas;
    this.stage = stage;
    this.k = 1; // backing-store pixels per arena pixel
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    if ('ResizeObserver' in window) new ResizeObserver(this.resize).observe(stage);
    this.resize();
  }

  resize() {
    const W = CONFIG.ARENA_W, H = CONFIG.ARENA_H;
    const r = this.stage.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const s = Math.min(r.width / W, r.height / H);
    const cssW = Math.floor(W * s), cssH = Math.floor(H * s);
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.MAX_DPR);
    const pxW = Math.round(cssW * dpr), pxH = Math.round(cssH * dpr);
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    if (this.canvas.width !== pxW || this.canvas.height !== pxH) {
      this.canvas.width = pxW;
      this.canvas.height = pxH;
    }
    this.k = pxW / W;
  }

  // Screen (client) coordinates -> arena coordinates. May fall outside the arena.
  toArena(clientX, clientY, out) {
    const r = this.canvas.getBoundingClientRect();
    out.x = ((clientX - r.left) * CONFIG.ARENA_W) / (r.width || 1);
    out.y = ((clientY - r.top) * CONFIG.ARENA_H) / (r.height || 1);
    return out;
  }
}

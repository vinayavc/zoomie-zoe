// Fills the screen with the canvas and fits the fixed 400 x 600 arena inside
// it (plus the HUD and touch bands when they fit: see fitFrame in layout.js),
// with a sharp backing store (DPR capped).

import { CONFIG } from '../config.js';
import { FRAME, fitFrame } from './layout.js';
import { isExtension, isTouchDevice } from './platform.js';

export class View {
  constructor(canvas, stage) {
    this.canvas = canvas;
    this.stage = stage;
    this.k = 1;          // backing-store pixels per arena pixel
    this.ox = 0;         // arena origin in backing-store pixels
    this.oy = 0;
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    if ('ResizeObserver' in window) new ResizeObserver(this.resize).observe(stage);
    this.resize();
  }

  resize() {
    const r = this.stage.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const cssW = Math.floor(r.width), cssH = Math.floor(r.height);
    const F = fitFrame(cssW, cssH, isTouchDevice(), isExtension);
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.MAX_DPR);
    const pxW = Math.round(cssW * dpr), pxH = Math.round(cssH * dpr);
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    if (this.canvas.width !== pxW || this.canvas.height !== pxH) {
      this.canvas.width = pxW;
      this.canvas.height = pxH;
    }
    this.k = F.scale * dpr;
    this.ox = Math.round(F.ox * dpr);
    this.oy = Math.round(F.oy * dpr);
  }

  // Screen (client) coordinates -> arena coordinates. May fall outside the arena.
  toArena(clientX, clientY, out) {
    const r = this.canvas.getBoundingClientRect();
    out.x = (clientX - r.left - FRAME.ox) / FRAME.scale;
    out.y = (clientY - r.top - FRAME.oy) / FRAME.scale;
    return out;
  }
}

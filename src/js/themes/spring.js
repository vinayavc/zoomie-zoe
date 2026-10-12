// Theme: Spring, "Spring Garden".
// PLACEHOLDER from T1: a Bedroom recolor plus tiny stand-in costume, icon and
// sound twist, so the picker works end to end. The T2 artist replaces all of
// this (see README.md and the themes table in docs/phase-4-themes-pwa-plan.md).

export default {
  id: 'spring',
  name: 'Spring Garden',
  chip: { color: '#B6D494', ink: '#3E6E3A' },
  letterbox: '#3f5a3a',
  palette: {
    bed: '#9CC07A', bedDeep: '#86AE66', bedTone1: '#A8CC88', bedTone2: '#7AA25A', bedTone3: '#B4CC8C',
    vignette: '50,80,40',
    indigo: '#3E6E3A', teal: '#E6A0B8', pink: '#F2E27A', sun: '#FFF6D0',
    sherpa: '#5E8E46', sherpaDark: '#3E6A2E', sherpaLight: '#8CBC6A',
    sock: '#E66A8A', sockStripe: '#FFE07A', shoe: '#E8822E', shoeDark: '#B85A1A', sole: '#6EA84A',
    ball: '#9CD4E0', ballDark: '#6AAAC0', ballSeam: '#FFFFFF',
    water: '#A8C8E0', waterDeep: '#7AA2C4',
    dog: '#D8CBB8', dogDark: '#B0A08A', dogLight: '#F4EEE4', dog2: '#C8B8A0', dog2Dark: '#9E8C74',
    dogInk: '#5A4A3A', dogEye: '#3A2A20',
  },
  critterMotion: 'hop',

  costume: {
    // stand-in flower crown: little dots round the top of her head
    head(ctx) {
      const colors = ['#E66A8A', '#FFE07A', '#FFFFFF', '#B58AD8'];
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * 0.55 + (i / 6) * Math.PI * 0.9;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath(); ctx.arc(-1 + Math.cos(a) * 7.5, Math.sin(a) * 7.5 * (i < 4 ? 1 : 1), 1.7, 0, Math.PI * 2); ctx.fill();
      }
    },
  },

  drawChipIcon(g) {
    // stand-in daisy
    g.fillStyle = '#FFFFFF';
    g.strokeStyle = '#6B4A2F';
    g.lineWidth = 0.9;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.beginPath(); g.ellipse(Math.cos(a) * 6, Math.sin(a) * 6, 4, 2.6, a, 0, Math.PI * 2); g.fill(); g.stroke();
    }
    g.fillStyle = '#F2C14E';
    g.beginPath(); g.arc(0, 0, 3.6, 0, Math.PI * 2); g.fill(); g.stroke();
  },

  sfx: {
    catchLayer(a, t) {                  // stand-in birdsong chirp
      a.voice('sine', t + 0.05, 0.08, 0.14, [[2400, 0], [3600, 0.07]], a.out, 0.004);
      a.voice('sine', t + 0.15, 0.08, 0.12, [[2600, 0], [3900, 0.07]], a.out, 0.004);
    },
  },

  words: { hide: 'Bushes', hideTip: 'hide in one: bunnies lose you', hazard: 'Puddle', hazardTip: 'dodge it, or your leash gets soggy', critters: 'Bunnies', critterTip: 'a bump makes Zoe dizzy, and a' },
};

// Theme: Christmas, "Cozy Christmas".
// PLACEHOLDER from T1: a Bedroom recolor plus tiny stand-in costume, icon and
// sound twist, so the picker works end to end. The T2 artist replaces all of
// this (see README.md and the themes table in docs/phase-4-themes-pwa-plan.md).

export default {
  id: 'christmas',
  name: 'Cozy Christmas',
  chip: { color: '#A8423C', ink: '#F2D27A' },
  letterbox: '#4a2e2a',
  palette: {
    bed: '#B5776A', bedDeep: '#9E5F54', bedTone1: '#C48B78', bedTone2: '#8C5248', bedTone3: '#B9806C',
    vignette: '70,40,30',
    indigo: '#2F5A3A', teal: '#2F6B45', pink: '#D9A06A', sun: '#FFE6B0',
    sherpa: '#A8423C', sherpaDark: '#6E2622', sherpaLight: '#D8C8A8',
    sock: '#C8323C', sockStripe: '#F2D27A', shoe: '#2F6B45', shoeDark: '#1F4A2F', sole: '#E8C060',
    ball: '#D9B84A', ballDark: '#A8862A',
    water: '#E4EEF4', waterDeep: '#B8CCD8',
    dog: '#8A6A55', dogDark: '#5E4536', dogLight: '#B89A82', dog2: '#9C7C64', dog2Dark: '#6A4E3C',
  },

  costume: {
    hideCollar: true,
    // stand-in sweater: a red band across her back
    body(ctx, z) {
      ctx.strokeStyle = 'rgba(200,50,60,0.85)';
      ctx.lineWidth = z.jw[3] * 1.7;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(z.jx[1], z.jy[1]);
      for (let i = 2; i <= 6; i++) ctx.lineTo(z.jx[i], z.jy[i]);
      ctx.stroke();
      ctx.lineCap = 'round';
    },
  },

  drawChipIcon(g) {
    // stand-in tree
    g.fillStyle = '#2F6B45';
    g.strokeStyle = '#1F3A2A';
    g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, -11); g.lineTo(9, 7); g.lineTo(-9, 7); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#F2D27A';
    g.fillRect(-1.5, 7, 3, 4);
  },

  sfx: {
    catchLayer(a, t) {                  // stand-in sleigh-bell jingle
      for (let i = 0; i < 3; i++) a.voice('triangle', t + 0.03 + i * 0.045, 0.12, 0.12, [[2600 + i * 300, 0], [2400 + i * 300, 0.1]], a.out, 0.002);
    },
  },

  words: { hide: 'Blanket piles', critters: 'Reindeer pups', hazard: 'Slush' },
};

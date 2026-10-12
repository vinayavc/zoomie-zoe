// Theme: Halloween, "Spooky Night".
// PLACEHOLDER from T1: a Bedroom recolor plus tiny stand-in costume, icon and
// sound twist, so the picker works end to end. The T2 artist replaces all of
// this (see README.md and the themes table in docs/phase-4-themes-pwa-plan.md).

export default {
  id: 'halloween',
  name: 'Spooky Night',
  chip: { color: '#3E3460', ink: '#E8823A' },
  letterbox: '#231d38',
  palette: {
    bed: '#4B3F6B', bedDeep: '#3E3460', bedTone1: '#5A4C7E', bedTone2: '#352C55', bedTone3: '#5E4A72',
    vignette: '20,14,40',
    indigo: '#1E1838', teal: '#E08A3C', pink: '#8E6FB0', sun: '#D8E0F0',
    sherpa: '#9C5A2E', sherpaDark: '#6E3A1C', sherpaLight: '#D08A44',
    sock: '#E8823A', shoe: '#E07A26', shoeDark: '#9C4A12',
    ball: '#E8823A', ballDark: '#B0561C',
    water: '#9CCB6E', waterDeep: '#5E9A3E', waterInk: '#3C5E2A', foam: '#D8F0B0',
    bubble: 'rgba(190,230,140,0.5)', bubbleRim: 'rgba(60,94,42,0.75)', foamRim: 'rgba(60,94,42,0.45)',
    wetRope: '#5E8A4A', wetRopeLight: '#B8DCA0',
    dog: '#E8E6F0', dogDark: '#B9B5CC', dogLight: '#FFFFFF', dog2: '#D9D6E6', dog2Dark: '#A9A4BE', dogInk: '#4A4466',
  },
  critterMotion: 'float',

  costume: {
    // stand-in witch hat, seen from above: a brim and a bent tip
    head(ctx) {
      ctx.fillStyle = '#2A2240';
      ctx.strokeStyle = '#6B4A2F';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.ellipse(-4, 0, 5.5, 6.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3E3460';
      ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(-13, 1.5); ctx.lineTo(-2, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    },
  },

  drawChipIcon(g) {
    // stand-in pumpkin
    g.fillStyle = '#E8823A';
    g.strokeStyle = '#6B4A2F';
    g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(0, 1.5, 10, 8, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(0, -6); g.lineTo(0, 9); g.moveTo(-5, -5); g.quadraticCurveTo(-8, 1.5, -5, 8.5); g.moveTo(5, -5); g.quadraticCurveTo(8, 1.5, 5, 8.5); g.stroke();
    g.fillStyle = '#5E8A4A';
    g.fillRect(-1.2, -10, 2.4, 4);
  },

  sfx: {
    pop: { vibrato: [9, 40] },          // stand-in "ooo" wobble on catch pops
    over(a, t) {                        // stand-in owl "hoo-hoo" instead of the sigh
      a.voice('sine', t, 0.32, 0.3, [[420, 0], [380, 0.3]], a.out, 0.05);
      a.voice('sine', t + 0.42, 0.5, 0.3, [[400, 0], [340, 0.48]], a.out, 0.05);
    },
  },

  words: { hide: 'Leaf piles', hideTip: 'hide in one: ghosts lose you', hazard: 'Cauldron', critters: 'Ghost pups' },
};

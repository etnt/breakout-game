(function (global) {
  'use strict';

  var CONFIG = {
    W: 800,
    H: 600,

    paddle: {
      w: 100,
      h: 14,
      y: 600 - 40, // H - 40
      speed: 600   // px/s (keyboard)
    },

    ball: {
      radius: 8,
      initialSpeed: 320, // px/s
      maxSpeed: 640      // px/s
    },

    bricks: {
      cols: 10,
      rows: 6,
      gap: 8,
      topOffset: 60,
      sideOffset: 24,
      // Points per row, top to bottom.
      rowPoints: [70, 60, 50, 40, 30, 20],
      // Colors per row, top to bottom.
      rowColors: ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6']
    },

    lives: 3,
    levels: 3,
    speedUpPerBrick: 1.04, // +4% per brick hit
    minVyFraction: 0.25,   // minimum |vy| as a fraction of speed after bounces
    maxPaddleAngle: Math.PI / 3, // 60 degrees from vertical
    dtCap: 1 / 30          // seconds per step
  };

  var Breakout = global.Breakout || {};
  Breakout.CONFIG = CONFIG;
  global.Breakout = Breakout;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Breakout;
  }
})(typeof window !== 'undefined' ? window : globalThis);
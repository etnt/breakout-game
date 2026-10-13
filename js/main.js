(function (global) {
  'use strict';

  var Breakout = global.Breakout;
  var CONFIG = Breakout.CONFIG;

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');

  var BEST_KEY = 'breakout-best';

  function loadBest() {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; }
    catch (e) { return 0; }
  }

  function saveBest(score) {
    try { localStorage.setItem(BEST_KEY, String(score)); }
    catch (e) { /* storage unavailable — ignore */ }
  }

  var game = Breakout.createGame({ best: loadBest() });
  var input = Breakout.createInput(canvas);

  var last = null;

  function frame(timestamp) {
    if (last == null) last = timestamp;
    var dt = (timestamp - last) / 1000;
    last = timestamp;

    // Guard against huge gaps (tab switch) — game.update also clamps dt.
    if (dt > 0.25) dt = CONFIG.dtCap;
    if (dt < 0) dt = 0;

    Breakout.update(game, dt, input);
    Breakout.draw(ctx, game);

    if (game.score > game.best) {
      game.best = game.score;
      saveBest(game.best);
    }

    input.endFrame();
    requestAnimationFrame(frame);
  }

  // Auto-pause when the tab is hidden.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && game.state === 'playing') {
      game.state = 'paused';
    }
  });

  requestAnimationFrame(frame);
})(typeof window !== 'undefined' ? window : globalThis);
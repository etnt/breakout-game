(function (global) {
  'use strict';

  var CONFIG = (global.Breakout && global.Breakout.CONFIG);

  var STATE_TEXT = {
    ready: 'Click or press Space to launch',
    paused: 'Paused — press P or Esc to resume',
    levelclear: 'Level clear! — Space for the next level',
    gameover: 'GAME OVER — press Enter or R to restart',
    won: 'YOU WIN! — press Enter or R to play again'
  };

  function draw(ctx, game, input) {
    var c = CONFIG;

    // Background
    ctx.fillStyle = '#101418';
    ctx.fillRect(0, 0, c.W, c.H);

    drawBricks(ctx, game);
    if (input && input.touchActive) drawTouchZones(ctx, input);
    drawPaddle(ctx, game);
    drawBall(ctx, game);
    drawHud(ctx, game);

    if (STATE_TEXT[game.state]) {
      drawOverlay(ctx, game, STATE_TEXT[game.state]);
    }
  }

  function drawBricks(ctx, game) {
    for (var i = 0; i < game.bricks.length; i++) {
      var b = game.bricks[i];
      if (!b.alive) continue;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(b.x, b.y, b.w, 3);
    }
  }

  // On-screen hints for touch play: the left/right half of the canvas.
  // The half being held is highlighted.
  function drawTouchZones(ctx, input) {
    var c = CONFIG;
    var half = c.W / 2;
    var zoneTop = c.H - 120;
    var zoneH = 120;

    ctx.fillStyle = input.touchLeft ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, zoneTop, half, zoneH);
    ctx.fillStyle = input.touchRight ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(half, zoneTop, half, zoneH);

    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(236,240,241,0.25)';
    ctx.fillText('\u25C0', half / 2, zoneTop + zoneH / 2);
    ctx.fillText('\u25B6', half + half / 2, zoneTop + zoneH / 2);
  }

  function drawPaddle(ctx, game) {
    var p = game.paddle;
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(p.x, p.y + p.h - 4, p.w, 4);
  }

  function drawBall(ctx, game) {
    var b = game.ball;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f5f6fa';
    ctx.fill();
  }

  function drawHud(ctx, game) {
    var c = CONFIG;
    ctx.font = '16px monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ecf0f1';
    ctx.fillText('SCORE ' + game.score, 16, 26);
    ctx.fillText('LEVEL ' + game.level + '/' + c.levels, 220, 26);
    ctx.textAlign = 'right';
    ctx.fillText('BEST ' + game.best, c.W - 16, 26);
    ctx.fillText('LIVES ' + game.lives, c.W - 130, 26);
  }

  function drawOverlay(ctx, game, text) {
    var c = CONFIG;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, c.W, c.H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = '#ecf0f1';
    var title = {
      ready: 'BREAKOUT',
      paused: 'PAUSED',
      levelclear: 'LEVEL ' + game.level + ' CLEAR',
      gameover: 'GAME OVER',
      won: 'YOU WIN!'
    }[game.state] || '';
    ctx.fillText(title, c.W / 2, c.H / 2 - 40);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#bdc3c7';
    ctx.fillText(text, c.W / 2, c.H / 2 + 12);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText('Move: ←/→ or A/D · Launch: Space/click · Pause: P/Esc',
      c.W / 2, c.H / 2 + 50);
    ctx.fillText('Touch: hold left/right half of screen to move · tap to launch',
      c.W / 2, c.H / 2 + 74);
    ctx.fillText('Restart: Enter or R · Score ' + game.score + ' · Lives ' + game.lives,
      c.W / 2, c.H / 2 + 98);
  }

  var Breakout = global.Breakout || {};
  Breakout.draw = draw;
  global.Breakout = Breakout;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Breakout;
  }
})(typeof window !== 'undefined' ? window : globalThis);
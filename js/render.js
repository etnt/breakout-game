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

  function draw(ctx, game) {
    var c = CONFIG;

    // Background
    ctx.fillStyle = '#101418';
    ctx.fillRect(0, 0, c.W, c.H);

    drawBricks(ctx, game);
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
    ctx.fillText('Move: ←/→, A/D, mouse, or touch · Launch: Space/click · Pause: P/Esc',
      c.W / 2, c.H / 2 + 50);
    ctx.fillText('Restart: Enter or R · Score ' + game.score + ' · Lives ' + game.lives,
      c.W / 2, c.H / 2 + 74);
  }

  var Breakout = global.Breakout || {};
  Breakout.draw = draw;
  global.Breakout = Breakout;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Breakout;
  }
})(typeof window !== 'undefined' ? window : globalThis);
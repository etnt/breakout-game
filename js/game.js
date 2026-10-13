(function (global) {
  'use strict';

  var CONFIG = (global.Breakout && global.Breakout.CONFIG) || require('./config.js').CONFIG;

  // ---------------------------------------------------------------------------
  // Pure helpers
  // ---------------------------------------------------------------------------

  // Circle vs AABB test. Returns {hit, penX, penY, cx, cy} where penX/penY are
  // the axis overlaps (penetration depths) and cx/cy are the rect's center.
  function circleRectCollision(cx, cy, r, rect) {
    var rectCx = rect.x + rect.w / 2;
    var rectCy = rect.y + rect.h / 2;
    var dx = cx - rectCx;
    var dy = cy - rectCy;

    var overlapX = rect.w / 2 + r - Math.abs(dx);
    var overlapY = rect.h / 2 + r - Math.abs(dy);

    if (overlapX <= 0 || overlapY <= 0) {
      return { hit: false, penX: 0, penY: 0, rectCx: rectCx, rectCy: rectCy };
    }
    return { hit: true, penX: overlapX, penY: overlapY, rectCx: rectCx, rectCy: rectCy };
  }

  // Bounce the ball off the paddle. Angle = hit * maxPaddleAngle from vertical.
  function paddleBounce(game) {
    var c = CONFIG;
    var p = game.paddle;
    var b = game.ball;

    var hit = (b.x - (p.x + p.w / 2)) / (p.w / 2);
    hit = Math.max(-1, Math.min(1, hit));

    var angle = hit * c.maxPaddleAngle; // 0 = straight up
    b.vx = b.speed * Math.sin(angle);
    b.vy = -b.speed * Math.cos(angle);

    // Place the ball on top of the paddle so it cannot stick.
    b.y = p.y - b.radius - 0.5;

    clampVy(b);
    emit(game, 'paddle');
    return b;
  }

  // Keep |vy| from getting so small the ball crawls horizontally forever.
  function clampVy(b) {
    var minVy = b.speed * CONFIG.minVyFraction;
    if (Math.abs(b.vy) < minVy) {
      var sign = b.vy === 0 ? -1 : (b.vy < 0 ? -1 : 1);
      b.vy = sign * minVy;
      // Preserve speed magnitude, redirect the rest into vx.
      var vxSign = b.vx === 0 ? 1 : (b.vx < 0 ? -1 : 1);
      b.vx = vxSign * Math.sqrt(Math.max(0, b.speed * b.speed - b.vy * b.vy));
    }
  }

  function levelRows(level) {
    return CONFIG.bricks.rows + (level - 1);
  }

  function levelBallSpeed(level) {
    return Math.min(
      CONFIG.ball.maxSpeed,
      Math.round(CONFIG.ball.initialSpeed * (1 + 0.12 * (level - 1)))
    );
  }

  // Build the brick grid for a level. Higher levels add rows.
  function buildLevel(level) {
    var bc = CONFIG.bricks;
    var bw = (CONFIG.W - 2 * bc.sideOffset - (bc.cols - 1) * bc.gap) / bc.cols;
    var bh = 22;
    var rows = levelRows(level);
    var bricks = [];

    for (var r = 0; r < rows; r++) {
      for (var col = 0; col < bc.cols; col++) {
        var rowIdx = r % bc.rowPoints.length; // cycle points/colors on extra rows
        bricks.push({
          x: bc.sideOffset + col * (bw + bc.gap),
          y: bc.topOffset + r * (bh + bc.gap),
          w: bw,
          h: bh,
          points: bc.rowPoints[rowIdx],
          color: bc.rowColors[rowIdx],
          alive: true
        });
      }
    }
    return bricks;
  }

  // ---------------------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------------------

  function createGame(opts) {
    opts = opts || {};
    var game = {
      state: 'ready',
      level: 1,
      score: 0,
      lives: CONFIG.lives,
      best: opts.best || 0,
      paddle: {
        x: (CONFIG.W - CONFIG.paddle.w) / 2,
        y: CONFIG.paddle.y,
        w: CONFIG.paddle.w,
        h: CONFIG.paddle.h
      },
      ball: { x: 0, y: 0, vx: 0, vy: 0, speed: 0, radius: CONFIG.ball.radius },
      bricks: [],
      bricksTotal: 0,
      rng: opts.rng || Math.random,
      // Sound events drained by the host each frame (see js/main.js).
      events: []
    };
    startLevel(game, 1);
    return game;
  }

  function startLevel(game, level) {
    game.level = level;
    game.bricks = buildLevel(level);
    game.bricksTotal = game.bricks.length;
    game.ball.speed = levelBallSpeed(level);
    game.state = 'ready';
    placeBallOnPaddle(game);
  }

  function placeBallOnPaddle(game) {
    var p = game.paddle;
    game.ball.x = p.x + p.w / 2;
    game.ball.y = p.y - game.ball.radius - 0.5;
    game.ball.vx = 0;
    game.ball.vy = 0;
  }

  function emit(game, type, extra) {
    if (!game.events) return; // tolerate bare mock games in tests
    var e = { type: type };
    if (extra) for (var k in extra) e[k] = extra[k];
    game.events.push(e);
  }

  function launchBall(game) {
    // Slight random angle upward (injectable RNG for deterministic tests).
    var a = (game.rng() * 0.7 - 0.35);
    game.ball.vx = game.ball.speed * Math.sin(a);
    game.ball.vy = -game.ball.speed * Math.cos(a);
    game.state = 'playing';
    emit(game, 'launch');
  }

  function restart(game) {
    game.score = 0;
    game.lives = CONFIG.lives;
    startLevel(game, 1);
  }

  function togglePause(game) {
    if (game.state === 'playing') game.state = 'paused';
    else if (game.state === 'paused') game.state = 'playing';
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  function update(game, dt, input) {
    var c = CONFIG;
    dt = Math.min(dt, c.dtCap);
    input = input || {};

    if (input.restart) { restart(game); return; }
    if (input.pause) { togglePause(game); return; }

    switch (game.state) {
      case 'ready':
        movePaddle(game, dt, input);
        placeBallOnPaddle(game);
        if (input.launch) launchBall(game);
        break;

      case 'playing':
        movePaddle(game, dt, input);
        stepBall(game, dt);
        break;

      case 'levelclear':
        if (input.launch) {
          if (game.level >= CONFIG.levels) {
            game.state = 'won';
          } else {
            startLevel(game, game.level + 1);
          }
        }
        break;

      case 'paused':
      case 'gameover':
      case 'won':
        break;
    }
  }

  function movePaddle(game, dt, input) {
    var c = CONFIG;
    var p = game.paddle;

    if (input.left) p.x -= c.paddle.speed * dt;
    if (input.right) p.x += c.paddle.speed * dt;

    p.x = Math.max(0, Math.min(c.W - p.w, p.x));
  }

  function stepBall(game, dt) {
    var c = CONFIG;
    var b = game.ball;

    // Sub-step so the ball cannot tunnel through bricks.
    var n = Math.max(1, Math.ceil((b.speed * dt) / (b.radius / 2)));
    var sub = dt / n;

    for (var i = 0; i < n; i++) {
      b.x += b.vx * sub;
      b.y += b.vy * sub;

      // Walls
      if (b.x - b.radius < 0) { b.x = b.radius; b.vx = Math.abs(b.vx); clampVy(b); emit(game, 'wall'); }
      else if (b.x + b.radius > c.W) { b.x = c.W - b.radius; b.vx = -Math.abs(b.vx); clampVy(b); emit(game, 'wall'); }
      if (b.y - b.radius < 0) { b.y = b.radius; b.vy = Math.abs(b.vy); clampVy(b); emit(game, 'wall'); }

      // Paddle: brick-style resolution on the smaller penetration axis.
      // If the vertical penetration is the smaller one (ball moving down),
      // the ball arrived from above → bounce. Otherwise the ball overlaps
      // the paddle sideways — it either fell past the top edge beside it, or
      // the paddle slid under a ball that was already below the paddle top —
      // so push it out horizontally and let it keep falling (never snap it
      // on top of the paddle, never let it pass through).
      var p = game.paddle;
      var pcol = circleRectCollision(b.x, b.y, b.radius, p);
      if (pcol.hit) {
        if (b.vy > 0 && pcol.penY <= pcol.penX) {
          paddleBounce(game);
        } else {
          b.x = b.x < pcol.rectCx ? p.x - b.radius - 0.01 : p.x + p.w + b.radius + 0.01;
          b.vx = b.x < pcol.rectCx ? -Math.abs(b.vx) : Math.abs(b.vx);
        }
      }

      // Bricks
      for (var k = 0; k < game.bricks.length; k++) {
        var brick = game.bricks[k];
        if (!brick.alive) continue;
        var bc = circleRectCollision(b.x, b.y, b.radius, brick);
        if (!bc.hit) continue;

        // Reflect on the axis of smaller penetration, then push out.
        if (bc.penX < bc.penY) {
          b.vx = b.x < bc.rectCx ? -Math.abs(b.vx) : Math.abs(b.vx);
          b.x = b.x < bc.rectCx ? brick.x - b.radius - 0.01 : brick.x + brick.w + b.radius + 0.01;
        } else {
          b.vy = b.y < bc.rectCy ? -Math.abs(b.vy) : Math.abs(b.vy);
          b.y = b.y < bc.rectCy ? brick.y - b.radius - 0.01 : brick.y + brick.h + b.radius + 0.01;
        }
        clampVy(b);

        // The `break` below limits each sub-step to one brick, so every hit
        // kills exactly one brick — even when several sub-steps land in the
        // same frame.
        brick.alive = false;
        game.score += brick.points;
        emit(game, 'brick', { points: brick.points });
        if (game.score > game.best) game.best = game.score;
        b.speed = Math.min(c.ball.maxSpeed, b.speed * c.speedUpPerBrick);
        // Renormalize velocity to the (possibly raised) speed.
        var mag = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
        b.vx = b.vx / mag * b.speed;
        b.vy = b.vy / mag * b.speed;
        break;
      }

      // Bottom: missed the ball
      if (b.y - b.radius > c.H) {
        game.lives--;
        if (game.lives <= 0) {
          game.state = 'gameover';
          emit(game, 'gameover');
        } else {
          game.state = 'ready';
          placeBallOnPaddle(game);
          emit(game, 'life');
        }
        return;
      }
    }

    // Level cleared?
    if (!game.bricks.some(function (br) { return br.alive; })) {
      game.state = 'levelclear';
      emit(game, 'levelclear');
    }
  }

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------

  var Breakout = global.Breakout || {};
  Breakout.createGame = createGame;
  Breakout.update = update;
  Breakout.restart = restart;
  Breakout.togglePause = togglePause;
  Breakout.buildLevel = buildLevel;
  Breakout.circleRectCollision = circleRectCollision;
  Breakout.paddleBounce = paddleBounce;
  global.Breakout = Breakout;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Breakout;
  }
})(typeof window !== 'undefined' ? window : globalThis);
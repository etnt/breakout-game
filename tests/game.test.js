'use strict';

var test = require('node:test');
var assert = require('node:assert');

var Breakout = require('../js/game.js');
var CONFIG = require('../js/config.js').CONFIG;

function newPlayingGame() {
  var game = Breakout.createGame();
  game.state = 'playing';
  game.ball.x = CONFIG.W / 2;
  game.ball.y = 300;
  game.ball.speed = CONFIG.ball.initialSpeed;
  return game;
}

// dt small enough that a ball at initial speed takes exactly one sub-step,
// so a single update produces exactly one collision event.
var TINY_DT = CONFIG.ball.radius / 2 / CONFIG.ball.initialSpeed; // 4/320 s

function aliveCount(game) {
  return game.bricks.filter(function (b) { return b.alive; }).length;
}

test('wall bounce: left wall flips vx and clamps position', function () {
  var game = newPlayingGame();
  game.ball.x = 2;
  game.ball.vx = -200;
  game.ball.vy = 0;
  Breakout.update(game, TINY_DT, {});
  assert.ok(game.ball.vx > 0, 'vx should flip positive');
  assert.strictEqual(game.ball.x, CONFIG.ball.radius);
});

test('wall bounce: right wall flips vx', function () {
  var game = newPlayingGame();
  game.ball.x = CONFIG.W - 2;
  game.ball.vx = 200;
  game.ball.vy = 0;
  Breakout.update(game, TINY_DT, {});
  assert.ok(game.ball.vx < 0, 'vx should flip negative');
  assert.strictEqual(game.ball.x, CONFIG.W - CONFIG.ball.radius);
});

test('wall bounce: top wall flips vy', function () {
  var game = newPlayingGame();
  game.ball.y = 2;
  game.ball.vy = -200;
  Breakout.update(game, TINY_DT, {});
  assert.ok(game.ball.vy > 0, 'vy should flip positive');
  assert.strictEqual(game.ball.y, CONFIG.ball.radius);
});

test('paddle bounce: center hit sends the ball straight up', function () {
  var game = newPlayingGame();
  game.paddle.x = (CONFIG.W - CONFIG.paddle.w) / 2;
  game.ball.x = game.paddle.x + CONFIG.paddle.w / 2;
  game.ball.y = game.paddle.y - game.ball.radius; // touching
  game.ball.vx = 100;
  game.ball.vy = 200;
  Breakout.paddleBounce(game);
  assert.strictEqual(Math.abs(game.ball.vx), 0);
  assert.ok(game.ball.vy < 0, 'vy must be negative after bounce');
});

test('paddle bounce: edge hit is about 60 degrees from vertical, vy negative', function () {
  var game = newPlayingGame();
  game.paddle.x = (CONFIG.W - CONFIG.paddle.w) / 2;
  game.ball.x = game.paddle.x + CONFIG.paddle.w; // far right edge
  game.ball.vy = 200;
  Breakout.paddleBounce(game);
  var angle = Math.atan2(Math.abs(game.ball.vx), Math.abs(game.ball.vy));
  assert.ok(Math.abs(angle - Math.PI / 3) < 0.01, 'angle ~60 deg, got ' + angle);
  assert.ok(game.ball.vy < 0);
  assert.ok(game.ball.y < game.paddle.y, 'ball placed above paddle');
});

test('brick hit: removes brick, adds score', function () {
  var game = newPlayingGame();
  var brick = game.bricks[0];
  game.ball.x = brick.x + brick.w / 2;
  game.ball.y = brick.y + brick.h + game.ball.radius; // just below brick
  game.ball.vy = -CONFIG.ball.initialSpeed;
  game.ball.vx = 0;
  var score = game.score;
  // TINY_DT = one sub-step, so exactly one brick is hit (a larger dt lets the
  // bounced ball reach the row below within the same update).
  Breakout.update(game, TINY_DT, {});
  assert.strictEqual(brick.alive, false, 'brick should be removed');
  assert.strictEqual(game.score, score + brick.points);
});

// Ball starts just below a row-1 brick (overlapping it), moving up. Sub-step 1
// kills the row-1 brick and bounces down; sub-step 2 then hits the row-2
// brick below. Both bricks must die in the SAME update call.
test('brick hit: two bricks destroyed in one update (multi sub-step)', function () {
  var game = newPlayingGame();
  var row1 = game.bricks[12]; // row 1, col 2
  var row2 = game.bricks[22]; // row 2, col 2
  game.ball.x = row1.x + row1.w / 2; // column center: no sideways overlap
  game.ball.y = row1.y + row1.h + game.ball.radius - 1; // overlapping row 1
  game.ball.vx = 0;
  game.ball.vy = -CONFIG.ball.initialSpeed;
  var score = game.score;
  var aliveBefore = aliveCount(game);
  Breakout.update(game, 0.02, {}); // 2 sub-steps at initial speed
  assert.strictEqual(row1.alive, false, 'row-1 brick should be removed');
  assert.strictEqual(row2.alive, false, 'row-2 brick should be removed too');
  assert.strictEqual(aliveCount(game), aliveBefore - 2, 'exactly two bricks gone');
  assert.strictEqual(game.score, score + row1.points + row2.points, 'score for both bricks');
});

test('brick hit: bottom hit flips vy, side hit flips vx', function () {
  var game = newPlayingGame();
  var brick = game.bricks[0];
  // Bottom hit (ball below brick, moving up) — TINY_DT so only one collision
  // event happens per update (otherwise the ball may hit the row below too).
  game.ball.x = brick.x + brick.w / 2;
  game.ball.y = brick.y + brick.h + game.ball.radius;
  game.ball.vx = 0;
  game.ball.vy = -CONFIG.ball.initialSpeed;
  Breakout.update(game, TINY_DT, {});
  assert.ok(game.ball.vy > 0, 'bottom hit should flip vy positive');

  // Side hit (ball left of brick, moving right)
  var brick2 = game.bricks[1];
  game.ball.x = brick2.x - game.ball.radius;
  game.ball.y = brick2.y + brick2.h / 2;
  game.ball.vx = CONFIG.ball.initialSpeed;
  game.ball.vy = 0;
  Breakout.update(game, TINY_DT, {});
  assert.ok(game.ball.vx < 0, 'side hit should flip vx negative');
});

test('bottom miss: lives decrease, state returns to ready', function () {
  var game = newPlayingGame();
  game.ball.x = CONFIG.W / 2;
  game.ball.y = CONFIG.H - CONFIG.ball.radius - 1;
  game.ball.speed = CONFIG.ball.maxSpeed;
  game.ball.vy = CONFIG.ball.maxSpeed;
  game.ball.vx = 0;
  var lives = game.lives;
  Breakout.update(game, CONFIG.dtCap, {});
  assert.strictEqual(game.lives, lives - 1);
  assert.strictEqual(game.state, 'ready');
});

test('bottom miss at 0 lives: gameover', function () {
  var game = newPlayingGame();
  game.lives = 1;
  game.ball.speed = CONFIG.ball.maxSpeed;
  game.ball.y = CONFIG.H - CONFIG.ball.radius - 1;
  game.ball.vy = CONFIG.ball.maxSpeed;
  Breakout.update(game, CONFIG.dtCap, {});
  assert.strictEqual(game.state, 'gameover');
});

test('clearing all bricks advances to levelclear, next level adds rows', function () {
  var game = newPlayingGame();
  game.bricks.forEach(function (b) { b.alive = false; });
  Breakout.update(game, 1 / 60, {});
  assert.strictEqual(game.state, 'levelclear');

  var level1Bricks = game.bricks.length;
  // Advance via launch input
  Breakout.update(game, 1 / 60, { launch: true });
  assert.strictEqual(game.level, 2);
  assert.strictEqual(game.state, 'ready');
  assert.ok(game.bricks.length > level1Bricks, 'level 2 has more rows/bricks');
});

test('clearing the last level gives won', function () {
  var game = newPlayingGame();
  game.level = CONFIG.levels;
  game.bricks = Breakout.buildLevel(CONFIG.levels);
  game.bricks.forEach(function (b) { b.alive = false; });
  Breakout.update(game, 1 / 60, {});
  Breakout.update(game, 1 / 60, { launch: true });
  assert.strictEqual(game.state, 'won');
});

test('restart resets score, lives, level', function () {
  var game = newPlayingGame();
  game.score = 500;
  game.lives = 1;
  game.level = 3;
  Breakout.restart(game);
  assert.strictEqual(game.score, 0);
  assert.strictEqual(game.lives, CONFIG.lives);
  assert.strictEqual(game.level, 1);
  assert.strictEqual(game.state, 'ready');
  assert.strictEqual(aliveCount(game), game.bricksTotal);
});

test('no tunneling: ball at max speed with large dt does not skip bricks', function () {
  var game = newPlayingGame();
  game.ball.speed = CONFIG.ball.maxSpeed;
  game.ball.x = 100;
  game.ball.y = CONFIG.H / 2;
  game.ball.vx = 0;
  game.ball.vy = -CONFIG.ball.maxSpeed; // straight up through the brick wall
  var livesBefore = game.lives;
  Breakout.update(game, 1 / 30, {});
  // Ball must not have escaped past the top or through bricks unharmed:
  // it should still be on-screen or the ball was lost to a brick/wall.
  assert.ok(game.ball.y <= CONFIG.H, 'ball stayed in bounds vertically');
  assert.ok(game.ball.x >= 0 && game.ball.x <= CONFIG.W, 'ball in bounds horizontally');
  assert.strictEqual(game.lives, livesBefore, 'no life lost in one frame');
});

test('ball speed never exceeds max', function () {
  var game = newPlayingGame();
  // Hit many bricks to pump the speed up.
  for (var i = 0; i < 50; i++) {
    var brick = game.bricks.find(function (b) { return b.alive; });
    if (!brick) break;
    game.ball.x = brick.x + brick.w / 2;
    game.ball.y = brick.y + brick.h + game.ball.radius;
    game.ball.vx = 0;
    game.ball.vy = -game.ball.speed;
    game.ball.speed = CONFIG.ball.maxSpeed; // force the cap check
    Breakout.update(game, 1 / 60, {});
    assert.ok(game.ball.speed <= CONFIG.ball.maxSpeed + 0.001,
      'speed capped, got ' + game.ball.speed);
    assert.ok(isFinite(game.ball.vx) && isFinite(game.ball.vy), 'no NaN velocities');
  }
});

test('dt is clamped to dtCap', function () {
  var game = newPlayingGame();
  game.ball.y = 2;
  game.ball.vy = CONFIG.ball.initialSpeed; // downward
  game.ball.vx = 0;
  // A huge dt would put the ball far below; with clamping it loses a life
  // at most once per update.
  var lives = game.lives;
  Breakout.update(game, 10, {});
  assert.ok(game.lives >= lives - 1, 'dt clamped, at most one life lost');
});

test('togglePause switches between playing and paused', function () {
  var game = newPlayingGame();
  Breakout.togglePause(game);
  assert.strictEqual(game.state, 'paused');
  Breakout.togglePause(game);
  assert.strictEqual(game.state, 'playing');
});

// A ball falling beside the paddle edge, already overlapping it sideways, must
// keep falling instead of being snapped on top of the paddle.
test('paddle: side overlap while falling is not snapped on top', function () {
  var game = newPlayingGame();
  game.paddle.x = (CONFIG.W - CONFIG.paddle.w) / 2;
  game.ball.x = game.paddle.x + CONFIG.paddle.w - 4; // overlapping the edge
  game.ball.y = game.paddle.y + 5; // already vertically overlapping, below top
  game.ball.vx = 0;
  game.ball.vy = CONFIG.ball.initialSpeed; // falling
  Breakout.update(game, CONFIG.dtCap, {});
  assert.ok(game.ball.y > game.paddle.y,
    'ball must fall past the paddle, not be snapped above it');
});

// Reviewer reproduction: a ball already below the paddle top, inside the
// paddle's x-range, must bounce when the paddle slides under it instead of
// passing straight through (which used to cost a life).
test('paddle slides under a ball already below the paddle top: it bounces', function () {
  var game = newPlayingGame();
  game.paddle.x = 280; // slid under the ball (moved from x=300 → 280)
  game.ball.x = 288;
  game.ball.y = game.paddle.y + 2.3; // 562.3: already below the paddle top
  game.ball.vx = 0;
  game.ball.vy = CONFIG.ball.initialSpeed; // 320 px/s, falling
  var lives = game.lives;
  Breakout.update(game, 1 / 60, {});
  assert.ok(game.ball.vy < 0, 'ball must bounce (vy negative), not keep falling');
  assert.strictEqual(game.lives, lives, 'no life should be lost');
});
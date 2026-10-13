'use strict';

var test = require('node:test');
var assert = require('node:assert');

var Breakout = require('../js/game.js');
var CONFIG = require('../js/config.js').CONFIG;

var VALID_STATES = ['ready', 'playing', 'paused', 'levelclear', 'gameover', 'won'];

// Small deterministic PRNG so the simulation tests are reproducible.
function mulberry32(seed) {
  var t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    var x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Headless bot: tracks ball.x with the paddle, launches and restarts as needed.
function runBot(seconds, hz, seed) {
  var game = Breakout.createGame({ rng: mulberry32(seed) });
  var input = { left: false, right: false, pointerX: null, launch: false, pause: false, restart: false };
  var steps = Math.round(seconds * hz);
  var dt = 1 / hz;

  for (var i = 0; i < steps; i++) {
    input.launch = false;
    input.pause = false;
    input.restart = false;
    input.pointerX = null;

    if (game.state === 'ready' || game.state === 'levelclear') {
      input.launch = true;
    } else if (game.state === 'playing') {
      // Track the ball with the paddle (naive proportional bot).
      var target = game.ball.x;
      var paddleCx = game.paddle.x + game.paddle.w / 2;
      var diff = target - paddleCx;
      var move = diff * dt * 8; // proportional gain
      var limit = CONFIG.paddle.speed * dt;
      input.pointerX = paddleCx + Math.max(-limit, Math.min(limit, move));
    }

    Breakout.update(game, dt, input);

    // Invariants every frame.
    assert.ok(VALID_STATES.indexOf(game.state) !== -1, 'valid state: ' + game.state);
    assert.ok(isFinite(game.ball.x) && isFinite(game.ball.y), 'ball position finite');
    assert.ok(isFinite(game.ball.vx) && isFinite(game.ball.vy), 'ball velocity finite');
    assert.ok(game.ball.x >= -1 && game.ball.x <= CONFIG.W + 1, 'ball x in bounds');
    assert.ok(game.ball.y >= -1, 'ball y in bounds');
    assert.ok(game.ball.speed <= CONFIG.ball.maxSpeed + 0.001, 'speed capped');

    if (game.state === 'gameover' || game.state === 'won') break;
  }
  return game;
}

test('bot clears level 1 or destroys more than 50% of bricks in 60s', function () {
  var game = runBot(60, 60, 1337);
  var destroyed = game.bricksTotal - game.bricks.filter(function (b) { return b.alive; }).length;
  var cleared = destroyed === game.bricksTotal;
  var majority = destroyed / game.bricksTotal > 0.5;
  assert.ok(cleared || majority,
    'expected level clear or >50% bricks destroyed; destroyed ' +
    destroyed + '/' + game.bricksTotal);
});

test('bot run stays sane (no NaNs, in-bounds, valid states)', function () {
  // Invariants are asserted inside runBot on every step; this test just runs it.
  var game = runBot(30, 60, 42);
  assert.ok(game.score >= 0);
});

test('bot wins-or-keeps-playing without crashing across restarts', function () {
  var game = runBot(20, 60, 2024);
  // If gameover happened, restart must produce a fresh playable game.
  if (game.state === 'gameover') {
    Breakout.restart(game);
    assert.strictEqual(game.state, 'ready');
    assert.strictEqual(game.lives, CONFIG.lives);
    assert.strictEqual(game.score, 0);
  }
});
test('same seed produces identical runs (deterministic simulation)', function () {
  var a = runBot(15, 60, 7);
  var b = runBot(15, 60, 7);
  assert.strictEqual(a.score, b.score, 'same seed, same score');
  assert.strictEqual(a.lives, b.lives, 'same seed, same lives');
  assert.strictEqual(a.level, b.level, 'same seed, same level');
  assert.strictEqual(a.state, b.state, 'same seed, same state');
});

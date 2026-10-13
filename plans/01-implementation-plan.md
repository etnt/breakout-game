# Breakout Implementation Plan (HTML5 Canvas + Vanilla JS)

## Background

A local qwen3 model was asked to build a playable Breakout game in this
directory. It failed: it produced a Rust/ggez scaffold that only prints to
the console, plus two self-congratulatory solution documents
(`SOLUTION.md`, `FINAL_SOLUTION.md`) whose claims were never verified.
This plan replaces that attempt with a simple, playable deliverable.

## Goal

Build a playable HTML5 Canvas Breakout game in vanilla JS with no build step.
It runs by opening `index.html` (file://) or through any static server.
The game logic is pure and testable in Node. Plans are stored as Markdown in `plans/`.

## Decisions

- **Stack:** Canvas and vanilla JS. The Rust/ggez scaffold only prints to the console. It needs a 1 GB `target/` build and a native window, and the task asks for a simple deliverable.
- **Scripts:** Use classic `<script>` tags with a global `Breakout` namespace, not ES modules. Chrome blocks module imports on file://.
- **Pure logic:** `game.js` has no DOM access. It ends with `if (typeof module!=='undefined') module.exports = Breakout;` so Node can load it.
- **Rust files:** Leave the Rust scaffold in place and untouched. Move the three old solution docs to `docs/archive/` with a note that they are unverified.

## Architecture

```
index.html          canvas + <script> tags
style.css           centering, dark background
js/config.js        Breakout.CONFIG constants
js/game.js          pure logic (no DOM) — createGame, update, restart, togglePause
js/input.js         keyboard + pointer input, one-shot flags
js/render.js        draw(ctx, game) — bricks, paddle, ball, HUD, overlays
js/main.js          rAF loop, dt clamp, localStorage best score, auto-pause
tests/              node:test suites, zero dependencies
```

## Gameplay spec

- Canvas 800×600. Paddle 100×14 at `y = H-40`, keyboard speed 600 px/s, or follows the pointer.
- Ball radius 8. Initial speed 320 px/s, +4% per brick hit, capped at 640 px/s.
- Bricks: 10 columns × 6 rows, 8 px gap, top offset 60. Row points from top:
  70, 60, 50, 40, 30, 20.
- Lives: 3. Levels: 3 (higher levels add rows and ball speed); clearing the last level = `won`.
- Paddle bounce: `hit = (ball.x - paddle.cx) / (paddle.w/2)` clamped to ±1;
  outgoing angle = `hit * 60°` from vertical; ball repositioned on top of the paddle.
- Brick collision: circle-vs-AABB; reflect on the axis of smaller penetration and push out. At most one brick removed per frame.
- Ball sub-stepping: `n = ceil(speed*dt / (radius/2))` so it cannot tunnel.
- Minimum `|vy|` clamped to ~25% of speed after every bounce to prevent near-horizontal loops.
- States: `ready | playing | paused | levelclear | gameover | won`.
- `dt` clamped to 1/30 s per step.

## Test plan

- `tests/game.test.js` (node:test): wall bounce; paddle angle (center vertical,
  edge ~60°, `vy` negative); brick removal + score + axis-correct reflection;
  bottom miss (life loss → ready, 0 lives → gameover); level advance and `won`;
  restart; no tunneling at max speed with large dt; speed cap.
- `tests/simulate.test.js`: headless bot tracks the ball for ~60 simulated
  seconds at 60 Hz; asserts level 1 clears (or >50% bricks destroyed), no NaNs,
  ball in bounds, valid states.
- `node --check js/*.js` for syntax.
- Manual browser checklist lives in `plans/02-progress.md`.

## Verification (no browser)

1. `for f in js/*.js; do node --check $f; done`
2. `node --test tests/`
3. `grep -o 'src="[^"]*"' index.html` — every referenced script must exist.
4. Optional: `python3 -m http.server 8000` + `curl -I` each asset → 200.
5. Manual play-through by the user (see progress doc).
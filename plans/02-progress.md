# Progress & Verification Log

## Checklist

- [x] Write plan docs (`plans/01-implementation-plan.md`, this file)
- [x] Archive `SOLUTION.md`, `FINAL_SOLUTION.md` to `docs/archive/` with unverified note
- [x] Rewrite `README.md` with accurate run/controls/test/layout sections
- [x] Update `.gitignore` (`node_modules`, `.DS_Store`; `/target` line removed with the scaffold)
- [x] `index.html` + `style.css` (canvas 800×600, classic scripts, file://-safe)
- [x] `js/config.js`
- [x] `js/game.js` (pure logic, Node-exportable, injectable `rng`)
- [x] `js/input.js` (keyboard + pointer + touch)
- [x] `js/render.js`
- [x] `js/main.js` (rAF loop, dt clamp, best score, auto-pause on hide)
- [x] `tests/game.test.js`, `tests/simulate.test.js`, `package.json` (no deps)
- [x] Syntax check all JS
- [x] Run test suites
- [x] Confirm all scripts referenced by `index.html` exist
- [x] Static-serve smoke check (curl 200 on all assets)

## Review fixes (round 2)

- **CRITICAL — multi-kill per frame:** `stepBall` declared `brickRemoved` once
  per call, so only one brick could be destroyed per `update` even when several
  sub-steps hit bricks. The flag was dropped: each sub-step's `break` already
  limits it to one brick, and every hit now kills its brick and scores.
  Regression test added: `brick hit: two bricks destroyed in one update`.
  Verified the new test fails against the old logic (old code: second brick
  stays alive, score 60 vs 110).
- **Flaky bot test:** `launchBall` used unseeded `Math.random()`. `createGame`
  now accepts `{ rng }` (default `Math.random`) and the simulation tests inject
  a seeded `mulberry32` PRNG (seeds 1337 / 42 / 2024) plus a
  same-seed-identical-run determinism test.
- **Rust scaffold:** `Cargo.toml`, `Cargo.lock`, `src/main.rs` moved to
  `docs/archive/rust-scaffold/`; `target/` build artifacts deleted; `/target`
  dropped from `.gitignore`; README updated to say so.
- **README:** `npm test` description now matches `package.json`
  (`node --test tests/*.test.js`).
- **Paddle side-overlap:** `stepBall` only applies the paddle bounce when the
  ball's previous y was above the paddle top (`prevY + radius <= p.y + 0.01`),
  so a ball falling beside the paddle edge is no longer snapped on top of it.
  Regression test added: `paddle: side overlap while falling is not snapped on
  top`. Existing `brick hit: removes brick, adds score` test switched to
  `TINY_DT` (it had relied on the old one-kill-per-frame behavior; a larger dt
  now legitimately reaches a second brick).

## Review fixes (round 3) — paddle side-overlap rule

- Chosen rule (matches the brick resolution): resolve the paddle overlap on
  the **smaller penetration axis**. When `penY <= penX` and the ball is moving
  down (`vy > 0`), it arrived from above → bounce (`paddleBounce`). Otherwise
  (horizontal penetration is smaller, or the ball is not moving down) the
  overlap is sideways → push the ball out horizontally past the paddle edge
  and flip/keep `vx` pointing away from the paddle, so it keeps falling.
- This replaces the round-2 gate (`prevY + radius <= p.y + 0.01`), which only
  looked at the previous sub-step: a ball that had already dropped below the
  paddle top beside it passed straight through when the paddle slid under it.
  The new rule both bounces that pass-through case (vertical penetration is
  smaller when the ball is inside the paddle's x-range) and still refuses to
  snap a sideways-overlapping falling ball on top of the paddle.
- Regression test added: `paddle slides under a ball already below the paddle
  top: it bounces` (reviewer's reproduction: ball (288, 562.3), vy +320,
  paddle x 300 → 280, one update(1/60); asserts `vy < 0` and no life lost).

## Automated verification results

- `node --check` on `js/config.js`, `js/game.js`, `js/input.js`, `js/render.js`, `js/main.js`: all pass.
- `npm test` (`node --test tests/*.test.js`): 23/23 tests pass, 0 failures
  (19 unit tests + 4 headless-bot tests, including the seeded 60 s / 60 Hz
  simulation that clears level 1 with no NaNs, no tunneling, and the speed cap
  held). `npm test` was run 3 consecutive times: identical results every run
  (seeded simulations are deterministic).
- All `src="..."` entries in `index.html` resolve to existing files; `style.css` link resolves.
- `python3 -m http.server` smoke check: all 7 assets return HTTP 200.
- Note: this Node version (v24.10.0) fails on `node --test tests/` (it tries to
  load the directory itself as a module), so the npm script uses the
  `tests/*.test.js` glob form.

## Manual browser checklist — to do by the user

- [ ] Page opens via double-click on `index.html` (file://) with no console errors
- [ ] Paddle moves with ←/→, A/D, and mouse; touch drag works on mobile
- [ ] Space / click launches the ball; ball bounces off walls, paddle, bricks
- [ ] Paddle angle control feels right (center = straight, edges = steep)
- [ ] P / Esc pauses and resumes; tab switch auto-pauses
- [ ] Losing all 3 lives shows GAME OVER; Enter / R restarts
- [ ] Clearing all 3 levels shows the WIN screen
- [ ] Best score persists across reloads

## Known limitations

- Rendering/feel can only be verified by a human in a browser; automated tests cover logic only.
- The qwen3 Rust scaffold was moved to `docs/archive/rust-scaffold/` (build
  artifacts deleted); it is dead code kept for reference only.
## Modification: keyboard-only paddle + sound effects

- Paddle is now controlled only with ← / → (or A / D); pointer/touch paddle
  control removed from `js/input.js` and `js/game.js`. Click / tap still
  launches the ball.
- Sound effects added (`js/audio.js`, Web Audio API, fully synthesized — no
  audio files). `js/game.js` emits events into `game.events`
  (launch, paddle, wall, brick, life, levelclear, gameover, won); `js/main.js`
  drains them each frame and plays them. Audio unlocks on the first user
  gesture per browser autoplay policy.
- Headless bot in `tests/simulate.test.js` now steers with the left/right keys
  instead of `pointerX`; still clears level 1 in the seeded simulation.
- Verification: `npm run check` pass; `npm test` 25/25 pass (22 previous +
  3 new sound-event tests).

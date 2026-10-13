# Breakout (HTML5 Canvas + Vanilla JS)

A fully playable 2D Breakout game. Pure HTML/CSS/JS — no build step, no
dependencies, no framework. The game logic is pure JavaScript and is covered
by automated tests that run in Node.

## Run the game

Open `index.html` directly in a browser (double-click works — the game loads
via classic `<script>` tags, so `file://` is fine), or serve it:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Controls

| Action            | Keys / input                          |
| ----------------- | ------------------------------------- |
| Move paddle       | ← / → , A / D (keyboard only)         |
| Launch ball       | Space, or click / tap the canvas      |
| Pause / resume    | P or Esc                              |
| Restart           | Enter or R (also from game-over/win)  |

## Gameplay

- 3 levels, each harder than the last (more rows, faster ball).
- Ball speed increases 4% per brick hit, capped at 640 px/s.
- Paddle-angle reflection: hit the ball with the paddle edge for a steeper angle.
- 3 lives, per-row brick scoring (70/60/50/40/30/20 from the top).
- Best score persists in `localStorage`.

## Run the tests

Requires Node (any recent version with `node:test`).

```sh
npm test        # node --test tests/*.test.js — logic + headless bot simulation
npm run check   # node --check js/*.js — syntax check
```

## Deploy to GitHub Pages

A GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) deploys the
game on every push to `main`: it first runs the syntax check and tests, then
publishes the static site.

One-time setup in the GitHub repo: **Settings → Pages → Build and deployment →
Source: GitHub Actions**. The game is then served at
`https://etnt.github.io/breakout-game/`. Deploys can also be triggered
manually via the workflow's **Run workflow** button.

## Project layout

```
index.html            game page (canvas 800×600)
style.css             centering / dark background
js/config.js          tunable constants
js/game.js            pure game logic (no DOM, Node-testable)
js/input.js           keyboard input, one-shot flags
js/audio.js           synthesized sound effects (Web Audio API)
js/render.js          canvas drawing (HUD, overlays)
js/main.js            requestAnimationFrame loop, best score, auto-pause
tests/                node:test suites (zero dependencies)
plans/                design + progress documents
docs/archive/         unverified docs + Rust scaffold from the failed qwen3 attempt
```

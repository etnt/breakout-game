(function (global) {
  'use strict';

  function createInput(canvas) {
    var input = {
      left: false,
      right: false,
      launch: false,
      pause: false,
      restart: false
    };

    window.addEventListener('keydown', function (e) {
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A':
          input.left = true; e.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D':
          input.right = true; e.preventDefault(); break;
        case ' ':
          input.launch = true; e.preventDefault(); break;
        case 'p': case 'P': case 'Escape':
          input.pause = true; e.preventDefault(); break;
        case 'Enter': case 'r': case 'R':
          input.restart = true; e.preventDefault(); break;
      }
    });

    window.addEventListener('keyup', function (e) {
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A': input.left = false; break;
        case 'ArrowRight': case 'd': case 'D': input.right = false; break;
      }
    });

    // Click / tap launches the ball (paddle itself is keyboard-only).
    canvas.addEventListener('pointerdown', function (e) {
      input.launch = true;
      e.preventDefault();
    });

    // Clear one-shot flags; called after each frame.
    input.endFrame = function () {
      input.launch = false;
      input.pause = false;
      input.restart = false;
    };

    return input;
  }

  var Breakout = global.Breakout || {};
  Breakout.createInput = createInput;
  global.Breakout = Breakout;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Breakout;
  }
})(typeof window !== 'undefined' ? window : globalThis);
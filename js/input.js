(function (global) {
  'use strict';

  function createInput(canvas) {
    var input = {
      left: false,
      right: false,
      launch: false,
      pause: false,
      restart: false,
      tap: false, // pointer went down on the canvas this frame
      // Set while a finger holds the left/right half of the canvas.
      touchLeft: false,
      touchRight: false
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

    // Touch controls:
    //   - Hold the left half of the canvas to move left, right half to move right.
    //   - Tap anywhere to launch the ball (same as click).
    // Several fingers can be held at once; each is tracked by pointerId.
    var touches = {}; // pointerId -> 'left' | 'right'

    function recountTouches() {
      input.touchLeft = false;
      input.touchRight = false;
      for (var id in touches) {
        if (touches[id] === 'left') input.touchLeft = true;
        else input.touchRight = true;
      }
    }

    canvas.addEventListener('pointerdown', function (e) {
      input.launch = true;
      input.tap = true;
      e.preventDefault();
      if (e.pointerType !== 'touch') return;
      var rect = canvas.getBoundingClientRect();
      var side = (e.clientX - rect.left) < rect.width / 2 ? 'left' : 'right';
      touches[e.pointerId] = side;
      recountTouches();
    });

    function releaseTouch(e) {
      if (e.pointerType !== 'touch') return;
      delete touches[e.pointerId];
      recountTouches();
    }
    window.addEventListener('pointerup', releaseTouch);
    window.addEventListener('pointercancel', releaseTouch);

    // Clear one-shot flags; called after each frame.
    input.endFrame = function () {
      input.launch = false;
      input.pause = false;
      input.restart = false;
      input.tap = false;
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
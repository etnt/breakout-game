// Sound effects via the Web Audio API — all sounds are synthesized, so the
// game needs no audio files and stays a zero-build, file://-openable app.
(function (global) {
  'use strict';

  function createAudio() {
    var ctx = null; // lazily created (browsers require a user gesture)

    function ensureCtx() {
      if (ctx) return ctx;
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { ctx = null; }
      return ctx;
    }

    // Call on the first user gesture (keydown / pointerdown) so the
    // AudioContext is not left suspended.
    function unlock() {
      var ac = ensureCtx();
      if (ac && ac.state === 'suspended') ac.resume();
    }

    function now() { return ctx.currentTime; }

    // One shaped note: oscillator + gain envelope.
    // opts: type, freq, freqEnd, dur, vol, delay
    function note(o) {
      if (!ctx) return;
      var t = now() + (o.delay || 0);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(o.freq, t);
      if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, t + o.dur);
      var v = (o.vol == null ? 0.15 : o.vol);
      gain.gain.setValueAtTime(v, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + o.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + o.dur + 0.02);
    }

    // Quick pitch sweep (noise-free "zap").
    function sweep(o) {
      note({ type: o.type || 'sawtooth', freq: o.freq, freqEnd: o.freqEnd, dur: o.dur, vol: o.vol });
    }

    var handlers = {
      // Brick: pitch rises with the brick's point value (top rows = richer).
      brick: function (e) {
        var base = 330 + Math.min(6, e.points / 10) * 90;
        note({ type: 'square', freq: base, dur: 0.09, vol: 0.14 });
        note({ type: 'square', freq: base * 1.5, dur: 0.07, vol: 0.08, delay: 0.03 });
      },
      paddle: function () {
        note({ type: 'triangle', freq: 200, freqEnd: 150, dur: 0.09, vol: 0.18 });
      },
      wall: function () {
        note({ type: 'triangle', freq: 480, freqEnd: 380, dur: 0.05, vol: 0.09 });
      },
      launch: function () {
        sweep({ type: 'square', freq: 240, freqEnd: 620, dur: 0.12, vol: 0.10 });
      },
      life: function () {
        sweep({ type: 'sawtooth', freq: 420, freqEnd: 90, dur: 0.4, vol: 0.16 });
      },
      levelclear: function () {
        [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
          note({ type: 'square', freq: f, dur: 0.14, vol: 0.12, delay: i * 0.09 });
        });
      },
      gameover: function () {
        [392, 311.13, 246.94, 196].forEach(function (f, i) {
          note({ type: 'sawtooth', freq: f, dur: 0.22, vol: 0.13, delay: i * 0.16 });
        });
      },
      won: function () {
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
          note({ type: 'triangle', freq: f, dur: 0.2, vol: 0.13, delay: i * 0.11 });
        });
      }
    };

    function play(event) {
      if (!event || !handlers[event.type]) return;
      if (!ensureCtx() || (ctx.state === 'suspended' && !ctx.resume)) return;
      if (ctx.state === 'suspended') return; // no user gesture yet — stay silent
      handlers[event.type](event);
    }

    return { play: play, unlock: unlock };
  }

  var Breakout = global.Breakout || {};
  Breakout.createAudio = createAudio;
  global.Breakout = Breakout;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Breakout;
  }
})(typeof window !== 'undefined' ? window : globalThis);
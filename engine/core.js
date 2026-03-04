// engine/core.js — Game loop, input system, and lifecycle management

import { Renderer } from './renderer.js';
import { TextRenderer } from './text.js';
import { FrameCapture } from './capture.js';
import { Recorder } from './recorder.js';

const FIXED_DT = 1000 / 60; // 16.667ms = 60Hz
const MAX_ACCUMULATED = FIXED_DT * 5; // Death spiral protection: max 5 frames

// ── Input System ──

class Input {
  constructor() {
    this._down = new Set();
    this._pressed = new Set();  // Keys pressed this frame
    this._released = new Set(); // Keys released this frame
    this._events = [];          // Raw events for recorder
    this._frameNumber = 0;

    document.addEventListener('keydown', (e) => {
      // Prevent default for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (!this._down.has(e.key)) {
        this._pressed.add(e.key);
      }
      this._down.add(e.key);
      this._events.push({
        timestamp_ms: performance.now(),
        type: 'keydown',
        key: e.key,
        keyCode: e.keyCode,
        frame_number: this._frameNumber,
      });
    });

    document.addEventListener('keyup', (e) => {
      this._down.delete(e.key);
      this._released.add(e.key);
      this._events.push({
        timestamp_ms: performance.now(),
        type: 'keyup',
        key: e.key,
        keyCode: e.keyCode,
        frame_number: this._frameNumber,
      });
    });

    // Mouse events
    this._setupMouse();
  }

  _setupMouse() {
    let lastMouseTime = 0;
    const throttle = 33; // ~30Hz

    const canvasXY = (e) => {
      const canvas = document.querySelector('canvas#game');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right ||
          e.clientY < rect.top || e.clientY > rect.bottom) return null;
      return { x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) };
    };

    document.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastMouseTime < throttle) return;
      lastMouseTime = now;
      const pos = canvasXY(e);
      if (!pos) return;
      this._events.push({ timestamp_ms: now, type: 'mousemove', x: pos.x, y: pos.y, frame_number: this._frameNumber });
    });

    for (const evtType of ['mousedown', 'mouseup', 'click']) {
      document.addEventListener(evtType, (e) => {
        const pos = canvasXY(e);
        if (!pos) return;
        this._events.push({ timestamp_ms: performance.now(), type: evtType, button: e.button, x: pos.x, y: pos.y, frame_number: this._frameNumber });
      });
    }

    document.addEventListener('wheel', (e) => {
      const pos = canvasXY(e);
      if (!pos) return;
      this._events.push({ timestamp_ms: performance.now(), type: 'wheel', deltaX: e.deltaX, deltaY: e.deltaY, x: pos.x, y: pos.y, frame_number: this._frameNumber });
    }, { passive: true });
  }

  // Polling API
  isDown(key) { return this._down.has(key); }
  wasPressed(key) { return this._pressed.has(key); }
  wasReleased(key) { return this._released.has(key); }

  // Called at end of each fixed update to clear per-frame state
  _endFrame() {
    this._pressed.clear();
    this._released.clear();
  }

  // Drain events for recorder
  drainEvents() {
    const events = this._events;
    this._events = [];
    return events;
  }

  setFrameNumber(n) {
    this._frameNumber = n;
  }
}

// ── Game Engine ──

export class Game {
  constructor(canvasId, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) throw new Error(`Canvas #${canvasId} not found`);

    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;

    // Difficulty: 1=easiest, 5=hardest, persists across restarts
    this.difficulty = 3;
    this._baseOverlayText = '';

    // Create renderer (falls back to legacy if WebGL 2 not supported)
    try {
      this.renderer = new Renderer(canvas);
    } catch (e) {
      console.warn('WebGL 2 not supported, falling back to legacy:', e);
      window.location.href = 'index.html';
      return;
    }
    this.text = new TextRenderer(this.renderer.getGL());
    this.input = new Input();

    // Capture & recorder
    const captureEveryN = options.captureEveryN || 8;
    this.capture = new FrameCapture(this.renderer.getGL(), { captureEveryN });
    this.recorder = new Recorder(this.capture, () => this._getScore());

    // Game callbacks (set by the game module)
    this.onInit = null;    // () => void
    this.onUpdate = null;  // (dt) => void — called at fixed 60Hz
    this.onDraw = null;    // (renderer, text, alpha) => void
    this.onStateChange = null; // (newState) => void

    // State
    this._state = 'waiting'; // 'waiting' | 'playing' | 'over'
    this._accumulator = 0;
    this._lastTime = 0;
    this._running = false;
    this._scoreFn = null;
    this._rafId = null;

    // DOM references for overlay
    this.overlay = document.getElementById('overlay');
    this.overlayTitle = document.getElementById('overlayTitle');
    this.overlayText = document.getElementById('overlayText');

    // Setup visibility change handler
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.recorder.isRecording()) {
        this.recorder.endSession();
      }
    });
  }

  setScoreFn(fn) {
    this._scoreFn = fn;
  }

  _getScore() {
    return this._scoreFn ? this._scoreFn() : 0;
  }

  get state() { return this._state; }

  setState(newState) {
    const oldState = this._state;
    this._state = newState;

    if (newState === 'playing' && oldState !== 'playing') {
      this.recorder.startSession();
      if (this.overlay) this.overlay.style.display = 'none';
    } else if (newState === 'over' && oldState === 'playing') {
      this.recorder.endSession();
      // Difficulty overlay is applied when game calls showOverlay()
    } else if (newState === 'waiting') {
      if (this.overlay) this.overlay.style.display = 'flex';
    }

    if (this.onStateChange) this.onStateChange(newState);
  }

  showOverlay(title, text) {
    this._baseOverlayText = text;
    if (this.overlay) {
      this.overlay.style.display = 'flex';
      if (this.overlayTitle) this.overlayTitle.textContent = title;
      if (this._state === 'over') {
        this._applyDifficultyToOverlay();
      } else {
        if (this.overlayText) this.overlayText.textContent = text;
      }
    }
  }

  _applyDifficultyToOverlay() {
    if (!this.overlayText) return;
    const filled = '■'.repeat(this.difficulty);
    const empty = '□'.repeat(5 - this.difficulty);
    const label = ['', 'Very Easy', 'Easy', 'Normal', 'Hard', 'Very Hard'][this.difficulty];
    const base = this._baseOverlayText ? this._baseOverlayText + '\n\n' : '';
    this.overlayText.textContent = base + `[${filled}${empty}] ${label}\n← Easier   Harder →`;
  }

  hideOverlay() {
    if (this.overlay) this.overlay.style.display = 'none';
  }

  start() {
    if (this._running) return;
    this._running = true;

    if (this.onInit) this.onInit();

    // Draw initial frame
    this._drawFrame(0);

    this._lastTime = performance.now();
    this._accumulator = 0;

    const loop = (now) => {
      this._rafId = requestAnimationFrame(loop);

      let dt = now - this._lastTime;
      this._lastTime = now;

      // Death spiral protection
      if (dt > MAX_ACCUMULATED) dt = MAX_ACCUMULATED;

      this._accumulator += dt;

      // Fixed timestep updates
      while (this._accumulator >= FIXED_DT) {
        // Intercept difficulty keys in 'over' state before game sees them
        if (this._state === 'over') {
          if (this.input.wasPressed('ArrowLeft')) {
            this.difficulty = Math.max(1, this.difficulty - 1);
            this.input._pressed.delete('ArrowLeft');
            this._applyDifficultyToOverlay();
          }
          if (this.input.wasPressed('ArrowRight')) {
            this.difficulty = Math.min(5, this.difficulty + 1);
            this.input._pressed.delete('ArrowRight');
            this._applyDifficultyToOverlay();
          }
        }

        if (this.onUpdate) {
          this.onUpdate(FIXED_DT);
        }

        // Feed events to recorder
        const events = this.input.drainEvents();
        for (const evt of events) {
          this.recorder.recordEvent(evt);
        }

        this.input._endFrame();
        this._accumulator -= FIXED_DT;
      }

      // Interpolation alpha for smooth rendering
      const alpha = this._accumulator / FIXED_DT;
      this._drawFrame(alpha);

      // Frame capture (after render, before next frame)
      const frameNum = this.capture.onFrameRendered();
      this.input.setFrameNumber(frameNum);
    };

    this._rafId = requestAnimationFrame(loop);
  }

  _drawFrame(alpha) {
    this.renderer.begin();
    this.text.beginFrame();

    if (this.onDraw) {
      this.onDraw(this.renderer, this.text, alpha);
    }

    // Flush batched primitives first, then text on top, then bloom
    this.renderer.flushBatch();
    this.text.flush(this.width, this.height);
    this.renderer.end();
  }

  stop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
}

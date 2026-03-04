// engine/capture.js — Synchronous readPixels frame capture with PBO + Web Worker encoding

export class FrameCapture {
  constructor(gl, options = {}) {
    this.gl = gl;
    this.width = gl.canvas.width;
    this.height = gl.canvas.height;
    this.captureEveryN = options.captureEveryN || 8; // every 8th frame = 7.5fps at 60fps
    this.enabled = true;

    this._frameNumber = 0;
    this._pendingFrames = []; // { blob, frameNumber, timestamp }
    this._worker = null;
    this._pboSupported = false;
    this._pbo = null;
    this._pboFence = null;

    this._initWorker();
    this._initPBO();
  }

  _initWorker() {
    try {
      this._worker = new Worker(new URL('./capture-worker.js', import.meta.url), { type: 'module' });
      this._worker.onmessage = (e) => {
        this._pendingFrames.push(e.data);
      };
    } catch (err) {
      console.warn('Capture worker init failed, using main-thread fallback:', err);
    }
  }

  _initPBO() {
    const gl = this.gl;
    // PBO for async readback (avoids GPU stall)
    try {
      this._pbo = gl.createBuffer();
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this._pbo);
      gl.bufferData(gl.PIXEL_PACK_BUFFER, this.width * this.height * 4, gl.STREAM_READ);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      this._pboSupported = true;
    } catch (e) {
      this._pboSupported = false;
    }
  }

  // Call this after each frame render. Returns current frameNumber.
  onFrameRendered() {
    const frameNum = this._frameNumber++;
    if (!this.enabled) return frameNum;
    if (frameNum % this.captureEveryN !== 0) return frameNum;

    const gl = this.gl;
    const w = this.width;
    const h = this.height;
    const timestamp = performance.now();

    if (this._worker) {
      // Read pixels synchronously from the default framebuffer (screen)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const pixels = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      this._worker.postMessage(
        { pixels, width: w, height: h, frameNumber: frameNum, timestamp },
        [pixels.buffer] // Transfer ownership (zero-copy)
      );
    } else {
      // Fallback: use canvas.toBlob
      gl.canvas.toBlob((blob) => {
        if (blob) this._pendingFrames.push({ blob, frameNumber: frameNum, timestamp });
      }, 'image/png');
    }

    return frameNum;
  }

  // Drain captured frames (called by recorder at segment boundary)
  drainFrames() {
    const frames = this._pendingFrames;
    this._pendingFrames = [];
    return frames;
  }

  getFrameNumber() {
    return this._frameNumber;
  }

  destroy() {
    if (this._worker) {
      this._worker.terminate();
      this._worker = null;
    }
  }
}

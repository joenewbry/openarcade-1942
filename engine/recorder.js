// engine/recorder.js — Integrated recorder for WebGL engine
// Upload format is backward-compatible with the existing ingest hub

const SEGMENT_DURATION_MS = 60000;
const INGEST_URL = null; // standalone mode
const HEARTBEAT_URL = null; // standalone mode
const HEARTBEAT_INTERVAL_MS = 30000;

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function getCollectorId() {
  let id = null;
  try { id = localStorage.getItem('arcade_collector_id'); } catch (e) {}
  if (!id) {
    id = 'browser-' + uuid();
    try { localStorage.setItem('arcade_collector_id', id); } catch (e) {}
  }
  return id;
}

function detectGameName() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  for (const p of parts) {
    if (p !== 'index.html' && p !== 'v2.html' && p !== 'keypad.html' && p !== 'autoplay.html') {
      return p;
    }
  }
  return 'unknown';
}

export class Recorder {
  constructor(capture, getScoreFn) {
    this.capture = capture;
    this.getScore = getScoreFn || (() => 0);
    this.gameName = detectGameName();
    this.collectorId = getCollectorId();

    this._sessionId = null;
    this._sessionStartTime = null;
    this._segmentNum = 0;
    this._events = [];
    this._isRecording = false;
    this._segmentTimer = null;

    this._initHeartbeat();
    this._initBadge();
  }

  startSession() {
    if (this._isRecording) return;
    this._isRecording = true;
    const now = new Date();
    this._sessionId = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 15);
    this._sessionStartTime = Date.now();
    this._segmentNum = 0;
    this._events = [];

    if (this.capture) this.capture.enabled = true;
    this._scheduleSegment();
    this._updateBadge('REC');
  }

  endSession() {
    if (!this._isRecording) return;
    this._isRecording = false;
    clearTimeout(this._segmentTimer);
    this._uploadSegment(true);
    if (this.capture) this.capture.enabled = false;
    this._updateBadge('TRAINING AI');
  }

  isRecording() {
    return this._isRecording;
  }

  // Record an input event with frame number
  recordEvent(event) {
    if (!this._isRecording) return;
    this._events.push(event);
  }

  _scheduleSegment() {
    this._segmentTimer = setTimeout(() => {
      if (!this._isRecording) return;
      this._uploadSegment(false);
      this._scheduleSegment();
    }, SEGMENT_DURATION_MS);
  }

  _uploadSegment(isFinal) {
    const frames = this.capture ? this.capture.drainFrames() : [];
    const events = this._events.splice(0);
    if (frames.length === 0 && events.length === 0) return;

    const currentSeg = this._segmentNum++;

    // Build frame data: concatenated PNG blobs + index
    const blobPromises = frames.map(f => f.blob.arrayBuffer());

    Promise.all(blobPromises).then((buffers) => {
      let totalLen = 0;
      for (const buf of buffers) totalLen += buf.byteLength;

      const combined = new Uint8Array(totalLen);
      const frameIndex = [];
      let offset = 0;
      for (let i = 0; i < buffers.length; i++) {
        combined.set(new Uint8Array(buffers[i]), offset);
        frameIndex.push({
          offset,
          length: buffers[i].byteLength,
          timestamp_ms: frames[i].timestamp,
          frame_number: frames[i].frameNumber,
        });
        offset += buffers[i].byteLength;
      }

      const metadata = {
        game: this.gameName,
        session_id: this._sessionId,
        collector_id: this.collectorId,
        segment_num: currentSeg,
        is_final: isFinal,
        canvas_width: this.capture ? this.capture.width : 480,
        canvas_height: this.capture ? this.capture.height : 400,
        duration_ms: Date.now() - this._sessionStartTime,
        score: this.getScore(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        engine_version: 2,
        capture_fps: this.capture ? (60 / this.capture.captureEveryN) : 2,
        frame_format: 'png',
      };

      const formData = new FormData();
      formData.append('metadata', JSON.stringify(metadata));
      formData.append('frames', new Blob([combined], { type: 'application/octet-stream' }));
      formData.append('frame_index', JSON.stringify(frameIndex));
      formData.append('events', JSON.stringify(events));

      if (!INGEST_URL) return;
    fetch(INGEST_URL, { method: 'POST', body: formData })
        .then((r) => { if (r.ok) this._updateBadge('UPLOADED'); })
        .catch(() => {});
    }).catch(() => {});
  }

  _initHeartbeat() {
    if (!HEARTBEAT_URL) return;
    this._sendHeartbeat();
    setInterval(() => this._sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
  }

  _sendHeartbeat() {
    if (!HEARTBEAT_URL) return;
    try {
      navigator.sendBeacon(HEARTBEAT_URL, JSON.stringify({
        game: this.gameName,
        visitor_id: this.collectorId,
        timestamp: new Date().toISOString(),
      }));
    } catch (e) {}
  }

  _initBadge() {
    this._badge = document.createElement('div');
    this._badge.textContent = 'TRAINING AI';
    this._badge.style.cssText = [
      'position:fixed', 'bottom:12px', 'right:12px',
      'background:rgba(0,255,136,0.12)', 'border:1px solid rgba(0,255,136,0.35)',
      'color:#0f8', "font-family:'Courier New',monospace",
      'font-size:10px', 'font-weight:bold', 'padding:4px 10px',
      'border-radius:4px', 'letter-spacing:2px', 'z-index:9999',
      'pointer-events:none', 'user-select:none',
    ].join(';');
    document.body.appendChild(this._badge);
  }

  _updateBadge(text) {
    if (this._badge) this._badge.textContent = text;
  }
}

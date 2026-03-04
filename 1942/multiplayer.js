/**
 * 1942 Multiplayer Co-op Module
 * 
 * Uses WebRTC for peer-to-peer connection with a simple hash-based room system.
 * Signaling is done via a free TURN/signaling service (PeerJS) or manual offer/answer.
 * 
 * Flow:
 * 1. Host clicks "Start Multiplayer" → generates room code
 * 2. Guest navigates to URL with ?room=XXXX
 * 3. WebRTC connection established via PeerJS
 * 4. Host runs game simulation, sends state updates to guest
 * 5. Guest sends input to host
 */

const PEER_JS_HOST = 'https://0.peerjs.com'; // Free PeerJS cloud signaling

export class MultiplayerManager {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.isConnected = false;
    this.roomCode = null;
    this.onGuestJoined = null;
    this.onHostState = null;
    this.onGuestInput = null;
    this.onDisconnect = null;
    this.onError = null;
    this.guestInput = { left: false, right: false, up: false, down: false, shoot: false, bomb: false, roll: false, special: false, focus: false };
    this.lastSentState = null;
    this._peerReady = false;
  }

  /**
   * Generate a short room code
   */
  static generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * Get room code from URL params
   */
  static getRoomFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
  }

  /**
   * Create shareable URL
   */
  getShareURL() {
    const base = window.location.origin + window.location.pathname;
    return `${base}?room=${this.roomCode}`;
  }

  /**
   * Initialize as HOST — create room and wait for guest
   */
  async hostGame() {
    this.isHost = true;
    this.roomCode = MultiplayerManager.generateRoomCode();
    const peerId = `1942-${this.roomCode}`;
    
    return new Promise((resolve, reject) => {
      // Load PeerJS from CDN
      this._loadPeerJS().then(() => {
        this.peer = new Peer(peerId, {
          debug: 0,
        });

        this.peer.on('open', (id) => {
          this._peerReady = true;
          console.log('[MP] Host ready, room:', this.roomCode);
          resolve(this.roomCode);
        });

        this.peer.on('connection', (conn) => {
          console.log('[MP] Guest connecting...');
          this.conn = conn;
          this._setupConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.error('[MP] Host error:', err);
          if (this.onError) this.onError(err.type);
          if (!this._peerReady) reject(err);
        });
      }).catch(reject);
    });
  }

  /**
   * Initialize as GUEST — join existing room
   */
  async joinGame(roomCode) {
    this.isHost = false;
    this.roomCode = roomCode;
    const hostPeerId = `1942-${roomCode}`;
    const guestId = `1942-${roomCode}-g${Math.floor(Math.random() * 10000)}`;

    return new Promise((resolve, reject) => {
      this._loadPeerJS().then(() => {
        this.peer = new Peer(guestId, {
          debug: 0,
        });

        this.peer.on('open', () => {
          console.log('[MP] Guest ready, connecting to host...');
          const conn = this.peer.connect(hostPeerId, { reliable: false });
          this.conn = conn;
          this._setupConnection(conn);
          
          conn.on('open', () => {
            console.log('[MP] Connected to host!');
            resolve();
          });
        });

        this.peer.on('error', (err) => {
          console.error('[MP] Guest error:', err);
          if (this.onError) this.onError(err.type);
          reject(err);
        });
      }).catch(reject);
    });
  }

  /**
   * Set up data channel handlers
   */
  _setupConnection(conn) {
    conn.on('open', () => {
      this.isConnected = true;
      console.log('[MP] Connection established!');
      if (this.isHost && this.onGuestJoined) {
        this.onGuestJoined();
      }
    });

    conn.on('data', (data) => {
      if (this.isHost && data.type === 'input') {
        // Host receives guest input
        this.guestInput = data.input;
        if (this.onGuestInput) this.onGuestInput(data.input);
      } else if (!this.isHost && data.type === 'state') {
        // Guest receives game state
        if (this.onHostState) this.onHostState(data.state);
      } else if (!this.isHost && data.type === 'full_state') {
        // Guest receives full state sync
        if (this.onHostState) this.onHostState(data.state);
      }
    });

    conn.on('close', () => {
      this.isConnected = false;
      console.log('[MP] Connection closed');
      if (this.onDisconnect) this.onDisconnect();
    });

    conn.on('error', (err) => {
      console.error('[MP] Connection error:', err);
    });
  }

  /**
   * HOST: Send game state to guest (called every frame)
   */
  sendState(state) {
    if (!this.isConnected || !this.isHost || !this.conn) return;

    // Send compact state: player positions, enemies, bullets, score, etc.
    const compact = {
      // Host player
      p1: { x: state.player.x, y: state.player.y, w: state.player.w, h: state.player.h,
            vx: state.player.vx, vy: state.player.vy, lives: state.player.lives,
            bombs: state.player.bombs, invuln: state.player.invuln,
            rollTimer: state.player.rollTimer, planeId: state.player.plane.id },
      // Guest player (player 2)
      p2: state.player2 ? { x: state.player2.x, y: state.player2.y, w: state.player2.w, h: state.player2.h,
            vx: state.player2.vx, vy: state.player2.vy, lives: state.player2.lives,
            bombs: state.player2.bombs, invuln: state.player2.invuln,
            rollTimer: state.player2.rollTimer, planeId: state.player2.plane.id } : null,
      // Game state
      score: state.score,
      wave: state.wave,
      ci: state.campaignIndex,
      tick: state.tick,
      // Enemies (positions only for rendering)
      enemies: state.enemies.map(e => ({
        x: e.x, y: e.y, w: e.w, h: e.h, id: e.id, tier: e.tier,
        hp: e.hp, maxHp: e.maxHp, frame: e.frame, stunned: e.stunned,
      })),
      // Bullets
      bullets: state.bullets.map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, color: b.color })),
      eBullets: state.enemyBullets.map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, color: b.color, shape: b.shape })),
      // Effects
      particles: state.particles.slice(0, 20).map(p => ({ x: p.x, y: p.y, color: p.color, life: p.life })),
      scorePops: state.scorePops.map(p => ({ text: p.text, x: p.x, y: p.y, life: p.life })),
      // Pickups
      powerups: state.powerups.map(p => ({ x: p.x, y: p.y, w: p.w, h: p.h, id: p.id })),
      // Phase
      flashTimer: state.flashTimer,
      waveClearTimer: state.waveClearTimer,
      warningTimer: state.warningTimer,
    };

    try {
      this.conn.send({ type: 'state', state: compact });
    } catch (e) {
      // Connection may have closed
    }
  }

  /**
   * GUEST: Send input to host (called every frame)
   */
  sendInput(input) {
    if (!this.isConnected || this.isHost || !this.conn) return;

    const inputState = {
      left: input.isDown('ArrowLeft'),
      right: input.isDown('ArrowRight'),
      up: input.isDown('ArrowUp'),
      down: input.isDown('ArrowDown'),
      shoot: input.isDown(' '),
      bomb: input.wasPressed('b'),
      roll: input.wasPressed('Shift'),
      special: input.wasPressed('x'),
      focus: input.isDown('f') || input.isDown('z'),
    };

    try {
      this.conn.send({ type: 'input', input: inputState });
    } catch (e) {
      // Connection may have closed
    }
  }

  /**
   * Disconnect and clean up
   */
  disconnect() {
    if (this.conn) this.conn.close();
    if (this.peer) this.peer.destroy();
    this.isConnected = false;
    this.conn = null;
    this.peer = null;
  }

  /**
   * Load PeerJS library from CDN
   */
  _loadPeerJS() {
    return new Promise((resolve, reject) => {
      if (window.Peer) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      script.onload = () => {
        console.log('[MP] PeerJS loaded');
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load PeerJS'));
      document.head.appendChild(script);
    });
  }
}

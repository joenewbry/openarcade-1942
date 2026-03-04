// engine/renderer.js — WebGL 2 batched sprite renderer with bloom post-process

import {
  batchVert, batchFrag,
  dashedVert, dashedFrag,
  triVert, triFrag,
  spriteVert, spriteFrag,
  fullscreenVert,
  bloomExtractFrag, bloomBlurFrag, bloomCompositeFrag,
} from './shaders.js';

const MAX_INSTANCES = 4096;
const FLOATS_PER_INSTANCE = 12; // a_rect(4) + a_color(4) + a_params(4)
const MAX_DASHED_VERTS = 512;
const MAX_TRI_VERTS = 8192;

function compileShader(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function createProgram(gl, vSrc, fSrc) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

function parseColor(str) {
  // Fast hex parser for common formats: #rgb, #rrggbb, #rrggbbaa
  if (str.charCodeAt(0) === 35) { // '#'
    const hex = str.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0], 16) / 15;
      const g = parseInt(hex[1], 16) / 15;
      const b = parseInt(hex[2], 16) / 15;
      return [r, g, b, 1];
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return [r, g, b, a];
    }
  }
  // rgba() / rgb()
  const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\)/);
  if (m) {
    return [+m[1] / 255, +m[2] / 255, +m[3] / 255, m[4] !== undefined ? +m[4] : 1];
  }
  if (str === 'white' || str === '#fff') return [1, 1, 1, 1];
  if (str === 'black' || str === '#000') return [0, 0, 0, 1];
  return [1, 1, 1, 1];
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: true, // needed for readPixels capture
      powerPreference: 'high-performance',
    });

    if (!gl) throw new Error('WebGL 2 not supported');
    this.gl = gl;

    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // ── Batch program ──
    this.batchProg = createProgram(gl, batchVert, batchFrag);
    this._initBatch();

    // ── Dashed line program ──
    this.dashedProg = createProgram(gl, dashedVert, dashedFrag);
    this._initDashed();

    // ── Triangle program (lines, polygons, filled shapes) ──
    this.triProg = createProgram(gl, triVert, triFrag);
    this._initTris();

    // ── Sprite (textured quad) program ──
    this.spriteProg = createProgram(gl, spriteVert, spriteFrag);
    this._initSprite();

    // ── Bloom pipeline ──
    this._initBloom();

    // ── Sprite texture cache ──
    this._spriteTextures = new Map(); // name → { tex, width, height }

    // ── State ──
    this._instanceData = new Float32Array(MAX_INSTANCES * FLOATS_PER_INSTANCE);
    this._instanceCount = 0;
    this._glowColor = [0, 0, 0];
    this._glowIntensity = 0;
    this._dashedVerts = [];
    this._dashedDists = [];
    this._triData = new Float32Array(MAX_TRI_VERTS * 6); // pos(2) + color(4)
    this._triCount = 0;

    // Bloom config
    this.bloomEnabled = true;
    this.bloomThreshold = 0.45;
    this.bloomIntensity = 0.6;
    this.bloomRadius = 3.0;
  }

  // ── Batch rendering setup ──

  _initBatch() {
    const gl = this.gl;
    const prog = this.batchProg;

    // Unit quad (two triangles)
    const quadVerts = new Float32Array([0,0, 1,0, 1,1, 0,0, 1,1, 0,1]);

    this.batchVAO = gl.createVertexArray();
    gl.bindVertexArray(this.batchVAO);

    // Quad vertex buffer
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Instance buffer
    this.instanceBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuf);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_INSTANCES * FLOATS_PER_INSTANCE * 4, gl.DYNAMIC_DRAW);

    const stride = FLOATS_PER_INSTANCE * 4;
    const attrs = [
      { name: 'a_rect',   size: 4, offset: 0 },
      { name: 'a_color',  size: 4, offset: 16 },
      { name: 'a_params', size: 4, offset: 32 },
    ];
    for (const attr of attrs) {
      const loc = gl.getAttribLocation(prog, attr.name);
      if (loc === -1) continue;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, attr.size, gl.FLOAT, false, stride, attr.offset);
      gl.vertexAttribDivisor(loc, 1);
    }

    gl.bindVertexArray(null);

    // Uniforms
    gl.useProgram(prog);
    this.u_resolution = gl.getUniformLocation(prog, 'u_resolution');
  }

  _initDashed() {
    const gl = this.gl;
    const prog = this.dashedProg;

    this.dashedVAO = gl.createVertexArray();
    gl.bindVertexArray(this.dashedVAO);

    this.dashedPosBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dashedPosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_DASHED_VERTS * 2 * 4, gl.DYNAMIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.dashedDistBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dashedDistBuf);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_DASHED_VERTS * 4, gl.DYNAMIC_DRAW);
    const aDist = gl.getAttribLocation(prog, 'a_dist');
    gl.enableVertexAttribArray(aDist);
    gl.vertexAttribPointer(aDist, 1, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    gl.useProgram(prog);
    this.u_dashed_resolution = gl.getUniformLocation(prog, 'u_resolution');
    this.u_dashed_color = gl.getUniformLocation(prog, 'u_color');
    this.u_dashed_dashLen = gl.getUniformLocation(prog, 'u_dashLen');
    this.u_dashed_gapLen = gl.getUniformLocation(prog, 'u_gapLen');
  }

  _initTris() {
    const gl = this.gl;
    const prog = this.triProg;

    this.triVAO = gl.createVertexArray();
    gl.bindVertexArray(this.triVAO);

    this.triBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.triBuf);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_TRI_VERTS * 6 * 4, gl.DYNAMIC_DRAW);

    const stride = 24; // 6 floats * 4 bytes
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, stride, 0);

    const aColor = gl.getAttribLocation(prog, 'a_color');
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, stride, 8);

    gl.bindVertexArray(null);

    gl.useProgram(prog);
    this.u_tri_resolution = gl.getUniformLocation(prog, 'u_resolution');
  }

  _initSprite() {
    const gl = this.gl;
    const prog = this.spriteProg;

    this.spriteVAO = gl.createVertexArray();
    gl.bindVertexArray(this.spriteVAO);

    // 6 verts (2 triangles) × 4 floats (pos.xy + uv.xy)
    this.spriteVertBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteVertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, 6 * 4 * 4, gl.DYNAMIC_DRAW);

    const stride = 16; // 4 floats × 4 bytes
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, stride, 0);

    const aTexCoord = gl.getAttribLocation(prog, 'a_texCoord');
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, stride, 8);

    gl.bindVertexArray(null);

    gl.useProgram(prog);
    this.u_sprite_resolution = gl.getUniformLocation(prog, 'u_resolution');
    this.u_sprite_texture = gl.getUniformLocation(prog, 'u_texture');
    this.u_sprite_alpha = gl.getUniformLocation(prog, 'u_alpha');
  }

  // ── Sprite texture management ──

  loadSpriteTexture(name, image) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this._spriteTextures.set(name, { tex, width: image.width, height: image.height });
  }

  hasSpriteTexture(name) {
    return this._spriteTextures.has(name);
  }

  drawSprite(name, x, y, w, h, alpha = 1) {
    const entry = this._spriteTextures.get(name);
    if (!entry) return false; // texture not loaded

    // Flush pending batches so sprite draws in correct z-order
    this._flushBatch();
    this._flushDashed();
    this._flushTris();

    const gl = this.gl;
    gl.useProgram(this.spriteProg);
    gl.uniform2f(this.u_sprite_resolution, this.width, this.height);
    gl.uniform1f(this.u_sprite_alpha, alpha);
    gl.uniform1i(this.u_sprite_texture, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, entry.tex);

    // Build quad: 2 triangles (pos.xy + uv.xy)
    const verts = new Float32Array([
      // Triangle 1: top-left, top-right, bottom-right
      x,     y,     0, 0,
      x + w, y,     1, 0,
      x + w, y + h, 1, 1,
      // Triangle 2: top-left, bottom-right, bottom-left
      x,     y,     0, 0,
      x + w, y + h, 1, 1,
      x,     y + h, 0, 1,
    ]);

    gl.bindVertexArray(this.spriteVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteVertBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);

    return true;
  }

  // ── Bloom FBOs ──

  _initBloom() {
    const gl = this.gl;

    // Fullscreen quad
    this.fsQuadVAO = gl.createVertexArray();
    gl.bindVertexArray(this.fsQuadVAO);
    const fsBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fsBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1]), gl.STATIC_DRAW);

    // Extract program
    this.bloomExtractProg = createProgram(gl, fullscreenVert, bloomExtractFrag);
    const extPos = gl.getAttribLocation(this.bloomExtractProg, 'a_pos');

    // Blur program
    this.bloomBlurProg = createProgram(gl, fullscreenVert, bloomBlurFrag);

    // Composite program
    this.bloomCompositeProg = createProgram(gl, fullscreenVert, bloomCompositeFrag);

    // Use extract program to set up VAO (all fullscreen programs share same a_pos)
    gl.enableVertexAttribArray(extPos);
    gl.vertexAttribPointer(extPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // Create FBOs at half resolution for bloom
    this._createBloomFBOs();
  }

  _createBloomFBOs() {
    const gl = this.gl;
    const bw = Math.max(1, this.width >> 1);
    const bh = Math.max(1, this.height >> 1);

    // Scene FBO (full res)
    this.sceneFBO = this._createFBO(this.width, this.height);
    // Bloom FBOs (half res)
    this.bloomFBO1 = this._createFBO(bw, bh);
    this.bloomFBO2 = this._createFBO(bw, bh);
  }

  _createFBO(w, h) {
    const gl = this.gl;
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex, width: w, height: h };
  }

  // ── Public API ──

  begin(bgColor = '#1a1a2e') {
    this._instanceCount = 0;
    this._dashedVerts.length = 0;
    this._dashedDists.length = 0;
    this._triCount = 0;
    this._glowIntensity = 0;
    this._bgColor = parseColor(bgColor);

    const gl = this.gl;

    if (this.bloomEnabled) {
      // Render to scene FBO for bloom post-process
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFBO.fbo);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.viewport(0, 0, this.width, this.height);
    const c = this._bgColor;
    gl.clearColor(c[0], c[1], c[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  setGlow(color, intensity = 0.6) {
    if (color) {
      const c = parseColor(color);
      this._glowColor = [c[0], c[1], c[2]];
      this._glowIntensity = intensity;
    } else {
      this._glowIntensity = 0;
    }
  }

  fillRect(x, y, w, h, color) {
    this._addInstance(x, y, w, h, color, 0); // shape = 0 (rect)
  }

  fillCircle(cx, cy, r, color) {
    // Circle rendered as a quad with SDF in fragment shader
    this._addInstance(cx - r, cy - r, r * 2, r * 2, color, 1); // shape = 1 (circle)
  }

  line(x1, y1, x2, y2, color, width = 2) {
    // Render line as a thin rotated rectangle
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.01) return;

    // Compute perpendicular
    const nx = -dy / len * width * 0.5;
    const ny = dx / len * width * 0.5;

    // Four corners of the line quad
    const c = parseColor(color);
    const glow = this._glowIntensity;

    // Use two triangles for the line
    this._addInstance(x1, y1, dx, dy, color, 2, width);
  }

  // Render a line as a thin rect (simpler approach)
  strokeLine(x1, y1, x2, y2, color, width = 2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.01) return;

    // For axis-aligned lines, use a simple rect
    if (Math.abs(dx) < 0.01) {
      // Vertical line
      const minY = Math.min(y1, y2);
      this.fillRect(x1 - width / 2, minY, width, len, color);
    } else if (Math.abs(dy) < 0.01) {
      // Horizontal line
      const minX = Math.min(x1, x2);
      this.fillRect(minX, y1 - width / 2, len, width, color);
    } else {
      // Diagonal — use a thin rect approximation
      const minX = Math.min(x1, x2);
      const minY = Math.min(y1, y2);
      this.fillRect(minX, minY, Math.abs(dx) || width, Math.abs(dy) || width, color);
    }
  }

  dashedLine(x1, y1, x2, y2, color, width = 2, dashLen = 8, gapLen = 8) {
    // Build thick dashed line as a strip of quads
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.01) return;

    const dirX = dx / len;
    const dirY = dy / len;
    // Perpendicular
    const nx = -dirY * width * 0.5;
    const ny = dirX * width * 0.5;

    const cycle = dashLen + gapLen;
    let dist = 0;
    const verts = this._dashedVerts;
    const dists = this._dashedDists;

    while (dist < len) {
      const segEnd = Math.min(dist + dashLen, len);
      const sx = x1 + dirX * dist;
      const sy = y1 + dirY * dist;
      const ex = x1 + dirX * segEnd;
      const ey = y1 + dirY * segEnd;

      // Two triangles for this dash segment
      // v0 = start + normal, v1 = start - normal
      // v2 = end + normal,   v3 = end - normal
      verts.push(
        sx + nx, sy + ny, sx - nx, sy - ny, ex + nx, ey + ny,
        sx - nx, sy - ny, ex - nx, ey - ny, ex + nx, ey + ny
      );
      dists.push(dist, dist, segEnd, dist, segEnd, segEnd);

      dist += cycle;
    }

    this._dashedColor = parseColor(color);
    this._dashedDashLen = dashLen;
    this._dashedGapLen = gapLen;
  }

  // ── Triangle-based line/polygon drawing ──

  _addTriVert(x, y, r, g, b, a) {
    if (this._triCount >= MAX_TRI_VERTS) this._flushTris();
    const i = this._triCount * 6;
    this._triData[i] = x;
    this._triData[i + 1] = y;
    this._triData[i + 2] = r;
    this._triData[i + 3] = g;
    this._triData[i + 4] = b;
    this._triData[i + 5] = a;
    this._triCount++;
  }

  drawLine(x1, y1, x2, y2, color, width = 2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) return;

    const nx = -dy / len * width * 0.5;
    const ny = dx / len * width * 0.5;
    const c = parseColor(color);

    this._addTriVert(x1 + nx, y1 + ny, c[0], c[1], c[2], c[3]);
    this._addTriVert(x1 - nx, y1 - ny, c[0], c[1], c[2], c[3]);
    this._addTriVert(x2 + nx, y2 + ny, c[0], c[1], c[2], c[3]);

    this._addTriVert(x1 - nx, y1 - ny, c[0], c[1], c[2], c[3]);
    this._addTriVert(x2 - nx, y2 - ny, c[0], c[1], c[2], c[3]);
    this._addTriVert(x2 + nx, y2 + ny, c[0], c[1], c[2], c[3]);
  }

  strokePoly(points, color, width = 1.5, closed = true) {
    for (let i = 0; i < points.length - 1; i++) {
      this.drawLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, color, width);
    }
    if (closed && points.length > 2) {
      const last = points[points.length - 1];
      this.drawLine(last.x, last.y, points[0].x, points[0].y, color, width);
    }
  }

  fillPoly(points, color) {
    if (points.length < 3) return;
    const c = parseColor(color);
    for (let i = 1; i < points.length - 1; i++) {
      this._addTriVert(points[0].x, points[0].y, c[0], c[1], c[2], c[3]);
      this._addTriVert(points[i].x, points[i].y, c[0], c[1], c[2], c[3]);
      this._addTriVert(points[i + 1].x, points[i + 1].y, c[0], c[1], c[2], c[3]);
    }
  }

  _addInstance(x, y, w, h, color, shape, lineWidth = 0) {
    if (this._instanceCount >= MAX_INSTANCES) {
      this._flushBatch();
    }
    const c = parseColor(color);
    const i = this._instanceCount * FLOATS_PER_INSTANCE;
    const d = this._instanceData;
    d[i]     = x;
    d[i + 1] = y;
    d[i + 2] = w;
    d[i + 3] = h;
    d[i + 4] = c[0];
    d[i + 5] = c[1];
    d[i + 6] = c[2];
    d[i + 7] = c[3];
    d[i + 8] = shape;
    d[i + 9] = this._glowIntensity;
    d[i + 10] = 0; // borderRadius (unused for now)
    d[i + 11] = lineWidth;
    this._instanceCount++;
  }

  _flushBatch() {
    const gl = this.gl;
    const count = this._instanceCount;
    if (count === 0) return;

    gl.useProgram(this.batchProg);
    gl.uniform2f(this.u_resolution, this.width, this.height);

    gl.bindVertexArray(this.batchVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._instanceData.subarray(0, count * FLOATS_PER_INSTANCE));

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
    gl.bindVertexArray(null);

    this._instanceCount = 0;
  }

  _flushDashed() {
    const verts = this._dashedVerts;
    if (verts.length === 0) return;

    const gl = this.gl;
    const vertCount = verts.length / 2;

    gl.useProgram(this.dashedProg);
    gl.uniform2f(this.u_dashed_resolution, this.width, this.height);
    const c = this._dashedColor || [1, 1, 1, 1];
    gl.uniform4f(this.u_dashed_color, c[0], c[1], c[2], c[3]);
    gl.uniform1f(this.u_dashed_dashLen, this._dashedDashLen || 8);
    gl.uniform1f(this.u_dashed_gapLen, this._dashedGapLen || 8);

    gl.bindVertexArray(this.dashedVAO);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.dashedPosBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(verts));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.dashedDistBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this._dashedDists));

    gl.drawArrays(gl.TRIANGLES, 0, vertCount);
    gl.bindVertexArray(null);
  }

  _flushTris() {
    if (this._triCount === 0) return;
    const gl = this.gl;

    gl.useProgram(this.triProg);
    gl.uniform2f(this.u_tri_resolution, this.width, this.height);

    gl.bindVertexArray(this.triVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.triBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._triData.subarray(0, this._triCount * 6));
    gl.drawArrays(gl.TRIANGLES, 0, this._triCount);
    gl.bindVertexArray(null);

    this._triCount = 0;
  }

  // Public method to flush batched primitives (called by core before text rendering)
  flushBatch() {
    this._flushBatch();
    this._flushDashed();
    this._flushTris();
  }

  end() {
    if (!this.bloomEnabled) {
      // No bloom — we rendered directly to screen, nothing else to do
      return;
    }

    const gl = this.gl;

    // ── Bloom pass 1: extract bright pixels ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFBO1.fbo);
    gl.viewport(0, 0, this.bloomFBO1.width, this.bloomFBO1.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.bloomExtractProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFBO.tex);
    gl.uniform1i(gl.getUniformLocation(this.bloomExtractProg, 'u_texture'), 0);
    gl.uniform1f(gl.getUniformLocation(this.bloomExtractProg, 'u_threshold'), this.bloomThreshold);

    gl.bindVertexArray(this.fsQuadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // ── Bloom pass 2: horizontal blur ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFBO2.fbo);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.bloomBlurProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomFBO1.tex);
    gl.uniform1i(gl.getUniformLocation(this.bloomBlurProg, 'u_texture'), 0);
    gl.uniform2f(gl.getUniformLocation(this.bloomBlurProg, 'u_direction'),
      1.0 / this.bloomFBO1.width, 0);
    gl.uniform1f(gl.getUniformLocation(this.bloomBlurProg, 'u_radius'), this.bloomRadius);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // ── Bloom pass 3: vertical blur ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFBO1.fbo);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, this.bloomFBO2.tex);
    gl.uniform2f(gl.getUniformLocation(this.bloomBlurProg, 'u_direction'),
      0, 1.0 / this.bloomFBO2.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // ── Bloom pass 4: composite scene + bloom → screen ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);

    gl.useProgram(this.bloomCompositeProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFBO.tex);
    gl.uniform1i(gl.getUniformLocation(this.bloomCompositeProg, 'u_scene'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomFBO1.tex);
    gl.uniform1i(gl.getUniformLocation(this.bloomCompositeProg, 'u_bloom'), 1);
    gl.uniform1f(gl.getUniformLocation(this.bloomCompositeProg, 'u_intensity'), this.bloomIntensity);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
  }

  // Expose GL context for capture
  getGL() { return this.gl; }
}

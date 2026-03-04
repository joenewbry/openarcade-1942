// engine/text.js — Bitmap font renderer using canvas-generated texture atlas

import { textVert, textFrag } from './shaders.js';

const ATLAS_SIZE = 1024;
const MAX_TEXT_VERTS = 4096;

function compileShader(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Text shader error:', gl.getShaderInfoLog(s));
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
    console.error('Text program link error:', gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

function parseColor(str) {
  if (str.charCodeAt(0) === 35) {
    const hex = str.slice(1);
    if (hex.length === 3) {
      return [parseInt(hex[0], 16) / 15, parseInt(hex[1], 16) / 15, parseInt(hex[2], 16) / 15, 1];
    }
    if (hex.length >= 6) {
      return [parseInt(hex.slice(0,2), 16) / 255, parseInt(hex.slice(2,4), 16) / 255, parseInt(hex.slice(4,6), 16) / 255, 1];
    }
  }
  // Handle rgba() and rgb() color strings
  const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\)/);
  if (m) {
    return [+m[1] / 255, +m[2] / 255, +m[3] / 255, m[4] !== undefined ? +m[4] : 1];
  }
  return [1, 1, 1, 1];
}

export class TextRenderer {
  constructor(gl) {
    this.gl = gl;
    this.prog = createProgram(gl, textVert, textFrag);
    this.glyphs = new Map(); // char → { x, y, w, h } in atlas
    this._vertData = new Float32Array(MAX_TEXT_VERTS * 8); // pos(2) + uv(2) + color(4) = 8
    this._vertCount = 0;

    this._initBuffers();
    this._buildAtlas();
  }

  _initBuffers() {
    const gl = this.gl;

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.vertBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_TEXT_VERTS * 8 * 4, gl.DYNAMIC_DRAW);

    const stride = 32; // 8 floats * 4 bytes
    const aPos = gl.getAttribLocation(this.prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, stride, 0);

    const aTexCoord = gl.getAttribLocation(this.prog, 'a_texCoord');
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, stride, 8);

    const aColor = gl.getAttribLocation(this.prog, 'a_color');
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, stride, 16);

    gl.bindVertexArray(null);

    // Uniform locations
    gl.useProgram(this.prog);
    this.u_resolution = gl.getUniformLocation(this.prog, 'u_resolution');
    this.u_texture = gl.getUniformLocation(this.prog, 'u_texture');
  }

  _buildAtlas() {
    // Render all printable ASCII to a canvas, then upload as texture
    const canvas = document.createElement('canvas');
    canvas.width = ATLAS_SIZE;
    canvas.height = ATLAS_SIZE;
    const ctx = canvas.getContext('2d');

    // We generate glyphs for multiple font sizes
    // Key format: "size:char"
    this._fontSizes = [12, 14, 16, 20, 24, 26, 28, 32, 36, 40, 48, 56, 64, 80];
    const chars = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);

    let cursorX = 1;
    let cursorY = 1;
    let rowHeight = 0;

    for (const fontSize of this._fontSizes) {
      ctx.font = `${fontSize}px "Courier New", monospace`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#fff';

      for (const ch of chars) {
        const metrics = ctx.measureText(ch);
        const charW = Math.ceil(metrics.width) + 2;
        const charH = fontSize + 4;

        if (cursorX + charW >= ATLAS_SIZE) {
          cursorX = 1;
          cursorY += rowHeight + 1;
          rowHeight = 0;
        }

        if (cursorY + charH >= ATLAS_SIZE) break; // atlas full

        ctx.fillText(ch, cursorX, cursorY + 2);

        const key = `${fontSize}:${ch}`;
        this.glyphs.set(key, {
          x: cursorX,
          y: cursorY,
          w: charW,
          h: charH,
          advance: charW - 2,
        });

        cursorX += charW + 1;
        rowHeight = Math.max(rowHeight, charH);
      }
    }

    // Upload to WebGL texture
    const gl = this.gl;
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // Find closest atlas font size
  _closestSize(requestedSize) {
    let best = this._fontSizes[0];
    for (const s of this._fontSizes) {
      if (Math.abs(s - requestedSize) < Math.abs(best - requestedSize)) best = s;
    }
    return best;
  }

  beginFrame() {
    this._vertCount = 0;
  }

  drawText(text, x, y, fontSize, color, align = 'left') {
    const atlasSize = this._closestSize(fontSize);
    const scale = fontSize / atlasSize;
    const c = parseColor(color);

    // Calculate total width for alignment
    let totalWidth = 0;
    for (const ch of text) {
      const key = `${atlasSize}:${ch}`;
      const g = this.glyphs.get(key);
      if (g) totalWidth += g.advance * scale;
    }

    let curX = x;
    if (align === 'center') curX = x - totalWidth / 2;
    else if (align === 'right') curX = x - totalWidth;

    for (const ch of text) {
      const key = `${atlasSize}:${ch}`;
      const g = this.glyphs.get(key);
      if (!g) { curX += fontSize * 0.6; continue; }

      const w = g.w * scale;
      const h = g.h * scale;

      // UV coordinates in atlas
      const u0 = g.x / ATLAS_SIZE;
      const v0 = g.y / ATLAS_SIZE;
      const u1 = (g.x + g.w) / ATLAS_SIZE;
      const v1 = (g.y + g.h) / ATLAS_SIZE;

      // Two triangles per glyph
      const d = this._vertData;
      const i = this._vertCount * 8;
      if (this._vertCount + 6 > MAX_TEXT_VERTS) break;

      // Triangle 1: top-left, top-right, bottom-right
      d[i]    = curX;      d[i+1]  = y;       d[i+2]  = u0; d[i+3]  = v0; d[i+4]  = c[0]; d[i+5]  = c[1]; d[i+6]  = c[2]; d[i+7]  = c[3];
      d[i+8]  = curX + w;  d[i+9]  = y;       d[i+10] = u1; d[i+11] = v0; d[i+12] = c[0]; d[i+13] = c[1]; d[i+14] = c[2]; d[i+15] = c[3];
      d[i+16] = curX + w;  d[i+17] = y + h;   d[i+18] = u1; d[i+19] = v1; d[i+20] = c[0]; d[i+21] = c[1]; d[i+22] = c[2]; d[i+23] = c[3];
      // Triangle 2: top-left, bottom-right, bottom-left
      d[i+24] = curX;      d[i+25] = y;       d[i+26] = u0; d[i+27] = v0; d[i+28] = c[0]; d[i+29] = c[1]; d[i+30] = c[2]; d[i+31] = c[3];
      d[i+32] = curX + w;  d[i+33] = y + h;   d[i+34] = u1; d[i+35] = v1; d[i+36] = c[0]; d[i+37] = c[1]; d[i+38] = c[2]; d[i+39] = c[3];
      d[i+40] = curX;      d[i+41] = y + h;   d[i+42] = u0; d[i+43] = v1; d[i+44] = c[0]; d[i+45] = c[1]; d[i+46] = c[2]; d[i+47] = c[3];

      this._vertCount += 6;
      curX += g.advance * scale;
    }
  }

  flush(width, height) {
    if (this._vertCount === 0) return;

    const gl = this.gl;
    gl.useProgram(this.prog);
    gl.uniform2f(this.u_resolution, width, height);
    gl.uniform1i(this.u_texture, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._vertData.subarray(0, this._vertCount * 8));
    gl.drawArrays(gl.TRIANGLES, 0, this._vertCount);
    gl.bindVertexArray(null);
  }
}

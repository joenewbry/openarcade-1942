#!/usr/bin/env node
/**
 * TECH ARCHITECT GAMMA — Retro Arcade Classic Tile Generator v2
 * 
 * Generates 64×64 pixel tiles for the Coral Front campaign.
 * Native 16×16 pixel art upscaled 4× with nearest-neighbor.
 * 
 * Style: Authentic 80s/90s arcade shmup (1942/1943 feel)
 * - Strict 4-color-per-tile-type limit (NES/arcade authenticity)
 * - Structured dithering, no random noise
 * - Clean pixel edges, deliberate placement
 * - High contrast for CRT readability
 */

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const NATIVE = 16;
const SCALE = 4;
const SIZE = NATIVE * SCALE; // 64

const OUT_DIR = __dirname;

// ═══════════════════════════════════════════════════════
// CORAL FRONT PALETTE — Strict arcade-era colors
// Only 4 colors per tile category for authenticity
// ═══════════════════════════════════════════════════════

const W = {  // Water colors (4 + 1 highlight)
  D: '#0b1a30',  // deep dark
  M: '#183860',  // mid blue
  B: '#2868a0',  // bright blue
  L: '#48a8d0',  // light cyan
  H: '#90d8f0',  // highlight/sparkle
};

const S = {  // Sand colors (4)
  D: '#a08040',  // dark sand/shadow
  M: '#c8a858',  // mid sand
  B: '#e0c878',  // bright sand
  H: '#f0e0a0',  // highlight sand
};

const G = {  // Grass colors (4)
  D: '#185020',  // dark jungle
  M: '#287830',  // mid green
  B: '#40a048',  // bright
  H: '#60c050',  // highlight
};

const SH = { // Shore/transition (3)
  F: '#70c0d8',  // foam
  W: '#b0e0f0',  // white foam
  X: '#e0f0f8',  // bright foam/surf line
};

const CL = { // Cloud (4)
  S: 'rgba(120, 150, 180, 0.35)',  // shadow
  M: 'rgba(180, 210, 235, 0.50)',  // mid
  B: 'rgba(220, 238, 250, 0.70)',  // bright  
  H: 'rgba(245, 250, 255, 0.85)',  // highlight
};

// ═══════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════

function createTile(name, drawFn) {
  const native = createCanvas(NATIVE, NATIVE);
  const ctx = native.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawFn(ctx);
  
  const output = createCanvas(SIZE, SIZE);
  const outCtx = output.getContext('2d');
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(native, 0, 0, SIZE, SIZE);
  
  const filePath = path.join(OUT_DIR, `${name}.png`);
  fs.writeFileSync(filePath, output.toBuffer('image/png'));
  console.log(`  ✓ ${name}.png`);
}

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function fill(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, NATIVE, NATIVE);
}

/** Paint from a 16×16 grid array of color values */
function paintGrid(ctx, grid) {
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      if (grid[y] && grid[y][x]) {
        px(ctx, x, y, grid[y][x]);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
// WATER TILES — Structured wave patterns, not random noise
// Classic arcade water: horizontal wave lines with dithering
// ═══════════════════════════════════════════════════════

function drawWaterDeep(ctx) {
  fill(ctx, W.D);
  // Horizontal wave bands (every 4 rows, offset phase)
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const band = y % 4;
      const phase = Math.floor(y / 4);
      const xOff = (x + phase * 2) % 16;
      
      if (band === 0) {
        // Bright wave crest line — sparse dashes
        if (xOff % 6 < 3) px(ctx, x, y, W.M);
      } else if (band === 1) {
        // Mid tone dither
        if ((x + y) % 3 === 0) px(ctx, x, y, W.M);
      }
      // bands 2-3 stay dark
    }
  }
}

function drawWaterMid(ctx) {
  fill(ctx, W.M);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const band = y % 4;
      const phase = Math.floor(y / 4);
      const xOff = (x + phase * 3) % 16;
      
      if (band === 0) {
        if (xOff % 5 < 2) px(ctx, x, y, W.B);
      } else if (band === 1) {
        if ((x + y) % 4 === 0) px(ctx, x, y, W.B);
      } else if (band === 2) {
        if ((x + y) % 3 === 0) px(ctx, x, y, W.D);
      }
    }
  }
}

function drawWaterShallow(ctx) {
  fill(ctx, W.B);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const band = y % 4;
      const phase = Math.floor(y / 4);
      const xOff = (x + phase * 2 + 1) % 16;
      
      if (band === 0) {
        if (xOff % 4 < 2) px(ctx, x, y, W.L);
      } else if (band === 1) {
        if ((x + y) % 3 === 0) px(ctx, x, y, W.L);
      } else if (band === 3) {
        if ((x + y) % 4 === 0) px(ctx, x, y, W.M);
      }
    }
  }
  // Occasional bright sparkle
  px(ctx, 3, 2, W.H);
  px(ctx, 11, 6, W.H);
  px(ctx, 7, 10, W.H);
  px(ctx, 14, 14, W.H);
}

function drawWaterFoam(ctx) {
  fill(ctx, W.L);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const band = y % 3;
      const phase = Math.floor(y / 3);
      
      if (band === 0) {
        if ((x + phase) % 3 < 2) px(ctx, x, y, W.H);
      } else if (band === 1) {
        if ((x + phase) % 4 === 0) px(ctx, x, y, SH.F);
      } else {
        if ((x + y) % 5 === 0) px(ctx, x, y, W.B);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
// TERRAIN TILES — Structured patterns
// ═══════════════════════════════════════════════════════

function drawTerrainSand(ctx) {
  // Classic arcade sand: flat warm base with sparse pixel-noise grain
  fill(ctx, S.M);
  // Very subtle grain — only ~15% of pixels deviate
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      // Sparse noise, not patterned dither
      const h = ((x * 7 + y * 13 + 37) * 31) & 0xff;
      if (h < 25) px(ctx, x, y, S.D);
      else if (h > 220) px(ctx, x, y, S.B);
      else if (h > 245) px(ctx, x, y, S.H);
    }
  }
  // Coral accents — small but visible (Coral Front identity)
  px(ctx, 4, 6, '#c07060');
  px(ctx, 5, 6, '#c07060');
  px(ctx, 12, 3, '#d08878');
  px(ctx, 8, 13, '#c07060');
}

function drawTerrainGrass(ctx) {
  fill(ctx, G.M);
  // Structured grass — alternating dark/light blocks
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      // Checkerboard with variation
      const check = ((Math.floor(x/2) + Math.floor(y/2)) % 2);
      if (check === 0) {
        if ((x + y) % 3 === 0) px(ctx, x, y, G.D);
      } else {
        if ((x + y) % 3 === 0) px(ctx, x, y, G.B);
      }
    }
  }
  // Bright grass tuft highlights
  const tufts = [[1,2],[5,1],[10,4],[3,9],[13,11],[7,7],[14,3],[8,14]];
  for (const [tx, ty] of tufts) {
    px(ctx, tx, ty, G.H);
    if (tx + 1 < 16) px(ctx, tx + 1, ty, G.B);
  }
}

// ═══════════════════════════════════════════════════════
// EDGE TILES — Clean, deliberate water-to-sand transitions
// Convention: edge-N = terrain on top, water on bottom
// Each uses a hand-crafted 16×16 grid for pixel-perfect edges
// ═══════════════════════════════════════════════════════

// Helper: fill a row with water texture
function waterRow(ctx, y, phase) {
  for (let x = 0; x < 16; x++) {
    const c = ((x + phase) % 4 < 2) ? W.B : W.M;
    px(ctx, x, y, c);
  }
}

// Helper: fill a row with sand texture (flat with sparse noise)
function sandRow(ctx, y, phase) {
  for (let x = 0; x < 16; x++) {
    const h = ((x * 7 + y * 13 + phase * 3 + 37) * 31) & 0xff;
    const c = (h < 25) ? S.D : (h > 235) ? S.B : S.M;
    px(ctx, x, y, c);
  }
}

function drawEdgeN(ctx) {
  // Rows 0-7: sand, rows 8-9: shore/foam, rows 10-15: water
  for (let y = 0; y < 8; y++) sandRow(ctx, y, y);
  
  // Jagged shore line (organic) — sand dips into rows 8-9
  const shoreLine = [8,8,9,8,8,9,9,8,8,8,9,8,8,9,8,8];
  for (let x = 0; x < 16; x++) {
    const sl = shoreLine[x];
    // Sand goes down to shore line
    for (let y = 8; y < sl; y++) sandRow(ctx, y, y);
    // Foam at the edge
    px(ctx, x, sl, SH.X);
    if (sl + 1 < 16) px(ctx, x, sl + 1, SH.F);
  }
  
  // Water below
  for (let y = 10; y < 16; y++) waterRow(ctx, y, y);
  // Fill remaining spots in transition zone
  for (let y = 8; y < 10; y++) {
    for (let x = 0; x < 16; x++) {
      const sl = shoreLine[x];
      if (y > sl + 1) waterRow(ctx, y, y);
    }
  }
}

function drawEdgeS(ctx) {
  // Rows 0-5: water, rows 6-7: shore, rows 8-15: sand
  for (let y = 0; y < 6; y++) waterRow(ctx, y, y);
  
  const shoreLine = [7,6,7,7,6,7,6,6,7,7,6,7,7,6,7,6];
  for (let x = 0; x < 16; x++) {
    const sl = shoreLine[x];
    px(ctx, x, sl, SH.X);
    if (sl - 1 >= 6) px(ctx, x, sl - 1, SH.F);
  }
  
  for (let y = 8; y < 16; y++) sandRow(ctx, y, y);
  // Fill transition zone
  for (let y = 6; y < 8; y++) {
    for (let x = 0; x < 16; x++) {
      const sl = shoreLine[x];
      if (y < sl - 1) waterRow(ctx, y, y);
      if (y > sl) sandRow(ctx, y, y);
    }
  }
}

function drawEdgeE(ctx) {
  // Left: sand, right: water. Vertical edge around col 8-9
  const shoreLine = [8,8,9,8,8,9,9,8,9,8,8,9,8,8,9,8]; // per row
  
  for (let y = 0; y < 16; y++) {
    const sl = shoreLine[y];
    for (let x = 0; x < 16; x++) {
      if (x < sl) {
        const c = ((x + y) % 5 === 0) ? S.D : ((x + y) % 5 === 3) ? S.B : S.M;
        px(ctx, x, y, c);
      } else if (x === sl) {
        px(ctx, x, y, SH.X);
      } else if (x === sl + 1) {
        px(ctx, x, y, SH.F);
      } else {
        const c = ((x + y) % 4 < 2) ? W.B : W.M;
        px(ctx, x, y, c);
      }
    }
  }
}

function drawEdgeW(ctx) {
  // Left: water, right: sand. Vertical edge around col 6-7
  const shoreLine = [7,7,6,7,7,6,6,7,6,7,7,6,7,7,6,7]; // per row
  
  for (let y = 0; y < 16; y++) {
    const sl = shoreLine[y];
    for (let x = 0; x < 16; x++) {
      if (x > sl) {
        const c = ((x + y) % 5 === 0) ? S.D : ((x + y) % 5 === 3) ? S.B : S.M;
        px(ctx, x, y, c);
      } else if (x === sl) {
        px(ctx, x, y, SH.X);
      } else if (x === sl - 1) {
        px(ctx, x, y, SH.F);
      } else {
        const c = ((x + y) % 4 < 2) ? W.B : W.M;
        px(ctx, x, y, c);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
// OUTER CORNERS — Terrain in one corner, water in the other three
// ═══════════════════════════════════════════════════════

function drawOuterCorner(ctx, corner) {
  // Use clean curved edge (quarter-circle)
  const isN = corner.includes('N');
  const isE = corner.includes('E');
  
  // Radius for the curved shore edge
  const R = 9;
  
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      // Map to corner-relative coords
      const cx = isE ? (15 - x) : x;
      const cy = isN ? y : (15 - y);
      const dist = Math.sqrt(cx * cx + cy * cy);
      
      if (dist < R - 1.5) {
        // Sand terrain (flat with sparse noise)
        const h = ((x * 7 + y * 13 + 37) * 31) & 0xff;
        const c = (h < 25) ? S.D : (h > 235) ? S.B : S.M;
        px(ctx, x, y, c);
      } else if (dist < R) {
        // Bright shore line
        px(ctx, x, y, SH.X);
      } else if (dist < R + 1.2) {
        // Foam  
        px(ctx, x, y, SH.F);
      } else {
        // Water
        const c = ((x + y) % 4 < 2) ? W.B : W.M;
        px(ctx, x, y, c);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
// INNER CORNERS — Terrain everywhere except a water notch
// ═══════════════════════════════════════════════════════

function drawInnerCorner(ctx, corner) {
  const isN = corner.includes('N');
  const isE = corner.includes('E');
  
  const R = 7;
  
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      // Corner to measure from
      const cx = isE ? (15 - x) : x;
      const cy = isN ? y : (15 - y);
      const dist = Math.sqrt(cx * cx + cy * cy);
      
      if (dist > R + 1.5) {
        // Sand terrain (most of tile, flat with sparse noise)
        const h = ((x * 7 + y * 13 + 37) * 31) & 0xff;
        const c = (h < 25) ? S.D : (h > 235) ? S.B : S.M;
        px(ctx, x, y, c);
      } else if (dist > R) {
        // Shore line
        px(ctx, x, y, SH.X);
      } else if (dist > R - 1.2) {
        // Foam
        px(ctx, x, y, SH.F);
      } else {
        // Water notch
        const c = ((x + y) % 4 < 2) ? W.B : W.M;
        px(ctx, x, y, c);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
// CLOUD TILES — Clean shapes, deliberate alpha shading
// ═══════════════════════════════════════════════════════

function drawCloudThin(ctx) {
  ctx.clearRect(0, 0, 16, 16);
  
  // Hand-drawn wispy cloud — clean pixel shape
  const grid = [
    '................',
    '................',
    '................',
    '.....SS.........',
    '....SMM.........',
    '...SMBBS.......',
    '..SMBBHBS......',
    '..SMBHHHBMS....',
    '.SMBHHHHBMS....',
    '..SMBBHBBMS....',
    '...SMMBMMS.....',
    '....SSSMS......',
    '................',
    '................',
    '................',
    '................',
  ];
  
  const colors = { S: CL.S, M: CL.M, B: CL.B, H: CL.H };
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = grid[y][x];
      if (colors[ch]) px(ctx, x, y, colors[ch]);
    }
  }
}

function drawCloudThick(ctx) {
  ctx.clearRect(0, 0, 16, 16);
  
  const grid = [
    '................',
    '....SS...SS.....',
    '...SMMSSMMMS....',
    '..SMBBBBBBBMS...',
    '.SMBHHHHHHHBMS..',
    '.SMBHHHHHHHHBMS.',
    'SMBHHHHHHHHHBMS.',
    'SMBHHHHHHHHHHMS.',
    'SMBHHHHHHHHHHMS.',
    '.SMBHHHHHHHBMS..',
    '.SMBBBHHHBBMS...',
    '..SMMMBBBMMS....',
    '...SSSMMMSSS....',
    '....SSSSSSS.....',
    '................',
    '................',
  ];
  
  const colors = { S: CL.S, M: CL.M, B: CL.B, H: CL.H };
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = grid[y][x];
      if (colors[ch]) px(ctx, x, y, colors[ch]);
    }
  }
}

// ═══════════════════════════════════════════════════════
// GENERATE ALL TILES
// ═══════════════════════════════════════════════════════

console.log('🎮 TECH ARCHITECT GAMMA — Retro Arcade Classic Tiles v2');
console.log('═══════════════════════════════════════════════════════');
console.log('Campaign: Coral Front | Style: 80s/90s Arcade Shmup');
console.log('Palette: Strict 4-color-per-category | CRT-punchy contrast');
console.log('');

console.log('🌊 Water tiles:');
createTile('01-water-deep', drawWaterDeep);
createTile('02-water-mid', drawWaterMid);
createTile('03-water-shallow', drawWaterShallow);
createTile('04-water-foam', drawWaterFoam);

console.log('\n🏖️  Terrain tiles:');
createTile('10-terrain-sand', drawTerrainSand);
createTile('11-terrain-grass', drawTerrainGrass);

console.log('\n🔲 Edge tiles (N/S/E/W):');
createTile('20-edge-N', drawEdgeN);
createTile('21-edge-S', drawEdgeS);
createTile('22-edge-E', drawEdgeE);
createTile('23-edge-W', drawEdgeW);

console.log('\n📐 Outer corners:');
createTile('24-edge-NE', (ctx) => drawOuterCorner(ctx, 'NE'));
createTile('25-edge-NW', (ctx) => drawOuterCorner(ctx, 'NW'));
createTile('26-edge-SE', (ctx) => drawOuterCorner(ctx, 'SE'));
createTile('27-edge-SW', (ctx) => drawOuterCorner(ctx, 'SW'));

console.log('\n📐 Inner corners:');
createTile('28-edge-inner-NE', (ctx) => drawInnerCorner(ctx, 'NE'));
createTile('29-edge-inner-NW', (ctx) => drawInnerCorner(ctx, 'NW'));
createTile('30-edge-inner-SE', (ctx) => drawInnerCorner(ctx, 'SE'));
createTile('31-edge-inner-SW', (ctx) => drawInnerCorner(ctx, 'SW'));

console.log('\n☁️  Cloud tiles:');
createTile('40-cloud-thin', drawCloudThin);
createTile('41-cloud-thick', drawCloudThick);

// ═══════════════════════════════════════════════════════
// 12×12 ISLAND GRID — Organic, asymmetric, arcade-authentic
// This layout is offset left, with irregular coastline,
// a secondary small island, and flight corridors.
// ═══════════════════════════════════════════════════════

console.log('\n🗺️  Generating 12×12 island composition...');

// Tile shorthand
const Wd = 1, Wm = 2, Ws = 3, Wf = 4;
const Ts = 10, Tg = 11;
const eN = 20, eS = 21, eE = 22, eW = 23;
const cNE = 24, cNW = 25, cSE = 26, cSW = 27;
const iNE = 28, iNW = 29, iSE = 30, iSW = 31;

// Organic L-shaped island with narrow northern promontory, wide southern body,
// and an eastern peninsula creating natural flight corridors.
// Small detached reef isle in bottom-right adds depth.
// Uses inner corners for concave coastline transitions.
const grid = [
  //  0    1    2    3    4    5    6    7    8    9   10   11
  [ Wd,  Wd,  Wd,  Wm,  Wd,  Wd,  Wd,  Wd,  Wd,  Wd,  Wd,  Wd],  // 0  deep ocean  
  [ Wd,  Wd,  Wm,  Ws,  Ws,  Wm,  Wd,  Wd,  Wd,  Wd,  Wd,  Wd],  // 1  shallow appears around promontory
  [ Wd,  Wm,  Ws, cNW,  eN, cNE,  Ws,  Wm,  Wd,  Wd,  Wd,  Wd],  // 2  promontory north shore (2 tiles wide)
  [ Wd,  Wm,  Ws,  eW,  Ts,  eE,  Ws,  Wm,  Wd,  Wd,  Wd,  Wd],  // 3  narrow promontory body
  [ Wd,  Ws, cNW, iSE,  Tg,  Tg,  eN, cNE,  Ws,  Wm,  Wd,  Wd],  // 4  widens — inner corner NW creates cove
  [ Wd,  Ws,  eW,  Tg,  Tg,  Tg,  Ts,  eE,  Ws,  Wm,  Wd,  Wd],  // 5  wide jungle body
  [ Wd,  Ws,  eW,  Ts,  Tg,  Tg, iNE,  eN,  eN, cNE,  Ws,  Wd],  // 6  peninsula juts east (inner corner)
  [ Wd,  Ws, cSW,  eS,  Ts,  Ts,  Ts,  Ts,  Ts,  eE,  Ws,  Wd],  // 7  south main + peninsula body
  [ Wd,  Wm,  Ws,  Ws, cSW,  eS,  eS,  eS,  eS, cSE,  Ws,  Wd],  // 8  peninsula south shore curves
  [ Wd,  Wd,  Wm,  Ws,  Ws,  Ws,  Ws,  Ws,  Ws,  Ws,  Wm,  Wd],  // 9  dispersing shallows
  [ Wd,  Wd,  Wd,  Wm,  Wm,  Wd,  Wd,  Wm,  Ws, cNW, cNE,  Wm],  // 10 deep + small reef isle
  [ Wd,  Wd,  Wd,  Wd,  Wd,  Wd,  Wd,  Wm,  Ws, cSW, cSE,  Wm],  // 11 reef isle south shore
];

// Cloud overlay — atmospheric wisps at edges
const clouds = [
  [41,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 40],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [40,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0, 41,  0,  0,  0,  0, 40],
];

const TILE_FILES = {
  1:  '01-water-deep',  2:  '02-water-mid',
  3:  '03-water-shallow', 4:  '04-water-foam',
  10: '10-terrain-sand', 11: '11-terrain-grass',
  20: '20-edge-N',  21: '21-edge-S',
  22: '22-edge-E',  23: '23-edge-W',
  24: '24-edge-NE', 25: '25-edge-NW',
  26: '26-edge-SE', 27: '27-edge-SW',
  28: '28-edge-inner-NE', 29: '29-edge-inner-NW',
  30: '30-edge-inner-SE', 31: '31-edge-inner-SW',
  40: '40-cloud-thin', 41: '41-cloud-thick',
};

async function composeGrid() {
  const loaded = {};
  for (const [id, filename] of Object.entries(TILE_FILES)) {
    loaded[id] = await loadImage(path.join(OUT_DIR, `${filename}.png`));
  }
  
  const COLS = 12, ROWS = 12;
  const canvas = createCanvas(COLS * SIZE, ROWS * SIZE);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // Draw base tiles
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const id = grid[row][col];
      const img = loaded[id];
      if (img) ctx.drawImage(img, col * SIZE, row * SIZE, SIZE, SIZE);
    }
  }
  
  // Draw cloud overlay
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const id = clouds[row][col];
      if (id > 0 && loaded[id]) {
        ctx.drawImage(loaded[id], col * SIZE, row * SIZE, SIZE, SIZE);
      }
    }
  }
  
  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * SIZE, 0); ctx.lineTo(i * SIZE, ROWS * SIZE); ctx.stroke();
  }
  for (let i = 0; i <= ROWS; i++) {
    ctx.beginPath(); ctx.moveTo(0, i * SIZE); ctx.lineTo(COLS * SIZE, i * SIZE); ctx.stroke();
  }
  
  fs.writeFileSync(path.join(OUT_DIR, 'grid-12x12-island.png'), canvas.toBuffer('image/png'));
  console.log(`  ✓ grid-12x12-island.png (${COLS * SIZE}×${ROWS * SIZE})`);
  
  // Reference sheet
  const allIds = [1,2,3,4,10,11,20,21,22,23,24,25,26,27,28,29,30,31,40,41];
  const refW = allIds.length * SIZE;
  const refH = SIZE + 24;
  const ref = createCanvas(refW, refH);
  const rCtx = ref.getContext('2d');
  rCtx.imageSmoothingEnabled = false;
  
  // Checkerboard background (shows alpha for clouds)
  for (let y = 0; y < refH; y += 8) {
    for (let x = 0; x < refW; x += 8) {
      rCtx.fillStyle = ((x/8 + y/8) % 2 === 0) ? '#1a1a2e' : '#16162a';
      rCtx.fillRect(x, y, 8, 8);
    }
  }
  
  for (let i = 0; i < allIds.length; i++) {
    const img = loaded[allIds[i]];
    if (img) rCtx.drawImage(img, i * SIZE, 0, SIZE, SIZE);
    rCtx.fillStyle = '#90a0b0';
    rCtx.font = 'bold 11px monospace';
    rCtx.fillText(`${allIds[i]}`, i * SIZE + 4, SIZE + 14);
  }
  
  fs.writeFileSync(path.join(OUT_DIR, 'tile-reference-sheet.png'), ref.toBuffer('image/png'));
  console.log(`  ✓ tile-reference-sheet.png (${refW}×${refH})`);
  
  console.log('\n✅ All v2 tiles generated!');
}

composeGrid().catch(err => { console.error(err); process.exit(1); });

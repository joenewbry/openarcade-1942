#!/usr/bin/env node
/**
 * BETA Tile Generator — Organic & Textured Approach
 * 
 * Philosophy: Hand-painted feel with atmospheric depth.
 * - Perlin-ish noise for organic variation
 * - Gradient overlays for depth and lighting
 * - Dithering for retro texture
 * - Natural color variation within each tile
 * 
 * Native: 16x16 pixel art, rendered at 4x = 64x64
 * All tiles seamlessly tileable where appropriate.
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const NATIVE = 16;   // Native pixel art resolution
const SCALE = 4;     // 4x upscale
const SIZE = NATIVE * SCALE; // 64px output

const OUTPUT_DIR = __dirname;

// ── Seeded RNG ──
function seededRNG(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

// ── Simple value noise (organic feel) ──
function makeNoise2D(seed) {
  const rng = seededRNG(seed);
  const grid = [];
  for (let i = 0; i < 256; i++) {
    grid[i] = rng();
  }
  
  function hash(x, y) {
    return grid[((x * 73 + y * 179) & 255)];
  }
  
  function lerp(a, b, t) {
    // Smooth hermite interpolation
    const st = t * t * (3 - 2 * t);
    return a + (b - a) * st;
  }
  
  return function noise(fx, fy) {
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const dx = fx - ix;
    const dy = fy - iy;
    
    const v00 = hash(ix, iy);
    const v10 = hash(ix + 1, iy);
    const v01 = hash(ix, iy + 1);
    const v11 = hash(ix + 1, iy + 1);
    
    return lerp(lerp(v00, v10, dx), lerp(v01, v11, dx), dy);
  };
}

// ── Fractal Brownian Motion ──
function fbm(noise, x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let totalAmp = 0;
  
  for (let i = 0; i < octaves; i++) {
    value += noise(x * frequency, y * frequency) * amplitude;
    totalAmp += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  
  return value / totalAmp;
}

// ── Color utilities ──
function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lerpColor(c1, c2, t) {
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
  };
}

function colorVariation(base, noise, amount) {
  return {
    r: base.r + (noise - 0.5) * amount * 2,
    g: base.g + (noise - 0.5) * amount * 2,
    b: base.b + (noise - 0.5) * amount * 2,
  };
}

// ── Coral Front Palette ──
const PALETTE = {
  // Water
  waterDeep1: hexToRGB('#0a2840'),    // Darkest depth (darker)
  waterDeep2: hexToRGB('#123c5e'),    // Deep blue
  waterMid:   hexToRGB('#1a6b94'),    // Medium
  waterLight: hexToRGB('#2590b8'),    // Lighter areas
  waterShallow1: hexToRGB('#42c0d8'), // Shallow cyan (brighter)
  waterShallow2: hexToRGB('#68d8ec'), // Lightest shallow (brighter)
  waterFoam:  hexToRGB('#e8f4f8'),    // White foam
  waterFoam2: hexToRGB('#b8e0ec'),    // Off-white foam
  
  // Terrain
  sandLight:  hexToRGB('#e8d5a0'),    // Light warm sand
  sandMid:    hexToRGB('#d4bd7a'),    // Mid sand
  sandDark:   hexToRGB('#c4a862'),    // Shadow sand
  sandWet:    hexToRGB('#b09858'),    // Wet sand near water
  
  grassLight: hexToRGB('#5a9a50'),    // Bright grass (slightly desaturated)
  grassMid:   hexToRGB('#4a8040'),    // Mid grass
  grassDark:  hexToRGB('#3a6832'),    // Dark vegetation
  grassDeep:  hexToRGB('#2e5428'),    // Deep shadow
  
  rockLight:  hexToRGB('#9a8e78'),    // Light rock
  rockMid:    hexToRGB('#7a7060'),    // Mid rock
  rockDark:   hexToRGB('#5e5648'),    // Dark rock
  
  // Shore/Edge
  shoreWet:   hexToRGB('#6ab8c8'),    // Wet shore blue
  shoreFoam:  hexToRGB('#c8e8f0'),    // Shore foam
  
  // Clouds
  cloudWhite: hexToRGB('#ffffff'),
  cloudLight: hexToRGB('#e8f0f8'),
  cloudMid:   hexToRGB('#c8d8e8'),
  cloudDark:  hexToRGB('#98a8b8'),
  cloudStorm: hexToRGB('#586878'),
};

// ── Pixel art tile painter ──
// Works at NATIVE resolution, then upscales
function createTile(paintFn, seed = 42) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  
  // Paint at native resolution conceptually
  // Each "pixel" is SCALE x SCALE on the output canvas
  const noise = makeNoise2D(seed);
  
  const setPixel = (x, y, color) => {
    if (x < 0 || x >= NATIVE || y < 0 || y >= NATIVE) return;
    if (typeof color === 'string') {
      ctx.fillStyle = color;
    } else {
      ctx.fillStyle = rgbToHex(color.r, color.g, color.b);
    }
    ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
  };
  
  const setPixelAlpha = (x, y, color, alpha) => {
    if (x < 0 || x >= NATIVE || y < 0 || y >= NATIVE) return;
    const r = Math.round(Math.max(0, Math.min(255, color.r)));
    const g = Math.round(Math.max(0, Math.min(255, color.g)));
    const b = Math.round(Math.max(0, Math.min(255, color.b)));
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
  };
  
  paintFn({ setPixel, setPixelAlpha, noise, ctx, NATIVE, SCALE, fbm: (x, y, oct) => fbm(noise, x, y, oct) });
  
  return canvas;
}

// ══════════════════════════════════════════════
// ██ WATER TILES
// ══════════════════════════════════════════════

function paintDeepWater({ setPixel, noise, fbm }) {
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.15 + 0.5, y * 0.15 + 0.5, 3);
      const n2 = fbm(x * 0.25 + 10, y * 0.25 + 10, 2);
      
      // Base: deep blue gradient
      const base = lerpColor(PALETTE.waterDeep1, PALETTE.waterDeep2, n1);
      
      // Occasional slightly lighter swirl
      const swirl = n2 > 0.6 ? 0.15 : 0;
      const c = lerpColor(base, PALETTE.waterMid, swirl);
      
      // Subtle vertical gradient (slightly lighter at top for depth feel)
      const gradientT = y / NATIVE * 0.1;
      const final = lerpColor(c, PALETTE.waterDeep1, gradientT);
      
      setPixel(x, y, final);
    }
  }
  
  // Add subtle caustic highlights (2-3 bright spots)
  const rng = seededRNG(777);
  for (let i = 0; i < 3; i++) {
    const cx = Math.floor(rng() * 12) + 2;
    const cy = Math.floor(rng() * 12) + 2;
    if (rng() > 0.4) {
      setPixel(cx, cy, lerpColor(PALETTE.waterDeep2, PALETTE.waterMid, 0.3));
    }
  }
}

function paintShallowWater({ setPixel, noise, fbm }) {
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.18 + 3, y * 0.18 + 3, 3);
      const n2 = fbm(x * 0.3 + 20, y * 0.3 + 20, 2);
      
      // Lighter, more cyan base
      const base = lerpColor(PALETTE.waterShallow1, PALETTE.waterMid, n1 * 0.6);
      
      // Gentle ripple highlights
      const ripple = Math.sin((x + y * 0.7) * 0.8 + n2 * 4) * 0.5 + 0.5;
      const c = lerpColor(base, PALETTE.waterShallow2, ripple * 0.25);
      
      // Sandy undertone showing through
      const sandShow = n2 > 0.65 ? 0.08 : 0;
      const final = lerpColor(c, PALETTE.sandWet, sandShow);
      
      setPixel(x, y, final);
    }
  }
}

function paintDarkWater({ setPixel, noise, fbm }) {
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.12 + 7, y * 0.12 + 7, 3);
      const n2 = noise(x * 0.2 + 50, y * 0.2 + 50);
      
      // Medium-depth blue-green (distinct from deep, not just darker)
      const darkBase = { r: 14, g: 52, b: 72 };
      const darkMid = { r: 18, g: 62, b: 85 };
      
      const base = lerpColor(darkBase, darkMid, n1);
      
      // Subtle greenish tint to differentiate from deep blue
      const greenTint = { r: 12, g: 58, b: 68 };
      const c = lerpColor(base, greenTint, n2 * 0.2);
      
      // Occasional deeper shadow
      const shadow = n2 > 0.75 ? 0.1 : 0;
      const final = lerpColor(c, { r: 8, g: 30, b: 50 }, shadow);
      
      setPixel(x, y, final);
    }
  }
}

function paintFoamWater({ setPixel, noise, fbm }) {
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.2 + 5, y * 0.2 + 5, 3);
      const n2 = fbm(x * 0.35 + 15, y * 0.35 + 15, 2);
      
      // Light cyan base
      const base = lerpColor(PALETTE.waterShallow2, PALETTE.waterShallow1, n1 * 0.5);
      
      // Foam streaks (organic diagonal patterns)
      const foamIntensity = fbm(x * 0.4 + 2, y * 0.3, 2);
      const isFoam = foamIntensity > 0.52;
      
      let c;
      if (isFoam) {
        const foamT = (foamIntensity - 0.52) / 0.48;
        c = lerpColor(PALETTE.waterFoam2, PALETTE.waterFoam, foamT * 0.6);
      } else {
        c = base;
      }
      
      // Dither some foam edges for organic feel
      if (foamIntensity > 0.48 && foamIntensity < 0.55 && ((x + y) % 2 === 0)) {
        c = lerpColor(c, PALETTE.waterFoam2, 0.3);
      }
      
      setPixel(x, y, c);
    }
  }
}

// ══════════════════════════════════════════════
// ██ TERRAIN TILES
// ══════════════════════════════════════════════

function paintSand({ setPixel, noise, fbm }) {
  const rng = seededRNG(101);
  
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.2 + 1, y * 0.2 + 1, 3);
      const n2 = noise(x * 0.5 + 30, y * 0.5 + 30);
      
      // Warm sand gradient with organic variation
      const base = lerpColor(PALETTE.sandLight, PALETTE.sandMid, n1 * 0.7);
      
      // Scattered darker grains
      const grain = n2 > 0.7 ? 0.2 : (n2 > 0.6 ? 0.08 : 0);
      const c = lerpColor(base, PALETTE.sandDark, grain);
      
      // Subtle dune shadow (sine wave)
      const dune = Math.sin(x * 0.4 + n1 * 3) * 0.5 + 0.5;
      const final = lerpColor(c, PALETTE.sandDark, dune * 0.08);
      
      setPixel(x, y, final);
    }
  }
  
  // A few highlight grains
  for (let i = 0; i < 4; i++) {
    const gx = Math.floor(rng() * NATIVE);
    const gy = Math.floor(rng() * NATIVE);
    setPixel(gx, gy, lerpColor(PALETTE.sandLight, { r: 240, g: 225, b: 190 }, 0.5));
  }
}

function paintGrass({ setPixel, noise, fbm }) {
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.18 + 2, y * 0.18 + 2, 4);
      const n2 = fbm(x * 0.35 + 40, y * 0.35 + 40, 2);
      const n3 = noise(x * 0.6, y * 0.6);
      
      // Rich green base with depth
      const base = lerpColor(PALETTE.grassMid, PALETTE.grassLight, n1 * 0.6);
      
      // Dark clumps (vegetation clusters)
      const clump = n2 > 0.55 ? (n2 - 0.55) / 0.45 : 0;
      const c = lerpColor(base, PALETTE.grassDark, clump * 0.5);
      
      // Scattered bright highlights (sunlit leaves)
      const highlight = n3 > 0.75 ? 0.15 : 0;
      const withLight = lerpColor(c, PALETTE.grassLight, highlight);
      
      // Deep shadow pockets
      const shadow = n1 < 0.3 ? (0.3 - n1) / 0.3 * 0.25 : 0;
      const final = lerpColor(withLight, PALETTE.grassDeep, shadow);
      
      setPixel(x, y, final);
    }
  }
}

function paintRock({ setPixel, noise, fbm }) {
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.2, y * 0.2, 3);
      const n2 = noise(x * 0.4 + 60, y * 0.4 + 60);
      
      // Grey-brown base
      const base = lerpColor(PALETTE.rockLight, PALETTE.rockMid, n1 * 0.7);
      
      // Cracks/fissures (thin dark lines)
      const crack = Math.abs(Math.sin(x * 1.2 + n1 * 8) * Math.cos(y * 0.9 + n2 * 6));
      const isDark = crack < 0.12;
      const c = isDark ? lerpColor(base, PALETTE.rockDark, 0.6) : base;
      
      // Lichen/moss spots (subtle green tint)
      const moss = n2 > 0.75 ? 0.15 : 0;
      const final = lerpColor(c, PALETTE.grassDark, moss);
      
      setPixel(x, y, final);
    }
  }
}

function paintStructure({ setPixel, noise }) {
  // Concrete/runway look
  const concreteBase = { r: 140, g: 135, b: 125 };
  const concreteLight = { r: 165, g: 158, b: 148 };
  const concreteDark = { r: 105, g: 100, b: 92 };
  
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n = noise(x * 0.3 + 80, y * 0.3 + 80);
      const base = lerpColor(concreteBase, concreteLight, n * 0.4);
      
      // Grid lines for blocks/panels
      const isGridLine = (x % 5 === 0) || (y % 5 === 0);
      const c = isGridLine ? lerpColor(base, concreteDark, 0.4) : base;
      
      setPixel(x, y, c);
    }
  }
}

// ══════════════════════════════════════════════
// ██ EDGE TILES (terrain-to-water transitions)
// ══════════════════════════════════════════════

// Edge painting helper — blends terrain into water with organic shore
function paintEdge(direction, { setPixel, setPixelAlpha, noise, fbm }) {
  // Direction: which side of the ISLAND this edge is on
  // 'N' = north edge of island → water on top, terrain on bottom
  // 'S' = south edge → terrain on top, water on bottom
  // 'E' = east edge → terrain on left, water on right
  // 'W' = west edge → water on left, terrain on right
  
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.2 + 4, y * 0.2 + 4, 3);
      const n2 = noise(x * 0.4 + 25, y * 0.4 + 25);
      
      // t = terrain amount (0 = water, 1 = terrain)
      let t;
      const wobble = (n1 - 0.5) * 2.5; // Organic edge wobble
      
      switch (direction) {
        case 'N': t = (y + wobble) / NATIVE; break;        // terrain at bottom
        case 'S': t = 1 - (y + wobble) / NATIVE; break;    // terrain at top
        case 'E': t = 1 - (x + wobble) / NATIVE; break;    // terrain at left
        case 'W': t = (x + wobble) / NATIVE; break;        // terrain at right
      }
      
      t = Math.max(0, Math.min(1, t));
      
      if (t > 0.65) {
        // Terrain zone - sand
        const sandN = fbm(x * 0.2, y * 0.2, 2);
        const c = lerpColor(PALETTE.sandLight, PALETTE.sandMid, sandN * 0.5);
        setPixel(x, y, c);
      } else if (t > 0.4) {
        // Shore/wet sand zone
        const shoreT = (t - 0.4) / 0.25;
        const c = lerpColor(PALETTE.shoreWet, PALETTE.sandWet, shoreT);
        // Foam dots
        if (n2 > 0.6 && ((x + y) % 2 === 0)) {
          setPixel(x, y, lerpColor(c, PALETTE.shoreFoam, 0.4));
        } else {
          setPixel(x, y, c);
        }
      } else if (t > 0.2) {
        // Shallow water transition
        const waterT = (t - 0.2) / 0.2;
        const c = lerpColor(PALETTE.waterShallow1, PALETTE.shoreWet, waterT * 0.6);
        setPixel(x, y, c);
      } else {
        // Deep water
        const c = lerpColor(PALETTE.waterDeep2, PALETTE.waterMid, n1 * 0.4);
        setPixel(x, y, c);
      }
    }
  }
}

// Outer corner: terrain fills the inner quadrant
function paintCorner(direction, { setPixel, setPixelAlpha, noise, fbm }) {
  // NE outer corner = top-right of island → terrain in bottom-left, water in top-right
  // Uses diagonal approach: t based on sum/difference of normalized coords
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.2 + 8, y * 0.2 + 8, 3);
      const n2 = noise(x * 0.4 + 35, y * 0.4 + 35);
      const wobble = (n1 - 0.5) * 1.8;
      
      const nx = x / NATIVE;  // 0..1 left to right
      const ny = y / NATIVE;  // 0..1 top to bottom
      
      // t = terrain amount (0=water, 1=terrain)
      // For each corner, terrain is in the opposite quadrant
      let t;
      switch (direction) {
        case 'NE': t = (nx + ny) / 2 + wobble * 0.08; break;                  // terrain at bottom-left
        case 'NW': t = ((1 - nx) + ny) / 2 + wobble * 0.08; break;            // terrain at bottom-right
        case 'SE': t = ((1 - nx) + (1 - ny)) / 2 + wobble * 0.08; break;     // terrain at top-left
        case 'SW': t = (nx + (1 - ny)) / 2 + wobble * 0.08; break;            // terrain at top-right
      }
      
      t = Math.max(0, Math.min(1, t));
      
      if (t > 0.65) {
        const sandN = fbm(x * 0.2, y * 0.2, 2);
        setPixel(x, y, lerpColor(PALETTE.sandLight, PALETTE.sandMid, sandN * 0.5));
      } else if (t > 0.4) {
        const shoreT = (t - 0.4) / 0.25;
        const c = lerpColor(PALETTE.shoreWet, PALETTE.sandWet, shoreT);
        if (n2 > 0.55) setPixel(x, y, lerpColor(c, PALETTE.shoreFoam, 0.3));
        else setPixel(x, y, c);
      } else if (t > 0.2) {
        const waterT = (t - 0.2) / 0.2;
        setPixel(x, y, lerpColor(PALETTE.waterShallow1, PALETTE.shoreWet, waterT * 0.5));
      } else {
        setPixel(x, y, lerpColor(PALETTE.waterDeep2, PALETTE.waterMid, n1 * 0.4));
      }
    }
  }
}

// Inner corner: water pocket at the named corner, terrain fills rest
function paintInnerCorner(direction, { setPixel, noise, fbm }) {
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.2 + 12, y * 0.2 + 12, 3);
      const n2 = noise(x * 0.4 + 45, y * 0.4 + 45);
      const wobble = (n1 - 0.5) * 1.5;
      
      const nx = x / NATIVE;  // 0..1
      const ny = y / NATIVE;  // 0..1
      
      // t = terrain amount. Water pocket at the named corner.
      // Inner corners are mostly terrain with a small water scoop
      let waterDist;
      switch (direction) {
        case 'NE': waterDist = (1 - nx) + (1 - ny); break;  // water pocket at top-right
        case 'NW': waterDist = nx + (1 - ny); break;         // water pocket at top-left
        case 'SE': waterDist = (1 - nx) + ny; break;         // water pocket at bottom-right
        case 'SW': waterDist = nx + ny; break;                // water pocket at bottom-left
      }
      
      // t high = terrain, only small corner gets water
      const t = Math.max(0, Math.min(1, 1.3 - waterDist * 0.65 + wobble * 0.06));
      
      if (t > 0.6) {
        const sandN = fbm(x * 0.2, y * 0.2, 2);
        setPixel(x, y, lerpColor(PALETTE.sandLight, PALETTE.sandMid, sandN * 0.5));
      } else if (t > 0.35) {
        const shoreT = (t - 0.35) / 0.25;
        const c = lerpColor(PALETTE.shoreWet, PALETTE.sandWet, shoreT);
        if (n2 > 0.55) setPixel(x, y, lerpColor(c, PALETTE.shoreFoam, 0.3));
        else setPixel(x, y, c);
      } else if (t > 0.15) {
        const waterT = (t - 0.15) / 0.2;
        setPixel(x, y, lerpColor(PALETTE.waterShallow1, PALETTE.shoreWet, waterT * 0.5));
      } else {
        setPixel(x, y, lerpColor(PALETTE.waterDeep2, PALETTE.waterMid, n1 * 0.4));
      }
    }
  }
}

// ══════════════════════════════════════════════
// ██ CLOUD TILES (semi-transparent)
// ══════════════════════════════════════════════

function paintThinCloud({ setPixel, setPixelAlpha, noise, fbm }) {
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.18 + 6, y * 0.18 + 6, 3);
      const n2 = noise(x * 0.35 + 55, y * 0.35 + 55);
      
      // Wispy elongated cloud shape
      const stretch = fbm(x * 0.12, y * 0.25, 2); // Horizontal stretching
      const density = n1 * 0.5 + n2 * 0.3 + stretch * 0.2;
      
      if (density > 0.44) {
        const t = (density - 0.44) / 0.56;
        const alpha = Math.min(0.55, t * 0.55);
        const c = lerpColor(PALETTE.cloudLight, PALETTE.cloudWhite, t * 0.8);
        // Light blue shadow on bottom edge
        const shadowT = (y / NATIVE) * 0.2;
        const final = lerpColor(c, PALETTE.cloudMid, shadowT);
        setPixelAlpha(x, y, final, alpha);
      }
    }
  }
}

function paintThickCloud({ setPixel, setPixelAlpha, noise, fbm }) {
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.14 + 9, y * 0.14 + 9, 4);
      const n2 = noise(x * 0.28 + 65, y * 0.28 + 65);
      
      const density = n1 * 0.65 + n2 * 0.35;
      
      if (density > 0.28) {
        const t = (density - 0.28) / 0.72;
        const alpha = Math.min(0.88, t * 0.88);
        // Bright white core, blue-grey edges
        const c = lerpColor(PALETTE.cloudMid, PALETTE.cloudWhite, t * 0.75);
        // Stronger shadow at bottom for volume
        const shadowT = (y / NATIVE) * 0.25;
        const final = lerpColor(c, PALETTE.cloudDark, shadowT);
        // Top highlight
        const topLight = y < NATIVE * 0.3 ? (1 - y / (NATIVE * 0.3)) * 0.15 : 0;
        const withLight = lerpColor(final, PALETTE.cloudWhite, topLight);
        setPixelAlpha(x, y, withLight, alpha);
      }
    }
  }
}

function paintStormCloud({ setPixel, setPixelAlpha, noise, fbm }) {
  for (let y = 0; y < NATIVE; y++) {
    for (let x = 0; x < NATIVE; x++) {
      const n1 = fbm(x * 0.15 + 11, y * 0.15 + 11, 4);
      const n2 = noise(x * 0.3 + 75, y * 0.3 + 75);
      
      const density = n1 * 0.6 + n2 * 0.4;
      
      if (density > 0.22) {
        const t = (density - 0.22) / 0.78;
        const alpha = Math.min(0.92, t * 0.92);
        // Dark, moody colors with purple tint
        const stormPurple = { r: 68, g: 62, b: 88 };
        const c = lerpColor(PALETTE.cloudStorm, stormPurple, t * 0.3);
        // Strong bottom shadow
        const shadowT = (y / NATIVE) * 0.3;
        const final = lerpColor(c, { r: 40, g: 45, b: 55 }, shadowT);
        // Lightning highlights — brighter, more visible
        const lightning = n2 > 0.85 && n1 > 0.55 ? 0.45 : 0;
        const withFlash = lerpColor(final, PALETTE.cloudWhite, lightning);
        setPixelAlpha(x, y, withFlash, alpha);
      }
    }
  }
}

// ══════════════════════════════════════════════
// ██ GENERATE ALL TILES
// ══════════════════════════════════════════════

function generateAllTiles() {
  console.log('🎨 BETA Tile Generator — Organic & Textured');
  console.log('============================================\n');
  
  const tiles = {};
  
  // Water tiles
  console.log('💧 Generating water tiles...');
  tiles['water-deep']    = createTile(paintDeepWater, 100);
  tiles['water-shallow'] = createTile(paintShallowWater, 200);
  tiles['water-dark']    = createTile(paintDarkWater, 300);
  tiles['water-foam']    = createTile(paintFoamWater, 400);
  
  // Terrain tiles
  console.log('🏖️  Generating terrain tiles...');
  tiles['terrain-sand']      = createTile(paintSand, 500);
  tiles['terrain-grass']     = createTile(paintGrass, 600);
  tiles['terrain-rock']      = createTile(paintRock, 700);
  tiles['terrain-structure'] = createTile(paintStructure, 800);
  
  // Edge tiles
  console.log('🌊 Generating edge tiles...');
  const edgeDirs = ['N', 'S', 'E', 'W'];
  edgeDirs.forEach((dir, i) => {
    tiles[`edge-${dir}`] = createTile((tools) => paintEdge(dir, tools), 900 + i * 10);
  });
  
  // Outer corners
  console.log('📐 Generating corner tiles...');
  const cornerDirs = ['NE', 'NW', 'SE', 'SW'];
  cornerDirs.forEach((dir, i) => {
    tiles[`edge-${dir}`] = createTile((tools) => paintCorner(dir, tools), 1000 + i * 10);
  });
  
  // Inner corners
  console.log('📐 Generating inner corner tiles...');
  cornerDirs.forEach((dir, i) => {
    tiles[`edge-inner-${dir}`] = createTile((tools) => paintInnerCorner(dir, tools), 1100 + i * 10);
  });
  
  // Cloud tiles
  console.log('☁️  Generating cloud tiles...');
  tiles['cloud-thin']  = createTile(paintThinCloud, 1200);
  tiles['cloud-thick'] = createTile(paintThickCloud, 1300);
  tiles['cloud-storm'] = createTile(paintStormCloud, 1400);
  
  // Save individual tiles
  console.log('\n💾 Saving individual tiles...');
  for (const [name, canvas] of Object.entries(tiles)) {
    const filePath = path.join(OUTPUT_DIR, `${name}.png`);
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(filePath, buf);
    console.log(`  ✅ ${name}.png (${buf.length} bytes)`);
  }
  
  // ── Create spritesheets ──
  console.log('\n📦 Creating spritesheets...');
  
  // Water spritesheet (4 tiles horizontal)
  const waterNames = ['water-deep', 'water-shallow', 'water-dark', 'water-foam'];
  const waterSheet = createCanvas(SIZE * waterNames.length, SIZE);
  const waterCtx = waterSheet.getContext('2d');
  waterNames.forEach((name, i) => {
    waterCtx.drawImage(tiles[name], i * SIZE, 0);
  });
  const waterBuf = waterSheet.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'water-sheet.png'), waterBuf);
  console.log(`  ✅ water-sheet.png (${waterBuf.length} bytes)`);
  
  // Terrain spritesheet (5 tiles: empty + 4 types)
  // First tile is transparent (empty)
  const terrainNames = ['terrain-sand', 'terrain-grass', 'terrain-rock', 'terrain-structure'];
  const terrainSheet = createCanvas(SIZE * (terrainNames.length + 1), SIZE);
  const terrainCtx = terrainSheet.getContext('2d');
  // Tile 0 = empty/transparent (leave blank)
  terrainNames.forEach((name, i) => {
    terrainCtx.drawImage(tiles[name], (i + 1) * SIZE, 0);
  });
  const terrainBuf = terrainSheet.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'terrain-sheet.png'), terrainBuf);
  console.log(`  ✅ terrain-sheet.png (${terrainBuf.length} bytes)`);
  
  // Edge spritesheet (all edges + corners: 12 tiles)
  const edgeNames = [
    'edge-N', 'edge-S', 'edge-E', 'edge-W',
    'edge-NE', 'edge-NW', 'edge-SE', 'edge-SW',
    'edge-inner-NE', 'edge-inner-NW', 'edge-inner-SE', 'edge-inner-SW',
  ];
  const edgeSheet = createCanvas(SIZE * edgeNames.length, SIZE);
  const edgeCtx = edgeSheet.getContext('2d');
  edgeNames.forEach((name, i) => {
    edgeCtx.drawImage(tiles[name], i * SIZE, 0);
  });
  const edgeBuf = edgeSheet.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'edge-sheet.png'), edgeBuf);
  console.log(`  ✅ edge-sheet.png (${edgeBuf.length} bytes)`);
  
  // Cloud spritesheet (3 tiles)
  const cloudNames = ['cloud-thin', 'cloud-thick', 'cloud-storm'];
  const cloudSheet = createCanvas(SIZE * cloudNames.length, SIZE);
  const cloudCtx = cloudSheet.getContext('2d');
  cloudNames.forEach((name, i) => {
    cloudCtx.drawImage(tiles[name], i * SIZE, 0);
  });
  const cloudBuf = cloudSheet.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'cloud-sheet.png'), cloudBuf);
  console.log(`  ✅ cloud-sheet.png (${cloudBuf.length} bytes)`);
  
  // ── Create 12x12 island demo grid ──
  console.log('\n🗺️  Creating 12x12 island demo grid...');
  
  // Layout: A natural island in the middle of ocean
  // Legend:
  //   0 = deep water, 1 = shallow water, 2 = dark water, 3 = foam
  //   S = sand, G = grass, R = rock
  //   eN/eS/eE/eW = edges, cNE etc = corners, iNE etc = inner corners
  
  const GRID_SIZE = 12;
  const grid = createCanvas(SIZE * GRID_SIZE, SIZE * GRID_SIZE);
  const gridCtx = grid.getContext('2d');
  
  // Clean island layout — organic shape with consistent shore ring
  const W = 'water-deep';
  const Ws = 'water-shallow';
  const Wd = 'water-dark';
  const Wf = 'water-foam';
  const S = 'terrain-sand';
  const G = 'terrain-grass';
  const R = 'terrain-rock';
  const eN = 'edge-N';
  const eS = 'edge-S';
  const eE = 'edge-E';
  const eW = 'edge-W';
  const cNE = 'edge-NE';
  const cNW = 'edge-NW';
  const cSE = 'edge-SE';
  const cSW = 'edge-SW';
  
  const layout = [
    // Row 0: Deep ocean
    [ W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
    // Row 1: Shallow reef approaches (hints at island below)
    [ W,  W,  W,  W, Ws, Ws, Ws, Ws,  W,  W,  W,  W],
    // Row 2: North tip — island starts narrow
    [ W,  W,  W, Ws,cNW, eN, eN,cNE, Ws,  W,  W,  W],
    // Row 3: Widens — sand beach and first vegetation
    [ W,  W, Ws,cNW,  S,  S,  G,  S, eE, Ws,  W,  W],
    // Row 4: Main body — lush interior
    [ W,  W, Ws, eW,  S,  G,  G,  G,  S, eE, Ws,  W],
    // Row 5: Core — rock outcrop, dense jungle
    [ W, Ws, Ws, eW,  G,  G,  R,  G,  G, eE, Ws,  W],
    // Row 6: Island maintains width, sand fringe east
    [ W,  W, Ws, eW,  S,  G,  G,  S,  S, eE, Ws,  W],
    // Row 7: Begins to narrow south — peninsula feel
    [ W,  W, Ws,cSW, eS,  S,  S, eS,cSE, Ws,  W,  W],
    // Row 8: Trailing shallow water, foam at reef
    [ W,  W,  W, Ws, Ws, Wf, Wf, Ws, Ws,  W,  W,  W],
    // Row 9: Scattered shallows fade to deep
    [ W,  W,  W,  W, Ws, Ws, Ws,  W,  W,  W,  W,  W],
    // Row 10: Open deep ocean
    [ W,  W,  W,  W,  W,  W,  W,  W, Wd,  W,  W,  W],
    // Row 11: Deep ocean
    [ W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W,  W],
  ];
  
  // Draw the grid
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tileName = layout[row][col];
      if (tiles[tileName]) {
        gridCtx.drawImage(tiles[tileName], col * SIZE, row * SIZE);
      } else {
        // Fallback: draw deep water
        gridCtx.drawImage(tiles['water-deep'], col * SIZE, row * SIZE);
      }
    }
  }
  
  // Overlay a few clouds (scattered over open water areas)
  const cloudPositions = [
    { tile: 'cloud-thin', col: 8, row: 0 },
    { tile: 'cloud-thin', col: 9, row: 0 },
    { tile: 'cloud-thick', col: 10, row: 6 },
    { tile: 'cloud-thick', col: 11, row: 7 },
    { tile: 'cloud-thin', col: 6, row: 10 },
    { tile: 'cloud-storm', col: 0, row: 11 },
    { tile: 'cloud-thin', col: 7, row: 11 },
  ];
  
  for (const cp of cloudPositions) {
    if (tiles[cp.tile]) {
      gridCtx.drawImage(tiles[cp.tile], cp.col * SIZE, cp.row * SIZE);
    }
  }
  
  const gridBuf = grid.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'island-demo-12x12.png'), gridBuf);
  console.log(`  ✅ island-demo-12x12.png (${gridBuf.length} bytes)`);
  
  console.log('\n🎉 All tiles generated successfully!');
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  
  return Object.keys(tiles);
}

generateAllTiles();

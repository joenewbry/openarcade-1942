export const TILE_SIZE = 64;
export const MAP_COLS = 15;
export const MAP_VISIBLE_ROWS = 20;

// Each campaign specifies map length. Longer maps = longer levels.
export const CAMPAIGN_MAP_ROWS = {
  coral_front: 120,
  jungle_spear: 150,
  dust_convoy: 180,
  iron_monsoon: 200,
};

const CAMPAIGN_IDS = new Set(Object.keys(CAMPAIGN_MAP_ROWS));

const TILE_PALETTES = {
  coral_front: {
    water: { 1: '#19466b', 2: '#1c5d8f', 3: '#22729e', 4: '#a9d8f0' },
    terrain: {
      10: '#d5bc84', 11: '#4b7c45', 12: '#8a7a5e', 13: '#6b5d42', 14: '#8b7a5e',
      20: '#d2bd8c', 21: '#c5af7f', 22: '#ccb689', 23: '#bda878',
      24: '#d8c99c', 25: '#d8c99c', 26: '#c9b98d', 27: '#c9b98d',
      28: '#b7a57d', 29: '#b7a57d', 30: '#aa9a74', 31: '#aa9a74',
    },
    clouds: { 40: 'rgba(238,249,255,0.40)', 41: 'rgba(243,251,255,0.58)', 42: 'rgba(155,171,184,0.48)' },
  },
  jungle_spear: {
    water: { 1: '#25442f', 2: '#3a6a4f', 3: '#4d8768', 4: '#8ab89f' },
    terrain: {
      10: '#5a8842', 11: '#2d5420', 12: '#6e7c55', 13: '#4a3f2d', 14: '#5f6948',
      20: '#648851', 21: '#587648', 22: '#617f4f', 23: '#516c42',
      24: '#6a8f56', 25: '#6a8f56', 26: '#5b7a4a', 27: '#5b7a4a',
      28: '#4d653f', 29: '#4d653f', 30: '#415638', 31: '#415638',
    },
    clouds: { 40: 'rgba(222,245,228,0.34)', 41: 'rgba(229,248,235,0.50)', 42: 'rgba(118,141,122,0.52)' },
  },
  dust_convoy: {
    water: { 1: '#68452b', 2: '#91643d', 3: '#a47848', 4: '#d8be92' },
    terrain: {
      10: '#be8a52', 11: '#d4a065', 12: '#9a7040', 13: '#786030', 14: '#8c6f3d',
      20: '#bf8c53', 21: '#a77747', 22: '#b7834d', 23: '#9f7043',
      24: '#c6965f', 25: '#c6965f', 26: '#ad7f4e', 27: '#ad7f4e',
      28: '#956b45', 29: '#956b45', 30: '#835d3d', 31: '#835d3d',
    },
    clouds: { 40: 'rgba(245,232,198,0.36)', 41: 'rgba(247,237,210,0.52)', 42: 'rgba(149,128,95,0.46)' },
  },
  iron_monsoon: {
    water: { 1: '#1d2238', 2: '#2e3455', 3: '#3a4268', 4: '#9cb1d1' },
    terrain: {
      10: '#4b5578', 11: '#596286', 12: '#3d4560', 13: '#68739a', 14: '#536181',
      20: '#505a7a', 21: '#46506f', 22: '#4d5776', 23: '#434d6a',
      24: '#596485', 25: '#596485', 26: '#4b5674', 27: '#4b5674',
      28: '#404963', 29: '#404963', 30: '#343c54', 31: '#343c54',
    },
    clouds: { 40: 'rgba(219,228,243,0.28)', 41: 'rgba(226,236,250,0.44)', 42: 'rgba(102,113,140,0.56)' },
  },
};

const LEGACY_TO_NEW_WATER = { 0: 1, 1: 3, 2: 2, 3: 4 };
const LEGACY_TO_NEW_TERRAIN = { 0: 0, 1: 10, 2: 11, 3: 12, 4: 13 };

const WATER_FRAME_BY_ID = { 1: 0, 2: 1, 3: 2, 4: 3 };
const TERRAIN_FRAME_BY_ID = { 10: 0, 11: 1, 12: 2, 13: 3, 14: 4 };
const CLOUD_FRAME_BY_ID = { 40: 1, 41: 2, 42: 3 };

const TILEMAP_CACHE = {};
const TILEMAP_LOADING = {};

const ATLAS_CACHE = new Map();
const SPRITE_KEY_BLOCKLIST = new Set();

function isBrowserRuntime() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function seededRand(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) / 4294967296);
  };
}

function createGrid(rows, cols, fill = 0) {
  const grid = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols);
    for (let c = 0; c < cols; c++) row[c] = fill;
    grid[r] = row;
  }
  return grid;
}

function clampCampaignId(campaignId) {
  if (CAMPAIGN_IDS.has(campaignId)) return campaignId;
  return 'coral_front';
}

function normalizeGrid(grid, rows, cols, fallback = 0, mapFn = null) {
  const out = createGrid(rows, cols, fallback);
  if (!Array.isArray(grid)) return out;

  const maxRows = Math.min(rows, grid.length);
  for (let r = 0; r < maxRows; r++) {
    const srcRow = grid[r];
    if (!Array.isArray(srcRow)) continue;
    const maxCols = Math.min(cols, srcRow.length);
    for (let c = 0; c < maxCols; c++) {
      const v = Number(srcRow[c]);
      if (!Number.isFinite(v)) continue;
      out[r][c] = mapFn ? mapFn(v) : v;
    }
  }
  return out;
}

function normalizeGroundEnemies(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const item of input) {
    if (!item || typeof item !== 'object') continue;
    const col = Number(item.col);
    const row = Number(item.row);
    if (!Number.isInteger(col) || !Number.isInteger(row)) continue;
    out.push({
      ...item,
      col,
      row,
      type: item.type || 'bunker',
      facing: item.facing || 'south',
      waveEffects: [],
      lastWaveSpawn: 0,
    });
  }
  return out;
}

function normalizeLevelToTilemap(rawLevel, fallbackCampaignId, fallbackRows) {
  const campaignId = clampCampaignId(rawLevel?.campaign || rawLevel?.campaignId || fallbackCampaignId);
  const rows = Math.max(1, Number(rawLevel?.rows || fallbackRows || CAMPAIGN_MAP_ROWS[campaignId]));
  const cols = Math.max(1, Number(rawLevel?.cols || MAP_COLS));

  const hasNewLayers = Boolean(rawLevel?.layers && typeof rawLevel.layers === 'object');

  const waterLayer = hasNewLayers
    ? normalizeGrid(rawLevel.layers.water, rows, cols, 1)
    : normalizeGrid(rawLevel?.waterLayer, rows, cols, 1, (legacy) => LEGACY_TO_NEW_WATER[legacy] ?? 1);

  const terrainLayer = hasNewLayers
    ? normalizeGrid(rawLevel.layers.terrain, rows, cols, 0)
    : normalizeGrid(rawLevel?.terrainLayer, rows, cols, 0, (legacy) => LEGACY_TO_NEW_TERRAIN[legacy] ?? 0);

  const cloudLayer = hasNewLayers
    ? normalizeGrid(rawLevel.layers.clouds, rows, cols, 0)
    : normalizeGrid(rawLevel?.cloudLayer, rows, cols, 0);

  const groundEnemySlots = normalizeGroundEnemies(rawLevel?.groundEnemies || rawLevel?.groundEnemySlots);

  return {
    campaignId,
    cols,
    rows,
    tileSize: TILE_SIZE,
    waterLayer,
    terrainLayer,
    cloudLayer,
    groundEnemySlots,
    source: hasNewLayers ? 'level-v1' : 'legacy',
  };
}

function generateIsland(rng, cols, startRow, width, height) {
  const tiles = [];
  const cx = Math.floor(rng() * Math.max(1, (cols - width - 2))) + 1;
  const cy = startRow;

  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const nx = (dx - width / 2) / (width / 2);
      const ny = (dy - height / 2) / (height / 2);
      const dist = nx * nx + ny * ny;
      const noise = rng() * 0.3;
      if (dist + noise < 1.0) {
        let id;
        if (dist > 0.62) id = 10;
        else if (dist > 0.32) id = 11;
        else id = rng() < 0.3 ? 12 : 11;
        tiles.push({ col: cx + dx, row: cy + dy, id });
      }
    }
  }
  return tiles;
}

function generateChannel(rng, cols, startRow, length) {
  const tiles = [];
  let cx = Math.floor(rng() * Math.max(1, cols - 4)) + 2;
  for (let i = 0; i < length; i++) {
    cx += Math.floor(rng() * 3) - 1;
    cx = Math.max(1, Math.min(cols - 3, cx));
    const width = 2 + Math.floor(rng() * 2);
    for (let dx = 0; dx < width; dx++) {
      tiles.push({ col: cx + dx, row: startRow + i, id: 3 });
    }
  }
  return tiles;
}

// Legacy/export path: procedural generation when no authored level exists.
export function generateTilemap(campaignId, mapRows = 120) {
  const normalizedCampaign = clampCampaignId(campaignId);
  const seed = normalizedCampaign.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = seededRand(seed * 7919);

  const rows = Math.max(1, mapRows);
  const cols = MAP_COLS;
  const waterLayer = createGrid(rows, cols, 1);
  const terrainLayer = createGrid(rows, cols, 0);
  const cloudLayer = createGrid(rows, cols, 0);
  const groundEnemySlots = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const roll = rng();
      if (roll < 0.08) waterLayer[r][c] = 4;
      else if (roll < 0.28) waterLayer[r][c] = 2;
      else if (roll < 0.52) waterLayer[r][c] = 3;
      else waterLayer[r][c] = 1;

      if (rng() < 0.05) {
        cloudLayer[r][c] = rng() < 0.7 ? 40 : 41;
      }
    }
  }

  const channelCount = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < channelCount; i++) {
    const startRow = Math.floor(rng() * Math.max(1, rows - 20));
    const length = 10 + Math.floor(rng() * 20);
    const tiles = generateChannel(rng, cols, startRow, length);
    for (const t of tiles) {
      if (t.row >= 0 && t.row < rows && t.col >= 0 && t.col < cols) {
        waterLayer[t.row][t.col] = t.id;
      }
    }
  }

  const islandCount = 8 + Math.floor(rng() * 6);
  for (let i = 0; i < islandCount; i++) {
    const startRow = Math.floor(rng() * Math.max(1, rows - 10));
    const width = 3 + Math.floor(rng() * 5);
    const height = 2 + Math.floor(rng() * 4);
    const island = generateIsland(rng, cols, startRow, width, height);

    for (const t of island) {
      if (t.row >= 0 && t.row < rows && t.col >= 0 && t.col < cols) {
        terrainLayer[t.row][t.col] = t.id;
      }
    }

    if (island.length > 4 && rng() < 0.6) {
      const center = island[Math.floor(island.length / 2)];
      if (center) {
        groundEnemySlots.push({
          col: center.col,
          row: center.row,
          type: 'bunker',
          facing: 'south',
          waveEffects: [],
          lastWaveSpawn: 0,
        });
      }
    }
  }

  const shipCount = 4 + Math.floor(rng() * 4);
  for (let i = 0; i < shipCount; i++) {
    const row = 10 + Math.floor(rng() * Math.max(1, rows - 20));
    const col = 1 + Math.floor(rng() * (cols - 3));
    if (terrainLayer[row][col] !== 0) continue;

    const shipType = rng() < 0.4 ? 'battleship' : 'ship';
    const slot = {
      col,
      row,
      type: shipType,
      facing: 'south',
      waveEffects: [],
      lastWaveSpawn: 0,
    };

    if (shipType === 'battleship') {
      slot.turrets = [
        { x: 16, y: 8, type: 'cannon', hp: 30 },
        { x: 48, y: 8, type: 'cannon', hp: 30 },
        { x: 32, y: 24, type: 'small', hp: 20 },
      ];
    } else {
      slot.turrets = [
        { x: 24, y: 12, type: 'small', hp: 20 },
        { x: 40, y: 12, type: 'small', hp: 20 },
      ];
    }

    groundEnemySlots.push(slot);
  }

  return {
    campaignId: normalizedCampaign,
    cols,
    rows,
    tileSize: TILE_SIZE,
    waterLayer,
    terrainLayer,
    cloudLayer,
    groundEnemySlots,
    source: 'procedural',
  };
}

function startLevelLoad(campaignId, targetTilemap, fallbackRows) {
  if (!isBrowserRuntime() || TILEMAP_LOADING[campaignId]) return;
  TILEMAP_LOADING[campaignId] = true;

  fetch(`levels/${campaignId}.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`level ${campaignId} missing`);
      return response.json();
    })
    .then((rawLevel) => normalizeLevelToTilemap(rawLevel, campaignId, fallbackRows))
    .then((loadedTilemap) => {
      targetTilemap.cols = loadedTilemap.cols;
      targetTilemap.rows = loadedTilemap.rows;
      targetTilemap.tileSize = TILE_SIZE;
      targetTilemap.waterLayer = loadedTilemap.waterLayer;
      targetTilemap.terrainLayer = loadedTilemap.terrainLayer;
      targetTilemap.cloudLayer = loadedTilemap.cloudLayer;
      targetTilemap.groundEnemySlots = loadedTilemap.groundEnemySlots;
      targetTilemap.source = loadedTilemap.source;
    })
    .catch(() => {
      // Keep procedural fallback if authored level is unavailable.
    });
}

// Runtime path: returns an immediate fallback tilemap and upgrades it asynchronously.
export function getCampaignTilemap(campaignId, fallbackRows = 120) {
  const normalizedCampaign = clampCampaignId(campaignId);
  if (!TILEMAP_CACHE[normalizedCampaign]) {
    TILEMAP_CACHE[normalizedCampaign] = generateTilemap(normalizedCampaign, fallbackRows);
    startLevelLoad(normalizedCampaign, TILEMAP_CACHE[normalizedCampaign], fallbackRows);
  }
  return TILEMAP_CACHE[normalizedCampaign];
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to load ${url}`);
  }
  return response.json();
}

function getOrCreateAtlasEntry(campaignId) {
  if (ATLAS_CACHE.has(campaignId)) return ATLAS_CACHE.get(campaignId);

  const entry = {
    status: 'loading',
    water: null,
    terrain: null,
    clouds: null,
    promise: null,
  };

  ATLAS_CACHE.set(campaignId, entry);

  if (!isBrowserRuntime()) {
    entry.status = 'failed';
    return entry;
  }

  const base = `assets/tiles/${campaignId}`;

  entry.promise = Promise.allSettled([
    Promise.all([loadImage(`${base}/water.png`), loadJson(`${base}/water.json`)]),
    Promise.all([loadImage(`${base}/terrain.png`), loadJson(`${base}/terrain.json`)]),
    Promise.all([loadImage('assets/tiles/shared/clouds.png'), loadJson('assets/tiles/shared/clouds.json')]),
  ]).then((results) => {
    const [waterResult, terrainResult, cloudResult] = results;

    if (waterResult.status === 'fulfilled') {
      const [image, meta] = waterResult.value;
      entry.water = { image, meta };
    }

    if (terrainResult.status === 'fulfilled') {
      const [image, meta] = terrainResult.value;
      entry.terrain = { image, meta };
    }

    if (cloudResult.status === 'fulfilled') {
      const [image, meta] = cloudResult.value;
      entry.clouds = { image, meta };
    }

    entry.status = (entry.water || entry.terrain || entry.clouds) ? 'ready' : 'failed';
  }).catch(() => {
    entry.status = 'failed';
  });

  return entry;
}

function getFrame(meta, frameKey) {
  if (!meta || !meta.frames) return null;
  const frame = meta.frames[String(frameKey)];
  if (!frame) return null;
  if (frame.frame) return frame.frame;
  if (typeof frame.x === 'number') return frame;
  return null;
}

function resolveFrameForTile(layerName, atlasMeta, tileId) {
  const candidates = [String(tileId)];

  if (layerName === 'waterLayer' && WATER_FRAME_BY_ID[tileId] != null) {
    candidates.push(String(WATER_FRAME_BY_ID[tileId]));
  } else if (layerName === 'terrainLayer' && TERRAIN_FRAME_BY_ID[tileId] != null) {
    candidates.push(String(TERRAIN_FRAME_BY_ID[tileId]));
  } else if (layerName === 'cloudLayer' && CLOUD_FRAME_BY_ID[tileId] != null) {
    candidates.push(String(CLOUD_FRAME_BY_ID[tileId]));
  }

  for (const key of candidates) {
    const frame = getFrame(atlasMeta, key);
    if (frame) return frame;
  }

  return null;
}

function getTileAtlasLayerEntry(campaignId, layerName) {
  const atlasEntry = getOrCreateAtlasEntry(campaignId);
  if (atlasEntry.status !== 'ready') return null;
  if (layerName === 'waterLayer') return atlasEntry.water;
  if (layerName === 'terrainLayer') return atlasEntry.terrain;
  if (layerName === 'cloudLayer') return atlasEntry.clouds;
  return null;
}

function makeTileSpriteName(campaignId, layerName, tileId) {
  return `tile:${campaignId}:${layerName}:${tileId}`;
}

function buildFrameCanvas(image, frame) {
  const canvas = document.createElement('canvas');
  canvas.width = frame.w;
  canvas.height = frame.h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
  return canvas;
}

function drawTileSprite(renderer, campaignId, layerName, tileId, x, y, alpha = 1) {
  if (!renderer || typeof renderer.drawSprite !== 'function' || typeof renderer.loadSpriteTexture !== 'function') {
    return false;
  }

  const spriteName = makeTileSpriteName(campaignId, layerName, tileId);
  if (renderer.hasSpriteTexture(spriteName)) {
    renderer.drawSprite(spriteName, x, y, TILE_SIZE, TILE_SIZE, alpha);
    return true;
  }

  if (SPRITE_KEY_BLOCKLIST.has(spriteName) || !isBrowserRuntime()) {
    return false;
  }

  const layerEntry = getTileAtlasLayerEntry(campaignId, layerName);
  if (!layerEntry || !layerEntry.image || !layerEntry.meta) {
    return false;
  }

  const frame = resolveFrameForTile(layerName, layerEntry.meta, tileId);
  if (!frame) {
    SPRITE_KEY_BLOCKLIST.add(spriteName);
    return false;
  }

  try {
    const frameCanvas = buildFrameCanvas(layerEntry.image, frame);
    renderer.loadSpriteTexture(spriteName, frameCanvas);
    renderer.drawSprite(spriteName, x, y, TILE_SIZE, TILE_SIZE, alpha);
    return true;
  } catch {
    SPRITE_KEY_BLOCKLIST.add(spriteName);
    return false;
  }
}

function normalizeDrawTileId(layerName, tileId) {
  if (layerName === 'waterLayer' && tileId === 0) return 1;
  return tileId;
}

function drawFallbackTile(renderer, palette, layerName, tileId, x, y, alpha) {
  if (tileId === 0) return;

  let color = '#7a879c';
  if (layerName === 'waterLayer') color = palette.water[tileId] || palette.water[1] || color;
  else if (layerName === 'terrainLayer') color = palette.terrain[tileId] || color;
  else if (layerName === 'cloudLayer') color = palette.clouds[tileId] || 'rgba(210,220,235,0.40)';

  if (layerName === 'cloudLayer') {
    const clamped = Math.max(0, Math.min(1, alpha));
    if (color.startsWith('rgba(')) {
      const parts = color.slice(5, -1).split(',').map((part) => part.trim());
      const baseAlpha = Number(parts[3]);
      const outAlpha = Number.isFinite(baseAlpha) ? baseAlpha * clamped : clamped;
      renderer.fillRect(x, y, TILE_SIZE, TILE_SIZE, `rgba(${parts[0]},${parts[1]},${parts[2]},${outAlpha.toFixed(3)})`);
      return;
    }
  }

  renderer.fillRect(x, y, TILE_SIZE, TILE_SIZE, color);
}

export function drawTilemapLayer(renderer, tilemap, layerName, palette, scrollY, alpha = 1) {
  const layer = tilemap?.[layerName];
  if (!Array.isArray(layer) || !tilemap.rows || !tilemap.cols) return;

  const startRow = Math.floor(scrollY / TILE_SIZE) - 1;
  const endRow = startRow + MAP_VISIBLE_ROWS + 3;

  for (let r = startRow; r <= endRow; r++) {
    const mapRow = ((r % tilemap.rows) + tilemap.rows) % tilemap.rows;
    const screenY = r * TILE_SIZE - scrollY;
    if (screenY > 1280 + TILE_SIZE || screenY < -TILE_SIZE) continue;

    const row = layer[mapRow];
    if (!Array.isArray(row)) continue;

    for (let c = 0; c < tilemap.cols; c++) {
      const rawTileId = Number(row[c]) || 0;
      const tileId = normalizeDrawTileId(layerName, rawTileId);
      if (tileId === 0) continue;

      const x = c * TILE_SIZE;
      if (!drawTileSprite(renderer, tilemap.campaignId, layerName, tileId, x, screenY, alpha)) {
        drawFallbackTile(renderer, palette, layerName, tileId, x, screenY, alpha);
      }
    }
  }
}

// Draw ground enemies (bunkers/ships) attached to the terrain layer.
export function drawGroundEnemies(renderer, text, tilemap, palette, scrollY, tick) {
  for (const slot of tilemap.groundEnemySlots) {
    const screenX = slot.col * TILE_SIZE;
    const screenY = slot.row * TILE_SIZE - scrollY;

    if (screenY > 1280 + TILE_SIZE || screenY < -TILE_SIZE * 2) continue;

    if (slot.type === 'bunker') {
      const bx = screenX + 8;
      const by = screenY + 8;
      const bw = TILE_SIZE - 16;
      const bh = TILE_SIZE - 16;
      renderer.fillRect(bx, by, bw, bh, '#5a5a5a');
      renderer.fillRect(bx + 4, by + 4, bw - 8, bh - 8, '#4a4a4a');
      renderer.fillRect(bx + bw / 2 - 6, by + bh / 2 - 2, 12, 4, '#222');

      const angle = Math.sin(tick * 0.02 + slot.col) * 0.5;
      const barrelLen = 14;
      const cx = bx + bw / 2;
      const cy = by + bh / 2;
      const ex = cx + Math.sin(angle) * barrelLen;
      const ey = cy + Math.cos(angle) * barrelLen;
      renderer.fillRect(
        Math.min(cx, ex),
        Math.min(cy, ey),
        Math.abs(ex - cx) + 3,
        Math.abs(ey - cy) + 3,
        '#333',
      );
    } else if (slot.type === 'ship' || slot.type === 'battleship') {
      const shipScale = slot.type === 'battleship' ? 3.5 : 2.2;
      const sx = screenX - (TILE_SIZE * 0.3);
      const sy = screenY;
      const sw = TILE_SIZE * shipScale;
      const sh = TILE_SIZE * (shipScale * 0.8);

      renderer.fillRect(sx + 4, sy + 8, sw - 8, sh - 16, '#4a4a4a');
      renderer.fillRect(sx + 8, sy + 12, sw - 16, sh - 24, '#3a3a3a');
      renderer.fillRect(sx + 12, sy + 16, sw - 24, sh - 32, '#5a5a5a');

      const bridgeW = sw * 0.3;
      const bridgeX = sx + sw / 2 - bridgeW / 2;
      renderer.fillRect(bridgeX, sy + sh * 0.3, bridgeW, sh * 0.2, '#606060');

      renderer.fillRect(sx + sw / 2 - 8, sy - 6, 16, 14, '#4a4a4a');
      renderer.fillRect(sx + sw / 2 - 4, sy - 10, 8, 10, '#4a4a4a');

      const wakeW = sw * 0.6;
      const wakeX = sx + sw / 2 - wakeW / 2;
      renderer.fillRect(wakeX, sy + sh, wakeW, 20, 'rgba(255,255,255,0.25)');
      renderer.fillRect(wakeX + 8, sy + sh + 16, wakeW - 16, 16, 'rgba(255,255,255,0.15)');

      renderer.fillRect(sx + 8, sy + sh * 0.8, 8, sh * 0.3, 'rgba(255,255,255,0.1)');
      renderer.fillRect(sx + sw - 16, sy + sh * 0.8, 8, sh * 0.3, 'rgba(255,255,255,0.1)');
    }
  }
}

export function getTilePalette(campaignId) {
  const id = clampCampaignId(campaignId);
  return TILE_PALETTES[id] || TILE_PALETTES.coral_front;
}

// Wave effects system: wakes render above water and below enemy/projectile layers.
export function spawnWaveEffect(ship, type, offsetX = 0, offsetY = 0) {
  if (!ship.waveEffects) ship.waveEffects = [];

  if (ship.waveEffects.length >= 4) {
    ship.waveEffects.shift();
  }

  const waveEffect = {
    type,
    x: ship.col * TILE_SIZE + offsetX,
    y: ship.row * TILE_SIZE + offsetY,
    life: 60,
    maxLife: 60,
    velocityX: Math.random() * 2 - 1,
    velocityY: 1 + Math.random() * 2,
  };

  ship.waveEffects.push(waveEffect);
}

export function updateWaveEffects(tilemap, tick) {
  for (const ship of tilemap.groundEnemySlots) {
    if (ship.type !== 'ship' && ship.type !== 'battleship') continue;

    if (!ship.waveEffects) ship.waveEffects = [];
    if (!Number.isFinite(ship.lastWaveSpawn)) ship.lastWaveSpawn = 0;

    if (tick - ship.lastWaveSpawn > 30 + Math.random() * 30) {
      const shipScale = ship.type === 'battleship' ? 3.5 : 2.2;
      const shipHeight = TILE_SIZE * (shipScale * 0.8);
      spawnWaveEffect(ship, 'wake', 0, shipHeight);

      if (Math.random() < 0.3) {
        const shipWidth = TILE_SIZE * shipScale;
        spawnWaveEffect(ship, 'splash', -shipWidth * 0.4, shipHeight * 0.6);
        spawnWaveEffect(ship, 'splash', shipWidth * 0.4, shipHeight * 0.6);
      }

      if (Math.random() < 0.4) {
        spawnWaveEffect(
          ship,
          'foam',
          (Math.random() - 0.5) * TILE_SIZE * 2,
          shipHeight + Math.random() * 20,
        );
      }

      ship.lastWaveSpawn = tick;
    }

    for (let i = ship.waveEffects.length - 1; i >= 0; i--) {
      const wave = ship.waveEffects[i];
      wave.life -= 1;
      wave.x += wave.velocityX;
      wave.y += wave.velocityY;
      if (wave.life <= 0) {
        ship.waveEffects.splice(i, 1);
      }
    }
  }
}

export function drawWaveEffects(renderer, tilemap, scrollY) {
  for (const ship of tilemap.groundEnemySlots) {
    if (ship.type !== 'ship' && ship.type !== 'battleship') continue;
    if (!Array.isArray(ship.waveEffects)) continue;

    for (const wave of ship.waveEffects) {
      const screenX = wave.x;
      const screenY = wave.y - scrollY;
      if (screenY > 1280 + 32 || screenY < -32) continue;

      const alpha = Math.max(0, Math.min(1, wave.life / wave.maxLife));
      if (wave.type === 'wake') drawWakeEffect(renderer, screenX, screenY, alpha);
      else if (wave.type === 'splash') drawSplashEffect(renderer, screenX, screenY, alpha);
      else if (wave.type === 'foam') drawFoamEffect(renderer, screenX, screenY, alpha);
    }
  }
}

function drawWakeEffect(renderer, x, y, alpha) {
  const fadeAlpha = (alpha * 0.8).toFixed(2);
  const lightAlpha = (alpha * 0.4).toFixed(2);

  for (let i = 0; i < 8; i++) {
    renderer.fillRect(x + 8 - i, y + 8 + i, 2, 1, `rgba(255,255,255,${fadeAlpha})`);
    renderer.fillRect(x + 24 + i, y + 8 + i, 2, 1, `rgba(255,255,255,${fadeAlpha})`);
  }

  for (let i = 0; i < 6; i++) {
    renderer.fillRect(x + 10 - i, y + 10 + i, 1, 1, `rgba(255,255,255,${lightAlpha})`);
    renderer.fillRect(x + 22 + i, y + 10 + i, 1, 1, `rgba(255,255,255,${lightAlpha})`);
  }
}

function drawSplashEffect(renderer, x, y, alpha) {
  const centerX = x + 16;
  const centerY = y + 8;

  const outerAlpha = (alpha * 0.6).toFixed(2);
  const innerAlpha = (alpha * 0.8).toFixed(2);
  const coreAlpha = alpha.toFixed(2);

  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
    const px = Math.floor(centerX + Math.cos(angle) * 7);
    const py = Math.floor(centerY + Math.sin(angle) * 4);
    renderer.fillRect(px, py, 2, 2, `rgba(255,255,255,${outerAlpha})`);
  }

  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
    const px = Math.floor(centerX + Math.cos(angle) * 4);
    const py = Math.floor(centerY + Math.sin(angle) * 2);
    renderer.fillRect(px, py, 2, 1, `rgba(255,255,255,${innerAlpha})`);
  }

  renderer.fillRect(centerX - 1, centerY - 1, 3, 2, `rgba(255,255,255,${coreAlpha})`);
}

function drawFoamEffect(renderer, x, y, alpha) {
  const foamAlpha = (alpha * 0.9).toFixed(2);
  const lightFoam = (alpha * 0.7).toFixed(2);
  const speckleAlpha = (alpha * 0.5).toFixed(2);

  const patches = [
    { x: x + 2, y: y + 2, w: 4, h: 3 },
    { x: x + 8, y: y + 1, w: 6, h: 2 },
    { x: x + 18, y: y + 3, w: 5, h: 4 },
    { x: x + 26, y: y + 1, w: 4, h: 3 },
    { x: x + 1, y: y + 8, w: 5, h: 3 },
    { x: x + 12, y: y + 10, w: 7, h: 4 },
    { x: x + 22, y: y + 9, w: 6, h: 4 },
  ];

  for (const patch of patches) {
    renderer.fillRect(patch.x, patch.y, patch.w, patch.h, `rgba(255,255,255,${foamAlpha})`);
  }

  const dots = [
    { x: x + 7, y: y + 5, w: 2, h: 2 },
    { x: x + 15, y: y + 1, w: 2, h: 1 },
    { x: x + 25, y: y + 6, w: 2, h: 2 },
    { x: x + 11, y: y + 7, w: 1, h: 2 },
  ];

  for (const dot of dots) {
    renderer.fillRect(dot.x, dot.y, dot.w, dot.h, `rgba(255,255,255,${lightFoam})`);
  }

  for (let i = 0; i < 8; i++) {
    const px = x + Math.floor(Math.random() * 32);
    const py = y + Math.floor(Math.random() * 16);
    renderer.fillRect(px, py, 1, 1, `rgba(255,255,255,${speckleAlpha})`);
  }
}

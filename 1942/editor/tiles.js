export const GRID_COLS = 15;
export const GRID_ROWS = 150;
export const TILE_SIZE = 64;

export const CAMPAIGNS = [
  { id: "coral_front", label: "Coral Front" },
  { id: "jungle_spear", label: "Jungle Spear" },
  { id: "dust_convoy", label: "Dust Convoy" },
  { id: "iron_monsoon", label: "Iron Monsoon" },
];

export const LAYERS = ["water", "terrain", "clouds", "entities"];

export const TILE_CATALOG = [
  { id: 0, name: "empty", layer: "water" },
  { id: 1, name: "water-deep", layer: "water" },
  { id: 2, name: "water-mid", layer: "water" },
  { id: 3, name: "water-shallow", layer: "water" },
  { id: 4, name: "water-foam", layer: "water" },

  { id: 0, name: "empty", layer: "terrain" },
  { id: 10, name: "terrain-sand", layer: "terrain" },
  { id: 11, name: "terrain-grass", layer: "terrain" },
  { id: 12, name: "terrain-rock", layer: "terrain" },
  { id: 13, name: "terrain-structure", layer: "terrain" },
  { id: 14, name: "terrain-path", layer: "terrain" },
  { id: 20, name: "edge-N", layer: "terrain" },
  { id: 21, name: "edge-S", layer: "terrain" },
  { id: 22, name: "edge-E", layer: "terrain" },
  { id: 23, name: "edge-W", layer: "terrain" },
  { id: 24, name: "edge-NE", layer: "terrain" },
  { id: 25, name: "edge-NW", layer: "terrain" },
  { id: 26, name: "edge-SE", layer: "terrain" },
  { id: 27, name: "edge-SW", layer: "terrain" },
  { id: 28, name: "edge-inner-NE", layer: "terrain" },
  { id: 29, name: "edge-inner-NW", layer: "terrain" },
  { id: 30, name: "edge-inner-SE", layer: "terrain" },
  { id: 31, name: "edge-inner-SW", layer: "terrain" },

  { id: 0, name: "empty", layer: "clouds" },
  { id: 40, name: "cloud-thin", layer: "clouds" },
  { id: 41, name: "cloud-thick", layer: "clouds" },
  { id: 42, name: "cloud-storm", layer: "clouds" },
];

const TILE_NAME_MAP = new Map(TILE_CATALOG.map((entry) => [`${entry.layer}:${entry.id}`, entry.name]));

const DEFAULT_FALLBACK_COLORS = {
  1: "#1f5f99",
  2: "#357db8",
  3: "#64a8d8",
  4: "#c4ebff",
  10: "#d9ba7b",
  11: "#5f9348",
  12: "#6d7280",
  13: "#7d7366",
  14: "#938468",
  20: "#b2ae97",
  21: "#a8a389",
  22: "#a39f8a",
  23: "#989380",
  24: "#b7af96",
  25: "#b7af96",
  26: "#a49f88",
  27: "#a49f88",
  28: "#8a8678",
  29: "#8a8678",
  30: "#7a7669",
  31: "#7a7669",
  40: "rgba(236, 251, 255, 0.48)",
  41: "rgba(243, 250, 255, 0.66)",
  42: "rgba(112, 124, 139, 0.62)",
};

const CAMPAIGN_TINTS = {
  coral_front: "rgba(84, 190, 255, 0.12)",
  jungle_spear: "rgba(84, 161, 90, 0.14)",
  dust_convoy: "rgba(199, 139, 64, 0.14)",
  iron_monsoon: "rgba(79, 95, 136, 0.14)",
};

const CAMPAIGN_ALIASES = {
  coral_front: ["coral_front", "coral-front", "alpha"],
  jungle_spear: ["jungle_spear", "jungle-spear", "beta"],
  dust_convoy: ["dust_convoy", "dust-convoy", "gamma"],
  iron_monsoon: ["iron_monsoon", "iron-monsoon", "delta"],
};

const WATER_ID_TO_FRAME = { 1: 0, 2: 1, 3: 2, 4: 3 };
const TERRAIN_ID_TO_FRAME = { 10: 0, 11: 1, 12: 2, 13: 3, 14: 4 };
const CLOUD_ID_TO_FRAME = { 40: 0, 41: 1, 42: 2 };

const TILE_IMAGE_BASENAMES = {
  1: ["water-deep", "01-water-deep"],
  2: ["water-mid", "water-dark", "02-water-mid"],
  3: ["water-shallow", "03-water-shallow"],
  4: ["water-foam", "04-water-foam"],
  10: ["terrain-sand", "sand", "10-terrain-sand"],
  11: ["terrain-grass", "grass", "11-terrain-grass", "terrain-steel", "terrain-deck"],
  12: ["terrain-rock", "rock", "terrain-platform"],
  13: ["terrain-structure", "structure"],
  14: ["terrain-path", "path"],
  20: ["edge-N", "20-edge-N"],
  21: ["edge-S", "21-edge-S"],
  22: ["edge-E", "22-edge-E"],
  23: ["edge-W", "23-edge-W"],
  24: ["edge-NE", "24-edge-NE"],
  25: ["edge-NW", "25-edge-NW"],
  26: ["edge-SE", "26-edge-SE"],
  27: ["edge-SW", "27-edge-SW"],
  28: ["edge-inner-NE", "inner-NE", "28-edge-inner-NE"],
  29: ["edge-inner-NW", "inner-NW", "29-edge-inner-NW"],
  30: ["edge-inner-SE", "inner-SE", "30-edge-inner-SE"],
  31: ["edge-inner-SW", "inner-SW", "31-edge-inner-SW"],
  40: ["cloud-thin", "40-cloud-thin"],
  41: ["cloud-thick", "41-cloud-thick"],
  42: ["cloud-storm"],
};

const IMAGE_CACHE = new Map();

function tileKey(layer, id) {
  return `${layer}:${id}`;
}

function campaignIdFromAlias(campaignInput) {
  if (!campaignInput) return "coral_front";
  const normalized = String(campaignInput).trim().toLowerCase();

  for (const [canonical, aliases] of Object.entries(CAMPAIGN_ALIASES)) {
    if (canonical === normalized || aliases.includes(normalized)) {
      return canonical;
    }
  }

  return normalized;
}

function campaignSearchDirs(campaignId) {
  const aliases = CAMPAIGN_ALIASES[campaignId] || [campaignId];
  const dirs = new Set();

  dirs.add(campaignId);
  dirs.add(campaignId.replace(/_/g, "-"));
  dirs.add(campaignId.replace(/-/g, "_"));

  for (const alias of aliases) {
    dirs.add(alias);
    dirs.add(alias.replace(/_/g, "-"));
    dirs.add(alias.replace(/-/g, "_"));
  }

  return [...dirs].map((dir) => `../assets/tiles/${dir}`);
}

function createSolidTile(color, size = TILE_SIZE) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const cctx = c.getContext("2d");
  cctx.fillStyle = color;
  cctx.fillRect(0, 0, size, size);
  return c;
}

async function loadImage(url) {
  if (IMAGE_CACHE.has(url)) {
    return IMAGE_CACHE.get(url);
  }
  const image = new Image();
  image.decoding = "async";
  const loaded = new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${url}`));
  });
  image.src = url;
  IMAGE_CACHE.set(url, loaded);
  return loaded;
}

async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url}`);
  }
  return response.json();
}

async function tryLoadImage(url) {
  try {
    return await loadImage(url);
  } catch {
    return null;
  }
}

async function tryLoadJson(url) {
  try {
    return await loadJson(url);
  } catch {
    return null;
  }
}

async function loadFirstJson(paths) {
  for (const path of paths) {
    const meta = await tryLoadJson(path);
    if (meta) {
      return { path, meta };
    }
  }
  return { path: null, meta: null };
}

async function loadFirstImage(paths) {
  for (const path of paths) {
    const image = await tryLoadImage(path);
    if (image) {
      return { path, image };
    }
  }
  return { path: null, image: null };
}

function getFrame(meta, frameIndex) {
  if (!meta || !meta.frames) return null;
  const frame = meta.frames[String(frameIndex)];
  if (!frame) return null;
  return {
    x: frame.x,
    y: frame.y,
    w: frame.w,
    h: frame.h,
  };
}

function imageCandidatesForTile(baseDirs, tileId) {
  const names = TILE_IMAGE_BASENAMES[tileId] || [];
  const suffixes = ["", "-64", "-16"];
  const extensions = [".png", ".jpg", ".jpeg"];
  const relativeDirs = ["", "clean", "enhanced"];

  const candidates = [];
  for (const baseDir of baseDirs) {
    for (const relativeDir of relativeDirs) {
      const dir = relativeDir ? `${baseDir}/${relativeDir}` : baseDir;
      for (const name of names) {
        for (const suffix of suffixes) {
          const basename = `${name}${suffix}`;
          for (const extension of extensions) {
            candidates.push(`${dir}/${basename}${extension}`);
          }
        }
      }
    }
  }
  return candidates;
}

async function loadLooseTileImages(baseDirs) {
  const loaded = new Map();
  const loadTasks = [];

  for (const entry of TILE_CATALOG) {
    if (entry.id === 0) continue;
    const key = tileKey(entry.layer, entry.id);
    const candidates = imageCandidatesForTile(baseDirs, entry.id);
    loadTasks.push(
      loadFirstImage(candidates).then(({ image, path }) => {
        if (image) {
          loaded.set(key, { image, path });
        }
      }),
    );
  }

  await Promise.all(loadTasks);
  return loaded;
}

function registerFrameTiles(tileMap, layer, idToFrame, image, meta) {
  for (const [tileIdText, frameIndex] of Object.entries(idToFrame)) {
    const tileId = Number(tileIdText);
    const frame = getFrame(meta, frameIndex);
    if (!frame || !image) continue;
    tileMap.set(tileKey(layer, tileId), { image, frame, source: "sheet" });
  }
}

function buildTileMap(campaign, assets) {
  const tileMap = new Map();

  registerFrameTiles(tileMap, "water", WATER_ID_TO_FRAME, assets.waterImage, assets.waterMeta);
  registerFrameTiles(tileMap, "terrain", TERRAIN_ID_TO_FRAME, assets.terrainImage, assets.terrainMeta);
  registerFrameTiles(tileMap, "clouds", CLOUD_ID_TO_FRAME, assets.cloudImage, assets.cloudMeta);

  for (const entry of TILE_CATALOG) {
    if (entry.id === 0) continue;
    const key = tileKey(entry.layer, entry.id);

    if (!tileMap.has(key)) {
      const loose = assets.looseTiles.get(key);
      if (loose?.image) {
        tileMap.set(key, {
          image: loose.image,
          frame: { x: 0, y: 0, w: loose.image.width, h: loose.image.height },
          source: "loose",
        });
      }
    }

    if (!tileMap.has(key)) {
      tileMap.set(key, {
        image: createSolidTile(DEFAULT_FALLBACK_COLORS[entry.id]),
        frame: { x: 0, y: 0, w: TILE_SIZE, h: TILE_SIZE },
        source: "fallback",
      });
    }
  }

  return {
    campaign,
    tileMap,
    fallbackColors: { ...DEFAULT_FALLBACK_COLORS },
    campaignTint: CAMPAIGN_TINTS[campaign] || "transparent",
  };
}

export function normalizeCampaignId(campaignInput) {
  return campaignIdFromAlias(campaignInput);
}

export async function loadCampaignTileSet(campaignInput) {
  const campaign = campaignIdFromAlias(campaignInput);
  const baseDirs = campaignSearchDirs(campaign);

  const [waterJson, terrainJson, cloudJson, waterPng, terrainPng, cloudPng, looseTiles] = await Promise.all([
    loadFirstJson(baseDirs.map((base) => `${base}/water.json`)),
    loadFirstJson(baseDirs.map((base) => `${base}/terrain.json`)),
    loadFirstJson(baseDirs.map((base) => `${base}/clouds.json`)),
    loadFirstImage(baseDirs.map((base) => `${base}/water.png`)),
    loadFirstImage(baseDirs.map((base) => `${base}/terrain.png`)),
    loadFirstImage(baseDirs.map((base) => `${base}/clouds.png`)),
    loadLooseTileImages(baseDirs),
  ]);

  return buildTileMap(campaign, {
    waterImage: waterPng.image,
    terrainImage: terrainPng.image,
    cloudImage: cloudPng.image,
    waterMeta: waterJson.meta,
    terrainMeta: terrainJson.meta,
    cloudMeta: cloudJson.meta,
    looseTiles,
  });
}

export function createGrid(rows = GRID_ROWS, cols = GRID_COLS, initial = 0) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => initial));
}

export function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

export function tileNameFor(layer, id) {
  return TILE_NAME_MAP.get(`${layer}:${id}`) || `tile-${id}`;
}

export function layerPalette(layer) {
  return TILE_CATALOG.filter((entry) => entry.layer === layer);
}

export function drawTile(ctx, tileSet, layer, tileId, dx, dy, size = TILE_SIZE, alpha = 1) {
  if (tileId === 0) return;

  const mapped = tileSet.tileMap.get(tileKey(layer, tileId));
  ctx.save();
  ctx.globalAlpha = alpha;

  if (mapped && mapped.image && mapped.frame) {
    const { image, frame } = mapped;
    ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, dx, dy, size, size);
  } else {
    ctx.fillStyle = tileSet.fallbackColors[tileId] || "#8e9bb0";
    ctx.fillRect(dx, dy, size, size);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(dx + 2, dy + size - 16, 22, 14);
    ctx.fillStyle = "#ffffff";
    ctx.font = "11px monospace";
    ctx.fillText(String(tileId), dx + 4, dy + size - 5);
  }

  ctx.restore();
}

export function isWater(id) {
  return id >= 1 && id <= 4;
}

export function isEdgeId(id) {
  return id >= 20 && id <= 31;
}

function getWaterNeighbor(grid, row, col) {
  if (row < 0 || col < 0 || row >= grid.length || col >= grid[0].length) {
    return true;
  }
  return isWater(grid[row][col]);
}

function pickByPreference(currentId, preferredA, preferredB) {
  if (currentId === preferredA || currentId === preferredB) {
    return currentId;
  }
  return preferredA;
}

export function computeAutoEdgeId(waterGrid, row, col, currentId = null) {
  const n = getWaterNeighbor(waterGrid, row - 1, col);
  const s = getWaterNeighbor(waterGrid, row + 1, col);
  const e = getWaterNeighbor(waterGrid, row, col + 1);
  const w = getWaterNeighbor(waterGrid, row, col - 1);
  const ne = getWaterNeighbor(waterGrid, row - 1, col + 1);
  const nw = getWaterNeighbor(waterGrid, row - 1, col - 1);
  const se = getWaterNeighbor(waterGrid, row + 1, col + 1);
  const sw = getWaterNeighbor(waterGrid, row + 1, col - 1);

  if (!n && !e && ne) return 28;
  if (!n && !w && nw) return 29;
  if (!s && !e && se) return 30;
  if (!s && !w && sw) return 31;

  const cardinalMask = (n ? 1 : 0) | (s ? 2 : 0) | (e ? 4 : 0) | (w ? 8 : 0);

  switch (cardinalMask) {
    case 0:
      return null;
    case 1:
      return 20;
    case 2:
      return 21;
    case 4:
      return 22;
    case 8:
      return 23;
    case 5:
      return 24;
    case 9:
      return 25;
    case 6:
      return 26;
    case 10:
      return 27;
    case 3:
      return pickByPreference(currentId, 20, 21);
    case 12:
      return pickByPreference(currentId, 22, 23);
    case 7:
      return pickByPreference(currentId, 22, 26);
    case 11:
      return pickByPreference(currentId, 23, 27);
    case 13:
      return pickByPreference(currentId, 20, 24);
    case 14:
      return pickByPreference(currentId, 21, 26);
    case 15:
      return currentId && isEdgeId(currentId) ? currentId : 24;
    default:
      return null;
  }
}

export function runAutoEdgeSelfTest() {
  const makeGrid = (cells) => {
    const grid = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (const [r, c] of cells) {
      grid[r][c] = 1;
    }
    return grid;
  };

  const tests = [
    { name: "straight-N", grid: makeGrid([[0, 1]]), expected: 20 },
    { name: "straight-S", grid: makeGrid([[2, 1]]), expected: 21 },
    { name: "straight-E", grid: makeGrid([[1, 2]]), expected: 22 },
    { name: "straight-W", grid: makeGrid([[1, 0]]), expected: 23 },
    { name: "outer-NE", grid: makeGrid([[0, 1], [1, 2]]), expected: 24 },
    { name: "outer-NW", grid: makeGrid([[0, 1], [1, 0]]), expected: 25 },
    { name: "outer-SE", grid: makeGrid([[2, 1], [1, 2]]), expected: 26 },
    { name: "outer-SW", grid: makeGrid([[2, 1], [1, 0]]), expected: 27 },
    { name: "inner-NE", grid: makeGrid([[0, 2]]), expected: 28 },
    { name: "inner-NW", grid: makeGrid([[0, 0]]), expected: 29 },
    { name: "inner-SE", grid: makeGrid([[2, 2]]), expected: 30 },
    { name: "inner-SW", grid: makeGrid([[2, 0]]), expected: 31 },
  ];

  const failures = [];
  for (const test of tests) {
    const actual = computeAutoEdgeId(test.grid, 1, 1, null);
    if (actual !== test.expected) {
      failures.push({ name: test.name, expected: test.expected, actual });
    }
  }

  return {
    passed: failures.length === 0,
    total: tests.length,
    failures,
  };
}

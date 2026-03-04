#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EDGE_IDS = {
  20: 'edge-N',
  21: 'edge-S',
  22: 'edge-E',
  23: 'edge-W',
  24: 'edge-NE',
  25: 'edge-NW',
  26: 'edge-SE',
  27: 'edge-SW',
  28: 'edge-inner-NE',
  29: 'edge-inner-NW',
  30: 'edge-inner-SE',
  31: 'edge-inner-SW',
};

const OUTER_RULES = {
  20: { n: 'water', s: 'land' },
  21: { n: 'land', s: 'water' },
  22: { e: 'water', w: 'land' },
  23: { e: 'land', w: 'water' },
  24: { n: 'water', e: 'water', s: 'land', w: 'land' },
  25: { n: 'water', w: 'water', s: 'land', e: 'land' },
  26: { s: 'water', e: 'water', n: 'land', w: 'land' },
  27: { s: 'water', w: 'water', n: 'land', e: 'land' },
};

const INNER_RULES = {
  28: { n: 'land', e: 'land', diag: ['ne', 'water'] },
  29: { n: 'land', w: 'land', diag: ['nw', 'water'] },
  30: { s: 'land', e: 'land', diag: ['se', 'water'] },
  31: { s: 'land', w: 'land', diag: ['sw', 'water'] },
};

function parseArgs(argv) {
  const opts = {
    strict: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--tileset') {
      opts.tileset = argv[++i];
    } else if (arg === '--level') {
      opts.level = argv[++i];
    } else if (arg === '--strict') {
      opts.strict = true;
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return opts;
}

function usage() {
  return [
    'Usage:',
    '  node 1942/tools/validation/edge-checker.js --tileset <tileset.json> [--level <level.json>] [--strict]',
    '',
    'Checks shoreline/corner IDs and optional level adjacency rules.',
  ].join('\n');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeLevel(level) {
  if (level.layers && level.layers.terrain && level.layers.water) {
    return {
      cols: level.cols,
      rows: level.rows,
      terrain: level.layers.terrain,
      water: level.layers.water,
    };
  }

  if (level.terrainLayer && level.waterLayer) {
    return {
      cols: level.cols,
      rows: level.rows,
      terrain: level.terrainLayer,
      water: level.waterLayer,
    };
  }

  throw new Error('Unsupported level format. Expected `layers.terrain/water` or `terrainLayer/waterLayer`.');
}

function validateEdgeCatalog(tiles) {
  const errors = [];
  const byId = new Map();
  const byName = new Map();

  for (const tile of tiles) {
    byId.set(tile.id, tile);
    byName.set(tile.name, tile);
  }

  for (const [idStr, expectedName] of Object.entries(EDGE_IDS)) {
    const id = Number(idStr);
    const tile = byId.get(id);
    if (!tile) {
      errors.push(`missing edge tile id ${id} (${expectedName})`);
      continue;
    }
    if (tile.name !== expectedName) {
      errors.push(`edge tile id ${id} expected name ${expectedName}, got ${tile.name}`);
    }
  }

  const seenEdgeNames = new Set(Object.values(EDGE_IDS));
  for (const name of seenEdgeNames) {
    if (!byName.has(name)) {
      errors.push(`missing edge tile name ${name}`);
    }
  }

  return errors;
}

function isLandTile(tileId) {
  if (tileId === 0 || tileId == null) return false;
  if (tileId >= 10 && tileId <= 14) return true;
  if (tileId >= 20 && tileId <= 31) return true;
  return false;
}

function inBounds(cols, rows, c, r) {
  return c >= 0 && c < cols && r >= 0 && r < rows;
}

function at(matrix, cols, rows, c, r, fallback = 0) {
  if (!inBounds(cols, rows, c, r)) return fallback;
  const row = matrix[r];
  if (!row) return fallback;
  return row[c] ?? fallback;
}

function neighbor(c, r, dir) {
  switch (dir) {
    case 'n': return [c, r - 1];
    case 's': return [c, r + 1];
    case 'e': return [c + 1, r];
    case 'w': return [c - 1, r];
    case 'ne': return [c + 1, r - 1];
    case 'nw': return [c - 1, r - 1];
    case 'se': return [c + 1, r + 1];
    case 'sw': return [c - 1, r + 1];
    default: throw new Error(`Unknown direction: ${dir}`);
  }
}

function neighborState(level, c, r, dir) {
  const [nc, nr] = neighbor(c, r, dir);
  const terrainId = at(level.terrain, level.cols, level.rows, nc, nr, 0);
  const waterId = at(level.water, level.cols, level.rows, nc, nr, 0);
  const land = isLandTile(terrainId);
  const water = !land && waterId > 0;
  if (land) return 'land';
  if (water) return 'water';
  return 'empty';
}

function validateEdgeAdjacency(level, strict = false) {
  const errors = [];
  const warnings = [];

  for (let r = 0; r < level.rows; r += 1) {
    for (let c = 0; c < level.cols; c += 1) {
      const terrainId = at(level.terrain, level.cols, level.rows, c, r, 0);
      if (!(terrainId >= 20 && terrainId <= 31)) {
        continue;
      }

      if (OUTER_RULES[terrainId]) {
        const rule = OUTER_RULES[terrainId];
        for (const [dir, expected] of Object.entries(rule)) {
          const actual = neighborState(level, c, r, dir);
          if (actual !== expected) {
            errors.push(`r${r} c${c} tile ${terrainId} (${EDGE_IDS[terrainId]}) expects ${dir}=${expected}, got ${actual}`);
          }
        }
      } else if (INNER_RULES[terrainId]) {
        const rule = INNER_RULES[terrainId];
        for (const [key, expected] of Object.entries(rule)) {
          if (key === 'diag') continue;
          const actual = neighborState(level, c, r, key);
          if (actual !== expected) {
            errors.push(`r${r} c${c} tile ${terrainId} (${EDGE_IDS[terrainId]}) expects ${key}=${expected}, got ${actual}`);
          }
        }

        const [diagDir, diagExpected] = rule.diag;
        const diagState = neighborState(level, c, r, diagDir);
        if (diagState !== diagExpected) {
          const msg = `r${r} c${c} tile ${terrainId} (${EDGE_IDS[terrainId]}) expects ${diagDir}=${diagExpected}, got ${diagState}`;
          if (strict) {
            errors.push(msg);
          } else {
            warnings.push(msg);
          }
        }
      }
    }
  }

  return { errors, warnings };
}

function runEdgeChecks(tilesetJson, levelJson, strict = false) {
  const tiles = Array.isArray(tilesetJson.tiles) ? tilesetJson.tiles : [];
  const errors = [];
  const warnings = [];

  errors.push(...validateEdgeCatalog(tiles));

  if (levelJson) {
    const level = normalizeLevel(levelJson);
    const result = validateEdgeAdjacency(level, strict);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return { errors, warnings };
}

function runCli() {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (err) {
    console.error(`error: ${err.message}`);
    console.error(usage());
    process.exit(2);
  }

  if (opts.help || !opts.tileset) {
    console.log(usage());
    process.exit(opts.help ? 0 : 2);
  }

  const tilesetPath = path.resolve(opts.tileset);
  const tilesetJson = readJson(tilesetPath);
  const levelJson = opts.level ? readJson(path.resolve(opts.level)) : null;

  const result = runEdgeChecks(tilesetJson, levelJson, opts.strict);

  if (result.warnings.length > 0) {
    console.warn(`edge-checker warnings: ${result.warnings.length}`);
    for (const warning of result.warnings) {
      console.warn(`  - ${warning}`);
    }
  }

  if (result.errors.length > 0) {
    console.error(`edge-checker errors: ${result.errors.length}`);
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log('edge-checker: OK');
}

if (require.main === module) {
  runCli();
}

module.exports = {
  EDGE_IDS,
  validateEdgeCatalog,
  validateEdgeAdjacency,
  runEdgeChecks,
  normalizeLevel,
};

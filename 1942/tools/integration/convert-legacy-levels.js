#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const WATER_MAP = {
  0: 1,
  1: 3,
  2: 2,
  3: 4,
};

const TERRAIN_MAP = {
  0: 0,
  1: 10,
  2: 11,
  3: 12,
  4: 13,
};

const DEFAULT_TILE_SIZE = 64;
const KNOWN_CAMPAIGNS = new Set(['coral_front', 'jungle_spear', 'dust_convoy', 'iron_monsoon']);

function parseArgs(argv) {
  const opts = { validate: true };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input') {
      opts.input = argv[++i];
    } else if (arg === '--output') {
      opts.output = argv[++i];
    } else if (arg === '--campaign') {
      opts.campaign = argv[++i];
    } else if (arg === '--name') {
      opts.name = argv[++i];
    } else if (arg === '--no-validate') {
      opts.validate = false;
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
    '  node 1942/tools/integration/convert-legacy-levels.js --input <legacy-file-or-dir> --output <new-file-or-dir> [--campaign coral_front] [--name "Coral Front - Level 1"] [--no-validate]',
    '',
    'Converts legacy 1942 level JSON into the tile-system-spec format.',
  ].join('\n');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensurePositiveInt(value, fallback) {
  const next = Number(value);
  return Number.isInteger(next) && next > 0 ? next : fallback;
}

function normalizeLayerGrid(grid, rows, cols, defaultValue, mapTable = null) {
  const out = Array.from({ length: rows }, () => Array.from({ length: cols }, () => defaultValue));
  if (!Array.isArray(grid)) return out;

  const maxRows = Math.min(rows, grid.length);
  for (let row = 0; row < maxRows; row += 1) {
    const sourceRow = grid[row];
    if (!Array.isArray(sourceRow)) continue;
    const maxCols = Math.min(cols, sourceRow.length);
    for (let col = 0; col < maxCols; col += 1) {
      const raw = Number(sourceRow[col]);
      if (!Number.isFinite(raw)) continue;
      const mapped = mapTable ? mapTable[raw] : raw;
      out[row][col] = mapped == null ? defaultValue : mapped;
    }
  }

  return out;
}

function zeroGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
}

function prettifyCampaignName(campaign) {
  return campaign
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferCampaignFromFilename(sourceLabel) {
  const base = path.basename(sourceLabel, path.extname(sourceLabel)).toLowerCase();
  const normalized = base.replace(/-/g, '_');
  if (KNOWN_CAMPAIGNS.has(normalized)) return normalized;
  return null;
}

function normalizeGroundEnemies(list) {
  if (!Array.isArray(list)) return [];
  const output = [];
  for (const enemy of list) {
    if (!enemy || typeof enemy !== 'object') continue;
    const col = Number(enemy.col);
    const row = Number(enemy.row);
    if (!Number.isInteger(col) || !Number.isInteger(row)) continue;
    output.push({
      type: enemy.type || 'bunker',
      col,
      row,
      facing: enemy.facing || 'south',
    });
  }
  return output;
}

function listOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function validateGrid(name, grid, rows, cols, errors) {
  if (!Array.isArray(grid) || grid.length !== rows) {
    errors.push(`${name} row count must equal rows (${rows})`);
    return;
  }
  for (let row = 0; row < rows; row += 1) {
    const cells = grid[row];
    if (!Array.isArray(cells) || cells.length !== cols) {
      errors.push(`${name}[${row}] col count must equal cols (${cols})`);
      continue;
    }
    for (let col = 0; col < cols; col += 1) {
      if (!Number.isFinite(cells[col])) {
        errors.push(`${name}[${row}][${col}] must be numeric`);
        return;
      }
    }
  }
}

function validateConvertedLevel(level, sourceLabel) {
  const errors = [];
  if (!level || typeof level !== 'object') {
    return ['level payload must be an object'];
  }

  if (level.version !== 1) errors.push('version must equal 1');
  if (typeof level.campaign !== 'string' || level.campaign.trim() === '') {
    errors.push('campaign must be a non-empty string');
  }
  if (!Number.isInteger(level.cols) || level.cols <= 0) errors.push('cols must be a positive integer');
  if (!Number.isInteger(level.rows) || level.rows <= 0) errors.push('rows must be a positive integer');
  if (!Number.isInteger(level.tileSize) || level.tileSize <= 0) errors.push('tileSize must be a positive integer');

  if (!level.layers || typeof level.layers !== 'object') {
    errors.push('layers object is required');
  } else {
    validateGrid('layers.water', level.layers.water, level.rows, level.cols, errors);
    validateGrid('layers.terrain', level.layers.terrain, level.rows, level.cols, errors);
    validateGrid('layers.clouds', level.layers.clouds, level.rows, level.cols, errors);
  }

  if (!Array.isArray(level.groundEnemies)) {
    errors.push('groundEnemies must be an array');
  } else {
    for (const [index, enemy] of level.groundEnemies.entries()) {
      if (!enemy || typeof enemy !== 'object') {
        errors.push(`groundEnemies[${index}] must be an object`);
        continue;
      }
      if (!Number.isInteger(enemy.col) || !Number.isInteger(enemy.row)) {
        errors.push(`groundEnemies[${index}] col/row must be integers`);
        continue;
      }
      if (enemy.row < 0 || enemy.row >= level.rows || enemy.col < 0 || enemy.col >= level.cols) {
        errors.push(`groundEnemies[${index}] is outside level bounds`);
      }
    }
  }

  if (!Array.isArray(level.enemySpawns)) errors.push('enemySpawns must be an array');
  if (!Array.isArray(level.bossArenas)) errors.push('bossArenas must be an array');
  if (!Array.isArray(level.scriptedMoments)) errors.push('scriptedMoments must be an array');
  if (!level.metadata || typeof level.metadata !== 'object') errors.push('metadata object is required');

  if (errors.length > 0) {
    return errors.map((message) => `${sourceLabel}: ${message}`);
  }
  return [];
}

function convertLevel(legacy, overrideCampaign, overrideName, sourceLabel) {
  const fallbackCampaign = inferCampaignFromFilename(sourceLabel) || 'coral_front';
  const campaign = overrideCampaign || legacy.campaign || legacy.campaignId || fallbackCampaign;

  const rawWater = legacy.layers && Array.isArray(legacy.layers.water)
    ? legacy.layers.water
    : legacy.waterLayer;
  const rawTerrain = legacy.layers && Array.isArray(legacy.layers.terrain)
    ? legacy.layers.terrain
    : legacy.terrainLayer;
  const rawClouds = legacy.layers && Array.isArray(legacy.layers.clouds)
    ? legacy.layers.clouds
    : legacy.cloudLayer;

  if (!Array.isArray(rawWater) || !Array.isArray(rawTerrain)) {
    throw new Error(`input missing water/terrain layers (${sourceLabel})`);
  }

  const inferredRows = Math.max(
    Array.isArray(rawWater) ? rawWater.length : 0,
    Array.isArray(rawTerrain) ? rawTerrain.length : 0,
    Array.isArray(rawClouds) ? rawClouds.length : 0,
    1,
  );

  const inferredCols = Math.max(
    Array.isArray(rawWater[0]) ? rawWater[0].length : 0,
    Array.isArray(rawTerrain[0]) ? rawTerrain[0].length : 0,
    Array.isArray(rawClouds && rawClouds[0]) ? rawClouds[0].length : 0,
    1,
  );

  const rows = ensurePositiveInt(legacy.rows, inferredRows);
  const cols = ensurePositiveInt(legacy.cols, inferredCols);
  const tileSize = ensurePositiveInt(legacy.tileSize, DEFAULT_TILE_SIZE);

  const isLegacyWater = Array.isArray(legacy.waterLayer);
  const isLegacyTerrain = Array.isArray(legacy.terrainLayer);
  const water = normalizeLayerGrid(rawWater, rows, cols, 1, isLegacyWater ? WATER_MAP : null);
  const terrain = normalizeLayerGrid(rawTerrain, rows, cols, 0, isLegacyTerrain ? TERRAIN_MAP : null);
  const clouds = Array.isArray(rawClouds)
    ? normalizeLayerGrid(rawClouds, rows, cols, 0)
    : zeroGrid(rows, cols);

  const groundEnemies = normalizeGroundEnemies(legacy.groundEnemies || legacy.groundEnemySlots);

  const name = overrideName || legacy.name || `${prettifyCampaignName(campaign)} - Converted`;

  return {
    version: 1,
    campaign,
    name,
    cols,
    rows,
    tileSize,
    layers: {
      water,
      terrain,
      clouds,
    },
    groundEnemies,
    enemySpawns: listOrEmpty(legacy.enemySpawns),
    bossArenas: listOrEmpty(legacy.bossArenas),
    scriptedMoments: listOrEmpty(legacy.scriptedMoments),
    metadata: {
      author: 'legacy-converter',
      created: new Date().toISOString().slice(0, 10),
      notes: `Converted from ${path.basename(sourceLabel)}`,
    },
  };
}

function convertFile(inputPath, outputPath, opts) {
  const legacy = readJson(inputPath);
  const converted = convertLevel(legacy, opts.campaign, opts.name, inputPath);
  const errors = opts.validate ? validateConvertedLevel(converted, inputPath) : [];
  if (errors.length > 0) {
    throw new Error(`validation failed:\n${errors.map((entry) => `  - ${entry}`).join('\n')}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(converted, null, 2)}\n`);
  console.log(`converted: ${inputPath} -> ${outputPath} (${converted.cols}x${converted.rows})`);
  return {
    source: inputPath,
    target: outputPath,
    campaign: converted.campaign,
    cols: converted.cols,
    rows: converted.rows,
    groundEnemies: converted.groundEnemies.length,
  };
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (err) {
    console.error(`error: ${err.message}`);
    console.error(usage());
    process.exit(2);
  }

  if (opts.help || !opts.input || !opts.output) {
    console.log(usage());
    process.exit(opts.help ? 0 : 2);
  }

  const inputPath = path.resolve(opts.input);
  const outputPath = path.resolve(opts.output);

  if (!fs.existsSync(inputPath)) {
    console.error(`error: input path not found: ${inputPath}`);
    process.exit(2);
  }

  const inputStat = fs.statSync(inputPath);
  const results = [];

  if (inputStat.isFile()) {
    results.push(convertFile(inputPath, outputPath, opts));
    console.log(`summary: converted ${results.length} file`);
    return;
  }

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const files = fs.readdirSync(inputPath)
    .filter((name) => name.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.error(`error: no JSON files found in ${inputPath}`);
    process.exit(1);
  }

  for (const name of files) {
    const source = path.join(inputPath, name);
    const target = path.join(outputPath, name);
    results.push(convertFile(source, target, opts));
  }

  const totalEnemies = results.reduce((sum, item) => sum + item.groundEnemies, 0);
  console.log(`summary: converted ${results.length} files, ${totalEnemies} ground enemy slots`);
}

if (require.main === module) {
  main();
}

module.exports = {
  convertLevel,
  validateConvertedLevel,
  WATER_MAP,
  TERRAIN_MAP,
};

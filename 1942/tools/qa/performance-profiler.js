#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

function parseArgs(argv) {
  const opts = {
    iterations: 500,
    viewportRows: 20,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--level') {
      opts.level = argv[++i];
    } else if (arg === '--meta') {
      opts.meta = argv[++i];
    } else if (arg === '--iterations') {
      opts.iterations = Number(argv[++i]);
    } else if (arg === '--viewport-rows') {
      opts.viewportRows = Number(argv[++i]);
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
    '  node 1942/tools/qa/performance-profiler.js --level <level.json> [--meta <spritesheet-meta.json>] [--iterations 500] [--viewport-rows 20]',
    '',
    'Profiles tile traversal and metadata lookup cost for campaign levels.',
  ].join('\n');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeLevel(level) {
  if (level.layers && level.layers.water && level.layers.terrain) {
    return {
      cols: level.cols,
      rows: level.rows,
      water: level.layers.water,
      terrain: level.layers.terrain,
      clouds: level.layers.clouds || [],
    };
  }

  if (level.waterLayer && level.terrainLayer) {
    return {
      cols: level.cols,
      rows: level.rows,
      water: level.waterLayer,
      terrain: level.terrainLayer,
      clouds: level.cloudLayer || [],
    };
  }

  throw new Error('Unsupported level format.');
}

function profileLayerTraversal(level, iterations, viewportRows) {
  const start = performance.now();
  let tilesTouched = 0;
  let checksum = 0;

  for (let i = 0; i < iterations; i += 1) {
    const topRow = i % Math.max(1, (level.rows - viewportRows));
    const bottomRow = Math.min(level.rows, topRow + viewportRows);

    for (let r = topRow; r < bottomRow; r += 1) {
      const waterRow = level.water[r];
      const terrainRow = level.terrain[r];
      const cloudRow = level.clouds[r] || null;

      for (let c = 0; c < level.cols; c += 1) {
        tilesTouched += 1;
        checksum += (waterRow[c] || 0) + (terrainRow[c] || 0) + (cloudRow ? (cloudRow[c] || 0) : 0);
      }
    }
  }

  const end = performance.now();
  return {
    milliseconds: end - start,
    tilesTouched,
    checksum,
  };
}

function profileFrameLookup(level, frames, iterations, viewportRows) {
  const start = performance.now();
  let hits = 0;

  for (let i = 0; i < iterations; i += 1) {
    const topRow = i % Math.max(1, (level.rows - viewportRows));
    const bottomRow = Math.min(level.rows, topRow + viewportRows);

    for (let r = topRow; r < bottomRow; r += 1) {
      for (let c = 0; c < level.cols; c += 1) {
        const terrainId = level.terrain[r][c] || 0;
        const waterId = level.water[r][c] || 0;

        if (terrainId > 0 && frames.byId[terrainId]) hits += 1;
        if (waterId > 0 && frames.byId[waterId]) hits += 1;
      }
    }
  }

  const end = performance.now();
  return {
    milliseconds: end - start,
    hits,
  };
}

function buildFrameIndex(metaJson) {
  const byId = {};
  const frames = metaJson.frames || {};
  for (const frame of Object.values(frames)) {
    if (frame.id != null) {
      byId[frame.id] = frame;
    }
  }
  return { byId };
}

function printResult(name, result, iterations) {
  const perIter = result.milliseconds / iterations;
  console.log(`${name}:`);
  console.log(`  total: ${result.milliseconds.toFixed(2)}ms`);
  console.log(`  avg/iter: ${perIter.toFixed(4)}ms`);
  Object.entries(result)
    .filter(([key]) => key !== 'milliseconds')
    .forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
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

  if (opts.help || !opts.level) {
    console.log(usage());
    process.exit(opts.help ? 0 : 2);
  }

  if (!Number.isFinite(opts.iterations) || opts.iterations <= 0) {
    console.error('error: --iterations must be > 0');
    process.exit(2);
  }

  const levelPath = path.resolve(opts.level);
  const level = normalizeLevel(readJson(levelPath));

  const traversal = profileLayerTraversal(level, opts.iterations, opts.viewportRows);
  printResult('layer traversal', traversal, opts.iterations);

  if (opts.meta) {
    const metaPath = path.resolve(opts.meta);
    const frameIndex = buildFrameIndex(readJson(metaPath));
    const lookup = profileFrameLookup(level, frameIndex, opts.iterations, opts.viewportRows);
    printResult('frame lookups', lookup, opts.iterations);
  }

  const budgetMs = 16.67;
  const traversalAvg = traversal.milliseconds / opts.iterations;
  if (traversalAvg > budgetMs) {
    console.warn(`warning: traversal avg ${traversalAvg.toFixed(4)}ms exceeds 60fps frame budget (${budgetMs}ms).`);
  } else {
    console.log(`budget check: OK (${traversalAvg.toFixed(4)}ms <= ${budgetMs}ms)`);
  }
}

if (require.main === module) {
  main();
}

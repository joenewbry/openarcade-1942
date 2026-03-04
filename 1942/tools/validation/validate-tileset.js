#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { runEdgeChecks } = require('./edge-checker');

function parseArgs(argv) {
  const opts = {
    checkEdges: false,
    strict: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--template') {
      opts.template = argv[++i];
    } else if (arg === '--tile-dir') {
      opts.tileDir = argv[++i];
    } else if (arg === '--tileset') {
      opts.tileset = argv[++i];
    } else if (arg === '--level') {
      opts.level = argv[++i];
    } else if (arg === '--check-edges') {
      opts.checkEdges = true;
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
    '  node 1942/tools/validation/validate-tileset.js --template <alpha-template.json> --tile-dir <campaign-dir> --tileset <tileset.json> [--level <level.json>] [--check-edges] [--strict]',
    '',
    'Validates naming, file structure, ID consistency, and optional shoreline/corner adjacency.',
  ].join('\n');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validateTemplate(template) {
  const errors = [];
  const tiles = Array.isArray(template.tiles) ? template.tiles : [];
  const ids = new Set();
  const names = new Set();

  for (const tile of tiles) {
    if (ids.has(tile.id)) {
      errors.push(`duplicate tile id in template: ${tile.id}`);
    }
    if (names.has(tile.name)) {
      errors.push(`duplicate tile name in template: ${tile.name}`);
    }
    ids.add(tile.id);
    names.add(tile.name);
  }

  return errors;
}

function validateFiles(template, tileDir) {
  const errors = [];
  const warnings = [];
  const namingPattern = new RegExp(template.namingPattern);

  const existing = fs.readdirSync(tileDir)
    .filter((name) => name.toLowerCase().endsWith('.png'));

  const lowerNameMap = new Map();
  for (const name of existing) {
    const lowered = name.toLowerCase();
    if (lowerNameMap.has(lowered) && lowerNameMap.get(lowered) !== name) {
      warnings.push(`case-insensitive duplicate PNG names: ${lowerNameMap.get(lowered)} and ${name}`);
    } else {
      lowerNameMap.set(lowered, name);
    }

    if (!namingPattern.test(name)) {
      errors.push(`file violates naming pattern ${template.namingPattern}: ${name}`);
    }
  }

  for (const tile of template.tiles) {
    const expectedName = `${tile.name}.png`;
    const absolute = path.join(tileDir, expectedName);
    if (!fs.existsSync(absolute)) {
      errors.push(`missing generated tile file: ${expectedName}`);
    }
  }

  return { errors, warnings };
}

function validateTilesetJson(template, tileset) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(tileset.tiles)) {
    errors.push('tileset.json missing `tiles` array');
    return { errors, warnings };
  }

  const templateById = new Map(template.tiles.map((tile) => [tile.id, tile]));
  const seenIds = new Set();

  for (const tile of tileset.tiles) {
    if (seenIds.has(tile.id)) {
      errors.push(`duplicate tile id in tileset.json: ${tile.id}`);
      continue;
    }
    seenIds.add(tile.id);

    const expected = templateById.get(tile.id);
    if (!expected) {
      warnings.push(`tileset contains unknown tile id ${tile.id} (${tile.name || 'unnamed'})`);
      continue;
    }

    if (tile.name !== expected.name) {
      errors.push(`tile id ${tile.id} expected name ${expected.name}, got ${tile.name}`);
    }

    if (!tile.file || typeof tile.file !== 'string') {
      errors.push(`tile id ${tile.id} missing output file`);
    }
  }

  for (const templateTile of template.tiles) {
    if (!seenIds.has(templateTile.id)) {
      errors.push(`tileset.json missing tile id ${templateTile.id} (${templateTile.name})`);
    }
  }

  return { errors, warnings };
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

  if (opts.help || !opts.template || !opts.tileDir || !opts.tileset) {
    console.log(usage());
    process.exit(opts.help ? 0 : 2);
  }

  const templatePath = path.resolve(opts.template);
  const tileDir = path.resolve(opts.tileDir);
  const tilesetPath = path.resolve(opts.tileset);

  const template = readJson(templatePath);
  const tileset = readJson(tilesetPath);

  const errors = [];
  const warnings = [];

  errors.push(...validateTemplate(template));

  if (!fs.existsSync(tileDir) || !fs.statSync(tileDir).isDirectory()) {
    errors.push(`tile directory not found: ${tileDir}`);
  } else {
    const fileValidation = validateFiles(template, tileDir);
    errors.push(...fileValidation.errors);
    warnings.push(...fileValidation.warnings);
  }

  const tilesetValidation = validateTilesetJson(template, tileset);
  errors.push(...tilesetValidation.errors);
  warnings.push(...tilesetValidation.warnings);

  if (opts.checkEdges) {
    const levelJson = opts.level ? readJson(path.resolve(opts.level)) : null;
    const edgeResult = runEdgeChecks(tileset, levelJson, opts.strict);
    errors.push(...edgeResult.errors);
    warnings.push(...edgeResult.warnings);
  }

  if (warnings.length > 0) {
    console.warn(`warnings (${warnings.length}):`);
    for (const warning of warnings) {
      console.warn(`  - ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.error(`errors (${errors.length}):`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log('validate-tileset: OK');
}

if (require.main === module) {
  main();
}

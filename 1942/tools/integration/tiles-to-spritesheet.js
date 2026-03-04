#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

let createCanvas;
let loadImage;
try {
  ({ createCanvas, loadImage } = require('canvas'));
} catch (err) {
  console.error('error: `canvas` dependency is required. Run `cd 1942 && npm install`.');
  process.exit(2);
}

function parseArgs(argv) {
  const opts = {
    columns: 8,
    padding: 0,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--template') {
      opts.template = argv[++i];
    } else if (arg === '--input-dir') {
      opts.inputDir = argv[++i];
    } else if (arg === '--output-image') {
      opts.outputImage = argv[++i];
    } else if (arg === '--output-meta') {
      opts.outputMeta = argv[++i];
    } else if (arg === '--columns') {
      opts.columns = Number(argv[++i]);
    } else if (arg === '--padding') {
      opts.padding = Number(argv[++i]);
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
    '  node 1942/tools/integration/tiles-to-spritesheet.js --template <alpha-template.json> --input-dir <campaign-dir> --output-image <sheet.png> --output-meta <sheet.json> [--columns 8] [--padding 0]',
    '',
    'Builds a campaign tile spritesheet and frame metadata.',
  ].join('\n');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (err) {
    console.error(`error: ${err.message}`);
    console.error(usage());
    process.exit(2);
  }

  if (opts.help || !opts.template || !opts.inputDir || !opts.outputImage || !opts.outputMeta) {
    console.log(usage());
    process.exit(opts.help ? 0 : 2);
  }

  if (!Number.isInteger(opts.columns) || opts.columns <= 0) {
    console.error('error: --columns must be a positive integer');
    process.exit(2);
  }

  if (!Number.isInteger(opts.padding) || opts.padding < 0) {
    console.error('error: --padding must be a non-negative integer');
    process.exit(2);
  }

  const template = readJson(path.resolve(opts.template));
  const tiles = [...template.tiles].sort((a, b) => a.id - b.id);
  const tileSize = Number(template.tileSize || 64);

  const rows = Math.ceil(tiles.length / opts.columns);
  const sheetWidth = (opts.columns * tileSize) + (Math.max(0, opts.columns - 1) * opts.padding);
  const sheetHeight = (rows * tileSize) + (Math.max(0, rows - 1) * opts.padding);

  const canvas = createCanvas(sheetWidth, sheetHeight);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const frames = {};

  for (let i = 0; i < tiles.length; i += 1) {
    const tile = tiles[i];
    const col = i % opts.columns;
    const row = Math.floor(i / opts.columns);
    const x = col * (tileSize + opts.padding);
    const y = row * (tileSize + opts.padding);

    const fileName = `${tile.name}.png`;
    const absolute = path.resolve(opts.inputDir, fileName);
    if (!fs.existsSync(absolute)) {
      console.error(`error: missing tile image ${absolute}`);
      process.exit(1);
    }

    const image = await loadImage(absolute);
    ctx.drawImage(image, x, y, tileSize, tileSize);

    frames[tile.name] = {
      id: tile.id,
      layer: tile.layer,
      file: fileName,
      frame: { x, y, w: tileSize, h: tileSize },
      sourceSize: { w: tileSize, h: tileSize },
    };
  }

  const outImagePath = path.resolve(opts.outputImage);
  const outMetaPath = path.resolve(opts.outputMeta);

  fs.mkdirSync(path.dirname(outImagePath), { recursive: true });
  fs.mkdirSync(path.dirname(outMetaPath), { recursive: true });

  fs.writeFileSync(outImagePath, canvas.toBuffer('image/png'));

  const metadata = {
    version: 1,
    tileSize,
    totalTiles: tiles.length,
    sheet: {
      width: sheetWidth,
      height: sheetHeight,
      columns: opts.columns,
      rows,
      padding: opts.padding,
      image: path.basename(outImagePath),
    },
    frames,
  };

  fs.writeFileSync(outMetaPath, `${JSON.stringify(metadata, null, 2)}\n`);

  console.log(`spritesheet image: ${outImagePath}`);
  console.log(`spritesheet meta: ${outMetaPath}`);
  console.log(`packed ${tiles.length} tiles (${opts.columns} columns x ${rows} rows)`);
}

main().catch((err) => {
  console.error(`error: ${err.stack || err.message}`);
  process.exit(1);
});

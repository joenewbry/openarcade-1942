# 1942 Tile Production Pipeline

This pipeline turns the `alpha` tile set into campaign-specific tiles, validates edge/corner correctness, builds spritesheets, and supports QA + legacy conversion.

## Layout

- `generation/generate-campaign-tiles.py`: generate campaign PNG tiles + `tileset.json`
- `generation/alpha-template.json`: canonical tile IDs, names, and campaign palettes
- `validation/validate-tileset.js`: naming/structure/ID validation + optional edge checks
- `validation/edge-checker.js`: shoreline and corner ID adjacency checks
- `integration/tiles-to-spritesheet.js`: build spritesheet PNG + metadata JSON
- `integration/convert-legacy-levels.js`: convert old level JSON into spec format
- `qa/preview-generator.html`: visual inspection for level + tileset
- `qa/performance-profiler.js`: quick traversal/render-cost profiler

## 1) Generate Campaign Tiles

```bash
python3 1942/tools/generation/generate-campaign-tiles.py \
  --campaign coral_front \
  --template 1942/tools/generation/alpha-template.json \
  --source-dir 1942/assets/tiles/alpha/clean \
  --output-dir 1942/assets/tiles/generated
```

Output example:
- `1942/assets/tiles/generated/coral_front/*.png`
- `1942/assets/tiles/generated/coral_front/tileset.json`

Notes:
- Requires Pillow (`python3 -m pip install pillow`)
- Use `--dry-run` for preflight checks only

## 2) Validate Naming, Structure, and Edges

```bash
node 1942/tools/validation/validate-tileset.js \
  --template 1942/tools/generation/alpha-template.json \
  --tile-dir 1942/assets/tiles/generated/coral_front \
  --tileset 1942/assets/tiles/generated/coral_front/tileset.json \
  --level 1942/levels/coral_front.json \
  --check-edges
```

For strict diagonal inner-corner enforcement, add `--strict`.

## 3) Build Spritesheet + Metadata

```bash
node 1942/tools/integration/tiles-to-spritesheet.js \
  --template 1942/tools/generation/alpha-template.json \
  --input-dir 1942/assets/tiles/generated/coral_front \
  --output-image 1942/assets/tiles/generated/coral_front/tilesheet.png \
  --output-meta 1942/assets/tiles/generated/coral_front/tilesheet.json \
  --columns 8
```

Notes:
- Requires Node `canvas` (`cd 1942 && npm install`)

## 4) Convert Legacy Levels

Single file:

```bash
node 1942/tools/integration/convert-legacy-levels.js \
  --input 1942/levels/coral_front.json \
  --output 1942/levels/coral_front.converted.json
```

Directory batch:

```bash
node 1942/tools/integration/convert-legacy-levels.js \
  --input 1942/levels \
  --output 1942/levels-converted
```

By default the converter validates output structure (required keys + grid dimensions + enemy bounds) and fails fast on invalid payloads. Use `--no-validate` only for debugging.

Migration + rollback reference:
- `1942/levels-converted/README.md`

## 5) QA Tools

Preview:
- Open `1942/tools/qa/preview-generator.html` in a browser.
- Load level JSON, spritesheet metadata JSON, and spritesheet PNG.
- Toggle layers and scrub start row.

Performance:

```bash
node 1942/tools/qa/performance-profiler.js \
  --level 1942/levels/coral_front.json \
  --meta 1942/assets/tiles/generated/coral_front/tilesheet.json \
  --iterations 500
```

## Recommended Campaign Workflow

1. Generate tiles (`generate-campaign-tiles.py`)
2. Validate files + IDs + edge logic (`validate-tileset.js`)
3. Build spritesheet (`tiles-to-spritesheet.js`)
4. Run preview + profiler (`qa/*`)
5. If needed, convert old level data (`convert-legacy-levels.js`)

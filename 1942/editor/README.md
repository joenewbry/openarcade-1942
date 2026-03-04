# 1942 Level Editor Core

Browser-based core editor for 1942 levels.

## Scope

Implemented in vanilla HTML/CSS/JS with these core features:

- Fixed map grid: `15 x 150` tiles, `64 x 64` tile size
- Scrollable canvas workspace
- Layer model with visibility + opacity controls:
  - `water`
  - `terrain`
  - `clouds`
  - `entities` (overlay markers)
- Tile palette loading from `../assets/tiles/{campaign}/`
- Tools:
  - paint
  - fill
  - eraser
  - selection
  - rectangle
  - line (orthogonal)
  - stamp (2x2)
  - entity placement
- Undo/redo action stack
- Save/load/export JSON in the level spec format
- Keyboard shortcuts from spec, with a practical complete set
- Edge auto-tiling hooks for IDs `20-31`

## Files

- `index.html` - app shell
- `editor.css` - layout and editor styling
- `tiles.js` - tile catalog, campaign tile loading, draw helpers, auto-edge helpers
- `editor.js` - editor runtime and interaction logic

## Run

Open `1942/editor/index.html` in a modern browser.

If opening directly from `file://` blocks `fetch` in your browser, serve the repo from a local static server and open `/1942/editor/` via `http://localhost`.

## Tile Asset Loading

The editor loads:

- `../assets/tiles/{campaign}/water.png`
- `../assets/tiles/{campaign}/water.json`
- `../assets/tiles/{campaign}/terrain.png`
- `../assets/tiles/{campaign}/terrain.json`

### Campaign Integration + Fallbacks

The editor normalizes campaign IDs and resolves naming variants automatically:

- `coral_front` ⇔ `coral-front` ⇔ `alpha`
- `jungle_spear` ⇔ `jungle-spear` ⇔ `beta`
- `dust_convoy` ⇔ `dust-convoy` ⇔ `gamma`
- `iron_monsoon` ⇔ `iron-monsoon` ⇔ `delta`

Tile loading resolution order is:

1. campaign spritesheets (`water/terrain/clouds` png+json when present)
2. loose per-tile images in campaign folders (`*.png|*.jpg|*.jpeg`)
3. loose images under campaign subfolders such as `clean/` and `enhanced/`
4. built-in fallback color tiles

This keeps the full palette usable even when campaigns have mixed asset formats.

### Palette Category Filter

Palette supports per-layer category filtering:

- `water`: all, depth, foam
- `terrain`: all, base, edges, inner edges
- `clouds`: all, light, storm
- `entities`: all, defense, ops

Category filtering updates the shown palette items and selected brush/entity, and campaign changes immediately re-render the map with the selected campaign tile set.

## JSON Format

Saved and exported data follows the spec shape:

- `version`, `campaign`, `name`, `cols`, `rows`, `tileSize`
- `layers.water`, `layers.terrain`, `layers.clouds` as 2D arrays
- `groundEnemies` (derived from entity overlay markers)
- `enemySpawns`, `bossArenas`, `scriptedMoments`
- `metadata`
- `tileRefs` (explicit tile-id to tile-name reference map per layer)

`Load` accepts matching JSON and normalizes dimensions into the fixed `15x150` editor grid.
It also accepts legacy level keys (`campaignId`, `waterLayer`, `terrainLayer`, `cloudLayer`) and normalizes campaign aliases to canonical IDs.

## Shortcuts

- `V` select tool
- `B` brush / paint
- `E` eraser
- `G` flood fill
- `R` rectangle
- `L` orthogonal line
- `S` stamp
- `N` entity placer (switches to entities layer)
- `P` toggle properties panel
- `Ctrl+G` grid toggle
- `Ctrl+Z` undo
- `Ctrl+Y` (or `Ctrl+Shift+Z`) redo
- `Ctrl+S` save JSON

## Auto-Tiling Hook Notes (IDs 20-31)

The editor includes deterministic hook logic for `terrain` edge IDs `20-31`:

- Auto-tiling applies to existing terrain edge tiles (`20-31`) in the local neighborhood of edited water/terrain cells.
- Resolution priority is stable: inner corners (`28-31`) first, then outer corners (`24-27`), then straight edges (`20-23`) with deterministic tie-breaking.
- Local recompute is batched per action (especially flood fill), then applied to the affected neighborhood only.

### Manual Edge Override

- If you explicitly paint a specific edge tile (`20-31`) on `terrain`, that cell becomes a manual override and keeps that exact ID.
- Manual override cells are skipped by auto-tiling during nearby edits.
- To clear an override: paint that cell with a non-edge terrain tile (`10-14`) or erase it.
- Override state participates in undo/redo.

### Debug Helper

- In the browser console, run `window.__openArcadeAutoTileSelfTest()` to execute a small built-in auto-tiling self-test.
- The editor also runs this test once at startup and logs pass/fail information to the console.

### Known Limits

- This is hook-based, not full terrain synthesis: non-edge terrain (`10-14`) does not auto-convert into edge tiles.
- Complex 3-sided/4-sided shoreline cases are deterministically approximated to the nearest available edge shape.

# 1942 Visual CI Checklist

Use this checklist to quickly validate the full Alpha tile rollout before/after merge.

## 1) Tile Asset Sanity (Campaign Sets)

- [ ] Jungle Spear tiles render correctly (`1942/assets/tiles/jungle-spear/`)
- [ ] Dust Convoy tiles render correctly (`1942/assets/tiles/dust-convoy/`)
- [ ] Iron Monsoon tiles render correctly (`1942/assets/tiles/iron-monsoon/`)
- [ ] Each campaign has:
  - [ ] Water: deep/mid/shallow/foam
  - [ ] Terrain: sand/grass/rock/structure (+ path where applicable)
  - [ ] Edges: N/S/E/W + outer corners + inner corners
  - [ ] Clouds: thin/thick/storm
  - [ ] 12x12 demo PNG + JSON map

## 2) Editor Visual Validation (`1942/editor/`)

- [ ] Open editor and switch through all campaigns
- [ ] Palette category filter updates tiles correctly
- [ ] Painting appears on correct layer (water/terrain/clouds/entities)
- [ ] Fill/eraser/select tools visually update expected cells
- [ ] Opacity and visibility toggles show/hide layers correctly
- [ ] Save → Load round-trip preserves same visual result
- [ ] Export JSON opens without schema/runtime issues

### Auto-Tiling (IDs 20-31)
- [ ] Straight shoreline edges resolve correctly
- [ ] Outer corners resolve correctly
- [ ] Inner corners resolve correctly
- [ ] Local recompute only affects nearby cells
- [ ] Manual edge override remains stable through nearby edits
- [ ] Undo/Redo preserves override behavior

## 3) Runtime Visual Validation (`1942/game.js`, `1942/content/tilemap.js`)

- [ ] Runtime loads campaign tile palettes/atlases
- [ ] Water layer scrolls/rendering is stable
- [ ] Terrain layer aligns with expected map geometry
- [ ] Cloud layer renders with expected parallax/overlay behavior
- [ ] No placeholder/fillRect artifacts in updated tile paths
- [ ] Fallback behavior is acceptable if a tile is missing

## 4) Level Data Migration Validation (`1942/levels-converted/`)

- [ ] All expected converted files exist:
  - [ ] `coral_front.json`
  - [ ] `jungle_spear.json`
  - [ ] `dust_convoy.json`
  - [ ] `iron_monsoon.json`
- [ ] Converted files load in editor without visual corruption
- [ ] Converted files render in runtime with correct campaign style
- [ ] Legacy files remain untouched in `1942/levels/`

## 5) Pipeline / Tooling Validation (`1942/tools/`)

- [ ] Generation script runs and outputs expected files
- [ ] Validation scripts pass for a known-good level
- [ ] Spritesheet generation produces image + metadata
- [ ] Profiler runs and reports within acceptable budget
- [ ] Preview tool loads level + metadata + spritesheet visually

## 6) CI/Review Attachments (for PR)

- [ ] Attach at least 1 screenshot per campaign demo grid
- [ ] Attach editor screenshot with layer panel + palette visible
- [ ] Attach one runtime screenshot per campaign
- [ ] Attach migration command output summary
- [ ] Attach profiler output summary

---

## Quick Command Block

```bash
# audit status
python3 1942/audit-workflow.py

# migration sanity
node 1942/tools/integration/convert-legacy-levels.js --input 1942/levels --output 1942/levels-converted

# validation sanity
node 1942/tools/validation/validate-tileset.js --template 1942/tools/generation/alpha-template.json --tile-dir 1942/assets/tiles/alpha/clean --tileset 1942/assets/tiles/alpha/clean/tileset.json || true

# editor/runtime syntax checks
node --check 1942/editor/editor.js
node --check 1942/editor/tiles.js
```

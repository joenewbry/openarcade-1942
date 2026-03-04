# 1942 Technical Architecture: Major Overhaul

**Author:** Technical Architect  
**Date:** 2026-03-02  
**Status:** Approved Architecture Spec  
**Scope:** Tilemap system, level editor, sprite pipeline, module structure

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Level File Format (JSON Schema)](#2-level-file-format)
3. [Tile Atlas Architecture](#3-tile-atlas-architecture)
4. [Level Editor Architecture](#4-level-editor-architecture)
5. [Pipeline Improvements & Module Split](#5-pipeline-improvements)
6. [Sprite Replacement Strategy](#6-sprite-replacement-strategy)
7. [Migration Plan](#7-migration-plan)
8. [File Structure](#8-file-structure)

---

## 1. Executive Summary

### Current State

The 1942 game is a 4546-line codebase (2893 in game.js alone) with:

- **Procedural tilemap generation** — `generateTilemap()` creates random islands/channels/ships using seeded RNG. No hand-designed levels.
- **AI-generated PNG sprites** — 28 individual files, 500px–2048px each, ~23MB total. Inconsistent style and scale.
- **Pixel-art fallback system** — `content/sprites.js` has hand-coded 5×7 to 12×7 character arrays used as `fillRect` fallbacks when PNGs fail to load.
- **All rendering via `fillRect`** — tilemap layers drawn as colored rectangles, no drawImage for tiles.
- **Monolithic game.js** — rendering, update logic, enemy AI, UI, plane select, multiplayer, and background drawing all in one file.

### Target State

- **Hand-designed tile-based levels** loaded from JSON files
- **64×64 pixel art tile atlases** organized as campaign-specific spritesheets
- **Standalone level editor** at `1942/editor/` sharing tile definitions with the game
- **Modular game.js** split into focused subsystems
- **Unified spritesheet pipeline** for all game entities

---

## 2. Level File Format

### 2.1 JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "1942 Level File",
  "type": "object",
  "required": ["version", "meta", "tilesets", "layers", "spawns"],
  "properties": {
    "version": {
      "type": "integer",
      "const": 1,
      "description": "Schema version for forward compatibility"
    },

    "meta": {
      "type": "object",
      "required": ["id", "name", "campaign", "cols", "rows", "tileSize"],
      "properties": {
        "id": { "type": "string", "description": "Unique level identifier, e.g. 'coral_front_01'" },
        "name": { "type": "string", "description": "Display name, e.g. 'Coral Reef Approach'" },
        "campaign": { "type": "string", "enum": ["coral_front", "jungle_spear", "dust_convoy", "iron_monsoon"] },
        "cols": { "type": "integer", "default": 15, "description": "Map width in tiles (960px / 64px = 15)" },
        "rows": { "type": "integer", "description": "Map height in tiles (variable: 120-200)" },
        "tileSize": { "type": "integer", "default": 64 },
        "scrollSpeed": {
          "type": "object",
          "properties": {
            "water": { "type": "number", "default": 0.2 },
            "terrain": { "type": "number", "default": 0.5 },
            "clouds": { "type": "number", "default": 2.0 }
          }
        },
        "author": { "type": "string" },
        "created": { "type": "string", "format": "date-time" },
        "modified": { "type": "string", "format": "date-time" }
      }
    },

    "tilesets": {
      "type": "object",
      "description": "References to tile atlas images and their tile definitions",
      "properties": {
        "water": { "$ref": "#/$defs/tilesetRef" },
        "terrain": { "$ref": "#/$defs/tilesetRef" },
        "clouds": { "$ref": "#/$defs/tilesetRef" }
      }
    },

    "layers": {
      "type": "object",
      "required": ["water", "terrain", "clouds"],
      "properties": {
        "water": { "$ref": "#/$defs/tileLayer" },
        "terrain": { "$ref": "#/$defs/tileLayer" },
        "clouds": { "$ref": "#/$defs/tileLayer" }
      }
    },

    "spawns": {
      "type": "object",
      "properties": {
        "waves": {
          "type": "array",
          "items": { "$ref": "#/$defs/waveSpawn" }
        },
        "groundEnemies": {
          "type": "array",
          "items": { "$ref": "#/$defs/groundEnemy" }
        }
      }
    },

    "bossArenas": {
      "type": "array",
      "items": { "$ref": "#/$defs/bossArena" }
    },

    "triggers": {
      "type": "array",
      "items": { "$ref": "#/$defs/trigger" }
    },

    "powerupZones": {
      "type": "array",
      "items": { "$ref": "#/$defs/powerupZone" }
    }
  },

  "$defs": {
    "tilesetRef": {
      "type": "object",
      "required": ["src", "tileSize"],
      "properties": {
        "src": { "type": "string", "description": "Path to tile atlas PNG, e.g. 'assets/tiles/coral-water.png'" },
        "tileSize": { "type": "integer", "default": 64 },
        "cols": { "type": "integer", "description": "Atlas columns (tiles per row in the image)" },
        "animations": {
          "type": "object",
          "description": "Map of tileId → animation definition",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "frames": { "type": "array", "items": { "type": "integer" }, "description": "Tile IDs in the atlas that form the animation" },
              "frameDuration": { "type": "integer", "default": 12, "description": "Ticks per frame (at 60fps)" }
            }
          }
        }
      }
    },

    "tileLayer": {
      "type": "object",
      "required": ["data"],
      "properties": {
        "data": {
          "type": "array",
          "description": "Flat array of tile IDs, length = cols × rows. Row-major order (left-to-right, top-to-bottom). 0 = empty/transparent.",
          "items": { "type": "integer", "minimum": 0 }
        },
        "encoding": {
          "type": "string",
          "enum": ["raw", "rle"],
          "default": "raw",
          "description": "raw = flat array of IDs. rle = run-length encoded [count, tileId, count, tileId, ...]"
        }
      }
    },

    "waveSpawn": {
      "type": "object",
      "required": ["wave", "enemies"],
      "properties": {
        "wave": { "type": "integer", "minimum": 1 },
        "triggerRow": { "type": "integer", "description": "Terrain row that triggers this wave when scrolled into view. If omitted, wave triggers sequentially." },
        "enemies": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["type", "x", "y", "pattern"],
            "properties": {
              "type": { "type": "string", "description": "Enemy ID from enemies.js, e.g. 'scout_zero'" },
              "x": { "type": "number", "description": "Spawn X position in pixels" },
              "y": { "type": "number", "description": "Spawn Y position in pixels (negative = above screen)" },
              "pattern": { "type": "string", "description": "Flight pattern: line, vee, cross, stagger, swirl, figure8, dive, formation, ambush_left, ambush_right, ambush_bottom" },
              "delay": { "type": "integer", "default": 0, "description": "Ticks delay before this enemy appears within the wave" },
              "pathPhase": { "type": "number", "description": "Phase offset for formation variety" }
            }
          }
        },
        "isBoss": { "type": "boolean", "default": false },
        "bossType": { "type": "string", "enum": ["mini", "final"] },
        "bossId": { "type": "string", "description": "Boss ID from enemies.js" },
        "escortPattern": { "type": "string" },
        "escortCount": { "type": "integer" }
      }
    },

    "groundEnemy": {
      "type": "object",
      "required": ["type", "col", "row"],
      "properties": {
        "type": { "type": "string", "enum": ["bunker", "ship", "battleship"] },
        "col": { "type": "integer" },
        "row": { "type": "integer" },
        "hp": { "type": "integer", "description": "Override default HP" },
        "fireRate": { "type": "integer", "description": "Override default fire rate" }
      }
    },

    "bossArena": {
      "type": "object",
      "required": ["startRow", "endRow"],
      "properties": {
        "startRow": { "type": "integer", "description": "Row where boss arena begins (camera locks)" },
        "endRow": { "type": "integer", "description": "Row where boss arena ends" },
        "bossId": { "type": "string" },
        "bossType": { "type": "string", "enum": ["mini", "final"] },
        "terrainOverride": {
          "type": "string",
          "description": "Optional: override terrain for the arena region (e.g. open water for naval boss)"
        }
      }
    },

    "trigger": {
      "type": "object",
      "required": ["type", "row"],
      "properties": {
        "type": {
          "type": "string",
          "enum": ["dialogue", "ambush_all_edges", "powerup_shower", "wingman", "camera_shake", "music_change", "fog_enter", "fog_exit"]
        },
        "row": { "type": "integer", "description": "Terrain row that activates this trigger" },
        "wave": { "type": "integer", "description": "Alternative: trigger on wave number instead of row" },
        "params": {
          "type": "object",
          "description": "Type-specific parameters",
          "properties": {
            "lines": { "type": "array", "items": { "type": "string" }, "description": "Dialogue lines" },
            "duration": { "type": "integer" },
            "enemyTypes": { "type": "array", "items": { "type": "string" } },
            "powerupIds": { "type": "array", "items": { "type": "string" } },
            "positions": { "type": "array", "items": { "type": "object", "properties": { "x": { "type": "number" }, "y": { "type": "number" } } } }
          }
        }
      }
    },

    "powerupZone": {
      "type": "object",
      "required": ["row", "col"],
      "properties": {
        "row": { "type": "integer" },
        "col": { "type": "integer" },
        "width": { "type": "integer", "default": 1, "description": "Zone width in tiles" },
        "height": { "type": "integer", "default": 1, "description": "Zone height in tiles" },
        "powerupId": { "type": "string", "description": "Specific power-up, or omit for random" },
        "probability": { "type": "number", "default": 1.0, "description": "Chance to actually spawn (0-1)" },
        "respawn": { "type": "boolean", "default": false }
      }
    }
  }
}
```

### 2.2 Example Level File

```json
{
  "version": 1,
  "meta": {
    "id": "coral_front_01",
    "name": "Coral Reef Approach",
    "campaign": "coral_front",
    "cols": 15,
    "rows": 120,
    "tileSize": 64,
    "scrollSpeed": { "water": 0.2, "terrain": 0.5, "clouds": 2.0 }
  },

  "tilesets": {
    "water":   { "src": "assets/tiles/coral-water.png",   "tileSize": 64, "cols": 8, "animations": {
      "1": { "frames": [1, 2, 3, 2], "frameDuration": 20 },
      "3": { "frames": [3, 4, 5, 4], "frameDuration": 15 }
    }},
    "terrain": { "src": "assets/tiles/coral-terrain.png", "tileSize": 64, "cols": 8 },
    "clouds":  { "src": "assets/tiles/clouds.png",        "tileSize": 64, "cols": 4, "animations": {
      "1": { "frames": [1, 2], "frameDuration": 30 },
      "2": { "frames": [3, 4], "frameDuration": 30 }
    }}
  },

  "layers": {
    "water": {
      "data": [0,0,1,1,0,0,0,0,1,0,0,0,0,1,0],
      "encoding": "raw"
    },
    "terrain": {
      "data": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      "encoding": "raw"
    },
    "clouds": {
      "data": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      "encoding": "raw"
    }
  },

  "spawns": {
    "waves": [
      {
        "wave": 1,
        "triggerRow": 110,
        "enemies": [
          { "type": "scout_zero", "x": 200, "y": -60, "pattern": "line", "delay": 0 },
          { "type": "scout_zero", "x": 480, "y": -60, "pattern": "line", "delay": 10 },
          { "type": "scout_zero", "x": 760, "y": -60, "pattern": "line", "delay": 20 }
        ]
      },
      {
        "wave": 5,
        "isBoss": true,
        "bossType": "mini",
        "bossId": "reef_guardian",
        "escortPattern": "line",
        "escortCount": 4,
        "enemies": []
      }
    ],
    "groundEnemies": [
      { "type": "bunker", "col": 5, "row": 80 },
      { "type": "ship",   "col": 10, "row": 60 },
      { "type": "battleship", "col": 3, "row": 30, "hp": 50 }
    ]
  },

  "bossArenas": [
    { "startRow": 10, "endRow": 0, "bossId": "coral_dreadnought", "bossType": "final" }
  ],

  "triggers": [
    { "type": "dialogue", "row": 115, "params": { "lines": ["Approaching enemy waters.", "Stay sharp, pilot."] } },
    { "type": "powerup_shower", "wave": 7, "params": { "positions": [
      { "x": 192, "y": -40 }, { "x": 384, "y": -80 }, { "x": 576, "y": -20 }, { "x": 768, "y": -60 }
    ]}},
    { "type": "ambush_all_edges", "wave": 13, "params": { "enemyTypes": ["scout_zero", "torpedo_gull"] } }
  ],

  "powerupZones": [
    { "row": 95, "col": 7, "powerupId": "double-shot" },
    { "row": 50, "col": 3, "probability": 0.5 }
  ]
}
```

### 2.3 Data Encoding: RLE Compression

For large maps (15×200 = 3000 tiles per layer × 3 layers = 9000 tile IDs), RLE encoding cuts file size dramatically since most tiles are 0 (empty):

```json
{
  "data": [2850, 0, 5, 1, 3, 2, 5, 1, 137, 0],
  "encoding": "rle"
}
```

Decodes as: 2850 zeros, 5 ones, 3 twos, 5 ones, 137 zeros.

**Decode function:**
```javascript
function decodeRLE(rleData, expectedLength) {
  const result = [];
  for (let i = 0; i < rleData.length; i += 2) {
    const count = rleData[i];
    const value = rleData[i + 1];
    for (let j = 0; j < count; j++) result.push(value);
  }
  if (result.length !== expectedLength) {
    console.warn(`RLE decode: expected ${expectedLength} tiles, got ${result.length}`);
  }
  return result;
}
```

### 2.4 Design Decisions

| Decision | Rationale |
|---|---|
| **Flat array instead of 2D** | Simpler serialization, less JSON overhead, trivial to index: `data[row * cols + col]` |
| **Row-major top-to-bottom** | Matches scroll direction. Row 0 is the END of the level (bottom of map, where boss is). Row `rows-1` is the START. The camera scrolls from high rows to low rows. |
| **triggerRow on waves** | Links wave spawns to map position instead of arbitrary timing. When terrain row X scrolls into view, wave spawns. Falls back to sequential if omitted. |
| **Separate wave.enemies array** | Gives per-enemy position/pattern control instead of the current `{ pattern, mix, count }` bulk spawning. The editor can place enemies precisely. |
| **Boss arenas as regions** | Camera can lock when entering a boss arena region, clearing normal scrolling. Arena defines the visual backdrop for the boss fight. |
| **Version field** | Future-proofs the format. Loaders check `version === 1` and can migrate old formats. |

---

## 3. Tile Atlas Architecture

### 3.1 Atlas Organization: Per-Campaign Spritesheets

**Decision: One spritesheet per layer per campaign, plus shared atlases.**

```
assets/tiles/
├── shared/
│   ├── clouds.png          # 4×2 atlas = 8 tiles (used across all campaigns)
│   └── clouds.json         # Tile metadata
├── coral_front/
│   ├── water.png           # 8×4 atlas = 32 tiles (deep, shallow, foam, animated frames)
│   ├── water.json
│   ├── terrain.png         # 8×6 atlas = 48 tiles (sand, grass, rock, structure, transitions)
│   └── terrain.json
├── jungle_spear/
│   ├── water.png
│   ├── water.json
│   ├── terrain.png
│   └── terrain.json
├── dust_convoy/
│   └── ...
└── iron_monsoon/
    └── ...
```

**Rationale:**
- Each campaign has a distinct color palette (already defined in `TILE_PALETTES`). Per-campaign atlases let artists bake palette-correct tiles directly.
- Shared clouds atlas avoids duplication (clouds are semi-transparent white/blue across all campaigns).
- One atlas per layer keeps textures small (water: 512×256, terrain: 512×384, clouds: 256×128).
- Loading is simple: load 3 images per campaign, no runtime palette swapping needed.

### 3.2 Tile Size: Confirmed 64×64

**Keep 64×64.** Rationale:
- 960px ÷ 64px = exactly 15 columns. Clean integer math.
- 1280px ÷ 64px = exactly 20 visible rows. No partial tiles.
- 64×64 is large enough for readable pixel art detail at the game's top-down view.
- Matches the current `TILE_SIZE` constant — minimal code change.

### 3.3 Per-Campaign Palettes

The current `TILE_PALETTES` object in `tilemap.js` defines colors per campaign for procedural rendering. With tile atlases, palettes are **baked into the artwork**, not applied at runtime.

**Strategy: Palette JSON metadata alongside each atlas.**

```json
// assets/tiles/coral_front/terrain.json
{
  "tileSize": 64,
  "cols": 8,
  "tiles": {
    "0": { "name": "empty", "solid": false },
    "1": { "name": "sand_edge_n", "solid": true, "group": "beach" },
    "2": { "name": "sand_edge_s", "solid": true, "group": "beach" },
    "3": { "name": "sand_edge_e", "solid": true, "group": "beach" },
    "4": { "name": "sand_edge_w", "solid": true, "group": "beach" },
    "5": { "name": "sand_corner_ne", "solid": true, "group": "beach" },
    "6": { "name": "grass_full", "solid": true, "group": "vegetation" },
    "7": { "name": "grass_sparse", "solid": true, "group": "vegetation" },
    "8": { "name": "rock_full", "solid": true, "group": "rock" },
    "9": { "name": "structure_bunker_base", "solid": true, "group": "structure" },
    "10": { "name": "shore_foam_n", "solid": false, "group": "shore" }
  },
  "autoTile": {
    "beach": {
      "type": "blob47",
      "baseTileId": 1,
      "description": "Auto-tiling for beach edges/corners based on adjacency"
    }
  }
}
```

**For placeholder/dev phase:** Keep the current `TILE_PALETTES` colors and generate flat-color placeholder tiles programmatically (see §6). Switch to real art when tile atlases are ready.

### 3.4 Tile Animation

Water and cloud tiles animate to give life to the background. Animations are defined in the tileset reference within each level file.

**How it works:**

```javascript
// In the renderer, resolve animated tiles per frame
function resolveAnimatedTile(tileId, tileset, tick) {
  const anim = tileset.animations?.[String(tileId)];
  if (!anim) return tileId;
  const frameIndex = Math.floor(tick / anim.frameDuration) % anim.frames.length;
  return anim.frames[frameIndex];
}
```

**Atlas layout for animated tiles:**

```
water.png (8 columns):
┌────┬────┬────┬────┬────┬────┬────┬────┐
│ 0  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │  Row 0: static tiles
├────┼────┼────┼────┼────┼────┼────┼────┤
│ 8  │ 9  │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │  Row 1: animation frame variants
├────┼────┼────┼────┼────┼────┼────┼────┤
│ 16 │ 17 │ 18 │ 19 │ 20 │ 21 │ 22 │ 23 │  Row 2: more animation frames
└────┴────┴────┴────┴────┴────┴────┴────┘

Tile 1 (shallow water) animates: [1, 9, 17, 9] at 20 ticks/frame
Tile 3 (foam/surf)     animates: [3, 11, 19, 11] at 15 ticks/frame
```

**Performance:** Animation resolution happens during the draw loop, not by modifying tile data. The atlas texture stays static on GPU; only the source rectangle changes per animated tile.

---

## 4. Level Editor Architecture

### 4.1 Overview

A standalone HTML/JS single-page application in `1942/editor/`. No build tools, no dependencies — just vanilla HTML5 Canvas + JS modules, matching the game's approach.

### 4.2 File Structure

```
1942/editor/
├── index.html              # Editor entry point
├── editor.js               # Main editor application
├── tools/
│   ├── brush.js            # Tile painting tool
│   ├── eraser.js           # Tile erasing
│   ├── fill.js             # Flood fill
│   ├── select.js           # Rectangle select/move
│   ├── enemy-placer.js     # Enemy spawn placement
│   └── ground-placer.js    # Ground enemy placement
├── panels/
│   ├── tileset-panel.js    # Tile palette UI
│   ├── layer-panel.js      # Layer visibility/selection
│   ├── properties-panel.js # Object properties inspector
│   ├── wave-panel.js       # Wave/spawn editor
│   └── trigger-panel.js    # Trigger/event editor
├── core/
│   ├── canvas-view.js      # Pan/zoom canvas viewport
│   ├── history.js          # Undo/redo stack
│   ├── file-io.js          # Load/save/export
│   └── preview.js          # Live game preview (iframe)
└── shared/                 # Symlink or copy from game shared/
    └── → ../../shared/
```

### 4.3 Shared Definitions

**Problem:** Both the game and editor need access to tile definitions, enemy stats, powerup IDs, etc. Duplicating is a maintenance nightmare.

**Solution: Extract shared content into `1942/shared/`.**

```
1942/shared/
├── tile-defs.js            # Tile metadata (names, groups, collision)
├── enemies.js              # Re-export from content/enemies.js
├── powerups.js             # Re-export from content/powerups.js  
├── level-schema.js         # Level JSON validation
└── constants.js            # TILE_SIZE, MAP_COLS, W, H, etc.
```

The game's `content/` files import from `shared/`:
```javascript
// content/enemies.js
export { ENEMIES, MINI_BOSSES, FINAL_BOSSES } from '../shared/enemies.js';
```

The editor imports the same modules:
```javascript
// editor/editor.js
import { ENEMIES, MINI_BOSSES, FINAL_BOSSES } from '../shared/enemies.js';
import { TILE_SIZE, MAP_COLS } from '../shared/constants.js';
```

### 4.4 Load/Save Pipeline

```
┌──────────────────────────────────────────────────┐
│                   Level Editor                    │
│                                                   │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ Canvas   │  │ Panels   │  │ Preview (iframe) │ │
│  │ Viewport │  │ (tile/   │  │ runs game.js     │ │
│  │          │  │  wave/   │  │ with level data  │ │
│  │          │  │  trigger)│  │                   │ │
│  └─────────┘  └──────────┘  └─────────────────┘ │
│       │              │              ▲              │
│       └──────────────┴──────────────┘              │
│                      │                             │
│              ┌───────▼───────┐                     │
│              │  Level State  │                     │
│              │  (in-memory)  │                     │
│              └───────┬───────┘                     │
│                      │                             │
│         ┌────────────┼────────────┐                │
│         ▼            ▼            ▼                │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│   │ Save to  │ │ Load from│ │ Export   │          │
│   │ File     │ │ File     │ │ to Game  │          │
│   │ (JSON)   │ │ (JSON)   │ │ (JSON)   │          │
│   └──────────┘ └──────────┘ └──────────┘          │
└──────────────────────────────────────────────────┘
```

**Save:** `Ctrl+S` → serialize editor state to level JSON → `window.showSaveFilePicker()` (File System Access API) or download as file.

**Load:** `Ctrl+O` → file picker or drag-and-drop JSON → parse → populate editor state.

**File location convention:**
```
1942/levels/
├── coral_front_01.json
├── coral_front_02.json
├── jungle_spear_01.json
└── ...
```

### 4.5 Hot-Reload Preview

The editor embeds a game preview in an `<iframe>` that loads a stripped-down game runner:

```html
<!-- editor/preview.html -->
<!-- Runs game.js but accepts level data via postMessage -->
<script type="module">
  import { createPreviewGame } from '../game-preview.js';
  
  window.addEventListener('message', (e) => {
    if (e.data.type === 'level-update') {
      createPreviewGame(e.data.level);
    }
  });
</script>
```

**From the editor:**
```javascript
// On any edit, debounce and push to preview
function pushToPreview() {
  const levelJson = serializeLevel();
  previewIframe.contentWindow.postMessage({
    type: 'level-update',
    level: levelJson
  }, '*');
}
```

The preview shows the level scrolling from the current editor scroll position, with enemies spawning and terrain rendered. Camera position in the editor syncs to the preview scroll offset.

### 4.6 Editor Core Features

| Feature | Implementation |
|---|---|
| **Tile painting** | Click/drag to paint selected tile onto active layer. Shift+click for line tool. |
| **Multi-layer view** | Toggle layer visibility. Active layer is full opacity, others dimmed. |
| **Grid overlay** | 64px grid with coordinate labels. Toggle with `G`. |
| **Pan/zoom** | Middle-click drag to pan, scroll wheel to zoom. Fit-to-width button. |
| **Undo/redo** | Command pattern stack. `Ctrl+Z` / `Ctrl+Shift+Z`. Groups rapid brush strokes. |
| **Enemy placement** | Select enemy type from palette, click to place spawn point on map. Drag to adjust. Shows flight path preview. |
| **Ground enemy placement** | Place bunkers/ships on terrain/water tiles. Snap to grid. |
| **Wave timeline** | Bottom panel showing wave sequence. Click wave to scroll map to its trigger row. |
| **Trigger placement** | Click on map row to add dialogue, ambush, or powerup shower triggers. |
| **Tileset palette** | Left panel showing all tiles from active layer's atlas. Click to select. |
| **Property inspector** | Right panel showing properties of selected object (enemy, trigger, ground enemy). |

---

## 5. Pipeline Improvements

### 5.1 game.js Module Split

**Current:** 2893 lines in one file. This is the biggest maintainability issue.

**Proposed split:**

```
1942/
├── game.js                    # Entry point, createGame(), game loop wiring (~300 lines)
├── systems/
│   ├── player.js              # makePlayer, player movement, roll, focus mode (~200 lines)
│   ├── enemies.js             # createEnemy, enemy movement, pattern velocity (~250 lines)
│   ├── combat.js              # Bullets, collisions, damage, graze, chain system (~350 lines)
│   ├── spawner.js             # spawnWave, wave management, campaign transitions (~250 lines)
│   ├── ground-enemies.js      # Ground enemy spawn, update, collision (~150 lines)
│   ├── weapons.js             # Weapon types, bullet patterns, specials (~200 lines)
│   ├── powerups-system.js     # Powerup spawning, pickup logic (~80 lines)
│   ├── signature-moments.js   # Whale, wingman, ambush, powerup shower (~150 lines)
│   └── particles.js           # Explosion, spark, trail particles (~80 lines)
├── render/
│   ├── background.js          # drawBackground, tilemap rendering, parallax (~200 lines)
│   ├── entities.js            # drawPlayer, drawEnemies, drawBullets, drawPowerups (~250 lines)
│   ├── ui.js                  # drawUI, HUD, score pops, chain display (~300 lines)
│   ├── screens.js             # Plane select, debrief, boss warning, campaign intro (~300 lines)
│   └── sprites.js             # drawPixelSprite, drawSpriteImage, texture upload (~100 lines)
├── audio/
│   └── sfx.js                 # Sfx class (~60 lines)
├── content/                   # Unchanged: campaigns, enemies, planes, powerups, dialogue, sprites
├── shared/                    # New: constants, tile-defs, level-schema (shared with editor)
├── levels/                    # New: level JSON files
├── assets/
│   ├── sprites/               # Entity sprites (transitioning to spritesheets)
│   └── tiles/                 # New: tile atlas spritesheets
└── multiplayer.js             # Unchanged
```

**Migration strategy:** Extract bottom-up. Start with `sfx.js` (zero dependencies), then `particles.js`, then gradually pull out systems. Each extraction is a single commit that can be verified independently.

### 5.2 Shared Content Pipeline

```
shared/constants.js:
  export const TILE_SIZE = 64;
  export const MAP_COLS = 15;
  export const MAP_VISIBLE_ROWS = 20;
  export const W = 960;
  export const H = 1280;

shared/tile-defs.js:
  // Tile type enums shared between game renderer and editor
  export const WATER_TILES = { DEEP: 0, SHALLOW: 1, DARK: 2, FOAM: 3 };
  export const TERRAIN_TILES = { EMPTY: 0, SAND: 1, GRASS: 2, ROCK: 3, STRUCTURE: 4 };
  export const CLOUD_TILES = { EMPTY: 0, THIN: 1, THICK: 2, STORM: 3 };

shared/level-schema.js:
  // Runtime level JSON validation
  export function validateLevel(json) { ... }
  export function decodeTileLayer(layer, cols, rows) { ... }
```

### 5.3 Tilemap Rendering: fillRect → drawImage

**Current:** Every tile is a `renderer.fillRect()` call with a color from `TILE_PALETTES`. For a 15×23 visible area, that's ~345 fillRect calls per layer × 3 layers = ~1035 fillRect calls per frame just for tiles.

**New:** Each tile is a `drawImage()` call sourcing from a tile atlas texture.

```javascript
function drawTileLayer(renderer, layer, tileset, scrollY, tick) {
  const ts = tileset.tileSize;
  const atlasCols = tileset.cols;
  const startRow = Math.floor(scrollY / ts) - 1;
  const endRow = startRow + MAP_VISIBLE_ROWS + 3;

  for (let r = startRow; r <= endRow; r++) {
    const mapRow = ((r % totalRows) + totalRows) % totalRows;
    const screenY = r * ts - scrollY;
    if (screenY > H + ts || screenY < -ts) continue;

    for (let c = 0; c < MAP_COLS; c++) {
      const tileId = layer[mapRow * MAP_COLS + c];
      if (tileId === 0) continue;

      // Resolve animation
      const resolvedId = resolveAnimatedTile(tileId, tileset, tick);

      // Atlas source coordinates
      const sx = (resolvedId % atlasCols) * ts;
      const sy = Math.floor(resolvedId / atlasCols) * ts;

      renderer.drawImageRegion(tilesetImage, sx, sy, ts, ts, c * ts, screenY, ts, ts);
    }
  }
}
```

**Performance concerns and mitigations:**

| Concern | Mitigation |
|---|---|
| **drawImage vs fillRect speed** | `drawImage` from a cached atlas texture is faster than fillRect with color parsing. WebGL texture sampling is GPU-accelerated. Net positive. |
| **Texture memory** | Each atlas is small: 512×384 = 196K pixels × 4 bytes = 768KB. Three atlases per campaign = ~2.3MB GPU memory. Trivial. |
| **Animated tile overhead** | Animation resolution is a hash lookup + integer division. Negligible. |
| **Layer compositing** | Cloud layer needs alpha. Use `globalAlpha` or pre-multiply alpha in the atlas. The current WebGL renderer already handles alpha via `drawSprite`. |

**The existing WebGL renderer** already has `drawSprite(name, x, y, w, h, alpha)` and `loadSpriteTexture(name, img)`. We extend it with:

```javascript
// New method: draw a sub-region of a texture
renderer.drawImageRegion(textureName, sx, sy, sw, sh, dx, dy, dw, dh, alpha);
```

This is a simple addition to the existing WebGL batch renderer — just a different UV mapping for the quad.

### 5.4 Asset Loading Pipeline

```javascript
// assets/loader.js — Unified asset loader

export class AssetLoader {
  constructor() {
    this.images = {};   // name → Image
    this.atlases = {};  // name → { image, meta }
    this.levels = {};   // id → parsed JSON
    this.pending = 0;
    this.loaded = 0;
  }

  // Load a single image
  loadImage(name, src) {
    this.pending++;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images[name] = img;
        this.loaded++;
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Failed to load: ${src}`);
        this.loaded++;
        resolve(null);
      };
      img.src = src;
    });
  }

  // Load a tile atlas (image + JSON metadata)
  async loadAtlas(name, imageSrc, metaSrc) {
    const [img, meta] = await Promise.all([
      this.loadImage(name, imageSrc),
      fetch(metaSrc).then(r => r.json()).catch(() => null)
    ]);
    this.atlases[name] = { image: img, meta };
    return this.atlases[name];
  }

  // Load a level JSON
  async loadLevel(id, src) {
    const resp = await fetch(src);
    const json = await resp.json();
    this.levels[id] = json;
    return json;
  }

  // Load all assets for a campaign
  async loadCampaign(campaignId) {
    const basePath = `assets/tiles/${campaignId}`;
    await Promise.all([
      this.loadAtlas(`${campaignId}-water`, `${basePath}/water.png`, `${basePath}/water.json`),
      this.loadAtlas(`${campaignId}-terrain`, `${basePath}/terrain.png`, `${basePath}/terrain.json`),
      this.loadAtlas('shared-clouds', 'assets/tiles/shared/clouds.png', 'assets/tiles/shared/clouds.json'),
    ]);
  }

  get progress() {
    return this.pending > 0 ? this.loaded / this.pending : 1;
  }
}
```

---

## 6. Sprite Replacement Strategy

### 6.1 Current State Analysis

| Category | Count | Current Size | Target Size |
|---|---|---|---|
| Player planes | 6 (2 planes × 3 states) | 500-1300px | 64×64 idle, 64×64 bank L/R |
| Enemies | 5 types | 500-1024px | 32×32 to 48×48 |
| Bosses | 4 + 4 (mini + final) | 800-2048px | 96×96 (mini), 192×128 (final) |
| Powerups | 5 | 410-850px | 24×24 |
| Effects | 3 (explosions) | 700-2000px | 32×32 to 64×64 (animation frames) |
| Clouds | 3 | 700-1400px | 128×64 (atmospheric overlays) |
| Enemy bullet | 1 | 207px | 16×16 |
| **Total** | **28 files** | **~23MB** | **Target: <500KB total** |

### 6.2 Spritesheet Strategy

**Single master spritesheet per category** rather than individual files:

```
assets/sprites/
├── players.png             # 2 planes × 3 states × animation frames = ~256×256
├── players.json            # Frame metadata
├── enemies.png             # All enemy types, animation frames = ~512×256
├── enemies.json
├── bosses.png              # Mini + final boss sprites = ~512×512
├── bosses.json
├── powerups.png            # All powerup icons = ~128×64
├── powerups.json
├── effects.png             # Explosions, bullet impacts = ~256×256
├── effects.json
├── bullets.png             # Player + enemy bullet types = ~128×64
├── bullets.json
└── ui.png                  # HUD icons (hearts, roll stocks) = ~128×64
```

**Frame metadata JSON:**
```json
{
  "frames": {
    "specter-idle-0": { "x": 0, "y": 0, "w": 64, "h": 64 },
    "specter-idle-1": { "x": 64, "y": 0, "w": 64, "h": 64 },
    "specter-bank-left-0": { "x": 128, "y": 0, "w": 64, "h": 64 },
    "scout_zero-0": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "scout_zero-1": { "x": 32, "y": 0, "w": 32, "h": 32 },
    "scout_zero-2": { "x": 64, "y": 0, "w": 32, "h": 32 }
  },
  "animations": {
    "specter-idle": { "frames": ["specter-idle-0", "specter-idle-1"], "frameDuration": 10 },
    "scout_zero": { "frames": ["scout_zero-0", "scout_zero-1", "scout_zero-2"], "frameDuration": 8 }
  }
}
```

### 6.3 Placeholder Generation Strategy

**Phase 1: Code-generated placeholder sprites from existing pixel art.**

The current `content/sprites.js` already has hand-coded pixel arrays (5-12 chars wide, 5-8 rows tall). These can be rendered to canvas and exported as PNGs at target resolution:

```javascript
// tools/generate-placeholders.js — Run once to create placeholder spritesheets
// Renders each sprite from sprites.js onto a canvas at target scale, packs into a sheet

import { SPRITES, colorForKey } from '../content/sprites.js';

function renderSpriteToCanvas(spriteId, scale, tint) {
  const sprite = SPRITES[spriteId];
  const w = sprite[0].length * scale;
  const h = sprite.length * scale;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  
  for (let py = 0; py < sprite.length; py++) {
    for (let px = 0; px < sprite[py].length; px++) {
      const key = sprite[py][px];
      if (key === '.') continue;
      const color = colorForKey(key, tint);
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(px * scale, py * scale, scale, scale);
    }
  }
  return canvas;
}

// Pack all sprites into atlas rows
function generatePlaceholderSheet(category, spriteIds, scale, tint) {
  // ... pack into spritesheet, output PNG + JSON metadata
}
```

**Phase 2: Real pixel art replaces placeholders.**

The spritesheet JSON metadata format stays the same. Artists create art at the exact target dimensions. Swap PNGs without changing any game code.

### 6.4 Updated Sprite Loading Pipeline

Replace the current per-file `Image()` loading with atlas-based loading:

```javascript
// Current (remove):
const SPRITE_IMAGE_FILES = ['specter-idle', 'specter-bank-left', ...];
// 28 individual fetch/decode operations

// New:
const SPRITE_SHEETS = {
  players:  { src: 'assets/sprites/players.png',  meta: 'assets/sprites/players.json' },
  enemies:  { src: 'assets/sprites/enemies.png',  meta: 'assets/sprites/enemies.json' },
  bosses:   { src: 'assets/sprites/bosses.png',   meta: 'assets/sprites/bosses.json' },
  powerups: { src: 'assets/sprites/powerups.png',  meta: 'assets/sprites/powerups.json' },
  effects:  { src: 'assets/sprites/effects.png',  meta: 'assets/sprites/effects.json' },
  bullets:  { src: 'assets/sprites/bullets.png',  meta: 'assets/sprites/bullets.json' },
};

// Load 6 images + 6 JSON = 12 network requests (down from 28)
// Each drawSprite call becomes: look up frame in metadata → drawImageRegion from atlas
```

**Backward compatibility:** Keep `drawSpriteImage()` as the public API. Internally, it resolves sprite names through the atlas metadata instead of looking up individual textures. The pixel-art fallback path via `drawPixelSprite()` is preserved for any missing frames.

---

## 7. Migration Plan

### Phase 1: Foundation (No Visible Changes)

1. **Create `shared/constants.js`** — Extract `TILE_SIZE`, `MAP_COLS`, `W`, `H`
2. **Create `shared/tile-defs.js`** — Tile type enums
3. **Create `shared/level-schema.js`** — Level JSON validation + decode functions
4. **Extract `audio/sfx.js`** from game.js (easiest, zero deps)
5. **Add `renderer.drawImageRegion()`** to engine

### Phase 2: Module Split

6. **Extract `systems/particles.js`**
7. **Extract `systems/weapons.js`**
8. **Extract `systems/combat.js`**
9. **Extract `systems/player.js`**
10. **Extract `systems/enemies.js`**
11. **Extract `systems/spawner.js`**
12. **Extract `render/background.js`**, `render/entities.js`**, `render/ui.js`**, `render/screens.js`
13. **Slim `game.js`** to ~300 lines: imports, createGame(), game loop

### Phase 3: Asset Pipeline

14. **Generate placeholder tile atlases** from current `TILE_PALETTES` colors
15. **Generate placeholder sprite sheets** from `content/sprites.js` pixel arrays
16. **Create `AssetLoader`** class
17. **Convert tilemap renderer** from fillRect → drawImage with atlas
18. **Convert entity renderer** to atlas-based sprite drawing
19. **Delete individual sprite PNGs** once atlas pipeline works

### Phase 4: Level Format

20. **Create level loader** — parse level JSON, decode tile layers, populate tilemap
21. **Create level exporter** — convert current procedural tilemaps to JSON (for bootstrapping)
22. **Wire level loading** into game init (load level JSON instead of calling `generateTilemap`)
23. **Keep `generateTilemap` as fallback** for campaigns without hand-designed levels

### Phase 5: Level Editor

24. **Build editor shell** — HTML layout, canvas viewport, panel framework
25. **Implement tile painting** — layer selection, brush, eraser, fill
26. **Implement enemy placement** — spawn point creation, pattern assignment
27. **Implement triggers/events** — dialogue, ambush, powerup zones
28. **Implement preview** — iframe game preview with postMessage sync
29. **Implement save/load** — File System Access API + drag-and-drop
30. **Polish** — undo/redo, keyboard shortcuts, grid snap

### Phase 6: Art Production

31. **Commission/create real tile atlases** per campaign
32. **Commission/create real entity spritesheets** 
33. **Swap placeholder PNGs** with final art (no code changes needed)
34. **Hand-design first campaign level** using the editor
35. **Iterate on remaining campaign levels**

---

## 8. File Structure (Complete)

```
1942/
├── index.html                      # Game entry point
├── game.js                         # Slim entry: createGame(), game loop (~300 lines)
│
├── systems/                        # Game logic modules
│   ├── player.js                   # Player movement, roll, focus
│   ├── enemies.js                  # Enemy creation, AI, patterns
│   ├── combat.js                   # Collision, damage, graze, chain
│   ├── spawner.js                  # Wave spawning, campaign flow
│   ├── ground-enemies.js           # Ground target logic
│   ├── weapons.js                  # Weapon types, bullet patterns
│   ├── powerups-system.js          # Powerup spawn/pickup
│   ├── signature-moments.js        # Scripted events (whale, wingman, etc.)
│   └── particles.js                # Particle system
│
├── render/                         # Rendering modules
│   ├── background.js               # Tilemap layer rendering, parallax
│   ├── entities.js                 # Entity sprite rendering
│   ├── ui.js                       # HUD, score, chain display
│   ├── screens.js                  # Plane select, debrief, boss warning
│   └── sprites.js                  # Sprite resolution, atlas lookup
│
├── audio/
│   └── sfx.js                      # Sound effects
│
├── content/                        # Game data (unchanged)
│   ├── campaigns.js
│   ├── enemies.js
│   ├── planes.js
│   ├── powerups.js
│   ├── dialogue.js
│   └── sprites.js                  # Legacy pixel art (kept as fallback)
│
├── shared/                         # Shared between game + editor
│   ├── constants.js                # TILE_SIZE, MAP_COLS, W, H
│   ├── tile-defs.js                # Tile type enums, groups
│   ├── level-schema.js             # Level JSON validation + decode
│   └── level-loader.js             # Parse level JSON into game-ready tilemap
│
├── levels/                         # Hand-designed level files
│   ├── coral_front_01.json
│   ├── jungle_spear_01.json
│   ├── dust_convoy_01.json
│   └── iron_monsoon_01.json
│
├── assets/
│   ├── sprites/                    # Entity spritesheets (replaces individual PNGs)
│   │   ├── players.png + .json
│   │   ├── enemies.png + .json
│   │   ├── bosses.png + .json
│   │   ├── powerups.png + .json
│   │   ├── effects.png + .json
│   │   └── bullets.png + .json
│   │
│   └── tiles/                      # Tile atlases
│       ├── shared/
│       │   └── clouds.png + .json
│       ├── coral_front/
│       │   ├── water.png + .json
│       │   └── terrain.png + .json
│       ├── jungle_spear/
│       │   ├── water.png + .json
│       │   └── terrain.png + .json
│       ├── dust_convoy/
│       │   ├── water.png + .json
│       │   └── terrain.png + .json
│       └── iron_monsoon/
│           ├── water.png + .json
│           └── terrain.png + .json
│
├── editor/                         # Level editor (standalone tool)
│   ├── index.html
│   ├── editor.js
│   ├── tools/
│   │   ├── brush.js
│   │   ├── eraser.js
│   │   ├── fill.js
│   │   ├── select.js
│   │   ├── enemy-placer.js
│   │   └── ground-placer.js
│   ├── panels/
│   │   ├── tileset-panel.js
│   │   ├── layer-panel.js
│   │   ├── properties-panel.js
│   │   ├── wave-panel.js
│   │   └── trigger-panel.js
│   └── core/
│       ├── canvas-view.js
│       ├── history.js
│       ├── file-io.js
│       └── preview.js
│
├── tools/                          # Build/generation tools
│   └── generate-placeholders.js    # Generate placeholder sprites from pixel art
│
├── multiplayer.js                  # Unchanged
│
└── design/                         # Design docs (unchanged)
    ├── 1942-design.md
    ├── architecture-overhaul.md    # THIS DOCUMENT
    └── ...
```

---

## Appendix A: Key Constants Reference

| Constant | Value | Source |
|---|---|---|
| `W` (canvas width) | 960px | game.js |
| `H` (canvas height) | 1280px | game.js |
| `TILE_SIZE` | 64px | tilemap.js |
| `MAP_COLS` | 15 (960/64) | tilemap.js |
| `MAP_VISIBLE_ROWS` | 20 (1280/64) | tilemap.js |
| `PLAYER_SCALE` | 9 | game.js |
| `ENEMY_SCALE` | 12 | game.js |
| Campaigns | 4 | campaigns.js |
| Waves per campaign | 20 | campaigns.js |
| Enemy types | 8 | enemies.js |
| Mini bosses | 4 | enemies.js |
| Final bosses | 4 | enemies.js |
| Planes | 2 | planes.js |
| Powerups | 8 | powerups.js |

## Appendix B: Compatibility Notes

- **No build tools required.** The game uses ES modules loaded directly by the browser. The editor follows the same pattern.
- **Engine dependency:** The game imports `Game` from `../engine/core.js` (shared OpenArcade engine). The editor does NOT depend on the engine — it has its own canvas viewport.
- **WebGL renderer:** The existing renderer's `drawSprite` and `fillRect` methods are the only rendering API. The new `drawImageRegion` is the only addition needed.
- **Legacy fallback preserved:** The pixel-art `content/sprites.js` and `drawPixelSprite()` function remain as fallbacks. If an atlas frame is missing, the system falls back to the old per-pixel rendering. This means the game never breaks during the transition.

## Appendix C: Level File Size Estimates

| Campaign | Rows | Raw Tiles (3 layers) | Raw JSON | RLE JSON | 
|---|---|---|---|---|
| Coral Front | 120 | 5,400 | ~32KB | ~8KB |
| Jungle Spear | 150 | 6,750 | ~40KB | ~10KB |
| Dust Convoy | 180 | 8,100 | ~48KB | ~12KB |
| Iron Monsoon | 200 | 9,000 | ~54KB | ~14KB |

With spawns, triggers, and metadata: add ~5KB per level. Total level data: ~60KB for all 4 campaigns. Negligible.

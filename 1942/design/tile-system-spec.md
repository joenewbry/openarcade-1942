# 1942 Tile System & Level Editor Specification
## Round 6 — ARCADE-086+

### 1. Tile Catalog

#### 1.1 Base Tile Set (shared shapes, per-campaign palettes)

| ID | Name | Layer | Description |
|----|------|-------|-------------|
| 0 | empty | all | Transparent / no tile |
| 1 | water-deep | water | Deep ocean base |
| 2 | water-mid | water | Medium depth water |
| 3 | water-shallow | water | Shallow/light water |
| 4 | water-foam | water | Surf/foam near shore |
| 10 | terrain-sand | terrain | Sandy beach / bare ground |
| 11 | terrain-grass | terrain | Vegetation / jungle |
| 12 | terrain-rock | terrain | Rocky ground |
| 13 | terrain-structure | terrain | Man-made structure (runway, dock, bunker) |
| 14 | terrain-path | terrain | Road / cleared path |
| 20 | edge-N | terrain | Water-to-terrain edge, north side |
| 21 | edge-S | terrain | Water-to-terrain edge, south side |
| 22 | edge-E | terrain | Water-to-terrain edge, east side |
| 23 | edge-W | terrain | Water-to-terrain edge, west side |
| 24 | edge-NE | terrain | Corner, northeast (outer) |
| 25 | edge-NW | terrain | Corner, northwest (outer) |
| 26 | edge-SE | terrain | Corner, southeast (outer) |
| 27 | edge-SW | terrain | Corner, southwest (outer) |
| 28 | edge-inner-NE | terrain | Inner corner, northeast |
| 29 | edge-inner-NW | terrain | Inner corner, northwest |
| 30 | edge-inner-SE | terrain | Inner corner, southeast |
| 31 | edge-inner-SW | terrain | Inner corner, southwest |
| 40 | cloud-thin | cloud | Light wispy cloud |
| 41 | cloud-thick | cloud | Dense white cloud |
| 42 | cloud-storm | cloud | Dark storm cloud |

**Total minimum tiles: 23 unique shapes × 4 campaign palettes = 92 rendered tiles**

#### 1.2 Campaign Palettes

| Campaign | Water Colors | Terrain Colors | Cloud Style |
|----------|-------------|----------------|-------------|
| Coral Front | Blue-cyan gradient | Sandy tan, green palm, coral pink | White/light blue |
| Jungle Spear | Dark green-brown | Dense green, dark earth, grey stone | Green-tinted mist |
| Dust Convoy | Brown-amber | Tan sand, orange rock, grey concrete | Yellow-tinted haze |
| Iron Monsoon | Dark navy-purple | Steel grey, dark blue, rust | Dark grey storm |

#### 1.3 Tile Size
- **64×64 pixels** (current, keep it)
- Pixel art at native 16×16, rendered at 4x scale
- This gives a chunky retro look while filling 64px grid cells

### 2. Sprite Replacement Plan

#### 2.1 Player Planes (per plane: 12 frames total)
| Sprite | Frames | Size (native) | Notes |
|--------|--------|---------------|-------|
| specter-idle | 2 | 16×16 | Top-down silhouette + engine glow flicker |
| specter-bank-left | 1 | 16×16 | Slight tilt left, wing tip down |
| specter-bank-right | 1 | 16×16 | Mirror of bank-left |
| specter-roll | 6 | 16×16 | Roll dodge: 0°→30°→60°→90°→60°→30° |
| specter-hit | 2 | 16×16 | White-blink damage flash |
| atlas-idle | 2 | 16×16 | Heavier/wider silhouette + engine glow |
| atlas-bank-left | 1 | 16×16 | |
| atlas-bank-right | 1 | 16×16 | |
| atlas-roll | 6 | 16×16 | Same roll sequence, wider body |
| atlas-hit | 2 | 16×16 | Damage flash |

#### 2.2 Enemies
| Sprite | Frames | Size | Notes |
|--------|--------|------|-------|
| enemy-scout | 2 | 12×12 | Small, fast. 2-frame flutter |
| enemy-torpedo | 2 | 14×12 | Wider, slower |
| enemy-raider | 2 | 14×14 | Medium threat |
| enemy-gunship | 2 | 16×14 | Heavy, slower |
| enemy-bomber | 2 | 16×16 | Largest regular enemy |

#### 2.3 Bosses
| Sprite | Size | Notes |
|--------|------|-------|
| boss-coral | 32×24 | Multi-section: body + 2 turret wings |
| boss-desert | 32×28 | Tank-like, treaded |
| boss-arctic | 28×28 | Circular fortress |
| boss-storm | 36×28 | Largest, storm-themed wings |

#### 2.4 Power-ups & Effects
| Sprite | Frames | Size | Notes |
|--------|--------|------|-------|
| powerup-* (5 types) | 2 | 8×8 | Pulsing glow animation |
| explosion-small | 4 | 12×12 | Quick pop |
| explosion-large | 6 | 16×16 | Enemy death |
| explosion-boss | 8 | 32×32 | Boss destruction |
| enemy-bullet | 1 | 4×4 | Bright red dot |
| player-bullet | 1 | 3×6 | Yellow/white streak |
| cloud-1/2/3 | 1 | 32×16 | Parallax overlay clouds |

### 3. Level File Format (JSON)

```json
{
  "version": 1,
  "campaign": "coral_front",
  "name": "Coral Front - Level 1",
  "cols": 15,
  "rows": 150,
  "tileSize": 64,
  "layers": {
    "water": [[1,1,2,1,...], ...],
    "terrain": [[0,0,0,10,...], ...],
    "clouds": [[0,0,40,0,...], ...]
  },
  "groundEnemies": [
    { "type": "bunker", "col": 5, "row": 30, "facing": "south" },
    { "type": "ship", "col": 8, "row": 60, "facing": "west" }
  ],
  "enemySpawns": [
    { "wave": 1, "row": 10, "enemies": [
      { "type": "scout_zero", "col": 7, "pattern": "line" }
    ]},
  ],
  "bossArenas": [
    { "wave": 5, "startRow": 40, "endRow": 55, "clear": true }
  ],
  "scriptedMoments": [
    { "wave": 7, "type": "powerup_shower", "row": 70 }
  ],
  "metadata": {
    "author": "editor",
    "created": "2026-03-02",
    "notes": ""
  }
}
```

Each layer is a 2D array: `layers.water[row][col]` = tile ID.

### 4. Level Editor Specification

#### 4.1 Layout
```
┌──────────────────────────────────────────────────┐
│ [Save] [Load] [Export] │ [Undo] [Redo] │ [Grid] [Zoom+/-] │
├──────────┬──────────────────────┬────────────────┤
│ PALETTE  │                      │ PROPERTIES     │
│          │                      │                │
│ [Water]  │    CANVAS            │ Layer: terrain │
│  □ deep  │    (scrollable)      │ Tile: sand     │
│  □ mid   │                      │ ID: 10         │
│  □ shlw  │                      │                │
│ [Terrain]│                      │ ── Layers ──   │
│  □ sand  │                      │ ☑ Water   0.5  │
│  □ grass │                      │ ☑ Terrain 1.0  │
│  □ rock  │                      │ ☐ Clouds  0.3  │
│ [Clouds] │                      │ ☐ Enemies      │
│  □ thin  │                      │                │
│ [Tools]  │                      │ ── Spawn ──    │
│  🖌 Paint │                      │ Wave: 5        │
│  ▭ Fill  │                      │ Type: scout    │
│  ⌫ Erase │                      │ Pattern: line  │
│          │                      │                │
└──────────┴──────────────────────┴────────────────┘
```

#### 4.2 Features
1. **Layer system**: Toggle visibility per layer (eye icon). Lock layers to prevent edits (lock icon). Opacity slider per layer. Active layer highlighted.
2. **Painting**: Click = single tile. Drag = paint stroke. Shift+drag = rectangle fill. Right-click = erase.
3. **Auto-tiling**: When terrain tile placed adjacent to water, automatically select correct edge/corner variant (IDs 20-31). Uses neighbor lookup rules.
4. **Enemy overlay**: Separate entity layer. Click to place spawn markers with wave/type/pattern/hp metadata.
5. **Ground enemies**: Place on terrain tiles. Snap to grid. Set facing direction.
6. **Boss arena markers**: Define row ranges where terrain clears for boss fights.
7. **Scroll**: Mousewheel = vertical scroll through full map. Zoom: 25%-200% via Ctrl+scroll or slider.
8. **Save/Load**: JSON files in `1942/levels/` directory. One file per campaign.
9. **Preview**: Toggle button shows the map scrolling at game speed.
10. **Undo/Redo**: Diff-based stack (records added/removed cells per action).
11. **Stamp/Pattern tool**: Pre-defined tile patterns (e.g., 2×2 water pool, 3×3 island) for quick building.
12. **Collision layer**: Hidden boolean per tile for future collision detection.

#### 4.3 Keyboard Shortcuts
| Key | Tool |
|-----|------|
| V | Select/Move viewport |
| B | Brush (paint) |
| E | Eraser |
| G | Flood fill |
| R | Rectangle |
| L | Line (orthogonal) |
| S | Stamp (pattern) |
| N | Entity/enemy placer |
| P | Properties modal |
| Ctrl+G | Grid toggle |
| Ctrl+Z/Y | Undo/Redo |

#### 4.3 File Structure
```
1942/
  editor/
    index.html          — Level editor app
    editor.js           — Editor logic
    editor.css          — Editor styles
  levels/
    coral_front.json    — Level data
    jungle_spear.json
    dust_convoy.json
    iron_monsoon.json
  assets/
    tiles/
      coral_front.png   — Tile spritesheet (campaign-specific)
      jungle_spear.png
      dust_convoy.png
      iron_monsoon.png
    sprites/
      (existing sprite files, replaced with pixel art)
```

### 5. Campaign Terrain Narratives

#### Coral Front (Tutorial)
- **Act 1 (W1-5)**: Open ocean, scattered small islands. Player learns in wide-open water. W5 boss: small reef clearing.
- **Act 2 (W6-10)**: Island chain appears. Channels between islands create natural lanes. W7 powerup shower in a lagoon.
- **Act 3 (W11-15)**: Dense reef formations. Narrow passages. W13 ambush terrain: islands on all sides.
- **Act 4 (W16-20)**: Approach massive coral fortress. Terrain funnels toward final boss arena — large open clearing.

#### Jungle Spear (Aggressive)
- **Act 1 (W1-3)**: River delta, mangrove edges. W3 early boss in river bend.
- **Act 2 (W4-10)**: Dense jungle canopy. River narrows. Clearings with ruins. W6 ambush: jungle closes in.
- **Act 3 (W11-15)**: Ancient ruins emerge. Stone platforms. Waterfalls on edges.
- **Act 4 (W16-20)**: Deep jungle heart. Hidden base visible. Final boss: massive temple clearing.

#### Dust Convoy (Endurance)
- **Act 1 (W1-5)**: Coastal desert, lighthouse structures. Open dunes. W5 wingman flies over oasis.
- **Act 2 (W6-10)**: Supply route appears — road tiles cutting through desert. Oasis pools. W10 powerups at rest stop.
- **Act 3 (W11-15)**: Rocky canyon terrain. Narrow convoy paths. W15 ambush in canyon.
- **Act 4 (W16-20)**: Massive fortress approach. Runway structures. Final boss: desert fortress clearing.

#### Iron Monsoon (Gauntlet)
- **Act 1 (W1-4)**: Storm-tossed dark ocean. Rain clouds heavy on cloud layer. W4 boss: open sea.
- **Act 2 (W5-8)**: Industrial shipping lanes. Oil platforms. Metal structures. W8 boss: platform arena.
- **Act 3 (W9-12)**: Dense platform network. Searchlights (terrain accents). W11 wingman. W12 boss: central platform.
- **Act 4 (W13-20)**: The iron fortress. Massive industrial terrain. W16 boss. Final boss W20: storm eye clearing.

### 6. Implementation Priority

1. **Phase 1**: Create tile spritesheet (code-generated pixel art placeholders)
2. **Phase 2**: Replace tilemap.js to render from tile sprites instead of fillRect
3. **Phase 3**: Create level JSON files for all 4 campaigns
4. **Phase 4**: Build level editor
5. **Phase 5**: Replace AI-generated sprite PNGs with pixel art
6. **Phase 6**: Update design book with new sections

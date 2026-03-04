# BETA Tile Set — Organic & Textured Approach

## Philosophy
Hand-painted feel with atmospheric depth. Natural, organic shapes with texture and gradients. The tiles should feel alive — like a watercolor painting viewed from altitude.

## Technical Approach

### Resolution
- **Native**: 16×16 pixel art
- **Output**: 64×64 (4× upscale, each "pixel" is a 4×4 block)
- Matches the game's `TILE_SIZE = 64` specification

### Procedural Generation (Node.js + canvas)
All tiles are generated procedurally using `generate-tiles.js`. This gives us:
- **Reproducibility**: Same seed = same tiles
- **Iterability**: Tweak parameters, regenerate instantly
- **Consistency**: Shared palette and noise functions across all tiles

### Noise System
- **Value noise** with smooth Hermite interpolation for organic patterns
- **Fractal Brownian Motion (FBM)** — 3-4 octave layering for multi-scale detail
- Separate noise seeds per tile to avoid pattern repetition

### Color Approach
Colors use **continuous blending** between palette anchors rather than hard boundaries:
- Water: 4-step blue-cyan gradient (deep → dark → shallow → foam)
- Terrain: Warm earth tones (sand tan → grass green → rock grey)
- Edges: Smooth shore zone with wet sand, foam dots, shallow water transition
- Clouds: Semi-transparent overlays with volumetric shadowing (darker at bottom)

## Tile Inventory

### Water Layer (4 tiles)
| File | ID | Description |
|------|----|-------------|
| water-deep.png | 0 | Deep ocean — dark blue-teal with subtle caustic highlights |
| water-shallow.png | 1 | Shallow water — bright cyan with ripple effect and sandy undertone |
| water-dark.png | 2 | Mid-depth water — green-blue tint, distinct from deep blue |
| water-foam.png | 3 | Surf/foam — light cyan base with organic white foam streaks |

### Terrain Layer (4 tiles + empty)
| File | ID | Description |
|------|----|-------------|
| (transparent) | 0 | Empty / no terrain |
| terrain-sand.png | 1 | Sandy beach — warm tan with scattered grain and dune shadows |
| terrain-grass.png | 2 | Vegetation — rich green with light/dark clumps and sun highlights |
| terrain-rock.png | 3 | Rocky ground — grey-brown with crack patterns and moss spots |
| terrain-structure.png | 4 | Man-made — concrete with panel grid lines |

### Edge Tiles (12 tiles)
Shore transitions between water and terrain:

**Straight edges (4):**
| File | Direction | Description |
|------|-----------|-------------|
| edge-N.png | North | Water above, terrain below (placed at top of island) |
| edge-S.png | South | Terrain above, water below (placed at bottom) |
| edge-E.png | East | Terrain left, water right (placed at right side) |
| edge-W.png | West | Water left, terrain right (placed at left side) |

**Outer corners (4):**
| File | Corner | Description |
|------|--------|-------------|
| edge-NE.png | Northeast | Diagonal: terrain bottom-left, water top-right |
| edge-NW.png | Northwest | Diagonal: terrain bottom-right, water top-left |
| edge-SE.png | Southeast | Diagonal: terrain top-left, water bottom-right |
| edge-SW.png | Southwest | Diagonal: terrain top-right, water bottom-left |

**Inner corners (4):**
| File | Corner | Description |
|------|--------|-------------|
| edge-inner-NE.png | Northeast | Mostly terrain, water scoop at top-right |
| edge-inner-NW.png | Northwest | Mostly terrain, water scoop at top-left |
| edge-inner-SE.png | Southeast | Mostly terrain, water scoop at bottom-right |
| edge-inner-SW.png | Southwest | Mostly terrain, water scoop at bottom-left |

### Cloud Layer (3 tiles)
Semi-transparent overlays:
| File | ID | Description |
|------|----|-------------|
| cloud-thin.png | 1 | Wispy cloud — low opacity, horizontal stretch |
| cloud-thick.png | 2 | Dense cloud — bright core, blue-grey shadow at base |
| cloud-storm.png | 3 | Storm cloud — dark purple-grey, occasional lightning flash pixels |

## Spritesheets
- `water-sheet.png` — 4 tiles horizontal (256×64)
- `terrain-sheet.png` — 5 tiles horizontal (320×64, first tile empty/transparent)
- `edge-sheet.png` — 12 tiles horizontal (768×64)
- `cloud-sheet.png` — 3 tiles horizontal (192×64)

## Demo Grid
- `island-demo-12x12.png` — 768×768 pixel demo showing a Coral Front island formation
- Features: deep ocean → shallow reef → sand beaches → grass interior with rock

## Coral Front Palette

```
Deep Water:    #0a2840, #123c5e
Shallow Water: #42c0d8, #68d8ec
Foam:          #b8e0ec, #e8f4f8
Sand:          #e8d5a0 → #c4a862
Grass:         #5a9a50 → #2e5428
Rock:          #9a8e78 → #5e5648
Shore:         #6ab8c8, #c8e8f0
```

## Known Limitations / Future Work
1. **Tile seam alignment** — Corner tiles use diagonal gradients that don't perfectly match straight edges at boundaries. Fix: add boundary-pixel matching constraints.
2. **Only Coral Front palette** — Other campaigns (Jungle Spear, Dust Convoy, Iron Monsoon) need their own color schemes applied to the same shapes.
3. **No animation frames** — Water tiles are static. Could add 2-3 frame variations for subtle wave motion.
4. **No detail sprites** — Palm trees, docks, runways etc. are separate from the tile system.

## How to Regenerate
```bash
cd /Users/joe/dev/openarcade/1942
node assets/tiles/beta/generate-tiles.js
```

All output goes to `/assets/tiles/beta/`. The generator is deterministic (seeded RNG).

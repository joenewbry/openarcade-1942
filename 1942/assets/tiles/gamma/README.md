# Tech Architect GAMMA — Retro Arcade Classic Tiles

## Approach: Authentic 80s/90s Arcade Pixel Art

### Design Philosophy
These tiles are designed to evoke the golden age of arcade shmups — specifically Capcom's 1942, 1943, and their contemporaries. The key principles:

1. **Strict color budgets** — 4-5 colors per tile category (water, sand, grass), mimicking hardware palette limitations
2. **Native 16×16 pixel art** upscaled 4× to 64×64 with nearest-neighbor — no anti-aliasing, pure chunky pixels
3. **Structured dithering** — horizontal wave bands for water, sparse pixel-noise for sand, checkerboard clusters for grass
4. **Clean shore transitions** — bright surf/foam line (white-cyan) at every water-to-terrain edge for instant readability at scroll speed
5. **Curved corners** — quarter-circle edges on all corner tiles to break grid rigidity

### Campaign: Coral Front
The first campaign palette featuring:
- **Water**: Deep navy (#0b1a30) → mid blue (#183860) → bright (#2868a0) → cyan (#48a8d0)  
- **Sand**: Warm tan (#c8a858) with coral accent pixels (#c07060) — Coral Front identity
- **Grass**: Saturated tropical green (#287830 → #40a048 → #60c050)
- **Shore**: Cyan foam (#70c0d8) with white surf line (#e0f0f8)
- **Clouds**: Semi-transparent overlays (0.35→0.85 alpha), hand-drawn shapes

### Tile Inventory (20 tiles)

| ID | File | Description |
|----|------|-------------|
| 1 | `01-water-deep.png` | Deep ocean base — horizontal wave bands, dark |
| 2 | `02-water-mid.png` | Mid-depth water with brighter wave crests |
| 3 | `03-water-shallow.png` | Shallow water, bright with sparkle highlights |
| 4 | `04-water-foam.png` | Surf/foam zone — lightest water, near shore |
| 10 | `10-terrain-sand.png` | Sandy beach — flat warm tan with sparse noise & coral accents |
| 11 | `11-terrain-grass.png` | Tropical vegetation — checkerboard cluster pattern |
| 20 | `20-edge-N.png` | North edge: sand top, water bottom, jagged shore |
| 21 | `21-edge-S.png` | South edge: water top, sand bottom |
| 22 | `22-edge-E.png` | East edge: sand left, water right |
| 23 | `23-edge-W.png` | West edge: water left, sand right |
| 24 | `24-edge-NE.png` | Outer corner NE — quarter-circle curved shore |
| 25 | `25-edge-NW.png` | Outer corner NW |
| 26 | `26-edge-SE.png` | Outer corner SE |
| 27 | `27-edge-SW.png` | Outer corner SW |
| 28 | `28-edge-inner-NE.png` | Inner corner NE — concave water notch |
| 29 | `29-edge-inner-NW.png` | Inner corner NW |
| 30 | `30-edge-inner-SE.png` | Inner corner SE |
| 31 | `31-edge-inner-SW.png` | Inner corner SW |
| 40 | `40-cloud-thin.png` | Wispy cloud overlay (alpha-transparent) |
| 41 | `41-cloud-thick.png` | Dense cloud overlay (alpha-transparent) |

### 12×12 Island Grid Demo

`grid-12x12-island.png` — An L-shaped Pacific theater island with:
- Narrow 2-tile-wide promontory at north
- Inner-corner transition widening into 5-tile-wide jungle body
- East-extending peninsula (gameplay: natural AA gun placement)
- Detached small reef isle in bottom-right
- Flight corridors on right side for player maneuvering
- Cloud overlay wisps at screen edges

### Technical Details

- **Generator**: `generate-tiles.js` (Node.js + node-canvas)
- **Native resolution**: 16×16 pixels
- **Output resolution**: 64×64 pixels (4× nearest-neighbor)
- **Format**: PNG, RGBA (clouds use alpha transparency)
- **Shore edge technique**: 1-pixel bright surf line (#e0f0f8) at water/terrain boundary
- **Corner curves**: Math.sqrt distance from corner for smooth quarter-circle

### Grid Layout Data (IDs)
```
Row 0:  [ 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1]
Row 1:  [ 1, 1, 2, 3, 3, 2, 1, 1, 1, 1, 1, 1]
Row 2:  [ 1, 2, 3,25,20,24, 3, 2, 1, 1, 1, 1]
Row 3:  [ 1, 2, 3,23,10,22, 3, 2, 1, 1, 1, 1]
Row 4:  [ 1, 3,25,30,11,11,20,24, 3, 2, 1, 1]
Row 5:  [ 1, 3,23,11,11,11,10,22, 3, 2, 1, 1]
Row 6:  [ 1, 3,23,10,11,11,28,20,20,24, 3, 1]
Row 7:  [ 1, 3,27,21,10,10,10,10,10,22, 3, 1]
Row 8:  [ 1, 2, 3, 3,27,21,21,21,21,26, 3, 1]
Row 9:  [ 1, 1, 2, 3, 3, 3, 3, 3, 3, 3, 2, 1]
Row 10: [ 1, 1, 1, 2, 2, 1, 1, 2, 3,25,24, 2]
Row 11: [ 1, 1, 1, 1, 1, 1, 1, 2, 3,27,26, 2]
```

### Quality Rating
Evaluated at **7.5/10** for arcade authenticity:
- ✅ Instant readability at scroll speed
- ✅ Three-layer material hierarchy (deep water → shallow → sand → jungle)
- ✅ Asymmetric island shape with gameplay-functional geography
- ✅ Era-appropriate palette constraints
- ⚠️ Some corner transitions could be smoother with dedicated diagonal tiles
- ⚠️ Shallow water band width could vary more for naturalism

# Delta Tile Set — Coral Front Campaign
## Approach: MINIMALIST & STYLIZED

**Tech Architect: Delta**
**Generated: 2026-03-02**

---

### Design Philosophy

**Minimalist & Stylized** — Simple, bold shapes with strong visual hierarchy. Modern indie game aesthetics meets retro pixel art. Clean, readable, with striking color choices.

Key principles:
- **16×16 native → 4× scale** to 64×64 for chunky retro pixel feel
- **Limited palettes** per tile (2-4 colors) for visual clarity
- **Strong color contrast** between water/sand/grass for instant readability
- **Coral Front palette**: Blue-cyan gradient water, sandy tan terrain, green vegetation, white/light blue clouds

### Tile Inventory

| File | Tile ID | Description |
|------|---------|-------------|
| `water-deep.png` | 1 | Deep ocean — dark navy with cyan wave patterns |
| `water-mid.png` | 2 | Medium depth — medium blue with subtle wave accents |
| `water-shallow.png` | 3 | Shallow water — bright cyan-turquoise with ripple highlights |
| `water-foam.png` | 4 | Surf/foam — light turquoise with white foam streaks |
| `terrain-sand.png` | 10 | Sandy beach — warm tan with grain detail |
| `terrain-grass.png` | 11 | Vegetation/jungle — rich green with darker foliage detail |
| `edge-N.png` | 20 | Water-to-terrain edge, north side |
| `edge-S.png` | 21 | Water-to-terrain edge, south side |
| `edge-E.png` | 22 | Water-to-terrain edge, east side |
| `edge-W.png` | 23 | Water-to-terrain edge, west side |
| `edge-NE.png` | 24 | Corner, northeast (outer) |
| `edge-NW.png` | 25 | Corner, northwest (outer) |
| `edge-SE.png` | 26 | Corner, southeast (outer) |
| `edge-SW.png` | 27 | Corner, southwest (outer) |
| `cloud-thin.png` | 40 | Light wispy cloud |
| `cloud-thick.png` | 41 | Dense white cloud |

### Generated Assets

| File | Description |
|------|-------------|
| `spritesheet.png` | All 16 tiles in a horizontal strip (1024×64) |
| `spritesheet.json` | Frame metadata for the spritesheet |
| `island-grid-12x12.png` | Demo 12×12 island grid (768×768) |
| `island-grid-12x12.json` | Grid layout data with tile IDs |

### Color Palette

```
Deep Water:     #0A1628 (base) + #1B4B6B (waves)
Mid Water:      #1868A8 (base) + #3090C0 (accents)
Shallow Water:  #2BA4D8 (base) + #7DD8F0 (ripples)
Foam:           #60D0E8 (base) + #FFFFFF (foam)
Sand:           #E8C878 (base) + #F0DCA0 (grain)
Grass:          #2D8B46 (base) + #1A5C2E (foliage)
Clouds:         #FFFFFF (body) + #D6EFFF (wisps)
Edge Foam:      #FFFFFF (surf line)
```

### Generation Method

1. **AI Generation**: Each tile generated with `nano-banana --model pro` at 1K resolution
2. **Pixel Art Processing**: Resized 1024→16×16 (NEAREST) → 64×64 (NEAREST × 4x)
3. **Assembly**: Python PIL for spritesheet and grid composition

### Island Grid Layout

The 12×12 demo grid shows a central tropical island formation:
- Deep water surrounds the entire grid
- Medium water creates a transitional band
- Shallow water appears near the shore
- Sand beach rings the island
- Green vegetation fills the interior
- Edge and corner tiles create water-to-land transitions

```
Grid visualization (simplified):
D D D D D D D D D D D D
D D D M M M M M M D D D
D D M S NW N N N NE S D D
D M S NW s  s  g  s  s  NE M D
D M NW W  s  g  g  g  s  E  M D
D M W  s  g  g  g  g  g  E  M D
D M W  s  g  g  g  g  s  E  M D
D M SW W  s  g  g  s  s  E  M D
D M S  SW s  s  s  s  SE S  M D
D D M  S  SW So So SE S  M  D D
D D D  M  M  S  S  M  M  D  D D
D D D  D  D  D  D  D  D  D  D D
```

### Known Limitations & Notes

- **Edge consistency**: AI-generated edges have slight style variation between tiles (foam line thickness, texture detail). Production use would benefit from manual pixel-art cleanup at the 16×16 level.
- **Missing tiles**: Inner corners (IDs 28-31), rock terrain (ID 12), structures (ID 13), path (ID 14), and storm cloud (ID 42) not yet generated.
- **Tileability**: Individual tiles have good visual fill but seam alignment between adjacent tiles could be improved with manual editing.
- **Cloud layer**: Cloud tiles are on the same opaque background — for proper game use, they need alpha transparency to overlay on water/terrain layers.

### Workflow for Production Polish

1. Open 16×16 source tiles in a pixel editor (Aseprite, Pixelorama)
2. Hand-clean pixel placement for deliberate pattern instead of AI noise
3. Ensure edge pixels match for seamless tiling
4. Add alpha to cloud tiles
5. Re-export at 4× scale

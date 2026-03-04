# Jungle Spear Tile Set (Alpha-Style Clean Geometry)

This set is built with the same deterministic, edge-safe approach as the winning Alpha direction:
- Native painting at `16x16`
- Nearest-neighbor upscale to `64x64`
- Geometric shore/corner masks for reliable tile matching
- Controlled dithering (no noisy procedural blur)

## Generation

```bash
cd /Users/joe/dev/openarcade/1942/assets/tiles/jungle-spear
uv run generate-jungle-spear.py
```

## Files

### Required tiles (64x64 + native 16x16)
- `water-deep(.png|-16.png)`
- `water-mid(.png|-16.png)`
- `water-shallow(.png|-16.png)`
- `water-foam(.png|-16.png)`
- `terrain-sand(.png|-16.png)`
- `terrain-grass(.png|-16.png)`
- `terrain-rock(.png|-16.png)`
- `terrain-structure(.png|-16.png)`
- `edge-N(.png|-16.png)`
- `edge-S(.png|-16.png)`
- `edge-E(.png|-16.png)`
- `edge-W(.png|-16.png)`
- `edge-NE(.png|-16.png)`
- `edge-NW(.png|-16.png)`
- `edge-SE(.png|-16.png)`
- `edge-SW(.png|-16.png)`
- `edge-inner-NE(.png|-16.png)`
- `edge-inner-NW(.png|-16.png)`
- `edge-inner-SE(.png|-16.png)`
- `edge-inner-SW(.png|-16.png)`
- `cloud-thin(.png|-16.png)`
- `cloud-thick(.png|-16.png)`
- `cloud-storm(.png|-16.png)`

### Demo + reference
- `demo-grid-12x12.png`
- `demo-grid-12x12.json`
- `tileset-atlas.png`

## Palette (Jungle Spear)

- Water deep: `#133831`, `#0d2722`, `#1c483f`
- Water mid: `#1e5444`, `#2b705a`
- Water shallow: `#3e8362`, `#589e78`
- Foam: `#acd2a8`
- Jungle floor (sand slot): `#5e5434`, `#4f442a`, `#706440`
- Dense vegetation (grass slot): `#2a6030`, `#214e27`, `#193e20`, `#3f7c42`
- Rock: `#5c6460`, `#494f4c`, `#3a3f3d`, `#79807c`
- Ruins/structure: `#61584a`, `#50483c`, `#40382e`, moss `#42603e`
- Clouds (RGBA, transparent):
  - Thin: `rgba(170,198,170,0.35)`
  - Thick: `rgba(152,185,152,0.59)`
  - Storm: `rgba(92,116,92,0.73)`

## Notes

- Naming follows established campaign conventions (`water-*`, `terrain-*`, `edge-*`, `edge-inner-*`, `cloud-*`).
- Demo JSON uses tile IDs from the tile system spec (`1..4`, `10..13`, `20..31`, `40..42`).
- Cloud tiles are transparent overlays so the demo can composite water + terrain + clouds cleanly.

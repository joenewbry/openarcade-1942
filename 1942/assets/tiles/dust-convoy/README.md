# Dust Convoy Tile Set (Alpha Clean/Geometric)

This tile set follows the Alpha winning approach:
- Native authoring at `16x16`
- Upscaled to `64x64` with nearest-neighbor (`4x`)
- Deterministic geometric patterns for strong tileability

## Files

- `generate-dust-convoy-tiles.py` - tile + demo generator
- `clean/*-16.png` - native source tiles
- `clean/*.png` - game-ready 64x64 tiles
- `clean/dust-convoy-grid-12x12.png` - 12x12 demo image
- `clean/dust-convoy-grid-12x12.json` - matching demo map
- `clean/tileset-atlas.png` - horizontal strip of all 64x64 tiles

## Tile Naming (campaign-consistent)

### Water
- `water-deep`
- `water-mid`
- `water-shallow`
- `water-foam`

### Terrain
- `sand`
- `grass` (sparse desert growth)
- `rock` (canyon strata)
- `structure` (runway/concrete)
- `path` (desert road)

### Edges
- `edge-N`, `edge-S`, `edge-E`, `edge-W`
- `edge-NE`, `edge-NW`, `edge-SE`, `edge-SW`
- `inner-NE`, `inner-NW`, `inner-SE`, `inner-SW`

### Clouds
- `cloud-thin`
- `cloud-thick`
- `cloud-storm`

## Palette

- Deep oasis water: `#185259`, `#123e43`, `#24686e`
- Mid oasis water: `#2a7672`, `#3a9089`
- Shallow water: `#4ea593`, `#6cc2aa`
- Foam: `#e2d6b8`, `#f2ecd2`
- Sand: `#deb676`, `#caa062`, `#b68c54`
- Sparse grass: `#8f9a58`, `#7a844a`
- Rock canyon: `#ac6e48`, `#925a38`, `#76462c`
- Structure/runway: `#8d8d88`, `#70716d`, `#5e5f5c`, line `#d5cda4`
- Path: `#b08652`, `#987042`
- Clouds (RGBA haze): light `#ead6a5`, thick `#d6bc84`, storm `#927c58`

## Method

1. Procedural tile synthesis at `16x16` using stable formulas by `(x, y)`.
2. Shared seam logic for all edge/corner tiles to keep transitions clean.
3. 64x64 output via nearest-neighbor scaling only.
4. Demo map composes tiles into an oasis convoy scene.

## Regenerate

```bash
cd /Users/joe/dev/openarcade/1942/assets/tiles/dust-convoy
uv run generate-dust-convoy-tiles.py
```

(If `uv` is unavailable, `python3 generate-dust-convoy-tiles.py` also works when Pillow is installed.)

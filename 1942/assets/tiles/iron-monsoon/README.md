# Iron Monsoon Tile Set (Alpha Approach)

This directory contains the complete **Iron Monsoon** campaign tile set for OpenArcade 1942 using the winning Alpha clean/geometric workflow:
- native tile authoring at **16x16**
- deterministic pixel patterns for seamless edges
- nearest-neighbor upscale to **64x64** outputs

## Files

- `generate-iron-monsoon-tiles.py` - generator script (single source of truth)
- `*-16.png` - native 16x16 source tiles
- `*.png` - 64x64 game-ready tiles
- `iron-monsoon-tileset-atlas.png` - horizontal atlas of all generated 64x64 tiles
- `iron-monsoon-demo-12x12.png` - composed demo map image (12x12)
- `iron-monsoon-demo-12x12-2x.png` - 2x zoomed demo image
- `iron-monsoon-demo-12x12.json` - 12x12 demo map in layered tile-ID format

## Tile Naming and ID Mapping

### Water layer
- `water-deep` -> ID `1`
- `water-mid` -> ID `2`
- `water-shallow` -> ID `3`
- `water-foam` -> ID `4`

### Terrain layer (Iron Monsoon equivalents)
- `terrain-platform` -> ID `10`
- `terrain-deck` -> ID `11`
- `terrain-steel` -> ID `12`
- `terrain-structure` -> ID `13`
- `terrain-path` -> ID `14`

### Shore edges and corners
- `edge-N` -> ID `20`
- `edge-S` -> ID `21`
- `edge-E` -> ID `22`
- `edge-W` -> ID `23`
- `edge-NE` -> ID `24`
- `edge-NW` -> ID `25`
- `edge-SE` -> ID `26`
- `edge-SW` -> ID `27`
- `inner-NE` -> ID `28`
- `inner-NW` -> ID `29`
- `inner-SE` -> ID `30`
- `inner-SW` -> ID `31`

### Cloud layer
- `cloud-thin` -> ID `40`
- `cloud-thick` -> ID `41`
- `cloud-storm` -> ID `42`

## Palette

### Water (dark storm ocean)
- Deep: `#121828`, `#0c111e`, `#1e263e`
- Mid: `#1d2b46`, `#273858`
- Shallow: `#344665`, `#4e6588`
- Foam: `#a0b0c9`, `#7e8fab`

### Terrain (industrial storm palette)
- Platform steel: `#58606e`, `#49515e`
- Deck plating: `#665e58`, `#564e49`
- Heavy steel: `#707680`, `#5a606a`
- Structure metal: `#4a5463`, `#3c4452`
- Path/route stripe: `#74604d`, `#5f4e3e`
- Rust accent: `#8a583e`

### Clouds (heavy storm mood)
- Thin mist: `rgba(134,143,160,0.36)`
- Thick cloud: `rgba(109,119,138,0.53)` + `rgba(88,97,116,0.67)`
- Storm cloud: `rgba(61,70,87,0.78)` + `rgba(42,50,64,0.91)`
- Lightning accent: `rgba(203,215,229,0.74)`

## Method

The generator keeps Alpha's edge-precision approach:
1. Generate deterministic texture fills at 16x16 for each base surface.
2. Build shoreline edges with fixed boundary math (N/S/E/W) plus foam seam.
3. Build outer and inner corners with geometric radial masks.
4. Generate cloud overlays as RGBA for compositing.
5. Upscale all tiles 4x to 64x64 with nearest-neighbor.
6. Compose a 12x12 demo image and emit a layered JSON map with exact tile IDs.

## Regenerate

```bash
cd /Users/joe/dev/openarcade/1942/assets/tiles/iron-monsoon
uv run generate-iron-monsoon-tiles.py
```

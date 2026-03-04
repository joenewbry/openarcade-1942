# Tile Runtime Integration (T013)

## What Changed
- Runtime terrain rendering now pulls tiles from campaign tile assets (`assets/tiles/<campaign>/`) instead of geometry/fillRect-first terrain rendering.
- Runtime tilemaps now prefer authored level JSON (`levels/<campaign>.json`) and normalize both:
  - New editor format (`layers.water|terrain|clouds`, `campaign`)
  - Legacy format (`waterLayer`, `terrainLayer`, `campaignId`)
- Core layers are rendered in runtime order:
  - `waterLayer`
  - `terrainLayer`
  - `cloudLayer`

## Integration Points
- `content/tilemap.js`
  - `getCampaignTilemap(campaignId, fallbackRows)`
  - `drawTilemapLayer(...)`
  - Level format normalization and fallback procedural map generation
  - Atlas/sprite caching for tile textures
- `game.js`
  - `getOrCreateTilemap` now uses `getCampaignTilemap`
  - Background now draws `cloudLayer` in addition to water/terrain

## Asset/Tile Mapping
- Water IDs: `1-4` -> water atlas frames
- Terrain IDs: `10-14` -> terrain atlas frames
- Clouds IDs: `40-42` -> shared clouds atlas frames
- Edge/corner terrain IDs (`20-31`) are supported with color fallback when atlas frames are unavailable.

## Fallback Behavior
- If a level JSON is missing or fails to load, runtime uses procedural fallback tilemaps.
- If tile atlas files or specific frames are missing, runtime falls back to campaign palette colors per tile ID.

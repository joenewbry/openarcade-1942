# 1942 Asset Pipeline Documentation

## Overview

**1942** is a high-fidelity pixel art vertical scrolling shooter for browsers, featuring a sophisticated multi-layer rendering system, procedural tile-based environments, and classic WWII Pacific theater combat. The game emphasizes clean geometric pixel art aesthetics with a modern WebGL-accelerated rendering pipeline.

### Core Visual Philosophy
- **Pixel Art Fidelity**: Native 16×16 sprites scaled 4× for chunky retro aesthetics
- **Geometric Clarity**: Clean lines, high contrast, readable silhouettes  
- **Layered Depth**: Multi-layer parallax system creates convincing 2D depth
- **Campaign Cohesion**: 4 distinct visual themes with unified tile/sprite systems

### Rendering Approach
- **Primary**: WebGL2 with batched sprite rendering for performance
- **Fallback**: Canvas 2D with pixel art upscaling for compatibility
- **Resolution**: 960×1280 canvas (3:4 portrait for vertical scrolling)
- **Frame Target**: 60fps with 16.67ms budget per frame

---

## Tile System Architecture

### Tile Specifications
- **Size**: 64×64 pixels (16×16 native, 4× upscaled)
- **Grid**: 15 columns × variable rows (15×960px = screen width)
- **Format**: PNG with transparency support
- **Atlas**: Campaign-specific tilesheets for efficient GPU upload

### Core Tile Types

#### Water Layer (Base, Z:0)
```
ID  | Name         | Visual Description
----+--------------+--------------------------------------------------
0   | Deep Water   | Darkest blue base (#19466b coral, varies per campaign)
1   | Shallow      | Medium blue with slight texture (#1c5d8f)  
2   | Dark Current | Deep water variant for channels (#16547a)
3   | Foam/Surf    | Light water with wave patterns (#22729e)
```

#### Terrain Layer (Islands, Z:100) 
```
ID  | Name         | Visual Description
----+--------------+--------------------------------------------------
0   | Transparent  | No terrain (water shows through)
1   | Sand/Beach   | Light tan, granular texture (#d5bc84)
2   | Vegetation   | Green jungle/grass (#4b7c45) 
3   | Rock         | Gray stone formations (#8a7a5e)
4   | Structures   | Man-made (runways, docks, bunkers) (#6b5d42)
```

#### Edge Tiles (Seamless Coastlines)
```
ID  | Name         | Usage
----+--------------+--------------------------------------------------
20  | Edge-N       | Water-to-terrain transition, north side
21  | Edge-S       | Water-to-terrain transition, south side  
22  | Edge-E       | Water-to-terrain transition, east side
23  | Edge-W       | Water-to-terrain transition, west side
24  | Corner-NE    | Outer corner, northeast
25  | Corner-NW    | Outer corner, northwest  
26  | Corner-SE    | Outer corner, southeast
27  | Corner-SW    | Outer corner, southwest
28  | Inner-NE     | Inner corner (bays/inlets), northeast
29  | Inner-NW     | Inner corner, northwest
30  | Inner-SE     | Inner corner, southeast  
31  | Inner-SW     | Inner corner, southwest
```

### Campaign Palettes

Each campaign uses the same tile shapes but with distinct color palettes:

#### Coral Front (Tutorial Campaign)
- **Water**: Blue-cyan gradient (#19466b → #22729e)
- **Terrain**: Sandy tan (#d5bc84), tropical green (#4b7c45), coral pink accents
- **Atmosphere**: Bright, welcoming, high contrast for learning

#### Jungle Spear (Aggressive Campaign) 
- **Water**: Dark green-brown rivers (#25442f → #2d5a3e)
- **Terrain**: Dense jungle green (#2d5420), dark earth (#5a8842)
- **Atmosphere**: Dense, claustrophobic, muted colors

#### Dust Convoy (Endurance Campaign)
- **Water**: Brown-amber oases (#68452b → #a47848)  
- **Terrain**: Desert tan (#be8a52), orange rock (#d4a065)
- **Atmosphere**: Hot, arid, yellow-orange dominated

#### Iron Monsoon (Gauntlet Campaign)
- **Water**: Dark navy-purple storm seas (#1d2238 → #3a4268)
- **Terrain**: Steel gray (#4b5578), industrial blue (#596286)  
- **Atmosphere**: Cold, industrial, stormy blues and grays

---

## Layer Architecture

The game uses a sophisticated Z-buffer system with 12 distinct rendering layers:

```ascii
┌─────────────────────────────────────────────────────────────────┐
│                           UI LAYER (Z: 1000)                   │
│                    Score │ Lives ♥♥♥ │ Bombs 💣💣                │
├─────────────────────────────────────────────────────────────────┤
│                      PARTICLES (Z: 800-900)                    │
│                   💥 Explosions │ ✨ Sparks │ 🌊 Debris          │
├─────────────────────────────────────────────────────────────────┤
│                       PLAYER LAYER (Z: 700)                    │
│                      ✈️ Player │ 👥 Wingman │ 🛡️ Shield           │
├─────────────────────────────────────────────────────────────────┤
│                     ENEMY ENTITIES (Z: 600)                    │
│                   🛩️ Planes │ 🚁 Gunships │ 👑 Bosses             │
├─────────────────────────────────────────────────────────────────┤
│                      BULLET LAYER (Z: 500)                     │ 
│                   💙 Player Bullets │ ❤️ Enemy Bullets           │
├─────────────────────────────────────────────────────────────────┤
│                     WAVE EFFECTS (Z: 400)                      │
│                  🌊 Ship Wakes │ 💦 Splashes │ 🌪️ Foam             │ 
├─────────────────────────────────────────────────────────────────┤
│                    POWERUPS/PICKUPS (Z: 350)                   │
│                 ⚡ Weapons │ 🛡️ Shield │ 💨 Speed │ 💣 Bombs        │
├─────────────────────────────────────────────────────────────────┤
│                   GROUND ENEMIES (Z: 300)                      │
│                  🚢 Ships │ 🏰 Bunkers │ 🎯 Turrets               │
├─────────────────────────────────────────────────────────────────┤
│                    AMBIENT OBJECTS (Z: 250)                    │
│                  🐋 Whales │ 🏝️ Islands │ 🦅 Birds                │
├─────────────────────────────────────────────────────────────────┤
│                     SHADOW LAYER (Z: 200)                      │
│              🌑 Moving Shadows (0.12α) │ Atmospheric Depth       │
├─────────────────────────────────────────────────────────────────┤
│                   TERRAIN LAYER (Z: 100)                       │
│             🏝️ Islands │ 🏖️ Beaches │ 🌿 Vegetation │ 🏗️ Structures    │
│                   (Parallax: 0.5× scroll speed)                │
├─────────────────────────────────────────────────────────────────┤
│                     WATER LAYER (Z: 0)                         │
│               🌊 Ocean Base │ 🏊 Currents │ 🌊 Animated Waves        │
│                   (Parallax: 0.2× scroll speed)                │
└─────────────────────────────────────────────────────────────────┘
```

### Parallax System
Different layers scroll at different speeds to create depth illusion:

```javascript
// Per-frame scroll calculations
waterScrollY = (frameCount × 0.2) % totalMapHeight    // Slow, deep
terrainScrollY = (frameCount × 0.5) % totalMapHeight  // Medium, islands  
shadowOffset = (frameCount × 0.8) % shadowHeight     // Fast, atmospheric
```

### Critical Wave Effects Layer
**New addition**: Ship wake system renders between terrain and bullets:

```ascii
   🚢 SHIP (Z: 600)
      │
      ▼ spawn wakes every 8 frames
┌─────────────────┐
│   ╭─────────╮   │ ← Wave Effects (Z: 400)  
│ ╭─┘ ┌─────┐ └─╮ │   ON TOP of water tiles
│ │   │WATER│   │ │   BEHIND ship sprite
│ ╰─╮ └─────┘ ╭─╯ │   Fade over 60 frames
│   ╰─────────╯   │
└─────────────────┘
    WATER TILES (Z: 0)
```

---

## Sprite System

### Player Planes

#### Specter (XP-59)
```
Sprite Set               | Frames | Size    | Notes
-------------------------+--------+---------+--------------------------------
specter-idle             | 2      | 16×16   | Engine glow flicker
specter-bank-left        | 1      | 16×16   | Slight left tilt (REMOVED)
specter-bank-right       | 1      | 16×16   | Slight right tilt (REMOVED)  
specter-roll             | 6      | 16×16   | 0°→30°→60°→90°→60°→30° sequence
specter-hit              | 2      | 16×16   | White damage flash
```

#### Atlas (B7)
```
Sprite Set               | Frames | Size    | Notes  
-------------------------+--------+---------+--------------------------------
atlas-idle               | 2      | 16×16   | Heavier silhouette + glow
atlas-bank-left          | 1      | 16×16   | (REMOVED - flat movement only)
atlas-bank-right         | 1      | 16×16   | (REMOVED - flat movement only)
atlas-roll               | 6      | 16×16   | Same sequence, wider body
atlas-hit                | 2      | 16×16   | Damage flash
```

**Technical Notes**: 
- Banking sprites removed per ARCADE-069 (flat sliding movement)
- Roll provides I-frames during middle frames (2-4 of 6)
- Hit flash uses white additive blending

### Enemy Aircraft

#### Regular Enemies
```
Sprite Name    | Size   | Frames | Description
---------------+--------+--------+------------------------------------------
enemy-scout    | 12×12  | 2      | Fast interceptor, 2-frame wing flutter
enemy-torpedo  | 14×12  | 2      | Torpedo bomber, wider profile  
enemy-raider   | 14×14  | 2      | Medium fighter, balanced threat
enemy-gunship  | 16×14  | 2      | Heavy gunship, slow but dangerous
enemy-bomber   | 16×16  | 2      | Largest regular enemy, area denial
```

#### Boss Sprites  
```
Boss Name      | Size   | Description
---------------+--------+--------------------------------------------------
boss-coral     | 32×24  | Multi-section: body + 2 destructible turrets
boss-desert    | 32×28  | Tank-like desert fortress, treaded
boss-arctic    | 28×28  | Circular ice fortress, rotating sections
boss-storm     | 36×28  | Largest boss, storm-themed dynamic wings
```

### Ships & Ground Enemies

#### Naval Units
```
Sprite Name         | Size   | Description
--------------------+--------+------------------------------------------
ship-carrier        | 32×16  | Aircraft carrier, spawns planes
ship-battleship     | 28×14  | Heavy guns, destructible turrets
ship-destroyer      | 20×12  | Fast escort, anti-aircraft focused
ship-submarine      | 16×8   | Partially submerged, torpedo attacks
```

#### Land Installations  
```
Sprite Name         | Size   | Description
--------------------+--------+------------------------------------------
turret-small        | 8×8    | Basic AA gun, single shot
turret-cannon       | 12×12  | Heavy artillery, area damage  
turret-destroyed    | 12×12  | Destroyed state, smoke effects
bunker-small        | 16×12  | Fortified position, multiple guns
bunker-large        | 24×16  | Major installation, boss-level HP
```

### Powerups & Collectibles

#### Power-up System
```
Sprite Name         | Size   | Frames | Effect
--------------------+--------+--------+----------------------------------
powerup-double      | 8×8    | 2      | Double-shot upgrade (blue)
powerup-speed       | 8×8    | 2      | Movement speed boost (green)  
powerup-shield      | 8×8    | 2      | Temporary invulnerability (cyan)
powerup-bomb        | 8×8    | 2      | Screen-clear bomb (red)
powerup-shot        | 8×8    | 2      | Generic weapon upgrade (yellow)
```

**Animation**: 2-frame pulsing glow at 15fps (4 frames per animation frame)

### Projectiles & Effects

#### Bullet System
```
Bullet Type         | Size   | Description
--------------------+--------+------------------------------------------
player-bullet       | 3×6    | Cyan with white core, glow trail
enemy-bullet         | 4×4    | Red/pink dot, high visibility
boss-bullet          | 6×6    | Large orange projectile
laser-beam           | 2×32   | Continuous beam weapons
```

#### Explosion Sprites
```
Explosion Type       | Size   | Frames | Duration (60fps)
---------------------+--------+--------+------------------  
explosion-small      | 12×12  | 4      | 8 frames
explosion-large      | 16×16  | 6      | 12 frames
explosion-boss       | 32×32  | 8      | 16 frames
explosion-bullet     | 8×8    | 3      | 6 frames
```

---

## Animation Systems

### Water Tile Animation
```javascript
// Animated water using UV offset scrolling
waterTileFrame = Math.floor((gameTime * 0.1) % 4);
// Cycles through water tile variants for wave motion
```

### Wave/Wake Effects
**Ship Wake System**: Creates realistic water displacement behind moving ships.

```javascript
// Wave effect lifecycle
WaveEffect {
  x, y: worldPosition,
  waveType: 'wake' | 'splash' | 'foam',
  life: framesRemaining (0-60),
  maxLife: 60,
  scale: sizeMultiplier (0.5-1.5),
  sourceShip: reference
}

// Spawning: Every 8 frames behind moving ships  
// Rendering: Alpha fade from 1.0 → 0.0 over lifetime
// Scale: Slight growth during fade for dispersion effect
```

### Plane Banking (Removed)
**ARCADE-069**: Banking animations removed. Planes move flat horizontally without tilting for simplified controls and consistent hitbox.

### Explosion Sequences  
**Multi-stage Explosions**:
1. **Flash Frame**: Pure white, 2 frames  
2. **Expansion**: Growing fireball, orange→yellow core
3. **Smoke**: Gray particle dispersion  
4. **Fade**: Alpha reduction over final frames

### Bullet Patterns
**Enemy Bullet Choreography**:
- **Linear**: Straight shots at player position
- **Spread**: Fan of 3-5 bullets  
- **Spiral**: Rotating bullet streams (bosses)
- **Tracking**: Slow bullets that follow player briefly

---

## Level/Board System

### Map Format (JSON)
```json
{
  "version": 1,
  "campaign": "coral_front",
  "name": "Coral Front - Wave 1",
  "cols": 15,
  "rows": 150,
  "tileSize": 64,
  "layers": {
    "water": [[1,1,2,1,...], [0,1,1,2,...], ...],
    "terrain": [[0,0,0,10,...], [0,11,12,0,...], ...],
    "cloud": [[0,0,40,0,...], [41,0,0,42,...], ...]
  },
  "groundEnemies": [
    { 
      "type": "bunker", 
      "col": 5, 
      "row": 30, 
      "facing": "south",
      "hp": 200 
    }
  ],
  "enemySpawns": [
    { 
      "wave": 1, 
      "row": 10, 
      "enemies": [
        { "type": "scout_zero", "col": 7, "pattern": "line" }
      ]
    }
  ]
}
```

### Scrolling Mechanics
- **Direction**: Top-to-bottom (negative Y)
- **Speed**: 1 pixel/frame base (60 pixels/second)  
- **Coordinate System**: World coordinates, camera follows automatically
- **Screen Wrapping**: Player constrained to 960px width, enemies can spawn off-screen

### Campaign Structure
Each campaign: **20 waves**
- **Waves 1-4**: Regular enemy formations
- **Wave 5**: Mini-boss encounter  
- **Waves 6-9**: Escalated regular enemies
- **Wave 10**: Mini-boss encounter
- **Waves 11-14**: Advanced enemy patterns
- **Wave 15**: Mini-boss encounter  
- **Waves 16-19**: Final approach, maximum difficulty
- **Wave 20**: Final boss battle

---

## Editor Pipeline

### Level Editor (Web-based)
**Location**: `/editor/index.html`
**Architecture**: Pure JavaScript, Canvas-based WYSIWYG editor

#### Interface Layout
```ascii
┌──────────────────────────────────────────────────┐
│ [Save] [Load] [Export] │ [Undo] [Redo] │ [Grid] [Zoom] │
├──────────┬──────────────────────┬────────────────┤
│ PALETTE  │                      │ PROPERTIES     │
│          │                      │                │
│ [Water]  │    CANVAS            │ Layer: terrain │
│  ☐ deep  │    (scrollable       │ Tile: sand     │
│  ☐ mid   │     960×4800px)      │ ID: 10         │
│  ☐ shlw  │                      │                │
│ [Terrain]│                      │ ── Layers ──   │
│  ☐ sand  │                      │ ☑ Water   0.5  │
│  ☐ grass │                      │ ☑ Terrain 1.0  │
│  ☐ rock  │                      │ ☐ Cloud   0.3  │
│ [Clouds] │                      │ ☐ Enemies      │
│  ☐ thin  │                      │                │
│ [Tools]  │                      │ ── Spawn ──    │
│  🖌 Paint │                      │ Wave: 5        │
│  ▭ Fill  │                      │ Type: scout    │
│  ⌫ Erase │                      │ Pattern: line  │
└──────────┴──────────────────────┴────────────────┘
```

#### Core Features
1. **Multi-layer Editing**: Toggle visibility/opacity per layer
2. **Auto-tiling**: Automatic edge/corner tile selection for terrain borders
3. **Entity Placement**: Enemy spawn points with wave/pattern metadata
4. **Pattern Tools**: Pre-defined tile combinations (2×2 pools, 3×3 islands)
5. **Undo/Redo**: Diff-based action history
6. **Live Preview**: Real-time scrolling preview at game speed

#### Keyboard Shortcuts
```
V = Viewport/select    B = Brush (paint)    E = Eraser
G = Flood fill         R = Rectangle        L = Line
S = Stamp (pattern)    N = Entity placer    P = Properties
Ctrl+G = Grid toggle   Ctrl+Z/Y = Undo/Redo
```

### Path Visualization
**Enemy Movement**: Editor shows projected paths for enemy spawn patterns:
- **Line**: Straight vertical descent
- **Sine**: Side-to-side weaving  
- **Circle**: Circular/orbital patterns
- **Formation**: Multi-enemy coordinated movement

### Level Authoring Workflow
1. **Base Tiles**: Paint water layer foundation
2. **Terrain**: Add islands, coastlines (auto-edge detection)
3. **Details**: Place structures, vegetation, rocks
4. **Enemies**: Set spawn points with timing metadata
5. **Polish**: Add cloud layer, ambient objects
6. **Test**: Live preview mode shows scrolling + enemy spawns
7. **Export**: Save JSON to `/levels/campaign_name.json`

---

## VFX & Particles

### Particle System Architecture
**Engine**: Custom WebGL particle system with 1000-particle budget per frame.

#### Particle Types
```javascript
ParticleType {
  EXPLOSION_SPARK,  // Orange/yellow sparks from explosions
  BULLET_TRAIL,     // Cyan afterimage for player bullets  
  ENGINE_SMOKE,     // Gray exhaust from damaged enemies
  WATER_SPLASH,     // White droplets from ship impacts
  DEBRIS_CHUNK,     // Brown/gray pieces from destroyed structures
  SCORE_POPUP,      // Yellow "+100" text particles
  SHIELD_SHIMMER    // Blue sparkles around shielded player
}
```

### VFX Catalog

#### Explosions
```
Effect Name          | Duration | Particles | Description
---------------------+----------+-----------+--------------------------------
explosion-small      | 12f      | 8-12      | Enemy destruction, orange sparks
explosion-large      | 20f      | 16-24     | Boss section, mixed debris  
explosion-boss       | 30f      | 32-48     | Final boss, screen-filling
bullet-impact        | 6f       | 4-6       | Bullet hits, small sparks
ship-destruction     | 25f      | 20-30     | Naval unit, water splash mix
```

#### Bullet Impacts
- **Wall Hit**: Stone chips (gray particles)
- **Water Hit**: White splash droplets  
- **Metal Hit**: Yellow/orange sparks
- **Enemy Hit**: Red damage flash + small debris

#### Scoring Popups  
```javascript
// Text particle system for score feedback
ScorePopup {
  text: "+100" | "+500" | "+1000",
  color: yellow | orange | red,  
  startY: impactPosition.y,
  velocity: upward drift + fade,
  duration: 45 frames
}
```

#### Powerup Effects
- **Pickup Flash**: Bright white burst when collected
- **Shield Activate**: Blue energy ring expansion  
- **Speed Boost**: Green trail particles behind player
- **Double Shot**: Cyan muzzle flash enhancement

---

## Audio Requirements

### Sound Categories

#### Engine Sounds (Looping)
```
Sound File              | Format | Description
------------------------+--------+----------------------------------
player-engine-loop      | OGG    | Constant drone, subtle pitch shift with speed
enemy-scout-buzz        | OGG    | High-pitched whine
enemy-bomber-roar       | OGG    | Deep, threatening rumble
boss-engine-massive     | OGG    | Multi-layered engine sound
```

#### Weapons (One-shot)
```
Sound File              | Format | Description  
------------------------+--------+----------------------------------
player-shoot-single     | OGG    | Sharp "pew" laser sound
player-shoot-double     | OGG    | Dual laser burst
enemy-bullet            | OGG    | Hostile weapon discharge
boss-cannon             | OGG    | Heavy artillery boom
turret-fire             | OGG    | Anti-aircraft gun sound
```

#### Explosions (One-shot)
```
Sound File              | Format | Description
------------------------+--------+----------------------------------
explosion-small         | OGG    | Enemy destruction, quick pop
explosion-large         | OGG    | Boss section, deeper boom
explosion-boss          | OGG    | Final boss, extended rumble
ship-destruction        | OGG    | Naval explosion + water splash
bullet-impact           | OGG    | Projectile hit sound
```

#### UI Sounds
```
Sound File              | Format | Description
------------------------+--------+----------------------------------
powerup-pickup          | OGG    | Positive collection chime
shield-activate         | OGG    | Energy shield startup
bomb-activate           | OGG    | Screen-clear weapon deploy
player-hit              | OGG    | Damage feedback sound
game-over               | OGG    | Defeat sound
wave-complete           | OGG    | Victory fanfare
menu-select             | OGG    | UI navigation click
```

### Music System
```
Track Name              | Duration | Format | Usage
------------------------+----------+--------+---------------------------
coral-front-theme       | 3:20     | OGG    | Main campaign theme
jungle-spear-theme      | 3:45     | OGG    | Aggressive campaign theme  
dust-convoy-theme       | 4:10     | OGG    | Endurance campaign theme
iron-monsoon-theme      | 3:55     | OGG    | Final campaign theme
boss-battle-music       | 2:30     | OGG    | Intense boss encounter
victory-theme           | 1:20     | OGG    | Campaign completion
game-over-theme         | 0:45     | OGG    | Defeat music
```

### Spatial Audio
**Web Audio API Implementation**:
- **Distance Attenuation**: Volume decreases with distance from player
- **Panning**: Enemy sounds positioned left/right based on screen position
- **Doppler Effect**: Subtle pitch shift for fast-moving enemies
- **Environmental Reverb**: Different reverb settings per campaign (ocean, jungle, desert, storm)

---

## Performance Budget

### Frame Rate Targets
- **Target**: 60 FPS (16.67ms per frame)
- **Minimum**: 30 FPS (33.33ms per frame)  
- **Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)

### Rendering Budget (per frame)
```
System                  | Budget    | Notes
------------------------+-----------+-----------------------------------
Tilemap Rendering       | 2.0ms     | WebGL batched quads
Sprite Rendering        | 4.0ms     | Instanced sprite drawing
Particle System         | 1.5ms     | GPU particles where possible
UI/Text Rendering       | 1.0ms     | Canvas 2D text + bitmap fonts
Audio Processing        | 0.5ms     | Web Audio API calls
Game Logic              | 3.0ms     | Entity updates, collision detection
Input Processing        | 0.2ms     | Keyboard/gamepad polling
Buffer Swaps/Present    | 4.5ms     | Browser compositor time
TOTAL                   | 16.67ms   | 60 FPS target
```

### Memory Budget
```
Asset Type              | Budget    | Notes
------------------------+-----------+-----------------------------------
Tile Textures           | 8 MB      | 4 campaigns × ~2MB each
Sprite Textures         | 12 MB     | Player, enemies, effects
Audio Files             | 16 MB     | Compressed OGG format
Game State              | 4 MB      | Entities, particles, UI state
Browser Overhead        | 20 MB     | DOM, JavaScript runtime
TOTAL                   | 60 MB     | Target for mobile compatibility
```

### Draw Call Budget
- **Target**: <50 draw calls per frame
- **Tilemap**: 3 calls (water, terrain, cloud layers)  
- **Sprites**: ~20 calls (batched by texture)
- **Particles**: 5-10 calls (by particle type)
- **UI**: 5 calls (text, HUD elements)
- **Effects**: <10 calls (explosions, trails)

### Particle Limits
```
Particle Type           | Max Count | Notes
------------------------+-----------+-----------------------------------
Explosion Sparks        | 200       | Short-lived, high turnover
Bullet Trails           | 100       | Player bullets only  
Engine Smoke            | 50        | Damaged enemies
Water Splash            | 75        | Ship impacts
Debris Chunks           | 150       | Destructible objects
Score Popups            | 20        | Text particles
TOTAL ACTIVE            | 595       | Per-frame particle budget
```

---

## Asset Procurement

### Current Assets (Available)

#### Kenney Asset Packs
- **Source**: Kenney.nl game assets (CC0 License)
- **Tile Sets**: Complete ocean/island tilesets in multiple color variants
- **Format**: PNG, 64×64px, ready for direct use
- **Coverage**: Water tiles, terrain variants, edge transitions

#### Generated Sprites (Nano-Banana-Pro)
```
Asset Category          | Status       | Notes
------------------------+--------------+-----------------------------------
Player Planes           | ✅ Complete  | Specter + Atlas with animations
Enemy Aircraft          | ✅ Complete  | 5 enemy types, 2 frames each
Boss Sprites            | ✅ Complete  | 4 bosses, multi-section designs
Powerups                | ✅ Complete  | 5 pickup types with glow effect
Explosions              | ✅ Complete  | 3 sizes, 4-8 frames each
UI Elements             | ⚠️ Partial    | Some icons missing
```

#### Custom Wave Sprites (Code Generated)
- **Location**: `/tools/create-wave-sprites.js`
- **Output**: `wave-wake.png`, `wave-splash.png`, `wave-foam.png`  
- **Method**: Procedural generation using Canvas 2D
- **Style**: Pixel art compatible, clean alpha channels

### Required Assets (To-Do)

#### High Priority
```
Asset Category          | Count | Description
------------------------+-------+------------------------------------------
Ship Sprites            | 8     | Carrier, battleship, destroyer, submarine
Turret Sprites          | 6     | Small/large turrets + destroyed states
Ambient Objects         | 10    | Whales, birds, background details
UI Icons                | 12    | Hearts, bombs, score elements
Cloud Sprites           | 6     | Parallax cloud formations
```

#### Medium Priority  
```
Asset Category          | Count | Description
------------------------+-------+------------------------------------------
Additional Enemies      | 4     | Campaign-specific enemy variants
Environmental Effects   | 8     | Weather, atmosphere enhancements
Dialogue Portraits      | 6     | Character faces for story moments
Menu Backgrounds        | 4     | Campaign selection screens
Victory/Defeat Screens  | 8     | End-game UI layouts
```

### Free Asset Sources

#### Recommended Repositories
1. **OpenGameArt.org**: Large collection, check CC0/CC-BY licenses
2. **Itch.io Game Assets**: Many pixel art packs, often $5-15
3. **Kenney.nl**: Extensive CC0 library (already using)
4. **Pixabay/Unsplash**: For reference images (not direct use)

#### AI Generation Pipeline  
```bash
# Current workflow using nano-banana-pro
1. Create detailed visual prompt
2. Generate base sprite at 16×16 or 32×32
3. Manual cleanup in pixel art editor
4. Export as PNG with transparency
5. Test in-game with various backgrounds
```

#### Sprite Requirements Checklist
- [ ] **Transparency**: Clean alpha channels, no semi-transparent pixels
- [ ] **Pixel Perfect**: Aligned to pixel grid, no sub-pixel positioning
- [ ] **Consistent Style**: Matches existing art direction
- [ ] **Multiple Variants**: 2+ frames for animation where needed
- [ ] **Campaign Variants**: Color variations for different themes

---

## Implementation Priority

### Phase 1: Foundation (Current)
**Status**: ✅ Complete
- Core tilemap rendering system
- Multi-layer parallax scrolling  
- Basic sprite loading and rendering
- WebGL2 renderer with Canvas 2D fallback

### Phase 2: Content Assets (In Progress)
**Target**: End of March 2026
- Replace placeholder sprites with final pixel art
- Complete ship and turret sprite sets
- Implement wave effect system
- Polish explosion and particle effects

### Phase 3: Level Content (Next)
**Target**: Mid April 2026  
- Create all 4 campaign tile maps
- Define enemy spawn patterns for 80 waves
- Add boss arena definitions
- Implement scripted story moments

### Phase 4: Editor Tools (Following)
**Target**: Late April 2026
- Complete level editor UI
- Auto-tiling system for terrain edges  
- Enemy path visualization
- Live preview and testing mode

### Phase 5: Audio Integration
**Target**: May 2026
- Source/create all required sound effects
- Implement spatial audio system
- Add music tracks for each campaign
- Audio mixing and balancing

### Phase 6: Polish & Optimization  
**Target**: June 2026
- Performance optimization pass
- Mobile browser compatibility  
- Visual effects polish
- Playtesting and balance adjustments

---

## Technical Specifications

### Browser Compatibility
```
Browser                 | Min Version | Notes
------------------------+-------------+-----------------------------------
Chrome/Chromium         | 90+         | Primary target, full WebGL2 support
Firefox                 | 88+         | Good performance, tested regularly
Safari (Desktop)        | 14+         | Metal backend, some quirks
Safari (iOS)            | 14+         | Limited by mobile GPU performance
Edge                    | 90+         | Chromium-based, same as Chrome
```

### File Format Standards
```
Asset Type              | Format      | Specification
------------------------+-------------+-----------------------------------
Sprites                 | PNG         | 8-bit RGBA, no compression artifacts
Tiles                   | PNG         | 8-bit RGBA, 64×64px exact
Audio (Music)           | OGG Vorbis  | 44.1kHz, 128kbps, stereo
Audio (SFX)             | OGG Vorbis  | 44.1kHz, 96kbps, mono preferred
Level Data              | JSON        | UTF-8, formatted for readability
Configuration           | JSON        | Campaign data, enemy stats, etc.
```

### Asset Loading Pipeline
```javascript
// Async loading with fallbacks
AssetLoader {
  1. Preload critical sprites (player, UI)
  2. Load campaign-specific tilesets  
  3. Stream audio files during gameplay
  4. Cache loaded assets in GPU memory
  5. Fallback to Canvas 2D if WebGL fails
  6. Progressive loading for large campaigns
}
```

---

## Integration Notes

### Code Integration Points
```javascript
// Key files for asset system integration
game.js:2650          // Main rendering loop
content/tilemap.js    // Tile rendering and map generation
content/sprites.js    // Sprite loading and management
assets/               // All visual assets
tools/                // Asset generation utilities
```

### Asset Naming Convention
```
Format: {category}-{variant}-{state}
Examples:
  player-specter-idle
  enemy-scout-damaged  
  explosion-large-frame03
  tile-coral-water-deep
  sound-explosion-boss
```

### Performance Monitoring
```javascript
// Built-in profiling hooks
GameProfiler {
  renderTime: trackMs(),
  particleCount: currentActive,
  drawCalls: batchesSent,
  memoryUsage: textureBytes + audioBytes,
  frameTime: deltaTime
}
```

This pipeline supports a visually rich, high-performance pixel art shooter that can scale from simple mobile browsers to high-end gaming setups. The modular architecture allows for easy expansion and modification as the game evolves.

---

*Asset Pipeline Documentation v1.0 - Generated March 2026*
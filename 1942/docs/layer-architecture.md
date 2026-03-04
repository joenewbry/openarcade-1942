# 1942 Layer Architecture Documentation

## Overview

The 1942 game uses a sophisticated multi-layer rendering system that creates depth and visual richness through parallax scrolling, layered sprites, and visual effects. This document provides a complete technical understanding of how all rendering layers fit together.

## Layer Stack (Bottom to Top)

The rendering happens in this exact order, from background to foreground:

```
┌─────────────────────────────────────────────────────────────────┐
│                           UI LAYER (Z: 1000)                   │
├─────────────────────────────────────────────────────────────────┤
│                      PARTICLES (Z: 800-900)                    │
├─────────────────────────────────────────────────────────────────┤
│                       PLAYER LAYER (Z: 700)                    │
├─────────────────────────────────────────────────────────────────┤
│                     ENEMY ENTITIES (Z: 600)                    │
├─────────────────────────────────────────────────────────────────┤
│                      BULLET LAYER (Z: 500)                     │
├─────────────────────────────────────────────────────────────────┤
│                     WAVE EFFECTS (Z: 400)                      │ ← NEW LAYER NEEDED
├─────────────────────────────────────────────────────────────────┤
│                    POWERUPS/PICKUPS (Z: 350)                   │
├─────────────────────────────────────────────────────────────────┤
│                   GROUND ENEMIES (Z: 300)                      │
├─────────────────────────────────────────────────────────────────┤
│                    AMBIENT OBJECTS (Z: 250)                    │
├─────────────────────────────────────────────────────────────────┤
│                     SHADOW LAYER (Z: 200)                      │
├─────────────────────────────────────────────────────────────────┤
│                   TERRAIN LAYER (Z: 100)                       │
│                   (Parallax: 0.5x scroll)                      │
├─────────────────────────────────────────────────────────────────┤
│                     WATER LAYER (Z: 0)                         │
│                   (Parallax: 0.2x scroll)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Layer Details

### 1. Water Layer (Z: 0) - Base
- **Scroll Speed**: 0.2px/frame (slowest)
- **Purpose**: Deep ocean base, creates sense of movement
- **Tiles**: 
  - 0 = Deep water (#19466b)
  - 1 = Shallow water (#1c5d8f)
  - 2 = Dark water (#16547a)
  - 3 = Foam/surf (#22729e)
- **Implementation**: `drawTilemapLayer(renderer, tilemap, 'waterLayer', palette, waterScrollY)`

### 2. Terrain Layer (Z: 100) - Islands & Land
- **Scroll Speed**: 0.5px/frame (medium)
- **Purpose**: Islands, coastlines, land masses
- **Tiles**:
  - 0 = Transparent (no terrain)
  - 1 = Sand/beach (#d5bc84)
  - 2 = Grass/vegetation (#4b7c45)
  - 3 = Rock (#8a7a5e)
  - 4 = Structures (#6b5d42)
- **Implementation**: `drawTilemapLayer(renderer, tilemap, 'terrainLayer', palette, terrainScrollY)`

### 3. Shadow Layer (Z: 200) - Atmospheric Depth
- **Scroll Speed**: 0.8px/frame (fast)
- **Purpose**: Moving shadows for realism and depth
- **Visual**: 4 animated shadow patches that drift across the scene
- **Properties**: Semi-transparent black (alpha 0.12-0.16), size varies with sine waves
- **Implementation**: Direct rectangle rendering with time-based animation

### 4. Ambient Objects (Z: 250) - Environmental Details
- **Scroll Speed**: Varies per object type
- **Objects**: Whales, islands, gulls/birds, treelines, rivers, dunes
- **Purpose**: Environmental storytelling and visual richness
- **Special Case**: Signature whale (large, detailed whale sprite)

### 5. Ground Enemies (Z: 300) - Static Threats
- **Scroll Speed**: Tied to terrain layer (0.5px/frame)
- **Objects**: Bunkers, ships, turrets
- **Features**: HP bars when damaged, hit flash effects
- **Interaction**: Can be destroyed by player bullets

### 6. Powerups/Pickups (Z: 350) - Collectibles
- **Scroll Speed**: Independent (float in place)
- **Types**: Double-shot, speed boost, shield, bomb, etc.
- **Rendering**: Sprite-based with pixel art fallbacks

### 7. **WAVE EFFECTS LAYER (Z: 400) - BOAT WAKE SYSTEM** ⭐ NEW
**This is the critical layer for boat wave animations!**

```ascii
   🚢 BOAT (Z: 600)
      │
      ▼
┌─────────────────┐
│   ╭─────────╮   │ ← Wave Effect Sprites (Z: 400)
│ ╭─┘ ┌─────┐ └─╮ │   Render ON TOP of water tiles
│ │   │WATER│   │ │   But BEHIND boat sprite
│ ╰─╮ └─────┘ ╭─╯ │
│   ╰─────────╯   │
└─────────────────┘
    WATER TILES (Z: 0)
```

**Implementation Strategy**:
1. **Wave Sprite System**: Create wake/splash sprites that follow boats
2. **Dynamic Positioning**: Wave effects positioned relative to boat location
3. **Lifecycle Management**: Waves spawn behind boat, fade out over time
4. **Layering**: Always render after terrain but before boat entities

**Code Integration Point**:
```javascript
// Insert between ground enemies and bullet rendering
drawWaveEffects(renderer, state.groundEnemies, state.tick);
```

### 8. Bullet Layer (Z: 500) - Projectiles
- **Player Bullets**: Cyan with white core, glow effects
- **Enemy Bullets**: Red/pink, sprite-based with fallbacks
- **Bullet Trails**: Afterimage effects for player bullets

### 9. Enemy Entities (Z: 600) - Flying Threats
- **Types**: Scouts, torpedoes, raiders, gunships, bombers
- **Bosses**: Mini-bosses and final bosses with HP bars
- **Effects**: Stun flashing, tint colors

### 10. Player Layer (Z: 700) - Main Character
- **Sprite**: Banking removed - always uses idle sprite
- **Effects**: 
  - Invulnerability flashing
  - Roll trails (afterimages)
  - Shield effects
  - Focus mode (hitbox visualization)
- **Wingman**: Secondary player sprite (multiplayer)

### 11. Particles (Z: 800-900) - Visual Effects
- **Types**: Explosions, sparks, debris
- **Properties**: Color, size, lifetime, velocity
- **Alpha Blending**: Fade out over time

### 12. UI Layer (Z: 1000) - Interface
- **Elements**: Score, lives (hearts), boss HP, dialogue
- **Features**: Screen shake, flash effects, overlays
- **Text**: Custom text renderer with various sizes

## Boat Wave Animation System (Detailed)

### Problem Statement
Boats moving through water need realistic wake effects that:
1. Appear ON TOP of the water tilemap
2. Stay BEHIND the boat sprite
3. Follow the boat's movement
4. Create convincing water displacement

### Technical Solution

**Wave Effect Data Structure**:
```javascript
{
  x: number,           // World position
  y: number,
  waveType: string,    // 'wake', 'splash', 'foam'
  life: number,        // Frames remaining
  maxLife: number,     // Initial lifetime
  scale: number,       // Size multiplier
  sourceBoat: object   // Reference to spawning boat
}
```

**Rendering Process**:
```javascript
function drawWaveEffects(renderer, groundEnemies, tick) {
  for (const boat of groundEnemies.filter(e => e.type === 'ship')) {
    // Calculate wave spawn positions
    const wakeX = boat.x + boat.width / 2;
    const wakeY = boat.y + boat.height;
    
    // Spawn new wave effects
    if (tick % 8 === 0) { // Every 8 frames
      spawnWaveEffect(state, wakeX, wakeY, 'wake');
    }
    
    // Render existing waves
    for (const wave of boat.waveEffects) {
      const alpha = wave.life / wave.maxLife;
      const spriteScale = wave.scale * (1 + (1 - alpha) * 0.5);
      
      drawSpriteImage(
        renderer,
        `wave-${wave.waveType}`,
        wave.x, wave.y,
        32 * spriteScale, 16 * spriteScale,
        alpha
      );
    }
  }
}
```

## Coordinate System

- **Canvas Size**: 960x1280 pixels
- **Tile Size**: 64x64 pixels  
- **Map Width**: 15 tiles (960px)
- **Scroll Direction**: Top to bottom (negative Y)
- **Origin**: Top-left (0,0)

## Parallax Mathematics

Different layers scroll at different rates to create depth:

```
Frame N:
- Water Scroll Y = (N × 0.2) % totalMapHeight
- Terrain Scroll Y = (N × 0.5) % totalMapHeight  
- Shadow Offset = (N × 0.8) % shadowHeight

Screen Y Position = Tile Row × 64 - Scroll Y
```

## Rendering Performance

The system uses batched WebGL rendering:
- **Sprites**: Uploaded as textures, drawn with `renderer.drawSprite()`
- **Pixel Art**: Fallback system using `drawPixelSprite()`
- **Effects**: Glow, alpha blending, screen shake via CSS transforms

## Integration Points for Wave System

To add boat wave animations:

1. **Update Ground Enemy System** (`content/tilemap.js`):
   - Add wave effect tracking to ship objects
   - Implement wave spawning logic

2. **Create Wave Sprites** (`assets/sprites/`):
   - `wave-wake.png` - V-shaped wake pattern
   - `wave-splash.png` - Circular splash effect
   - `wave-foam.png` - White foam texture

3. **Modify Render Loop** (`game.js` line ~2650):
   ```javascript
   // Insert after ground enemies, before powerups:
   drawWaveEffects(renderer, state.groundEnemies, state.tick);
   ```

4. **Add Wave Management** to game state:
   - Track active wave effects per boat
   - Update wave positions and lifetimes
   - Clean up expired effects

## Campaign-Specific Palettes

Each campaign has unique color schemes:
- **Coral Front**: Ocean blues and reef greens
- **Jungle Spear**: Forest greens and river blues
- **Dust Convoy**: Desert browns and sandy yellows  
- **Iron Monsoon**: Storm grays and steel blues

## Technical Notes

- **Engine**: Custom WebGL2 renderer with batching
- **Text**: Bitmap font system with multiple sizes
- **Input**: 60Hz fixed timestep with input buffering
- **Audio**: Web Audio API with spatial effects
- **Assets**: PNG sprites with transparency

This architecture creates a rich, layered visual experience that supports the classic shoot-'em-up gameplay while providing modern visual fidelity and performance.
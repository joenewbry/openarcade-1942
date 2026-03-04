# Round 5 Tickets — GM Playtest Feedback

## Plane Select Screen
- **ARCADE-065** [F1] Selection screen still grayed out / not vibrant — make colors pop, full saturation
- **ARCADE-066** [F2] Stat text ("Normal", "Fast", "High") overflows stat boxes — fit within bounds
- **ARCADE-067** [F3] Left/right arrow keys should toggle between planes (not just [1]/[2] keys)
- **ARCADE-068** [F4] Planes showing as squares — sprite loading/display broken on select screen

## Plane Movement
- **ARCADE-069** [F5] Tilt/banking STILL happening — completely remove any bankOffset or sprite banking. Plane slides flat only.
- **ARCADE-070** [F6] Enemy plane sprites need regeneration (still not right)

## Enemy Movement Patterns
- **ARCADE-071** [F7] Replace random jitter enemy movement with PREDEFINED PATH system — sine waves, figure-8s, swooping arcs, V-formations that hold shape. Like slot cars on rails.
- **ARCADE-072** [F20] Progressive side entry — enemies start top-only, gradually introduce side entries in later waves

## Tile Map System (MAJOR)
- **ARCADE-073** [F8] Implement proper TILE MAP SYSTEM — research/integrate tilemap renderer (Tiled JSON or lightweight custom). Each level = full scrollable tile map.
- **ARCADE-074** [F11] Multi-layer parallax tiles — water scrolls slow, land/islands medium, clouds fast. All TILES not random shapes.
- **ARCADE-075** [F12] Longer levels — more waves, more scrolling terrain before boss

## Ground Enemies
- **ARCADE-076** [F13] Bunkers on islands that shoot at player — fixed to terrain tiles
- **ARCADE-077** [F14] Ships on water with rotating turrets (some ships have 3 turrets)
- **ARCADE-078** [F15] Ground/water enemies scroll with the tile map
- **ARCADE-079** [F10] Map connected to enemies — ground enemies attached to terrain

## Gameplay Flow
- **ARCADE-080** [F16] Victory/debrief sequence between campaigns — stats, progression, story moment
- **ARCADE-081** [F17] Longer boss warning phase — more buildup, more dramatic
- **ARCADE-082** [F18] Power-up stacking confirmed working (same type = increase power)
- **ARCADE-083** [F19] Scripted "interesting moments" — surprise events, not just enemy waves
- **ARCADE-084** [F9] Design doc: tile map layers documented (terrain, enemy placement, event)

## Design Research
- **ARCADE-085** [F21] All 4 designers research their respective games — enemy mechanics, turrets, patterns, ground enemies, memorable level design

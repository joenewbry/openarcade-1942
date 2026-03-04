#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pillow>=10.0.0",
# ]
# ///
"""
TECH ARCHITECT ALPHA v2: Clean & Geometric Tile Generator
Improved version with better transitions, inner corners, and organic shapes.
"""
from PIL import Image, ImageDraw
import os

NATIVE = 16
SCALE = 4
TILE = NATIVE * SCALE  # 64px

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Coral Front Palette ──
DEEP_1    = (28, 93, 143)      # deep water primary
DEEP_2    = (25, 70, 107)      # deep water dark
DEEP_3    = (35, 105, 155)     # deep water highlight
SHALLOW_1 = (41, 128, 185)    # shallow primary
SHALLOW_2 = (90, 200, 224)    # shallow light
FOAM      = (180, 240, 255)   # foam/surf
SAND_1    = (230, 200, 138)   # sand primary
SAND_2    = (212, 184, 122)   # sand mid
SAND_3    = (200, 168, 106)   # sand dark
GRASS_1   = (93, 170, 93)     # grass primary
GRASS_2   = (77, 154, 77)     # grass mid
GRASS_3   = (61, 138, 61)     # grass dark
GRASS_H   = (115, 190, 115)   # grass highlight
# Sand-grass transition
SANDGRASS = (160, 180, 110)   # yellowish green blend
CLOUD_W   = (240, 245, 255)
CLOUD_L   = (210, 225, 245)
SKY_BG    = (30, 60, 110)

N = NATIVE

def new_tile():
    return Image.new("RGB", (N, N))

def scale(img):
    return img.resize((TILE, TILE), Image.NEAREST)

def px(draw, x, y, c):
    if 0 <= x < N and 0 <= y < N:
        draw.point((x, y), fill=c)

# ── Texture functions ──

def fill_deep(draw, x, y):
    """Deep water pixel color."""
    if (x + y) % 8 == 0: return DEEP_3
    if (x + y * 2) % 7 == 0: return DEEP_2
    return DEEP_1

def fill_shallow(draw, x, y):
    """Shallow water pixel color."""
    if (x * 3 + y) % 9 == 0: return SHALLOW_2
    if (x + y * 2) % 7 == 0: return FOAM
    return SHALLOW_1

def fill_sand(draw, x, y):
    """Sand pixel color."""
    if (x * 5 + y * 3) % 7 == 0: return SAND_2
    if (x * 7 + y * 11) % 17 == 0: return SAND_3
    return SAND_1

def fill_grass(draw, x, y):
    """Grass pixel color."""
    if (x + y) % 3 == 0: return GRASS_2
    if (x * 2 + y * 3) % 7 == 0: return GRASS_3
    if (x * 11 + y * 7) % 23 == 0: return GRASS_H
    return GRASS_1

# ── Base Tiles ──

def make_water_deep():
    img = new_tile(); draw = ImageDraw.Draw(img)
    for y in range(N):
        for x in range(N):
            px(draw, x, y, fill_deep(draw, x, y))
    return img

def make_water_shallow():
    img = new_tile(); draw = ImageDraw.Draw(img)
    for y in range(N):
        for x in range(N):
            px(draw, x, y, fill_shallow(draw, x, y))
    return img

def make_sand():
    img = new_tile(); draw = ImageDraw.Draw(img)
    for y in range(N):
        for x in range(N):
            px(draw, x, y, fill_sand(draw, x, y))
    return img

def make_grass():
    img = new_tile(); draw = ImageDraw.Draw(img)
    for y in range(N):
        for x in range(N):
            px(draw, x, y, fill_grass(draw, x, y))
    return img

# ── Sand-Grass Transition ──

def make_sand_grass_n():
    """Grass on top, sand on bottom (north edge of grass area)."""
    img = new_tile(); draw = ImageDraw.Draw(img)
    mid = 7
    for y in range(N):
        for x in range(N):
            # Wavy border between grass and sand
            border = mid + (1 if (x % 5) < 2 else 0)
            if y < border - 1:
                px(draw, x, y, fill_grass(draw, x, y))
            elif y == border - 1:
                px(draw, x, y, SANDGRASS)
            elif y == border:
                px(draw, x, y, SANDGRASS if x % 3 == 0 else fill_sand(draw, x, y))
            else:
                px(draw, x, y, fill_sand(draw, x, y))
    return img

def make_sand_grass_s():
    """Sand on top, grass on bottom."""
    img = new_tile(); draw = ImageDraw.Draw(img)
    mid = 8
    for y in range(N):
        for x in range(N):
            border = mid + (1 if (x % 5) < 2 else 0)
            if y < border:
                px(draw, x, y, fill_sand(draw, x, y))
            elif y == border:
                px(draw, x, y, SANDGRASS if x % 3 == 0 else fill_grass(draw, x, y))
            else:
                px(draw, x, y, fill_grass(draw, x, y))
    return img

# ── Water-Sand Edge Tiles ──

def make_edge(water_side):
    """
    Edge tile with water on one side and sand on the other.
    water_side: 'top','bottom','left','right'
    """
    img = new_tile(); draw = ImageDraw.Draw(img)
    mid = 8
    
    for y in range(N):
        for x in range(N):
            if water_side == 'top':
                wave = mid + (1 if (x % 6) < 3 else -1 if (x % 6) == 4 else 0)
                if y < wave - 1:
                    px(draw, x, y, fill_shallow(draw, x, y))
                elif y == wave - 1 or y == wave:
                    px(draw, x, y, FOAM)
                else:
                    px(draw, x, y, fill_sand(draw, x, y))
            elif water_side == 'bottom':
                wave = mid + (1 if (x % 6) < 3 else -1 if (x % 6) == 4 else 0)
                if y < wave - 1:
                    px(draw, x, y, fill_sand(draw, x, y))
                elif y == wave - 1 or y == wave:
                    px(draw, x, y, FOAM)
                else:
                    px(draw, x, y, fill_shallow(draw, x, y))
            elif water_side == 'right':
                wave = mid + (1 if (y % 6) < 3 else -1 if (y % 6) == 4 else 0)
                if x < wave - 1:
                    px(draw, x, y, fill_sand(draw, x, y))
                elif x == wave - 1 or x == wave:
                    px(draw, x, y, FOAM)
                else:
                    px(draw, x, y, fill_shallow(draw, x, y))
            elif water_side == 'left':
                wave = mid + (1 if (y % 6) < 3 else -1 if (y % 6) == 4 else 0)
                if x < wave - 1:
                    px(draw, x, y, fill_shallow(draw, x, y))
                elif x == wave - 1 or x == wave:
                    px(draw, x, y, FOAM)
                else:
                    px(draw, x, y, fill_sand(draw, x, y))
    return img

# ── Outer Corner Tiles ──

def make_outer_corner(corner):
    """
    Outer corner: sand is in one quadrant, water fills the rest.
    corner: 'NE' means this is the northeast corner of the island,
            so sand is in the bottom-left of the tile.
    """
    img = new_tile(); draw = ImageDraw.Draw(img)
    
    # Center of the arc (where sand radiates from)
    if corner == 'NE':   cx, cy = 0, N  # sand bottom-left
    elif corner == 'NW': cx, cy = N, N  # sand bottom-right
    elif corner == 'SE': cx, cy = 0, 0  # sand top-left
    elif corner == 'SW': cx, cy = N, 0  # sand top-right
    
    radius = 10  # pixels from corner that's sand
    
    for y in range(N):
        for x in range(N):
            dx = abs(x - cx) if cx == 0 else abs(x - cx + 1)
            dy = abs(y - cy) if cy == 0 else abs(y - cy + 1)
            dist = (dx ** 2 + dy ** 2) ** 0.5
            
            if dist < radius - 2:
                px(draw, x, y, fill_sand(draw, x, y))
            elif dist < radius:
                px(draw, x, y, FOAM)
            else:
                px(draw, x, y, fill_shallow(draw, x, y))
    return img

# ── Inner Corner Tiles ──

def make_inner_corner(corner):
    """
    Inner corner: sand fills most of the tile, with water poking into one corner.
    corner: 'NE' means water intrudes from the top-right.
    """
    img = new_tile(); draw = ImageDraw.Draw(img)
    
    # Where water intrudes from
    if corner == 'NE':   wx, wy = N, 0
    elif corner == 'NW': wx, wy = 0, 0
    elif corner == 'SE': wx, wy = N, N
    elif corner == 'SW': wx, wy = 0, N
    
    radius = 8
    
    for y in range(N):
        for x in range(N):
            dx = abs(x - wx) if wx == N else abs(x - wx)
            dy = abs(y - wy) if wy == N else abs(y - wy)
            dist = (dx ** 2 + dy ** 2) ** 0.5
            
            if dist < radius - 2:
                px(draw, x, y, fill_shallow(draw, x, y))
            elif dist < radius:
                px(draw, x, y, FOAM)
            else:
                px(draw, x, y, fill_sand(draw, x, y))
    return img

# ── Cloud Tiles ──

def make_cloud_thin():
    img = new_tile(); draw = ImageDraw.Draw(img)
    # Transparent-ish on sky blue
    for y in range(N):
        for x in range(N):
            px(draw, x, y, SKY_BG)
    # Diagonal wispy band
    for y in range(N):
        for x in range(N):
            d = abs((x + y) - 14)
            if d < 3 and (x + y * 2) % 3 != 0:
                px(draw, x, y, CLOUD_L)
            if d < 1:
                px(draw, x, y, CLOUD_W)
    return img

def make_cloud_thick():
    img = new_tile(); draw = ImageDraw.Draw(img)
    for y in range(N):
        for x in range(N):
            px(draw, x, y, SKY_BG)
    # Large puffy cloud centered
    cx, cy = 7, 7
    for y in range(N):
        for x in range(N):
            # Blob shape (not perfect circle)
            dist = ((x - cx) ** 2 * 0.8 + (y - cy) ** 2 * 1.2) ** 0.5
            if dist < 5:
                px(draw, x, y, CLOUD_W)
            elif dist < 6:
                px(draw, x, y, CLOUD_L if (x + y) % 2 == 0 else CLOUD_W)
            elif dist < 7:
                if (x + y) % 3 == 0:
                    px(draw, x, y, CLOUD_L)
    return img

# ── Water-foam (surf line) ──
def make_water_foam():
    """Foam/surf tile for transition between deep and shallow."""
    img = new_tile(); draw = ImageDraw.Draw(img)
    for y in range(N):
        for x in range(N):
            c = fill_shallow(draw, x, y)
            if (x + y) % 4 == 0:
                c = FOAM
            if (x * 3 + y * 2) % 11 == 0:
                c = (200, 240, 255)
            px(draw, x, y, c)
    return img

# ── Generate All ──

tiles = {
    # Water layer
    "water-deep":     make_water_deep(),
    "water-shallow":  make_water_shallow(),
    "water-foam":     make_water_foam(),
    # Terrain base
    "sand":           make_sand(),
    "grass":          make_grass(),
    # Water-sand edges (N=water on top of tile)
    "edge-N":         make_edge('top'),
    "edge-S":         make_edge('bottom'),
    "edge-E":         make_edge('right'),
    "edge-W":         make_edge('left'),
    # Outer corners
    "edge-NE":        make_outer_corner('NE'),
    "edge-NW":        make_outer_corner('NW'),
    "edge-SE":        make_outer_corner('SE'),
    "edge-SW":        make_outer_corner('SW'),
    # Inner corners
    "inner-NE":       make_inner_corner('NE'),
    "inner-NW":       make_inner_corner('NW'),
    "inner-SE":       make_inner_corner('SE'),
    "inner-SW":       make_inner_corner('SW'),
    # Sand-grass transitions
    "sand-grass-n":   make_sand_grass_n(),
    "sand-grass-s":   make_sand_grass_s(),
    # Clouds
    "cloud-thin":     make_cloud_thin(),
    "cloud-thick":    make_cloud_thick(),
}

clean_dir = os.path.join(OUT_DIR, "clean")
os.makedirs(clean_dir, exist_ok=True)

scaled_tiles = {}
for name, native_img in tiles.items():
    native_img.save(os.path.join(clean_dir, f"{name}-16.png"), "PNG")
    scaled = scale(native_img)
    scaled.save(os.path.join(clean_dir, f"{name}.png"), "PNG")
    scaled_tiles[name] = scaled
    print(f"  ✓ {name}")

# ── 12×12 Asymmetric Island Grid ──
# More organic/natural shape with peninsula and cove
G = 12

# Key: W=deep water, S=shallow, F=foam, .=sand, G=grass
# n/s/e/w = edge tiles, ne/nw/se/sw = outer corners
# iNE/iNW/iSE/iSW = inner corners
# gn/gs = sand-grass transition N/S

grid = [
    # Row 0: Open ocean
    ["W","W","W","W","W","W","W","W","W","W","W","W"],
    # Row 1: Approaching island from north - shallow water
    ["W","W","W","W","S","S","S","S","S","W","W","W"],
    # Row 2: North shore starts
    ["W","W","S","nw","n","n","n","n","n","ne","W","W"],
    # Row 3: Wider land with sand border, cove on right
    ["W","S","nw","w",".",".",".",".",".",".","ne","W"],
    # Row 4: Grass starts - asymmetric shape
    ["W","S","w",".","gn","gn","gn","gn",".",".","e","S"],
    # Row 5: Dense grass interior, peninsula hint left
    ["S","nw","w",".","G","G","G","G","gn",".",".","S"],
    # Row 6: Wider section with grass
    ["S","w",".",".","G","G","G","G","G",".","e","S"],
    # Row 7: South portion starts narrowing
    ["W","sw","w",".","gs","G","G","gs",".",".","e","S"],
    # Row 8: South sand
    ["W","S","sw","w",".","gs","gs",".",".","e","se","W"],
    # Row 9: South shore
    ["W","W","S","sw","s","s","s","s","se","S","W","W"],
    # Row 10: Shallow water receding
    ["W","W","W","W","S","S","S","S","W","W","W","W"],
    # Row 11: Open ocean
    ["W","W","W","W","W","W","W","W","W","W","W","W"],
]

code_map = {
    "W": "water-deep", "S": "water-shallow", "F": "water-foam",
    ".": "sand", "G": "grass",
    "n": "edge-N", "s": "edge-S", "e": "edge-E", "w": "edge-W",
    "ne": "edge-NE", "nw": "edge-NW", "se": "edge-SE", "sw": "edge-SW",
    "iNE": "inner-NE", "iNW": "inner-NW", "iSE": "inner-SE", "iSW": "inner-SW",
    "gn": "sand-grass-n", "gs": "sand-grass-s",
}

grid_img = Image.new("RGB", (G * TILE, G * TILE))
for row_idx, row in enumerate(grid):
    for col_idx, code in enumerate(row):
        tile_name = code_map.get(code, "water-deep")
        tile = scaled_tiles[tile_name]
        if tile.mode != "RGB":
            tile = tile.convert("RGB")
        grid_img.paste(tile, (col_idx * TILE, row_idx * TILE))

grid_img.save(os.path.join(clean_dir, "island-grid-12x12.png"), "PNG")
print(f"\n✓ Grid: island-grid-12x12.png ({G*TILE}x{G*TILE})")

# 2x zoom for viewing
grid_2x = grid_img.resize((G * TILE * 2, G * TILE * 2), Image.NEAREST)
grid_2x.save(os.path.join(clean_dir, "island-grid-12x12-2x.png"), "PNG")
print(f"✓ Grid 2x: island-grid-12x12-2x.png")

# Tile atlas: all tiles in a strip
cols = len(tiles)
atlas = Image.new("RGB", (cols * TILE, TILE))
for i, (name, t) in enumerate(scaled_tiles.items()):
    if t.mode != "RGB": t = t.convert("RGB")
    atlas.paste(t, (i * TILE, 0))
atlas.save(os.path.join(clean_dir, "tileset-atlas.png"), "PNG")
print(f"✓ Atlas: tileset-atlas.png ({cols}x1 tiles)")
print(f"\nDone! {len(tiles)} tiles generated.")

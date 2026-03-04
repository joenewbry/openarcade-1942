#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pillow>=10.0.0",
# ]
# ///
"""
TECH ARCHITECT ALPHA: Clean & Geometric Tile Generator
Creates pixel-perfect 16x16 native tiles scaled 4x to 64x64.
All tiles use the Coral Front palette with guaranteed edge matching.
"""
from PIL import Image, ImageDraw
import os
import random

NATIVE = 16  # native pixel art resolution
SCALE = 4    # 4x scale
TILE = NATIVE * SCALE  # 64px output

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Coral Front Palette ──
DEEP_WATER_1 = (28, 93, 143)     # #1c5d8f - primary deep
DEEP_WATER_2 = (25, 70, 107)     # #19466b - darker deep
SHALLOW_1    = (41, 128, 185)    # #2980b9 - shallow blue
SHALLOW_2    = (90, 200, 224)    # #5ac8e0 - light cyan
FOAM         = (126, 232, 255)   # #7ee8ff - foam white-blue
SAND_1       = (230, 200, 138)   # #e6c88a - primary sand
SAND_2       = (212, 184, 122)   # #d4b87a - darker sand
SAND_3       = (200, 168, 106)   # #c8a86a - darkest sand
GRASS_1      = (93, 170, 93)     # #5daa5d - primary green
GRASS_2      = (77, 154, 77)     # #4d9a4d - medium green
GRASS_3      = (61, 138, 61)     # #3d8a3d - dark green
CLOUD_WHITE  = (240, 245, 255)   # near-white cloud
CLOUD_LIGHT  = (210, 225, 245)   # light blue cloud

random.seed(42)  # reproducible

def create_tile():
    """Create a blank 16x16 image."""
    return Image.new("RGB", (NATIVE, NATIVE))

def scale_up(img):
    """Scale 16x16 -> 64x64 with nearest neighbor."""
    return img.resize((TILE, TILE), Image.NEAREST)

def fill(img, color):
    """Fill entire tile with color."""
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, NATIVE-1, NATIVE-1], fill=color)
    return img

def dither_pattern(img, color1, color2, pattern="checker"):
    """Add a dither pattern for texture."""
    draw = ImageDraw.Draw(img)
    fill(img, color1)
    for y in range(NATIVE):
        for x in range(NATIVE):
            if pattern == "checker":
                if (x + y) % 4 == 0:
                    draw.point((x, y), fill=color2)
            elif pattern == "sparse":
                if (x * 3 + y * 7) % 11 == 0:
                    draw.point((x, y), fill=color2)
            elif pattern == "diagonal":
                if (x + y) % 3 == 0 and (x - y) % 5 == 0:
                    draw.point((x, y), fill=color2)
    return img

# ── Generate Base Tiles ──

# 1. Deep Water
def make_water_deep():
    img = create_tile()
    draw = ImageDraw.Draw(img)
    fill(img, DEEP_WATER_1)
    # Subtle wave lines - diagonal
    for y in range(NATIVE):
        for x in range(NATIVE):
            if (x + y) % 6 == 0:
                draw.point((x, y), fill=DEEP_WATER_2)
            if (x + y * 2) % 13 == 0:
                draw.point((x, y), fill=SHALLOW_1)
    return img

# 2. Shallow Water
def make_water_shallow():
    img = create_tile()
    draw = ImageDraw.Draw(img)
    fill(img, SHALLOW_1)
    for y in range(NATIVE):
        for x in range(NATIVE):
            if (x + y) % 5 == 0:
                draw.point((x, y), fill=SHALLOW_2)
            if (x * 3 + y) % 11 == 0:
                draw.point((x, y), fill=FOAM)
    return img

# 3. Sand
def make_sand():
    img = create_tile()
    draw = ImageDraw.Draw(img)
    fill(img, SAND_1)
    for y in range(NATIVE):
        for x in range(NATIVE):
            if (x * 5 + y * 3) % 7 == 0:
                draw.point((x, y), fill=SAND_2)
            if (x * 7 + y * 11) % 17 == 0:
                draw.point((x, y), fill=SAND_3)
    return img

# 4. Grass
def make_grass():
    img = create_tile()
    draw = ImageDraw.Draw(img)
    fill(img, GRASS_1)
    for y in range(NATIVE):
        for x in range(NATIVE):
            if (x + y) % 3 == 0:
                draw.point((x, y), fill=GRASS_2)
            if (x * 2 + y * 3) % 7 == 0:
                draw.point((x, y), fill=GRASS_3)
            # Occasional highlight
            if (x * 11 + y * 7) % 23 == 0:
                draw.point((x, y), fill=(110, 186, 110))
    return img

# ── Edge Tiles ──
# These transition between shallow water (top of edge) and sand

def make_edge_n():
    """North edge: water on top, sand on bottom."""
    img = create_tile()
    draw = ImageDraw.Draw(img)
    mid = NATIVE // 2  # 8
    # Top half: shallow water
    for y in range(mid):
        for x in range(NATIVE):
            c = SHALLOW_1
            if (x + y) % 5 == 0:
                c = SHALLOW_2
            draw.point((x, y), fill=c)
    # Shore line with foam
    for x in range(NATIVE):
        offset = 1 if x % 4 < 2 else 0  # slight wave
        draw.point((x, mid - 1 + offset), fill=FOAM)
        draw.point((x, mid + offset), fill=FOAM)
    # Bottom half: sand
    for y in range(mid, NATIVE):
        for x in range(NATIVE):
            c = SAND_1
            if (x * 5 + y * 3) % 7 == 0:
                c = SAND_2
            draw.point((x, y), fill=c)
    return img

def make_edge_s():
    """South edge: sand on top, water on bottom."""
    img = create_tile()
    draw = ImageDraw.Draw(img)
    mid = NATIVE // 2
    # Top half: sand
    for y in range(mid):
        for x in range(NATIVE):
            c = SAND_1
            if (x * 5 + y * 3) % 7 == 0:
                c = SAND_2
            draw.point((x, y), fill=c)
    # Shore line with foam
    for x in range(NATIVE):
        offset = 1 if x % 4 < 2 else 0
        draw.point((x, mid - 1 + offset), fill=FOAM)
        draw.point((x, mid + offset), fill=FOAM)
    # Bottom half: shallow water
    for y in range(mid, NATIVE):
        for x in range(NATIVE):
            c = SHALLOW_1
            if (x + y) % 5 == 0:
                c = SHALLOW_2
            draw.point((x, y), fill=c)
    return img

def make_edge_e():
    """East edge: sand on left, water on right."""
    img = create_tile()
    draw = ImageDraw.Draw(img)
    mid = NATIVE // 2
    # Left half: sand
    for y in range(NATIVE):
        for x in range(mid):
            c = SAND_1
            if (x * 5 + y * 3) % 7 == 0:
                c = SAND_2
            draw.point((x, y), fill=c)
    # Shore line with foam
    for y in range(NATIVE):
        offset = 1 if y % 4 < 2 else 0
        draw.point((mid - 1 + offset, y), fill=FOAM)
        draw.point((mid + offset, y), fill=FOAM)
    # Right half: shallow water
    for y in range(NATIVE):
        for x in range(mid, NATIVE):
            c = SHALLOW_1
            if (x + y) % 5 == 0:
                c = SHALLOW_2
            draw.point((x, y), fill=c)
    return img

def make_edge_w():
    """West edge: water on left, sand on right."""
    img = create_tile()
    draw = ImageDraw.Draw(img)
    mid = NATIVE // 2
    # Left half: shallow water
    for y in range(NATIVE):
        for x in range(mid):
            c = SHALLOW_1
            if (x + y) % 5 == 0:
                c = SHALLOW_2
            draw.point((x, y), fill=c)
    # Shore line with foam
    for y in range(NATIVE):
        offset = 1 if y % 4 < 2 else 0
        draw.point((mid - 1 + offset, y), fill=FOAM)
        draw.point((mid + offset, y), fill=FOAM)
    # Right half: sand
    for y in range(NATIVE):
        for x in range(mid, NATIVE):
            c = SAND_1
            if (x * 5 + y * 3) % 7 == 0:
                c = SAND_2
            draw.point((x, y), fill=c)
    return img

# ── Corner Tiles ──

def make_corner(sand_quadrant):
    """
    Create a corner tile. sand_quadrant is where the sand is:
    'bl' = bottom-left (NE corner of island)
    'br' = bottom-right (NW corner)
    'tl' = top-left (SE corner)
    'tr' = top-right (SW corner)
    """
    img = create_tile()
    draw = ImageDraw.Draw(img)
    mid = NATIVE // 2
    
    # Fill everything with shallow water first
    for y in range(NATIVE):
        for x in range(NATIVE):
            c = SHALLOW_1
            if (x + y) % 5 == 0:
                c = SHALLOW_2
            draw.point((x, y), fill=c)
    
    # Determine which quadrant gets sand
    def in_sand(x, y):
        if sand_quadrant == 'bl':
            return x < mid and y >= mid
        elif sand_quadrant == 'br':
            return x >= mid and y >= mid
        elif sand_quadrant == 'tl':
            return x < mid and y < mid
        elif sand_quadrant == 'tr':
            return x >= mid and y < mid
        return False
    
    # Draw sand with rounded corner (quarter circle)
    for y in range(NATIVE):
        for x in range(NATIVE):
            # Center of the corner arc
            if sand_quadrant == 'bl':
                cx, cy = 0, NATIVE
                dist = ((x) ** 2 + (NATIVE - 1 - y) ** 2) ** 0.5
            elif sand_quadrant == 'br':
                cx, cy = NATIVE, NATIVE
                dist = ((NATIVE - 1 - x) ** 2 + (NATIVE - 1 - y) ** 2) ** 0.5
            elif sand_quadrant == 'tl':
                cx, cy = 0, 0
                dist = ((x) ** 2 + (y) ** 2) ** 0.5
            elif sand_quadrant == 'tr':
                cx, cy = NATIVE, 0
                dist = ((NATIVE - 1 - x) ** 2 + (y) ** 2) ** 0.5
            else:
                dist = 999
            
            radius = mid + 2  # slightly larger than half for good coverage
            if dist < radius - 1:
                c = SAND_1
                if (x * 5 + y * 3) % 7 == 0:
                    c = SAND_2
                draw.point((x, y), fill=c)
            elif dist < radius + 1:
                draw.point((x, y), fill=FOAM)
    
    return img

# ── Cloud Tiles ──

def make_cloud_thin():
    """Light wispy cloud - semi-transparent effect on blue bg."""
    img = create_tile()
    draw = ImageDraw.Draw(img)
    # Dark blue sky background
    fill(img, (30, 60, 110))
    # Wispy cloud shapes
    for y in range(NATIVE):
        for x in range(NATIVE):
            # Create a wispy diagonal band
            band = abs(x + y - NATIVE) + abs(x - y)
            if band < 12 and (x + y * 3) % 5 != 0:
                draw.point((x, y), fill=CLOUD_LIGHT)
            if band < 8 and (x * 2 + y) % 4 != 0:
                draw.point((x, y), fill=CLOUD_WHITE)
    return img

def make_cloud_thick():
    """Dense thick cloud on blue bg."""
    img = create_tile()
    draw = ImageDraw.Draw(img)
    fill(img, (30, 60, 110))
    # Large puffy cloud covering most of tile
    cx, cy = NATIVE // 2, NATIVE // 2
    for y in range(NATIVE):
        for x in range(NATIVE):
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if dist < 6:
                draw.point((x, y), fill=CLOUD_WHITE)
            elif dist < 7:
                if (x + y) % 2 == 0:
                    draw.point((x, y), fill=CLOUD_WHITE)
                else:
                    draw.point((x, y), fill=CLOUD_LIGHT)
            elif dist < 8:
                if (x + y) % 3 == 0:
                    draw.point((x, y), fill=CLOUD_LIGHT)
    return img

# ── Generate & Save ──

tiles = {
    "water-deep": make_water_deep(),
    "water-shallow": make_water_shallow(),
    "sand": make_sand(),
    "grass": make_grass(),
    "edge-N": make_edge_n(),
    "edge-S": make_edge_s(),
    "edge-E": make_edge_e(),
    "edge-W": make_edge_w(),
    "edge-NE": make_corner('bl'),  # NE corner of island = sand in bottom-left
    "edge-NW": make_corner('br'),  # NW corner = sand in bottom-right
    "edge-SE": make_corner('tl'),  # SE corner = sand in top-left
    "edge-SW": make_corner('tr'),  # SW corner = sand in top-right
    "cloud-thin": make_cloud_thin(),
    "cloud-thick": make_cloud_thick(),
}

clean_dir = os.path.join(OUT_DIR, "clean")
os.makedirs(clean_dir, exist_ok=True)

scaled_tiles = {}
for name, native_img in tiles.items():
    # Save native 16x16
    native_path = os.path.join(clean_dir, f"{name}-16.png")
    native_img.save(native_path, "PNG")
    
    # Scale to 64x64
    scaled = scale_up(native_img)
    scaled_path = os.path.join(clean_dir, f"{name}.png")
    scaled.save(scaled_path, "PNG")
    scaled_tiles[name] = scaled
    print(f"  ✓ {name} (16x16 → 64x64)")

# ── Create 12×12 Island Grid ──
GRID = 12
grid_map = [
    ["W","W","W","W","W","W","W","W","W","W","W","W"],
    ["W","W","W","S","S","S","S","S","S","W","W","W"],
    ["W","W","S","nw","n","n","n","n","ne","S","W","W"],
    ["W","S","S","w",".",".",".",".","e","S","S","W"],
    ["W","S","nw","w",".","G","G",".","e","ne","S","W"],
    ["W","S","w",".","G","G","G","G",".","e","S","W"],
    ["W","S","w",".","G","G","G","G",".","e","S","W"],
    ["W","S","sw","w",".","G","G",".","e","se","S","W"],
    ["W","S","S","w",".",".",".",".","e","S","S","W"],
    ["W","W","S","sw","s","s","s","s","se","S","W","W"],
    ["W","W","W","S","S","S","S","S","S","W","W","W"],
    ["W","W","W","W","W","W","W","W","W","W","W","W"],
]

code_to_tile = {
    "W": "water-deep", "S": "water-shallow", ".": "sand", "G": "grass",
    "n": "edge-N", "s": "edge-S", "e": "edge-E", "w": "edge-W",
    "ne": "edge-NE", "nw": "edge-NW", "se": "edge-SE", "sw": "edge-SW",
}

grid_img = Image.new("RGB", (GRID * TILE, GRID * TILE))
for row_idx, row in enumerate(grid_map):
    for col_idx, code in enumerate(row):
        tile_name = code_to_tile.get(code, "water-deep")
        tile = scaled_tiles[tile_name]
        if tile.mode != "RGB":
            tile = tile.convert("RGB")
        grid_img.paste(tile, (col_idx * TILE, row_idx * TILE))

grid_path = os.path.join(clean_dir, "island-grid-12x12.png")
grid_img.save(grid_path, "PNG")
print(f"\n✓ Grid saved: island-grid-12x12.png ({GRID * TILE}x{GRID * TILE})")

# 4x version for easy viewing
grid_4x = grid_img.resize((GRID * TILE * 2, GRID * TILE * 2), Image.NEAREST)
grid_4x_path = os.path.join(clean_dir, "island-grid-12x12-2x.png")
grid_4x.save(grid_4x_path, "PNG")
print(f"✓ Grid 2x saved: island-grid-12x12-2x.png ({GRID * TILE * 2}x{GRID * TILE * 2})")

# Also create a tile atlas sheet (all tiles in a row)
atlas_cols = len(tiles)
atlas = Image.new("RGB", (atlas_cols * TILE, TILE))
for i, (name, tile) in enumerate(scaled_tiles.items()):
    if tile.mode != "RGB":
        tile = tile.convert("RGB")
    atlas.paste(tile, (i * TILE, 0))
atlas_path = os.path.join(clean_dir, "tileset-atlas.png")
atlas.save(atlas_path, "PNG")
print(f"✓ Atlas saved: tileset-atlas.png ({atlas_cols * TILE}x{TILE})")

print(f"\nAll files saved to: {clean_dir}/")

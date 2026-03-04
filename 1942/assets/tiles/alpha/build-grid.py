#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pillow>=10.0.0",
# ]
# ///
"""
Resize all generated tiles to 64x64 and create a 12x12 island grid demo.
Uses NEAREST neighbor for pixel art downscaling to preserve sharp edges.
"""
from PIL import Image
import os

TILE_SIZE = 64
GRID_SIZE = 12
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# Step 1: Resize all tiles to 64x64
tile_files = [
    "water-deep.png", "water-shallow.png", "sand.png", "grass.png",
    "edge-N.png", "edge-S.png", "edge-E.png", "edge-W.png",
    "edge-NE.png", "edge-NW.png", "edge-SE.png", "edge-SW.png",
    "cloud-thin.png", "cloud-thick.png"
]

tiles = {}
for fname in tile_files:
    path = os.path.join(OUT_DIR, fname)
    if os.path.exists(path):
        img = Image.open(path)
        # Resize to 64x64 with NEAREST for sharp pixel art
        resized = img.resize((TILE_SIZE, TILE_SIZE), Image.NEAREST)
        name = fname.replace(".png", "")
        tiles[name] = resized
        # Save resized version
        resized_path = os.path.join(OUT_DIR, f"{name}-64.png")
        resized.save(resized_path, "PNG")
        print(f"Resized {fname} -> {name}-64.png ({img.size[0]}x{img.size[1]} -> 64x64)")

# Step 2: Create 12x12 island grid
# Legend:
#   W = water-deep
#   S = water-shallow  
#   . = sand
#   G = grass
#   nw/ne/sw/se = corners
#   n/s/e/w = edges

# A tropical island in the ocean - roughly centered island formation
# with deep water -> shallow water -> sand edges -> sand/grass interior
grid_map = [
    # Row 0: All deep water
    ["W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W"],
    # Row 1: Deep water with some shallow water approaching island
    ["W", "W", "W", "W", "S", "S", "S", "S", "W", "W", "W", "W"],
    # Row 2: Shallow water and north shore with corners
    ["W", "W", "W", "S", "nw", "n", "n", "ne", "S", "W", "W", "W"],
    # Row 3: West/East shores with sand interior
    ["W", "W", "S", "S", "w", ".", ".", "e", "S", "S", "W", "W"],
    # Row 4: West/East shores with grass
    ["W", "W", "S", "nw", "w", "G", "G", "e", "ne", "S", "W", "W"],
    # Row 5: Wider section with grass interior
    ["W", "S", "nw", "w", ".", "G", "G", ".", "e", "ne", "S", "W"],
    # Row 6: Wider section continuing
    ["W", "S", "sw", "w", ".", "G", "G", ".", "e", "se", "S", "W"],
    # Row 7: West/East shores narrowing
    ["W", "W", "S", "sw", "w", "G", "G", "e", "se", "S", "W", "W"],
    # Row 8: West/East shores with sand
    ["W", "W", "S", "S", "w", ".", ".", "e", "S", "S", "W", "W"],
    # Row 9: South shore with corners
    ["W", "W", "W", "S", "sw", "s", "s", "se", "S", "W", "W", "W"],
    # Row 10: Shallow water receding
    ["W", "W", "W", "W", "S", "S", "S", "S", "W", "W", "W", "W"],
    # Row 11: All deep water
    ["W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W"],
]

# Map codes to tile names
code_to_tile = {
    "W": "water-deep",
    "S": "water-shallow",
    ".": "sand",
    "G": "grass",
    "n": "edge-N",
    "s": "edge-S",
    "e": "edge-E",
    "w": "edge-W",
    "ne": "edge-NE",
    "nw": "edge-NW",
    "se": "edge-SE",
    "sw": "edge-SW",
}

# Create the grid image
grid_img = Image.new("RGB", (GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE))

for row_idx, row in enumerate(grid_map):
    for col_idx, code in enumerate(row):
        tile_name = code_to_tile.get(code, "water-deep")
        if tile_name in tiles:
            tile = tiles[tile_name]
            # Convert to RGB if necessary
            if tile.mode != "RGB":
                tile = tile.convert("RGB")
            grid_img.paste(tile, (col_idx * TILE_SIZE, row_idx * TILE_SIZE))
        else:
            print(f"Warning: Missing tile '{tile_name}' at ({row_idx}, {col_idx})")

grid_path = os.path.join(OUT_DIR, "island-grid-12x12.png")
grid_img.save(grid_path, "PNG")
print(f"\nGrid saved: {grid_path} ({GRID_SIZE * TILE_SIZE}x{GRID_SIZE * TILE_SIZE})")

# Also save the grid at 2x for better visibility
grid_2x = grid_img.resize((GRID_SIZE * TILE_SIZE * 2, GRID_SIZE * TILE_SIZE * 2), Image.NEAREST)
grid_2x_path = os.path.join(OUT_DIR, "island-grid-12x12-2x.png")
grid_2x.save(grid_2x_path, "PNG")
print(f"Grid 2x saved: {grid_2x_path} ({GRID_SIZE * TILE_SIZE * 2}x{GRID_SIZE * TILE_SIZE * 2})")

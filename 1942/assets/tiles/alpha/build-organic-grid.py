#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pillow>=10.0.0",
# ]
# ///
"""
Build a more organic-looking 12x12 island grid using the clean tile set.
Asymmetric shape with peninsula, cove, and irregular coastline.
"""
from PIL import Image
import os

TILE = 64
G = 12
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "clean")

def load(name):
    path = os.path.join(OUT_DIR, f"{name}.png")
    return Image.open(path).convert("RGB")

tiles = {}
for name in ["water-deep", "water-shallow", "water-foam", "sand", "grass",
             "edge-N", "edge-S", "edge-E", "edge-W",
             "edge-NE", "edge-NW", "edge-SE", "edge-SW",
             "inner-NE", "inner-NW", "inner-SE", "inner-SW",
             "sand-grass-n", "sand-grass-s",
             "cloud-thin", "cloud-thick"]:
    tiles[name] = load(name)

# Organic island layout:
# - Main body offset to the right
# - Small peninsula extending northwest
# - Cove on the southeast
# - Irregular coastline
#
# Legend:
#   W = deep water
#   S = shallow water
#   . = sand
#   G = grass
#   nw,ne,sw,se = outer corners (sand curves into water)
#   n,s,e,w = straight edges
#   iNE,iNW,iSE,iSW = inner corners (water curves into sand)
#   gn,gs = sand-grass transition

grid = [
    # 0: Open ocean with distant shallow
    ["W","W","W","W","W","W","W","W","W","W","W","W"],
    # 1: Small islet/reef to the left, shallow near main island
    ["W","W","W","W","W","S","S","S","W","W","W","W"],
    # 2: North peninsula (narrow land strip extending up-left)
    ["W","W","S","nw","n","n","ne","S","S","W","W","W"],
    # 3: Peninsula connects to wider body
    ["W","S","nw","w",".",".",".","ne","S","W","W","W"],
    # 4: Main island body widens east
    ["W","S","w",".",".","gn","gn",".",".","ne","S","W"],
    # 5: Widest part with grass interior
    ["W","S","w",".","G","G","G","G",".",".","e","S"],
    # 6: Grass continues, cove starts on east
    ["W","S","w",".","G","G","G",".","e","se","W","W"],
    # 7: South portion - narrowing with cove indent
    ["W","S","sw","w",".","gs","gs",".",".","ne","S","W"],
    # 8: South shore - offset to the right
    ["W","W","S","sw","s","s",".",".",".","e","S","W"],
    # 9: Small southern spit
    ["W","W","W","S","S","sw","s","s","se","S","W","W"],
    # 10: Scattered shallow water
    ["W","W","W","W","S","S","S","S","W","W","W","W"],
    # 11: Open ocean
    ["W","W","W","W","W","W","W","W","W","W","W","W"],
]

code_map = {
    "W": "water-deep", "S": "water-shallow",
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
        t = tiles[tile_name]
        grid_img.paste(t, (col_idx * TILE, row_idx * TILE))

grid_img.save(os.path.join(OUT_DIR, "island-organic-12x12.png"), "PNG")
print(f"✓ Grid: island-organic-12x12.png ({G*TILE}x{G*TILE})")

grid_2x = grid_img.resize((G * TILE * 2, G * TILE * 2), Image.NEAREST)
grid_2x.save(os.path.join(OUT_DIR, "island-organic-12x12-2x.png"), "PNG")
print(f"✓ Grid 2x: island-organic-12x12-2x.png")

#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pillow>=10.0.0",
# ]
# ///
"""
Dust Convoy clean/geometric tiles (Alpha-style workflow).
- Native authoring: 16x16
- Output: 64x64 (nearest-neighbor 4x)
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw

NATIVE = 16
SCALE = 4
TILE = NATIVE * SCALE

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "clean"
OUT.mkdir(parents=True, exist_ok=True)

# Dust Convoy palette (brown-amber + oasis water)
WATER_DEEP_1 = (24, 82, 89)
WATER_DEEP_2 = (18, 62, 67)
WATER_DEEP_3 = (36, 104, 110)
WATER_MID_1 = (42, 118, 114)
WATER_MID_2 = (58, 144, 137)
WATER_SHALLOW_1 = (78, 165, 147)
WATER_SHALLOW_2 = (108, 194, 170)
FOAM_1 = (226, 214, 184)
FOAM_2 = (242, 236, 210)

SAND_1 = (222, 182, 118)
SAND_2 = (202, 160, 98)
SAND_3 = (182, 140, 84)

GRASS_1 = (143, 154, 88)
GRASS_2 = (122, 132, 74)

ROCK_1 = (172, 110, 72)
ROCK_2 = (146, 90, 56)
ROCK_3 = (118, 70, 44)

STRUCTURE_1 = (141, 141, 136)
STRUCTURE_2 = (112, 113, 109)
STRUCTURE_3 = (94, 95, 92)
RUNWAY_MARK = (213, 205, 164)

PATH_1 = (176, 134, 82)
PATH_2 = (152, 112, 66)

CLOUD_LIGHT = (234, 214, 165, 160)
CLOUD_THICK = (214, 188, 132, 186)
CLOUD_STORM = (146, 124, 88, 200)


def new_rgb() -> Image.Image:
    return Image.new("RGB", (NATIVE, NATIVE))


def new_rgba() -> Image.Image:
    return Image.new("RGBA", (NATIVE, NATIVE), (0, 0, 0, 0))


def scale(img: Image.Image) -> Image.Image:
    return img.resize((TILE, TILE), Image.Resampling.NEAREST)


def fill_base(draw: ImageDraw.ImageDraw, fn: Callable[[int, int], tuple[int, int, int]]) -> None:
    for y in range(NATIVE):
        for x in range(NATIVE):
            draw.point((x, y), fill=fn(x, y))


def water_deep_px(x: int, y: int) -> tuple[int, int, int]:
    if (x + y * 2) % 9 == 0:
        return WATER_DEEP_3
    if (x * 3 + y) % 11 == 0:
        return WATER_DEEP_2
    return WATER_DEEP_1


def water_mid_px(x: int, y: int) -> tuple[int, int, int]:
    if (x * 2 + y * 3) % 8 == 0:
        return WATER_MID_2
    if (x + y) % 10 == 0:
        return WATER_DEEP_3
    return WATER_MID_1


def water_shallow_px(x: int, y: int) -> tuple[int, int, int]:
    if (x + y * 2) % 7 == 0:
        return WATER_SHALLOW_2
    if (x * 5 + y) % 13 == 0:
        return FOAM_1
    return WATER_SHALLOW_1


def foam_px(x: int, y: int) -> tuple[int, int, int]:
    if (x + y) % 3 == 0:
        return FOAM_2
    if (x * 2 + y * 3) % 5 == 0:
        return WATER_SHALLOW_2
    return FOAM_1


def sand_px(x: int, y: int) -> tuple[int, int, int]:
    if (x * 3 + y * 5) % 7 == 0:
        return SAND_2
    if (x * 7 + y * 11) % 19 == 0:
        return SAND_3
    return SAND_1


def grass_sparse_px(x: int, y: int) -> tuple[int, int, int]:
    base = sand_px(x, y)
    if (x * 5 + y * 7) % 17 == 0:
        return GRASS_1
    if (x * 3 + y * 2) % 29 == 0:
        return GRASS_2
    return base


def rock_px(x: int, y: int) -> tuple[int, int, int]:
    # Horizontal striations for canyon layers.
    if y % 4 == 0:
        return ROCK_2
    if (x + y * 2) % 6 == 0:
        return ROCK_3
    if (x * 2 + y) % 9 == 0:
        return ROCK_2
    return ROCK_1


def structure_px(x: int, y: int) -> tuple[int, int, int]:
    # Geometric concrete/runway plate with center line accents.
    if x in (7, 8) and y % 3 != 0:
        return RUNWAY_MARK
    if x % 4 == 0 or y % 4 == 0:
        return STRUCTURE_2
    if (x + y) % 11 == 0:
        return STRUCTURE_3
    return STRUCTURE_1


def path_px(x: int, y: int) -> tuple[int, int, int]:
    if y in (7, 8):
        return PATH_1
    if y in (6, 9):
        return PATH_2
    return sand_px(x, y)


def make_base(fn: Callable[[int, int], tuple[int, int, int]]) -> Image.Image:
    img = new_rgb()
    fill_base(ImageDraw.Draw(img), fn)
    return img


def make_edge(water_side: str) -> Image.Image:
    """Water/sand seam tiles. Uses shallow water + foam ribbon."""
    img = new_rgb()
    draw = ImageDraw.Draw(img)
    mid = 8

    for y in range(NATIVE):
        for x in range(NATIVE):
            wave = mid + (1 if (x % 6) < 3 else -1 if (x % 6) == 4 else 0)
            if water_side in ("left", "right"):
                wave = mid + (1 if (y % 6) < 3 else -1 if (y % 6) == 4 else 0)

            if water_side == "top":
                if y < wave - 1:
                    c = water_shallow_px(x, y)
                elif y in (wave - 1, wave):
                    c = foam_px(x, y)
                else:
                    c = sand_px(x, y)
            elif water_side == "bottom":
                if y < wave - 1:
                    c = sand_px(x, y)
                elif y in (wave - 1, wave):
                    c = foam_px(x, y)
                else:
                    c = water_shallow_px(x, y)
            elif water_side == "right":
                if x < wave - 1:
                    c = sand_px(x, y)
                elif x in (wave - 1, wave):
                    c = foam_px(x, y)
                else:
                    c = water_shallow_px(x, y)
            else:  # left
                if x < wave - 1:
                    c = water_shallow_px(x, y)
                elif x in (wave - 1, wave):
                    c = foam_px(x, y)
                else:
                    c = sand_px(x, y)

            draw.point((x, y), fill=c)

    return img


def make_outer_corner(corner: str) -> Image.Image:
    img = new_rgb()
    draw = ImageDraw.Draw(img)

    if corner == "NE":
        cx, cy = 0, NATIVE
    elif corner == "NW":
        cx, cy = NATIVE, NATIVE
    elif corner == "SE":
        cx, cy = 0, 0
    else:  # SW
        cx, cy = NATIVE, 0

    radius = 10

    for y in range(NATIVE):
        for x in range(NATIVE):
            dx = abs(x - cx) if cx == 0 else abs(x - cx + 1)
            dy = abs(y - cy) if cy == 0 else abs(y - cy + 1)
            dist = (dx * dx + dy * dy) ** 0.5

            if dist < radius - 2:
                c = sand_px(x, y)
            elif dist < radius:
                c = foam_px(x, y)
            else:
                c = water_shallow_px(x, y)
            draw.point((x, y), fill=c)

    return img


def make_inner_corner(corner: str) -> Image.Image:
    img = new_rgb()
    draw = ImageDraw.Draw(img)

    if corner == "NE":
        wx, wy = NATIVE, 0
    elif corner == "NW":
        wx, wy = 0, 0
    elif corner == "SE":
        wx, wy = NATIVE, NATIVE
    else:  # SW
        wx, wy = 0, NATIVE

    radius = 8

    for y in range(NATIVE):
        for x in range(NATIVE):
            dx = abs(x - wx)
            dy = abs(y - wy)
            dist = (dx * dx + dy * dy) ** 0.5

            if dist < radius - 2:
                c = water_shallow_px(x, y)
            elif dist < radius:
                c = foam_px(x, y)
            else:
                c = sand_px(x, y)
            draw.point((x, y), fill=c)

    return img


def make_cloud_thin() -> Image.Image:
    img = new_rgba()
    draw = ImageDraw.Draw(img)
    for y in range(NATIVE):
        for x in range(NATIVE):
            d = abs((x + y) - 14)
            if d < 2 and (x + y * 2) % 3 != 0:
                draw.point((x, y), fill=CLOUD_LIGHT)
            elif d < 4 and (x * 3 + y) % 5 == 0:
                draw.point((x, y), fill=(218, 196, 144, 95))
    return img


def make_cloud_thick() -> Image.Image:
    img = new_rgba()
    draw = ImageDraw.Draw(img)
    cx, cy = 7, 7
    for y in range(NATIVE):
        for x in range(NATIVE):
            dist = ((x - cx) ** 2 * 0.8 + (y - cy) ** 2 * 1.2) ** 0.5
            if dist < 5:
                draw.point((x, y), fill=CLOUD_THICK)
            elif dist < 6.2:
                draw.point((x, y), fill=(196, 170, 120, 140))
    return img


def make_cloud_storm() -> Image.Image:
    img = new_rgba()
    draw = ImageDraw.Draw(img)
    for y in range(NATIVE):
        for x in range(NATIVE):
            d1 = abs((x + y) - 11)
            d2 = abs((x - y) + 2)
            if d1 < 3 or d2 < 2:
                alpha = 150 if (x + y) % 2 == 0 else 185
                draw.point((x, y), fill=(CLOUD_STORM[0], CLOUD_STORM[1], CLOUD_STORM[2], alpha))
            elif (x * 2 + y * 3) % 11 == 0:
                draw.point((x, y), fill=(128, 107, 76, 110))
    return img


def build_demo_grid(tiles_64: dict[str, Image.Image]) -> None:
    codes = [
        ["W","W","W","W","W","W","W","W","W","W","W","W"],
        ["W","W","W","W","M","M","M","M","W","W","W","W"],
        ["W","W","M","nw","n","n","n","ne","M","W","W","W"],
        ["W","M","w",".","p","p","p",".","e","M","W","W"],
        ["W","M","w",".","g","g","g",".","e","M","W","W"],
        ["W","M","w","r","r","u","u","r","e","M","W","W"],
        ["W","M","w","r","iNW","u","u","iNE","e","M","W","W"],
        ["W","M","w","r","r","u","u","r","e","M","W","W"],
        ["W","M","sw",".","p","p","p",".","se","M","W","W"],
        ["W","W","M","sw","s","s","s","se","M","W","W","W"],
        ["W","W","W","W","M","M","M","M","W","W","W","W"],
        ["W","W","W","W","W","W","W","W","W","W","W","W"],
    ]

    code_map = {
        "W": "water-deep",
        "M": "water-mid",
        "H": "water-shallow",
        "F": "water-foam",
        ".": "sand",
        "g": "grass",
        "r": "rock",
        "u": "structure",
        "p": "path",
        "n": "edge-N",
        "s": "edge-S",
        "e": "edge-E",
        "w": "edge-W",
        "ne": "edge-NE",
        "nw": "edge-NW",
        "se": "edge-SE",
        "sw": "edge-SW",
        "iNE": "inner-NE",
        "iNW": "inner-NW",
        "iSE": "inner-SE",
        "iSW": "inner-SW",
    }

    grid_img = Image.new("RGB", (12 * TILE, 12 * TILE))
    for row_idx, row in enumerate(codes):
        for col_idx, code in enumerate(row):
            tile_name = code_map.get(code, "water-deep")
            tile = tiles_64[tile_name]
            if tile.mode != "RGB":
                tile = tile.convert("RGB")
            grid_img.paste(tile, (col_idx * TILE, row_idx * TILE))

    grid_path = OUT / "dust-convoy-grid-12x12.png"
    grid_img.save(grid_path, "PNG")

    grid_json = {
        "version": 1,
        "campaign": "dust_convoy",
        "name": "Dust Convoy 12x12 Demo",
        "cols": 12,
        "rows": 12,
        "tileSize": 64,
        "legend": code_map,
        "grid": codes,
    }
    with (OUT / "dust-convoy-grid-12x12.json").open("w", encoding="utf-8") as f:
        json.dump(grid_json, f, indent=2)


def main() -> None:
    tiles_16 = {
        # Water
        "water-deep": make_base(water_deep_px),
        "water-mid": make_base(water_mid_px),
        "water-shallow": make_base(water_shallow_px),
        "water-foam": make_base(foam_px),
        # Terrain
        "sand": make_base(sand_px),
        "grass": make_base(grass_sparse_px),
        "rock": make_base(rock_px),
        "structure": make_base(structure_px),
        "path": make_base(path_px),
        # Edges + corners
        "edge-N": make_edge("top"),
        "edge-S": make_edge("bottom"),
        "edge-E": make_edge("right"),
        "edge-W": make_edge("left"),
        "edge-NE": make_outer_corner("NE"),
        "edge-NW": make_outer_corner("NW"),
        "edge-SE": make_outer_corner("SE"),
        "edge-SW": make_outer_corner("SW"),
        "inner-NE": make_inner_corner("NE"),
        "inner-NW": make_inner_corner("NW"),
        "inner-SE": make_inner_corner("SE"),
        "inner-SW": make_inner_corner("SW"),
        # Clouds
        "cloud-thin": make_cloud_thin(),
        "cloud-thick": make_cloud_thick(),
        "cloud-storm": make_cloud_storm(),
    }

    tiles_64: dict[str, Image.Image] = {}
    for name, native in tiles_16.items():
        native.save(OUT / f"{name}-16.png", "PNG")
        scaled = scale(native)
        scaled.save(OUT / f"{name}.png", "PNG")
        tiles_64[name] = scaled
        print(f"generated: {name}")

    # Optional atlas for quick visual QA.
    atlas = Image.new("RGBA", (len(tiles_64) * TILE, TILE), (0, 0, 0, 0))
    for idx, name in enumerate(tiles_64.keys()):
        atlas.paste(tiles_64[name], (idx * TILE, 0))
    atlas.save(OUT / "tileset-atlas.png", "PNG")

    build_demo_grid(tiles_64)
    print(f"done: {len(tiles_64)} tiles + demo grid")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "pillow>=10.0.0",
# ]
# ///
"""Generate Jungle Spear tile set using a clean, geometric 16x16 -> 64x64 workflow."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Dict, List

from PIL import Image, ImageDraw

NATIVE = 16
SCALE = 4
TILE = NATIVE * SCALE

OUT_DIR = os.path.dirname(os.path.abspath(__file__))


@dataclass(frozen=True)
class Palette:
    water_deep_1: tuple[int, int, int]
    water_deep_2: tuple[int, int, int]
    water_deep_3: tuple[int, int, int]
    water_mid_1: tuple[int, int, int]
    water_mid_2: tuple[int, int, int]
    water_shallow_1: tuple[int, int, int]
    water_shallow_2: tuple[int, int, int]
    foam: tuple[int, int, int]

    terrain_sand_1: tuple[int, int, int]
    terrain_sand_2: tuple[int, int, int]
    terrain_sand_3: tuple[int, int, int]

    terrain_grass_1: tuple[int, int, int]
    terrain_grass_2: tuple[int, int, int]
    terrain_grass_3: tuple[int, int, int]
    terrain_grass_h: tuple[int, int, int]

    terrain_rock_1: tuple[int, int, int]
    terrain_rock_2: tuple[int, int, int]
    terrain_rock_3: tuple[int, int, int]
    terrain_rock_h: tuple[int, int, int]

    terrain_structure_1: tuple[int, int, int]
    terrain_structure_2: tuple[int, int, int]
    terrain_structure_3: tuple[int, int, int]
    moss: tuple[int, int, int]

    cloud_thin: tuple[int, int, int, int]
    cloud_thick: tuple[int, int, int, int]
    cloud_storm: tuple[int, int, int, int]


P = Palette(
    water_deep_1=(19, 56, 49),
    water_deep_2=(13, 39, 34),
    water_deep_3=(28, 72, 63),
    water_mid_1=(30, 84, 68),
    water_mid_2=(43, 112, 90),
    water_shallow_1=(62, 131, 98),
    water_shallow_2=(88, 158, 120),
    foam=(172, 210, 168),
    terrain_sand_1=(94, 84, 52),
    terrain_sand_2=(79, 68, 42),
    terrain_sand_3=(112, 100, 64),
    terrain_grass_1=(42, 96, 48),
    terrain_grass_2=(33, 78, 39),
    terrain_grass_3=(25, 62, 32),
    terrain_grass_h=(63, 124, 66),
    terrain_rock_1=(92, 100, 96),
    terrain_rock_2=(73, 79, 76),
    terrain_rock_3=(58, 63, 61),
    terrain_rock_h=(121, 128, 124),
    terrain_structure_1=(97, 88, 74),
    terrain_structure_2=(80, 72, 60),
    terrain_structure_3=(64, 56, 46),
    moss=(66, 96, 62),
    cloud_thin=(170, 198, 170, 90),
    cloud_thick=(152, 185, 152, 150),
    cloud_storm=(92, 116, 92, 185),
)


def new_rgb() -> Image.Image:
    return Image.new("RGB", (NATIVE, NATIVE))


def new_rgba() -> Image.Image:
    return Image.new("RGBA", (NATIVE, NATIVE), (0, 0, 0, 0))


def scale(img: Image.Image) -> Image.Image:
    return img.resize((TILE, TILE), Image.NEAREST)


def px(draw: ImageDraw.ImageDraw, x: int, y: int, color):
    if 0 <= x < NATIVE and 0 <= y < NATIVE:
        draw.point((x, y), fill=color)


def fill_water_deep(x: int, y: int):
    if (x + y * 2) % 9 == 0:
        return P.water_deep_3
    if (x * 3 + y) % 11 == 0:
        return P.water_deep_2
    return P.water_deep_1


def fill_water_mid(x: int, y: int):
    if (x + y) % 7 == 0:
        return P.water_mid_2
    if (x * 2 + y * 3) % 13 == 0:
        return P.water_deep_3
    return P.water_mid_1


def fill_water_shallow(x: int, y: int):
    if (x + y) % 5 == 0:
        return P.water_shallow_2
    if (x * 4 + y * 3) % 17 == 0:
        return P.foam
    return P.water_shallow_1


def fill_sand(x: int, y: int):
    if (x * 5 + y * 7) % 19 == 0:
        return P.terrain_sand_3
    if (x + y * 3) % 9 == 0:
        return P.terrain_sand_2
    return P.terrain_sand_1


def fill_grass(x: int, y: int):
    if (x + y) % 3 == 0:
        return P.terrain_grass_2
    if (x * 2 + y * 5) % 11 == 0:
        return P.terrain_grass_3
    if (x * 7 + y * 3) % 23 == 0:
        return P.terrain_grass_h
    return P.terrain_grass_1


def fill_rock(x: int, y: int):
    if (x + y * 2) % 7 == 0:
        return P.terrain_rock_2
    if (x * 3 + y * 2) % 13 == 0:
        return P.terrain_rock_3
    if (x * 11 + y * 5) % 29 == 0:
        return P.terrain_rock_h
    return P.terrain_rock_1


def fill_structure(x: int, y: int):
    # Ruin blocks and cracks in a clean geometric pattern.
    block = ((x // 4) + (y // 4)) % 2
    if block == 0:
        base = P.terrain_structure_1
    else:
        base = P.terrain_structure_2
    if (x + y) % 9 == 0:
        base = P.terrain_structure_3
    if y % 5 == 0 and x % 4 in (1, 2):
        base = P.moss
    return base


def make_water_deep() -> Image.Image:
    img = new_rgb()
    draw = ImageDraw.Draw(img)
    for y in range(NATIVE):
        for x in range(NATIVE):
            px(draw, x, y, fill_water_deep(x, y))
    return img


def make_water_mid() -> Image.Image:
    img = new_rgb()
    draw = ImageDraw.Draw(img)
    for y in range(NATIVE):
        for x in range(NATIVE):
            px(draw, x, y, fill_water_mid(x, y))
    return img


def make_water_shallow() -> Image.Image:
    img = new_rgb()
    draw = ImageDraw.Draw(img)
    for y in range(NATIVE):
        for x in range(NATIVE):
            px(draw, x, y, fill_water_shallow(x, y))
    return img


def make_water_foam() -> Image.Image:
    img = new_rgb()
    draw = ImageDraw.Draw(img)
    for y in range(NATIVE):
        for x in range(NATIVE):
            c = fill_water_shallow(x, y)
            if (x + y) % 4 == 0:
                c = P.foam
            if (x * 7 + y * 5) % 23 == 0:
                c = (194, 223, 190)
            px(draw, x, y, c)
    return img


def make_terrain_sand() -> Image.Image:
    img = new_rgb()
    draw = ImageDraw.Draw(img)
    for y in range(NATIVE):
        for x in range(NATIVE):
            px(draw, x, y, fill_sand(x, y))
    return img


def make_terrain_grass() -> Image.Image:
    img = new_rgb()
    draw = ImageDraw.Draw(img)
    for y in range(NATIVE):
        for x in range(NATIVE):
            px(draw, x, y, fill_grass(x, y))
    return img


def make_terrain_rock() -> Image.Image:
    img = new_rgb()
    draw = ImageDraw.Draw(img)
    for y in range(NATIVE):
        for x in range(NATIVE):
            px(draw, x, y, fill_rock(x, y))
    return img


def make_terrain_structure() -> Image.Image:
    img = new_rgb()
    draw = ImageDraw.Draw(img)
    for y in range(NATIVE):
        for x in range(NATIVE):
            px(draw, x, y, fill_structure(x, y))
    return img


def make_edge(water_side: str) -> Image.Image:
    img = new_rgb()
    draw = ImageDraw.Draw(img)
    mid = 8

    for y in range(NATIVE):
        for x in range(NATIVE):
            if water_side in ("top", "bottom"):
                shore = mid + (1 if (x % 6) < 3 else -1 if (x % 6) == 4 else 0)
                if water_side == "top":
                    if y < shore - 1:
                        c = fill_water_shallow(x, y)
                    elif y in (shore - 1, shore):
                        c = P.foam
                    else:
                        c = fill_sand(x, y)
                else:
                    if y < shore - 1:
                        c = fill_sand(x, y)
                    elif y in (shore - 1, shore):
                        c = P.foam
                    else:
                        c = fill_water_shallow(x, y)
            else:
                shore = mid + (1 if (y % 6) < 3 else -1 if (y % 6) == 4 else 0)
                if water_side == "right":
                    if x < shore - 1:
                        c = fill_sand(x, y)
                    elif x in (shore - 1, shore):
                        c = P.foam
                    else:
                        c = fill_water_shallow(x, y)
                else:
                    if x < shore - 1:
                        c = fill_water_shallow(x, y)
                    elif x in (shore - 1, shore):
                        c = P.foam
                    else:
                        c = fill_sand(x, y)
            px(draw, x, y, c)
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
                c = fill_sand(x, y)
            elif dist < radius:
                c = P.foam
            else:
                c = fill_water_shallow(x, y)
            px(draw, x, y, c)
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
                c = fill_water_shallow(x, y)
            elif dist < radius:
                c = P.foam
            else:
                c = fill_sand(x, y)
            px(draw, x, y, c)
    return img


def make_cloud(kind: str) -> Image.Image:
    img = new_rgba()
    draw = ImageDraw.Draw(img)

    if kind == "thin":
        c0, c1 = P.cloud_thin, (195, 220, 195, 120)
        for y in range(NATIVE):
            for x in range(NATIVE):
                d = abs((x + y) - 15)
                if d < 2 and (x + y * 2) % 3 != 0:
                    px(draw, x, y, c0)
                if d < 1:
                    px(draw, x, y, c1)
    elif kind == "thick":
        c0, c1 = P.cloud_thick, (178, 207, 178, 190)
        cx, cy = 7, 8
        for y in range(NATIVE):
            for x in range(NATIVE):
                dist = ((x - cx) ** 2 * 0.9 + (y - cy) ** 2 * 1.1) ** 0.5
                if dist < 5:
                    px(draw, x, y, c1)
                elif dist < 6:
                    px(draw, x, y, c0)
                elif dist < 7 and (x + y) % 3 == 0:
                    px(draw, x, y, c0)
    else:  # storm
        c0, c1 = P.cloud_storm, (120, 146, 120, 220)
        cx, cy = 8, 7
        for y in range(NATIVE):
            for x in range(NATIVE):
                dist = ((x - cx) ** 2 * 1.1 + (y - cy) ** 2 * 0.8) ** 0.5
                if dist < 5:
                    px(draw, x, y, c1)
                elif dist < 7:
                    px(draw, x, y, c0)
                elif dist < 8 and (x + y) % 2 == 0:
                    px(draw, x, y, c0)
        # Dark fissure to imply storm turbulence.
        for i in range(3, 13):
            if i % 2 == 0:
                px(draw, i, i // 2 + 3, (58, 74, 58, 200))

    return img


def save_tiles(tiles: Dict[str, Image.Image]) -> Dict[str, Image.Image]:
    scaled: Dict[str, Image.Image] = {}
    for name, native in tiles.items():
        native.save(os.path.join(OUT_DIR, f"{name}-16.png"), "PNG")
        big = scale(native)
        big.save(os.path.join(OUT_DIR, f"{name}.png"), "PNG")
        scaled[name] = big
        print(f"  generated {name}")
    return scaled


def build_atlas(scaled_tiles: Dict[str, Image.Image]) -> None:
    names = list(scaled_tiles.keys())
    atlas = Image.new("RGBA", (len(names) * TILE, TILE), (0, 0, 0, 0))
    for i, name in enumerate(names):
        atlas.paste(scaled_tiles[name], (i * TILE, 0), scaled_tiles[name] if scaled_tiles[name].mode == "RGBA" else None)
    atlas.save(os.path.join(OUT_DIR, "tileset-atlas.png"), "PNG")


def build_demo_grid(scaled_tiles: Dict[str, Image.Image]) -> None:
    # Water IDs: 1 deep, 2 mid, 3 shallow, 4 foam
    # Terrain IDs: 10 sand, 11 grass, 12 rock, 13 structure
    # Edge IDs: 20..31, Cloud IDs: 40..42
    water_layer = [
        [1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3, 3, 2, 2, 1, 1, 1],
        [1, 2, 3, 3, 3, 4, 3, 3, 2, 2, 1, 1],
        [1, 2, 3, 3, 4, 3, 3, 3, 2, 2, 1, 1],
        [1, 2, 3, 4, 3, 3, 3, 4, 3, 2, 2, 1],
        [1, 2, 3, 3, 3, 2, 2, 3, 3, 2, 2, 1],
        [1, 2, 3, 3, 2, 2, 2, 3, 3, 2, 1, 1],
        [1, 2, 3, 3, 3, 2, 2, 3, 3, 2, 1, 1],
        [1, 2, 3, 3, 3, 3, 3, 3, 2, 2, 1, 1],
        [1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1, 1],
        [1, 1, 2, 2, 2, 3, 2, 2, 1, 1, 1, 1],
        [1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1],
    ]

    terrain_layer = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 25, 20, 24, 0, 0, 0, 0],
        [0, 0, 0, 25, 20, 20, 20, 20, 24, 0, 0, 0],
        [0, 0, 25, 23, 10, 10, 10, 10, 22, 24, 0, 0],
        [0, 0, 23, 10, 11, 11, 11, 10, 10, 22, 0, 0],
        [0, 25, 23, 10, 11, 12, 11, 11, 10, 22, 24, 0],
        [0, 23, 10, 10, 11, 13, 11, 11, 10, 10, 22, 0],
        [0, 27, 23, 10, 11, 11, 11, 12, 11, 10, 22, 0],
        [0, 0, 27, 23, 10, 10, 11, 13, 10, 22, 26, 0],
        [0, 0, 0, 27, 21, 21, 21, 21, 21, 26, 0, 0],
        [0, 0, 0, 0, 0, 31, 30, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]

    clouds_layer = [
        [0, 0, 0, 40, 40, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 41, 41, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 42, 42, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 42, 42, 42, 42, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 42, 42, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 41, 41, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 40, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]

    id_to_tile = {
        1: "water-deep",
        2: "water-mid",
        3: "water-shallow",
        4: "water-foam",
        10: "terrain-sand",
        11: "terrain-grass",
        12: "terrain-rock",
        13: "terrain-structure",
        20: "edge-N",
        21: "edge-S",
        22: "edge-E",
        23: "edge-W",
        24: "edge-NE",
        25: "edge-NW",
        26: "edge-SE",
        27: "edge-SW",
        28: "edge-inner-NE",
        29: "edge-inner-NW",
        30: "edge-inner-SE",
        31: "edge-inner-SW",
        40: "cloud-thin",
        41: "cloud-thick",
        42: "cloud-storm",
    }

    cols = 12
    rows = 12
    demo_img = Image.new("RGBA", (cols * TILE, rows * TILE), (0, 0, 0, 0))

    for y in range(rows):
        for x in range(cols):
            w_id = water_layer[y][x]
            w_tile = scaled_tiles[id_to_tile[w_id]]
            demo_img.paste(w_tile, (x * TILE, y * TILE))

            t_id = terrain_layer[y][x]
            if t_id:
                t_tile = scaled_tiles[id_to_tile[t_id]]
                demo_img.paste(t_tile, (x * TILE, y * TILE))

            c_id = clouds_layer[y][x]
            if c_id:
                c_tile = scaled_tiles[id_to_tile[c_id]]
                demo_img.paste(c_tile, (x * TILE, y * TILE), c_tile)

    demo_img.save(os.path.join(OUT_DIR, "demo-grid-12x12.png"), "PNG")

    level_json = {
        "version": 1,
        "campaign": "jungle_spear",
        "name": "Jungle Spear - Tile Demo 12x12",
        "cols": cols,
        "rows": rows,
        "tileSize": TILE,
        "layers": {
            "water": water_layer,
            "terrain": terrain_layer,
            "clouds": clouds_layer,
        },
    }

    with open(os.path.join(OUT_DIR, "demo-grid-12x12.json"), "w", encoding="utf-8") as f:
        json.dump(level_json, f, indent=2)


def main() -> None:
    tiles: Dict[str, Image.Image] = {
        "water-deep": make_water_deep(),
        "water-mid": make_water_mid(),
        "water-shallow": make_water_shallow(),
        "water-foam": make_water_foam(),
        "terrain-sand": make_terrain_sand(),
        "terrain-grass": make_terrain_grass(),
        "terrain-rock": make_terrain_rock(),
        "terrain-structure": make_terrain_structure(),
        "edge-N": make_edge("top"),
        "edge-S": make_edge("bottom"),
        "edge-E": make_edge("right"),
        "edge-W": make_edge("left"),
        "edge-NE": make_outer_corner("NE"),
        "edge-NW": make_outer_corner("NW"),
        "edge-SE": make_outer_corner("SE"),
        "edge-SW": make_outer_corner("SW"),
        "edge-inner-NE": make_inner_corner("NE"),
        "edge-inner-NW": make_inner_corner("NW"),
        "edge-inner-SE": make_inner_corner("SE"),
        "edge-inner-SW": make_inner_corner("SW"),
        "cloud-thin": make_cloud("thin"),
        "cloud-thick": make_cloud("thick"),
        "cloud-storm": make_cloud("storm"),
    }

    print("Generating Jungle Spear tile set...")
    scaled = save_tiles(tiles)
    build_atlas(scaled)
    build_demo_grid(scaled)
    print("Done.")


if __name__ == "__main__":
    main()

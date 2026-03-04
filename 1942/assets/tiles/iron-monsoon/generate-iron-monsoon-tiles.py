#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "pillow>=10.0.0",
# ]
# ///
"""Iron Monsoon tile generator (Alpha clean/geometric workflow)."""

from __future__ import annotations

import json
from collections import OrderedDict
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw

NATIVE = 16
SCALE = 4
TILE = NATIVE * SCALE
GRID = 12

OUT_DIR = Path(__file__).resolve().parent

# Iron Monsoon palette (storm ocean + industrial steel)
WATER_DEEP_1 = (18, 24, 40)
WATER_DEEP_2 = (12, 17, 30)
WATER_DEEP_3 = (30, 38, 62)
WATER_MID_1 = (29, 43, 70)
WATER_MID_2 = (39, 56, 88)
WATER_SHALLOW_1 = (52, 70, 101)
WATER_SHALLOW_2 = (78, 101, 136)
FOAM_1 = (160, 176, 201)
FOAM_2 = (126, 143, 171)

PLATFORM_1 = (88, 96, 110)
PLATFORM_2 = (73, 81, 94)
DECK_1 = (102, 94, 88)
DECK_2 = (86, 78, 73)
STEEL_1 = (112, 118, 128)
STEEL_2 = (90, 96, 106)
STRUCTURE_1 = (74, 84, 99)
STRUCTURE_2 = (60, 68, 82)
PATH_1 = (116, 96, 77)
PATH_2 = (95, 78, 62)
RUST = (138, 88, 62)

CLOUD_THIN = (134, 143, 160, 92)
CLOUD_THICK_1 = (109, 119, 138, 136)
CLOUD_THICK_2 = (88, 97, 116, 172)
CLOUD_STORM_1 = (61, 70, 87, 200)
CLOUD_STORM_2 = (42, 50, 64, 232)
LIGHTNING = (203, 215, 229, 188)


def new_tile(mode: str = "RGB") -> Image.Image:
    if mode == "RGBA":
        return Image.new(mode, (NATIVE, NATIVE), (0, 0, 0, 0))
    return Image.new(mode, (NATIVE, NATIVE))


def scale(img: Image.Image) -> Image.Image:
    return img.resize((TILE, TILE), Image.NEAREST)


def set_px(draw: ImageDraw.ImageDraw, x: int, y: int, color: tuple[int, ...]) -> None:
    if 0 <= x < NATIVE and 0 <= y < NATIVE:
        draw.point((x, y), fill=color)


def fill_water_deep(x: int, y: int) -> tuple[int, int, int]:
    if (x + y * 2) % 11 == 0:
        return WATER_DEEP_3
    if (x * 3 + y * 5) % 13 == 0:
        return WATER_DEEP_2
    return WATER_DEEP_1


def fill_water_mid(x: int, y: int) -> tuple[int, int, int]:
    if (x + y * 3) % 10 == 0:
        return WATER_MID_2
    if (x * 5 + y) % 12 == 0:
        return WATER_DEEP_3
    return WATER_MID_1


def fill_water_shallow(x: int, y: int) -> tuple[int, int, int]:
    if (x * 3 + y * 2) % 9 == 0:
        return WATER_SHALLOW_2
    if (x + y * 4) % 15 == 0:
        return FOAM_1
    return WATER_SHALLOW_1


def fill_water_foam(x: int, y: int) -> tuple[int, int, int]:
    if (x + y) % 2 == 0:
        return FOAM_1
    if (x * 7 + y * 3) % 11 == 0:
        return FOAM_2
    return WATER_SHALLOW_2


def fill_platform(x: int, y: int) -> tuple[int, int, int]:
    if y % 4 == 0:
        return PLATFORM_2
    if (x * 3 + y) % 11 == 0:
        return STEEL_2
    return PLATFORM_1


def fill_deck(x: int, y: int) -> tuple[int, int, int]:
    if (x + y) % 5 == 0:
        return DECK_2
    if (x * 2 + y * 3) % 19 == 0:
        return RUST
    return DECK_1


def fill_steel(x: int, y: int) -> tuple[int, int, int]:
    if (x + y * 2) % 6 == 0:
        return STEEL_2
    if x % 5 == 0:
        return PLATFORM_2
    return STEEL_1


def fill_structure(x: int, y: int) -> tuple[int, int, int]:
    if (x * 2 + y * 7) % 9 == 0:
        return STRUCTURE_2
    if (x + y) % 13 == 0:
        return RUST
    return STRUCTURE_1


def fill_path(x: int, y: int) -> tuple[int, int, int]:
    if y % 3 == 1:
        return PATH_2
    if (x * 5 + y * 3) % 14 == 0:
        return RUST
    return PATH_1


def make_fill_tile(fill_fn: Callable[[int, int], tuple[int, int, int]]) -> Image.Image:
    img = new_tile("RGB")
    draw = ImageDraw.Draw(img)
    for y in range(NATIVE):
        for x in range(NATIVE):
            set_px(draw, x, y, fill_fn(x, y))
    return img


def make_edge(water_side: str) -> Image.Image:
    img = new_tile("RGB")
    draw = ImageDraw.Draw(img)
    mid = NATIVE // 2
    for y in range(NATIVE):
        for x in range(NATIVE):
            if water_side in ("top", "bottom"):
                ridge = mid + (1 if (x % 6) in (1, 2) else -1 if (x % 6) == 4 else 0)
                if water_side == "top":
                    water_region = y < ridge - 1
                    foam_region = y in (ridge - 1, ridge)
                else:
                    water_region = y > ridge
                    foam_region = y in (ridge - 1, ridge)
            else:
                ridge = mid + (1 if (y % 6) in (1, 2) else -1 if (y % 6) == 4 else 0)
                if water_side == "right":
                    water_region = x > ridge
                    foam_region = x in (ridge - 1, ridge)
                else:
                    water_region = x < ridge - 1
                    foam_region = x in (ridge - 1, ridge)

            if water_region:
                set_px(draw, x, y, fill_water_shallow(x, y))
            elif foam_region:
                set_px(draw, x, y, fill_water_foam(x, y))
            else:
                set_px(draw, x, y, fill_platform(x, y))
    return img


def make_outer_corner(corner: str) -> Image.Image:
    img = new_tile("RGB")
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
                set_px(draw, x, y, fill_platform(x, y))
            elif dist < radius:
                set_px(draw, x, y, fill_water_foam(x, y))
            else:
                set_px(draw, x, y, fill_water_shallow(x, y))
    return img


def make_inner_corner(corner: str) -> Image.Image:
    img = new_tile("RGB")
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
                set_px(draw, x, y, fill_water_shallow(x, y))
            elif dist < radius:
                set_px(draw, x, y, fill_water_foam(x, y))
            else:
                set_px(draw, x, y, fill_platform(x, y))
    return img


def make_cloud_thin() -> Image.Image:
    img = new_tile("RGBA")
    draw = ImageDraw.Draw(img)
    for y in range(NATIVE):
        for x in range(NATIVE):
            diag = abs((x + y) - 13)
            if diag < 2 and (x + y * 2) % 3 != 0:
                set_px(draw, x, y, CLOUD_THIN)
            if diag == 0:
                set_px(draw, x, y, CLOUD_THICK_1)
    return img


def make_cloud_thick() -> Image.Image:
    img = new_tile("RGBA")
    draw = ImageDraw.Draw(img)
    cx, cy = 8, 7
    for y in range(NATIVE):
        for x in range(NATIVE):
            dist = (((x - cx) ** 2) * 0.8 + ((y - cy) ** 2) * 1.2) ** 0.5
            if dist < 4.5:
                set_px(draw, x, y, CLOUD_THICK_2)
            elif dist < 6.0:
                set_px(draw, x, y, CLOUD_THICK_1)
    return img


def make_cloud_storm() -> Image.Image:
    img = new_tile("RGBA")
    draw = ImageDraw.Draw(img)
    cx, cy = 7, 7
    for y in range(NATIVE):
        for x in range(NATIVE):
            dist = (((x - cx) ** 2) * 0.9 + ((y - cy) ** 2) * 1.1) ** 0.5
            if dist < 4.5:
                set_px(draw, x, y, CLOUD_STORM_2)
            elif dist < 6.5:
                set_px(draw, x, y, CLOUD_STORM_1)

    for x, y in ((6, 6), (7, 7), (8, 7), (8, 8)):
        set_px(draw, x, y, LIGHTNING)
    return img


def compose_demo_grid(tiles_64: dict[str, Image.Image]) -> tuple[Image.Image, dict]:
    # Layer IDs from tile-system-spec.md
    W, M, S, F = 1, 2, 3, 4
    TP, TD, TS, TST, TPATH = 10, 11, 12, 13, 14
    EN, ES, EE, EW = 20, 21, 22, 23
    ENE, ENW, ESE, ESW = 24, 25, 26, 27
    INE, INW, ISE, ISW = 28, 29, 30, 31
    CTHIN, CTHICK, CSTORM = 40, 41, 42

    water_layer = [
        [W, W, W, M, M, M, M, M, M, W, W, W],
        [W, W, M, M, S, S, S, S, M, M, W, W],
        [W, M, S, S, S, S, S, S, S, S, M, W],
        [M, S, S, S, S, S, S, S, S, S, S, M],
        [M, S, S, S, S, S, S, S, S, S, S, M],
        [M, S, S, S, S, F, F, S, S, S, S, M],
        [M, S, S, S, F, F, F, F, S, S, S, M],
        [M, S, S, S, S, F, F, S, S, S, S, M],
        [W, M, S, S, S, S, S, S, S, S, M, W],
        [W, W, M, S, S, S, S, S, S, M, W, W],
        [W, W, W, M, M, M, M, M, M, W, W, W],
        [W, W, W, W, W, W, W, W, W, W, W, W],
    ]

    terrain_layer = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, ENW, EN, EN, EN, EN, EN, EN, ENE, 0, 0],
        [0, ENW, EW, TP, TP, TP, TP, TP, TP, EE, ENE, 0],
        [0, EW, TP, TPATH, TPATH, TPATH, TPATH, TPATH, TP, TP, EE, 0],
        [0, EW, TP, TD, TD, TST, TST, TD, TD, TP, EE, 0],
        [0, EW, TP, TD, TS, TST, TST, TS, TD, TP, EE, 0],
        [0, EW, TP, TD, TD, TST, TST, TD, TD, TP, EE, 0],
        [0, ESW, EW, TP, TP, TP, TP, TP, TP, EE, ESE, 0],
        [0, 0, ESW, ES, ES, ES, ES, ES, ES, ESE, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]

    # Add inner-corner cutout in platform network
    terrain_layer[5][3] = INW
    terrain_layer[5][8] = INE
    terrain_layer[7][3] = ISW
    terrain_layer[7][8] = ISE
    terrain_layer[6][6] = TST

    clouds_layer = [
        [0, 0, 40, 0, 0, 41, 0, 0, 40, 0, 0, 0],
        [0, 0, 0, 0, 41, 0, 0, 41, 0, 0, 0, 0],
        [0, 0, 0, 40, 0, 0, 0, 0, 40, 0, 0, 0],
        [0, 0, 0, 0, 0, 42, 42, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 42, 42, 42, 42, 0, 0, 0, 0],
        [0, 0, 0, 0, 42, 42, 42, 42, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 42, 42, 0, 0, 0, 0, 0],
        [0, 0, 0, 40, 0, 0, 0, 0, 40, 0, 0, 0],
        [0, 0, 0, 0, 41, 0, 0, 41, 0, 0, 0, 0],
        [0, 0, 40, 0, 0, 41, 0, 0, 40, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]

    id_to_tile = {
        1: "water-deep",
        2: "water-mid",
        3: "water-shallow",
        4: "water-foam",
        10: "terrain-platform",
        11: "terrain-deck",
        12: "terrain-steel",
        13: "terrain-structure",
        14: "terrain-path",
        20: "edge-N",
        21: "edge-S",
        22: "edge-E",
        23: "edge-W",
        24: "edge-NE",
        25: "edge-NW",
        26: "edge-SE",
        27: "edge-SW",
        28: "inner-NE",
        29: "inner-NW",
        30: "inner-SE",
        31: "inner-SW",
        40: "cloud-thin",
        41: "cloud-thick",
        42: "cloud-storm",
    }

    composed = Image.new("RGBA", (GRID * TILE, GRID * TILE), (0, 0, 0, 255))

    for row in range(GRID):
        for col in range(GRID):
            wx = col * TILE
            wy = row * TILE

            base = tiles_64[id_to_tile[water_layer[row][col]]].convert("RGBA")
            composed.paste(base, (wx, wy))

            terrain_id = terrain_layer[row][col]
            if terrain_id:
                terrain_tile = tiles_64[id_to_tile[terrain_id]].convert("RGBA")
                composed.paste(terrain_tile, (wx, wy))

            cloud_id = clouds_layer[row][col]
            if cloud_id:
                cloud_tile = tiles_64[id_to_tile[cloud_id]].convert("RGBA")
                composed.alpha_composite(cloud_tile, (wx, wy))

    demo_json = {
        "version": 1,
        "campaign": "iron_monsoon",
        "name": "Iron Monsoon Demo 12x12",
        "cols": GRID,
        "rows": GRID,
        "tileSize": TILE,
        "layers": {
            "water": water_layer,
            "terrain": terrain_layer,
            "clouds": clouds_layer,
        },
        "tileMap": {str(k): v for k, v in sorted(id_to_tile.items())},
        "metadata": {
            "author": "codex",
            "created": "2026-03-03",
            "notes": "Alpha clean/geometric approach adapted for Iron Monsoon.",
        },
    }

    return composed, demo_json


def main() -> None:
    tiles_native: OrderedDict[str, Image.Image] = OrderedDict(
        [
            ("water-deep", make_fill_tile(fill_water_deep)),
            ("water-mid", make_fill_tile(fill_water_mid)),
            ("water-shallow", make_fill_tile(fill_water_shallow)),
            ("water-foam", make_fill_tile(fill_water_foam)),
            ("terrain-platform", make_fill_tile(fill_platform)),
            ("terrain-deck", make_fill_tile(fill_deck)),
            ("terrain-steel", make_fill_tile(fill_steel)),
            ("terrain-structure", make_fill_tile(fill_structure)),
            ("terrain-path", make_fill_tile(fill_path)),
            ("edge-N", make_edge("top")),
            ("edge-S", make_edge("bottom")),
            ("edge-E", make_edge("right")),
            ("edge-W", make_edge("left")),
            ("edge-NE", make_outer_corner("NE")),
            ("edge-NW", make_outer_corner("NW")),
            ("edge-SE", make_outer_corner("SE")),
            ("edge-SW", make_outer_corner("SW")),
            ("inner-NE", make_inner_corner("NE")),
            ("inner-NW", make_inner_corner("NW")),
            ("inner-SE", make_inner_corner("SE")),
            ("inner-SW", make_inner_corner("SW")),
            ("cloud-thin", make_cloud_thin()),
            ("cloud-thick", make_cloud_thick()),
            ("cloud-storm", make_cloud_storm()),
        ]
    )

    tiles_64: dict[str, Image.Image] = {}
    for name, tile in tiles_native.items():
        tile.save(OUT_DIR / f"{name}-16.png", "PNG")
        upscaled = scale(tile)
        upscaled.save(OUT_DIR / f"{name}.png", "PNG")
        tiles_64[name] = upscaled
        print(f"  generated {name}")

    atlas = Image.new("RGBA", (len(tiles_64) * TILE, TILE), (0, 0, 0, 0))
    for i, tile in enumerate(tiles_64.values()):
        atlas.paste(tile.convert("RGBA"), (i * TILE, 0))
    atlas.save(OUT_DIR / "iron-monsoon-tileset-atlas.png", "PNG")
    print("  generated iron-monsoon-tileset-atlas.png")

    demo_img, demo_json = compose_demo_grid(tiles_64)
    demo_img.save(OUT_DIR / "iron-monsoon-demo-12x12.png", "PNG")
    demo_img.resize((GRID * TILE * 2, GRID * TILE * 2), Image.NEAREST).save(
        OUT_DIR / "iron-monsoon-demo-12x12-2x.png", "PNG"
    )
    with (OUT_DIR / "iron-monsoon-demo-12x12.json").open("w", encoding="utf-8") as fp:
        json.dump(demo_json, fp, indent=2)
        fp.write("\n")

    print("  generated iron-monsoon-demo-12x12.png")
    print("  generated iron-monsoon-demo-12x12-2x.png")
    print("  generated iron-monsoon-demo-12x12.json")


if __name__ == "__main__":
    main()

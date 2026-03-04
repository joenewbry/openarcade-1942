#!/usr/bin/env python3
"""Generate campaign-specific tile PNGs from the alpha template.

Usage:
  python3 generate-campaign-tiles.py \
    --campaign coral_front \
    --template 1942/tools/generation/alpha-template.json \
    --source-dir 1942/assets/tiles/alpha/clean \
    --output-dir 1942/assets/tiles/generated
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Tuple

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    print("error: Pillow is required. Install with `python3 -m pip install pillow`.", file=sys.stderr)
    sys.exit(2)


@dataclass(frozen=True)
class TileDef:
    tile_id: int
    name: str
    layer: str
    source: str
    palette_key: str


def parse_hex_color(value: str) -> Tuple[int, int, int]:
    value = value.strip()
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise ValueError(f"Invalid hex color: {value}")
    return int(value[1:3], 16), int(value[3:5], 16), int(value[5:7], 16)


def clamp_u8(value: float) -> int:
    return max(0, min(255, int(round(value))))


def recolor_tile(image: Image.Image, color: Tuple[int, int, int]) -> Image.Image:
    rgba = image.convert("RGBA")
    px = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
            shade = 0.35 + (luminance * 0.9)
            nr = clamp_u8(color[0] * shade)
            ng = clamp_u8(color[1] * shade)
            nb = clamp_u8(color[2] * shade)
            px[x, y] = (nr, ng, nb, a)

    return rgba


def load_template(template_path: Path) -> Dict[str, Any]:
    try:
        data = json.loads(template_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"error: template not found: {template_path}", file=sys.stderr)
        sys.exit(2)
    except json.JSONDecodeError as exc:
        print(f"error: invalid JSON in {template_path}: {exc}", file=sys.stderr)
        sys.exit(2)

    required_keys = {"campaigns", "tiles", "namingPattern", "tileSize"}
    missing = required_keys - set(data.keys())
    if missing:
        print(f"error: template missing keys: {sorted(missing)}", file=sys.stderr)
        sys.exit(2)
    return data


def parse_tiles(tiles: List[Dict[str, Any]]) -> List[TileDef]:
    out: List[TileDef] = []
    for entry in tiles:
        out.append(
            TileDef(
                tile_id=int(entry["id"]),
                name=str(entry["name"]),
                layer=str(entry["layer"]),
                source=str(entry["source"]),
                palette_key=str(entry["paletteKey"]),
            )
        )
    return sorted(out, key=lambda t: t.tile_id)


def validate_name(name: str, naming_pattern: str) -> None:
    if not re.fullmatch(naming_pattern, name):
        raise ValueError(f"invalid tile filename `{name}` for naming pattern `{naming_pattern}`")


def generate_campaign(
    campaign: str,
    template: Dict[str, Any],
    source_dir: Path,
    output_dir: Path,
    dry_run: bool,
) -> int:
    campaigns = template["campaigns"]
    if campaign not in campaigns:
        print(f"error: campaign `{campaign}` not found. Available: {', '.join(sorted(campaigns.keys()))}", file=sys.stderr)
        return 2

    naming_pattern = template["namingPattern"]
    tile_size = int(template["tileSize"])
    palette = campaigns[campaign]
    tiles = parse_tiles(template["tiles"])

    campaign_out = output_dir / campaign
    manifest_path = campaign_out / "tileset.json"

    if not dry_run:
        campaign_out.mkdir(parents=True, exist_ok=True)

    manifest_tiles: List[Dict[str, Any]] = []
    generated = 0

    for tile in tiles:
        src_path = source_dir / tile.source
        target_name = f"{tile.name}.png"
        dst_path = campaign_out / target_name

        validate_name(target_name, naming_pattern)
        if not src_path.exists():
            print(f"error: missing source tile `{src_path}`", file=sys.stderr)
            return 2

        palette_value = palette.get(tile.palette_key)
        if not palette_value:
            print(
                f"error: missing palette key `{tile.palette_key}` for campaign `{campaign}` in template",
                file=sys.stderr,
            )
            return 2

        if not dry_run:
            source_img = Image.open(src_path)
            if source_img.size != (tile_size, tile_size):
                print(
                    f"warning: tile {tile.source} is {source_img.size}, expected {(tile_size, tile_size)}",
                    file=sys.stderr,
                )
            target_color = parse_hex_color(palette_value)
            recolored = recolor_tile(source_img, target_color)
            recolored.save(dst_path)

        manifest_tiles.append(
            {
                "id": tile.tile_id,
                "name": tile.name,
                "layer": tile.layer,
                "file": target_name,
                "source": tile.source,
                "paletteKey": tile.palette_key,
            }
        )
        generated += 1

    manifest = {
        "version": 1,
        "campaign": campaign,
        "generatedOn": date.today().isoformat(),
        "tileSize": tile_size,
        "source": str(source_dir),
        "tiles": manifest_tiles,
    }

    if not dry_run:
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"Generated {generated} tiles for {campaign} -> {campaign_out}")
    if dry_run:
        print("(dry-run: no files written)")
    else:
        print(f"Wrote manifest: {manifest_path}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate campaign tiles from alpha template")
    parser.add_argument("--campaign", required=True, help="Campaign id from template (e.g. coral_front)")
    parser.add_argument(
        "--template",
        default="1942/tools/generation/alpha-template.json",
        help="Template JSON file",
    )
    parser.add_argument(
        "--source-dir",
        default="1942/assets/tiles/alpha/clean",
        help="Directory containing source tile PNGs",
    )
    parser.add_argument(
        "--output-dir",
        default="1942/assets/tiles/generated",
        help="Root output directory for generated campaign tiles",
    )
    parser.add_argument("--dry-run", action="store_true", help="Validate and print summary without writing files")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    template_path = Path(args.template)
    source_dir = Path(args.source_dir)
    output_dir = Path(args.output_dir)

    if not source_dir.exists():
        print(f"error: source directory not found: {source_dir}", file=sys.stderr)
        return 2

    template = load_template(template_path)
    return generate_campaign(args.campaign, template, source_dir, output_dir, args.dry_run)


if __name__ == "__main__":
    raise SystemExit(main())

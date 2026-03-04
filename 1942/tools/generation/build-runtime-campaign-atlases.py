#!/usr/bin/env python3
"""Build runtime water/terrain atlases for authored campaigns.

Outputs PNG strips expected by runtime loader:
  assets/tiles/{campaign_id}/water.png   (4 tiles, 64x64 each)
  assets/tiles/{campaign_id}/terrain.png (5 tiles, 64x64 each)
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Dict, List

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Pillow is required (python3 -m pip install pillow)") from exc


REPO_1942 = Path(__file__).resolve().parents[2]

CAMPAIGNS: Dict[str, Dict[str, object]] = {
    "jungle_spear": {
        "source_dir": "assets/tiles/jungle-spear",
        "water": [
            "water-deep.png",
            "water-mid.png",
            "water-shallow.png",
            "water-foam.png",
        ],
        "terrain": [
            "terrain-sand.png",
            "terrain-grass.png",
            "terrain-rock.png",
            "terrain-structure.png",
            # Jungle Spear currently authors 4 terrain bases; reuse structure for frame 4.
            "terrain-structure.png",
        ],
    },
    "dust_convoy": {
        "source_dir": "assets/tiles/dust-convoy/clean",
        "water": [
            "water-deep.png",
            "water-mid.png",
            "water-shallow.png",
            "water-foam.png",
        ],
        "terrain": [
            "sand.png",
            "grass.png",
            "rock.png",
            "structure.png",
            "path.png",
        ],
    },
    "iron_monsoon": {
        "source_dir": "assets/tiles/iron-monsoon",
        "water": [
            "water-deep.png",
            "water-mid.png",
            "water-shallow.png",
            "water-foam.png",
        ],
        "terrain": [
            "terrain-platform.png",
            "terrain-deck.png",
            "terrain-steel.png",
            "terrain-structure.png",
            "terrain-path.png",
        ],
    },
}


def pack_strip(source_dir: Path, tile_files: List[str], out_path: Path) -> tuple[int, int]:
    images: List[Image.Image] = []
    for rel in tile_files:
        tile_path = source_dir / rel
        if not tile_path.exists():
            raise FileNotFoundError(f"missing source tile: {tile_path}")
        images.append(Image.open(tile_path).convert("RGBA"))

    tile_w, tile_h = images[0].size
    for img, rel in zip(images, tile_files):
        if img.size != (tile_w, tile_h):
            raise ValueError(f"tile size mismatch for {source_dir / rel}: {img.size} != {(tile_w, tile_h)}")

    atlas = Image.new("RGBA", (tile_w * len(images), tile_h), (0, 0, 0, 0))
    for i, img in enumerate(images):
        atlas.paste(img, (i * tile_w, 0), img)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(out_path, "PNG")
    return atlas.size


def build_campaign(campaign_id: str) -> None:
    config = CAMPAIGNS[campaign_id]
    source_dir = REPO_1942 / str(config["source_dir"])
    runtime_dir = REPO_1942 / "assets" / "tiles" / campaign_id

    water_size = pack_strip(source_dir, list(config["water"]), runtime_dir / "water.png")
    terrain_size = pack_strip(source_dir, list(config["terrain"]), runtime_dir / "terrain.png")

    water_bytes = (runtime_dir / "water.png").stat().st_size
    terrain_bytes = (runtime_dir / "terrain.png").stat().st_size

    print(
        f"{campaign_id}: water.png {water_size[0]}x{water_size[1]} ({water_bytes} bytes), "
        f"terrain.png {terrain_size[0]}x{terrain_size[1]} ({terrain_bytes} bytes)"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--campaign",
        action="append",
        dest="campaigns",
        choices=sorted(CAMPAIGNS.keys()),
        help="Campaign id to build (repeatable). Defaults to all supported campaigns.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    campaigns = args.campaigns or list(CAMPAIGNS.keys())
    for campaign_id in campaigns:
        build_campaign(campaign_id)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

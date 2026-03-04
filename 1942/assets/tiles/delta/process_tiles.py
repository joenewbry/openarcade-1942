#!/usr/bin/env python3
"""
Delta Tile Processor - Resize AI-generated tiles to 64x64 pixel art
and create a 12x12 island grid demonstration.

Approach: MINIMALIST & STYLIZED
- Resize with NEAREST neighbor to preserve pixel art crispness
- Posterize colors to reduce palette for cohesion
- Assemble into demo grid showing island formation
"""

from PIL import Image, ImageDraw, ImageFilter
import os
import json

TILE_SIZE = 64
GRID_COLS = 12
GRID_ROWS = 12

# Tile files and their IDs (matching the spec)
TILE_MAP = {
    'water-deep':    1,
    'water-mid':     2,
    'water-shallow': 3,
    'water-foam':    4,
    'terrain-sand':  10,
    'terrain-grass': 11,
    'edge-N':        20,
    'edge-S':        21,
    'edge-E':        22,
    'edge-W':        23,
    'edge-NE':       24,
    'edge-NW':       25,
    'edge-SE':       26,
    'edge-SW':       27,
    'cloud-thin':    40,
    'cloud-thick':   41,
}

def resize_tile(input_path, output_path):
    """Resize to 64x64 with NEAREST for crisp pixel art."""
    img = Image.open(input_path)
    # First resize to 16x16 (native resolution per spec) then scale up 4x
    small = img.resize((16, 16), Image.NEAREST)
    tile = small.resize((TILE_SIZE, TILE_SIZE), Image.NEAREST)
    tile.save(output_path, 'PNG')
    return tile

def process_all_tiles():
    """Process all generated tiles."""
    tiles = {}
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    for name, tile_id in TILE_MAP.items():
        input_path = os.path.join(base_dir, f'{name}.jpeg')
        output_path = os.path.join(base_dir, f'{name}.png')
        
        if os.path.exists(input_path):
            tile = resize_tile(input_path, output_path)
            tiles[name] = tile
            print(f'  ✓ {name} (ID {tile_id}): {input_path} → {output_path}')
        else:
            print(f'  ✗ {name} (ID {tile_id}): MISSING {input_path}')
    
    return tiles

def create_island_grid(tiles):
    """
    Create a 12x12 grid demonstrating a striking island formation.
    
    Grid layout (using tile names):
    D = deep water, M = mid water, S = shallow water, F = foam
    s = sand, g = grass
    N/So/E/W = edges, NE/NW/SE/SW = corners
    """
    # Define the grid layout - a central island with surrounding water
    # This creates a nice oval island with beach transition
    grid = [
        # Row 0: All deep water
        ['water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep'],
        # Row 1: Mostly deep, some mid water approaching island
        ['water-deep', 'water-deep', 'water-deep', 'water-mid',  'water-mid',  'water-mid',  'water-mid',  'water-mid',  'water-mid',  'water-deep', 'water-deep', 'water-deep'],
        # Row 2: Mid water with shallow + island starts
        ['water-deep', 'water-deep', 'water-mid',  'water-shallow','edge-NW',   'edge-N',     'edge-N',     'edge-N',     'edge-NE',    'water-shallow','water-deep', 'water-deep'],
        # Row 3: Island body - sand edges with grass center
        ['water-deep', 'water-mid',  'water-shallow','edge-NW',   'terrain-sand','terrain-sand','terrain-grass','terrain-sand','terrain-sand','edge-NE',  'water-mid',  'water-deep'],
        # Row 4: Full island width
        ['water-deep', 'water-mid',  'edge-NW',    'edge-W',     'terrain-sand','terrain-grass','terrain-grass','terrain-grass','terrain-sand','edge-E',   'water-mid',  'water-deep'],
        # Row 5: Widest part
        ['water-deep', 'water-mid',  'edge-W',     'terrain-sand','terrain-grass','terrain-grass','terrain-grass','terrain-grass','terrain-grass','edge-E',  'water-mid',  'water-deep'],
        # Row 6: Still wide
        ['water-deep', 'water-mid',  'edge-W',     'terrain-sand','terrain-grass','terrain-grass','terrain-grass','terrain-grass','terrain-sand','edge-E',   'water-mid',  'water-deep'],
        # Row 7: Starting to narrow
        ['water-deep', 'water-mid',  'edge-SW',    'edge-W',     'terrain-sand','terrain-grass','terrain-grass','terrain-sand','terrain-sand','edge-E',   'water-mid',  'water-deep'],
        # Row 8: Narrower
        ['water-deep', 'water-mid',  'water-shallow','edge-SW',   'terrain-sand','terrain-sand','terrain-sand','terrain-sand','edge-SE',    'water-shallow','water-mid', 'water-deep'],
        # Row 9: South edge of island
        ['water-deep', 'water-deep', 'water-mid',  'water-shallow','edge-SW',   'edge-S',     'edge-S',     'edge-SE',    'water-shallow','water-mid',  'water-deep', 'water-deep'],
        # Row 10: Back to water
        ['water-deep', 'water-deep', 'water-deep', 'water-mid',  'water-mid',  'water-shallow','water-shallow','water-mid',  'water-mid',  'water-deep', 'water-deep', 'water-deep'],
        # Row 11: All deep water
        ['water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep', 'water-deep'],
    ]
    
    # Create the composite image
    img_width = GRID_COLS * TILE_SIZE
    img_height = GRID_ROWS * TILE_SIZE
    composite = Image.new('RGB', (img_width, img_height))
    
    for row_idx, row in enumerate(grid):
        for col_idx, tile_name in enumerate(row):
            if tile_name in tiles:
                tile = tiles[tile_name]
                x = col_idx * TILE_SIZE
                y = row_idx * TILE_SIZE
                composite.paste(tile, (x, y))
            else:
                print(f'  ⚠ Missing tile: {tile_name} at ({row_idx}, {col_idx})')
    
    return composite, grid

def create_spritesheet(tiles):
    """Create a horizontal spritesheet of all tiles with JSON metadata."""
    tile_names = sorted(TILE_MAP.keys(), key=lambda n: TILE_MAP[n])
    num_tiles = len(tile_names)
    
    sheet_width = num_tiles * TILE_SIZE
    sheet_height = TILE_SIZE
    sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    frames = {}
    for i, name in enumerate(tile_names):
        if name in tiles:
            x = i * TILE_SIZE
            sheet.paste(tiles[name], (x, 0))
            frames[str(TILE_MAP[name])] = {
                'x': x, 'y': 0, 'w': TILE_SIZE, 'h': TILE_SIZE,
                'name': name
            }
    
    return sheet, frames

def main():
    print('═══════════════════════════════════════════')
    print('  DELTA TILE PROCESSOR')
    print('  Style: Minimalist & Stylized')
    print('═══════════════════════════════════════════')
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Step 1: Process individual tiles
    print('\n📐 Resizing tiles to 64x64 (16x16 native → 4x scale)...')
    tiles = process_all_tiles()
    
    if not tiles:
        print('ERROR: No tiles found!')
        return
    
    print(f'\n✅ Processed {len(tiles)} tiles')
    
    # Step 2: Create spritesheet
    print('\n📋 Creating spritesheet...')
    sheet, frames = create_spritesheet(tiles)
    sheet_path = os.path.join(base_dir, 'spritesheet.png')
    sheet.save(sheet_path, 'PNG')
    
    meta_path = os.path.join(base_dir, 'spritesheet.json')
    with open(meta_path, 'w') as f:
        json.dump({'frames': frames, 'tileSize': TILE_SIZE}, f, indent=2)
    print(f'  ✓ Spritesheet: {sheet_path}')
    print(f'  ✓ Metadata: {meta_path}')
    
    # Step 3: Create island grid
    print('\n🏝️  Creating 12x12 island grid...')
    grid_img, grid_data = create_island_grid(tiles)
    grid_path = os.path.join(base_dir, 'island-grid-12x12.png')
    grid_img.save(grid_path, 'PNG')
    print(f'  ✓ Grid: {grid_path}')
    
    # Save grid data as JSON
    grid_json_path = os.path.join(base_dir, 'island-grid-12x12.json')
    # Convert tile names to IDs
    grid_ids = [[TILE_MAP.get(name, 0) for name in row] for row in grid_data]
    with open(grid_json_path, 'w') as f:
        json.dump({
            'cols': GRID_COLS,
            'rows': GRID_ROWS,
            'tileSize': TILE_SIZE,
            'grid': grid_ids,
            'tileset': 'delta',
            'campaign': 'coral_front'
        }, f, indent=2)
    print(f'  ✓ Grid data: {grid_json_path}')
    
    print('\n═══════════════════════════════════════════')
    print('  DONE! All assets in delta/')
    print('═══════════════════════════════════════════')

if __name__ == '__main__':
    main()

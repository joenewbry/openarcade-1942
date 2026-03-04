export const WaterTile = {
  DEEP: 0,
  SHALLOW: 1,
  DARK: 2,
  FOAM: 3,
};

export const TerrainTile = {
  EMPTY: 0,
  SAND: 1,
  GRASS: 2,
  ROCK: 3,
  STRUCTURE: 4,
};

export const CloudTile = {
  EMPTY: 0,
  THIN: 1,
  THICK: 2,
  STORM: 3,
};

// Export a combined map for convenience
export const TileDefs = {
  water: WaterTile,
  terrain: TerrainTile,
  cloud: CloudTile,
};

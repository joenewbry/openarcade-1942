// Simple level schema validator (placeholder). Export a function that checks required fields.
export function validateLevel(level) {
  if (!level) return false;
  const required = ['campaignId', 'cols', 'rows', 'tileSize', 'waterLayer', 'terrainLayer', 'cloudLayer'];
  for (const key of required) {
    if (!(key in level)) return false;
  }
  // Further validation can be added later.
  return true;
}

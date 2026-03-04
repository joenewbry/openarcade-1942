import { generateTilemap } from '../content/tilemap.js';
import { CAMPAIGN_MAP_ROWS } from '../content/tilemap.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const levelsDir = join(__dirname, '..', 'levels');

for (const [campaignId, rows] of Object.entries(CAMPAIGN_MAP_ROWS)) {
  const tilemap = generateTilemap(campaignId, rows);
  const json = JSON.stringify(tilemap, null, 2);
  const outPath = join(levelsDir, `${campaignId}.json`);
  writeFileSync(outPath, json);
  console.log(`Exported level ${campaignId} to ${outPath}`);
}

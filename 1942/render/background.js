import {
  getCampaignTilemap,
  drawTilemapLayer,
  drawGroundEnemies,
  getTilePalette,
  CAMPAIGN_MAP_ROWS,
  TILE_SIZE,
  drawWaveEffects,
} from '../content/tilemap.js';

// ── ARCADE-073: Tilemap-based Background System ──
// Pre-generated tilemaps are cached per campaign.
const _tilemapCache = {};

export function getOrCreateTilemap(campaignId) {
  if (!_tilemapCache[campaignId]) {
    const rows = CAMPAIGN_MAP_ROWS[campaignId] || 120;
    _tilemapCache[campaignId] = getCampaignTilemap(campaignId, rows);
  }
  return _tilemapCache[campaignId];
}

export function drawBackground(renderer, campaign, flashTimer, tick, width = 960, height = 1280) {
  const tilemap = getOrCreateTilemap(campaign.id);
  const palette = getTilePalette(campaign.id);
  const totalMapH = tilemap.rows * TILE_SIZE;

  // ── ARCADE-074: Multi-layer parallax with different scroll speeds ──
  // Layer 0: Water — slow scroll (0.2 px/frame)
  const waterScrollY = (tick * 0.2) % totalMapH;
  drawTilemapLayer(renderer, tilemap, 'waterLayer', palette, waterScrollY, 1, tick);

  // Layer 1: Terrain — medium scroll (0.5 px/frame)
  const terrainScrollY = (tick * 0.5) % totalMapH;
  drawTilemapLayer(renderer, tilemap, 'terrainLayer', palette, terrainScrollY, 1, tick);

  // Layer 2: Clouds — faster than terrain for closer parallax.
  const cloudScrollY = (tick * 0.8) % totalMapH;
  drawTilemapLayer(renderer, tilemap, 'cloudLayer', palette, cloudScrollY, 0.85, tick);

  // Draw ground enemies (bunkers, ships) attached to terrain scroll
  drawGroundEnemies(renderer, null, tilemap, palette, terrainScrollY, tick);

  // ── Z-index 400: Wave Effects ──
  // Draw boat wave animations ON TOP of water tiles but BEHIND boat sprites
  drawWaveEffects(renderer, tilemap, terrainScrollY);

  // Layer 2: Enhanced geometric shadow layer — cloud shadows with clean patterns
  const shadowH = 1000;
  const shadowOffset = (tick * 0.8) % shadowH;

  // Main cloud shadows - geometric shapes
  for (let s = 0; s < 3; s++) {
    const baseX = s * 320 + Math.sin(tick * 0.008 + s) * 60;
    const baseY = s * shadowH / 3 + shadowOffset - shadowH;
    const alpha = 0.08 + Math.sin(tick * 0.004 + s * 2) * 0.03;

    // Geometric cloud shadow - stepped hexagonal shape
    drawGeometricShadow(renderer, baseX, baseY, 180 + s * 40, alpha, s);
  }

  // Secondary atmospheric shadows - thinner, faster
  for (let s = 0; s < 2; s++) {
    const fx = 100 + s * 400 + Math.sin(tick * 0.015 + s * 3) * 80;
    const fy = s * shadowH / 2 + shadowOffset * 1.3 - shadowH;
    const alpha = 0.04 + Math.sin(tick * 0.01 + s * 1.5) * 0.02;

    // Thin geometric wisps
    drawGeometricWisp(renderer, fx, fy, 250, alpha);
  }

  if (flashTimer > 0) {
    renderer.fillRect(0, 0, width, height, `rgba(240,248,255,${(flashTimer / 7).toFixed(2)})`);
  }
}

function drawGeometricShadow(renderer, x, y, size, alpha, shapeIndex) {
  switch (shapeIndex % 3) {
    case 0: {
      // Stepped hexagonal cloud
      const steps = 4;
      const stepW = size / steps;
      const stepH = 20;
      for (let i = 0; i < steps; i++) {
        const stepAlpha = alpha * (0.7 + i * 0.1);
        const sw = stepW * (1 + Math.sin(i * 0.8) * 0.3);
        renderer.fillRect(
          x + i * stepW + Math.sin(i) * 10,
          y + i * 6,
          sw,
          stepH + i * 8,
          `rgba(0,0,0,${stepAlpha.toFixed(3)})`,
        );
      }
      break;
    }

    case 1: {
      // Angular diamond pattern
      const centerX = x + size / 2;
      const centerY = y + 40;
      for (let ring = 0; ring < 3; ring++) {
        const ringSize = 30 + ring * 25;
        const ringAlpha = alpha * (1 - ring * 0.25);
        renderer.fillPoly([
          { x: centerX, y: centerY - ringSize },
          { x: centerX + ringSize * 0.6, y: centerY },
          { x: centerX, y: centerY + ringSize },
          { x: centerX - ringSize * 0.6, y: centerY },
        ], `rgba(0,0,0,${ringAlpha.toFixed(3)})`);
      }
      break;
    }

    case 2: {
      // Rectangular strip formation
      const strips = 5;
      const stripW = size / strips;
      for (let s = 0; s < strips; s++) {
        const stripAlpha = alpha * (0.8 + Math.sin(s * 1.2) * 0.2);
        const stripH = 25 + s * 8;
        renderer.fillRect(
          x + s * stripW + s * 5,
          y + Math.sin(s * 0.6) * 15,
          stripW - 3,
          stripH,
          `rgba(0,0,0,${stripAlpha.toFixed(3)})`,
        );
      }
      break;
    }
  }
}

function drawGeometricWisp(renderer, x, y, length, alpha) {
  const segments = 6;
  const segmentW = length / segments;

  for (let i = 0; i < segments; i++) {
    const segAlpha = alpha * (1 - i * 0.1) * (0.7 + Math.sin(i * 1.5) * 0.3);
    const segH = 8 + Math.sin(i * 0.8) * 6;
    const segY = y + Math.sin(i * 0.4) * 20;

    renderer.fillRect(
      x + i * segmentW,
      segY,
      segmentW - 2,
      segH,
      `rgba(0,0,0,${segAlpha.toFixed(3)})`,
    );

    // Add geometric accent lines
    if (i % 2 === 0) {
      renderer.fillRect(
        x + i * segmentW,
        segY - 3,
        segmentW * 0.3,
        2,
        `rgba(0,0,0,${(segAlpha * 0.5).toFixed(3)})`,
      );
    }
  }
}

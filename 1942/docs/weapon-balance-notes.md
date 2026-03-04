# Weapon + Hitbox Balance Notes (T016 Final Pass)

Date: 2026-03-04
File: `1942/game.js`

This pass intentionally keeps changes conservative and value-driven (constants first, minimal logic churn).

## Weapon tuning (before → after)

| Area | Before | After |
|---|---:|---:|
| Spread angles | `[-0.35, -0.17, 0, 0.17, 0.35]` | `[-0.30, -0.15, 0, 0.15, 0.30]` |
| Spread lateral speed factor (`vx = sin(angle) * factor`) | `8.0` | `7.6` |
| Laser pierce per beam | `5` | `4` |
| Homing initial side velocity (`vx`) | `±3.0` | `±2.4` |
| Homing initial forward factor (`vy = speed * factor`) | `0.70` | `0.76` |

### Weapon intent
- **Spread:** Slightly tighter fan and reduced side velocity to lower screen-wide coverage.
- **Laser:** Small pierce reduction to trim sustained multi-target dominance.
- **Homing:** Reduced sideways launch drift and slightly stronger forward drive for steadier target acquisition.

## Hitbox tuning (before → after)

| Area | Before | After |
|---|---:|---:|
| Player collision width scale | `1.00` (full sprite width) | `0.80` |
| Player collision height scale | `1.00` (full sprite height) | `0.76` |
| Player collision Y offset | `0` | `+4` px |
| Focus ring radius | `6` | `7` |

### Hitbox application updates
Player hitbox tuning now drives:
- Enemy bullet damage collision (`rectHit(enemyBullet, playerHitbox)`)
- Enemy body/contact damage collision (`rectHit(enemy, playerHitbox)`)
- Graze center + collision exclusion check
- Focus-mode hitbox marker placement (center derived from tuned player hitbox)

## Constants introduced
- `WEAPON_TUNING`
- `HITBOX_TUNING`
- `centeredHitbox(entity, widthScale, heightScale, yOffset)`
- `playerHitbox(player)`

# 1942 Live Smoke Report (GitHub Pages)

- **Target:** https://joenewbry.github.io/openarcade-1942/1942/
- **Run date/time (PT):** 2026-03-03 22:58
- **QA:** PM-Gamma / QA-1
- **Scope:** Lightweight live smoke (HTTP reachability, key asset loads, basic title/DOM checks)

## Summary

**Overall:** ❌ **FAIL** (blocking asset issue)

Core page and JS entry assets are reachable, and expected DOM/title checks pass. However, the sprite preload set is largely unavailable on live build (24/27 sprite PNGs requested by `1942/game.js` return 404), generating runtime resource errors.

## PASS/FAIL Checks

| Area | Check | Result | Evidence |
|---|---|---|---|
| Reachability | `GET /openarcade-1942/` | PASS | HTTP 200 |
| Reachability | `GET /openarcade-1942/1942/` | PASS | HTTP 200, payload ~2338 bytes |
| Title/DOM | Document title is `1942` | PASS | Browser evaluate: `title: "1942"` |
| Title/DOM | Canvas element exists (`#game`) | PASS | Browser evaluate: `hasCanvas: true` |
| Title/DOM | Overlay and HUD nodes exist (`#overlay`, `#score/#lives/#best`) | PASS | Browser evaluate: present; values `0/3/0` |
| Key JS asset | `/1942/game.js` | PASS | HTTP 200 (`application/javascript`) |
| Key JS asset | `/engine/core.js` | PASS | HTTP 200 (`application/javascript`) |
| Key JS asset | `/1942/content/planes.js` | PASS | HTTP 200 (`application/javascript`) |
| Sprite assets (preload list) | Preloaded sprite PNGs from `SPRITE_IMAGE_FILES` | **FAIL** | 27 checked; **3 OK**, **24 return 404** |
| Console health | Runtime resource errors | **FAIL** | Browser console shows repeated `Failed to load resource: 404` for sprite URLs |

## Blockers

1. **Sprite asset pack missing on live site**
   - `1942/game.js` preloads 27 sprite files from `1942/assets/sprites/*.png`.
   - Live check results: only `turret-small`, `turret-cannon`, `turret-destroyed` resolve; remaining 24 sprite files return 404.
   - Example missing files:
     - `specter-idle.png`
     - `atlas-idle.png`
     - `enemy-scout.png`
     - `boss-coral.png`
     - `powerup-shot.png`
     - `enemy-bullet.png`

## Notes

- Existing sprite files such as `turret-small.png` and `manifest.json` are reachable (HTTP 200), indicating partial asset publish rather than full path outage.
- Game may still render via fallbacks, but live build currently emits significant asset 404s and does not have the expected sprite set fully available.

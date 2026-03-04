# 1942 Cross-Browser Release Gate (Live Build)

- **Target URL:** https://joenewbry.github.io/openarcade-1942/1942/
- **Run date/time (PT):** 2026-03-04 01:25
- **Browsers covered:** Chromium, WebKit (Playwright)
- **Artifacts:** `1942/docs/qa-artifacts/2026-03-04-qa-gate/`

## Gate Summary

**Overall gate result:** ✅ **PASS**

Both required browsers passed the minimum live gate checks:
- Page load returned HTTP 200
- Title was `1942`
- SPACE key started gameplay (overlay hidden)
- HUD (`Score`, `Lives`) visible before and after start
- Console error capture completed (no console/page/network errors captured during run)

## Per-Browser Results

| Browser | Result | Page Load | Title | Start Input (SPACE) | HUD Visible | Console Errors |
|---|---|---:|---|---|---|---|
| Chromium | ✅ PASS | 200 | `1942` | PASS (`overlayDisplayAfterSpace: none`) | PASS (`score=0`, `lives=3`) | 0 |
| WebKit | ✅ PASS | 200 | `1942` | PASS (`overlayDisplayAfterSpace: none`) | PASS (`score=0`, `lives=3`) | 0 |

## Evidence Snippets

From `qa-artifacts/2026-03-04-qa-gate/results.json`:

```json
{
  "browser": "Chromium",
  "checks": {
    "pageLoad200": { "status": 200, "pass": true },
    "title": { "value": "1942", "pass": true },
    "startGameKeyInput": { "overlayDisplayAfterSpace": "none", "pass": true },
    "hudVisible": { "scoreText": "0", "livesText": "3", "pass": true }
  },
  "consoleErrors": [],
  "pageErrors": [],
  "httpErrors": []
}
```

```json
{
  "browser": "WebKit",
  "checks": {
    "pageLoad200": { "status": 200, "pass": true },
    "title": { "value": "1942", "pass": true },
    "startGameKeyInput": { "overlayDisplayAfterSpace": "none", "pass": true },
    "hudVisible": { "scoreText": "0", "livesText": "3", "pass": true }
  },
  "consoleErrors": [],
  "pageErrors": [],
  "httpErrors": []
}
```

Screenshot evidence:
- Chromium before start: `qa-artifacts/2026-03-04-qa-gate/chromium-before-space.png`
- Chromium after SPACE: `qa-artifacts/2026-03-04-qa-gate/chromium-after-space.png`
- WebKit before start: `qa-artifacts/2026-03-04-qa-gate/webkit-before-space.png`
- WebKit after SPACE: `qa-artifacts/2026-03-04-qa-gate/webkit-after-space.png`

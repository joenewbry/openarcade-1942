# 1942 Regression Checklist (Release Gate)

_Last updated: 2026-03-03 (PM-Gamma / QA-2)_

## Run Metadata (Tonight)
- Build / Commit: `________________`
- Tester: `________________`
- Environment (OS + browser): `________________`
- Start time: `________________`
- End time: `________________`

## Status Legend
- `NOT_RUN` = not executed yet
- `PASS` = executed and behavior matches expected
- `FAIL` = executed and behavior did not match expected

## Notes Template (use in Notes column)
`Steps:` …  
`Expected:` …  
`Actual:` …  
`Evidence:` screenshot/video/log link  
`Bug:` ticket/link or `N/A`

---

## Controls

| ID | Regression item | Status | Notes |
|---|---|---|---|
| CTRL-01 | Plane select screen: `ArrowLeft/ArrowRight` and `1/2` switch plane cards correctly. | NOT_RUN | |
| CTRL-02 | Plane select launch: `Space` starts run with selected plane. | NOT_RUN | |
| CTRL-03 | In-mission movement: arrow keys move player on both axes and clamp to playfield bounds. | NOT_RUN | |
| CTRL-04 | Primary fire: holding `Space` fires continuously at expected cadence; release stops firing. | NOT_RUN | |
| CTRL-05 | Roll input: `Shift` and double-tap `Space` both trigger roll, consume 1 roll stock, grant i-frames. | NOT_RUN | |
| CTRL-06 | Roll stock regen: depleted stock regenerates over time (target: ~600 frames per stock). | NOT_RUN | |
| CTRL-07 | Focus mode: holding `F` or `Z` reduces movement speed and keeps control responsive. | NOT_RUN | |
| CTRL-08 | Special input: `X` activates current plane special and starts cooldown lockout. | NOT_RUN | |
| CTRL-09 | Bomb input: `B` consumes bomb stock and executes bomb effect; no activation at 0 bombs. | NOT_RUN | |
| CTRL-10 | Auto-bomb toggle: `A` toggles AUTO state and HUD indicator behavior (`AUTO` shown/hidden). | NOT_RUN | |

## Combat

| ID | Regression item | Status | Notes |
|---|---|---|---|
| COM-01 | Player shots damage enemies, produce hit feedback, and award score on kill. | NOT_RUN | |
| COM-02 | Wave-clear bonus applies (`+500` normal / `+1000` perfect no-hit wave). | NOT_RUN | |
| COM-03 | Chain/scoring behavior is stable through normal kills and resets appropriately after bombing. | NOT_RUN | |
| COM-04 | Graze detection awards graze score near bullets without collision; focus mode bonus applies. | NOT_RUN | |
| COM-05 | Player damage flow: hit removes life when unprotected, triggers invulnerability window, prevents rapid double-hit. | NOT_RUN | |
| COM-06 | Bomb clears on-screen enemy bullets and damages/finishes enemies per bomb rules. | NOT_RUN | |
| COM-07 | Specter special (`Phase Shield`) grants temporary protection as designed. | NOT_RUN | |
| COM-08 | Atlas special (`EMP Wave`) stuns nearby enemies, chips HP, and clears nearby bullets. | NOT_RUN | |

## Enemies

| ID | Regression item | Status | Notes |
|---|---|---|---|
| ENM-01 | Normal waves spawn from campaign table and progress sequentially without skipped/duplicated waves. | NOT_RUN | |
| ENM-02 | Movement patterns execute correctly (`line`, `formation`, `vee`, `stagger`, `cross`, `swirl`, `figure8`, `dive`). | NOT_RUN | |
| ENM-03 | Enemy firing families behave distinctly (fighters aimed/straight, gunship bursts, bomber/sub heavy shots). | NOT_RUN | |
| ENM-04 | Ground enemies/turrets spawn from tilemap slots as terrain scrolls into view and despawn cleanly off-screen. | NOT_RUN | |
| ENM-05 | Mini-boss schedule validates per campaign (including Jungle Spear double-mini and Dust Convoy no-mini behavior). | NOT_RUN | |
| ENM-06 | Final boss spawns on wave 20 for each campaign and transition logic remains stable. | NOT_RUN | |

## Powerups

| ID | Regression item | Status | Notes |
|---|---|---|---|
| PWR-01 | Normal enemy drops appear at expected chance and pickups are collectible without collision anomalies. | NOT_RUN | |
| PWR-02 | Mini-boss defeat drops designated pickup + random bonus drops. | NOT_RUN | |
| PWR-03 | Final boss defeat drops designated pickup + extra random drops. | NOT_RUN | |
| PWR-04 | Timer stacking works for `Double Shot`, `Speed Boost`, and `Shield` (duration adds, not replaces). | NOT_RUN | |
| PWR-05 | `Repair` increases life but respects max-life cap. | NOT_RUN | |
| PWR-06 | `Bomb Pack` increases bombs and respects max-bomb cap. | NOT_RUN | |
| PWR-07 | Weapon pickups (`Spread Shot`, `Laser`, `Homing`) switch weapon mode and revert to normal on timer expiry. | NOT_RUN | |

## Boss Flow

| ID | Regression item | Status | Notes |
|---|---|---|---|
| BOS-01 | Boss warning phase triggers before boss waves with correct pacing (mini ~210f, final ~300f). | NOT_RUN | |
| BOS-02 | Final warning text presentation includes `DANGER` + `BOSS APPROACHING` behavior for finals. | NOT_RUN | |
| BOS-03 | Boss phase/hit-zone behavior transitions correctly as zones are destroyed. | NOT_RUN | |
| BOS-04 | Boss death sequence triggers slowdown/shake/FX and score/drops without soft lock. | NOT_RUN | |
| BOS-05 | After final boss kill, campaign transition/debrief starts cleanly with battlefield state reset. | NOT_RUN | |

## Debrief Flow

| ID | Regression item | Status | Notes |
|---|---|---|---|
| DBR-01 | Debrief screen appears between campaigns with expected title, campaign name, and stat fields. | NOT_RUN | |
| DBR-02 | Debrief timer holds gameplay pause for full duration unless skip condition is met. | NOT_RUN | |
| DBR-03 | `Space` skip works only after initial lock window and proceeds to next campaign intro. | NOT_RUN | |
| DBR-04 | Story text appears and wraps legibly; no overlap/cutoff at common resolutions. | NOT_RUN | |
| DBR-05 | Final campaign completion exits to victory overlay and supports restart via `Space`. | NOT_RUN | |

## Editor Basics

| ID | Regression item | Status | Notes |
|---|---|---|---|
| EDT-01 | Editor loads and renders fixed grid (`15x150`, tile size `64`) without layout errors. | NOT_RUN | |
| EDT-02 | Campaign switching loads tile assets (including alias/fallback handling) and repaints map. | NOT_RUN | |
| EDT-03 | Layer controls (visibility/opacity for `water/terrain/clouds/entities`) work as expected. | NOT_RUN | |
| EDT-04 | Core tools (`paint`, `fill`, `eraser`, `selection`, `rectangle`, `line`, `stamp`, `entity`) operate correctly. | NOT_RUN | |
| EDT-05 | Undo/redo stack is stable across mixed actions (paint/fill/entity/auto-tile interactions). | NOT_RUN | |
| EDT-06 | Save/load/export JSON round-trip preserves map content and schema compatibility. | NOT_RUN | |
| EDT-07 | Auto-tiling IDs `20-31` resolve deterministic edges/corners and honor manual edge overrides. | NOT_RUN | |
| EDT-08 | Keyboard shortcuts from README (`B/E/G/R/L/S/N/V`, `Ctrl+Z/Y/S`, etc.) function correctly. | NOT_RUN | |

## Known Risks

| ID | Risk item to monitor in tonight run | Status | Notes |
|---|---|---|---|
| RSK-01 | Wave/combat/stage tuning is actively in flux (see active tasks T015/T016/T017), so baseline behavior may drift late. | NOT_RUN | |
| RSK-02 | Several entities currently reuse fallback sprite mappings (enemy + power-up aliases), risking visual misidentification in fast play. | NOT_RUN | |
| RSK-03 | Editor tile loading uses fallback rendering paths; missing campaign assets can be masked unless validated explicitly. | NOT_RUN | |
| RSK-04 | Auto-tiling is hook-based with documented edge-case limits; complex shorelines may produce approximated edges. | NOT_RUN | |
| RSK-05 | Input overlap risk: `Space` handles both firing and double-tap roll trigger, which can cause accidental rolls under stress. | NOT_RUN | |

---

### Execution Summary (fill after run)
- Total cases: `____`
- Passed: `____`
- Failed: `____`
- Not run: `____`
- Gate decision: `GO / NO-GO`
- Blocking defects: `________________`

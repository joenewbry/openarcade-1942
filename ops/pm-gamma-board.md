# PM-Gamma Kickoff Board (QA + Release)

## Scope
Web launch readiness for **1942** hosted at:
- Primary URL: https://joenewbry.github.io/openarcade-1942/1942/

---

## 1) Release Checklist

### Pre-Release (T-3 to T-1)
- [ ] Confirm build artifacts are committed and deterministic from current `main` HEAD.
- [ ] Verify game launch URL loads without console errors that block play.
- [ ] Validate controls work on desktop keyboard (required) and gamepad (if supported).
- [ ] Run smoke test suite (see Regression Plan) on latest Chrome, Safari, Firefox.
- [ ] Confirm mobile browser sanity check (iOS Safari + Android Chrome) for load/playability.
- [ ] Confirm no broken asset references (404/failed fetch) in network panel.
- [ ] Validate audio can be enabled after user interaction and does not hard-fail game flow.
- [ ] Confirm pause/restart/game-over loops behave consistently.
- [ ] Accessibility spot-check: focus state visible, input responsive, no keyboard trap.
- [ ] Performance baseline captured (FPS stability + no runaway memory growth in 10-min run).

### Release Day (T-0)
- [ ] Re-run URL checkpoints (Section 5) on production URL.
- [ ] Re-run smoke suite on one primary browser (Chrome stable) + one secondary browser.
- [ ] Confirm GitHub Pages deploy corresponds to intended commit/tag.
- [ ] Confirm no Sev-1/Sev-2 open defects for launch gate.
- [ ] Publish release note stub with known issues/workarounds.
- [ ] Record go/no-go decision and approvers in this board.

### Post-Release (T+0 to T+2)
- [ ] Monitor browser console and user reports for first 24h.
- [ ] Triage defects by severity; hotfix if gameplay-blocking.
- [ ] Confirm analytics/error tracking (if any) shows expected startup success rate.
- [ ] Schedule first patch window and regression rerun.

---

## 2) QA Matrix

| Area | Test Focus | Browser/Device Coverage | Owner | Exit Criteria |
|---|---|---|---|---|
| Boot/Load | Initial load, asset fetch, title/start screen | Chrome (Win/macOS), Safari (macOS/iOS), Firefox (Win/macOS), Android Chrome | QA | Loads to playable state in <10s on broadband, no blocking errors |
| Core Gameplay | Movement, shooting, enemy spawns, collisions, scoring | Desktop (keyboard) + mobile sanity | QA | 3 consecutive runs without gameplay lockups |
| State Loops | Pause/resume, death/retry, new run reset | Chrome + Safari | QA | State resets cleanly; no stale HUD/state leakage |
| Input | Key mappings, key rollover, lost focus/re-focus | Chrome + Firefox | QA | Input remains responsive after tab blur/focus |
| Audio | SFX/music start after user gesture, mute/unmute | Chrome + Safari | QA | No hard failures when audio unavailable/blocked |
| Performance | FPS stability and memory over 10 minutes | Chrome desktop, Safari desktop | QA | No severe frame degradation; no runaway memory trend |
| Responsiveness | Canvas scaling/layout in common viewport sizes | 1366x768, 1920x1080, iPhone viewport, Android viewport | QA | UI remains usable; gameplay area not clipped |
| Error Handling | Offline/throttled network behavior after initial load | Chrome DevTools network throttling | QA | Graceful handling; no unrecoverable JS crash loop |

Severity Definitions:
- **Sev-1**: Launch blocker (cannot start/play, blank screen, hard crash)
- **Sev-2**: Major impairment (core mechanic broken, frequent lockups)
- **Sev-3**: Minor issue/workaround exists (visual glitches, non-critical UX)
- **Sev-4**: Cosmetic/nice-to-have

---

## 3) Regression Plan

### Smoke Suite (must pass every release)
1. Open production URL and reach playable state.
2. Start game, verify player movement and firing.
3. Complete at least 2 minutes of active play (spawn/collision/score updates observed).
4. Lose a run, trigger restart, verify clean reset.
5. Pause/resume (or equivalent) without state corruption.
6. Reload page and repeat start flow.
7. Confirm no new blocking console errors.

### Full Regression (pre-major release / after significant gameplay changes)
- All smoke tests + extended scenarios:
  - Long-run stability (10+ minutes continuous play)
  - Multi-resolution pass
  - Cross-browser pass (Chrome/Safari/Firefox)
  - Input edge cases (held keys, rapid direction changes, focus changes)
  - Audio on/off and autoplay policy handling

### Cadence
- **Every deploy candidate**: Smoke Suite
- **Weekly while active development**: Cross-browser smoke
- **Before tagged public release**: Full Regression

### Defect Workflow
- Log issue with: repro steps, expected vs actual, browser/device, console snippet, screenshot/video.
- Triage SLA:
  - Sev-1: immediate, fix before release
  - Sev-2: same-day disposition; release only with explicit waiver
  - Sev-3/4: backlog unless clustered risk suggests escalation

---

## 4) Go / No-Go Criteria (Web Launch)

### GO requires all of:
- [ ] Smoke Suite passes on production URL.
- [ ] No open Sev-1 defects.
- [ ] No open Sev-2 defects **without** explicit documented waiver.
- [ ] Cross-browser minimum pass: Chrome + one of (Safari/Firefox).
- [ ] Restart loop and core gameplay verified stable.
- [ ] Deployment commit confirmed and reproducible.

### NO-GO triggers (any one)
- [ ] Blank screen / startup failure at production URL.
- [ ] Core input or shooting/movement failure.
- [ ] Reproducible crash/lock in normal play.
- [ ] Critical asset loading failures affecting playability.
- [ ] Untriaged high-severity regression discovered on release day.

### Decision Log
- Decision: **PENDING**
- Date/Time (PT): **TBD**
- Approvers: **PM-Gamma + Engineering Lead (TBD)**
- Notes: **TBD**

---

## 5) URL Checkpoints (Production)

Primary checkpoint URL:
- https://joenewbry.github.io/openarcade-1942/1942/

Checkpoint list:
1. **CP-01 Reachability**: URL returns and renders page content (no 404/blank page).
2. **CP-02 Boot Integrity**: Game shell initializes; no blocking JS error in console.
3. **CP-03 Start-to-Play**: User can start game and enter active gameplay.
4. **CP-04 Asset Health**: No critical asset/network failures (sprites/audio/scripts).
5. **CP-05 Core Loop**: Play → death/game over → restart works.
6. **CP-06 Reload Stability**: Browser refresh retains ability to start and play.
7. **CP-07 Cross-Browser Spot Check**: Repeat CP-01 to CP-03 in one secondary browser.

---

## Status Snapshot
- Board Created: ✅
- QA Execution: ⏳ Pending
- Release Decision: ⏳ Pending

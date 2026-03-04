# Stage Flow Validation — T017 Final Pass

## Scope
Validate stage progression and campaign transition reliability for:
- normal wave sequencing
- boss warning handoff
- final-boss campaign advance
- transition/debrief gating
- campaign lookup hardening

## Preflight
- [ ] `node --check 1942/game.js`
- [ ] `node --check 1942/content/campaigns.js`

## Runtime Checklist (Executable)

> Run the game locally and execute each case in order. Mark PASS/FAIL with notes.

### SF-01 — Normal wave progression remains sequential
**Steps**
1. Start a fresh run from campaign 1.
2. Clear waves 1–3 normally.
3. Observe HUD wave counter and clear banners.

**Expected**
- Wave counter increments one-by-one (`W1`, `W2`, `W3`, ...), no skips/duplicates.
- Wave-clear bonus appears once per cleared wave.

---

### SF-02 — Boss warning triggers only on configured boss waves
**Steps**
1. Continue campaign 1 until wave 4 clears.
2. Wait for wave 5 transition.
3. Repeat near wave 20 transition.

**Expected**
- Mini-boss warning appears before wave 5 (and configured mini waves).
- Final warning (`DANGER` + `BOSS APPROACHING`) appears before wave 20.
- No warning appears on non-boss waves.

---

### SF-03 — Final boss kill by bullets advances campaign exactly once
**Steps**
1. Reach a final boss wave.
2. Finish final boss using standard fire only.
3. Watch transition into debrief/next campaign.

**Expected**
- Campaign advances once (no double-skip to the next-next campaign).
- Debrief screen appears and gameplay is paused during debrief/intro.
- No immediate extra wave spawn behind transition screens.

---

### SF-04 — Final boss kill by bomb does not crash/soft-lock
**Steps**
1. Reach final boss with at least 1 bomb.
2. Use bomb to deliver killing damage.
3. Continue through transition.

**Expected**
- No runtime exception after bomb kill.
- Clean transition to debrief/next campaign.
- No stuck state, no duplicate transition trigger.

---

### SF-05 — Debrief skip keeps stage state coherent
**Steps**
1. After campaign clear, wait until skip is allowed.
2. Press `Space` to skip debrief.
3. Wait through intro and first wave spawn.

**Expected**
- Debrief closes normally and intro displays.
- Next campaign begins at `W1` with expected delay.
- No leftover boss warning timer from previous campaign.

---

### SF-06 — Final-wave empty-field fail-safe advances campaign
**Steps (console-assisted)**
1. Reach a final wave.
2. In devtools console, remove active enemies manually (simulate edge-case despawn):
   - `state.enemies.length = 0`
3. Let update tick continue.

**Expected**
- Game advances to debrief/next campaign instead of looping into post-final normal waves.

---

### SF-07 — Campaign index normalization is robust
**Steps (console-assisted test harness)**
1. Call `getCampaign` with malformed/out-of-range values in a quick JS harness:
   - `getCampaign(NaN)`
   - `getCampaign(1.9)`
   - `getCampaign(-999)`
   - `getCampaign(999)`

**Expected**
- Non-finite and fractional values resolve safely.
- Returned campaign is clamped to valid range (first/last as needed).
- No crash from invalid index types.

## Pass Criteria
- All SF cases PASS.
- No console exceptions during transitions.
- No observed wave duplication, skipped campaign, or transition soft-lock.

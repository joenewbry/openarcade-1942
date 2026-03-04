# Design Feedback Log

## GM Playtest Feedback (Round 2) - 2026-03-01

### F1: Can't Shoot Until First Wave Arrives
- **Priority:** critical
- **Status:** open
- **Ticket:** ARCADE-022
- **Description:** Players can't shoot immediately when game starts. Root cause: intro dialogue queued in `resetRun()` blocks shooting via `!state.dialogue` condition in fire check. Players should be able to shoot during dialogue.
- **Implementation approach:** Remove `!state.dialogue` guard from the player shooting condition in updateGame, or don't queue dialogue until after a short delay.

### F2: First Wave Should Be Single Planes
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-023
- **Description:** First wave spawns 8 scout_zero in vee pattern — too many, too confusing for wave 1. Should be 3-4 single planes in a simple line pattern.
- **Implementation approach:** Change campaigns.js wave[0] for coral_front to `{ pattern: 'line', mix: ['scout_zero'], count: 3 }`.

### F3: Early Enemy Bullets Should Go Straight Down
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-024
- **Description:** All fighters fire aimed shots at player from wave 1. Early enemies should fire straight down (no tracking). Aimed shots for later waves/campaigns.
- **Implementation approach:** In `spawnEnemyBullets`, check campaign index and wave number. If C1 and wave <= 5, fire straight down (vx=0, vy=baseSpeed) instead of aimed.

### F4: HUD Not Displaying
- **Priority:** critical
- **Status:** open
- **Ticket:** ARCADE-025
- **Description:** All HUD text at top (score, lives, bombs, chain, graze, roll stocks) not showing. Icons not visible. The `drawUI` function calls `text.drawText()` but nothing renders.
- **Implementation approach:** Debug the text rendering pipeline in the engine. Check if `text` object methods are working. May need fallback to canvas 2D text.

### F5: Background Needs Parallax Scrolling Tiles
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-026
- **Description:** Background currently shows a horizon gradient view. Should be top-down scrolling tiled background with parallax depth layers.
- **Implementation approach:** Replace `drawBackground` with a parallax tile system. Two layers: slow ocean/ground tiles, faster cloud/detail layer. Scroll based on tick count.

### F6: First Boss Is Way Too Small
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-027
- **Description:** Bosses take up almost no screen space. BOSS_SCALE=8 with small pixel sprites = tiny bosses.
- **Implementation approach:** Increase BOSS_SCALE from 8 to 14-16 for final bosses, 10-12 for mini bosses. Ensure hit zones scale proportionally.

### F7: Moving/Shooting Should NOT Slow the Plane
- **Priority:** critical
- **Status:** open
- **Ticket:** ARCADE-028
- **Description:** Holding Space to shoot also activates focus mode (`state.focusActive = input.isDown(' ')`), which reduces speed to 3px/frame. This means every time you shoot you slow down. Space is overloaded as both shoot AND focus.
- **Implementation approach:** Separate focus mode to a different key (e.g., 'f' or 'z' key). Space should only shoot. Or: remove focus mode speed penalty and make it a visual-only feature.

### F8: Sprites Need Improvement
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-029
- **Description:** Generated sprite graphics aren't quite right. Planes don't look clearly top-down. Enemies appear clustered rather than as single distinct entities.
- **Implementation approach:** Regenerate problem sprites using nano-banana with better prompts specifying top-down view, single entities, clear silhouettes.

---

## Miyamoto (Shigeru Miyamoto lens) - 2026-03-01

### Feedback 1: Implement Wordless Tutorial (W1-4)
- **Priority:** critical
- **Status:** open
- **Ticket:** ARCADE-001
- **Description:** Players are dropped into a full wave with a text overlay listing every control. The design doc specifies a wordless tutorial: W1=move, W2=dodge, W3=powerups, W4=roll. None of this is implemented.
- **Implementation approach:** Hand-script waves 1-4 in Campaign 1 with reduced enemy counts and no/slow shooting. Gate mechanics: W1 = 3-4 non-firing scouts, W2 = slow aimed shots, W3 = guaranteed powerup drop, W4 = roll-forcing bullet wall. Remove control listing overlay.
- **PR:**

### Feedback 2: Reduce to 2 Planes for v1
- **Priority:** critical
- **Status:** open
- **Ticket:** ARCADE-002
- **Description:** Design doc says v1 ships Specter + Atlas only. Code has 4 planes. Players choose between meaningless options before firing a single bullet.
- **Implementation approach:** Remove Falcon and Lancer from PLANES array. Default to Specter. Simplify plane select to 2 options.
- **PR:**

### Feedback 3: Add Movement Velocity Smoothing
- **Priority:** critical
- **Status:** open
- **Ticket:** ARCADE-003
- **Description:** Player movement is instant digital input with no weight. Movement feels like sliding a chess piece rather than piloting a plane.
- **Implementation approach:** Track player.vx/vy, lerp toward target: `player.vx += (mx * speed - player.vx) * 0.28`. Add visual tilt via 1px offset when banking. ~4 frames acceleration, ~6 frames deceleration.
- **PR:**

### Feedback 4: Fix Score Values to Match Design Doc
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-004
- **Description:** Score values are deflated (scout=14pts vs design doc's 100pts). Numbers are psychologically dead and don't communicate progress.
- **Implementation approach:** Set small enemies=100, medium=250, mini boss=5000, final boss=25000 per design doc.
- **PR:**

### Feedback 5: Add Wave Clear Transitions
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-005
- **Description:** No breathing room between waves. 50-frame delay with no visual feedback. No WAVE CLEAR text, no score tally, no boss WARNING sequence.
- **Implementation approach:** Show "WAVE CLEAR" text for 90 frames with score bonus. Increase waveDelay to 120. Add 180-frame WARNING phase before bosses with darkened screen and flashing text.
- **PR:**

### Feedback 6: Make Bombs Feel Powerful
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-006
- **Description:** Bombs deal flat 8/18 damage with no drama. Should be screen-filling events with I-frames, instant kills on normals, and bullet-cancel scoring.
- **Implementation approach:** Add 60 frames invulnerability on bomb. Kill all normal enemies outright. Bosses take 15% maxHP. Full-screen white flash 8 frames. Award 10 points per bullet cancelled.
- **PR:**

### Feedback 7: Remove NOT- Prefix from Campaign Names/IDs
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-007
- **Description:** All campaign IDs have `not_` prefix and names show "NOT-". Placeholder text that signals "unfinished" to players.
- **Implementation approach:** Find-and-replace in campaigns.js and dialogue.js. Remove all `not_`/`NOT-` prefixes.
- **PR:**

### Feedback 8: Differentiate Enemy and Player Bullet Visuals
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-008
- **Description:** Player bullets (4×10 cyan rectangles) and enemy bullets (4×8 red rectangles) are too similar in shape. At high density, color distinction alone isn't enough.
- **Implementation approach:** Draw enemy bullets as 6×6 diamonds or circles. Add 1px bright white core. Keep player bullets rectangular for shape contrast.
- **PR:**

### Feedback 9: Add Death Consequences
- **Priority:** nice-to-have
- **Status:** open
- **Ticket:** ARCADE-009
- **Description:** Death has no mechanical consequence beyond lives counter. No powerup loss, no pause, no teaching moment. Design doc says drop 1 shot tier, lose buffs.
- **Implementation approach:** On death: reset doubleShotTimer, speedBoostTimer, shieldTimer to 0. Add 30-frame entity freeze + screen shake. Implement shot tier downgrade.
- **PR:**

### Feedback 10: Simplify Campaign Intro
- **Priority:** nice-to-have
- **Status:** open
- **Ticket:** ARCADE-010
- **Description:** campaign_intro phase is half-built. Between-campaign transitions are instant with no ceremony.
- **Implementation approach:** Remove campaign_intro phase for v1. Add 3-second black screen with campaign name between campaigns. Save elaborate intros for later.
- **PR:**

---

## Kojima (Hideo Kojima lens) - 2026-03-01

### Feedback 1: Implement Unique Campaign Structures
- **Priority:** critical
- **Status:** open
- **Ticket:** ARCADE-011
- **Description:** All 4 campaigns use identical minibossWaves [5,10,15]. Design doc specifies unique structures: C2 boss at W3/double W10, C3 no minis, C4 bosses every 4 waves. This makes every campaign feel like a reskin.
- **Implementation approach:** Replace uniform minibossWaves with per-campaign structures. Create full 20-entry custom wave arrays instead of 5 templates cycling via modulo.
- **PR:**

### Feedback 2: Implement Boss Hit Zones
- **Priority:** critical
- **Status:** open
- **Ticket:** ARCADE-012
- **Description:** Bosses are single HP pools. Design doc specifies 4 destructible sections (port/starboard battery, engine, core) with phase transitions. Current bosses are just big enemies.
- **Implementation approach:** Split boss HP into 4 sections with separate collision rects. Each section destroyed changes behavior. Add at least 2 phases per final boss. Add WARNING + entrance choreography.
- **PR:**

### Feedback 3: Every Campaign Feels Identical (duplicate of ARCADE-011)
- **Priority:** critical
- **Status:** open
- **Ticket:** (see ARCADE-011)
- **Description:** Same as ARCADE-011 — consolidated.
- **Implementation approach:** See ARCADE-011.
- **PR:**

### Feedback 4: Implement Signature Moments
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-013
- **Description:** 8 signature moments designed (whale crossing, 4-side ambush, sandstorm, wingman) — none implemented. These are what players remember.
- **Implementation approach:** Start with 2-3: whale crossing in C1 (blocks bullets), ambush from all edges in C2 (change spawn positions), wingman in C4 (AI ally plane for 1 wave).
- **PR:**

### Feedback 5: Death Means Nothing (see ARCADE-009)
- **Priority:** important
- **Status:** open
- **Ticket:** (see ARCADE-009)
- **Description:** Consolidated with ARCADE-009.
- **PR:**

### Feedback 6: Implement Chain Scoring System
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-014
- **Description:** No chain/combo system. Score is passive counter. Chain system transforms player from passive survivor to active hunter.
- **Implementation approach:** Track chainCount/chainTimer. Each kill within window increments chain and multiplies score. Display prominently. Shrinking window from 90→45 frames.
- **PR:**

### Feedback 7: Trim to 2 Planes (see ARCADE-002)
- **Priority:** important
- **Status:** open
- **Ticket:** (see ARCADE-002)
- **Description:** Consolidated with ARCADE-002.
- **PR:**

### Feedback 8: Add Wave Transition Breathing Room (see ARCADE-005)
- **Priority:** nice-to-have
- **Status:** open
- **Ticket:** (see ARCADE-005)
- **Description:** Consolidated with ARCADE-005.
- **PR:**

### Feedback 9: Add Focus Mode
- **Priority:** nice-to-have
- **Status:** open
- **Ticket:** ARCADE-015
- **Description:** Hold-space focus mode (slow movement + visible hitbox) not implemented. Creates moment-to-moment decisions between speed and precision.
- **Implementation approach:** When Space held: reduce speed to 1.5px/f, render 3px bright hitbox dot at player center. Tie graze scoring to focus mode.
- **PR:**

### Feedback 10: World Doesn't React to Player
- **Priority:** nice-to-have
- **Status:** open
- **Ticket:** ARCADE-016
- **Description:** Environment is static backdrop. No reaction to bombs, boss deaths, or player actions.
- **Implementation approach:** Darken background on bomb use. Boss death triggers campaign-specific ambient event. Make C4 lightning flashes gameplay-relevant.
- **PR:**

---

## Ikeda (Tsuneki Ikeda / CAVE lens) - 2026-03-01

### Feedback 1: Implement Chain Scoring System (see ARCADE-014)
- **Priority:** critical
- **Status:** open
- **Ticket:** (see ARCADE-014)
- **Description:** Consolidated with ARCADE-014. Single biggest gap for skilled play.
- **PR:**

### Feedback 2: Implement Distinct Enemy Bullet Patterns
- **Priority:** critical
- **Status:** open
- **Ticket:** ARCADE-017
- **Description:** Every enemy fires identical aimed spreads. Design doc specifies complex per-enemy patterns. All bullets same color/size. Violates readability-at-density rule.
- **Implementation approach:** Define per-enemy bulletPattern functions. Color-code by speed tier: slow=large pink, medium=orange diamonds, fast=small bright red.
- **PR:**

### Feedback 3: Implement Graze System
- **Priority:** critical
- **Status:** open
- **Ticket:** ARCADE-018
- **Description:** No graze scoring. Without it, optimal strategy is stay at bottom and shoot up. Graze rewards threading through patterns.
- **Implementation approach:** Graze hitbox ~28px radius around player center. Each bullet passing through graze zone but not collision hitbox scores 25 × chain_multiplier. Mark bullets as grazed. Visual spark particles + crystalline tick sound.
- **PR:**

### Feedback 4: Implement Focus Mode (see ARCADE-015)
- **Priority:** critical
- **Status:** open
- **Ticket:** (see ARCADE-015)
- **Description:** Consolidated with ARCADE-015. Non-negotiable for bullet-hell genre.
- **PR:**

### Feedback 5: Fix Score Values (see ARCADE-004)
- **Priority:** important
- **Status:** open
- **Ticket:** (see ARCADE-004)
- **Description:** Consolidated with ARCADE-004.
- **PR:**

### Feedback 6: Implement Boss Hit Zones (see ARCADE-012)
- **Priority:** important
- **Status:** open
- **Ticket:** (see ARCADE-012)
- **Description:** Consolidated with ARCADE-012.
- **PR:**

### Feedback 7: Integrate Bomb with Scoring System
- **Priority:** important
- **Status:** open
- **Ticket:** ARCADE-019
- **Description:** Bomb has no scoring integration. Should reset chain (cost) but award bullet-cancel points (mitigation). No I-frames during bomb.
- **Implementation approach:** Bombing resets chain to 0. Each cancelled bullet awards 10pts (not multiplied). Add 90 frames I-frames. Auto-bomb option in settings.
- **PR:**

### Feedback 8: Add Wave Clear Transitions (see ARCADE-005)
- **Priority:** important
- **Status:** open
- **Ticket:** (see ARCADE-005)
- **Description:** Consolidated with ARCADE-005.
- **PR:**

### Feedback 9: Implement Roll Stock System
- **Priority:** nice-to-have
- **Status:** open
- **Ticket:** ARCADE-020
- **Description:** Roll is cooldown-based. Design doc specifies 3 stocks with 10s regen. Stock system creates resource management decisions.
- **Implementation approach:** Replace rollCooldown with rollStocks (3 max), rollRegenTimer, rollRegenRate (600 frames). Display as 3 icons in UI.
- **PR:**

### Feedback 10: Add Death Mechanical Consequences (see ARCADE-009)
- **Priority:** nice-to-have
- **Status:** open
- **Ticket:** (see ARCADE-009)
- **Description:** Consolidated with ARCADE-009.
- **PR:**

---

## Okamoto (Yoshiki Okamoto / Original 1942 Creator lens) - 2026-03-01

### Feedback 1: Fix Score Economy
- **Priority:** critical
- **Status:** open
- **Ticket:** (see ARCADE-004)
- **Description:** Consolidated with ARCADE-004. Also: add floating score pop text at kill locations.
- **PR:**

### Feedback 2: Add Wave Punctuation (see ARCADE-005)
- **Priority:** critical
- **Status:** open
- **Ticket:** (see ARCADE-005)
- **Description:** Consolidated with ARCADE-005.
- **PR:**

### Feedback 3: Implement Distinct Bullet Patterns (see ARCADE-017)
- **Priority:** critical
- **Status:** open
- **Ticket:** (see ARCADE-017)
- **Description:** Consolidated with ARCADE-017.
- **PR:**

### Feedback 4: Add Death Penalty (see ARCADE-009)
- **Priority:** important
- **Status:** open
- **Ticket:** (see ARCADE-009)
- **Description:** Consolidated with ARCADE-009.
- **PR:**

### Feedback 5: Implement Roll Stock System (see ARCADE-020)
- **Priority:** important
- **Status:** open
- **Ticket:** (see ARCADE-020)
- **Description:** Consolidated with ARCADE-020.
- **PR:**

### Feedback 6: Implement Unique Campaign Structures (see ARCADE-011)
- **Priority:** important
- **Status:** open
- **Ticket:** (see ARCADE-011)
- **Description:** Consolidated with ARCADE-011.
- **PR:**

### Feedback 7: Trim to 2 Planes (see ARCADE-002)
- **Priority:** important
- **Status:** open
- **Ticket:** (see ARCADE-002)
- **Description:** Consolidated with ARCADE-002.
- **PR:**

### Feedback 8: Implement Chain Combo System (see ARCADE-014)
- **Priority:** nice-to-have
- **Status:** open
- **Ticket:** (see ARCADE-014)
- **Description:** Consolidated with ARCADE-014.
- **PR:**

### Feedback 9: Add Focus Mode (see ARCADE-015)
- **Priority:** nice-to-have
- **Status:** open
- **Ticket:** (see ARCADE-015)
- **Description:** Consolidated with ARCADE-015.
- **PR:**

### Feedback 10: Add 1-Up Score Milestones
- **Priority:** nice-to-have
- **Status:** open
- **Ticket:** ARCADE-021
- **Description:** No lives ever gained. Design doc says 1-up at 100k, then every 200k. Creates mid-session goals.
- **Implementation approach:** Track nextLifeAt in state (100000, +200000). On threshold: grant life (max 5), play distinctive sound, flash "1-UP" text.
- **PR:**

---

## GM Playtest Feedback (Round 4) - 2026-03-01

### Visual/UI Fixes
- **F1: Mini boss needs to be bigger** — ARCADE-045 — Still too small. Scale up MINI_BOSS_SCALE significantly.
- **F2: Plane select screen grayed/text overflow** — ARCADE-046 — UI washed out, text overflowing bounds.
- **F3: Remove plane tilt on movement** — ARCADE-047 — Remove bank offset when moving left/right.
- **F4: Enemy bullets need sprites** — ARCADE-048 — Make them red/pink sprite-based, not primitive shapes.
- **F5: Clouds should match art style** — ARCADE-049 — Cloud visuals need to match plane sprite quality.
- **F6: Enemy planes need to be bigger** — ARCADE-050 — Still hard to see, scale up more.
- **F7: Bullets should be bigger** — ARCADE-051 — Both player and enemy projectiles larger.

### Gameplay Mechanics
- **F8: Decrease first mini boss HP** — ARCADE-052 — reef_guardian too hard, reduce HP.
- **F9: Mini boss should drop more loot** — ARCADE-053 — More generous drops.
- **F10: Small planes NO targeted shots** — ARCADE-054 — Fighter-class enemies STRAIGHT DOWN only. RECURRING.
- **F11: Add homing missiles power-up** — ARCADE-055 — Homing missiles weapon type as pickup.
- **F12: Add different weapon types** — ARCADE-056 — Spread shot, laser, homing missiles.
- **F13: Power-ups should stack and last longer** — ARCADE-057 — Stack + longer duration.
- **F14: Bomb should clear ALL enemy shots** — ARCADE-058 — Verify full bullet clear.
- **F15: Remove whale signature moment** — ARCADE-059 — Remove whale crossing in C1.

### Background/Map System (CRITICAL)
- **F16: Need tiled background** — ARCADE-060 — Hand-designed tiles, not generative.
- **F17: Fix parallax layer order** — ARCADE-061 — Ocean→Islands→Clouds, correct speeds.
- **F18: Islands fixed to map** — ARCADE-062 — Part of terrain, not floating objects.
- **F19: Topography = flying over land** — ARCADE-063 — Top-down terrain perspective.
- **F20: Designer pacing review** — ARCADE-064 — All 4 designers review difficulty curve.

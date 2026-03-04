# Pacing Review — Round 4 (ARCADE-064)
## All 4 Game Designers

---

## Miyamoto (Onboarding & Flow)

### Current State
The difficulty curve across C1-C4 is structured but still too front-loaded for new players:
- **C1 W1-4**: Good — small enemy counts (3-5), simple patterns. Teaches through play.
- **C1 W5**: First mini boss at wave 5 is too early if the player hasn't had time to discover power-ups naturally. With reef_guardian HP now at 40, this is more manageable.
- **C1 W7-10**: Mixed enemy types (scout + torpedo_gull) introduced well, but wave 7 with 6 enemies in stagger feels like a spike.

### Recommendations
1. **Delay C1 first mini boss to W7 instead of W5** — Give players 6 waves of pure learning before the first boss test.
2. **W1-3 should have NO enemy bullets at all** — Pure movement training. Enemies just fly patterns, player shoots them. Bullets start W4.
3. **Guaranteed power-up drop at W3** — Player should discover the power-up system naturally before facing any challenge.
4. **Wave clear bonus should be more visible** — The +500 text is too subtle. Add a brief pause + bigger text.

---

## Kojima (Narrative Arc & Emotional Pacing)

### Current State
The 4-campaign structure creates a good macro arc, but each campaign internally feels flat:
- **C1**: Gentle start → steady ramp → boss. Good tutorial arc.
- **C2**: Surprise boss at W3 is great narrative design — subverts expectations. But the player may not be ready.
- **C3**: No mini bosses = endurance test. Good in concept, but 20 waves of pure survival with no punctuation = fatigue.
- **C4**: Bosses every 4 waves = relentless. With the wingman at W14, there's a nice emotional peak.

### Recommendations
1. **C3 needs a midpoint moment** — Without mini bosses, add a signature moment at W10 (e.g., a massive convoy crossing, or environmental hazard). Something to break monotony.
2. **Add brief dialogue at campaign transitions** — Currently just a black screen with name. Add 1-2 lines of pilot radio chatter to build narrative.
3. **C2's W3 boss should have a warning line** — "That's no scout formation — it's a FORTRESS!" — prepare the player emotionally even if it's a surprise.
4. **End of C4 should feel like a climax** — W17-19 enemy counts of 14-16 are good density. Consider adding a second wingman at W18 for a "last stand together" moment.

---

## Ikeda (Scoring Depth & Skill Ceiling)

### Current State
The scoring systems are solid (chain, graze, focus mode) but the pacing doesn't create enough opportunity for skilled play:
- **Chain system**: Works well but chain windows are too generous early on. W1-5 enemies die in 1-2 hits, making chains trivial.
- **Graze system**: Underutilized because C1 enemy bullets are all straight-down. No interesting patterns to graze through.
- **Power-up stacking (new)**: Great addition. Players who maintain chains AND stack power-ups will feel powerful. But there's a risk of becoming overpowered by mid-campaign.

### Recommendations
1. **Introduce aimed shots earlier in C1** — Currently ALL fighters fire straight down (ARCADE-054 just made this universal). Consider: C1 W1-10 = straight down, but C1 W11+ fighters could get slight tracking. Otherwise later campaigns have no bullet variety from fighters.
2. **Actually, REVISE ARCADE-054**: The GM said "small planes should NOT shoot targeted" — this should mean only in C1/early game, not universally. In C3/C4, fighters should absolutely aim at players. Otherwise difficulty doesn't scale.
3. **Mini boss patterns (spiral) need safe paths** — Current spiral pattern fires 5 bullets evenly spaced. Add a gap/safe corridor for skilled players to thread through.
4. **Score multiplier display should be more prominent** — Chain x2.0, x3.0 milestones should trigger screen effects to reward the player.
5. **Add a "perfect wave" bonus** — Clear a wave without taking damage = 2x wave clear bonus. Rewards clean play.

### ⚠️ CRITICAL NOTE on ARCADE-054
Making ALL fighters fire straight down across ALL campaigns is too aggressive. This removes a core difficulty scaling mechanic. Recommended fix:
- C1: All fighters straight down (as implemented)
- C2: Fighters get slight tracking (±0.8 vx)
- C3-C4: Full aimed shots for fighters

---

## Okamoto (Arcade Feel & Original 1942 Perspective)

### Current State
The game is getting closer to the original 1942 feel but pacing needs tuning:
- **Credit-feeding feel**: Good — 3 lives + 2 bombs + 1-ups at score milestones = about right.
- **Wave pacing**: 120-frame (~2 second) gap between waves is good for breathing room.
- **Boss encounters**: 180-frame warning phase works. Mini bosses with reduced HP (40) are now beatable on first try.

### Recommendations
1. **Speed up mid-campaign waves** — Waves 8-14 in every campaign drag. Reduce waveDelay to 80 frames for these waves (instead of 120). Keep 120 for post-boss recovery.
2. **More aggressive enemy spawn counts in C3-C4** — Current counts cap around 14-16. For the final campaigns, push to 18-20. More enemies on screen = more scoring opportunities and more arcade intensity.
3. **Power-up spawn rate from enemies is too low** — 14% drop rate means you might go 7-8 kills without a drop. Increase to 20% for normal enemies. Mini bosses already drop 3 items now.
4. **Add a "No Miss" all-clear bonus** — Complete an entire campaign without dying = massive score bonus (e.g., 50,000 points). This is classic arcade design.
5. **Boss death slow-motion is too long** — 60 frames at 0.5x = ~2 seconds of slowdown. Reduce to 30 frames. Keep it punchy.

### Pacing Summary (All Campaigns)
| Campaign | Current Feel | Recommended Change |
|----------|-------------|-------------------|
| C1 (Coral Front) | Good tutorial, maybe too gentle W6-10 | Push first mini boss to W7, add more enemy variety W8-10 |
| C2 (Jungle Spear) | Good surprise at W3, ambush at W6 | Add brief breathing room after W3 boss (longer waveDelay) |
| C3 (Dust Convoy) | Monotonous endurance | Add mid-campaign signature moment at W10 |
| C4 (Iron Monsoon) | Relentless and fun | Consider reducing to bosses at W5/W10/W15 instead of every 4 |

---

## Consensus Recommendations (All 4 Designers Agree)

1. **ARCADE-054 needs revision** — Straight-down-only for fighters should be C1 only, not universal. Scale up tracking in later campaigns.
2. **C3 needs a midpoint break** — Some kind of signature moment or breathing room around W10.
3. **Power-up drop rate should increase** — 14% → 20% for normal enemies.
4. **Add "perfect wave" bonus** — Clear wave without damage = extra score.
5. **Boss slow-motion should be shorter** — 60 frames → 30 frames.

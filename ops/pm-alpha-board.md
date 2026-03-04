# PM-Alpha Kickoff Board (Core Gameplay)

| # | Gameplay Task (Actionable) | Engineer Lane (Codex Spark) | QA Checks | Test-Engineer Validation Notes |
|---|---|---|---|---|
| 1 | Tighten player flight controls (accel/decel, turn smoothing, deadzone) and expose tuning constants in `shared/constants.js`. | ENG-1 | Verify keyboard/gamepad parity; no input lag spikes at 60 FPS. | Run latency sweep (30/60/120 FPS caps), confirm control feel stable and no stuck-input states. |
| 2 | Rebalance primary weapon progression (base shot + upgrades) for consistent DPS growth across first 3 stages. | ENG-2 | Confirm DPS bands match spec; no downgrade on pickup edge cases. | Scripted combat runs against standard enemy set; compare time-to-kill per weapon tier. |
| 3 | Normalize enemy hitboxes/hurtboxes for small fighters, bombers, and turrets; remove unfair collisions. | ENG-3 | Validate collision overlays by class; check no phantom hits. | Automated replay pack with hitbox debug enabled; report hit/miss anomaly rate. |
| 4 | Implement wave pacing pass for Stage 1-2 (spawn cadence + formation spacing) to reduce difficulty spikes. | ENG-4 | Confirm spawn timings follow authored wave data; no off-screen pop-in. | Run pacing telemetry (enemy/sec, bullets/sec, deaths/min) and flag spike windows >20%. |
| 5 | Tune power-up economy (drop rates, stack rules, expiry timers) to keep recovery possible after death. | ENG-5 | Verify drop RNG boundaries; ensure stack/expiry UI updates correctly. | 100-seed simulation of runs; validate target pickup frequency and recovery success rate. |
| 6 | Add bomb system polish: blast radius consistency, invulnerability window, and enemy projectile clear rules. | ENG-1 | Confirm bomb clears intended projectile classes only; no soft-lock during blast. | Deterministic test scenes for dense bullet fields; verify clear radius and iframe duration tolerances. |
| 7 | Refine score/lives loop (extra-life thresholds, combo decay timing, score pop feedback). | ENG-2 | Verify score events add correctly; extra-life triggers once per threshold. | Long-run score integrity test (no overflow/drift) + combo timer boundary validation. |
| 8 | Boss encounter pass (Phase 1 boss): telegraph readability, pattern cooldowns, damage windows. | ENG-3 | Check telegraphs visible against all backgrounds; patterns obey cooldown caps. | Frame-by-frame pattern audit and no-hit reproducibility test for intended safe lanes. |
| 9 | Checkpoint/respawn fairness pass: spawn safety bubble, enemy reset radius, camera settle timing. | ENG-4 | Verify no immediate death on respawn; checkpoint restore matches saved state. | 50 forced-death trials per checkpoint; track survival >=5s after respawn target. |
| 10 | Difficulty curve settings panel for designers (global multipliers for enemy HP, fire rate, speed). | ENG-5 | Confirm runtime tuning applies without restart; values persist in expected scope. | Parameter sweep matrix (easy/normal/hard presets) and balance delta report per stage. |

## Notes
- Scope target: first playable combat slice with stable feel and measurable tuning hooks.
- QA gate: each task requires pass on listed QA checks before moving to test-engineer validation.
- Exit criteria: task closed only after test-engineer notes are executed and logged with evidence (video/replay/metrics).

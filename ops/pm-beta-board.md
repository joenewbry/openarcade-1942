# PM-Beta Kickoff Board (Content + Levels)

Owner: PM-Beta  
Scope: 1942 content pipeline + level/editor workflow  
Engineer execution mode: Codex Spark lanes (ENG-1..ENG-5)

| # | Content/Editor Task | Engineer Lane (Codex Spark) | QA Checks | Test-Engineer Validation Notes |
|---|---|---|---|---|
| 1 | **Stage Segment Authoring Tool v1** — add segment create/duplicate/delete flow with safe undo for designers. | **ENG-1** (arcade-dev-02) | Create/edit/delete 20 segments; confirm no data corruption; undo/redo stack integrity under rapid edits. | Run 3 full authoring sessions (15+ min each), verify no crashes and no orphaned segment refs in exported level JSON. |
| 2 | **Tile Palette + Brush Presets** — implement palette categories (terrain, hazards, decor) and reusable brush presets. | **ENG-2** (arcade-agent-05) | Palette loads all categories; brush preset save/load works across reload; invalid tile IDs gracefully rejected. | Stress-test 500+ tile placements per map and confirm deterministic save output (hash-stable exports). |
| 3 | **Enemy Wave Timeline Editor** — timeline tracks for spawn time, lane, enemy type, and formation IDs. | **ENG-3** (arcade-agent-07) | Spawn order matches timeline; overlap warnings fire; timeline scrub preview matches runtime. | Simulate 10 scripted waves with edge timings (0ms, overlapping, end-of-level) and verify runtime parity. |
| 4 | **Formation Library + Reuse** — reusable formation templates with parameter overrides (speed, offset, delay). | **ENG-4** (codex-spark-lane-beta-4) | Template create/update/delete; override precedence validated; legacy formations auto-migrated. | Validate old missions still load; compare before/after replay traces for unchanged formations (no regression drift). |
| 5 | **Boss Encounter Config Panel** — phase thresholds, attack scripts, and transition cues editable in UI. | **ENG-5** (codex-spark-lane-beta-5) | Phase transitions trigger at configured HP thresholds; bad script refs blocked; warning surfaced for missing cues. | Execute boss soak tests (10 consecutive runs) and confirm phase order + cue timing consistency within tolerance. |
| 6 | **Parallax/Background Layer Editor** — per-layer speed, loop mode, and weather FX toggles for stage mooding. | **ENG-1** (arcade-dev-02) | Layer ordering and z-depth verified; loop seams hidden; weather FX toggles persist in saves. | Capture side-by-side recordings for low/high scroll speeds; confirm no frame hitching from layer updates. |
| 7 | **Checkpoint + Continue Placement Tool** — visual placement and tuning of respawn points per segment. | **ENG-2** (arcade-agent-05) | Checkpoints only on valid geometry; continue restores correct loadout/position; duplicates flagged. | Run fail/retry loops at each checkpoint (x5) and verify deterministic respawn state + no soft-locks. |
| 8 | **Difficulty Curve Authoring (Per-Stage)** — editor controls for density, projectile speed, and elite frequency bands. | **ENG-3** (arcade-agent-07) | Difficulty values constrained to allowed ranges; stage preview reflects curve changes; reset-to-default works. | Conduct A/B playtests across Easy/Normal/Hard profiles; confirm target clear-rate deltas match design envelope. |
| 9 | **Content Validation Linter** — pre-publish lint rules for missing assets, bad IDs, unreachable waves, and empty phases. | **ENG-4** (codex-spark-lane-beta-4) | Linter catches known bad fixtures; false-positive rate tracked; blocking vs warning severities honored. | Seed 25 malformed content cases; verify expected lint codes and block release on critical violations only. |
|10| **Level Pack Export + Import Pipeline** — bundle stages, metadata, and versioning for handoff between design and runtime. | **ENG-5** (codex-spark-lane-beta-5) | Export schema version stamped; import rejects incompatible versions; round-trip keeps content lossless. | Perform round-trip on 5 representative level packs and compare structural diffs (must be zero except timestamp fields). |

## Lane Load Summary
- **ENG-1:** Tasks 1, 6
- **ENG-2:** Tasks 2, 7
- **ENG-3:** Tasks 3, 8
- **ENG-4:** Tasks 4, 9
- **ENG-5:** Tasks 5, 10

## QA/Test Gate
A task is "Done" only when:
1. Engineer lane implementation is merged.
2. QA checks in this board are passed and logged.
3. Test-engineer validation notes are executed with evidence (log/replay/video) attached.

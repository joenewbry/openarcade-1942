export const CAMPAIGNS = [
  {
    id: 'coral_front',
    name: 'Coral Front',
    theme: {
      sky: '#6bb8d8',
      sea: '#1c5d8f',
      low: '#19466b',
      accent: '#7ee8ff',
      hazard: '#f9d27d',
      wildlife: ['whale', 'gulls', 'islands'],
    },
    roster: ['scout_zero', 'torpedo_gull'],
    miniboss: 'reef_guardian',
    finalBoss: 'coral_dreadnought',
    minibossWaves: [5, 10, 15],       // C1: standard tutorial pacing
    // ARCADE-083: Scripted interesting moments
    signatureMoments: {
      7: 'powerup_shower',   // Mid-act reward before tougher enemies
      13: 'ambush_all_edges', // Surprise ambush in Act 3 — first time player sees this
      18: 'wingman',         // Allied wingman for the final push
    },
    finalWave: 20,
    // ── C1: Tutorial campaign — gentle ramp, teaches basics ──
    // ARCADE-071/072: All patterns are now smooth predefined paths. No side entries in C1.
    waves: [
      // Act 1: Learning to fly (W1-4) — scouts only, simple straight paths
      { pattern: 'line',      mix: ['scout_zero'], count: 3 },    // W1: 3 scouts straight down
      { pattern: 'line',      mix: ['scout_zero'], count: 4 },    // W2: 4 scouts, still simple
      { pattern: 'formation', mix: ['scout_zero'], count: 5 },    // W3: tight formation — hold shape
      { pattern: 'vee',       mix: ['scout_zero'], count: 5 },    // W4: first V formation
      // W5: MINIBOSS — reef_guardian
      { pattern: 'line',      mix: ['scout_zero'], count: 4 },    // W5 escort

      // Act 2: New enemy type (W6-9) — introduce torpedo_gull, sine wave paths
      { pattern: 'line',      mix: ['torpedo_gull'], count: 3 },  // W6: meet torpedo_gull alone
      { pattern: 'cross',     mix: ['scout_zero', 'torpedo_gull'], count: 6 },  // W7: sine wave paths
      { pattern: 'vee',       mix: ['scout_zero', 'torpedo_gull'], count: 7 },   // W8: V formation mixed
      { pattern: 'stagger',   mix: ['torpedo_gull'], count: 6 },  // W9: zigzag S-curves
      // W10: MINIBOSS — reef_guardian
      { pattern: 'formation', mix: ['scout_zero', 'torpedo_gull'], count: 5 },  // W10 escort

      // Act 3: Escalation (W11-14) — swooping arcs introduced
      { pattern: 'formation', mix: ['scout_zero', 'torpedo_gull'], count: 8 },   // W11: big formation
      { pattern: 'swirl',     mix: ['torpedo_gull'], count: 7 },  // W12: swooping arcs
      { pattern: 'cross',     mix: ['scout_zero', 'torpedo_gull'], count: 9 },   // W13: sine waves
      { pattern: 'stagger',   mix: ['torpedo_gull', 'scout_zero'], count: 10 },  // W14: dense zigzag
      // W15: MINIBOSS — reef_guardian
      { pattern: 'vee',       mix: ['scout_zero', 'torpedo_gull'], count: 6 },   // W15 escort

      // Act 4: Final push (W16-19) — peak difficulty, first dive patterns
      { pattern: 'swirl',     mix: ['torpedo_gull', 'scout_zero'], count: 10 },  // W16: swooping arcs
      { pattern: 'dive',      mix: ['scout_zero', 'torpedo_gull'], count: 8 },   // W17: diving swoops!
      { pattern: 'stagger',   mix: ['torpedo_gull'], count: 9 },  // W18: zigzag torpedo wave
      { pattern: 'vee',       mix: ['scout_zero', 'torpedo_gull'], count: 12 },  // W19: massive V — climax
      // W20: FINAL BOSS — coral_dreadnought
      { pattern: 'line',      mix: ['scout_zero'], count: 3 },    // W20 escort
    ],
  },
  {
    id: 'jungle_spear',
    name: 'Jungle Spear',
    theme: {
      sky: '#8ba36e',
      sea: '#3a6a4f',
      low: '#25442f',
      accent: '#d7f07a',
      hazard: '#ffac6c',
      wildlife: ['treeline', 'river', 'birds'],
    },
    roster: ['canopy_raider', 'gunship_hornet', 'scout_zero'],
    miniboss: 'river_bastion',
    finalBoss: 'jungle_citadel',
    minibossWaves: [3, 10],            // C2: early boss at W3, double mini-boss at W10
    doubleMiniWaves: [10],             // spawn 2 mini bosses on these waves
    signatureMoments: { 6: 'ambush_all_edges' },
    finalWave: 20,
    // ── C2: Aggressive — early boss surprise, ambush at W6 ──
    // ARCADE-071/072: Smooth paths. Side entries introduced from W6 onward.
    waves: [
      // Act 1: Quick intro then BOSS (W1-3) — top only
      { pattern: 'formation', mix: ['canopy_raider'], count: 6 },  // W1: tight raider formation
      { pattern: 'stagger',   mix: ['canopy_raider', 'scout_zero'], count: 8 },  // W2: zigzag paths
      // W3: MINIBOSS (early surprise!) — river_bastion
      { pattern: 'vee',       mix: ['canopy_raider'], count: 5 },  // W3 escort

      // Act 2: Build with gunships, ambush at W6 (W4-9) — sides introduced
      { pattern: 'line',      mix: ['gunship_hornet'], count: 4 }, // W4: introduce gunships
      { pattern: 'cross',     mix: ['canopy_raider', 'gunship_hornet'], count: 8 },  // W5: sine waves
      { pattern: 'swirl',     mix: ['canopy_raider', 'gunship_hornet'], count: 10 }, // W6: ambush arcs!
      { pattern: 'figure8',   mix: ['canopy_raider'], count: 8 }, // W7: figure-8 patterns
      { pattern: 'dive',      mix: ['gunship_hornet', 'canopy_raider'], count: 9 },  // W8: diving swoops
      { pattern: 'cross',     mix: ['canopy_raider', 'gunship_hornet', 'scout_zero'], count: 10 }, // W9: 3-type sine
      // W10: DOUBLE MINIBOSS — 2x river_bastion
      { pattern: 'formation', mix: ['canopy_raider', 'scout_zero'], count: 6 },  // W10 escort

      // Act 3: Sustained pressure (W11-15) — more complex paths
      { pattern: 'swirl',     mix: ['gunship_hornet'], count: 8 },     // W11: gunship arcs
      { pattern: 'figure8',   mix: ['canopy_raider', 'gunship_hornet'], count: 11 }, // W12: figure-8 mix
      { pattern: 'dive',      mix: ['canopy_raider', 'gunship_hornet', 'scout_zero'], count: 12 }, // W13: diving formation
      { pattern: 'vee',       mix: ['gunship_hornet', 'canopy_raider'], count: 10 }, // W14: V mix
      { pattern: 'stagger',   mix: ['canopy_raider', 'gunship_hornet'], count: 12 }, // W15: zigzag

      // Act 4: Gauntlet (W16-19) — everything at once, all path types
      { pattern: 'swirl',     mix: ['gunship_hornet', 'canopy_raider'], count: 11 }, // W16: arc storm
      { pattern: 'figure8',   mix: ['canopy_raider', 'gunship_hornet', 'scout_zero'], count: 13 }, // W17: figure-8 chaos
      { pattern: 'dive',      mix: ['gunship_hornet'], count: 10 },     // W18: all gunship dive
      { pattern: 'stagger',   mix: ['canopy_raider', 'gunship_hornet', 'scout_zero'], count: 14 }, // W19: max density
      // W20: FINAL BOSS — jungle_citadel
      { pattern: 'line',      mix: ['canopy_raider'], count: 4 },  // W20 escort
    ],
  },
  {
    id: 'dust_convoy',
    name: 'Dust Convoy',
    theme: {
      sky: '#cf9b57',
      sea: '#91643d',
      low: '#68452b',
      accent: '#ffd58a',
      hazard: '#f46244',
      wildlife: ['dunes', 'convoy', 'dustdevils'],
    },
    roster: ['dune_lancer', 'rail_bomber', 'gunship_hornet'],
    miniboss: 'convoy_ram',
    finalBoss: 'dust_colossus',
    minibossWaves: [],                 // C3: no mini bosses — pure wave survival
    // ARCADE-083: More scripted moments for endurance campaign
    signatureMoments: {
      5: 'wingman',           // Early wingman to help with lancers
      10: 'powerup_shower',   // Midpoint break to fight fatigue
      15: 'ambush_all_edges', // Late surprise
    },
    finalBossScale: 1.5,               // extra-tough final boss
    finalWave: 20,
    // ── C3: Endurance — no minibosses, relentless waves, escalating density ──
    // ARCADE-071: All predefined paths. Side entries from W8 onward.
    waves: [
      // Act 1: Fast lancers (W1-5) — hit-and-run on smooth paths
      { pattern: 'line',      mix: ['dune_lancer'], count: 6 },    // W1: straight fast lancers
      { pattern: 'vee',       mix: ['dune_lancer'], count: 7 },    // W2: V formation
      { pattern: 'stagger',   mix: ['dune_lancer'], count: 8 },    // W3: zigzag S-curves
      { pattern: 'cross',     mix: ['dune_lancer'], count: 9 },    // W4: sine wave
      { pattern: 'dive',      mix: ['dune_lancer'], count: 8 },    // W5: diving swoops

      // Act 2: Add bombers (W6-10) — slow but dangerous
      { pattern: 'formation', mix: ['rail_bomber'], count: 5 },    // W6: introduce bombers in formation
      { pattern: 'stagger',   mix: ['dune_lancer', 'rail_bomber'], count: 9 },  // W7: fast + slow zigzag
      { pattern: 'figure8',   mix: ['rail_bomber', 'dune_lancer'], count: 10 }, // W8: figure-8 mix
      { pattern: 'swirl',     mix: ['dune_lancer', 'rail_bomber'], count: 10 }, // W9: arcs
      { pattern: 'dive',      mix: ['rail_bomber'], count: 7 },    // W10: bomber dive

      // Act 3: Full roster (W11-15) — add gunships to the mix
      { pattern: 'figure8',   mix: ['gunship_hornet', 'dune_lancer'], count: 10 },   // W11: gunships figure-8
      { pattern: 'cross',     mix: ['dune_lancer', 'rail_bomber', 'gunship_hornet'], count: 11 }, // W12: 3-type sine
      { pattern: 'dive',      mix: ['rail_bomber', 'gunship_hornet'], count: 10 },   // W13: heavy dive
      { pattern: 'vee',       mix: ['dune_lancer', 'gunship_hornet'], count: 12 },   // W14: fast V
      { pattern: 'swirl',     mix: ['dune_lancer', 'rail_bomber', 'gunship_hornet'], count: 11 }, // W15: full arcs

      // Act 4: Gauntlet run (W16-19) — max pressure, all path types
      { pattern: 'figure8',   mix: ['gunship_hornet', 'rail_bomber'], count: 12 },   // W16: figure-8 fire
      { pattern: 'stagger',   mix: ['dune_lancer', 'rail_bomber', 'gunship_hornet'], count: 14 }, // W17: max zigzag
      { pattern: 'dive',      mix: ['dune_lancer', 'gunship_hornet'], count: 13 },   // W18: diving frenzy
      { pattern: 'swirl',     mix: ['rail_bomber', 'dune_lancer', 'gunship_hornet'], count: 15 }, // W19: climax arcs
      // W20: FINAL BOSS — dust_colossus (1.5x scale)
      { pattern: 'line',      mix: ['dune_lancer'], count: 4 },    // W20 escort
    ],
  },
  {
    id: 'iron_monsoon',
    name: 'Iron Monsoon',
    theme: {
      sky: '#525c7f',
      sea: '#2e3455',
      low: '#1d2238',
      accent: '#b7c9ff',
      hazard: '#f44f64',
      wildlife: ['storm', 'subs', 'lightning'],
    },
    roster: ['storm_wraith', 'sub_spear', 'dune_lancer', 'canopy_raider'],
    miniboss: 'monsoon_blade',
    finalBoss: 'iron_tempest',
    minibossWaves: [4, 8, 12, 16],    // C4: relentless — boss every 4 waves
    // ARCADE-083: Maximum scripted moments for final campaign
    signatureMoments: {
      3: 'powerup_shower',    // Early power-up boost for the gauntlet
      7: 'ambush_all_edges',  // All-edge ambush
      11: 'wingman',          // Wingman before W12 boss
      14: 'wingman',          // Second wingman for endgame
      17: 'powerup_shower',   // Final power-up boost before climax
    },
    finalWave: 20,
    // ── C4: The Gauntlet — bosses every 4 waves, 4 enemy types, max chaos ──
    // ARCADE-071: Full path variety. All entry directions. Every pattern type used.
    waves: [
      // Segment 1: Storm wraiths (W1-4, boss at W4)
      { pattern: 'figure8',   mix: ['storm_wraith'], count: 8 },   // W1: figure-8 wraiths
      { pattern: 'dive',      mix: ['storm_wraith', 'sub_spear'], count: 9 },   // W2: diving subs
      { pattern: 'stagger',   mix: ['storm_wraith', 'sub_spear'], count: 10 },  // W3: zigzag build
      // W4: MINIBOSS — monsoon_blade
      { pattern: 'formation', mix: ['storm_wraith'], count: 5 },   // W4 escort

      // Segment 2: Escalation (W5-8, boss at W8)
      { pattern: 'swirl',     mix: ['storm_wraith', 'dune_lancer'], count: 10 },    // W5: arcs + lancers
      { pattern: 'figure8',   mix: ['sub_spear', 'dune_lancer'], count: 11 },       // W6: figure-8 mix
      { pattern: 'dive',      mix: ['storm_wraith', 'sub_spear', 'dune_lancer'], count: 12 }, // W7: 3-type dive
      // W8: MINIBOSS — monsoon_blade
      { pattern: 'stagger',   mix: ['storm_wraith', 'dune_lancer'], count: 6 },     // W8 escort

      // Segment 3: Full roster (W9-12, boss at W12)
      { pattern: 'figure8',   mix: ['canopy_raider', 'storm_wraith'], count: 10 },   // W9: raiders figure-8
      { pattern: 'cross',     mix: ['storm_wraith', 'sub_spear', 'canopy_raider'], count: 12 }, // W10: sine waves
      { pattern: 'swirl',     mix: ['canopy_raider', 'dune_lancer', 'sub_spear'], count: 13 },  // W11: arc chaos
      // W12: MINIBOSS — monsoon_blade
      { pattern: 'vee',       mix: ['storm_wraith', 'canopy_raider'], count: 7 },    // W12 escort

      // Segment 4: Endgame + wingman (W13-16, boss at W16)
      { pattern: 'dive',      mix: ['storm_wraith', 'sub_spear', 'dune_lancer', 'canopy_raider'], count: 14 }, // W13: all 4 dive
      { pattern: 'figure8',   mix: ['canopy_raider', 'storm_wraith', 'sub_spear'], count: 13 }, // W14: wingman!
      { pattern: 'swirl',     mix: ['dune_lancer', 'canopy_raider', 'storm_wraith'], count: 14 }, // W15: max arcs
      // W16: MINIBOSS — monsoon_blade
      { pattern: 'formation', mix: ['storm_wraith', 'sub_spear'], count: 8 },        // W16 escort

      // Final push (W17-19) — absolute chaos before final boss
      { pattern: 'figure8',   mix: ['storm_wraith', 'sub_spear', 'dune_lancer', 'canopy_raider'], count: 15 }, // W17
      { pattern: 'dive',      mix: ['canopy_raider', 'storm_wraith', 'dune_lancer'], count: 14 }, // W18
      { pattern: 'swirl',     mix: ['storm_wraith', 'sub_spear', 'dune_lancer', 'canopy_raider'], count: 16 }, // W19: final wave
      // W20: FINAL BOSS — iron_tempest
      { pattern: 'formation', mix: ['storm_wraith'], count: 4 },   // W20 escort
    ],
  },
];

export function getCampaign(index) {
  if (index < 0) return CAMPAIGNS[0];
  if (index >= CAMPAIGNS.length) return CAMPAIGNS[CAMPAIGNS.length - 1];
  return CAMPAIGNS[index];
}

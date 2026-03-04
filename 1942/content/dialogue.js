export const CAMPAIGN_DIALOGUE = {
  coral_front: {
    intro: [
      'Command: Welcome to Coral Front. Keep convoy lanes clear.',
      'Wingmate: Watch for reefs and low-flying torpedo craft.',
    ],
    miniboss: [
      'Command: Heavy contact inbound. Mini-boss signature confirmed.',
      'Wingmate: Tighten formation and keep rolling through salvos.',
    ],
    boss: [
      'Command: Final hull target detected. Break its armor plates first.',
      'Wingmate: We crack this ship and the channel is ours.',
    ],
    clear: [
      'Command: Sector secure. Refuel and prep for next campaign.',
    ],
  },
  jungle_spear: {
    intro: [
      'Command: Entering Jungle Spear. Canopy fire teams active.',
      'Wingmate: Ground tracers will blend with foliage. Stay sharp.',
    ],
    miniboss: [
      'Command: Rotor column approaching from river corridor.',
      'Wingmate: Bait their spread and strike from the flank.',
    ],
    boss: [
      'Command: Fortress airship lifting from treeline basin.',
      'Wingmate: Engines first, bridge second.',
    ],
    clear: [
      'Command: Jungle line broken. Advance route unlocked.',
    ],
  },
  dust_convoy: {
    intro: [
      'Command: Dust Convoy is live. Expect armored escorts.',
      'Wingmate: Heat haze will hide rockets until the last second.',
    ],
    miniboss: [
      'Command: Rail battery transport entering engagement band.',
      'Wingmate: Keep altitude changes unpredictable.',
    ],
    boss: [
      'Command: Dread crawler sighted. Turrets are modular.',
      'Wingmate: Strip weapons before core exposure.',
    ],
    clear: [
      'Command: Convoy shattered. Proceed to monsoon perimeter.',
    ],
  },
  iron_monsoon: {
    intro: [
      'Command: Iron Monsoon conditions are severe. Lightning windows are short.',
      'Wingmate: Use flashes to line up priority kills.',
    ],
    miniboss: [
      'Command: Storm ace pair entering from cloud wall.',
      'Wingmate: Mirror their curves and hit on roll recovery.',
    ],
    boss: [
      'Command: Flag dreadnought acquired. Final engagement begins.',
      'Wingmate: Stay alive through phase transitions and finish the bridge.',
    ],
    clear: [
      'Command: Theater complete. Broadcast the victory channel-wide.',
    ],
  },
};

export function getDialogue(campaignId, type) {
  const campaign = CAMPAIGN_DIALOGUE[campaignId];
  if (!campaign) return [];
  return campaign[type] || [];
}

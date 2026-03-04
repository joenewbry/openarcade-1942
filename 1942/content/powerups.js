export const POWERUPS = [
  {
    id: 'double-shot',
    label: 'Double Shot',
    color: '#ffd166',
    duration: 1800,
    apply(state) {
      // ARCADE-057: Stack — add duration to existing timer instead of replacing
      state.player.doubleShotTimer += this.duration;
    },
  },
  {
    id: 'speed-boost',
    label: 'Speed Boost',
    color: '#7cf3a2',
    duration: 1500,
    apply(state) {
      // ARCADE-057: Stack — add duration
      state.player.speedBoostTimer += this.duration;
    },
  },
  {
    id: 'shield',
    label: 'Shield',
    color: '#89c2ff',
    duration: 1200,
    apply(state) {
      // ARCADE-057: Stack — add duration
      state.player.shieldTimer += this.duration;
    },
  },
  {
    id: 'repair',
    label: 'Repair',
    color: '#ff9e7a',
    duration: 0,
    apply(state) {
      state.player.lives = Math.min(5, state.player.lives + 1);
    },
  },
  {
    id: 'bomb-pack',
    label: 'Bomb Pack',
    color: '#ffdf7f',
    duration: 0,
    apply(state) {
      state.player.bombs = Math.min(5, state.player.bombs + 2);
    },
  },
  // ARCADE-055/056: New weapon power-ups
  {
    id: 'spread-shot',
    label: 'Spread Shot',
    color: '#ff8844',
    duration: 1800,
    apply(state) {
      state.player.weaponType = 'spread';
      state.player.weaponTimer += this.duration;
    },
  },
  {
    id: 'laser',
    label: 'Laser',
    color: '#44ffaa',
    duration: 1800,
    apply(state) {
      state.player.weaponType = 'laser';
      state.player.weaponTimer += this.duration;
    },
  },
  {
    id: 'homing',
    label: 'Homing Missiles',
    color: '#ff44ff',
    duration: 1500,
    apply(state) {
      state.player.weaponType = 'homing';
      state.player.weaponTimer += this.duration;
    },
  },
];

export function rollPowerup() {
  const weights = [20, 18, 16, 10, 15, 8, 6, 7]; // spread, laser, homing added
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < POWERUPS.length; i++) {
    r -= weights[i];
    if (r <= 0) return POWERUPS[i];
  }
  return POWERUPS[0];
}

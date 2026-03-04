export const PLANES = [
  {
    id: 'specter',
    name: 'XP-59 Specter',
    color: '#9fb8ff',
    speed: 4.4,
    fireRate: 10,
    rollCooldown: 68,
    special: {
      id: 'phase',
      name: 'Phase Shield',
      cooldown: 480,
      duration: 120,
      description: 'Temporary shield that ignores damage and grazes bullets.',
    },
  },
  {
    id: 'atlas',
    name: 'B7 Atlas',
    color: '#9ee9c6',
    speed: 3.7,
    fireRate: 11,
    rollCooldown: 84,
    special: {
      id: 'emp',
      name: 'EMP Wave',
      cooldown: 450,
      duration: 1,
      description: 'Stuns nearby enemies and clears weak bullets.',
    },
  },
];

export function getPlaneById(id) {
  return PLANES.find((plane) => plane.id === id) || PLANES[0];
}

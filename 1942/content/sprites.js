const C = {
  '.': null,
  A: '#dfefff',
  B: '#8de8ff',
  C: '#4ba8d7',
  D: '#1f4863',
  E: '#ff5f5f',
  F: '#8a1a1a',
  G: '#ffc56e',
  H: '#8f5d2d',
  I: '#8df57c',
  J: '#2d6e34',
  K: '#c8c8d8',
  L: '#62628e',
  M: '#ffd166',
  N: '#8bc2ff',
  O: '#ff9e7a',
  P: '#9ee9c6',
  Q: '#7351a3',
  R: '#f44f64',
};

function clone(frame) {
  return frame.slice();
}

const planeBase = [
  '....A....',
  '...ABA...',
  '..ABBBA..',
  '.ABBCBBA.',
  'ABCCCCCBA',
  '..C.C.C..',
  '..D...D..',
  '.D.....D.',
];

const planeRoll1 = [
  '....A....',
  '...ABA...',
  '..ABBAA..',
  '.ABCCBA..',
  '..BCCBA..',
  '..C.C....',
  '.D...D...',
  'D.....D..',
];

const planeRoll2 = [
  '....A....',
  '...AAA...',
  '..ABBA...',
  '.ABCB....',
  '..BCB....',
  '..C......',
  '.D..D....',
  'D....D...',
];

const zeroA = [
  '..E.E..',
  '.EEEEE.',
  'EEFEFEE',
  '..EFE..',
  '..F.F..',
];
const zeroB = [
  '..E.E..',
  '.EEEEE.',
  'EEFEEFE',
  '..EEE..',
  '..F.F..',
];
const zeroC = [
  '.E...E.',
  '.EEEEE.',
  'EEFEFEE',
  '..EEE..',
  '..F.F..',
];

const gullA = [
  '.G...G.',
  'GGGGGGG',
  '.GHHHG.',
  '..HHH..',
  '..H.H..',
];
const gullB = [
  '..G.G..',
  '.GGGGG.',
  'GGHHHGG',
  '..HHH..',
  '..H.H..',
];
const gullC = [
  '.G...G.',
  '.GGGGG.',
  'GGHHHGG',
  '..GHG..',
  '..H.H..',
];

const raiderA = [
  '..I.I..',
  '.IIIII.',
  'IIJJJII',
  '..IJI..',
  '..J.J..',
];
const raiderB = [
  '.I...I.',
  '.IIIII.',
  'IIJIJII',
  '..III..',
  '..J.J..',
];
const raiderC = [
  '..I.I..',
  'IIIIIII',
  '.IJJJI.',
  '..III..',
  '..J.J..',
];

const hornetA = [
  '.K...K.',
  'KKKKKKK',
  'KKLKLKK',
  '..KLK..',
  '.L...L.',
  '.L...L.',
];
const hornetB = [
  '..K.K..',
  '.KKKKK.',
  'KKLKLKK',
  '.KLLLK.',
  '.L...L.',
  '..L.L..',
];
const hornetC = [
  '.K...K.',
  '.KKKKK.',
  'KKLLLKK',
  '..KLK..',
  '.L...L.',
  '.L...L.',
];

const bomberA = [
  'G..GG..G',
  'GGGGGGGG',
  'GHHHHHHG',
  '.HHHHHH.',
  '..H..H..',
  '..H..H..',
];
const bomberB = [
  'G.GGGG.G',
  'GGGGGGGG',
  'GHHHHHHG',
  '.HHGGHH.',
  '..H..H..',
  '..H..H..',
];
const bomberC = [
  'G..GG..G',
  'GGGGGGGG',
  'GHHGGHHG',
  '.HHHHHH.',
  '..H..H..',
  '..H..H..',
];

const wraithA = [
  '.Q...Q.',
  'QQQQQQQ',
  '.QRRRQ.',
  '..QRQ..',
  '..R.R..',
];
const wraithB = [
  '..Q.Q..',
  '.QQQQQ.',
  'QQRQRQQ',
  '.QRRRQ.',
  '..R.R..',
];
const wraithC = [
  '.Q...Q.',
  '.QQQQQ.',
  'QQRRRQQ',
  '..QRQ..',
  '..R.R..',
];

const subA = [
  '..LLLL..',
  '.LLNNLL.',
  'LLNNNNLL',
  '.LNNNNL.',
  '..L..L..',
];
const subB = [
  '..LLLL..',
  'LLLNNLLL',
  'LLNNNNLL',
  '.LNNNNL.',
  '..L..L..',
];
const subC = [
  '..LLLL..',
  '.LLNNLL.',
  'LLNNNNLL',
  '.LLNNLL.',
  '..L..L..',
];

const miniA = [
  '...RRR...',
  '.RRRRRRR.',
  'RRKKKKKRR',
  'RKKNNNKKR',
  '.RKKKKKR.',
  '..R...R..',
];
const miniB = [
  '...RRR...',
  '.RRRRRRR.',
  'RRKNNNKRR',
  'RKKKKKKKR',
  '.RKKKKKR.',
  '..R...R..',
];
const miniC = [
  '...RRR...',
  '.RRRRRRR.',
  'RRKKKKKRR',
  'RKNNNNNKR',
  '.RKKKKKR.',
  '..R...R..',
];

const finalA = [
  '..RRRRRRRR..',
  '.RRRKKKKRRR.',
  'RRKNNNNNNKRR',
  'RKKNNNNNNKKR',
  'RRKKKKKKKKRR',
  '.RKKR..RKKR.',
  '..RR....RR..',
];
const finalB = [
  '..RRRRRRRR..',
  '.RRRKKKKRRR.',
  'RRKNNKKNNKRR',
  'RKKNNNNNNKKR',
  'RRKKKKKKKKRR',
  '.RKKR..RKKR.',
  '..RR....RR..',
];
const finalC = [
  '..RRRRRRRR..',
  '.RRRKKKKRRR.',
  'RRKNNNNNNKRR',
  'RKKKKNNKKKKR',
  'RRKKKKKKKKRR',
  '.RKKR..RKKR.',
  '..RR....RR..',
];
const finalD = [
  '..RRRRRRRR..',
  '.RRRKKKKRRR.',
  'RRKNNNNNNKRR',
  'RKKNNNNNNKKR',
  'RRKKKNNKKKRR',
  '.RKKR..RKKR.',
  '..RR....RR..',
];

const pickupDouble = [
  '..M.M..',
  '.MMMMM.',
  '.M...M.',
  '.MMMMM.',
  '..M.M..',
];
const pickupSpeed = [
  '..N....',
  '.NNN...',
  '..NNN..',
  '...NNN.',
  '....N..',
];
const pickupShield = [
  '..N.N..',
  '.NNNNN.',
  '.N...N.',
  '.NNNNN.',
  '..NNN..',
];
const pickupRepair = [
  '..OOO..',
  '.O...O.',
  '.OO.OO.',
  '.O...O.',
  '..OOO..',
];
const pickupBomb = [
  '..MMMM.',
  '.MOOOM.',
  '.MOOOM.',
  '.MOOOM.',
  '..MMMM.',
];

// Turret sprites for destroyable ship turrets
const turretSmall = [
  '..KKKK..',
  '.KLLLLK.',
  '.LLLLLLL',
  '.LLLLLLL',
  '.KLLLLK.',
  '..KKKK..',
];

const turretCannon = [
  '..KKKK..',
  '.KLLLLK.',
  'KLLLLLLK',
  'KLLLLLLK',
  'KLLLLLLK',
  'KLLLLLLK',
  '.KLLLLK.',
  '..KKKK..',
];

const turretDestroyed = [
  '..HH.H..',
  '.H.FFF..',
  'HH.FFF.H',
  '.HFFFH..',
  '..FFF...',
  '.H.F.H..',
];

export const SPRITES = {
  plane_falcon: planeBase,
  plane_lancer: clone(planeBase),
  plane_specter: clone(planeBase),
  plane_atlas: clone(planeBase),
  roll_1: planeRoll1,
  roll_2: planeRoll2,
  zero_a: zeroA,
  zero_b: zeroB,
  zero_c: zeroC,
  gull_a: gullA,
  gull_b: gullB,
  gull_c: gullC,
  raider_a: raiderA,
  raider_b: raiderB,
  raider_c: raiderC,
  hornet_a: hornetA,
  hornet_b: hornetB,
  hornet_c: hornetC,
  lancer_a: raiderA,
  lancer_b: raiderB,
  lancer_c: raiderC,
  bomber_a: bomberA,
  bomber_b: bomberB,
  bomber_c: bomberC,
  wraith_a: wraithA,
  wraith_b: wraithB,
  wraith_c: wraithC,
  sub_a: subA,
  sub_b: subB,
  sub_c: subC,
  mb_reef_a: miniA,
  mb_reef_b: miniB,
  mb_reef_c: miniC,
  mb_river_a: miniA,
  mb_river_b: miniB,
  mb_river_c: miniC,
  mb_convoy_a: miniA,
  mb_convoy_b: miniB,
  mb_convoy_c: miniC,
  mb_monsoon_a: miniA,
  mb_monsoon_b: miniB,
  mb_monsoon_c: miniC,
  fb_coral_a: finalA,
  fb_coral_b: finalB,
  fb_coral_c: finalC,
  fb_coral_d: finalD,
  fb_jungle_a: finalA,
  fb_jungle_b: finalB,
  fb_jungle_c: finalC,
  fb_jungle_d: finalD,
  fb_dust_a: finalA,
  fb_dust_b: finalB,
  fb_dust_c: finalC,
  fb_dust_d: finalD,
  fb_iron_a: finalA,
  fb_iron_b: finalB,
  fb_iron_c: finalC,
  fb_iron_d: finalD,
  pickup_double: pickupDouble,
  pickup_speed: pickupSpeed,
  pickup_shield: pickupShield,
  pickup_repair: pickupRepair,
  pickup_bomb: pickupBomb,
  turret_small: turretSmall,
  turret_cannon: turretCannon,
  turret_destroyed: turretDestroyed,
};

export function getSprite(id) {
  return SPRITES[id] || SPRITES.zero_a;
}

export function colorForKey(key, planeColor = '#8de8ff') {
  if (key === 'B') return planeColor;
  return C[key] || null;
}

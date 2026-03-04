const INPUT_KEYS = {
  left: ['ArrowLeft', 'Left', 'a', 'A', 'KeyA'],
  right: ['ArrowRight', 'Right', 'd', 'D', 'KeyD'],
  thrust: ['ArrowUp', 'Up', 'w', 'W', 'KeyW'],
};

const SHIP_DEFAULTS = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  angle: -Math.PI / 2,
  turning: 0,
  thrusting: false,
  turnSpeed: Math.PI * 2.8,
  thrustPower: 260,
  drag: 0.992,
  maxSpeed: 420,
};

const SHIP_FEATURES = {
  fround: typeof Math.fround === 'function',
  requestAnimationFrame: typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function',
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angle) {
  let out = angle;
  while (out > Math.PI) out -= Math.PI * 2;
  while (out <= -Math.PI) out += Math.PI * 2;
  return out;
}

function down(input, keys) {
  if (!input || typeof input.isDown !== 'function') return false;
  for (const key of keys) {
    if (input.isDown(key)) return true;
  }
  return false;
}

function hasAxis(input) {
  return input && typeof input.getAxis === 'function';
}

function getControlState(input) {
  if (hasAxis(input)) {
    const horizontal = Number(input.getAxis('horizontal')) || 0;
    const thrustAxis = Number(input.getAxis('vertical')) || 0;
    return {
      left: horizontal < -0.15,
      right: horizontal > 0.15,
      thrust: thrustAxis < -0.15 || down(input, INPUT_KEYS.thrust),
    };
  }

  return {
    left: down(input, INPUT_KEYS.left),
    right: down(input, INPUT_KEYS.right),
    thrust: down(input, INPUT_KEYS.thrust),
  };
}

function normalizeDeltaSeconds(dt) {
  const fallback = 1 / 60;
  if (!Number.isFinite(dt) || dt <= 0) return fallback;

  const deltaSeconds = dt > 10 ? dt / 1000 : dt;
  return clamp(deltaSeconds, 1 / 240, 1 / 15);
}

export class Ship {
  constructor(config = {}) {
    Object.assign(this, SHIP_DEFAULTS, config);
    this.features = { ...SHIP_FEATURES };
  }

  reset(config = {}) {
    Object.assign(this, SHIP_DEFAULTS, config);
  }

  update(input, dt, bounds = null) {
    const deltaSeconds = normalizeDeltaSeconds(dt);
    const controls = getControlState(input);

    this.turning = (controls.left ? -1 : 0) + (controls.right ? 1 : 0);
    this.thrusting = !!controls.thrust;

    if (this.turning !== 0) {
      this.angle = normalizeAngle(this.angle + this.turning * this.turnSpeed * deltaSeconds);
    }

    if (this.thrusting) {
      const thrustStep = this.thrustPower * deltaSeconds;
      this.vx += Math.cos(this.angle) * thrustStep;
      this.vy += Math.sin(this.angle) * thrustStep;
    }

    const dragStep = Math.pow(this.drag, deltaSeconds * 60);
    this.vx *= dragStep;
    this.vy *= dragStep;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.maxSpeed) {
      const scale = this.maxSpeed / speed;
      this.vx *= scale;
      this.vy *= scale;
    }

    this.x += this.vx * deltaSeconds;
    this.y += this.vy * deltaSeconds;

    if (bounds && Number.isFinite(bounds.width) && Number.isFinite(bounds.height)) {
      const { width, height, padding = 0 } = bounds;
      if (this.x < -padding) this.x = width + padding;
      if (this.x > width + padding) this.x = -padding;
      if (this.y < -padding) this.y = height + padding;
      if (this.y > height + padding) this.y = -padding;
    }

    if (this.features.fround) {
      this.x = Math.fround(this.x);
      this.y = Math.fround(this.y);
      this.vx = Math.fround(this.vx);
      this.vy = Math.fround(this.vy);
      this.angle = Math.fround(this.angle);
    }
  }
}

export function createShip(config = {}) {
  return new Ship(config);
}

export default Ship;
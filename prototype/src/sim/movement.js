import { ARENA_HEIGHT, ARENA_WIDTH } from "../data/constants.js";
import {
  angleBetweenPoints,
  clamp,
  distanceBetween,
  dot,
  normalizeAngle,
  normalizeVector,
  rotateToward
} from "./geometry.js";

export function planEvasion(entity, state, rng, target) {
  if (entity.hp <= 0 || entity.ventTicks > 0 || entity.overloadTicks > 0) {
    return;
  }
  if (entity.evasionCooldown > 0 || entity.evasionBurstTicks > 0) {
    return;
  }

  const threat = findThreateningProjectile(entity, state.projectiles, target);
  if (!threat) {
    return;
  }

  if (rng() > entity.reactionConfidence) {
    return;
  }

  const incoming = normalizeVector(threat.projectile.vx, threat.projectile.vy);
  let lateral = {
    x: -incoming.y * threat.side,
    y: incoming.x * threat.side
  };

  if (rng() < entity.misreadChance) {
    lateral = { x: -lateral.x * 0.55, y: -lateral.y * 0.55 };
  }

  const towardTarget = target
    ? normalizeVector(target.x - entity.x, target.y - entity.y)
    : { x: 0, y: 0 };
  const weaveVector = normalizeVector(
    lateral.x * 1.2 + towardTarget.x * 0.46,
    lateral.y * 1.2 + towardTarget.y * 0.46
  );

  entity.evasionBurstTicks = entity.type === "grunt" ? 5 : 8;
  entity.evasionCooldown = entity.weaveCooldown;
  entity.evasionVector = weaveVector;
  entity.recentThreatId = threat.projectile.id;
  entity.recentThreatTick = state.tick;
}

export function updateMovement(entity, target, state) {
  if (!target || entity.hp <= 0) {
    entity.vx *= 0.9;
    entity.vy *= 0.9;
    entity.x += entity.vx;
    entity.y += entity.vy;
    clampToArena(entity);
    return;
  }

  const intent = entity.intent || { movement: "hold_range" };
  const dist = distanceBetween(entity, target);
  const toTarget = angleBetweenPoints(entity.x, entity.y, target.x, target.y);
  const radial = normalizeVector(target.x - entity.x, target.y - entity.y);
  const tangentSign = selectStrafeSide(entity, state.tick, target);
  const tangent = { x: -radial.y * tangentSign, y: radial.x * tangentSign };

  let moveVector = { x: 0, y: 0 };
  let desiredFacing = toTarget;

  if (entity.ventTicks > 0 || entity.overloadTicks > 0) {
    moveVector = blend(radial, -1.35, tangent, 0.18);
  } else if (intent.movement === "charge") {
    moveVector = blend(radial, 1.45, tangent, 0.2);
  } else if (intent.movement === "retreat") {
    moveVector = blend(radial, -1.45, tangent, 0.16);
  } else if (intent.movement === "flank") {
    moveVector = dist > 240
      ? blend(radial, 0.72, tangent, 1.42)
      : blend(radial, -0.18, tangent, 1.08);
  } else {
    const ideal = entity.type === "grunt" ? 320 : 390;
    const error = clamp((dist - ideal) / 150, -1, 1);
    moveVector = blend(radial, error * 1.05, tangent, 0.88);
  }

  if (entity.evasionBurstTicks > 0) {
    moveVector = blend(moveVector, 0.5, entity.evasionVector, entity.weaveStrength * 1.28);
    desiredFacing = normalizeAngle(toTarget + tangentSign * 0.12);
  }

  const thrust = normalizeVector(moveVector.x, moveVector.y);
  entity.facing = rotateToward(entity.facing, desiredFacing, entity.turnRate);

  const accel = entity.accel * (entity.evasionBurstTicks > 0 ? 2.22 : 1.16);
  entity.vx += thrust.x * accel;
  entity.vy += thrust.y * accel;

  const maxSpeed = entity.speed * (entity.evasionBurstTicks > 0 ? 2.6 : 1.14);
  const speed = Math.hypot(entity.vx, entity.vy);
  if (speed > maxSpeed) {
    const scaled = maxSpeed / speed;
    entity.vx *= scaled;
    entity.vy *= scaled;
  }

  const damping = entity.ventTicks > 0 || entity.overloadTicks > 0 ? 0.955 : (entity.evasionBurstTicks > 0 ? 0.997 : 0.99);
  entity.vx *= damping;
  entity.vy *= damping;
  entity.x += entity.vx;
  entity.y += entity.vy;
  clampToArena(entity);
}

export function clampToArena(entity) {
  entity.x = clamp(entity.x, 40, ARENA_WIDTH - 40);
  entity.y = clamp(entity.y, 40, ARENA_HEIGHT - 40);
}

function findThreateningProjectile(entity, projectiles, target) {
  let best = null;

  for (const projectile of projectiles) {
    if (projectile.team === entity.team) {
      continue;
    }

    const toEntityX = entity.x - projectile.x;
    const toEntityY = entity.y - projectile.y;
    const forward = dot(toEntityX, toEntityY, projectile.vx, projectile.vy);
    if (forward <= 0) {
      continue;
    }

    const speedSquared = projectile.vx * projectile.vx + projectile.vy * projectile.vy;
    const ticksAhead = clamp(forward / speedSquared, 1, entity.predictionTicks);
    const futureX = projectile.x + projectile.vx * ticksAhead;
    const futureY = projectile.y + projectile.vy * ticksAhead;
    const missDistance = Math.hypot(entity.x - futureX, entity.y - futureY);
    const triggerDistance = entity.radius + projectile.radius + (entity.type === "grunt" ? 18 : 28);

    if (missDistance > triggerDistance) {
      continue;
    }

    const side = chooseWeaveSide(entity, projectile, target);
    const score = missDistance + ticksAhead * 2;
    if (!best || score < best.score) {
      best = { projectile, side, score };
    }
  }

  return best;
}

function chooseWeaveSide(entity, projectile, target) {
  const lineDx = projectile.vx;
  const lineDy = projectile.vy;
  const relX = entity.x - projectile.x;
  const relY = entity.y - projectile.y;
  const cross = lineDx * relY - lineDy * relX;
  if (Math.abs(cross) > 6) {
    return Math.sign(cross);
  }

  if (target) {
    const toTarget = normalizeVector(target.x - entity.x, target.y - entity.y);
    const lateral = (-lineDy * toTarget.x + lineDx * toTarget.y);
    if (Math.abs(lateral) > 0.08) {
      return Math.sign(lateral);
    }
  }

  return entity.strafeBias;
}

function selectStrafeSide(entity, tick, target) {
  const phase = Math.floor(tick / (entity.type === "grunt" ? 24 : 18));
  let side = phase % 2 === 0 ? entity.strafeBias : -entity.strafeBias;

  if (target) {
    const relAngle = normalizeAngle(angleBetweenPoints(entity.x, entity.y, target.x, target.y) - entity.facing);
    if (Math.abs(relAngle) > Math.PI * 0.45) {
      side = Math.sign(relAngle) || side;
    }
  }

  return side || 1;
}

function blend(a, aScale, b, bScale) {
  return {
    x: a.x * aScale + b.x * bScale,
    y: a.y * aScale + b.y * bScale
  };
}

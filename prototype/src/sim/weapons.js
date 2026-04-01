import {
  angleBetweenPoints,
  distanceBetween,
  isAngleWithin,
  normalizeVector,
  radians
} from "./geometry.js";

export function collectAttacks(entity, target, tick, state) {
  const attacks = [];
  if (!target || entity.hp <= 0 || target.hp <= 0) {
    entity.funnelMode = "idle";
    return attacks;
  }
  if (entity.ventTicks > 0 || entity.overloadTicks > 0) {
    entity.funnelMode = "idle";
    return attacks;
  }

  const weapons = entity.intent ? entity.intent.weapons : "hold_fire";
  entity.funnelTarget = target.id;
  entity.funnelMode = weapons === "rifle_funnels" || weapons === "funnels_only" ? "active" : "idle";

  if ((weapons === "rifle" || weapons === "rifle_funnels") && entity.cooldowns.rifle === 0) {
    attemptRifleShot(entity, target, state);
  }

  if (weapons === "saber" && entity.cooldowns.saber === 0) {
    attemptSaberStrike(entity, target, attacks);
  }

  if ((weapons === "rifle_funnels" || weapons === "funnels_only") && entity.cooldowns.funnels === 0) {
    attemptFunnelBurst(entity, target, tick, state);
  }

  return attacks;
}

export function attemptRifleShot(attacker, target, stateOrRng, maybeState) {
  const state = normalizeProjectileState(stateOrRng, maybeState);
  const distance = distanceBetween(attacker, target);
  const arc = attacker.team === "player" ? radians(15) : radians(attacker.type === "ace" ? 19 : 26);
  if (distance > 620 || !isAngleWithin(angleBetweenPoints(attacker.x, attacker.y, target.x, target.y), attacker.facing, arc)) {
    return false;
  }

  const speed = attacker.type === "grunt" ? 15.5 : 18.5;
  const leadScale = attacker.type === "grunt" ? 0.45 : 0.78;
  const predictedX = target.x + target.vx * leadScale;
  const predictedY = target.y + target.vy * leadScale;
  const direction = normalizeVector(predictedX - attacker.x, predictedY - attacker.y);

  attacker.cooldowns.rifle = attacker.type === "ace" ? 13 : (attacker.type === "grunt" ? 18 : 12);
  attacker.fluxSoft += attacker.type === "grunt" ? 18 : 46;

  spawnProjectile(state, {
    ownerId: attacker.id,
    targetId: target.id,
    team: attacker.team,
    weaponType: "rifle",
    x: attacker.x + direction.x * (attacker.radius + 8),
    y: attacker.y + direction.y * (attacker.radius + 8),
    vx: direction.x * speed,
    vy: direction.y * speed,
    damage: attacker.type === "grunt" ? 58 : (attacker.type === "ace" ? 128 : 144),
    radius: attacker.type === "grunt" ? 7 : 9,
    lifetimeTicks: attacker.type === "grunt" ? 30 : 28
  });

  pushFireEffect(state, attacker, target, "rifle");
  return true;
}

export function attemptSaberStrike(attacker, target, attacks = []) {
  const distance = distanceBetween(attacker, target);
  if (distance > 95) {
    return false;
  }
  attacker.cooldowns.saber = attacker.type === "ace" ? 11 : 10;
  attacker.fluxSoft += attacker.type === "ace" ? 42 : 52;
  attacks.push({
    type: "saber",
    attackerId: attacker.id,
    targetId: target.id,
    origin: { x: attacker.x, y: attacker.y },
    damage: attacker.type === "ace" ? 176 : 194
  });
  return true;
}

export function attemptFunnelBurst(attacker, target, tick, stateOrAttacks) {
  const state = normalizeProjectileState(stateOrAttacks);
  attacker.cooldowns.funnels = attacker.team === "player" ? 17 : 20;
  attacker.fluxSoft += attacker.team === "player" ? 22 : 16;
  const positions = getFunnelPositions(attacker, target, tick);

  for (const position of positions) {
    const predictedX = target.x + target.vx * 0.35;
    const predictedY = target.y + target.vy * 0.35;
    const direction = normalizeVector(predictedX - position.x, predictedY - position.y);
    spawnProjectile(state, {
      ownerId: attacker.id,
      targetId: target.id,
      team: attacker.team,
      weaponType: "funnel",
      x: position.x,
      y: position.y,
      vx: direction.x * 12.8,
      vy: direction.y * 12.8,
      damage: attacker.team === "player" ? 36 : 30,
      radius: 5,
      lifetimeTicks: 28
    });
  }

  pushFireEffect(state, attacker, target, "funnel");
  return true;
}

export function getFunnelPositions(owner, target, tick) {
  const orbit = 92;
  const speed = tick * 0.11;
  const baseOffset = owner.team === "player" ? 0 : Math.PI / 3;
  return [
    {
      x: target.x + Math.cos(speed + baseOffset) * orbit,
      y: target.y + Math.sin(speed + baseOffset) * orbit,
      angle: speed + Math.PI / 2
    },
    {
      x: target.x + Math.cos(speed + Math.PI + baseOffset) * orbit,
      y: target.y + Math.sin(speed + Math.PI + baseOffset) * orbit,
      angle: speed - Math.PI / 2
    }
  ];
}

function spawnProjectile(state, config) {
  if (!state.projectiles) {
    state.projectiles = [];
  }
  if (!state.visualEffects) {
    state.visualEffects = [];
  }
  if (!state.nextProjectileId) {
    state.nextProjectileId = 1;
  }
  state.projectiles.push({
    id: `p-${state.nextProjectileId++}`,
    ...config,
    previousX: config.x,
    previousY: config.y,
    dodgeReported: false
  });
}

function pushFireEffect(state, attacker, target, type) {
  if (!state.visualEffects) {
    state.visualEffects = [];
  }
  state.visualEffects.push({
    type: `${type}_muzzle`,
    attackerId: attacker.id,
    targetId: target.id,
    origin: { x: attacker.x, y: attacker.y },
    targetPoint: { x: target.x, y: target.y },
    team: attacker.team
  });
}

function normalizeProjectileState(stateOrRng, maybeState) {
  if (maybeState && typeof maybeState === "object") {
    return maybeState;
  }
  if (stateOrRng && typeof stateOrRng === "object" && !Array.isArray(stateOrRng)) {
    return stateOrRng;
  }
  return {
    projectiles: [],
    visualEffects: [],
    nextProjectileId: 1
  };
}

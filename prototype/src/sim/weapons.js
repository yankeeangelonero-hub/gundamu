import { angleBetweenPoints, distanceBetween, isAngleWithin, radians } from "./geometry.js";

export function collectAttacks(entity, target, tick, rng) {
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
    attemptRifleShot(entity, target, rng, attacks);
  }

  if (weapons === "saber" && entity.cooldowns.saber === 0) {
    attemptSaberStrike(entity, target, attacks);
  }

  if ((weapons === "rifle_funnels" || weapons === "funnels_only") && entity.cooldowns.funnels === 0) {
    attemptFunnelBurst(entity, target, tick, attacks);
  }

  return attacks;
}

export function attemptRifleShot(attacker, target, rng, attacks = []) {
  const distance = distanceBetween(attacker, target);
  const arc = attacker.team === "player" ? radians(14) : radians(attacker.type === "ace" ? 18 : 24);
  if (distance > 520 || !isAngleWithin(angleBetweenPoints(attacker.x, attacker.y, target.x, target.y), attacker.facing, arc)) {
    return false;
  }
  if (target.dodgeChance && distance > 140 && rng() < target.dodgeChance) {
    return false;
  }

  attacker.cooldowns.rifle = attacker.type === "ace" ? 9 : (attacker.type === "grunt" ? 12 : 8);
  attacker.fluxSoft += attacker.type === "grunt" ? 14 : 34;
  attacks.push({
    type: "rifle",
    attackerId: attacker.id,
    targetId: target.id,
    origin: { x: attacker.x, y: attacker.y },
    damage: attacker.type === "grunt" ? 22 : (attacker.type === "ace" ? 36 : 52)
  });
  return true;
}

export function attemptSaberStrike(attacker, target, attacks = []) {
  const distance = distanceBetween(attacker, target);
  if (distance > 85) {
    return false;
  }
  attacker.cooldowns.saber = attacker.type === "ace" ? 12 : 11;
  attacker.fluxSoft += attacker.type === "ace" ? 34 : 42;
  attacks.push({
    type: "saber",
    attackerId: attacker.id,
    targetId: target.id,
    origin: { x: attacker.x, y: attacker.y },
    damage: attacker.type === "ace" ? 104 : 120
  });
  return true;
}

export function attemptFunnelBurst(attacker, target, tick, attacks = []) {
  attacker.cooldowns.funnels = 13;
  const positions = getFunnelPositions(attacker, target, tick);
  for (const position of positions) {
    attacks.push({
      type: "funnel",
      attackerId: attacker.id,
      targetId: target.id,
      origin: { x: position.x, y: position.y },
      damage: attacker.team === "player" ? 18 : 14
    });
  }
  return true;
}

export function getFunnelPositions(owner, target, tick) {
  const orbit = 82;
  const speed = tick * 0.09;
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

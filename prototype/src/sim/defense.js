import { ARENA_HEIGHT, ARENA_WIDTH } from "../data/constants.js";
import {
  angleBetweenPoints,
  distanceBetween,
  dot,
  isAngleWithin,
  pointToSegmentDistance
} from "./geometry.js";

export function tickTimers(entity) {
  entity.cooldowns.rifle = Math.max(0, entity.cooldowns.rifle - 1);
  entity.cooldowns.saber = Math.max(0, entity.cooldowns.saber - 1);
  entity.cooldowns.funnels = Math.max(0, entity.cooldowns.funnels - 1);
  entity.funnelVisualTicks = Math.max(0, (entity.funnelVisualTicks || 0) - 1);
  entity.evasionCooldown = Math.max(0, entity.evasionCooldown - 1);

  if (entity.evasionBurstTicks > 0) {
    entity.evasionBurstTicks -= 1;
    if (entity.evasionBurstTicks === 0) {
      entity.evasionVector = { x: 0, y: 0 };
    }
  }

  if (entity.ventTicks > 0) {
    entity.ventTicks -= 1;
    entity.fluxSoft *= 0.68;
    entity.fluxHard *= 0.64;
    entity.shieldUp = false;
    entity.funnelMode = "idle";
    entity.funnelVisualTicks = 0;
  }

  if (entity.overloadTicks > 0) {
    entity.overloadTicks -= 1;
    entity.fluxSoft *= 0.76;
    entity.fluxHard *= 0.76;
    entity.shieldUp = false;
    entity.funnelMode = "idle";
    entity.funnelVisualTicks = 0;
  }
}

export function applyDefenseState(entity, target, state) {
  const intent = entity.intent;
  if (!intent || entity.hp <= 0) {
    return;
  }

  if (entity.ventTicks > 0 || entity.overloadTicks > 0) {
    entity.shieldUp = false;
    return;
  }

  if (intent.defense === "vent") {
    const fluxRatio = (entity.fluxSoft + entity.fluxHard) / entity.maxFlux;
    if (fluxRatio > 0.18) {
      entity.ventTicks = entity.team === "player" ? 22 : 20;
      entity.stats.vents += 1;
      entity.shieldUp = false;
      pushEvent(state, `${entity.label} vent`, "Flux purge initiated", "vent");
    }
    return;
  }

  if (intent.defense === "drop") {
    entity.shieldUp = false;
    return;
  }

  const beamThreat = target ? distanceBetween(entity, target) < 520 : false;
  const fluxRatio = (entity.fluxSoft + entity.fluxHard) / entity.maxFlux;

  if (intent.defense === "guard") {
    entity.shieldUp = beamThreat && fluxRatio < 0.97;
    return;
  }

  entity.shieldUp = beamThreat && fluxRatio < 0.84;
}

export function dissipateFlux(entity) {
  if (entity.ventTicks > 0 || entity.overloadTicks > 0) {
    return;
  }
  const rate = entity.shieldUp ? entity.dissipation * 0.55 : entity.dissipation;
  entity.fluxSoft = Math.max(0, entity.fluxSoft - rate);
}

export function checkOverload(entity, state) {
  if (entity.ventTicks > 0 || entity.overloadTicks > 0) {
    return false;
  }
  const total = entity.fluxSoft + entity.fluxHard;
  if (total >= entity.maxFlux) {
    entity.overloadTicks = entity.team === "player" ? 28 : 24;
    entity.shieldUp = false;
    entity.evasionBurstTicks = 0;
    entity.evasionVector = { x: 0, y: 0 };
    entity.stats.overloads += 1;
    pushEvent(state, `${entity.label} overload`, "Flux control failed", "overload");
    return true;
  }
  return false;
}

export function isAttackInShieldArc(target, origin) {
  const incomingAngle = angleBetweenPoints(target.x, target.y, origin.x, origin.y);
  return isAngleWithin(incomingAngle, target.facing, target.shieldArc);
}

export function resolveAttack(attack, state, getEntity) {
  const attacker = getEntity(state.entities, attack.attackerId);
  const target = getEntity(state.entities, attack.targetId);
  if (!attacker || !target || attacker.hp <= 0 || target.hp <= 0) {
    return;
  }
  if (!state.visualEffects) {
    state.visualEffects = [];
  }

  if (target.shieldUp && isAttackInShieldArc(target, attack.origin)) {
    const fluxSpike = attack.damage * target.shieldEfficiency;
    target.fluxHard += fluxSpike;
    target.stats.damageTaken += attack.damage * 0.08;
    state.visualEffects.push({
      type: "block",
      attackerId: attacker.id,
      targetId: target.id,
      origin: { x: target.x, y: target.y },
      targetPoint: { x: attack.origin.x, y: attack.origin.y },
      team: target.team
    });
    if (attacker.team === "player" && (target.ventTicks > 0 || target.overloadTicks > 0)) {
      attacker.stats.hitsOnVenting += attack.damage;
    }
    pushEvent(state, "Beam blocked", `${target.label} caught the shot on the shield`, "damage");
    return;
  }

  const mitigated = attack.damage * (1 - target.armor);
  target.hp -= mitigated;
  target.stats.damageTaken += mitigated;
  attacker.stats.damageDealt += mitigated;

  const attackAngle = angleBetweenPoints(target.x, target.y, attack.origin.x, attack.origin.y);
  if (!isAngleWithin(attackAngle, target.facing, target.shieldArc)) {
    target.stats.rearHits += mitigated;
  }

  if (attacker.team === "player" && (target.ventTicks > 0 || target.overloadTicks > 0)) {
    attacker.stats.hitsOnVenting += mitigated;
  }

  state.visualEffects.push({
    type: attack.type === "saber" ? "saber" : "impact",
    attackerId: attacker.id,
    targetId: target.id,
    origin: { x: attack.origin.x, y: attack.origin.y },
    targetPoint: { x: target.x, y: target.y },
    team: attacker.team
  });

  if (mitigated > 70 || target.hp <= 0) {
    pushEvent(
      state,
      attack.type === "saber" ? "Close punish" : "Direct hit",
      `${attacker.label} dealt ${Math.round(mitigated)} to ${target.label}`,
      "damage"
    );
  }
}

export function resolveProjectiles(state, getEntity) {
  const survivors = [];

  for (const projectile of state.projectiles) {
    projectile.previousX = projectile.x;
    projectile.previousY = projectile.y;
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;
    projectile.lifetimeTicks -= 1;

    const owner = getEntity(state.entities, projectile.ownerId);
    const target = getEntity(state.entities, projectile.targetId);
    const collision = findProjectileCollision(projectile, state, getEntity);

    if (collision) {
      const outcome = resolveProjectileHit(projectile, collision, state, owner);
      if (!outcome.destroyedProjectile) {
        survivors.push(projectile);
      }
      continue;
    }

    maybeReportDodge(projectile, target, state);

    if (projectile.lifetimeTicks > 0 && isProjectileOnField(projectile)) {
      survivors.push(projectile);
    }
  }

  state.projectiles = survivors;
}

function findProjectileCollision(projectile, state, getEntity) {
  let best = null;

  for (const entity of state.entities) {
    if (entity.hp <= 0 || entity.team === projectile.team || entity.id === projectile.ownerId) {
      continue;
    }

    const bodyDistance = pointToSegmentDistance(
      entity.x,
      entity.y,
      projectile.previousX,
      projectile.previousY,
      projectile.x,
      projectile.y
    );

    if (bodyDistance > entity.radius + projectile.radius) {
      continue;
    }

    const shielded = entity.shieldUp && isAttackInShieldArc(entity, { x: projectile.previousX, y: projectile.previousY });
    const metric = projectile.targetId === entity.id ? 0 : bodyDistance;
    if (!best || metric < best.metric) {
      best = {
        entity,
        shielded,
        metric
      };
    }
  }

  return best;
}

function resolveProjectileHit(projectile, collision, state, owner) {
  const target = collision.entity;
  if (!owner || !target) {
    return { destroyedProjectile: true };
  }

  if (collision.shielded) {
    const fluxSpike = projectile.damage * target.shieldEfficiency;
    target.fluxHard += fluxSpike;
    target.stats.damageTaken += projectile.damage * 0.05;
    state.visualEffects.push({
      type: "block",
      attackerId: owner.id,
      targetId: target.id,
      origin: { x: target.x, y: target.y },
      targetPoint: { x: projectile.x, y: projectile.y },
      team: target.team
    });
    pushEvent(state, "Beam blocked", `${target.label} caught ${weaponLabel(projectile)} fire`, "damage");
    return { destroyedProjectile: true };
  }

  const damage = projectile.damage * (1 - target.armor);
  target.hp -= damage;
  target.stats.damageTaken += damage;
  owner.stats.damageDealt += damage;

  const attackAngle = angleBetweenPoints(target.x, target.y, projectile.previousX, projectile.previousY);
  if (!isAngleWithin(attackAngle, target.facing, target.shieldArc)) {
    target.stats.rearHits += damage;
  }
  if (owner.team === "player" && (target.ventTicks > 0 || target.overloadTicks > 0)) {
    owner.stats.hitsOnVenting += damage;
  }

  state.visualEffects.push({
    type: "impact",
    attackerId: owner.id,
    targetId: target.id,
    origin: { x: projectile.previousX, y: projectile.previousY },
    targetPoint: { x: target.x, y: target.y },
    team: owner.team
  });

  pushEvent(
    state,
    target.type === "grunt" && target.hp <= 0 ? "Grunt deleted" : "Direct hit",
    `${owner.label} landed ${weaponLabel(projectile)} for ${Math.round(damage)}`,
    target.hp <= 0 ? "kill" : "damage"
  );

  return { destroyedProjectile: true };
}

function maybeReportDodge(projectile, target, state) {
  if (!target || target.hp <= 0 || projectile.dodgeReported) {
    return;
  }

  const passDistance = pointToSegmentDistance(
    target.x,
    target.y,
    projectile.previousX,
    projectile.previousY,
    projectile.x,
    projectile.y
  );
  const closePass = passDistance <= target.radius + projectile.radius + 16;
  const projectileToTargetX = target.x - projectile.x;
  const projectileToTargetY = target.y - projectile.y;
  const passedTarget = dot(projectileToTargetX, projectileToTargetY, projectile.vx, projectile.vy) < 0;

  if (closePass && passedTarget && target.recentThreatId === projectile.id && state.tick - target.recentThreatTick <= 10) {
    projectile.dodgeReported = true;
    state.visualEffects.push({
      type: "dodge",
      attackerId: projectile.ownerId,
      targetId: target.id,
      origin: { x: target.x, y: target.y },
      targetPoint: { x: projectile.x, y: projectile.y },
      team: target.team
    });
    pushEvent(state, "Beam slipped", `${target.label} weaved through incoming fire`, "rule");
  }
}

function isProjectileOnField(projectile) {
  return projectile.x > -80
    && projectile.y > -80
    && projectile.x < ARENA_WIDTH + 80
    && projectile.y < ARENA_HEIGHT + 80;
}

function weaponLabel(projectile) {
  return projectile.weaponType === "funnel" ? "funnel beam" : "beam rifle";
}

function pushEvent(state, label, description, kind) {
  if (state.events.length > 240) {
    return;
  }
  state.events.push({
    tick: state.tick,
    label,
    description,
    kind
  });
}

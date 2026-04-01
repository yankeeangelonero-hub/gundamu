import { angleBetweenPoints, distanceBetween, isAngleWithin } from "./geometry.js";

export function tickTimers(entity) {
  entity.cooldowns.rifle = Math.max(0, entity.cooldowns.rifle - 1);
  entity.cooldowns.saber = Math.max(0, entity.cooldowns.saber - 1);
  entity.cooldowns.funnels = Math.max(0, entity.cooldowns.funnels - 1);

  if (entity.ventTicks > 0) {
    entity.ventTicks -= 1;
    entity.fluxSoft *= 0.72;
    entity.fluxHard *= 0.68;
    entity.shieldUp = false;
    entity.funnelMode = "idle";
  }

  if (entity.overloadTicks > 0) {
    entity.overloadTicks -= 1;
    entity.fluxSoft *= 0.78;
    entity.fluxHard *= 0.78;
    entity.shieldUp = false;
    entity.funnelMode = "idle";
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
      entity.ventTicks = entity.team === "player" ? 24 : 22;
      entity.stats.vents += 1;
      entity.shieldUp = false;
      pushEvent(state, entity.label + " vent", "Flux purge initiated", "vent");
    }
    return;
  }

  if (intent.defense === "drop") {
    entity.shieldUp = false;
    return;
  }

  if (intent.defense === "guard") {
    entity.shieldUp = (entity.fluxSoft + entity.fluxHard) / entity.maxFlux < 0.96;
    return;
  }

  const enemyCanShoot = target ? distanceBetween(entity, target) < 420 : false;
  entity.shieldUp = enemyCanShoot && (entity.fluxSoft + entity.fluxHard) / entity.maxFlux < 0.9;
}

export function dissipateFlux(entity) {
  if (entity.ventTicks > 0 || entity.overloadTicks > 0) {
    return;
  }
  const rate = entity.shieldUp ? entity.dissipation * 0.45 : entity.dissipation;
  entity.fluxSoft = Math.max(0, entity.fluxSoft - rate);
}

export function checkOverload(entity, state) {
  if (entity.ventTicks > 0 || entity.overloadTicks > 0) {
    return false;
  }
  const total = entity.fluxSoft + entity.fluxHard;
  if (total >= entity.maxFlux) {
    entity.overloadTicks = entity.team === "player" ? 34 : 28;
    entity.shieldUp = false;
    entity.stats.overloads += 1;
    pushEvent(state, entity.label + " overload", "Flux control failed", "overload");
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

  if (target.shieldUp && isAttackInShieldArc(target, attack.origin)) {
    target.fluxHard += attack.damage * target.shieldEfficiency;
    if (target.team === "player") {
      target.stats.damageTaken += attack.damage * 0.2;
    }
    if (attacker.team === "player" && (target.ventTicks > 0 || target.overloadTicks > 0)) {
      attacker.stats.hitsOnVenting += attack.damage;
    }
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

  if (mitigated > 70 || target.hp <= 0) {
    pushEvent(
      state,
      attack.type === "saber" ? "Close punish" : "Heavy hit",
      `${attacker.label} dealt ${Math.round(mitigated)} to ${target.label}`,
      "damage"
    );
  }
}

function pushEvent(state, label, description, kind) {
  if (state.events.length > 200) {
    return;
  }
  state.events.push({
    tick: state.tick,
    label,
    description,
    kind
  });
}

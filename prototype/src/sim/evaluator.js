import { PLAYER_ID } from "../data/constants.js";
import { CONDITIONS } from "../data/catalog.js";
import { angleBetweenPoints, distanceBetween, isAngleWithin, radians } from "./geometry.js";
import { getEntity, getLivingEntities } from "./entities.js";

export function evaluateCondition(condition, player, state) {
  const target = getEntity(state.entities, player.targetId);
  const enemies = getLivingEntities(state.entities).filter((entity) => entity.team !== player.team);
  const fluxRatio = (player.fluxSoft + player.fluxHard) / player.maxFlux;
  const targetDistance = target ? distanceBetween(player, target) : 9999;

  switch (condition) {
    case "flux_high":
      return fluxRatio >= 0.72;
    case "enemy_venting":
      return !!target && (target.ventTicks > 0 || target.overloadTicks > 0);
    case "rear_threat":
      return enemies.some((enemy) => (
        distanceBetween(player, enemy) < 240 &&
        !isAngleWithin(angleBetweenPoints(player.x, player.y, enemy.x, enemy.y), player.facing, radians(130))
      ));
    case "enemy_in_rifle_arc":
      return !!target &&
        targetDistance < 520 &&
        isAngleWithin(angleBetweenPoints(player.x, player.y, target.x, target.y), player.facing, radians(14));
    case "enemy_near":
      return targetDistance < 150;
    case "enemy_far":
      return targetDistance > 360;
    case "outnumbered":
      return enemies.length > 1;
    case "always":
      return true;
    default:
      return false;
  }
}

export function evaluatePlayerIntent(player, state, ruleSet) {
  const interrupt = ruleSet.interrupts.find((rule) => rule.enabled && evaluateCondition(rule.condition, player, state));
  if (interrupt) {
    return decorateIntent(interrupt, "INT");
  }
  const doctrine = ruleSet.doctrine.find((rule) => rule.enabled && evaluateCondition(rule.condition, player, state))
    || ruleSet.doctrine[ruleSet.doctrine.length - 1];
  return decorateIntent(doctrine, "DOC");
}

export function evaluateEnemyIntent(entity, state) {
  const player = getEntity(state.entities, PLAYER_ID);
  const distanceToPlayer = player ? distanceBetween(entity, player) : 9999;
  const totalFlux = (entity.fluxSoft + entity.fluxHard) / entity.maxFlux;
  const playerExposed = player ? (!player.shieldUp || player.ventTicks > 0 || player.overloadTicks > 0) : false;

  if (entity.type === "ace") {
    if (entity.ventTicks > 0 || entity.overloadTicks > 0) {
      return createIntent("ACE_RECOVER", "ACE · recovering", "retreat", "drop", "hold_fire");
    }
    if (totalFlux > 0.7) {
      return createIntent("ACE_VENT", "ACE · clear flux", "retreat", "vent", "hold_fire");
    }
    if (player && (player.ventTicks > 0 || player.overloadTicks > 0)) {
      return createIntent("ACE_PUNISH", "ACE · punish window", "charge", "drop", "saber");
    }
    if (playerExposed && distanceToPlayer < 260) {
      return createIntent("ACE_BREAK", "ACE · break posture", "charge", "drop", "rifle");
    }
    if (distanceToPlayer < 120) {
      return createIntent("ACE_KNIFE", "ACE · knife fight", "flank", "guard", "saber");
    }
    if (distanceToPlayer > 360) {
      return createIntent("ACE_CLOSE", "ACE · close angle", "charge", "adaptive", "rifle");
    }
    return createIntent("ACE_PRESSURE", "ACE · measured pressure", "hold_range", "adaptive", "rifle");
  }

  if (entity.ventTicks > 0 || entity.overloadTicks > 0) {
    return createIntent("GRUNT_RECOVER", "GRUNT · recovering", "retreat", "drop", "hold_fire");
  }
  if (totalFlux > 0.82) {
    return createIntent("GRUNT_SPIKE", "GRUNT · flux spike", "retreat", "drop", "hold_fire");
  }
  if (distanceToPlayer > 280) {
    return createIntent("GRUNT_PUSH", "GRUNT · push line", "charge", "guard", "rifle");
  }
  return createIntent("GRUNT_LANE", "GRUNT · hold fire lane", "hold_range", "guard", "rifle");
}

function decorateIntent(rule, prefix) {
  return {
    movement: rule.movement,
    defense: rule.defense,
    weapons: rule.weapons,
    label: `${prefix} #${rule.priority} · ${CONDITIONS[rule.condition]}`,
    key: `${prefix}:${rule.priority}:${rule.condition}:${rule.movement}:${rule.defense}:${rule.weapons}`
  };
}

function createIntent(key, label, movement, defense, weapons) {
  return { key, label, movement, defense, weapons };
}

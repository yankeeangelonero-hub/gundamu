import { MAX_TICKS } from "../data/constants.js";
import { SCENARIOS } from "../data/scenarios.js";
import { applyDefenseState, checkOverload, dissipateFlux, resolveAttack, resolveProjectiles, tickTimers } from "./defense.js";
import { captureFrame, createInitialState, getEntity, getLivingEntities } from "./entities.js";
import { evaluateEnemyIntent, evaluatePlayerIntent } from "./evaluator.js";
import { planEvasion, updateMovement } from "./movement.js";
import { createRng } from "./rng.js";
import { summarizeRuleIntent } from "./rules.js";
import { buildSummary } from "./summary.js";
import { assignTargets } from "./targeting.js";
import { collectAttacks } from "./weapons.js";

export function simulateBattle({ scenarioId, seed, rules }) {
  const session = createBattleSession({ scenarioId, seed, rules });
  while (!session.state.over && session.state.tick < MAX_TICKS) {
    advanceBattleSession(session);
  }
  return finalizeBattleSession(session);
}

export function createBattleSession({ scenarioId, seed, rules }) {
  const scenario = SCENARIOS[scenarioId];
  const rng = createRng(seed);
  const state = createInitialState(scenario);
  return {
    scenarioId,
    seed,
    rules,
    rng,
    state,
    frames: [captureFrame(state)],
    summary: null
  };
}

export function advanceBattleSession(session) {
  if (session.state.over || session.state.tick >= MAX_TICKS) {
    if (!session.summary) {
      session.summary = buildSummary(session.state);
    }
    return captureSessionSnapshot(session);
  }

  runTick(session.state, session.rules, session.rng);
  const frame = captureFrame(session.state);
  session.frames.push(frame);

  if (session.state.over || session.state.tick >= MAX_TICKS) {
    session.summary = buildSummary(session.state);
  }

  return frame;
}

export function finalizeBattleSession(session) {
  if (!session.summary) {
    session.summary = buildSummary(session.state);
  }
  return captureSessionSnapshot(session);
}

export function captureSessionSnapshot(session) {
  return {
    frames: [...session.frames],
    events: [...session.state.events],
    summary: session.summary,
    state: session.state
  };
}

export function runTick(state, rules, rng) {
  state.tick += 1;
  state.visualEffects = [];
  assignTargets(state);

  for (const entity of getLivingEntities(state.entities)) {
    tickTimers(entity);
  }

  for (const entity of getLivingEntities(state.entities)) {
    const intent = entity.team === "player"
      ? evaluatePlayerIntent(entity, state, rules)
      : evaluateEnemyIntent(entity, state);
    applyIntent(entity, intent, state);
  }

  for (const entity of getLivingEntities(state.entities)) {
    const target = getEntity(state.entities, entity.targetId);
    planEvasion(entity, state, rng, target);
    updateMovement(entity, target, state);
  }

  for (const entity of getLivingEntities(state.entities)) {
    applyDefenseState(entity, getEntity(state.entities, entity.targetId), state);
  }

  for (const entity of getLivingEntities(state.entities)) {
    const attacks = collectAttacks(entity, getEntity(state.entities, entity.targetId), state.tick, state);
    for (const attack of attacks) {
      resolveAttack(attack, state, getEntity);
    }
  }

  resolveProjectiles(state, getEntity);

  for (const entity of getLivingEntities(state.entities)) {
    dissipateFlux(entity);
    if (entity.hp <= 0) {
      entity.hp = 0;
    }
    checkOverload(entity, state);
  }

  markDeaths(state);
  checkBattleEnd(state);
}

function applyIntent(entity, intent, state) {
  entity.intent = intent;
  entity.activeRuleLabel = intent.label;
  entity.activeRuleKey = intent.key;
  entity.stats.ruleUsage[intent.key] = (entity.stats.ruleUsage[intent.key] || 0) + 1;

  if (entity.team === "player" && entity.previousIntentKey !== intent.key) {
    pushEvent(state, "Rule Shift", summarizeRuleIntent(intent), "rule");
    entity.previousIntentKey = intent.key;
  }
}

function markDeaths(state) {
  for (const entity of state.entities) {
    if (entity.hp <= 0 && !entity.destroyedAt) {
      entity.destroyedAt = state.tick;
      entity.shieldUp = false;
      entity.funnelMode = "idle";
      pushEvent(state, entity.label + " down", "Unit destroyed", "kill");
    }
  }
}

function checkBattleEnd(state) {
  const player = getEntity(state.entities, state.playerId);
  const enemiesAlive = getLivingEntities(state.entities).filter((entity) => entity.team === "enemy");
  if (!player || player.hp <= 0) {
    state.over = true;
    state.winner = "enemy";
    return;
  }
  if (enemiesAlive.length === 0) {
    state.over = true;
    state.winner = "player";
    return;
  }
  if (state.tick >= MAX_TICKS) {
    const enemyHp = enemiesAlive.reduce((sum, enemy) => sum + enemy.hp, 0);
    state.over = true;
    state.winner = player.hp > enemyHp ? "player" : "enemy";
  }
}

function pushEvent(state, label, description, kind) {
  state.events.push({
    tick: state.tick,
    label,
    description,
    kind
  });
}

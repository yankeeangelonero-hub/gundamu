import { MAX_TICKS } from "../data/constants.js";
import { SCENARIOS } from "../data/scenarios.js";
import { applyDefenseState, checkOverload, dissipateFlux, resolveAttack, tickTimers } from "./defense.js";
import { captureFrame, createInitialState, getEntity, getLivingEntities } from "./entities.js";
import { evaluateEnemyIntent, evaluatePlayerIntent } from "./evaluator.js";
import { updateMovement } from "./movement.js";
import { createRng } from "./rng.js";
import { summarizeRuleIntent } from "./rules.js";
import { buildSummary } from "./summary.js";
import { assignTargets } from "./targeting.js";
import { collectAttacks } from "./weapons.js";

export function simulateBattle({ scenarioId, seed, rules }) {
  const scenario = SCENARIOS[scenarioId];
  const rng = createRng(seed);
  const state = createInitialState(scenario);
  const frames = [captureFrame(state)];

  while (!state.over && state.tick < MAX_TICKS) {
    runTick(state, rules, rng);
    frames.push(captureFrame(state));
  }

  return {
    frames,
    events: [...state.events],
    summary: buildSummary(state)
  };
}

export function runTick(state, rules, rng) {
  state.tick += 1;
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
    updateMovement(entity, getEntity(state.entities, entity.targetId));
  }

  for (const entity of getLivingEntities(state.entities)) {
    applyDefenseState(entity, getEntity(state.entities, entity.targetId), state);
  }

  const attacks = [];
  for (const entity of getLivingEntities(state.entities)) {
    attacks.push(...collectAttacks(entity, getEntity(state.entities, entity.targetId), state.tick, rng));
  }

  for (const attack of attacks) {
    resolveAttack(attack, state, getEntity);
  }

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

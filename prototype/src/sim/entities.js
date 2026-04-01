import { PLAYER_ID } from "../data/constants.js";
import { radians } from "./geometry.js";

export function createInitialState(scenario) {
  const player = createPlayer();
  const enemies = scenario.enemies.map((enemyConfig, index) => (
    enemyConfig.kind === "ace"
      ? createAce(`ace-${index}`, enemyConfig.x, enemyConfig.y, enemyConfig.facing)
      : createGrunt(`grunt-${index}`, enemyConfig.x, enemyConfig.y, enemyConfig.facing)
  ));

  return {
    tick: 0,
    over: false,
    winner: "timeout",
    scenarioId: scenario.id,
    entities: [player, ...enemies],
    events: [],
    playerId: PLAYER_ID
  };
}

export function getEntity(entities, id) {
  return entities.find((entity) => entity.id === id) || null;
}

export function getLivingEntities(entities) {
  return entities.filter((entity) => entity.hp > 0);
}

export function cloneStats(stats) {
  return {
    damageDealt: stats.damageDealt,
    damageTaken: stats.damageTaken,
    vents: stats.vents,
    overloads: stats.overloads,
    rearHits: stats.rearHits,
    hitsOnVenting: stats.hitsOnVenting,
    ruleUsage: { ...stats.ruleUsage }
  };
}

export function captureFrame(state) {
  const player = getEntity(state.entities, PLAYER_ID);
  return {
    tick: state.tick,
    entities: state.entities.map((entity) => ({
      id: entity.id,
      label: entity.label,
      team: entity.team,
      type: entity.type,
      x: entity.x,
      y: entity.y,
      facing: entity.facing,
      radius: entity.radius,
      hp: Math.max(0, entity.hp),
      maxHp: entity.maxHp,
      fluxSoft: entity.fluxSoft,
      fluxHard: entity.fluxHard,
      maxFlux: entity.maxFlux,
      shieldUp: entity.shieldUp,
      shieldArc: entity.shieldArc,
      ventTicks: entity.ventTicks,
      overloadTicks: entity.overloadTicks,
      activeRuleLabel: entity.activeRuleLabel,
      activeRuleKey: entity.activeRuleKey,
      funnelMode: entity.funnelMode,
      funnelTarget: entity.funnelTarget,
      targetId: entity.targetId
    })),
    summary: {
      player: player ? cloneStats(player.stats) : null
    }
  };
}

function createBaseEntity({
  id,
  label,
  team,
  type,
  x,
  y,
  facing,
  radius,
  hp,
  armor,
  speed,
  accel,
  turnRate,
  shieldArc,
  shieldEfficiency,
  maxFlux,
  dissipation,
  dodgeChance = 0
}) {
  return {
    id,
    label,
    team,
    type,
    x,
    y,
    vx: 0,
    vy: 0,
    facing,
    radius,
    hp,
    maxHp: hp,
    armor,
    speed,
    accel,
    turnRate,
    shieldUp: false,
    shieldArc,
    shieldEfficiency,
    maxFlux,
    fluxSoft: 0,
    fluxHard: 0,
    dissipation,
    ventTicks: 0,
    overloadTicks: 0,
    cooldowns: { rifle: 0, saber: 0, funnels: 0 },
    funnelMode: "idle",
    funnelTarget: null,
    activeRuleKey: "BOOT",
    activeRuleLabel: "Booting Combat OS",
    previousIntentKey: null,
    targetId: null,
    intent: null,
    dodgeChance,
    stats: {
      damageDealt: 0,
      damageTaken: 0,
      vents: 0,
      overloads: 0,
      rearHits: 0,
      hitsOnVenting: 0,
      ruleUsage: {}
    }
  };
}

export function createPlayer() {
  return createBaseEntity({
    id: PLAYER_ID,
    label: "NU GUNDAM",
    team: "player",
    type: "player",
    x: 300,
    y: 430,
    facing: 0,
    radius: 24,
    hp: 1180,
    armor: 0.12,
    speed: 3.1,
    accel: 0.22,
    turnRate: radians(6.5),
    shieldArc: radians(112),
    shieldEfficiency: 0.82,
    maxFlux: 1000,
    dissipation: 13
  });
}

export function createAce(id, x, y, facing) {
  const entity = createBaseEntity({
    id,
    label: "RED COMET",
    team: "enemy",
    type: "ace",
    x,
    y,
    facing,
    radius: 22,
    hp: 980,
    armor: 0.1,
    speed: 3.45,
    accel: 0.24,
    turnRate: radians(7.4),
    shieldArc: radians(98),
    shieldEfficiency: 0.9,
    maxFlux: 900,
    dissipation: 12,
    dodgeChance: 0.22
  });
  entity.targetId = PLAYER_ID;
  entity.activeRuleLabel = "Sizing you up";
  entity.activeRuleKey = "ACE";
  return entity;
}

export function createGrunt(id, x, y, facing) {
  const entity = createBaseEntity({
    id,
    label: "JEGAN",
    team: "enemy",
    type: "grunt",
    x,
    y,
    facing,
    radius: 17,
    hp: 280,
    armor: 0.05,
    speed: 2.7,
    accel: 0.18,
    turnRate: radians(5),
    shieldArc: radians(82),
    shieldEfficiency: 1,
    maxFlux: 420,
    dissipation: 6,
    dodgeChance: 0.06
  });
  entity.targetId = PLAYER_ID;
  entity.activeRuleLabel = "Forming firing line";
  entity.activeRuleKey = "GRUNT";
  return entity;
}

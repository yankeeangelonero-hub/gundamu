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
    projectiles: [],
    events: [],
    visualEffects: [],
    nextProjectileId: 1,
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
      targetId: entity.targetId,
      evasionBurstTicks: entity.evasionBurstTicks,
      evasionVector: { ...entity.evasionVector }
    })),
    projectiles: state.projectiles.map((projectile) => ({
      id: projectile.id,
      ownerId: projectile.ownerId,
      targetId: projectile.targetId,
      team: projectile.team,
      weaponType: projectile.weaponType,
      x: projectile.x,
      y: projectile.y,
      vx: projectile.vx,
      vy: projectile.vy,
      radius: projectile.radius
    })),
    effects: state.visualEffects.map((effect) => ({
      type: effect.type,
      attackerId: effect.attackerId || null,
      targetId: effect.targetId || null,
      origin: effect.origin ? { ...effect.origin } : null,
      targetPoint: effect.targetPoint ? { ...effect.targetPoint } : null,
      damage: effect.damage || 0,
      team: effect.team || null
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
  reactionConfidence,
  predictionTicks,
  weaveStrength,
  weaveCooldown,
  misreadChance = 0,
  strafeBias = 1
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
    reactionConfidence,
    predictionTicks,
    weaveStrength,
    weaveCooldown,
    misreadChance,
    strafeBias,
    evasionCooldown: 0,
    evasionBurstTicks: 0,
    evasionVector: { x: 0, y: 0 },
    recentThreatId: null,
    recentThreatTick: -999,
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
    x: 340,
    y: 584,
    facing: 0,
    radius: 20,
    hp: 760,
    armor: 0.08,
    speed: 8.4,
    accel: 0.98,
    turnRate: radians(13.8),
    shieldArc: radians(112),
    shieldEfficiency: 0.94,
    maxFlux: 860,
    dissipation: 18,
    reactionConfidence: 0.97,
    predictionTicks: 9,
    weaveStrength: 1.9,
    weaveCooldown: 7,
    misreadChance: 0.02,
    strafeBias: 1
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
    radius: 19,
    hp: 720,
    armor: 0.07,
    speed: 8.2,
    accel: 0.92,
    turnRate: radians(14.6),
    shieldArc: radians(98),
    shieldEfficiency: 0.92,
    maxFlux: 820,
    dissipation: 17,
    reactionConfidence: 0.9,
    predictionTicks: 8,
    weaveStrength: 1.75,
    weaveCooldown: 8,
    misreadChance: 0.08,
    strafeBias: -1
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
    radius: 15,
    hp: 135,
    armor: 0.02,
    speed: 6.2,
    accel: 0.52,
    turnRate: radians(9.1),
    shieldArc: radians(82),
    shieldEfficiency: 0.88,
    maxFlux: 360,
    dissipation: 8,
    reactionConfidence: 0.46,
    predictionTicks: 5,
    weaveStrength: 1.15,
    weaveCooldown: 12,
    misreadChance: 0.28,
    strafeBias: id.length % 2 === 0 ? 1 : -1
  });
  entity.targetId = PLAYER_ID;
  entity.activeRuleLabel = "Forming firing line";
  entity.activeRuleKey = "GRUNT";
  return entity;
}

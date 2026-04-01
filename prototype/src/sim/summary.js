import { prettifyRuleKey } from "./rules.js";
import { getLivingEntities, getEntity } from "./entities.js";

export function buildSummary(state) {
  const player = getEntity(state.entities, state.playerId);
  const totalTicks = state.tick;
  const ruleUsage = Object.entries(player.stats.ruleUsage)
    .map(([key, count]) => ({
      label: prettifyRuleKey(key),
      count,
      percent: count / Math.max(totalTicks, 1),
      description: describeUsage(key)
    }))
    .sort((a, b) => b.count - a.count);

  return {
    winner: state.winner,
    durationTicks: totalTicks,
    ruleUsage,
    insights: buildInsights(state, player, ruleUsage),
    diagnosis: buildDiagnosis(state, player)
  };
}

function buildInsights(state, player, usage) {
  const insights = [];
  const enemiesAlive = getLivingEntities(state.entities).filter((entity) => entity.team === "enemy").length;

  if (state.winner === "player" && player.stats.overloads === 0) {
    insights.push("The suit never overloaded. That makes the combat OS feel disciplined, not lucky.");
  }
  if (player.stats.overloads > 0) {
    insights.push(`The suit overloaded ${player.stats.overloads} time${player.stats.overloads > 1 ? "s" : ""}. Raise the flux interrupt or make base doctrine less greedy.`);
  }
  if (player.stats.rearHits > 180) {
    insights.push("Rear-arc damage was significant. A dedicated blind-side interrupt would better sell Newtype-level awareness.");
  }
  if (player.stats.hitsOnVenting > 180) {
    insights.push("Your punish window logic is landing. The machine looked like it recognized weakness instead of simply winning a DPS race.");
  }
  if (usage[0] && usage[0].percent > 0.72) {
    insights.push("One rule dominated the battle. Add another interrupt so the OS reveals more personality under pressure.");
  }
  if (state.winner === "enemy" && enemiesAlive > 0 && player.stats.vents === 0) {
    insights.push("The machine never chose to vent. That usually means the doctrine is too brave for its own flux economy.");
  }
  if (insights.length === 0) {
    insights.push("The battle was close but readable. Small rule changes should create obvious cause-and-effect.");
  }
  return insights.slice(0, 4);
}

function buildDiagnosis(state, player) {
  const lastEvents = state.events.slice(-5);
  if (state.winner === "player") {
    return "Victory came from maintaining pressure without losing flux discipline.";
  }
  if (player.stats.overloads > 0) {
    return "Defeat was driven by flux collapse. The rival found a punish window after overload.";
  }
  const killEvent = [...lastEvents].reverse().find((event) => event.kind === "kill" || event.kind === "damage");
  return killEvent
    ? `${killEvent.description}. The battle turned there.`
    : "Defeat came from sustained pressure without a decisive interrupt changing the rhythm.";
}

function describeUsage(ruleKey) {
  if (ruleKey.includes("flux_high")) {
    return "Safety logic stepping in before the machine panics.";
  }
  if (ruleKey.includes("enemy_venting")) {
    return "Punish logic converting enemy mistakes into decisive pressure.";
  }
  if (ruleKey.includes("rear_threat")) {
    return "Situational awareness against flanks and escort pressure.";
  }
  return "Core doctrine shaping the suit's rhythm when no interrupt fires.";
}

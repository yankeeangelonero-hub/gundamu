import { CONDITIONS, DEFENSES, MOVEMENTS, WEAPONS } from "../data/catalog.js";

export function cloneRule(rule) {
  return {
    enabled: !!rule.enabled,
    condition: rule.condition,
    movement: rule.movement,
    defense: rule.defense,
    weapons: rule.weapons,
    priority: rule.priority || 0
  };
}

export function cloneRuleSet(source) {
  return applyRulePriorities({
    interrupts: source.interrupts.map(cloneRule),
    doctrine: source.doctrine.map(cloneRule)
  });
}

export function applyRulePriorities(ruleSet) {
  for (const sectionKey of ["interrupts", "doctrine"]) {
    ruleSet[sectionKey] = ruleSet[sectionKey].map((rule, index) => ({
      ...rule,
      priority: index + 1
    }));
  }
  return ruleSet;
}

export function describeRule(rule, sectionKey) {
  const prefix = sectionKey === "interrupts" ? "Interrupt" : "Doctrine";
  return `${prefix} #${rule.priority} · ${CONDITIONS[rule.condition]}`;
}

export function summarizeRuleIntent(intent) {
  return `${MOVEMENTS[intent.movement]} / ${DEFENSES[intent.defense]} / ${WEAPONS[intent.weapons]}`;
}

export function prettifyRuleKey(ruleKey) {
  const parts = ruleKey.split(":");
  if (parts.length < 6) {
    return ruleKey.replace(/_/g, " ");
  }
  const prefix = parts[0] === "INT" ? "Interrupt" : "Doctrine";
  return `${prefix} #${parts[1]} · ${CONDITIONS[parts[2]]}`;
}

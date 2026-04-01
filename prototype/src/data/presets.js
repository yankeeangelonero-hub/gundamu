function createRule(condition, movement, defense, weapons, enabled = true) {
  return { enabled, condition, movement, defense, weapons, priority: 0 };
}

export const RULE_PRESETS = {
  discipline: {
    id: "discipline",
    name: "Midrange Discipline",
    description: "Default safe spacing with conservative vents and measured punish windows.",
    interrupts: [
      createRule("flux_high", "retreat", "vent", "hold_fire"),
      createRule("enemy_venting", "charge", "drop", "saber"),
      createRule("rear_threat", "flank", "guard", "rifle_funnels")
    ],
    doctrine: [
      createRule("enemy_far", "charge", "adaptive", "rifle_funnels"),
      createRule("enemy_near", "hold_range", "guard", "saber"),
      createRule("always", "hold_range", "adaptive", "rifle")
    ]
  },
  punish: {
    id: "punish",
    name: "Vent Punish",
    description: "A greedier doctrine that tries to cash in hard when the rival gives up tempo.",
    interrupts: [
      createRule("enemy_venting", "charge", "drop", "saber"),
      createRule("flux_high", "retreat", "vent", "hold_fire"),
      createRule("rear_threat", "flank", "guard", "rifle_funnels")
    ],
    doctrine: [
      createRule("enemy_in_rifle_arc", "hold_range", "adaptive", "rifle_funnels"),
      createRule("enemy_far", "charge", "drop", "rifle_funnels"),
      createRule("always", "hold_range", "adaptive", "rifle")
    ]
  }
};

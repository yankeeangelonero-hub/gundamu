import { applyRulePriorities } from "../sim/rules.js";

function createRule(condition, movement, defense, weapons, enabled = true) {
  return { enabled, condition, movement, defense, weapons, priority: 0 };
}

export const SUIT_CORES = {
  nu_gundam: {
    id: "nu_gundam",
    name: "Nu Gundam Core",
    summary: "Elite midrange duelist with reactive weave, disciplined shield use, and lethal punish instincts.",
    hardpoints: 8,
    osCapacity: 6,
    builtInTraits: [
      "Reactive weave",
      "Shield discipline",
      "Midrange beam duelist",
      "Ace punish instinct"
    ],
    lockedSystems: ["Shield", "Beam saber"]
  }
};

export const EQUIPMENT_CARDS = {
  beam_rifle: {
    id: "beam_rifle",
    name: "Beam Rifle",
    category: "weapon",
    hardpointCost: 3,
    summary: "Primary lane-control weapon for clean beam confirms."
  },
  precision_fire_control: {
    id: "precision_fire_control",
    name: "Precision Fire Control",
    category: "fire_control",
    hardpointCost: 2,
    summary: "Slower, cleaner beam timing and tighter firing discipline."
  },
  funnels: {
    id: "funnels",
    name: "Funnels",
    category: "support",
    hardpointCost: 3,
    summary: "Remote pressure package for off-angle setups and screens."
  },
  high_output_thrusters: {
    id: "high_output_thrusters",
    name: "High Output Thrusters",
    category: "mobility",
    hardpointCost: 2,
    summary: "Stronger entry and cleaner escape after a commit."
  }
};

export const CHAIN_CARDS = {
  approach: {
    long_range: {
      id: "long_range",
      name: "Long Range",
      osCost: 1,
      summary: "Open the fight by widening distance and building a firing lane."
    },
    midrange_pressure: {
      id: "midrange_pressure",
      name: "Midrange Pressure",
      osCost: 1,
      summary: "Hold composed duel distance and pressure steadily."
    },
    counter_flank: {
      id: "counter_flank",
      name: "Counter-Flank",
      osCost: 1,
      summary: "Stabilize against rear threats and escort pressure first."
    }
  },
  setup: {
    precision_shots: {
      id: "precision_shots",
      name: "Precision Shots",
      osCost: 2,
      requiresEquipment: ["beam_rifle", "precision_fire_control"],
      summary: "Delay fire until the lane is clean, then force a shield response."
    },
    funnel_pincer: {
      id: "funnel_pincer",
      name: "Funnel Pincer",
      osCost: 2,
      requiresEquipment: ["funnels"],
      summary: "Use remote pressure to open angles and force reactions."
    },
    shield_turn: {
      id: "shield_turn",
      name: "Shield Turn",
      osCost: 1,
      requiresEquipment: ["beam_rifle"],
      summary: "Pressure the guard, then shift line to expose the target."
    }
  },
  convert: {
    beam_confirm: {
      id: "beam_confirm",
      name: "Beam Confirm",
      osCost: 2,
      requiresEquipment: ["beam_rifle"],
      summary: "Cash in clean beam openings with a decisive rifle hit."
    },
    vent_punish: {
      id: "vent_punish",
      name: "Vent Punish",
      osCost: 2,
      summary: "Explode into enemy recovery windows and overextensions."
    },
    saber_entry: {
      id: "saber_entry",
      name: "Saber Entry",
      osCost: 2,
      requiresEquipment: ["high_output_thrusters"],
      summary: "Hard-commit to melee when the window opens."
    }
  },
  exit: {
    break_away: {
      id: "break_away",
      name: "Break Away",
      osCost: 1,
      summary: "Reset into safe spacing after a successful commit."
    },
    cool_vent: {
      id: "cool_vent",
      name: "Cool Vent",
      osCost: 1,
      summary: "Stabilize flux and reset before the next cycle."
    },
    reangle_guard: {
      id: "reangle_guard",
      name: "Re-angle Guard",
      osCost: 1,
      summary: "Recover while reestablishing a safe shield line."
    }
  }
};

export const BUILD_PRESETS = {
  beam_duelist: {
    id: "beam_duelist",
    name: "Beam Duelist",
    summary: "Long lane, clean beam setup, decisive confirm, then reset.",
    suitId: "nu_gundam",
    equipment: ["beam_rifle", "precision_fire_control", "high_output_thrusters"],
    chain: {
      approach: "long_range",
      setup: "precision_shots",
      convert: "beam_confirm",
      exit: "break_away"
    }
  },
  pincer_punish: {
    id: "pincer_punish",
    name: "Pincer Punish",
    summary: "Hold pressure, open the guard, then punish hard when the line breaks.",
    suitId: "nu_gundam",
    equipment: ["beam_rifle", "funnels", ""],
    chain: {
      approach: "midrange_pressure",
      setup: "funnel_pincer",
      convert: "vent_punish",
      exit: "break_away"
    }
  }
};

export function cloneBuild(build) {
  return {
    id: build.id,
    name: build.name,
    summary: build.summary,
    suitId: build.suitId,
    equipment: [...build.equipment],
    chain: { ...build.chain }
  };
}

export function getSuitCore(build) {
  return SUIT_CORES[build.suitId] || SUIT_CORES.nu_gundam;
}

export function getEquipmentCard(cardId) {
  return EQUIPMENT_CARDS[cardId] || null;
}

export function getChainCard(slot, cardId) {
  return CHAIN_CARDS[slot]?.[cardId] || null;
}

export function calculateBuildStats(build) {
  const core = getSuitCore(build);
  const hardpointsUsed = build.equipment.reduce((sum, cardId) => sum + (getEquipmentCard(cardId)?.hardpointCost || 0), 0);
  const osUsed = Object.entries(build.chain).reduce((sum, [slot, cardId]) => sum + (getChainCard(slot, cardId)?.osCost || 0), 0);
  const warnings = [];

  if (hardpointsUsed > core.hardpoints) {
    warnings.push(`Hardpoints exceeded: ${hardpointsUsed} / ${core.hardpoints}`);
  }
  if (osUsed > core.osCapacity) {
    warnings.push(`OS capacity exceeded: ${osUsed} / ${core.osCapacity}`);
  }

  for (const slot of Object.keys(build.chain)) {
    const card = getChainCard(slot, build.chain[slot]);
    if (!card?.requiresEquipment) {
      continue;
    }
    const missing = card.requiresEquipment.filter((equipmentId) => !build.equipment.includes(equipmentId));
    if (missing.length > 0) {
      warnings.push(`${card.name} needs ${missing.map((id) => EQUIPMENT_CARDS[id].name).join(", ")}`);
    }
  }

  if (!build.equipment.includes("beam_rifle")) {
    warnings.push("Beam Rifle is strongly recommended for the current prototype.");
  }

  return {
    core,
    hardpointsUsed,
    hardpointsMax: core.hardpoints,
    osUsed,
    osMax: core.osCapacity,
    warnings
  };
}

export function compileBuildToRuleSet(build) {
  const equipment = new Set(build.equipment.filter(Boolean));
  const setup = build.chain.setup;
  const convert = build.chain.convert;
  const exit = build.chain.exit;
  const approach = build.chain.approach;

  const hasRifle = equipment.has("beam_rifle");
  const hasFunnels = equipment.has("funnels");
  const hasPrecision = equipment.has("precision_fire_control");
  const hasBoost = equipment.has("high_output_thrusters");

  const rangedWeapon = hasFunnels ? "rifle_funnels" : (hasRifle ? "rifle" : "hold_fire");
  const setupWeapon = resolveSetupWeapon(setup, { hasRifle, hasFunnels });
  const convertWeapon = resolveConvertWeapon(convert, { hasRifle, hasFunnels, hasBoost });
  const exitDefense = exit === "cool_vent" ? "vent" : (exit === "reangle_guard" ? "guard" : "vent");
  const exitMovement = exit === "reangle_guard" ? "flank" : "retreat";
  const alwaysDefense = exit === "cool_vent" ? "guard" : "adaptive";
  const closeWeapon = convert === "saber_entry" && hasBoost ? "saber" : (hasRifle ? "rifle" : rangedWeapon);

  const ruleSet = {
    interrupts: [
      createRule("flux_high", exitMovement, exitDefense, exit === "reangle_guard" ? rangedWeapon : "hold_fire"),
      createRule("enemy_venting", convert === "beam_confirm" ? "hold_range" : "charge", convert === "beam_confirm" ? "drop" : "drop", convertWeapon),
      createRule("rear_threat", approach === "counter_flank" || exit === "reangle_guard" ? "flank" : "retreat", "guard", hasFunnels ? "rifle_funnels" : closeWeapon)
    ],
    doctrine: [
      createRule(resolvePrimaryDoctrineCondition(setup, approach), resolvePrimaryDoctrineMovement(approach), "adaptive", setupWeapon),
      createRule("enemy_far", "charge", approach === "long_range" ? "adaptive" : "drop", rangedWeapon),
      createRule("always", resolveAlwaysMovement(approach), alwaysDefense, resolveAlwaysWeapon(setup, rangedWeapon, hasPrecision))
    ]
  };

  if (convert === "saber_entry" && hasBoost) {
    ruleSet.doctrine[0] = createRule("enemy_near", "charge", "drop", "saber");
  }

  if (setup === "shield_turn") {
    ruleSet.doctrine[0] = createRule("enemy_in_rifle_arc", "flank", "drop", hasRifle ? "rifle" : rangedWeapon);
  }

  return applyRulePriorities(ruleSet);
}

function resolveSetupWeapon(setup, flags) {
  if (setup === "funnel_pincer" && flags.hasFunnels) {
    return "rifle_funnels";
  }
  if ((setup === "precision_shots" || setup === "shield_turn") && flags.hasRifle) {
    return "rifle";
  }
  return flags.hasFunnels ? "rifle_funnels" : (flags.hasRifle ? "rifle" : "hold_fire");
}

function resolveConvertWeapon(convert, flags) {
  if (convert === "saber_entry" && flags.hasBoost) {
    return "saber";
  }
  if (convert === "beam_confirm" && flags.hasRifle) {
    return "rifle";
  }
  if (convert === "vent_punish") {
    if (flags.hasBoost) {
      return "saber";
    }
    return flags.hasFunnels ? "rifle_funnels" : (flags.hasRifle ? "rifle" : "hold_fire");
  }
  return flags.hasFunnels ? "rifle_funnels" : (flags.hasRifle ? "rifle" : "hold_fire");
}

function resolvePrimaryDoctrineCondition(setup, approach) {
  if (setup === "precision_shots" || setup === "shield_turn") {
    return "enemy_in_rifle_arc";
  }
  if (setup === "funnel_pincer") {
    return approach === "long_range" ? "enemy_far" : "enemy_in_rifle_arc";
  }
  return "enemy_far";
}

function resolvePrimaryDoctrineMovement(approach) {
  if (approach === "counter_flank") {
    return "flank";
  }
  if (approach === "long_range") {
    return "hold_range";
  }
  return "hold_range";
}

function resolveAlwaysMovement(approach) {
  if (approach === "long_range") {
    return "hold_range";
  }
  if (approach === "counter_flank") {
    return "flank";
  }
  return "hold_range";
}

function resolveAlwaysWeapon(setup, rangedWeapon, hasPrecision) {
  if (setup === "precision_shots" && hasPrecision) {
    return "rifle";
  }
  return rangedWeapon;
}

export const CONDITIONS = {
  flux_high: "Flux above 72%",
  enemy_venting: "Enemy is venting or overloaded",
  rear_threat: "Enemy threatening rear arc",
  enemy_in_rifle_arc: "Enemy lined up for rifle",
  enemy_near: "Enemy inside 150",
  enemy_far: "Enemy beyond 360",
  outnumbered: "More than one enemy alive",
  always: "Always"
};

export const MOVEMENTS = {
  hold_range: "Hold 280 range",
  charge: "Charge hard",
  retreat: "Retreat while facing",
  flank: "Flank to blind side"
};

export const DEFENSES = {
  adaptive: "Adaptive shield",
  guard: "Guard up",
  drop: "Drop shield",
  vent: "Vent now"
};

export const WEAPONS = {
  rifle: "Beam rifle",
  rifle_funnels: "Rifle + funnels",
  saber: "Beam saber",
  funnels_only: "Funnels only",
  hold_fire: "Hold fire"
};

export const RULE_SECTIONS = [
  { key: "interrupts", label: "Interrupts", description: "Urgent overrides that make the OS look brilliant." },
  { key: "doctrine", label: "Doctrine", description: "Default behavior when nothing urgent is happening." }
];

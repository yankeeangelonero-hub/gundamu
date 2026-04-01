import assert from "node:assert/strict";
import test from "node:test";

import { SCENARIOS } from "../src/data/scenarios.js";
import { createInitialState, getEntity } from "../src/sim/entities.js";
import { evaluatePlayerIntent } from "../src/sim/evaluator.js";
import { applyRulePriorities } from "../src/sim/rules.js";
import { assignTargets } from "../src/sim/targeting.js";

test("rule precedence: interrupts override doctrine when both can match", () => {
  const state = createInitialState(SCENARIOS.ace_duel);
  assignTargets(state);
  const player = getEntity(state.entities, state.playerId);

  const ruleSet = applyRulePriorities({
    interrupts: [
      { enabled: true, condition: "always", movement: "retreat", defense: "vent", weapons: "hold_fire" }
    ],
    doctrine: [
      { enabled: true, condition: "always", movement: "charge", defense: "adaptive", weapons: "rifle" }
    ]
  });

  const intent = evaluatePlayerIntent(player, state, ruleSet);
  assert.match(intent.key, /^INT:1:/);
  assert.equal(intent.weapons, "hold_fire");
});

import assert from "node:assert/strict";
import test from "node:test";

import { RULE_PRESETS } from "../src/data/presets.js";
import { simulateBattle } from "../src/sim/engine.js";
import { cloneRuleSet } from "../src/sim/rules.js";

test("determinism: same seed and rules produce the same battle result", () => {
  const config = {
    scenarioId: "ace_screen",
    seed: 1979,
    rules: cloneRuleSet(RULE_PRESETS.discipline)
  };

  const first = simulateBattle(config);
  const second = simulateBattle({
    ...config,
    rules: cloneRuleSet(RULE_PRESETS.discipline)
  });

  assert.equal(first.summary.winner, second.summary.winner);
  assert.equal(first.summary.durationTicks, second.summary.durationTicks);
  assert.deepEqual(
    first.events.map(({ tick, label, kind }) => ({ tick, label, kind })),
    second.events.map(({ tick, label, kind }) => ({ tick, label, kind }))
  );
});

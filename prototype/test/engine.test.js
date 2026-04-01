import assert from "node:assert/strict";
import test from "node:test";

import { RULE_PRESETS } from "../src/data/presets.js";
import { simulateBattle } from "../src/sim/engine.js";
import { createGrunt, createPlayer, getEntity } from "../src/sim/entities.js";
import { cloneRuleSet } from "../src/sim/rules.js";
import { resolveProjectiles } from "../src/sim/defense.js";

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

test("lethality: grunts die in one direct player rifle hit", () => {
  const player = createPlayer();
  const grunt = createGrunt("grunt-0", 500, 430, Math.PI);
  grunt.shieldUp = false;

  const state = {
    tick: 1,
    entities: [player, grunt],
    events: [],
    visualEffects: [],
    projectiles: [
      {
        id: "p-1",
        ownerId: player.id,
        targetId: grunt.id,
        team: "player",
        weaponType: "rifle",
        x: 470,
        y: 430,
        previousX: 470,
        previousY: 430,
        vx: 18,
        vy: 0,
        damage: 144,
        radius: 9,
        lifetimeTicks: 10,
        dodgeReported: false
      }
    ]
  };

  resolveProjectiles(state, getEntity);
  assert.ok(grunt.hp <= 0);
});

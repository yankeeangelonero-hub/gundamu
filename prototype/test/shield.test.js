import assert from "node:assert/strict";
import test from "node:test";

import { createAce, createPlayer, getEntity } from "../src/sim/entities.js";
import { resolveAttack } from "../src/sim/defense.js";

test("shielding: frontal hits become flux while rear hits go to HP", () => {
  const player = createPlayer();
  player.shieldUp = true;

  const ace = createAce("ace-0", 500, 430, Math.PI);
  ace.hp = ace.maxHp;

  const state = {
    tick: 1,
    entities: [player, ace],
    events: []
  };

  resolveAttack({
    type: "rifle",
    attackerId: ace.id,
    targetId: player.id,
    origin: { x: 500, y: 430 },
    damage: 40
  }, state, getEntity);

  assert.equal(player.hp, player.maxHp);
  assert.ok(player.fluxHard > 0);

  const priorFlux = player.fluxHard;

  resolveAttack({
    type: "rifle",
    attackerId: ace.id,
    targetId: player.id,
    origin: { x: 100, y: 430 },
    damage: 40
  }, state, getEntity);

  assert.ok(player.hp < player.maxHp);
  assert.equal(player.fluxHard, priorFlux);
});

import assert from "node:assert/strict";
import test from "node:test";

import { createAce, createGrunt, createPlayer } from "../src/sim/entities.js";
import { pickTarget } from "../src/sim/targeting.js";

test("targeting: player prioritizes the ace even if a grunt is closer", () => {
  const player = createPlayer();
  const ace = createAce("ace-0", 500, 430, Math.PI);
  const grunt = createGrunt("grunt-0", 420, 430, Math.PI);

  const targetId = pickTarget(player, [player, ace, grunt]);
  assert.equal(targetId, ace.id);
});

test("targeting: enemies always lock onto the player", () => {
  const player = createPlayer();
  const ace = createAce("ace-0", 500, 430, Math.PI);
  const grunt = createGrunt("grunt-0", 420, 430, Math.PI);

  assert.equal(pickTarget(ace, [player, ace, grunt]), player.id);
});

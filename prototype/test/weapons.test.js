import assert from "node:assert/strict";
import test from "node:test";

import { createAce, createPlayer } from "../src/sim/entities.js";
import { attemptFunnelBurst, attemptRifleShot, attemptSaberStrike } from "../src/sim/weapons.js";

test("weapons: rifle respects arc and range", () => {
  const player = createPlayer();
  const ace = createAce("ace-0", 500, 430, Math.PI);
  const attacks = [];

  assert.equal(attemptRifleShot(player, ace, () => 0.99, attacks), true);
  assert.equal(attacks.length, 1);

  player.facing = Math.PI;
  assert.equal(attemptRifleShot(player, ace, () => 0.99, attacks), false);
});

test("weapons: saber requires close range and funnels emit two attacks", () => {
  const player = createPlayer();
  const ace = createAce("ace-0", 360, 430, Math.PI);
  const attacks = [];

  assert.equal(attemptSaberStrike(player, ace, attacks), true);
  assert.equal(attemptFunnelBurst(player, ace, 10, attacks), true);
  assert.equal(attacks.filter((attack) => attack.type === "funnel").length, 2);
});

import assert from "node:assert/strict";
import test from "node:test";

import { createAce, createPlayer } from "../src/sim/entities.js";
import { attemptFunnelBurst, attemptRifleShot, attemptSaberStrike } from "../src/sim/weapons.js";

test("weapons: rifle respects arc and range", () => {
  const player = createPlayer();
  const ace = createAce("ace-0", 620, 584, Math.PI);
  const state = { projectiles: [], visualEffects: [], nextProjectileId: 1 };

  assert.equal(attemptRifleShot(player, ace, state), true);
  assert.equal(state.projectiles.length, 1);
  assert.equal(state.projectiles[0].weaponType, "rifle");

  player.facing = Math.PI;
  assert.equal(attemptRifleShot(player, ace, state), false);
});

test("weapons: saber requires close range and funnels emit two attacks", () => {
  const player = createPlayer();
  const ace = createAce("ace-0", 420, 584, Math.PI);
  const attacks = [];
  const state = { projectiles: [], visualEffects: [], nextProjectileId: 1 };

  assert.equal(attemptSaberStrike(player, ace, attacks), true);
  assert.equal(attemptFunnelBurst(player, ace, 10, state), true);
  assert.equal(attacks.filter((attack) => attack.type === "saber").length, 1);
  assert.equal(state.projectiles.filter((projectile) => projectile.weaponType === "funnel").length, 2);
});

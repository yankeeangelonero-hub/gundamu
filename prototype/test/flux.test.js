import assert from "node:assert/strict";
import test from "node:test";

import { createPlayer } from "../src/sim/entities.js";
import { applyDefenseState, checkOverload, tickTimers } from "../src/sim/defense.js";

test("flux: venting steadily clears soft and hard flux", () => {
  const player = createPlayer();
  player.intent = { defense: "vent" };
  player.fluxSoft = 400;
  player.fluxHard = 200;

  const state = { tick: 1, events: [] };
  applyDefenseState(player, null, state);
  assert.ok(player.ventTicks > 0);

  for (let index = 0; index < 4; index += 1) {
    tickTimers(player);
  }

  assert.ok(player.fluxSoft < 400);
  assert.ok(player.fluxHard < 200);
});

test("flux: overload triggers forced vulnerability", () => {
  const player = createPlayer();
  player.fluxSoft = player.maxFlux;
  const state = { tick: 1, events: [] };

  assert.equal(checkOverload(player, state), true);
  assert.ok(player.overloadTicks > 0);
  assert.equal(player.shieldUp, false);
});

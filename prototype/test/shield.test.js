import assert from "node:assert/strict";
import test from "node:test";

import { createAce, createPlayer, getEntity } from "../src/sim/entities.js";
import { resolveAttack, resolveProjectiles } from "../src/sim/defense.js";

test("shielding: frontal hits become flux while rear hits go to HP", () => {
  const player = createPlayer();
  player.shieldUp = true;

  const ace = createAce("ace-0", 620, 584, Math.PI);
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
    origin: { x: 620, y: 584 },
    damage: 40
  }, state, getEntity);

  assert.equal(player.hp, player.maxHp);
  assert.ok(player.fluxHard > 0);

  const priorFlux = player.fluxHard;

  resolveAttack({
    type: "rifle",
    attackerId: ace.id,
    targetId: player.id,
    origin: { x: 120, y: 584 },
    damage: 40
  }, state, getEntity);

  assert.ok(player.hp < player.maxHp);
  assert.equal(player.fluxHard, priorFlux);
});

test("shielding: projectile blocks on frontal arc and damages on rear arc", () => {
  const player = createPlayer();
  const ace = createAce("ace-0", 500, 430, Math.PI);
  player.shieldUp = true;

  const state = {
    tick: 1,
    entities: [player, ace],
    events: [],
    visualEffects: [],
    projectiles: [
      {
        id: "p-1",
        ownerId: ace.id,
        targetId: player.id,
        team: "enemy",
        weaponType: "rifle",
        x: 360,
        y: 584,
        previousX: 360,
        previousY: 584,
        vx: -20,
        vy: 0,
        damage: 100,
        radius: 8,
        lifetimeTicks: 10,
        dodgeReported: false
      }
    ]
  };

  resolveProjectiles(state, getEntity);
  assert.equal(player.hp, player.maxHp);
  assert.ok(player.fluxHard > 0);

  player.facing = Math.PI;
  player.fluxHard = 0;
  state.projectiles = [
    {
      id: "p-2",
        ownerId: ace.id,
        targetId: player.id,
        team: "enemy",
        weaponType: "rifle",
        x: 360,
        y: 584,
        previousX: 360,
        previousY: 584,
        vx: -20,
        vy: 0,
      damage: 100,
      radius: 8,
      lifetimeTicks: 10,
      dodgeReported: false
    }
  ];

  resolveProjectiles(state, getEntity);
  assert.ok(player.hp < player.maxHp);
  assert.equal(player.fluxHard, 0);
});

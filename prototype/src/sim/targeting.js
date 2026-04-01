import { PLAYER_ID } from "../data/constants.js";
import { distanceBetween } from "./geometry.js";

export function assignTargets(state) {
  const living = state.entities.filter((entity) => entity.hp > 0);
  for (const entity of living) {
    entity.targetId = pickTarget(entity, state.entities);
  }
}

export function pickTarget(entity, entities) {
  const enemies = entities.filter((candidate) => candidate.team !== entity.team && candidate.hp > 0);
  if (enemies.length === 0) {
    return null;
  }

  enemies.sort((a, b) => {
    if (a.type === "ace" && b.type !== "ace") {
      return -1;
    }
    if (b.type === "ace" && a.type !== "ace") {
      return 1;
    }
    return distanceBetween(entity, a) - distanceBetween(entity, b);
  });

  if (entity.team === "enemy") {
    return PLAYER_ID;
  }
  return enemies[0].id;
}

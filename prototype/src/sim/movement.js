import { ARENA_HEIGHT, ARENA_WIDTH } from "../data/constants.js";
import { angleBetweenPoints, clamp, clampMagnitude, normalizeAngle, rotateToward, distanceBetween } from "./geometry.js";

export function updateMovement(entity, target) {
  if (!target || entity.hp <= 0) {
    entity.vx *= 0.92;
    entity.vy *= 0.92;
    entity.x += entity.vx;
    entity.y += entity.vy;
    clampToArena(entity);
    return;
  }

  const intent = entity.intent || { movement: "hold_range" };
  const dist = distanceBetween(entity, target);
  const toTarget = angleBetweenPoints(entity.x, entity.y, target.x, target.y);
  let thrustAngle = entity.facing;
  let desiredFacing = toTarget;
  let thrustScale = 0.72;

  if (entity.ventTicks > 0 || entity.overloadTicks > 0) {
    thrustAngle = normalizeAngle(toTarget + Math.PI);
    thrustScale = 0.26;
  } else if (intent.movement === "charge") {
    thrustAngle = toTarget;
    thrustScale = 1;
  } else if (intent.movement === "retreat") {
    thrustAngle = normalizeAngle(toTarget + Math.PI);
    thrustScale = 0.95;
  } else if (intent.movement === "flank") {
    const flankSide = entity.id.length % 2 === 0 ? 1 : -1;
    const desiredOrbit = normalizeAngle(toTarget + flankSide * Math.PI / 2);
    thrustAngle = dist < 170 ? normalizeAngle(toTarget + Math.PI) : desiredOrbit;
    thrustScale = dist > 260 ? 1 : 0.8;
  } else if (dist > 315) {
    thrustAngle = toTarget;
    thrustScale = 0.9;
  } else if (dist < 220) {
    thrustAngle = normalizeAngle(toTarget + Math.PI);
    thrustScale = 0.8;
  } else {
    thrustAngle = normalizeAngle(toTarget + Math.PI / 2);
    thrustScale = 0.65;
  }

  entity.facing = rotateToward(entity.facing, desiredFacing, entity.turnRate);
  const accel = entity.accel * thrustScale;
  entity.vx = clampMagnitude(entity.vx + Math.cos(thrustAngle) * accel, entity.speed);
  entity.vy = clampMagnitude(entity.vy + Math.sin(thrustAngle) * accel, entity.speed);
  entity.vx *= entity.ventTicks > 0 || entity.overloadTicks > 0 ? 0.92 : 0.98;
  entity.vy *= entity.ventTicks > 0 || entity.overloadTicks > 0 ? 0.92 : 0.98;
  entity.x += entity.vx;
  entity.y += entity.vy;
  clampToArena(entity);
}

export function clampToArena(entity) {
  entity.x = clamp(entity.x, 40, ARENA_WIDTH - 40);
  entity.y = clamp(entity.y, 40, ARENA_HEIGHT - 40);
}

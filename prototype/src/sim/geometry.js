export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function clampMagnitude(value, max) {
  return clamp(value, -max, max);
}

export function radians(degrees) {
  return degrees * Math.PI / 180;
}

export function angleBetweenPoints(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function distanceBetween(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalizeAngle(angle) {
  while (angle < -Math.PI) {
    angle += Math.PI * 2;
  }
  while (angle > Math.PI) {
    angle -= Math.PI * 2;
  }
  return angle;
}

export function isAngleWithin(angle, center, width) {
  return Math.abs(normalizeAngle(angle - center)) <= width / 2;
}

export function rotateToward(current, desired, maxStep) {
  let delta = normalizeAngle(desired - current);
  if (delta > Math.PI) {
    delta -= Math.PI * 2;
  }
  if (delta < -Math.PI) {
    delta += Math.PI * 2;
  }
  if (Math.abs(delta) <= maxStep) {
    return desired;
  }
  return normalizeAngle(current + Math.sign(delta) * maxStep);
}

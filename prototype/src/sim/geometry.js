export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function clamp01(value) {
  return clamp(value, 0, 1);
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

export function distanceBetweenPoints(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

export function dot(ax, ay, bx, by) {
  return ax * bx + ay * by;
}

export function normalizeVector(x, y) {
  const length = Math.sqrt(x * x + y * y) || 1;
  return { x: x / length, y: y / length };
}

export function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return distanceBetweenPoints(px, py, x1, y1);
  }
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  const cx = x1 + dx * t;
  const cy = y1 + dy * t;
  return distanceBetweenPoints(px, py, cx, cy);
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

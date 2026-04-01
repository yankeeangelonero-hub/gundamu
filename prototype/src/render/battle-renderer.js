import { ARENA_HEIGHT, ARENA_WIDTH, EVENT_COLORS, GRID_STEP } from "../data/constants.js";
import { clamp } from "../sim/geometry.js";
import { getFunnelPositions } from "../sim/weapons.js";

export function drawBattleFrame(ctx, canvas, frame) {
  const width = canvas.width;
  const height = canvas.height;
  const scale = Math.min(width / ARENA_WIDTH, height / ARENA_HEIGHT);

  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, width, height, scale);

  const player = frame.entities.find((entity) => entity.id === "player");
  const target = player ? frame.entities.find((entity) => entity.id === player.targetId) : null;

  if (player && target) {
    drawTargetLine(ctx, player, target, scale);
  }

  drawProjectiles(ctx, frame.projectiles || [], scale);
  drawEffects(ctx, frame.effects || [], scale);

  for (const entity of frame.entities) {
    if (entity.hp <= 0 || entity.funnelMode !== "active" || !entity.funnelTarget || entity.funnelVisualTicks <= 0) {
      continue;
    }
    const targetEntity = frame.entities.find((candidate) => candidate.id === entity.funnelTarget);
    if (targetEntity && targetEntity.hp > 0) {
      drawFunnels(ctx, frame.tick, entity, targetEntity, scale);
    }
  }

  for (const entity of frame.entities) {
    if (entity.hp > 0) {
      drawEntity(ctx, entity, scale);
    }
  }

  if (player && player.hp > 0) {
    drawHudOverlay(ctx, frame, player, target, width);
  }
}

export function renderTimelineMarkers(container, events, frameCount, onJump) {
  container.innerHTML = "";
  const total = Math.max(frameCount - 1, 1);

  for (const event of events) {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "timeline-marker";
    marker.style.left = `${(event.tick / total) * 100}%`;
    marker.style.backgroundColor = EVENT_COLORS[event.kind] || EVENT_COLORS.rule;
    marker.title = `Tick ${event.tick}: ${event.label}`;
    marker.addEventListener("click", () => onJump(event.tick));
    container.appendChild(marker);
  }
}

function drawBackground(ctx, width, height, scale) {
  ctx.save();
  ctx.fillStyle = "#07101d";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(88, 215, 255, 0.08)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= ARENA_WIDTH; x += GRID_STEP) {
    const px = x * scale;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
    ctx.stroke();
  }

  for (let y = 0; y <= ARENA_HEIGHT; y += GRID_STEP) {
    const py = y * scale;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTargetLine(ctx, player, target, scale) {
  ctx.save();
  ctx.strokeStyle = "rgba(88, 215, 255, 0.4)";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(player.x * scale, player.y * scale);
  ctx.lineTo(target.x * scale, target.y * scale);
  ctx.stroke();
  ctx.restore();
}

function drawEffects(ctx, effects, scale) {
  for (const effect of effects) {
    if (effect.type === "rifle_muzzle") {
      drawMuzzleFlash(ctx, effect.origin, scale, effect.team === "player" ? "#7ce8ff" : "#ff8f8f", 18);
    } else if (effect.type === "funnel_muzzle") {
      drawMuzzleFlash(ctx, effect.origin, scale, effect.team === "player" ? "#7fffe0" : "#ffc2d0", 10);
    } else if (effect.type === "saber") {
      drawSaberArc(ctx, effect.origin, effect.targetPoint, scale);
    } else if (effect.type === "impact") {
      drawImpactFlash(ctx, effect.targetPoint, scale, effect.team === "player" ? "#7ce8ff" : "#ff9d74");
    } else if (effect.type === "block") {
      drawBlockFlash(ctx, effect.origin, scale, effect.team === "player" ? "#7ce8ff" : "#ffd27b");
    } else if (effect.type === "dodge") {
      drawDodgeFlash(ctx, effect.origin, effect.targetPoint, scale, effect.team === "player" ? "#7fffe0" : "#ffd0da");
    }
  }
}

function drawProjectiles(ctx, projectiles, scale) {
  for (const projectile of projectiles) {
    drawProjectile(ctx, projectile, scale);
  }
}

function drawProjectile(ctx, projectile, scale) {
  const x = projectile.x * scale;
  const y = projectile.y * scale;
  const tailScale = projectile.weaponType === "rifle" ? 2.9 : 1.8;
  const tailX = (projectile.x - projectile.vx * tailScale) * scale;
  const tailY = (projectile.y - projectile.vy * tailScale) * scale;
  const rifle = projectile.weaponType === "rifle";
  const color = projectile.team === "player"
    ? (rifle ? "rgba(122, 222, 255, 0.98)" : "rgba(111, 244, 190, 0.95)")
    : (rifle ? "rgba(255, 145, 145, 0.98)" : "rgba(255, 190, 214, 0.94)");
  const glow = projectile.team === "player"
    ? (rifle ? "rgba(225, 249, 255, 0.92)" : "rgba(214, 255, 246, 0.84)")
    : (rifle ? "rgba(255, 231, 231, 0.88)" : "rgba(255, 225, 235, 0.8)");
  const lineWidth = rifle ? 3.2 : 2;
  const gradient = ctx.createLinearGradient(tailX, tailY, x, y);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(rifle ? 0.35 : 0.2, glow);
  gradient.addColorStop(1, color);
  const glowGradient = ctx.createLinearGradient(tailX, tailY, x, y);
  glowGradient.addColorStop(0, "rgba(255,255,255,0)");
  glowGradient.addColorStop(0.5, glow);
  glowGradient.addColorStop(1, "rgba(255,255,255,0.98)");

  ctx.save();
  ctx.strokeStyle = glowGradient;
  ctx.lineWidth = lineWidth + 2.5;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(x, y);
  ctx.stroke();

  ctx.strokeStyle = gradient;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(x, y);
  ctx.stroke();

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, projectile.radius * scale * 0.55 + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBeamShot(ctx, origin, target, scale, color, width, glow) {
  const ox = origin.x * scale;
  const oy = origin.y * scale;
  const tx = target.x * scale;
  const ty = target.y * scale;

  ctx.save();
  ctx.strokeStyle = glow;
  ctx.lineWidth = width + 3;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(tx, ty, width * 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMuzzleFlash(ctx, origin, scale, color, radius) {
  if (!origin) {
    return;
  }
  const x = origin.x * scale;
  const y = origin.y * scale;
  const scaledRadius = radius * scale * 0.4;

  ctx.save();
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, scaledRadius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, scaledRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawImpactFlash(ctx, point, scale, color) {
  if (!point) {
    return;
  }
  const x = point.x * scale;
  const y = point.y * scale;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x + 10, y);
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x, y + 10);
  ctx.stroke();
  ctx.restore();
}

function drawBlockFlash(ctx, point, scale, color) {
  if (!point) {
    return;
  }
  const x = point.x * scale;
  const y = point.y * scale;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawDodgeFlash(ctx, origin, target, scale, color) {
  if (!origin || !target) {
    return;
  }
  drawBeamShot(ctx, origin, target, scale, color, 1.5, "rgba(255,255,255,0.4)");
}

function drawSaberArc(ctx, origin, target, scale) {
  const ox = origin.x * scale;
  const oy = origin.y * scale;
  const tx = target.x * scale;
  const ty = target.y * scale;
  const angle = Math.atan2(ty - oy, tx - ox);
  const radius = 30;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(angle);
  ctx.strokeStyle = "rgba(255, 214, 120, 0.95)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, radius, -0.55, 0.55);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, -0.55, 0.55);
  ctx.stroke();
  ctx.restore();
}

function drawEntity(ctx, entity, scale) {
  const x = entity.x * scale;
  const y = entity.y * scale;
  const radius = entity.radius * scale;
  const fill = entity.team === "player"
    ? (entity.overloadTicks > 0 ? "#ff5f5f" : "#7ce8ff")
    : (entity.type === "ace" ? "#f36a7f" : "#ff9a4f");
  const accent = entity.team === "player" ? "#d9fbff" : "#ffdc8c";

  if (entity.shieldUp) {
    drawShieldArc(ctx, x, y, radius + 8, entity.facing, entity.shieldArc, entity.team === "player" ? "rgba(88, 215, 255, 0.22)" : "rgba(255, 178, 89, 0.18)");
  }

  if (entity.evasionBurstTicks > 0) {
    drawBoostDash(ctx, x, y, radius, entity);
  }

  drawFluxRing(ctx, x, y, radius + 4, (entity.fluxSoft + entity.fluxHard) / entity.maxFlux);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(entity.facing);
  ctx.beginPath();
  ctx.moveTo(radius * 1.35, 0);
  ctx.lineTo(-radius * 0.9, radius * 0.8);
  ctx.lineTo(-radius * 0.4, 0);
  ctx.lineTo(-radius * 0.9, -radius * 0.8);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "rgba(239, 245, 255, 0.92)";
  ctx.font = "12px Consolas, monospace";
  ctx.textAlign = "center";
  ctx.fillText(entity.label, x, y - radius - 18);
  drawHealthBar(ctx, x - radius, y + radius + 10, radius * 2, entity.hp / entity.maxHp, entity.team === "player" ? "#6ff4be" : "#f36a7f");
}

function drawBoostDash(ctx, x, y, radius, entity) {
  const burstAngle = Math.atan2(entity.evasionVector.y, entity.evasionVector.x);
  const trailLength = radius * 3.8;
  const trailWidth = radius * 0.95;
  const backAngle = burstAngle + Math.PI;
  const tx = Math.cos(backAngle);
  const ty = Math.sin(backAngle);
  const px = -ty;
  const py = tx;
  const color = entity.team === "player" ? "rgba(124, 232, 255, 0.42)" : "rgba(255, 162, 162, 0.34)";
  const core = entity.team === "player" ? "rgba(236, 252, 255, 0.58)" : "rgba(255, 236, 236, 0.46)";

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + px * trailWidth, y + py * trailWidth);
  ctx.lineTo(x - px * trailWidth, y - py * trailWidth);
  ctx.lineTo(x + tx * trailLength - px * trailWidth * 0.4, y + ty * trailLength - py * trailWidth * 0.4);
  ctx.lineTo(x + tx * trailLength + px * trailWidth * 0.4, y + ty * trailLength + py * trailWidth * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = core;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + tx * trailLength, y + ty * trailLength);
  ctx.stroke();
  ctx.restore();
}

function drawShieldArc(ctx, x, y, radius, facing, shieldArc, fillStyle) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, radius, facing - shieldArc / 2, facing + shieldArc / 2);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.restore();
}

function drawFluxRing(ctx, x, y, radius, percent) {
  const color = percent < 0.5 ? "#4c8dff" : (percent < 0.8 ? "#f4b33f" : "#f14d5d");
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(percent, 0, 1));
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawHealthBar(ctx, x, y, width, percent, color) {
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * clamp(percent, 0, 1), 5);
}

function drawFunnels(ctx, tick, owner, target, scale) {
  const positions = getFunnelPositions(owner, target, tick);
  for (const position of positions) {
    const x = position.x * scale;
    const y = position.y * scale;
    const size = owner.team === "player" ? 12 : 10;
    const glow = owner.team === "player" ? "rgba(127, 255, 224, 0.34)" : "rgba(255, 168, 196, 0.28)";
    const fill = owner.team === "player" ? "#9affea" : "#ffc1d2";
    const stroke = owner.team === "player" ? "#e8fffb" : "#fff0f5";

    ctx.save();
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.8);
    gradient.addColorStop(0, glow);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(position.angle);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.78, size * 0.62);
    ctx.lineTo(-size * 0.18, 0);
    ctx.lineTo(-size * 0.78, -size * 0.62);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = owner.team === "player" ? "rgba(111, 244, 190, 0.5)" : "rgba(243, 106, 127, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(target.x * scale, target.y * scale);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawHudOverlay(ctx, frame, player, target, width) {
  ctx.save();
  ctx.fillStyle = "rgba(7, 14, 24, 0.84)";
  ctx.fillRect(18, 18, width - 36, 72);
  ctx.strokeStyle = "rgba(88, 215, 255, 0.16)";
  ctx.strokeRect(18, 18, width - 36, 72);

  const totalFlux = (player.fluxSoft + player.fluxHard) / player.maxFlux;
  drawHudBar(ctx, 36, 38, 260, 10, player.hp / player.maxHp, "#6ff4be");
  drawHudBar(ctx, 36, 60, 260, 10, totalFlux, totalFlux < 0.5 ? "#4c8dff" : (totalFlux < 0.8 ? "#f4b33f" : "#f14d5d"));

  ctx.fillStyle = "#eff5ff";
  ctx.font = "12px Consolas, monospace";
  ctx.fillText("HP", 306, 48);
  ctx.fillText("FLUX", 306, 70);

  ctx.fillStyle = "#58d7ff";
  ctx.font = "13px Consolas, monospace";
  ctx.fillText(player.activeRuleLabel, 400, 48);
  ctx.fillStyle = "#8d9db2";
  ctx.fillText(player.ventTicks > 0 ? "Venting" : (player.overloadTicks > 0 ? "Overloaded" : "Stable"), 400, 70);

  if (target) {
    const targetFlux = Math.round((target.fluxSoft + target.fluxHard) / target.maxFlux * 100);
    ctx.fillStyle = target.type === "ace" ? "#f4b33f" : "#f36a7f";
    ctx.fillText(`TARGET ${target.label} | HP ${Math.round(target.hp)} | FLUX ${targetFlux}%`, width - 360, 48);
    ctx.fillStyle = "#8d9db2";
    ctx.fillText(target.ventTicks > 0 ? "Window open" : "Holding line", width - 360, 70);
  }
  ctx.restore();
}

function drawHudBar(ctx, x, y, width, height, percent, color) {
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * clamp(percent, 0, 1), height);
}

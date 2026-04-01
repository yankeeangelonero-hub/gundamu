import { ARENA_HEIGHT, ARENA_WIDTH, EVENT_COLORS, GRID_STEP } from "../data/constants.js";
import { getFunnelPositions } from "../sim/weapons.js";
import { clamp } from "../sim/geometry.js";

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

  for (const entity of frame.entities) {
    if (entity.hp <= 0 || entity.funnelMode !== "active" || !entity.funnelTarget) {
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
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(position.angle);
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, 5);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-6, -5);
    ctx.closePath();
    ctx.fillStyle = owner.team === "player" ? "#7fffe0" : "#ffb3c2";
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = owner.team === "player" ? "rgba(111, 244, 190, 0.38)" : "rgba(243, 106, 127, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(target.x * scale, target.y * scale);
    ctx.stroke();
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
    ctx.fillText(`TARGET ${target.label} · HP ${Math.round(target.hp)} · FLUX ${targetFlux}%`, width - 360, 48);
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

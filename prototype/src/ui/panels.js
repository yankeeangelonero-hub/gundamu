import { TICK_RATE } from "../data/constants.js";

export function renderSummary(dom, sim, scenarioName, seed, onJumpToTick) {
  const summary = sim.summary;
  const winnerClass = summary.winner === "player" ? "status-win" : "status-loss";
  dom.battleStatus.innerHTML =
    `<span class="${winnerClass}">${summary.winner === "player" ? "Victory" : "Defeat"}</span> · ${formatSeconds(summary.durationTicks / TICK_RATE)} · seed ${seed} · ${scenarioName}`;
  dom.battleDiagnosis.textContent = summary.diagnosis;

  dom.insightList.innerHTML = "";
  for (const text of summary.insights) {
    const item = document.createElement("li");
    item.textContent = text;
    dom.insightList.appendChild(item);
  }

  dom.usageList.innerHTML = "";
  for (const usage of summary.ruleUsage) {
    const item = document.createElement("div");
    item.className = "usage-item";
    item.innerHTML = `
      <div class="usage-head">
        <strong>${usage.label}</strong>
        <span class="usage-meta">${usage.count} ticks · ${Math.round(usage.percent * 100)}%</span>
      </div>
      <div class="bar"><div class="bar-fill" style="width:${Math.max(usage.percent * 100, 2)}%"></div></div>
      <div class="usage-meta">${usage.description}</div>
    `;
    dom.usageList.appendChild(item);
  }

  dom.eventList.innerHTML = "";
  for (const event of [...sim.events].reverse().slice(0, 18)) {
    const item = document.createElement("div");
    item.className = "event-item";
    const jump = document.createElement("button");
    jump.type = "button";
    jump.className = "event-jump";
    jump.textContent = `t ${event.tick}`;
    jump.addEventListener("click", () => onJumpToTick(event.tick));
    const copy = document.createElement("div");
    copy.className = "event-copy";
    copy.innerHTML = `<strong>${event.label}</strong><small>${formatSeconds(event.tick / TICK_RATE)} · ${event.description}</small>`;
    item.append(jump, copy);
    dom.eventList.appendChild(item);
  }
}

export function renderFrameReadouts(dom, frame) {
  const player = frame.entities.find((entity) => entity.id === "player");
  const target = player ? frame.entities.find((entity) => entity.id === player.targetId) : null;

  dom.timelineTick.textContent = `Tick ${frame.tick}`;
  dom.timelineRule.textContent = player ? `Active rule: ${player.activeRuleLabel}` : "Player destroyed.";
  dom.playerStats.innerHTML = player ? buildPlayerMarkup(player, frame.summary.player) : "<strong>Destroyed.</strong>";
  dom.targetStats.innerHTML = target ? buildTargetMarkup(target) : "<strong>No target.</strong>";
}

function buildPlayerMarkup(player, summaryPlayer) {
  const totalFlux = Math.round(((player.fluxSoft + player.fluxHard) / player.maxFlux) * 100);
  return [
    `<strong>${player.label}</strong>`,
    `HP ${Math.round(player.hp)} / ${player.maxHp}`,
    `Flux ${totalFlux}%`,
    player.ventTicks > 0 ? '<span class="status-vent">Venting</span>' : (player.overloadTicks > 0 ? '<span class="status-loss">Overloaded</span>' : "Stable"),
    `Shield ${player.shieldUp ? "up" : "down"}`,
    `Damage dealt ${Math.round(summaryPlayer?.damageDealt || 0)}`
  ].join("<br>");
}

function buildTargetMarkup(target) {
  const totalFlux = Math.round(((target.fluxSoft + target.fluxHard) / target.maxFlux) * 100);
  return [
    `<strong>${target.label}</strong>`,
    `HP ${Math.max(0, Math.round(target.hp))} / ${target.maxHp}`,
    `Flux ${totalFlux}%`,
    target.ventTicks > 0 ? '<span class="status-vent">Venting</span>' : (target.overloadTicks > 0 ? '<span class="status-loss">Overloaded</span>' : "Pressuring"),
    `Shield ${target.shieldUp ? "up" : "down"}`
  ].join("<br>");
}

function formatSeconds(seconds) {
  return `${seconds.toFixed(1)}s`;
}

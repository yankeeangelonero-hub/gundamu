import { TICK_RATE } from "../data/constants.js";

export function renderRunningState(dom, frame, scenarioName, seed, events, ruleUsage) {
  const seconds = frame.tick / TICK_RATE;
  dom.battleStatus.innerHTML = `<span class="status-vent">Live Simulation</span> | ${formatSeconds(seconds)} | seed ${seed} | ${scenarioName}`;
  dom.battleDiagnosis.textContent = "The battle is running live. Rule usage, events, and combat readouts are updating in real time.";
  renderUsageList(dom.usageList, ruleUsage, frame.tick);
  renderEventList(dom.eventList, events);
  dom.insightList.innerHTML = "";
  const item = document.createElement("li");
  item.textContent = "Let the fight play out, then inspect the final diagnosis and rule usage.";
  dom.insightList.appendChild(item);
}

export function renderSummary(dom, sim, scenarioName, seed, onJumpToTick) {
  const summary = sim.summary;
  const winnerClass = summary.winner === "player" ? "status-win" : "status-loss";
  dom.battleStatus.innerHTML =
    `<span class="${winnerClass}">${summary.winner === "player" ? "Victory" : "Defeat"}</span> | ${formatSeconds(summary.durationTicks / TICK_RATE)} | seed ${seed} | ${scenarioName}`;
  dom.battleDiagnosis.textContent = summary.diagnosis;

  dom.insightList.innerHTML = "";
  for (const text of summary.insights) {
    const item = document.createElement("li");
    item.textContent = text;
    dom.insightList.appendChild(item);
  }

  renderUsageList(dom.usageList, summary.ruleUsage, summary.durationTicks);
  renderEventList(dom.eventList, sim.events, onJumpToTick);
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

function renderUsageList(container, usageItems, totalTicks) {
  container.innerHTML = "";
  for (const usage of usageItems) {
    const percent = usage.percent ?? (usage.count / Math.max(totalTicks, 1));
    const item = document.createElement("div");
    item.className = "usage-item";
    item.innerHTML = `
      <div class="usage-head">
        <strong>${usage.label}</strong>
        <span class="usage-meta">${usage.count} ticks | ${Math.round(percent * 100)}%</span>
      </div>
      <div class="bar"><div class="bar-fill" style="width:${Math.max(percent * 100, 2)}%"></div></div>
      <div class="usage-meta">${usage.description}</div>
    `;
    container.appendChild(item);
  }
}

function renderEventList(container, events, onJumpToTick = null) {
  container.innerHTML = "";
  for (const event of [...events].reverse().slice(0, 18)) {
    const item = document.createElement("div");
    item.className = "event-item";
    const jump = document.createElement("button");
    jump.type = "button";
    jump.className = "event-jump";
    jump.textContent = `t ${event.tick}`;
    if (onJumpToTick) {
      jump.addEventListener("click", () => onJumpToTick(event.tick));
    } else {
      jump.disabled = true;
    }
    const copy = document.createElement("div");
    copy.className = "event-copy";
    copy.innerHTML = `<strong>${event.label}</strong><small>${formatSeconds(event.tick / TICK_RATE)} | ${event.description}</small>`;
    item.append(jump, copy);
    container.appendChild(item);
  }
}

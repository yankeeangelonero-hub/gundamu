import {
  BUILD_PRESETS,
  calculateBuildStats,
  CHAIN_CARDS,
  cloneBuild,
  EQUIPMENT_CARDS,
  getChainCard,
  getEquipmentCard,
  getSuitCore
} from "../data/builds.js";

const CHAIN_SLOT_LABELS = {
  approach: "Approach",
  setup: "Setup",
  convert: "Convert",
  exit: "Exit"
};

export function renderBuildEditor({ build, roots, onBuildChange }) {
  const stats = calculateBuildStats(build);
  const core = getSuitCore(build);

  renderSuitCore(roots.suitCore, core, stats, build);
  renderEquipmentRack(roots.equipmentRack, build, onBuildChange);
  renderChain(roots.chainRack, build, onBuildChange);
  renderBuildWarnings(roots.buildWarnings, stats.warnings);
}

export function loadBuildPreset(presetId) {
  return cloneBuild(BUILD_PRESETS[presetId] || BUILD_PRESETS.beam_duelist);
}

function renderSuitCore(container, core, stats, build) {
  container.innerHTML = "";

  const shell = document.createElement("div");
  shell.className = "build-shell";

  const summary = document.createElement("div");
  summary.className = "core-summary";
  summary.innerHTML = `
    <strong>${core.name}</strong>
    <p>${core.summary}</p>
  `;
  shell.appendChild(summary);

  const traitWrap = document.createElement("div");
  traitWrap.className = "trait-wrap";
  for (const trait of core.builtInTraits) {
    const chip = document.createElement("span");
    chip.className = "trait-chip";
    chip.textContent = trait;
    traitWrap.appendChild(chip);
  }
  for (const system of core.lockedSystems) {
    const chip = document.createElement("span");
    chip.className = "trait-chip locked";
    chip.textContent = `Locked: ${system}`;
    traitWrap.appendChild(chip);
  }
  shell.appendChild(traitWrap);

  shell.appendChild(buildMeter("Hardpoints", stats.hardpointsUsed, stats.hardpointsMax));
  shell.appendChild(buildMeter("OS Capacity", stats.osUsed, stats.osMax));

  const buildName = document.createElement("div");
  buildName.className = "build-name";
  buildName.innerHTML = `
    <strong>Current Build</strong>
    <p>${build.name || "Custom Build"}${build.summary ? ` | ${build.summary}` : ""}</p>
  `;
  shell.appendChild(buildName);

  container.appendChild(shell);
}

function renderEquipmentRack(container, build, onBuildChange) {
  container.innerHTML = "";
  build.equipment.forEach((cardId, index) => {
    const card = document.createElement("div");
    card.className = "slot-card";

    const current = getEquipmentCard(cardId);
    const head = document.createElement("div");
    head.className = "slot-head";
    head.innerHTML = `<strong>Rack Slot ${index + 1}</strong><span>${current ? `${current.hardpointCost} HP` : "Empty"}</span>`;
    card.appendChild(head);

    const field = document.createElement("label");
    field.className = "field";
    field.style.marginBottom = "0";
    const select = document.createElement("select");

    appendOption(select, "", "Empty");
    for (const equipment of Object.values(EQUIPMENT_CARDS)) {
      appendOption(select, equipment.id, `${equipment.name} (${equipment.hardpointCost} HP)`);
    }
    select.value = cardId || "";
    select.addEventListener("change", () => {
      const next = cloneBuild(build);
      next.equipment[index] = select.value;
      next.id = "custom";
      next.name = "Custom Build";
      next.summary = "Hand-tuned combat package.";
      onBuildChange(next);
    });
    field.appendChild(select);
    card.appendChild(field);

    const copy = document.createElement("p");
    copy.className = "slot-copy";
    copy.textContent = current ? current.summary : "Leave the slot empty to stay under budget or keep the package focused.";
    card.appendChild(copy);

    container.appendChild(card);
  });
}

function renderChain(container, build, onBuildChange) {
  container.innerHTML = "";
  for (const [slotKey, label] of Object.entries(CHAIN_SLOT_LABELS)) {
    const cardId = build.chain[slotKey];
    const chainCard = getChainCard(slotKey, cardId);
    const card = document.createElement("div");
    card.className = "slot-card";

    const head = document.createElement("div");
    head.className = "slot-head";
    head.innerHTML = `<strong>${label}</strong><span>${chainCard ? `${chainCard.osCost} OS` : ""}</span>`;
    card.appendChild(head);

    const field = document.createElement("label");
    field.className = "field";
    field.style.marginBottom = "0";
    const select = document.createElement("select");
    for (const option of Object.values(CHAIN_CARDS[slotKey])) {
      const suffix = option.requiresEquipment?.length
        ? ` | needs ${option.requiresEquipment.map((id) => EQUIPMENT_CARDS[id].name).join(", ")}`
        : "";
      appendOption(select, option.id, `${option.name} (${option.osCost} OS)${suffix}`);
    }
    select.value = cardId;
    select.addEventListener("change", () => {
      const next = cloneBuild(build);
      next.chain[slotKey] = select.value;
      next.id = "custom";
      next.name = "Custom Build";
      next.summary = "Hand-tuned combat package.";
      onBuildChange(next);
    });
    field.appendChild(select);
    card.appendChild(field);

    const copy = document.createElement("p");
    copy.className = "slot-copy";
    copy.textContent = chainCard?.summary || "No chain card selected.";
    card.appendChild(copy);

    container.appendChild(card);
  }
}

function renderBuildWarnings(container, warnings) {
  container.innerHTML = "";
  if (warnings.length === 0) {
    const ok = document.createElement("div");
    ok.className = "build-warning ok";
    ok.textContent = "Build is valid. The current sim will compile it into a readable combat package.";
    container.appendChild(ok);
    return;
  }

  for (const warning of warnings) {
    const item = document.createElement("div");
    item.className = "build-warning";
    item.textContent = warning;
    container.appendChild(item);
  }
}

function buildMeter(label, used, max) {
  const wrap = document.createElement("div");
  wrap.className = "build-meter";
  const percent = Math.min(used / Math.max(max, 1), 1);
  wrap.innerHTML = `
    <div class="usage-head">
      <strong>${label}</strong>
      <span class="usage-meta">${used} / ${max}</span>
    </div>
    <div class="bar"><div class="bar-fill" style="width:${Math.max(percent * 100, 4)}%"></div></div>
  `;
  return wrap;
}

function appendOption(select, value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  select.appendChild(option);
}

import { RULE_PRESETS } from "./data/presets.js";
import { SCENARIOS } from "./data/scenarios.js";
import { renderTimelineMarkers, drawBattleFrame } from "./render/battle-renderer.js";
import { advanceBattleSession, createBattleSession, finalizeBattleSession } from "./sim/engine.js";
import { sanitizeSeed } from "./sim/rng.js";
import { cloneRuleSet, prettifyRuleKey } from "./sim/rules.js";
import { renderRunningState, renderSummary, renderFrameReadouts } from "./ui/panels.js";
import { createRealtimeController } from "./ui/realtime-controller.js";
import { renderRuleEditor } from "./ui/rule-editor.js";

const dom = {};
const state = {
  rules: cloneRuleSet(RULE_PRESETS.discipline),
  scenarioId: "ace_duel",
  seed: 1979,
  sim: null,
  session: null
};

let controller = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindDom();
  populateScenarioSelect();
  bindEvents();
  renderRules();
  runSimulation();
}

function bindDom() {
  dom.scenarioSelect = document.getElementById("scenarioSelect");
  dom.seedInput = document.getElementById("seedInput");
  dom.runButton = document.getElementById("runButton");
  dom.resetRulesButton = document.getElementById("resetRulesButton");
  dom.loadDisciplineButton = document.getElementById("loadDisciplineButton");
  dom.loadPunishButton = document.getElementById("loadPunishButton");
  dom.scenarioBrief = document.getElementById("scenarioBrief");
  dom.interruptRules = document.getElementById("interruptRules");
  dom.doctrineRules = document.getElementById("doctrineRules");
  dom.battleViewport = document.getElementById("battleViewport");
  dom.battleCanvas = document.getElementById("battleCanvas");
  dom.canvasContext = dom.battleCanvas.getContext("2d");
  dom.battleStatus = document.getElementById("battleStatus");
  dom.battleDiagnosis = document.getElementById("battleDiagnosis");
  dom.playPauseButton = document.getElementById("playPauseButton");
  dom.restartButton = document.getElementById("restartButton");
  dom.speedSelect = document.getElementById("speedSelect");
  dom.timelineSlider = document.getElementById("timelineSlider");
  dom.timelineMarkers = document.getElementById("timelineMarkers");
  dom.timelineTick = document.getElementById("timelineTick");
  dom.timelineRule = document.getElementById("timelineRule");
  dom.playerStats = document.getElementById("playerStats");
  dom.targetStats = document.getElementById("targetStats");
  dom.insightList = document.getElementById("insightList");
  dom.usageList = document.getElementById("usageList");
  dom.eventList = document.getElementById("eventList");
  resizeBattleCanvas();
  window.addEventListener("resize", handleViewportResize);
}

function bindEvents() {
  dom.scenarioSelect.addEventListener("change", () => {
    state.scenarioId = dom.scenarioSelect.value;
    renderScenarioBrief();
    runSimulation();
  });

  dom.seedInput.addEventListener("change", () => {
    state.seed = sanitizeSeed(dom.seedInput.value);
    dom.seedInput.value = String(state.seed);
    runSimulation();
  });

  dom.runButton.addEventListener("click", () => {
    startLiveBattle();
  });
  dom.resetRulesButton.addEventListener("click", () => {
    state.rules = cloneRuleSet(RULE_PRESETS.discipline);
    renderRules();
    runSimulation();
  });
  dom.loadDisciplineButton.addEventListener("click", () => {
    state.rules = cloneRuleSet(RULE_PRESETS.discipline);
    renderRules();
    runSimulation();
  });
  dom.loadPunishButton.addEventListener("click", () => {
    state.rules = cloneRuleSet(RULE_PRESETS.punish);
    renderRules();
    runSimulation();
  });

  dom.playPauseButton.addEventListener("click", () => {
    if (state.session?.state.over) {
      startLiveBattle();
      return;
    }
    const playing = controller.toggle();
    dom.playPauseButton.textContent = playing ? "Pause" : (state.session?.state.over ? "Play Replay" : "Resume");
  });

  dom.restartButton.addEventListener("click", () => {
    if (!state.session?.state.over) {
      return;
    }
    controller.reset();
    dom.playPauseButton.textContent = "Run Again";
  });

  dom.speedSelect.addEventListener("change", () => {
    controller.setSpeed(Number(dom.speedSelect.value) || 1);
  });

  dom.timelineSlider.addEventListener("input", () => {
    if (!state.session?.state.over) {
      return;
    }
    controller.pause();
    dom.playPauseButton.textContent = "Run Again";
    controller.setFrame(Number(dom.timelineSlider.value) || 0);
  });
}

function populateScenarioSelect() {
  for (const scenario of Object.values(SCENARIOS)) {
    const option = document.createElement("option");
    option.value = scenario.id;
    option.textContent = scenario.name;
    dom.scenarioSelect.appendChild(option);
  }
  dom.scenarioSelect.value = state.scenarioId;
  dom.seedInput.value = String(state.seed);
  renderScenarioBrief();
}

function renderScenarioBrief() {
  dom.scenarioBrief.textContent = SCENARIOS[state.scenarioId].description;
}

function renderRules() {
  renderRuleEditor({
    ruleSet: state.rules,
    roots: {
      interrupts: dom.interruptRules,
      doctrine: dom.doctrineRules
    },
    onRuleSetChange(nextRuleSet) {
      state.rules = cloneRuleSet(nextRuleSet);
      renderRules();
      buildInitialBattleState();
    }
  });
}

function runSimulation(options = {}) {
  const { autoplay = false } = options;
  buildInitialBattleState();
  if (autoplay) {
    controller.startLive();
    dom.playPauseButton.textContent = "Pause";
  }
}

function renderFrame(frameIndex) {
  const frame = state.sim.frames[frameIndex];
  resizeBattleCanvas();
  renderFrameReadouts(dom, frame);
  drawBattleFrame(dom.canvasContext, dom.battleCanvas, frame);
}

function jumpToTick(tick) {
  controller.pause();
  dom.playPauseButton.textContent = state.session?.state.over ? "Play Replay" : "Resume";
  controller.setFrame(tick);
}

function buildInitialBattleState() {
  if (controller) {
    controller.pause();
  }
  state.seed = sanitizeSeed(dom.seedInput.value);
  dom.seedInput.value = String(state.seed);
  state.session = createBattleSession({
    scenarioId: state.scenarioId,
    seed: state.seed,
    rules: cloneRuleSet(state.rules)
  });
  state.sim = {
    frames: [state.session.frames[0]],
    events: [],
    summary: {
      winner: "pending",
      durationTicks: 0,
      ruleUsage: [],
      insights: ["Run the battle live to gather real combat data."],
      diagnosis: "The sandbox is armed and waiting for a live run."
    }
  };

  controller = createRealtimeController({
    getLiveFrameCount: () => state.session.frames.length,
    onLiveTick: handleLiveTick,
    onScrubFrame: (frameIndex) => {
      dom.timelineSlider.value = String(frameIndex);
      renderFrame(frameIndex);
    },
    onBattleComplete: handleBattleComplete
  });
  controller.setSpeed(Number(dom.speedSelect.value) || 1);

  dom.playPauseButton.textContent = "Run Live";
  dom.timelineSlider.disabled = true;
  dom.timelineSlider.max = "0";
  dom.timelineSlider.value = "0";
  renderTimelineMarkers(dom.timelineMarkers, [], 1, jumpToTick);
  renderRunningState(dom, state.session.frames[0], SCENARIOS[state.scenarioId].name, state.seed, [], []);
  renderFrame(0);
}

function handleLiveTick() {
  const frame = advanceBattleSession(state.session);
  state.sim = finalizeBattleSession(state.session);
  const frameIndex = state.session.frames.length - 1;
  dom.timelineSlider.max = String(Math.max(frameIndex, 0));
  dom.timelineSlider.value = String(frameIndex);
  renderTimelineMarkers(dom.timelineMarkers, state.session.state.events, state.session.frames.length, jumpToTick);
  renderRunningState(
    dom,
    frame,
    SCENARIOS[state.scenarioId].name,
    state.seed,
    state.session.state.events,
    buildLiveUsage(state.session.state)
  );
  renderFrame(frameIndex);
  return { complete: state.session.state.over };
}

function handleBattleComplete() {
  state.sim = finalizeBattleSession(state.session);
  renderSummary(dom, state.sim, SCENARIOS[state.scenarioId].name, state.seed, jumpToTick);
  dom.timelineSlider.disabled = false;
  dom.playPauseButton.textContent = "Run Again";
}

function buildLiveUsage(currentState) {
  const player = currentState.entities.find((entity) => entity.id === "player");
  if (!player) {
    return [];
  }
  return Object.entries(player.stats.ruleUsage)
    .map(([key, count]) => ({
      label: prettifyRuleKey(key),
      count,
      percent: count / Math.max(currentState.tick, 1),
      description: describeUsage(key)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function describeUsage(ruleKey) {
  if (ruleKey.includes("flux_high")) {
    return "Safety logic stepping in before the machine panics.";
  }
  if (ruleKey.includes("enemy_venting")) {
    return "Punish logic converting enemy mistakes into decisive pressure.";
  }
  if (ruleKey.includes("rear_threat")) {
    return "Situational awareness against flanks and escort pressure.";
  }
  return "Core doctrine shaping the suit's rhythm when no interrupt fires.";
}

function startLiveBattle() {
  buildInitialBattleState();
  controller.startLive();
  dom.playPauseButton.textContent = "Pause";
}

function handleViewportResize() {
  resizeBattleCanvas();
  if (state.sim?.frames?.length) {
    const latestIndex = Math.max(0, Number(dom.timelineSlider.value || 0));
    renderFrame(latestIndex);
  }
}

function resizeBattleCanvas() {
  if (!dom.battleViewport || !dom.battleCanvas) {
    return;
  }
  const rect = dom.battleViewport.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (dom.battleCanvas.width !== width || dom.battleCanvas.height !== height) {
    dom.battleCanvas.width = width;
    dom.battleCanvas.height = height;
  }
}

import { RULE_PRESETS } from "./data/presets.js";
import { SCENARIOS } from "./data/scenarios.js";
import { renderTimelineMarkers, drawBattleFrame } from "./render/battle-renderer.js";
import { simulateBattle } from "./sim/engine.js";
import { sanitizeSeed } from "./sim/rng.js";
import { cloneRuleSet } from "./sim/rules.js";
import { renderSummary, renderFrameReadouts } from "./ui/panels.js";
import { createPlaybackController } from "./ui/playback.js";
import { renderRuleEditor } from "./ui/rule-editor.js";

const dom = {};
const state = {
  rules: cloneRuleSet(RULE_PRESETS.discipline),
  scenarioId: "ace_duel",
  seed: 1979,
  sim: null
};

let playback = null;

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

  dom.runButton.addEventListener("click", runSimulation);
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
    const playing = playback.toggle();
    dom.playPauseButton.textContent = playing ? "Pause" : "Play";
  });

  dom.restartButton.addEventListener("click", () => {
    playback.reset();
    dom.playPauseButton.textContent = "Play";
  });

  dom.speedSelect.addEventListener("change", () => {
    playback.setSpeed(Number(dom.speedSelect.value) || 1);
  });

  dom.timelineSlider.addEventListener("input", () => {
    playback.pause();
    dom.playPauseButton.textContent = "Play";
    playback.setFrame(Number(dom.timelineSlider.value) || 0);
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
      runSimulation();
    }
  });
}

function runSimulation() {
  if (playback) {
    playback.pause();
  }
  state.seed = sanitizeSeed(dom.seedInput.value);
  dom.seedInput.value = String(state.seed);
  state.sim = simulateBattle({
    scenarioId: state.scenarioId,
    seed: state.seed,
    rules: cloneRuleSet(state.rules)
  });

  playback = createPlaybackController({
    getFrameCount: () => state.sim.frames.length,
    onFrameChange: (frameIndex) => {
      dom.timelineSlider.value = String(frameIndex);
      renderFrame(frameIndex);
    }
  });
  playback.setSpeed(Number(dom.speedSelect.value) || 1);

  dom.playPauseButton.textContent = "Play";
  dom.timelineSlider.max = String(Math.max(state.sim.frames.length - 1, 0));
  dom.timelineSlider.value = "0";

  renderSummary(dom, state.sim, SCENARIOS[state.scenarioId].name, state.seed, jumpToTick);
  renderTimelineMarkers(dom.timelineMarkers, state.sim.events, state.sim.frames.length, jumpToTick);
  renderFrame(0);
}

function renderFrame(frameIndex) {
  const frame = state.sim.frames[frameIndex];
  renderFrameReadouts(dom, frame);
  drawBattleFrame(dom.canvasContext, dom.battleCanvas, frame);
}

function jumpToTick(tick) {
  playback.pause();
  dom.playPauseButton.textContent = "Play";
  playback.setFrame(tick);
}

import { TICK_RATE } from "../data/constants.js";

export function createRealtimeController({ onLiveTick, onScrubFrame, getLiveFrameCount, onBattleComplete }) {
  const state = {
    mode: "idle",
    currentFrame: 0,
    speed: 1,
    timerId: 0,
    lastTimestamp: 0,
    carryTicks: 0
  };

  function setSpeed(speed) {
    state.speed = speed;
  }

  function startLive() {
    stopTimer();
    state.mode = "live";
    state.lastTimestamp = Date.now();
    state.carryTicks = 0;
    state.timerId = setInterval(loop, 50);
  }

  function pause() {
    stopTimer();
    if (state.mode === "live") {
      state.mode = "scrub";
    }
  }

  function toggle() {
    if (state.mode === "live") {
      pause();
      return false;
    }
    startLive();
    return true;
  }

  function setFrame(frame) {
    const max = Math.max(0, getLiveFrameCount() - 1);
    state.currentFrame = Math.max(0, Math.min(Math.round(frame), max));
    state.mode = "scrub";
    onScrubFrame(state.currentFrame);
  }

  function reset() {
    pause();
    setFrame(0);
  }

  function complete() {
    stopTimer();
    state.mode = "complete";
    onBattleComplete?.();
  }

  function loop() {
    const now = Date.now();
    const elapsed = (now - state.lastTimestamp) / 1000;
    state.lastTimestamp = now;
    state.carryTicks += elapsed * TICK_RATE * state.speed;

    const wholeTicks = Math.floor(state.carryTicks);
    if (wholeTicks <= 0) {
      return;
    }
    state.carryTicks -= wholeTicks;

    for (let index = 0; index < wholeTicks; index += 1) {
      const result = onLiveTick();
      state.currentFrame = getLiveFrameCount() - 1;
      if (result?.complete) {
        complete();
        return;
      }
    }
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = 0;
    }
  }

  return {
    state,
    setSpeed,
    startLive,
    pause,
    toggle,
    setFrame,
    reset,
    complete
  };
}

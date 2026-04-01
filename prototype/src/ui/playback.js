export function createPlaybackController({ onFrameChange, getFrameCount }) {
  const state = {
    frame: 0,
    playing: false,
    speed: 1,
    rafId: 0,
    lastTimestamp: 0
  };

  function setFrame(frame) {
    const safeIndex = Math.max(0, Math.min(Math.round(frame), getFrameCount() - 1));
    state.frame = safeIndex;
    onFrameChange(safeIndex);
  }

  function setSpeed(speed) {
    state.speed = speed;
  }

  function play() {
    if (state.playing) {
      return;
    }
    state.playing = true;
    state.lastTimestamp = performance.now();
    state.rafId = requestAnimationFrame(loop);
  }

  function pause() {
    state.playing = false;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  }

  function toggle() {
    if (state.playing) {
      pause();
    } else {
      play();
    }
    return state.playing;
  }

  function reset() {
    pause();
    setFrame(0);
  }

  function loop(timestamp) {
    if (!state.playing) {
      return;
    }
    const elapsed = (timestamp - state.lastTimestamp) / 1000;
    state.lastTimestamp = timestamp;
    const nextFrame = state.frame + elapsed * 20 * state.speed;
    if (nextFrame >= getFrameCount() - 1) {
      setFrame(getFrameCount() - 1);
      pause();
      return;
    }
    setFrame(nextFrame);
    state.rafId = requestAnimationFrame(loop);
  }

  return {
    get state() {
      return state;
    },
    setFrame,
    setSpeed,
    play,
    pause,
    toggle,
    reset
  };
}

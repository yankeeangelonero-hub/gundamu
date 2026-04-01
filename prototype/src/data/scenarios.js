const CENTER_Y = 584;
const ACE_X = 1510;
const GRUNT_X = 1600;

export const SCENARIOS = {
  ace_duel: {
    id: "ace_duel",
    name: "Ace Duel",
    description: "A straight duel against a Char-like ace. Best for validating vent punish windows, spacing, and shield discipline.",
    enemies: [
      { kind: "ace", x: ACE_X, y: CENTER_Y, facing: Math.PI }
    ]
  },
  screen_test: {
    id: "screen_test",
    name: "Grunt Screen",
    description: "A Jegan screen pressures the Nu Gundam at once. This checks whether the doctrine reads rear threats and stays composed while outnumbered.",
    enemies: buildGruntScreenEnemies(3)
  },
  ace_screen: {
    id: "ace_screen",
    name: "Ace With Screen",
    description: "The rival ace comes in with a Jegan screen. This is the closest slice to the intended game: measured pressure, flank threats, and a duel hidden inside chaos.",
    enemies: buildAceScreenEnemies(3)
  }
};

export function buildScenario(baseScenarioId, jeganCount = 3) {
  const baseScenario = SCENARIOS[baseScenarioId];
  if (!baseScenario) {
    return SCENARIOS.ace_duel;
  }

  if (baseScenarioId === "ace_duel") {
    return {
      ...baseScenario,
      enemies: baseScenario.enemies.map((enemy) => ({ ...enemy }))
    };
  }

  const count = clampJeganCount(jeganCount);
  if (baseScenarioId === "screen_test") {
    return {
      ...baseScenario,
      description: `${count} Jegans pressure the Nu Gundam at once. This checks whether the doctrine reads rear threats and stays composed while outnumbered.`,
      enemies: buildGruntScreenEnemies(count)
    };
  }

  if (baseScenarioId === "ace_screen") {
    return {
      ...baseScenario,
      description: `The rival ace comes in with ${count} Jegans. This is the closest slice to the intended game: measured pressure, flank threats, and a duel hidden inside chaos.`,
      enemies: buildAceScreenEnemies(count)
    };
  }

  return {
    ...baseScenario,
    enemies: baseScenario.enemies.map((enemy) => ({ ...enemy }))
  };
}

export function clampJeganCount(value) {
  const count = Number(value) || 3;
  const valid = [3, 5, 7, 9];
  return valid.includes(count) ? count : 3;
}

function buildGruntScreenEnemies(count) {
  return buildGruntFormation(count, GRUNT_X, 230).map((enemy) => ({
    kind: "grunt",
    ...enemy
  }));
}

function buildAceScreenEnemies(count) {
  return [
    { kind: "ace", x: ACE_X, y: CENTER_Y, facing: Math.PI },
    ...buildGruntFormation(count, GRUNT_X + 25, 210).map((enemy) => ({
      kind: "grunt",
      ...enemy
    }))
  ];
}

function buildGruntFormation(count, x, spacing) {
  const enemies = [];
  const startY = CENTER_Y - ((count - 1) * spacing) / 2;

  for (let index = 0; index < count; index += 1) {
    const rowOffset = index % 2 === 0 ? 0 : 55;
    enemies.push({
      x: x - rowOffset,
      y: Math.round(startY + index * spacing),
      facing: Math.PI
    });
  }

  return enemies;
}

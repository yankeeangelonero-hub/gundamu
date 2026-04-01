export const SCENARIOS = {
  ace_duel: {
    id: "ace_duel",
    name: "Ace Duel",
    description: "A straight duel against a Char-like ace. Best for validating vent punish windows, spacing, and shield discipline.",
    enemies: [
      { kind: "ace", x: 1510, y: 584, facing: Math.PI }
    ]
  },
  screen_test: {
    id: "screen_test",
    name: "Grunt Screen",
    description: "Three grunts pressure the Nu Gundam at once. This checks whether the doctrine reads rear threats and stays composed while outnumbered.",
    enemies: [
      { kind: "grunt", x: 1490, y: 380, facing: Math.PI },
      { kind: "grunt", x: 1600, y: 584, facing: Math.PI },
      { kind: "grunt", x: 1490, y: 790, facing: Math.PI }
    ]
  },
  ace_screen: {
    id: "ace_screen",
    name: "Ace With Screen",
    description: "The rival ace comes in with two escorts. This is the closest slice to the intended game: measured pressure, flank threats, and a duel hidden inside chaos.",
    enemies: [
      { kind: "ace", x: 1510, y: 584, facing: Math.PI },
      { kind: "grunt", x: 1615, y: 410, facing: Math.PI },
      { kind: "grunt", x: 1615, y: 760, facing: Math.PI }
    ]
  }
};

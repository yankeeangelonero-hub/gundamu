export const SCENARIOS = {
  ace_duel: {
    id: "ace_duel",
    name: "Ace Duel",
    description: "A straight duel against a Char-like ace. Best for validating vent punish windows, spacing, and shield discipline.",
    enemies: [
      { kind: "ace", x: 1070, y: 430, facing: Math.PI }
    ]
  },
  screen_test: {
    id: "screen_test",
    name: "Grunt Screen",
    description: "Three grunts pressure the Nu Gundam at once. This checks whether the doctrine reads rear threats and stays composed while outnumbered.",
    enemies: [
      { kind: "grunt", x: 1080, y: 260, facing: Math.PI },
      { kind: "grunt", x: 1140, y: 430, facing: Math.PI },
      { kind: "grunt", x: 1080, y: 600, facing: Math.PI }
    ]
  },
  ace_screen: {
    id: "ace_screen",
    name: "Ace With Screen",
    description: "The rival ace comes in with two escorts. This is the closest slice to the intended game: measured pressure, flank threats, and a duel hidden inside chaos.",
    enemies: [
      { kind: "ace", x: 1080, y: 430, facing: Math.PI },
      { kind: "grunt", x: 1150, y: 290, facing: Math.PI },
      { kind: "grunt", x: 1150, y: 570, facing: Math.PI }
    ]
  }
};

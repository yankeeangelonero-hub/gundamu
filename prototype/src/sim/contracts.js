/**
 * Internal sandbox contracts used across the prototype.
 *
 * @typedef {Object} ScenarioConfig
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {Array<{kind: "ace" | "grunt", x: number, y: number, facing: number}>} enemies
 *
 * @typedef {Object} Rule
 * @property {boolean} enabled
 * @property {string} condition
 * @property {string} movement
 * @property {string} defense
 * @property {string} weapons
 * @property {number} priority
 *
 * @typedef {Object} RuleSet
 * @property {Rule[]} interrupts
 * @property {Rule[]} doctrine
 *
 * @typedef {Object} EntityState
 * @property {string} id
 * @property {string} team
 * @property {string} type
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {number} facing
 * @property {number} hp
 * @property {number} maxHp
 * @property {number} fluxSoft
 * @property {number} fluxHard
 * @property {number} maxFlux
 * @property {boolean} shieldUp
 * @property {number} ventTicks
 * @property {number} overloadTicks
 * @property {string | null} targetId
 * @property {string} activeRuleLabel
 *
 * @typedef {Object} BattleEvent
 * @property {number} tick
 * @property {string} label
 * @property {string} description
 * @property {"rule" | "vent" | "overload" | "damage" | "kill"} kind
 *
 * @typedef {Object} FrameSnapshot
 * @property {number} tick
 * @property {EntityState[]} entities
 * @property {{player: object | null}} summary
 *
 * @typedef {Object} BattleResult
 * @property {FrameSnapshot[]} frames
 * @property {BattleEvent[]} events
 * @property {{winner: string, durationTicks: number, ruleUsage: object[], insights: string[], diagnosis: string}} summary
 */

export const CONTRACTS = true;

# Card Stack + Chain System V1

## Goal
Replace the current `Interrupts + Doctrine` editor with a structure that feels less like programming a spreadsheet and more like configuring the combat mind of an elite mobile suit.

The new structure is:
- `Suit Core`
- `Equipment Rack`
- `Combat Chain`

This keeps the suit competent by default, lets the player express a build identity, and makes battle replays easier to read.

## Design Pillars
- The suit should already know how to fight.
- The player should shape style and intent, not basic competence.
- Builds should read as `plans`, not `if-then tables`.
- Replays should make chain logic legible: approach, setup, convert, exit.
- The first target aesthetic is `Nu Gundam` in `Char's Counterattack`.

## Top-Level Structure
### 1. Suit Core
Built into the suit. Free. Not editable in the first prototype pass.

The `Suit Core` controls:
- basic survival behavior
- baseline shield use
- baseline dodge timing
- default flux management
- target tracking
- default fallback behavior when no chain step is active

`Nu Gundam` Suit Core should already feel:
- disciplined at midrange
- comfortable in beam duels
- reactive to incoming fire
- smart about shield angles
- willing to punish obvious openings

### 2. Equipment Rack
Determines what tools and fire-control packages the suit can use.

The rack is constrained by `Hardpoints`.

Prototype recommendation:
- `3` equipment slots
- `8` total hardpoints

Equipment cards unlock:
- weapons
- movement packages
- fire-control packages
- support systems

### 3. Combat Chain
A short sequence of intent cards layered on top of the suit core.

The chain is constrained by `OS Capacity`.

Prototype recommendation:
- `4` chain slots
- `6` total OS points

Fixed slot order:
1. `Approach`
2. `Setup`
3. `Convert`
4. `Exit`

The suit runs its base doctrine until a chain trigger is valid, then advances through the chain. If a step fails or becomes invalid, the suit falls back to the suit core.

## Execution Model
### Core Loop
1. `Suit Core` maintains safe competent behavior.
2. `Approach` tries to shape distance, angle, and tempo.
3. `Setup` creates the opening.
4. `Convert` cashes in with the chosen weapon logic.
5. `Exit` disengages or stabilizes.
6. Control returns to `Suit Core`, then the chain may begin again.

### Failure Handling
If any step cannot proceed:
- do not freeze
- do not loop forever on the failed step
- return to `Suit Core`
- mark the chain as interrupted

This keeps the machine looking smart and avoids brittle logic.

## Data Model
### Suit Core Schema
```ts
type SuitCore = {
  id: string;
  name: string;
  summary: string;
  hardpoints: number;
  osCapacity: number;
  builtInTraits: string[];
  builtInBehaviors: string[];
  lockedSystems: string[];
};
```

### Equipment Card Schema
```ts
type EquipmentCard = {
  id: string;
  name: string;
  category: "weapon" | "fire_control" | "mobility" | "support";
  hardpointCost: number;
  grantsActions: string[];
  grantsTags: string[];
  requirements?: string[];
  incompatibilities?: string[];
  summary: string;
};
```

### Chain Card Schema
```ts
type ChainCard = {
  id: string;
  name: string;
  slot: "approach" | "setup" | "convert" | "exit";
  osCost: number;
  trigger: TriggerSpec;
  actionProfile: string;
  outputs: string[];
  requiresEquipment?: string[];
  requiresTags?: string[];
  cooldownTicks?: number;
  failFallback?: "core_reset" | "skip_to_exit" | "restart_chain";
  summary: string;
};
```

### Trigger Spec
```ts
type TriggerSpec = {
  anyOf?: string[];
  allOf?: string[];
  noneOf?: string[];
};
```

### Build Schema
```ts
type SuitBuild = {
  suitId: string;
  equipment: string[];
  chain: {
    approach: string;
    setup: string;
    convert: string;
    exit: string;
  };
};
```

## Tag Vocabulary
Keep the tag system compact and readable. Tags should describe combat state, not internal engine trivia.

### State Tags
- `neutral`
- `range_long`
- `range_mid`
- `range_close`
- `flux_high`
- `shield_up`
- `shield_down`
- `under_crossfire`
- `rear_threat`

### Setup Tags
- `lane_open`
- `angle_won`
- `enemy_shield_forced`
- `enemy_committed`
- `enemy_staggered`
- `enemy_exposed`

### Opportunity Tags
- `enemy_venting`
- `kill_window`
- `melee_window`
- `beam_window`
- `screen_broken`

### Reset Tags
- `reset_needed`
- `chain_failed`
- `safe_reset`

### Equipment Tags
- `beam_rifle_ready`
- `funnels_ready`
- `saber_ready`
- `precision_fire`
- `boost_entry`

## Slot Semantics
### Approach
How the suit wants to begin shaping the fight.

Typical jobs:
- open distance
- hold midrange
- draw line of fire
- bait enemy movement

### Setup
How the suit tries to create the opening.

Typical jobs:
- force shield turn
- create off-angle
- deploy funnels
- pressure vent

### Convert
How the suit cashes in.

Typical jobs:
- precision beam shot
- beam burst
- saber entry
- funnel pincer punish

### Exit
How the suit resets after a commit.

Typical jobs:
- break away
- stabilize flux
- re-angle shield
- widen distance again

## Nu Gundam Starter Package
### Suit Core
`Nu Gundam Core: Elite Midrange Duelist`

Summary:
- Maintains composed beam-duel spacing by default
- Uses shield intelligently against frontal fire
- Performs reactive weave dodges against beam threats
- Manages flux conservatively unless a real punish window appears
- Falls back to beam rifle pressure when chain conditions are not met

Built-in traits:
- `reactive_weave`
- `shield_discipline`
- `midrange_duelist`
- `ace_punish_instinct`

Locked systems:
- `shield`
- `beam_saber`

Budget:
- `8` hardpoints
- `6` OS capacity

## Starter Equipment Cards
### Beam Rifle
- Category: `weapon`
- Cost: `3`
- Grants: `beam_rifle_ready`
- Unlocks: accurate beam shot convert actions
- Summary: Standard primary beam weapon for lane-based dueling

### Precision Fire Control
- Category: `fire_control`
- Cost: `2`
- Grants: `precision_fire`
- Unlocks: slower, more accurate rifle converts
- Summary: Reduces shot cadence, improves timing quality

### Funnels
- Category: `support`
- Cost: `3`
- Grants: `funnels_ready`
- Unlocks: setup and convert cards that use remote weapons
- Summary: Deploys psycommu remote pressure and angle control

### High Output Thrusters
- Category: `mobility`
- Cost: `2`
- Grants: `boost_entry`
- Unlocks: harder entry and cleaner disengage
- Summary: Improves commitment and escape chains

### Hyper Bazooka
- Category: `weapon`
- Cost: `3`
- Grants: `blast_pressure`
- Unlocks: area-denial setup options
- Summary: Strong pressure tool, worse for clean duel precision

## Starter Chain Cards
### Approach Cards
#### Long Range
- Slot: `approach`
- Cost: `1`
- Trigger: `neutral`
- Action: widen distance and maintain clean firing lane
- Outputs: `range_long`, `lane_open`
- Summary: Begin the fight by forcing a long beam duel

#### Midrange Pressure
- Slot: `approach`
- Cost: `1`
- Trigger: `neutral`
- Action: hold disciplined duel distance and track shield angle
- Outputs: `range_mid`
- Summary: Default pressure approach for Nu Gundam

#### Counter-Flank
- Slot: `approach`
- Cost: `1`
- Trigger: `rear_threat` or `under_crossfire`
- Action: re-angle away from the screen and deny side pressure
- Outputs: `angle_won`
- Summary: Stabilize against escort formations first

### Setup Cards
#### Precision Shots
- Slot: `setup`
- Cost: `2`
- Requires Equipment: `Beam Rifle`, `Precision Fire Control`
- Trigger: `lane_open`
- Action: delay fire until the line is clean, then take a disciplined beam shot
- Outputs: `enemy_shield_forced`, `beam_window`
- Summary: Slower setup that tries to force a shield response

#### Funnel Pincer
- Slot: `setup`
- Cost: `2`
- Requires Equipment: `Funnels`
- Trigger: `range_mid` or `lane_open`
- Action: deploy funnels wide to create multi-angle pressure
- Outputs: `enemy_exposed`, `angle_won`
- Summary: Use remote weapons to open the guard

#### Shield Turn
- Slot: `setup`
- Cost: `1`
- Trigger: `enemy_shield_forced`
- Action: shift off-line while keeping pressure on the target
- Outputs: `enemy_exposed`
- Summary: Turn the enemy shield response into a real opening

### Convert Cards
#### Beam Confirm
- Slot: `convert`
- Cost: `2`
- Requires Equipment: `Beam Rifle`
- Trigger: `beam_window` or `enemy_exposed`
- Action: commit to a lethal rifle shot
- Outputs: `kill_window`
- Summary: Cash in clean beam openings

#### Vent Punish
- Slot: `convert`
- Cost: `2`
- Trigger: `enemy_venting` or `enemy_exposed`
- Action: aggressive burst entry for heavy damage
- Outputs: `kill_window`
- Summary: Turn enemy recovery mistakes into decisive damage

#### Saber Entry
- Slot: `convert`
- Cost: `2`
- Requires Equipment: `High Output Thrusters`
- Trigger: `melee_window` or `enemy_venting`
- Action: commit to close-range punish
- Outputs: `kill_window`
- Summary: High-risk melee cash-in card

### Exit Cards
#### Break Away
- Slot: `exit`
- Cost: `1`
- Trigger: `kill_window` or `flux_high`
- Action: widen distance and re-establish stable duel posture
- Outputs: `safe_reset`
- Summary: Clean disengage after a commitment

#### Cool Vent
- Slot: `exit`
- Cost: `1`
- Trigger: `flux_high`
- Action: create space and vent as soon as safe
- Outputs: `safe_reset`
- Summary: More conservative reset option

#### Re-angle Guard
- Slot: `exit`
- Cost: `1`
- Trigger: `under_crossfire` or `rear_threat`
- Action: rotate shield line and drift back into cover geometry
- Outputs: `safe_reset`
- Summary: Defensive reset against multiple enemies

## Example Nu Gundam Builds
### Build A: Beam Duelist
Equipment:
- `Beam Rifle` (`3`)
- `Precision Fire Control` (`2`)
- `High Output Thrusters` (`2`)

Hardpoints used:
- `7 / 8`

Chain:
- Approach: `Long Range` (`1`)
- Setup: `Precision Shots` (`2`)
- Convert: `Beam Confirm` (`2`)
- Exit: `Break Away` (`1`)

OS used:
- `6 / 6`

Playstyle:
- Open space
- take fewer cleaner shots
- force shield reaction
- land a decisive beam hit
- disengage before overcommitting

### Build B: Pincer Punish
Equipment:
- `Beam Rifle` (`3`)
- `Funnels` (`3`)

Hardpoints used:
- `6 / 8`

Chain:
- Approach: `Midrange Pressure` (`1`)
- Setup: `Funnel Pincer` (`2`)
- Convert: `Vent Punish` (`2`)
- Exit: `Break Away` (`1`)

OS used:
- `6 / 6`

Playstyle:
- hold composed pressure
- open the guard with funnels
- punish exposed targets
- reset into disciplined spacing

## UI Layout
### Left Panel: Suit Build
- `Suit Core`
  - name
  - short summary
  - built-in traits
- `Equipment Rack`
  - 3 slots
  - hardpoint meter
- `Combat Chain`
  - 4 fixed slots stacked vertically
  - `Approach -> Setup -> Convert -> Exit`
  - OS capacity meter

### Center Panel: Battle View
- Live combat canvas
- active chain step shown over player suit
- current output tag under the chain stack

### Right/Lower Panel: Readability
- `Chain Readout`
  - current step
  - why it triggered
  - last output tag produced
- `Battle Events`
  - `Lane open`
  - `Shield forced`
  - `Vent punish`
  - `Break away`
- `Outcome Insight`
  - which chain link succeeded
  - where the chain broke

## Suggested First Prototype Transition
### Remove
- large `Interrupts` list
- large `Doctrine` list

### Replace With
- `Suit Core` summary box
- `Equipment Rack` with 2-3 starting cards
- `Combat Chain` with 4 fixed slots

### Keep
- live battle rendering
- replay scrubbing after the run
- event log
- deterministic seed

## Implementation Notes
- The current engine can still use internal rule logic during transition.
- First migration pass can compile the chosen chain into internal intents instead of rewriting the whole AI at once.
- The first real goal is UI and mental-model clarity, not maximal systemic depth.

## Recommendation
Build around `Nu Gundam` first and make the system prove one fantasy:

`I configured a combat plan, watched the machine execute it, and recognized the exact moment my plan worked.`

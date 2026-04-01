# MECHA AUTOBATTLER PROTOTYPE — Claude Code Handoff
## Starsector-Style Combat Edition

## Vision

A web-based prototype for a programmable mecha autobattler with **Starsector-inspired combat**. The player programs their mech's AI behavior using a drag-and-drop card priority system, configures weapon groups and firing arcs, manages flux/energy economy, then watches the mech fight autonomously in a top-down 2D arena with facing, arcs, and shields that matter.

Think **Starsector's combat AI + Gladiabots' programming + Gundam's fantasy.** The player is the engineer who builds the mech's mind. The mech flies and fights on its own. Victory comes from clever programming, not reflexes.

The core fantasy: **"I built a mind that fights for me, and when it does something brilliant, that was MY brilliance."**

---

## Tech Stack

- **React** (Vite + TypeScript)
- **HTML Canvas** for the battle renderer (top-down 2D with rotation, arcs, particles)
- **Tailwind CSS** for UI (lab screens, card editor)
- **No external game engine** — tick-based simulation with Canvas rendering
- Single-page app, no backend needed
- Must work on desktop and mobile browsers (touch-friendly drag and drop)

---

## Core Combat Model (Starsector-Inspired)

### Facing & Rotation
Every entity (player mech, grunts, ace) has:
- **Position** (x, y)
- **Facing angle** (0-360 degrees, 0 = right/east)
- **Turn rate** (degrees per tick — heavier mechs turn slower)
- **Velocity** (current movement vector)

Facing determines:
- Which direction the entity moves when thrusting forward
- Which direction the shield covers
- Which weapons can fire (based on their mount arcs)

### Weapon Mounts & Firing Arcs
Each mech has **mount points** at specific positions relative to the mech's center, each with a firing arc:

- **Front-Fixed** (F): ~10° arc, directly forward. High damage, must aim the whole mech. (e.g., main beam rifle)
- **Front Turret** (FT): ~120° arc centered forward. Can track targets within the arc. (e.g., vulcan cannons)
- **Turret** (T): 360° arc, can fire in any direction. Lower damage to compensate. (e.g., point defense)
- **Rear** (R): ~90° arc behind the mech. Rare, defensive. (e.g., rear smoke launcher, mines)
- **Missile Hardpoint** (M): 180° forward arc, limited ammo, tracking projectiles.

The player's mech has these mount slots:
```
LEFT SHOULDER:  Front Turret (120°)  — medium weapons
RIGHT SHOULDER: Front Turret (120°)  — medium weapons  
CENTER TORSO:   Front Fixed (10°)    — heavy/main weapon
LEFT ARM:       Turret (360°)        — small/utility weapons
RIGHT ARM:      Turret (360°)        — small/utility weapons
BACK MOUNT:     Rear (90°)           — defensive systems
```

### Weapon Groups
The player assigns weapons to **up to 3 weapon groups** in the Hangar:
- **Group 1**: Typically the main gun (e.g., beam rifle on center torso)
- **Group 2**: Secondary weapons (e.g., shoulder-mounted missiles)  
- **Group 3**: Utility/point defense (e.g., arm-mounted vulcans)

Each group can be referenced independently in behavior cards:
- "Fire Group 1" vs "Fire Group 2" vs "Fire All Groups"
- Groups can have different targeting priorities

### Flux System (Energy Economy)
**Flux is the core resource that creates tactical tension.** It works like Starsector:

- **Flux Pool**: 0 to max_flux (e.g., 1000)
- **Flux Generation**: Firing weapons GENERATES flux (soft flux). Different weapons generate different amounts.
- **Shield Flux**: Absorbing hits on the shield GENERATES flux (hard flux). Hard flux can only be removed by venting.
- **Flux Dissipation**: Flux naturally dissipates at a rate per tick (e.g., 8/tick) UNLESS the shield is raised (dissipation halved while shielding) or actively firing.
- **Venting**: A deliberate action that rapidly dumps all flux (takes ~60 ticks / 3 seconds) but the mech is **completely vulnerable** during venting — no weapons, no shield, no boost dodge. This is the Starsector "vent gamble."
- **Overload**: If flux reaches 100%, the mech is **overloaded** — forced vent, shields drop, weapons offline, movement slowed for ~80 ticks. This is devastating and must be avoided.
- **Flux Percentage** is a key condition for behavior cards: "if flux > 70%, stop firing and vent" is a critical survival card.

**Flux creates the push-pull rhythm:**
- Aggressive play (firing + shielding) builds flux fast → must vent → vulnerable window
- Conservative play (selective firing, dodging instead of shielding) keeps flux low → sustained pressure
- The player programs this rhythm through their card priority stack

### Shield System
- Shield covers a **frontal arc** (default 120°, centered on facing direction)
- Shield absorbs incoming damage but converts it to flux (hard flux)
- Shield can be raised or lowered as a behavior action
- When raised, flux dissipation is halved
- Shield has no HP — it stays up until the player's AI drops it or flux overloads
- Shield arc means flanking attacks bypass the shield entirely → positioning matters

### Movement Model
Movement is thrust-based:
- Mechs accelerate in their facing direction when thrusting
- They have inertia — they don't stop instantly (deceleration rate applies)
- Turning is separate from moving — a mech can thrust forward while rotating
- **Boost dodge**: a quick lateral thrust (perpendicular to facing) that costs flux/energy. Fast repositioning but adds flux.
- Top speed varies by mech weight class / thruster choice
- Strafing is possible but slower than forward thrust

---

## Game Loop

```
BRIEFING → LAB (Hangar + Programming Deck) → SORTIE (Battle) → REPLAY → back to LAB
```

---

## Screen 1: Briefing

A mission overview screen shown before each battle.

- Display: mission name, environment flavor text, enemy composition with silhouettes
- Enemy info: approximate count, types, general behavior hints
- Example: "Operation Falling Star — Debris Field. 8 Zaku-type grunts (ranged, front-shielded). Ace: Commander Reik — high-mobility melee specialist, known for flanking attacks."
- A "PROCEED TO LAB" button
- For the prototype, hardcode 3 missions the player can select

---

## Screen 2: The Lab

Two sub-sections: Hangar and Programming Deck.

### 2A: The Hangar (Equipment + Weapon Groups)

**Top: Mech Diagram**
A top-down schematic of the player's mech showing all 6 mount points. Each mount point is clickable/tappable to assign a weapon.

**Mount Point Assignments:**

CENTER TORSO (Front Fixed, 10°) — Choose one:
- **Beam Rifle**: 50 damage, 500 range, 8 tick cooldown, generates 30 flux/shot, 40 ammo
- **Beam Cannon**: 120 damage, 350 range, 20 tick cooldown, generates 80 flux/shot, 15 ammo — heavy hitter
- **Sniper Beam**: 70 damage, 800 range, 15 tick cooldown, generates 40 flux/shot, 25 ammo — extreme range

LEFT SHOULDER (Front Turret, 120°) — Choose one:
- **Missile Rack**: 60 damage (tracking), 400 range, 25 tick cooldown, generates 20 flux/shot, 8 ammo — limited but tracks targets
- **Vulcan Cannon**: 10 damage, 200 range, 3 tick cooldown, generates 5 flux/shot, unlimited ammo — suppression
- **Beam Spray**: 25 damage (hits arc), 150 range, 10 tick cooldown, generates 15 flux/shot, unlimited — anti-swarm

RIGHT SHOULDER (Front Turret, 120°) — Same options as left shoulder

LEFT ARM (Turret, 360°) — Choose one:
- **Point Defense Gun**: 8 damage, 150 range, 2 tick cooldown, generates 3 flux/shot, unlimited — auto-targets missiles/funnels
- **Beam Saber**: 100 damage, 60 range (melee), 12 tick cooldown, generates 40 flux/hit — high damage, must be close
- **Heat Whip**: 60 damage, 120 range (medium melee), 15 tick cooldown, generates 25 flux/hit — midrange melee

RIGHT ARM (Turret, 360°) — Same options as left arm

BACK MOUNT (Rear, 90°) — Choose one:
- **Smoke Launcher**: No damage, creates vision-blocking cloud for 100 ticks, 2 uses — breaks enemy targeting
- **Mine Dropper**: 150 damage (proximity detonation), drops behind mech, 3 mines max — area denial
- **Funnel Pod**: Deploys 2 autonomous funnels (15 damage each, 12 tick cooldown, 360° turret, last 200 ticks) — remote pressure

**Weapon Group Assignment:**
Below the mech diagram, show 3 weapon group slots. The player drags weapons into groups:
- Group 1: [Center Torso Beam Rifle] + [Left Arm Beam Saber]
- Group 2: [Left Shoulder Missiles] + [Right Shoulder Vulcans]  
- Group 3: [Right Arm Point Defense]

Groups determine what fires when a card says "Fire Group X."

**Mech Configuration:**
Below weapon groups, choose:

Thruster Grade:
- **Light**: Speed 4, turn rate 6°/tick, boost dodge costs 15 flux — fast and agile but fragile feeling
- **Medium**: Speed 3, turn rate 4°/tick, boost dodge costs 25 flux — balanced
- **Heavy**: Speed 2, turn rate 2.5°/tick, boost dodge costs 35 flux — slow but high flux capacity

Shield Type:
- **Standard Shield**: 120° arc, 0.8x flux conversion (efficient)
- **Wide Shield**: 180° arc, 1.2x flux conversion (wider coverage but more expensive)
- **No Shield**: No shield, but +30% flux dissipation rate and +1 speed — dodge-focused build

Armor Class:
- **Light**: 800 HP, 0% damage reduction — glass cannon
- **Medium**: 1000 HP, 10% damage reduction — balanced
- **Heavy**: 1200 HP, 20% damage reduction, -0.5 speed — tanky

Reactor (determines flux stats):
- **Standard Reactor**: 1000 max flux, 8 dissipation/tick
- **High-Output Reactor**: 800 max flux, 12 dissipation/tick — runs hot but recovers fast
- **Stable Reactor**: 1200 max flux, 6 dissipation/tick — large pool but slow recovery

**Stat Summary Panel:**
Show calculated totals: HP, speed, turn rate, max flux, flux dissipation, shield arc, shield efficiency. Stats update live as player changes equipment.

### 2B: The Programming Deck (Card Editor)

The core gameplay interface. The player builds a **priority-ordered stack of behavior cards** for each behavior state.

Each card:
```
[PRIORITY #] | [IF condition] | [THEN action]
```

The mech evaluates cards **top to bottom every simulation tick**. The **first card whose condition is TRUE** fires its action. All cards below it are skipped that tick.

**Available Conditions:**

*Distance & Position:*
- `Nearest enemy distance` < or > [close: 150 / mid: 300 / far: 500 / extreme: 700]
- `Nearest ACE distance` < or > [same thresholds]
- `Enemy is behind me` (in rear 120° arc — flanking danger)
- `Enemy is in my weapon arc` (front fixed arc — good for lining up main gun)
- `I am in enemy weapon arc` (they can hit me)

*Resources:*
- `My flux` above/below [30% / 50% / 70% / 90%] — THE critical condition
- `My HP` above/below [20% / 40% / 60% / 80%]
- `My ammo (Group X)` above/below [25% / 50% / 75%] — or "ammo depleted"
- `Shield is raised` (true/false)
- `Currently venting` (true/false — to chain actions after vent completes)

*Enemy State:*
- `Enemy count` more/fewer than [2 / 4 / 6 / 8]
- `Enemy type is` [grunt / ace]
- `Nearest enemy is venting` — exploit window!
- `Nearest enemy is overloaded` — ATTACK NOW
- `Nearest enemy HP` below [25% / 50%] — finish them off
- `Nearest enemy shield is raised` (true/false)
- `Incoming missile detected` (true/false)

*Tactical:*
- `Ace is alive` (true/false — switch behavior once ace is down)
- `Funnels are deployed` (true/false)
- `TRANS-AM is active` (true/false — different behavior during boost)
- `No condition` (always true — default/fallback card)

**Available Actions:**

*Movement:*
- `Orbit target at [range]` — circle strafe maintaining specified distance, keeping front toward target. Range options: close (150), medium (300), far (500), extreme (700)
- `Charge toward target` — full thrust toward nearest enemy/ace, closing distance aggressively
- `Retreat from target` — thrust away while keeping front facing toward enemy (backpedal)
- `Flank target` — attempt to move to the target's side or rear arc. Risky but bypasses shields.
- `Hold position` — stop thrust, maintain current position, face nearest threat
- `Kite at max range` — maintain maximum weapon range, retreat if enemy closes, advance if enemy retreats
- `Boost dodge` — quick lateral thrust perpendicular to facing. Costs flux. Good for dodging incoming fire.
- `Close to melee range` — aggressively close to within 60 units for beam saber/heat whip

*Weapons:*
- `Fire Group 1` — fires all weapons in group 1 at current target (if in arc and range)
- `Fire Group 2` — fires all weapons in group 2
- `Fire Group 3` — fires all weapons in group 3
- `Fire all weapon groups` — alpha strike, fires everything. Massive flux generation.
- `Hold fire` — explicitly stop firing (useful for flux management cards)

*Defense:*
- `Raise shield` — activate frontal shield arc. Absorbs damage but generates hard flux.
- `Drop shield` — deactivate shield. Allows faster flux dissipation.
- `Vent flux` — begin emergency venting. Dumps all flux over ~60 ticks but mech is COMPLETELY VULNERABLE (no weapons, no shield, no boost, reduced speed). THE critical risk/reward action.

*Special:*
- `Deploy funnels` — if funnel pod equipped, launch 2 autonomous drones. They auto-target nearest enemy with 360° turret fire.
- `Deploy smoke` — if smoke launcher equipped, drop a vision-blocking cloud at current position.
- `Drop mine` — if mine dropper equipped, deploy a proximity mine behind the mech.
- `Focus fire on ace` — override targeting to prioritize the ace enemy specifically.
- `Focus fire on weakest` — target the enemy with lowest HP (good for finishing grunts quickly).

**IMPORTANT: Actions combine movement + weapon/defense.**
Some cards should bundle: e.g., "Orbit at medium range" is movement, and the weapon groups fire automatically IF their target is within their arc and range. So the card system works in layers:
- Movement cards set WHERE the mech goes and HOW it positions
- Weapon cards set WHEN and WHAT fires
- Defense cards set WHEN shield/venting happens

To handle this cleanly, each card has:
```
[PRIORITY] | [IF condition] | [MOVEMENT action] + [COMBAT action]
```

Where COMBAT action can be: a weapon group, raise/lower shield, vent, deploy special, or "continue current" (keep doing whatever combat action was set by a previous tick's card).

Example card: `IF flux > 70% → Retreat from target + Hold fire + Drop shield`
Example card: `IF ace distance < 300 → Orbit at 300 + Fire Group 1`
Example card: `IF nearest enemy is venting → Charge toward target + Fire all groups`

**Card UI Details:**
- Cards are draggable to reorder (primary gameplay interaction)
- Each card shows: priority number, condition in plain readable language, movement action icon + label, combat action icon + label
- "Add Card" button at bottom
- "Delete Card" via swipe or X button
- Max ~12 cards per state
- Color coding: green left-edge = condition was true last tick, gray = was not evaluated, gold = ace-related condition
- Compact card design so 6-8 are visible without scrolling on mobile

**Behavior State Tabs:**
- **2 behavior states**, shown as tabs: **"DEFAULT"** and **"CUSTOM"** (player names it)
- Each has its own independent card stack
- During battle, the player switches states with a button/hotkey
- Example: DEFAULT handles general combat, CUSTOM is "ACE KILLER" with counter-strategies for the ace

**"LAUNCH SORTIE" button** at the bottom.

---

## Screen 3: The Battle (Sortie)

### Arena
- Top-down 2D arena, rectangular (~1600x1000 game units)
- Dark background (charcoal for space, muted tan for desert)
- Subtle grid lines for distance reference (every 100 units)
- Camera centered on player mech with some lookahead toward the action

### Entity Rendering

**Player Mech:**
- Chevron/arrow shape pointing in facing direction, ~30px wide
- Bright blue/white color
- Visible shield arc: a curved line/arc in front of the mech when shield is raised. Glows brighter as flux increases (blue → yellow → red near overload).
- Visible weapon arcs: very faint cone lines showing the firing arc of the main weapon group (toggle-able, on by default). Helps player understand why weapons aren't firing (target not in arc).
- Thruster glow: small particle trail behind the mech when moving. Brighter during boost dodge.
- Flux meter: a small circular ring around the mech that fills up as flux increases. Changes color: blue (0-50%) → yellow (50-80%) → red (80-100%). Pulses when near overload.
- When venting: visible "exhaust" particles radiating outward, mech dims slightly.
- When overloaded: mech flashes red, electric crackle effect, shield visibly collapses.

**Grunts:**
- Small diamond shapes, red/orange
- ~15px wide, with a tiny directional indicator
- Simpler shield arc (thin line when shielding)
- Small HP bar above
- When destroyed: brief explosion particle burst

**Ace:**
- Larger diamond or star shape, crimson body with gold trim/glow
- ~25px wide, with clear directional indicator
- Visible shield arc (more prominent than grunts)
- Has a small name label ("CDR. REIK")
- Thruster trail is more prominent (gold/red particles)
- HP bar is larger and positioned prominently
- When destroyed: dramatic explosion, screen flash

**Funnels:**
- Tiny triangles (~6px), teal colored
- Orbit around their target
- Thin firing lines when shooting

**Projectiles:**
- Beam rifle: bright blue-white line flash from weapon mount to target (instantaneous, hitscan)
- Missiles: small moving dot with a faint trail, curves toward target
- Vulcan: rapid small yellow dots
- Beam saber: short bright arc slash near the mech (melee range)
- Funnel beams: thin teal lines

**Environmental Effects:**
- Smoke cloud: semi-transparent gray circle that fades over time
- Mines: small pulsing red dots on the arena floor
- Explosion: expanding orange/white circle with particles

### Visual Feedback (Critical for Readability)
- **Targeting line**: thin dashed line from player mech to current target
- **Damage numbers**: small floating numbers that drift upward when damage is dealt (white for player dealing damage, red for player taking damage)
- **Active card label**: floating text above player mech showing current behavior: "ORBITING — FIRING G1" or "RETREATING — VENTING" or "CHARGING — SABER"
- **State indicator**: glowing text near the mech showing "DEFAULT" or custom state name. Flashes when switched.
- **Kill flash**: brief white flash + particle burst when an enemy dies
- **Screen shake**: subtle shake on heavy hits (beam cannon, melee, overload)
- **Flux warning**: screen edge pulses red when player flux > 80%

### Battle HUD

**Top bar:**
- Player HP bar (large, with numeric value)
- Flux bar below HP (shows soft flux and hard flux as different colored segments within the same bar: soft flux in blue, hard flux in orange)
- "VENTING" or "OVERLOADED" warning text when applicable

**Bottom-left cluster:**
- Current behavior state button: big, tappable, shows state name. Tap to switch. Pulses briefly on switch.
- TRANS-AM button: big, glowing amber button. Single use. Grays out after use. Maybe has a dramatic activation effect (screen flash, mech briefly glows gold).

**Bottom-right cluster:**  
- Ammo counters for each weapon group (G1: 24/40, G2: 6/8, G3: ∞)
- Speed controls: 1x, 2x, 4x buttons

**Top-right:**
- Wave/phase indicator: "GRUNT PHASE" → "ACE INCOMING" → "ACE PHASE"
- Enemy count: "HOSTILES: 7"
- Timer: elapsed time

### Simulation Logic

The game runs at **20 ticks per second** at 1x speed.

**Each tick, for each entity:**

1. **Evaluate behavior cards** top to bottom (player uses their card stack; enemies use hardcoded AI)
2. First matching condition fires its movement + combat action
3. **Execute movement**: update facing (rotate toward desired angle at turn rate), apply thrust in facing direction, apply deceleration, update position
4. **Execute combat**: 
   - If firing: check if target is within the weapon's arc and range. If yes, fire and apply flux cost. If no (target not in arc), weapon doesn't fire but the entity continues trying to maneuver into arc.
   - If shielding: check if incoming damage is within shield arc. If yes, absorb damage and add hard flux. If no (hit from flank/rear), damage goes straight to HP.
   - If venting: increment vent timer, dump flux progressively. Entity is vulnerable.
5. **Update flux**: dissipate soft flux at dissipation rate (halved if shield is raised). Hard flux does NOT dissipate naturally — only venting removes it.
6. **Projectile updates**: move missiles toward targets, check mine proximity detonation, update funnel positions and targeting
7. **Check overload**: if flux >= max, trigger overload state
8. **Apply damage**: from any attacks that connected this tick
9. **Check death**: HP <= 0 → entity destroyed
10. **Log tick**: record full state for replay

**Grunt AI** (hardcoded — simple, should feel like cannon fodder):
```
Priority 1: IF flux > 80% → Retreat + Hold fire + Drop shield
Priority 2: IF HP < 25% → Retreat + Fire if in arc
Priority 3: IF distance to player < 150 → Orbit at 250 + Raise shield + Fire
Priority 4: IF distance to player < 400 → Hold position + Fire + Raise shield
Priority 5: DEFAULT → Advance toward player + Fire when in range
```
- Grunts NEVER vent proactively — they only vent when overloaded (a deliberate weakness the player can exploit)
- Grunts have narrow shield arcs and slow turn rates — flanking them is effective
- Grunts arrive in a loose cluster and spread out slightly as they engage

**Ace AI** (hardcoded — should feel like a RIVAL with distinct phases):

Phase 1 — "Testing" (ace HP > 60%):
```
Priority 1: IF flux > 70% → Retreat to 500 + Drop shield + Vent (ace is smart about venting)
Priority 2: IF player is venting → Charge + Fire all weapons (PUNISH)
Priority 3: IF player flux > 80% → Aggressive advance + Fire (pressure toward overload)  
Priority 4: IF distance < 200 → Boost dodge sideways + Fire group 1
Priority 5: IF distance < 500 → Orbit at 400 + Fire group 1
Priority 6: DEFAULT → Advance + Raise shield
```

Phase 2 — "Aggressive" (ace HP 30-60%):
```
Priority 1: IF flux > 60% → Flank player + Drop shield + Vent (vents while flanking — harder to punish)
Priority 2: IF player is venting → Charge to melee + Beam saber (DEVASTATING punish)
Priority 3: IF player shield is down → Charge + Fire all weapons
Priority 4: IF distance < 150 → Beam saber attack + Orbit close
Priority 5: DEFAULT → Flank player + Fire group 1
```

Phase 3 — "Desperate" (ace HP < 30%):
```
Priority 1: IF flux > 50% → Maximum retreat + Vent (plays very safe)
Priority 2: IF player HP < 30% → All-in charge + Fire everything (desperation rush)
Priority 3: IF player is venting → Charge + Melee (still punishes mistakes)
Priority 4: DEFAULT → Kite at max range + Fire (hit and run)
```

The ace should:
- Have a 30% chance to boost-dodge incoming beam rifle shots (simulating ace reflexes)
- Turn faster than grunts
- Manage flux intelligently (proactive venting, not just when overloaded)
- Target the player specifically (not funnels)
- Feel like it's READING the player's behavior and adapting (the phase shifts create this illusion)

**Battle Flow:**
1. Battle starts. 8-10 grunts are positioned across the arena.
2. Player mech spawns at the left/bottom of the arena.
3. Grunts engage. Player mech executes its DEFAULT card stack.
4. Player can switch behavior states and activate TRANS-AM at any time.
5. When grunts are reduced to ≤2 remaining, the ace spawns (dramatic entrance: warning text "ACE INCOMING", brief pause, ace drops in from top of screen with engine flare).
6. Ace engages. Remaining grunts continue fighting.
7. Battle ends when all enemies are destroyed (WIN) or player mech is destroyed (LOSE).

**TRANS-AM:**
- Single use per battle
- Duration: 100 ticks (5 seconds)
- Effects: speed +50%, weapon damage +30%, fire rate cooldowns -50%, turn rate +50%, flux dissipation +50%
- Visual: mech glows gold/amber, thruster trails intensify, slight speed lines effect
- After TRANS-AM ends: 40-tick debuff where flux dissipation is halved (cooldown penalty — you're vulnerable after the burst)
- Strategic depth: TRANS-AM during a vent window on the ace is devastating but using it too early means you face the ace's aggressive phase without it

### Tick Log for Replay

```typescript
interface TickLog {
  tick: number;
  
  player: {
    x: number;
    y: number;
    facing: number; // degrees
    speed: number;
    hp: number;
    maxHp: number;
    flux: number;
    maxFlux: number;
    softFlux: number;
    hardFlux: number;
    shieldUp: boolean;
    isVenting: boolean;
    isOverloaded: boolean;
    transAmActive: boolean;
    activeState: string; // "DEFAULT" or custom state name
    evaluatedCardIndex: number; // which priority card matched
    cardCondition: string; // readable condition text that matched
    movementAction: string; // what movement is executing
    combatAction: string; // what combat action is executing
    target: string | null; // entity ID being targeted
    weaponsFired: string[]; // which weapons fired this tick
    ammo: Record<string, number>; // ammo per weapon group
  };
  
  enemies: Array<{
    id: string;
    type: 'grunt' | 'ace';
    x: number;
    y: number;
    facing: number;
    hp: number;
    maxHp: number;
    flux: number;
    shieldUp: boolean;
    isVenting: boolean;
    isOverloaded: boolean;
    action: string;
    alive: boolean;
    acePhase?: string; // "testing" | "aggressive" | "desperate"
  }>;
  
  projectiles: Array<{
    type: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    damage: number;
  }>;
  
  events: Array<{
    type: 'damage_dealt' | 'damage_taken' | 'kill' | 'state_switch' | 
          'transam_activate' | 'transam_end' | 'ace_spawn' | 'ace_phase_change' |
          'overload' | 'vent_start' | 'vent_complete' | 'shield_break' |
          'dodge' | 'funnel_deploy' | 'mine_deploy' | 'smoke_deploy' |
          'player_destroyed' | 'victory';
    entityId: string;
    description: string;
    value?: number; // damage amount, etc.
  }>;
}
```

---

## Screen 4: The Replay

### Top Section: Battle Result
- **WIN** or **DEFEAT** — large, dramatic text with appropriate color
- Key stats row: time elapsed, enemies destroyed, damage dealt, damage taken, flux efficiency (% of time NOT overloaded), cards triggered count, state switches

### Middle Section: Interactive Timeline
- Horizontal scrollable timeline bar spanning the full battle
- Time markers along the bottom (every 5 seconds)
- Color-coded event markers:
  - 🔵 Blue: state switch
  - 🟡 Gold: TRANS-AM activated / ended
  - 🔴 Red: player took heavy damage (>10% HP in one hit) or was overloaded
  - ⚪ White: grunt destroyed
  - 🟣 Purple: ace appeared / ace phase changed
  - 🟢 Green: ace destroyed (victory)
  - 🟠 Orange: vent started / completed
- **Tap/click a marker** to see detailed log:
  - "Tick 142 [7.1s]: Card #3 matched — 'IF enemy count > 3 THEN hold position + fire all groups' → Hit 4 grunts for 180 total damage. Flux rose to 62%."
  - "Tick 380 [19.0s]: Player switched to 'ACE KILLER' state."
  - "Tick 412 [20.6s]: Card #1 matched — 'IF ace distance < 300 THEN orbit at 300 + fire group 1' → Beam rifle hit ace for 50 damage. Ace shield absorbed."
  - "Tick 445 [22.3s]: OVERLOADED! Flux reached 100%. Forced vent for 80 ticks. Card #2 'IF flux > 70% → retreat + vent' was at priority 5 — below card #4 which kept firing. **Consider raising the flux management card's priority.**"

That last type of insight — where the replay **suggests what went wrong** — is gold. Implement simple heuristics:
- If player overloaded: check if they had a vent/flux card and what priority it was. Suggest raising it.
- If player took lots of flank damage: suggest adding a "enemy is behind me" card.
- If a card never triggered: flag it as "⚠️ Never activated — consider removing or adjusting conditions."
- If ammo ran out: suggest ammo conservation cards.

### Bottom Section: Card Performance Dashboard
Show each card from the active card stack with battle performance:
- Times this card was the matching card during the battle
- Total ticks this card was active
- Total damage dealt while this card directed behavior
- Flux generated while this card was active
- A "heat bar" showing what % of battle time this card was responsible for

Example:
```
Card #1: "IF ace distance < 300 → Orbit 300 + Fire G1"
  Activated: 47 times | 235 ticks active | 2,350 damage dealt | Avg flux: 45%
  ████████████░░░░ 47% of battle

Card #6: "IF enemy behind me → Boost dodge + Raise shield"  
  Activated: 2 times | 10 ticks active | 0 damage dealt
  ░░░░░░░░░░░░░░░░ 2% of battle
  ⚠️ Rarely triggered. Enemy flanking was not a major threat this mission.
  
Card #8: "DEFAULT → Advance + Fire G1"
  Activated: 83 times | 415 ticks active | 1,240 damage dealt | Avg flux: 38%
  ██████████████████ 83% of battle (when no other card matched)
```

### Mini Battle Replay (Optional but ideal)
- A small canvas replay of the battle at the top that the player can scrub through using the timeline
- Synced with the timeline markers — clicking a marker jumps the replay to that moment
- Shows the same visual as the battle but with timeline controls (play/pause/scrub)

### "RETURN TO LAB" button

---

## Aesthetic Direction

**Tone: Military sci-fi command interface.** Think NERV HQ from Evangelion, the Argama bridge from Zeta Gundam, or Starsector's own UI. Dark, functional, precise.

**Color Palette:**
- Background: deep navy/charcoal (#0a0e1a, #131829, #1a1f35)
- Primary UI accent: cyan/teal (#00d4ff, #00b8d4)
- Secondary accent: amber/gold (#ffb800, #ffa000) — for ace-related elements, TRANS-AM, warnings
- Danger/damage: crimson (#ff3344, #cc2233)
- Flux visualization: blue (#4488ff) at low → yellow (#ffdd00) at mid → red (#ff4444) at high
- Shield: light blue semi-transparent (#00d4ff44)
- Success/kills: bright green (#00ff88)
- Text: white (#ffffff) primary, gray (#8899aa) secondary
- Card backgrounds: dark (#1a2035) with colored left-edge accent

**Typography:**
- Data/stats/numbers: monospace font (JetBrains Mono, Fira Code, or Source Code Pro from Google Fonts)
- Headers/labels: clean condensed sans-serif, all-caps, slight letter spacing (Barlow Condensed, Rajdhani, or Orbitron for a more sci-fi feel)
- Body text: clean sans-serif (Barlow, Exo 2, or Titillium Web)

**Card Design:**
- Dark card body with subtle border
- Left edge color stripe: green (active last tick), gray (not evaluated), gold (ace condition), red (flux/emergency condition)
- Priority number in a small circle on the left
- Condition text in the middle with an icon
- Action text on the right with icons for movement + combat
- Subtle glow on hover/drag
- When dragging to reorder: card lifts with a shadow, gap opens in the stack

**Battle Arena Aesthetic:**
- Dark background with subtle grid (very low opacity)
- Entities should POP — bright colors on dark background
- Weapon fire should be bright and satisfying (beam effects with glow)
- Shield arcs should be visible but not cluttering
- Flux rings around entities add constant visual information
- Minimal UI — let the battle speak. HUD elements at edges only.

**Buttons:**
- TRANS-AM button: amber/gold, subtle pulse animation when available, dramatic glow effect. After activation, the button drains like a progress bar.
- State switch button: cyan/teal, clean. Shows current state name. Flashes briefly on switch.
- Both should be large enough for comfortable thumb taps on mobile.

**Overall Feel:**
You are sitting in a command center, monitoring your creation in combat. The UI is your instrument panel. Every piece of information is there because it matters. Clean, functional, powerful.

---

## Prototype Missions

### Mission 1: "First Sortie"
- **Enemies**: 6 grunts, no ace
- **Grunt behavior**: simple advance + shoot, no flanking
- **Purpose**: teach the card system basics. Player should win with a basic 3-4 card stack.
- **Lesson**: "cards evaluate top to bottom, first match fires"
- **Suggested starter cards**: IF distance > 300 → advance + fire G1 | IF distance < 150 → orbit at 200 + fire G1 | DEFAULT → advance

### Mission 2: "Ambush in the Debris Field"
- **Enemies**: 10 grunts + 1 ace (melee-focused, aggressive dash pattern)
- **Grunt behavior**: slightly more aggressive, some attempt flanking
- **Ace**: CDR. REIK — prefers charging to melee range, beam saber specialist. Punishes venting players hard. Tests: can the player's program handle grunt swarms AND an ace duel?
- **Lesson**: "you need different behavior for grunts vs ace" → teaches state switching
- **Key insight player should discover**: switching to a defensive/counter-melee state when the ace appears completely changes the outcome

### Mission 3: "Red Comet"
- **Enemies**: 5 fast grunts (higher speed, flanking AI) + 1 elite ace
- **Elite Ace**: LT. VAEL — extremely fast, uses funnels, mixes ranged and melee, manages flux expertly, dodges 40% of shots. Has 3 distinct phases.
- **Lesson**: "flux management is the meta-game" — the ace pressures the player's flux with sustained attacks, punishes overloads, and vents smartly. The player needs flux management cards at high priority.
- **Key insight**: the player might need to sacrifice damage output (hold fire cards) to maintain flux stability against the ace's pressure

---

## File Structure

```
/src
  /types
    game.ts               — Core types: Entity, Weapon, Card, BehaviorState, Equipment, MountPoint, WeaponGroup, etc.
    simulation.ts         — Simulation types: TickLog, SimulationState, SimulationConfig
    ui.ts                 — UI types: Screen state, drag state, etc.
    
  /data
    weapons.ts            — All weapon definitions with stats
    equipment.ts          — Thruster, shield, armor, reactor definitions
    missions.ts           — Hardcoded mission definitions (briefing text, enemy compositions, enemy AI cards)
    defaultCards.ts       — Starter card presets for new players
    enemyAI.ts            — Grunt and ace AI card stacks
    
  /simulation
    engine.ts             — Main tick loop: evaluates all entities, advances state
    behaviorEvaluator.ts  — Card stack evaluator: iterates cards, checks conditions, returns action
    conditions.ts         — All condition evaluation functions (distance checks, flux checks, etc.)
    actions.ts            — All action execution functions (movement, firing, shielding, venting, etc.)
    movement.ts           — Movement physics: thrust, rotation, deceleration, boost dodge
    combat.ts             — Weapon firing, damage calculation, arc checking, projectile updates
    flux.ts               — Flux generation, dissipation, overload logic
    shield.ts             — Shield arc calculation, damage absorption, hard flux conversion
    entities.ts           — Entity factory functions, entity state management
    funnels.ts            — Autonomous funnel AI and behavior
    projectiles.ts        — Missile tracking, mine proximity, projectile lifecycle
    
  /components
    /lab
      LabScreen.tsx        — Main lab layout with Hangar and Programming Deck tabs/panels
      Briefing.tsx         — Mission select and briefing screen
      Hangar.tsx           — Equipment selection with mech diagram
      MechDiagram.tsx      — Top-down mech schematic showing mount points and weapon arcs
      WeaponGroupEditor.tsx — Drag weapons into 3 groups
      MechStats.tsx        — Live stat summary panel
      CardEditor.tsx       — The behavior card stack editor (primary gameplay UI)
      CardItem.tsx         — Individual draggable card component
      CardConditionSelect.tsx — Dropdown/picker for card conditions
      CardActionSelect.tsx — Dropdown/picker for card actions (movement + combat)
      BehaviorStateTab.tsx — Tabs for DEFAULT / CUSTOM behavior states
      
    /battle
      BattleScreen.tsx     — Main battle layout (canvas + HUD)
      BattleCanvas.tsx     — Canvas renderer: entities, projectiles, arcs, shields, particles, effects
      BattleHUD.tsx        — HP, flux, ammo, buttons, state indicator overlay
      EntityRenderer.ts    — Drawing functions for each entity type (player, grunt, ace, funnels)
      EffectsRenderer.ts   — Particle systems, beam effects, explosions, screen shake
      ArcRenderer.ts       — Shield arc and weapon arc visualization
      
    /replay  
      ReplayScreen.tsx     — Post-battle analysis layout
      BattleResult.tsx     — Win/lose display with key stats
      Timeline.tsx         — Interactive timeline with event markers
      EventDetail.tsx      — Popup/panel showing tick details when marker is tapped
      CardPerformance.tsx  — Card stats dashboard
      InsightEngine.ts     — Heuristics that analyze the tick log and generate suggestions
      MiniReplay.tsx       — Optional: small canvas replay synced to timeline
      
    /shared
      DragDropContext.tsx   — Touch and mouse drag-and-drop handler for cards
      Tooltip.tsx          — Info tooltips for equipment and card explanations
      ProgressBar.tsx      — Reusable bar component (HP, flux, ammo)
      
  /state
    gameState.ts           — Central game state: current screen, mission, loadout, card stacks, battle log
    
  /utils
    geometry.ts            — Angle calculations, distance, arc containment checks, vector math
    random.ts              — Seeded random for deterministic simulation (important for replay accuracy)
    
  App.tsx                  — Screen router: Briefing → Lab → Battle → Replay
  main.tsx
  index.css                — Tailwind + custom CSS variables for the color palette
  index.html
```

---

## Balance Numbers

```
=== PLAYER MECH (Medium Loadout) ===
HP: 1000
Speed: 3 units/tick  
Turn Rate: 4°/tick
Max Flux: 1000
Flux Dissipation: 8/tick (4/tick with shield up)
Vent Time: 60 ticks (3 seconds) — dumps all flux
Overload Duration: 80 ticks (4 seconds)
Boost Dodge: 15 units lateral movement, costs 30 flux, 20 tick cooldown

=== WEAPONS ===
Beam Rifle (Front Fixed):
  Damage: 50, Range: 500, Cooldown: 8 ticks, Flux: 30/shot, Ammo: 40

Beam Cannon (Front Fixed):
  Damage: 120, Range: 350, Cooldown: 20 ticks, Flux: 80/shot, Ammo: 15

Sniper Beam (Front Fixed):
  Damage: 70, Range: 800, Cooldown: 15 ticks, Flux: 40/shot, Ammo: 25

Missile Rack (Front Turret):
  Damage: 60, Range: 400, Cooldown: 25 ticks, Flux: 20/shot, Ammo: 8, Tracking

Vulcan Cannon (Front Turret):
  Damage: 10, Range: 200, Cooldown: 3 ticks, Flux: 5/shot, Ammo: Unlimited

Beam Spray (Front Turret):
  Damage: 25 (AOE arc), Range: 150, Cooldown: 10 ticks, Flux: 15/shot, Ammo: Unlimited

Point Defense (Turret 360):
  Damage: 8, Range: 150, Cooldown: 2 ticks, Flux: 3/shot, Ammo: Unlimited, Auto-targets missiles

Beam Saber (Turret 360):
  Damage: 100, Range: 60, Cooldown: 12 ticks, Flux: 40/hit

Heat Whip (Turret 360):
  Damage: 60, Range: 120, Cooldown: 15 ticks, Flux: 25/hit

Funnels (Rear):
  2 drones, 15 damage each, Range: 300, Cooldown: 12 ticks, Flux: 0 (independent), Duration: 200 ticks

Smoke Launcher (Rear):
  Blocks enemy targeting in area for 100 ticks, 2 uses

Mine Dropper (Rear):
  150 damage on proximity (80 unit trigger radius), 3 mines max

=== GRUNT ===
HP: 120
Speed: 2 units/tick
Turn Rate: 3°/tick
Max Flux: 400
Flux Dissipation: 4/tick
Shield: 90° arc, 1.0x flux conversion
Weapon: 20 damage beam, 300 range, 12 tick cooldown, 10 flux/shot
Dodge Chance: 0%

=== ACE (Mission 2 — CDR. REIK) ===
HP: 600
Speed: 4 units/tick
Turn Rate: 5°/tick
Max Flux: 800
Flux Dissipation: 10/tick
Shield: 120° arc, 0.8x flux conversion
Main Weapon: 35 damage beam, 400 range, 10 tick cooldown, 20 flux/shot
Melee: 100 damage beam saber, 60 range, 12 tick cooldown, 35 flux/hit
Dodge Chance: 30%
Vent Behavior: proactive (vents at 70% flux when safe)

=== ACE (Mission 3 — LT. VAEL) ===
HP: 500
Speed: 5 units/tick
Turn Rate: 7°/tick
Max Flux: 600
Flux Dissipation: 14/tick
Shield: 100° arc, 0.9x flux conversion  
Main Weapon: 30 damage rapid beam, 450 range, 6 tick cooldown, 15 flux/shot
Funnels: 2 funnels (20 damage, 200 tick duration)
Dodge Chance: 40%
Vent Behavior: aggressive (vents while flanking to minimize vulnerability)

=== TRANS-AM ===
Duration: 100 ticks (5 seconds at 20 ticks/sec)
Speed: +50%
Damage: +30%
Cooldown Reduction: 50% (fire twice as fast)
Turn Rate: +50%
Flux Dissipation: +50%
Post-TRANS-AM Debuff: 40 ticks of halved flux dissipation
Single use per battle
```

---

## Key Design Principles

1. **The card order IS the gameplay.** Every drag to reorder should feel like a meaningful decision. Priority determines what your mech does in every situation. A flux management card at priority 2 vs priority 6 can mean the difference between survival and overload.

2. **Flux is the heartbeat.** The push-pull of generating flux (attacking, shielding) and managing it (venting, conservative play) creates the combat rhythm. The player programs this rhythm. A mech that manages flux well feels like a disciplined warrior. A mech that overloads feels panicked and sloppy.

3. **The player must READ the battle.** Visual feedback must make it clear: what is my mech doing? Why? What card is active? Is flux climbing? Is the ace flanking me? The active card label, flux ring, and targeting line are not optional — they're core to the experience.

4. **The replay creates "aha" moments.** The player should look at the timeline and understand exactly why they lost. "Oh — card 3 kept firing when flux was at 85% because my vent card was at priority 7. If I move it to priority 2, I'll vent before overloading." That insight → tweak → retry loop IS the game.

5. **The ace is the puzzle.** Grunts are a warm-up that tests basic programming. The ace is a genuine challenge that requires specific counter-strategies. First encounter should probably result in a loss. The ace's behavior should be learnable through observation, and the player should feel increasingly confident in their counter-programming over multiple attempts.

6. **State switching is the commander moment.** The mech fights autonomously, but the player chooses WHEN to shift behavior modes. This single real-time decision point gives the player agency without undermining the autobattler design. The switch should feel dramatic and consequential.

7. **Mobile-first touch design.** Cards must be finger-draggable. Buttons must be thumb-sized. The battle canvas must be readable on a phone screen. Landscape mode for battles, portrait or landscape for the lab.

8. **Deterministic simulation.** Use seeded randomness so the same card stack + same mission produces the same result. This means the replay is perfectly accurate and the player can trust that changes to their cards CAUSED different outcomes, not random variance. (Exception: dodge chance uses seeded random — same seed = same dodges.)

---

## Getting Started

1. `npm create vite@latest mecha-autobattler -- --template react-ts`
2. Install Tailwind CSS
3. **Phase 1 — Simulation first**: Build the tick-based simulation engine (`/simulation/*`) with NO rendering. Write it as pure functions. Test by logging output. Get the behavior evaluator, movement, combat, flux, and shield systems working correctly.
4. **Phase 2 — Card Editor**: Build the CardEditor UI. Drag to reorder, add/remove cards, condition and action pickers. This is the most important UI in the game.
5. **Phase 3 — Battle renderer**: Build the Canvas renderer to visualize the simulation. Add entities, weapon fire, shield arcs, flux rings, particles.
6. **Phase 4 — Battle HUD**: Add HP/flux bars, state switch button, TRANS-AM button, speed controls.
7. **Phase 5 — Replay**: Build the timeline, event markers, card performance dashboard, and insight suggestions.
8. **Phase 6 — Hangar**: Build the equipment selection and weapon group assignment UI.
9. **Phase 7 — Flow**: Wire everything together: Briefing → Lab → Battle → Replay → Lab. Add the 3 missions.
10. **Phase 8 — Polish & Balance**: Playtest extensively. Tune numbers. Add screen shake, particles, sound hooks (no actual audio needed yet). Make the ace feel like a wall that crumbles when you find the right card configuration.

Build the simulation logic FIRST. If the behavior evaluator and flux system work correctly in pure TypeScript with console.log output, everything else is presentation.

Good luck. Make something that would make Bright Noa proud and Char nervous.

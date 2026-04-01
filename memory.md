# Memory

## Product Intent
- The player should feel like they programmed an elite mobile suit combat mind.
- The strongest aesthetic target is `Nu Gundam` in `Char's Counterattack`.
- The fight should read as sharp, lethal, evasive, and intelligent rather than like a generic autobattler.

## Prototype Decisions
- Stay in a browser-native static prototype for now.
- Keep the editor simple: `Interrupts` plus `Doctrine`.
- Do not move to Godot, React, or backend systems until the core loop is clearly landing.

## Current Combat Feel Targets
- Longer opening distance
- Smaller on-screen suits
- Fast repositioning and long weave dodges
- Slower, cleaner beam-fire cadence
- Bright projectile trails and visible funnels
- Grunts attempt ace-like movement but fail more often
- Grunts die in one clean rifle hit

## Working Notes
- Live battle loop is the correct direction; replay is secondary.
- Readability matters as much as raw simulation depth.
- Tuning should continue to favor:
  - stronger boost-dash identity
  - clearer shield blocks vs slips vs direct hits
  - iconic beam-rifle presentation

## Open Questions
- Should ace-specific movement be more extreme than player movement?
- Should funnels spread wider and feel more like a pincer than a tight orbit?
- Should projectile travel be slowed slightly for readability, or is current speed correct?
- Should impacts add more camera feedback?

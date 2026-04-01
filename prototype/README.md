# Nu Gundam Combat OS Prototype

Open [index.html](/D:/Claude/Gundam/prototype/index.html) in a browser to run the prototype.

What is included:
- A deterministic single-page combat sandbox with three scenarios
- A fixed `Nu Gundam`-style player suit with rifle, saber, shield, and funnels
- Separate `Interrupts` and `Doctrine` rule stacks with explicit priorities
- Canvas battle playback, timeline scrubber, event jumps, timeline markers, and rule usage readout
- A modular browser-native ES module layout under [src](/D:/Claude/Gundam/prototype/src)

Structure:
- [src/data](/D:/Claude/Gundam/prototype/src/data) for labels, presets, scenarios, and constants
- [src/sim](/D:/Claude/Gundam/prototype/src/sim) for deterministic combat logic and summaries
- [src/render](/D:/Claude/Gundam/prototype/src/render) for canvas drawing and timeline markers
- [src/ui](/D:/Claude/Gundam/prototype/src/ui) for the rule editor, playback, and readout panels

What to test:
- Whether reordering interrupts makes the suit feel smart
- Whether vent punish windows are readable and satisfying
- Whether shield arcs and rear-threat logic create useful programming decisions

Good first tests:
- Run `Ace Duel` with the default preset
- Switch to `Load Vent Punish`
- Move `Flux above 72%` above or below the vent punish interrupt and rerun

Automated checks:
- Run `npm test` in [prototype](/D:/Claude/Gundam/prototype)

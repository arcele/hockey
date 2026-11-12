# Northwest Bubble Hockey · v2

A client-side tabletop hockey game rebuilt with TypeScript, Vite, and Canvas 2D.
No runtime dependencies, account, or server required. The former KineticJS game
is preserved in `legacy/` (open `legacy/index.html` to revisit it).

## Run

Node 22.12+ (or current LTS) and npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Vite prints the local address. Production output is `dist/`; deploy that folder
on any static host. For testing on a phone on the same trusted Wi-Fi network,
run `npm run dev -- --host 0.0.0.0` and open the printed Network URL on the phone.

## Play

Start with Drop the Puck. Orange is home, attacking the top goal; red is a local
practice bot. Choose one of six players with the selector or keys 1–6. On desktop, hover over a lane to select a player: the upper half has left wing,
center, and right wing lanes; the lower half has left/right defense, with the goalie
at the bottom. Move the mouse vertically to slide and horizontally to swing, with
no click required. Crossing a lane selects its player and resets the swing; leaving
the rink stops mouse input. On touchscreens, drag on the rink to select and move a
player along its rail. Arrow keys / touch slide buttons also work. A / D or the two touch spin buttons rotate the stick in either
direction. The goalie slides horizontally and has no stick. Space or Pause
pauses; New Match resets the score and clock. Losing focus pauses play.

Three-minute matches, whole-puck goals, a brief faceoff after each goal, and a
final result are included. Scores are session-only. No online multiplayer yet.
The touch pads support simultaneous slide and spin via independent pointers.

## Architecture and multiplayer path

- `src/simulation.ts`: serializable state, fixed 120 Hz step, bounded commands,
  circular bodies, capsule sticks, rounded boards, goal crossings, match rules.
  No browser APIs, wall clocks or random numbers. Identical inputs and initial
  states replay identically in tests. Floating-point cross-platform determinism
  is not guaranteed; future networking should use authoritative snapshots.
- `src/render.ts`: high-DPI canvas rink, procedural ice, rails and player figures.
- `src/main.ts`: pointer/keyboard input, practice bot adapter, fixed-step accumulator,
  DOM scoreboard, pause and lifecycle handling. No game rules live in the DOM.
- `src/style.css`: responsive arena, scoreboard and touch controls.

Commands carry team, player, sequence and tick. Next: add a WebSocket room server
running this simulation. Validate team ownership, sequence, tick windows and
rate limits on the server; never trust the client-supplied team. Keep inputs
per tick, broadcast snapshots at 20–30 Hz, interpolate remote state, then add
local prediction/reconciliation. The current local adapter supplies inputs every
tick; it is not a transport, authentication layer or network command queue.
Bot commands can be replaced by a second human's input stream.

The lightweight physics uses substeps bounded by configured maximum relative
travel, with two solver passes. Posts and nets are visual markings, not separate
colliders. No persistence, matchmaking, sound assets, or external art is required.
Fonts use Google Fonts with system fallbacks; gameplay works without that request.

## Checks

`npm test` compiles the portable simulation and runs Node's built-in test runner.
Checks cover goal rules, one-shot scoring, faceoffs, command bounds, deterministic
replay, wall/corner containment, body/stick rebounds, both swing directions and
match expiry. `npm run build` also type-checks all browser code.

## Puck surface feel

The puck uses constant tabletop sliding friction (`PUCK_FRICTION = 160` rink
units/s²), replacing the original gentle exponential ice drag. An unobstructed
150-unit/s puck stops in about 0.94 seconds; a maximum-power 520-unit/s shot
stops in about 3.25 seconds before accounting for collision energy losses.
Friction preserves heading and clamps at rest, so slow pucks do not creep or
reverse. Adjust the exported constant in `src/simulation.ts` to tune surface feel.

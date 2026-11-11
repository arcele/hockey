# Bubble hockey

Open `index.html` in a browser. Select a skater by hovering over its selector,
move vertically to slide it, and move horizontally to rotate its stick.
Hover over BUMP (or touch it) to launch the puck.

## Board physics milestone

The puck uses a fixed 60 Hz simulation, with legacy speed units of pixels per
simulation tick. Straight walls and rounded corners share the rink dimensions;
contacts account for the puck radius. Swept collision detection reflects velocity
at each contact and consumes the remaining movement, including multiple rebounds.
Board rebounds preserve speed; ice drag removes 0.05 speed units per tick.
Long frame gaps are capped at 250 ms to avoid excessive catch-up after tab suspension.

Run regression checks with Node.js (no dependencies):

```sh
node tests/boards.test.js
```

Checks cover four walls, four corners, fast and shallow shots, repeated rebounds,
corner joins, speed conservation, split time intervals, frame-rate equivalence,
and preservation of player collision corrections.

Scoring remains prototype code. The end boards remain closed, matching the existing rink; goal openings
and goal state handling are separate work.

## Player and stick physics

Bodies are circles; sticks are 3 px thick line segments with rounded ends,
matching their rendered reach and length. Contacts reflect relative velocity
against the surface normal with 0.8 restitution. Translation and stick rotation
transfer momentum to the puck; separating contacts only receive overlap correction.

Players and puck share the fixed simulation loop, including while the puck rests.
Skaters travel at 1.5 px per tick. Puck travel is scaled to 50% of its physics
velocity; drag and stick rotation retain their existing tuning. Horizontal pointer movement queues signed swings,
limited to 0.35 radians per tick and one full revolution of pending input.
Puck speed after player contact is capped at 30 px per tick. Adaptive substeps
limit relative travel to 0.5 px, including stick-tip travel; three contact passes
settle overlapping surfaces and reapply board containment. Tightly packed contacts
can still require gameplay tuning; this is a lightweight kinematic solver.

```sh
node tests/players.test.js
```

These checks cover fast body and stick hits, glancing rebounds, separating contacts,
coincident centers, stick reach, both swing directions, angle wrapping, moving-body
impulses, incremental player movement, and mirrored opponent tracks.

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

The end boards remain closed behind the goal lines.

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

## Scoreboard and goals

The amber LED scoreboard shows Home (orange, defending the bottom goal) and
Away (red, defending the top goal). Goals require the entire puck to cross the
opposing goal line outward with its full width between the marked posts.
Crossings are tested on each physics movement substep, using interpolated crossing
positions rather than velocity or proximity. A goal counts once, resets the puck
to center, and pauses play for 90 simulation ticks (1.5 seconds during normal play).
New Game clears both scores and starts a faceoff. Scores last for the current page
session; reloading starts a new game. The goal markings are visual; physical post
and net collisions are not yet modeled.

```sh
node tests/scoring.test.js
```

Covers both ends, partial and wrong-way crossings, post clearance, fast shots,
interpolated crossing positions, one score per goal, faceoff pause, team attribution,
New Game reset, and LED rendering/accessibility text.

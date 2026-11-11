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

Player/stick collision geometry, scoring, and player movement remain prototype
code. The end boards remain closed, matching the existing rink; goal openings
and goal state handling are separate work.

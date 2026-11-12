// Pure puck/board physics. Coordinates are relative to the ice surface.
(function(root) {
    'use strict';
    function move(x, y, vx, vy, dt, width, height, cornerRadius, puckRadius) {
        var left = puckRadius, right = width - puckRadius;
        var top = puckRadius, bottom = height - puckRadius;
        var r = cornerRadius - puckRadius;
        var cx = Math.max(cornerRadius, Math.min(width - cornerRadius, x));
        var cy = Math.max(cornerRadius, Math.min(height - cornerRadius, y));
        // Recover safely if legacy player handling placed the puck outside the boards.
        x = Math.max(left, Math.min(right, x));
        y = Math.max(top, Math.min(bottom, y));
        var dx = x - cx, dy = y - cy, distance = Math.hypot(dx, dy);
        if (distance > r) { x = cx + dx * r / distance; y = cy + dy * r / distance; }
        var remaining = dt;
        // Each iteration consumes a flight up to the next board contact.
        for (var hits = 0; remaining > 1e-10 && hits < 256; hits++) {
            var best = remaining + 1, nx = 0, ny = 0;
            function candidate(t, normalX, normalY) {
                if (t >= -1e-10 && t <= remaining && t < best && vx * normalX + vy * normalY > 1e-10) {
                    best = Math.max(0, t); nx = normalX; ny = normalY;
                }
            }
            if (vx !== 0) {
                var tx = ((vx > 0 ? right : left) - x) / vx;
                var wallY = y + vy * tx;
                if (wallY >= cornerRadius && wallY <= height - cornerRadius) candidate(tx, vx > 0 ? 1 : -1, 0);
            }
            if (vy !== 0) {
                var ty = ((vy > 0 ? bottom : top) - y) / vy;
                var wallX = x + vx * ty;
                if (wallX >= cornerRadius && wallX <= width - cornerRadius) candidate(ty, 0, vy > 0 ? 1 : -1);
            }
            var speed2 = vx * vx + vy * vy;
            if (speed2 > 0) {
                [cornerRadius, width - cornerRadius].forEach(function(centerX, ix) {
                    [cornerRadius, height - cornerRadius].forEach(function(centerY, iy) {
                        var ox = x - centerX, oy = y - centerY;
                        var b = ox * vx + oy * vy;
                        var disc = b * b - speed2 * (ox * ox + oy * oy - r * r);
                        if (disc < 0) return;
                        var t = (-b + Math.sqrt(disc)) / speed2;
                        var px = x + vx * t - centerX, py = y + vy * t - centerY;
                        if ((ix === 0 ? px <= 0 : px >= 0) && (iy === 0 ? py <= 0 : py >= 0)) candidate(t, px / r, py / r);
                    });
                });
            }
            if (best > remaining) { x += vx * remaining; y += vy * remaining; remaining = 0; break; }
            x += vx * best; y += vy * best; remaining -= best;
            var dot = vx * nx + vy * ny;
            vx -= 2 * dot * nx; vy -= 2 * dot * ny;
            x -= nx * 1e-8; y -= ny * 1e-8;
        }
        // In pathological cases discard leftover time rather than escape the rink.
        return { x: x, y: y, vx: vx, vy: vy };
    }
    root.BoardPhysics = { move: move };
    if (typeof module !== 'undefined' && module.exports) module.exports = root.BoardPhysics;
})(typeof globalThis !== 'undefined' ? globalThis : this);

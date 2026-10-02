// Small geometry helpers. All take plain numbers and write results into
// a reusable `out` object, so nothing is allocated in the game loop.

export function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// Rotate `current` toward `target` by at most `maxStep` radians.
export function turnToward(current, target, maxStep) {
  const d = wrapAngle(target - current);
  if (d > maxStep) return current + maxStep;
  if (d < -maxStep) return current - maxStep;
  return target;
}

// Do segments AB and CD cross? If yes, writes the crossing point to out.x/out.y.
export function segIntersect(ax, ay, bx, by, cx, cy, dx, dy, out) {
  const rx = bx - ax, ry = by - ay;
  const sx = dx - cx, sy = dy - cy;
  const denom = rx * sy - ry * sx;
  if (denom === 0) return false;
  const qx = cx - ax, qy = cy - ay;
  const t = (qx * sy - qy * sx) / denom;
  const u = (qx * ry - qy * rx) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return false;
  out.x = ax + t * rx;
  out.y = ay + t * ry;
  return true;
}

// Squared distance from point P to segment AB. Closest point goes to out.x/out.y.
export function distToSeg2(px, py, ax, ay, bx, by, out) {
  const vx = bx - ax, vy = by - ay;
  const len2 = vx * vx + vy * vy;
  let t = len2 > 0 ? ((px - ax) * vx + (py - ay) * vy) / len2 : 0;
  if (t < 0) t = 0; else if (t > 1) t = 1;
  const cx = ax + t * vx, cy = ay + t * vy;
  out.x = cx; out.y = cy;
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy;
}

// Non-zero winding test: is P inside the polygon (xs, ys, n points)?
// Generous with self-overlapping loops (anything wrapped at least once counts).
export function polygonContains(xs, ys, n, px, py) {
  let wn = 0;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const x0 = xs[j], y0 = ys[j], x1 = xs[i], y1 = ys[i];
    const side = (x1 - x0) * (py - y0) - (px - x0) * (y1 - y0);
    if (y0 <= py) {
      if (y1 > py && side > 0) wn++;
    } else if (y1 <= py && side < 0) {
      wn--;
    }
  }
  return wn !== 0;
}

// Zoe's recorded path: a ring buffer of points, oldest to newest.
// Each point stores its "odometer" value (total distance Zoe had travelled),
// so we can ask "where was she 60 px ago?" for the body and the leash.

export class Trail {
  constructor(capacity) {
    this.cap = capacity;
    this.xs = new Float32Array(capacity);
    this.ys = new Float32Array(capacity);
    this.os = new Float64Array(capacity);
    this.start = 0;
    this.count = 0;
  }

  clear() {
    this.start = 0;
    this.count = 0;
  }

  // i = 0 is the oldest point, i = count - 1 the newest.
  x(i) { return this.xs[(this.start + i) % this.cap]; }
  y(i) { return this.ys[(this.start + i) % this.cap]; }
  o(i) { return this.os[(this.start + i) % this.cap]; }

  push(x, y, odo) {
    if (this.count === this.cap) {
      this.start = (this.start + 1) % this.cap;
      this.count--;
    }
    const k = (this.start + this.count) % this.cap;
    this.xs[k] = x;
    this.ys[k] = y;
    this.os[k] = odo;
    this.count++;
  }

  // Drop old points we no longer need (keeps one point older than minOdo).
  trim(minOdo) {
    while (this.count > 2 && this.o(1) < minOdo) {
      this.start = (this.start + 1) % this.cap;
      this.count--;
    }
  }
}

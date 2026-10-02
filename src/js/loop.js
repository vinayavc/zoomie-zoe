// requestAnimationFrame loop with a fixed-timestep update.
// update(step) runs at a steady 60 Hz no matter the screen refresh rate;
// render(frameSeconds) runs once per screen frame.

export function createLoop(step, maxSteps, update, render) {
  let running = false;
  let rafId = 0;
  let last = 0;
  let acc = 0;

  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt < 0) dt = 0;
    if (dt > 0.25) dt = 0.25; // treat long gaps as a pause, not as time to simulate
    acc += dt;
    let steps = 0;
    while (acc >= step && steps < maxSteps) {
      update(step);
      acc -= step;
      steps++;
    }
    if (steps === maxSteps) acc = 0; // drop the backlog instead of spiralling
    render(dt);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      acc = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
  };
}

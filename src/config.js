// Doxie Arcade: every tunable number lives here.
// Units: distances in arena pixels (the arena is always 400 x 600),
// times in seconds, angles in radians, speeds in pixels per second.
//
// Tip: while the game is running you can change these live from the
// browser console, e.g.  doxie.config.ZOE_SPEED = 170

export const CONFIG = {
  // ---- Arena and screen ----
  ARENA_W: 400,
  ARENA_H: 600,
  MAX_DPR: 2,               // cap on device pixel ratio (sharpness vs. speed)
  HUD_H: 44,                // height of the top score bar; items don't spawn under it

  // ---- Game loop ----
  STEP: 1 / 60,             // fixed simulation step
  MAX_STEPS_PER_FRAME: 5,   // catch-up limit after a slow frame

  // ---- Round ----
  ROUND_SECONDS: 60,
  RESTART_GUARD: 0.35,      // seconds after game over before a tap can restart

  // ---- Zoe (head + body chain) ----
  ZOE_START_X: 200,
  ZOE_START_Y: 430,
  ZOE_SPEED: 140,           // she always moves forward at this speed
  ZOE_TURN_RATE: 4.5,       // max turn speed; min turning circle radius = SPEED / TURN_RATE
  HEAD_RADIUS: 9,
  SEG_RADIUS: 7,
  SEG_COUNT: 10,            // body segments behind the head
  SEG_SPACING: 6,           // body length = SEG_COUNT * SEG_SPACING

  // ---- Stretch (action button) ----
  STRETCH_DISTANCE: 120,    // extra distance the head lunges (about 2 body lengths)
  STRETCH_TIME: 0.25,       // how long the lunge lasts
  STRETCH_CATCHUP: 0.35,    // how long the rear takes to catch up afterwards
  STRETCH_COOLDOWN: 2.0,

  // ---- Getting hit ----
  STUN_TIME: 0.8,
  HIT_INVULN: 1.5,          // no new hits for this long after being stunned (includes stun)

  // ---- Stretch-cinch (action also snaps the leash shut, end -> collar) ----
  CINCH_MIN_AREA: 1500,     // loops smaller than this (sq px; ~39x39) catch nothing
  CINCH_PREVIEW_ALPHA: 0.45,// faint dashed preview line while the stretch is ready
  CINCH_DASH: 6,            // dash length of the preview line
  CINCH_HIGHLIGHT_PAD: 5,   // ring around items the cinch would catch

  // ---- Leash ----
  LEASH_LENGTH: 480,        // full leash length measured back along her path from the head
  LEASH_IGNORE: 70,         // nearest stretch of leash that can't close a loop (prevents accidents)
  LEASH_TOLERANCE: 9,       // head only needs to come this close to the leash to close a loop
  TRAIL_SAMPLE: 4,          // distance between recorded path points
  CHEESE_LEASH_MULT: 1.5,   // cheese: leash +50%
  CHEESE_TIME: 8,

  // ---- Items ----
  ITEM_CAP: 7,              // max items on the floor at once
  ITEM_START: 5,            // items on the floor when a round starts
  ITEM_SPAWN_INTERVAL: 0.8, // seconds between spawns while below the cap
  ITEM_MIN_DIST_ZOE: 70,    // don't spawn right next to Zoe's head
  ITEM_MIN_GAP: 24,         // min distance between items
  ITEM_EDGE: 18,            // keep items this far from the walls
  ITEMS: {
    sock:   { points: 1, weight: 70, radius: 6 },
    shoe:   { points: 3, weight: 15, radius: 9 },
    cheese: { points: 1, weight: 15, radius: 7, maxOnField: 1 },
  },

  // ---- Other dogs (hazards) ----
  DOG_START: 2,
  DOG_MAX: 5,
  DOG_ADD_EVERY: 15,        // one more dog every N seconds
  DOG_RADIUS: 12,
  DOG_WANDER_SPEED: 50,
  DOG_CHASE_SPEED: 95,      // keep below ZOE_SPEED so she can escape
  DOG_CHASE_RADIUS: 110,    // dogs chase Zoe when her head is this close
  DOG_TURN_RATE: 3.0,
  DOG_RETREAT_TIME: 1.5,    // after biting Zoe, the dog backs off this long
  DOG_SPAWN_MIN_DIST: 170,  // new dogs appear at least this far from Zoe
  DOG_SNAP_PAD: 2,          // extra reach when a dog touches the leash

  // ---- Scoring ----
  LOOP_SIZE_BONUS: 0.5,     // multiplier = 1 + this * (items in loop - 1)
  CHAIN_WINDOW: 2.0,        // loops within this many seconds chain
  CHAIN_BONUS: 0.5,         // multiplier = 1 + this * (chain - 1)

  // ---- Juice ----
  HITSTOP: 0.06,            // freeze-frame on capture
  FLASH_TIME: 0.3,          // white loop flash fade
  POPUP_TIME: 0.9,          // "+N" float time
  POPUP_RISE: 36,           // how far popups float up
  MASTER_VOLUME: 0.25,
  BLIP_BASE_HZ: 520,
  BLIP_SEMITONES_PER_CHAIN: 3,
  BLIP_MAX_CHAIN: 8,
  BLIP_TIME: 0.12,

  // ---- Controls ----
  PAD_RADIUS: 50,           // thumb-pad size; dragging further drags the pad along
  PAD_DEADZONE: 8,
  MOUSE_DEADZONE: 14,
  ACTION_BTN_X: 346,        // on-screen stretch button (touch only)
  ACTION_BTN_Y: 546,
  ACTION_BTN_R: 34,
};

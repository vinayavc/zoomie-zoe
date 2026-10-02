// Best-score storage: chrome.storage.local inside the extension,
// localStorage on the web. Never throws.

const KEY = 'doxieArcade.best';

function chromeStore() {
  const c = globalThis.chrome;
  return c && c.storage && c.storage.local ? c.storage.local : null;
}

export async function getBest() {
  try {
    const store = chromeStore();
    if (store) {
      const res = await store.get(KEY);
      return Number(res[KEY]) || 0;
    }
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

export async function setBest(value) {
  try {
    const store = chromeStore();
    if (store) {
      await store.set({ [KEY]: value });
      return;
    }
    localStorage.setItem(KEY, String(value));
  } catch {
    // storage blocked (private mode etc.): the best score just won't persist
  }
}

// Sound on/off (M key). Same adapter as the best score.
const MUTE_KEY = 'doxieArcade.muted';

export async function getMuted() {
  try {
    const store = chromeStore();
    if (store) {
      const res = await store.get(MUTE_KEY);
      return res[MUTE_KEY] === true;
    }
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export async function setMuted(value) {
  try {
    const store = chromeStore();
    if (store) {
      await store.set({ [MUTE_KEY]: !!value });
      return;
    }
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    // storage blocked: mute just won't persist
  }
}

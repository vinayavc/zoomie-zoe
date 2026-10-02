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

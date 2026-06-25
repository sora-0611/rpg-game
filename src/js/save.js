const SAVE_KEY = 'rpgGameSaveData';
const SAVE_VERSION = '1.0.0';

function readRawSaveData() {
  return localStorage.getItem(SAVE_KEY);
}

export function hasSaveData() {
  return readRawSaveData() !== null;
}

export function isSaveDataValid() {
  const raw = readRawSaveData();
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);
    return (
      typeof data.version === 'string' &&
      typeof data.coin === 'number' && data.coin >= 0 &&
      Array.isArray(data.partyState) &&
      Array.isArray(data.inventory) &&
      typeof data.mapProgress === 'object' && data.mapProgress !== null
    );
  } catch {
    return false;
  }
}

export function clearSaveData() {
  localStorage.removeItem(SAVE_KEY);
}

export function createNewSaveData() {
  const data = {
    saveId: 'fixed',
    version: SAVE_VERSION,
    playTime: 0,
    coin: 0,
    partyState: [],
    inventory: [],
    mapProgress: {},
    flags: {},
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  return data;
}

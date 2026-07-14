import { STORAGE_KEY } from "./config";

function getDefaultStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadBestScore(storage = getDefaultStorage()): number {
  if (!storage) return 0;

  try {
    const value = Number(storage.getItem(STORAGE_KEY));
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score: number, storage = getDefaultStorage()): void {
  if (!storage || !Number.isSafeInteger(score) || score < 0) return;

  try {
    storage.setItem(STORAGE_KEY, String(score));
  } catch {
    // Storage may be unavailable in private or locked-down browsing contexts.
  }
}

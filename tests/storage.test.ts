import { STORAGE_KEY } from "../src/game/config";
import { loadBestScore, saveBestScore } from "../src/game/storage";
import { describe, expect, it } from "vitest";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("best-score storage", () => {
  it("round-trips a valid score", () => {
    const storage = new MemoryStorage();
    saveBestScore(17, storage);
    expect(loadBestScore(storage)).toBe(17);
  });

  it("rejects malformed and negative values", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "not-a-score");
    expect(loadBestScore(storage)).toBe(0);
    storage.setItem(STORAGE_KEY, "-4");
    expect(loadBestScore(storage)).toBe(0);
  });
});

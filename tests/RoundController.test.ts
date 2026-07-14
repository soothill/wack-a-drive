import { getDifficulty, type RoundTuning } from "../src/game/config";
import { RoundController } from "../src/game/RoundController";
import { describe, expect, it } from "vitest";

const testTuning: RoundTuning = {
  durationMs: 5_000,
  initialSpawnDelayMs: 100,
  spawnDelayStartMs: 200,
  spawnDelayEndMs: 100,
  exposureStartMs: 700,
  exposureEndMs: 400,
  dualDriveProgress: 0.2,
  hitCooldownMs: 100,
  retractCooldownMs: 80,
  bayCount: 9,
};

describe("RoundController", () => {
  it("ramps cadence, exposure, and active-drive count", () => {
    const start = getDifficulty(0, testTuning);
    const end = getDifficulty(5_000, testTuning);

    expect(start.spawnDelayMs).toBe(200);
    expect(start.exposureMs).toBe(700);
    expect(start.maxActive).toBe(1);
    expect(end.spawnDelayMs).toBe(100);
    expect(end.exposureMs).toBe(400);
    expect(end.maxActive).toBe(2);
  });

  it("scores an active bay only once", () => {
    const round = new RoundController(testTuning, () => 0);
    round.start(0);
    const spawn = round.tick(100).find((event) => event.type === "spawn");
    expect(spawn?.type).toBe("spawn");
    if (!spawn || spawn.type !== "spawn") throw new Error("Expected a spawn event");

    expect(round.hitBay(spawn.bayIndex)).toMatchObject({ hit: true, score: 1 });
    expect(round.hitBay(spawn.bayIndex)).toMatchObject({ hit: false, score: 1 });
    expect(round.hitBay(8)).toMatchObject({ hit: false, score: 1 });
  });

  it("can expose two drives after the opening phase", () => {
    const round = new RoundController(testTuning, () => 0);
    round.start(0);
    const firstSpawn = round.tick(1_100).filter((event) => event.type === "spawn");
    const secondSpawn = round.tick(1_400).filter((event) => event.type === "spawn");

    expect(firstSpawn).toHaveLength(1);
    expect(secondSpawn).toHaveLength(1);
    expect(round.getSnapshot().bayStates.filter((state) => state === "active")).toHaveLength(2);
  });

  it("does not consume round time while paused", () => {
    const round = new RoundController(testTuning, () => 0);
    round.start(1_000);
    round.tick(2_000);
    round.pause(2_250);
    round.resume(12_250);
    round.tick(13_000);

    expect(round.getSnapshot().elapsedMs).toBe(2_000);
    expect(round.getSnapshot().remainingMs).toBe(3_000);
  });

  it("finishes at the configured duration and retracts active drives", () => {
    const round = new RoundController(testTuning, () => 0);
    round.start(0);
    round.tick(100);
    const events = round.tick(5_000);

    expect(events.some((event) => event.type === "finished")).toBe(true);
    expect(round.getSnapshot().phase).toBe("finished");
    expect(round.getSnapshot().remainingMs).toBe(0);
    expect(round.getSnapshot().bayStates.every((state) => state === "idle")).toBe(true);
  });
});

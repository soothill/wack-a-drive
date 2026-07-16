import { getDifficulty, ROUND_TUNING, type RoundTuning } from "./config";
import type {
  BayState,
  DifficultySnapshot,
  GamePhase,
  HitResult,
  RoundEvent,
  RoundSnapshot,
} from "./types";

interface BayRuntime {
  state: BayState;
  activeUntilMs: number;
  releaseAtMs: number;
}

type RandomSource = () => number;

export class RoundController {
  private phase: GamePhase = "ready";
  private elapsedMs = 0;
  private score = 0;
  private lastTickMs = 0;
  private nextSpawnAtMs = 0;
  private readonly bays: BayRuntime[];

  constructor(
    private readonly tuning: RoundTuning = ROUND_TUNING,
    private readonly random: RandomSource = Math.random,
  ) {
    this.bays = Array.from({ length: tuning.bayCount }, () => this.createIdleBay());
  }

  start(nowMs: number): void {
    this.phase = "playing";
    this.elapsedMs = 0;
    this.score = 0;
    this.lastTickMs = nowMs;
    this.nextSpawnAtMs = this.tuning.initialSpawnDelayMs;
    this.bays.forEach((bay) => Object.assign(bay, this.createIdleBay()));
  }

  pause(nowMs: number): void {
    if (this.phase !== "playing") return;
    this.advanceClock(nowMs);
    this.phase = "paused";
  }

  resume(nowMs: number): void {
    if (this.phase !== "paused") return;
    this.phase = "playing";
    this.lastTickMs = nowMs;
  }

  tick(nowMs: number): RoundEvent[] {
    if (this.phase !== "playing") return [];

    this.advanceClock(nowMs);
    const events: RoundEvent[] = [];

    if (this.elapsedMs >= this.tuning.durationMs) {
      this.finish(events);
      return events;
    }

    this.releaseCoolingBays();
    this.expireActiveBays(events);
    this.trySpawn(events);
    return events;
  }

  hitBay(bayIndex: number): HitResult {
    const bay = this.bays[bayIndex];
    if (this.phase !== "playing" || !bay || bay.state !== "active") {
      return { hit: false, bayIndex, score: this.score };
    }

    bay.state = "hit";
    bay.releaseAtMs = this.elapsedMs + this.tuning.hitCooldownMs;
    this.score += 1;
    if (!this.hasActiveBays()) this.scheduleNextSpawn();
    return { hit: true, bayIndex, score: this.score };
  }

  getDifficulty(): DifficultySnapshot {
    return getDifficulty(this.elapsedMs, this.tuning);
  }

  getSnapshot(): RoundSnapshot {
    return {
      phase: this.phase,
      elapsedMs: this.elapsedMs,
      remainingMs: Math.max(0, this.tuning.durationMs - this.elapsedMs),
      score: this.score,
      bayStates: this.bays.map((bay) => bay.state),
    };
  }

  private createIdleBay(): BayRuntime {
    return { state: "idle", activeUntilMs: 0, releaseAtMs: 0 };
  }

  private advanceClock(nowMs: number): void {
    const delta = Math.max(0, nowMs - this.lastTickMs);
    this.elapsedMs = Math.min(this.tuning.durationMs, this.elapsedMs + delta);
    this.lastTickMs = nowMs;
  }

  private releaseCoolingBays(): void {
    for (const bay of this.bays) {
      if ((bay.state === "hit" || bay.state === "retracting") && bay.releaseAtMs <= this.elapsedMs) {
        Object.assign(bay, this.createIdleBay());
      }
    }
  }

  private expireActiveBays(events: RoundEvent[]): void {
    let expiredAny = false;
    this.bays.forEach((bay, bayIndex) => {
      if (bay.state === "active" && bay.activeUntilMs <= this.elapsedMs) {
        bay.state = "retracting";
        bay.releaseAtMs = this.elapsedMs + this.tuning.retractCooldownMs;
        events.push({ type: "retract", bayIndex, reason: "timeout" });
        expiredAny = true;
      }
    });
    if (expiredAny && !this.hasActiveBays()) this.scheduleNextSpawn();
  }

  private trySpawn(events: RoundEvent[]): void {
    if (this.elapsedMs < this.nextSpawnAtMs) return;

    const difficulty = this.getDifficulty();
    if (this.hasActiveBays()) return;

    const idleIndices = this.bays
      .map((bay, index) => (bay.state === "idle" ? index : -1))
      .filter((index) => index >= 0);
    const spawnCount =
      difficulty.maxActive === 2 &&
      idleIndices.length >= 2 &&
      this.random() < difficulty.dualDriveChance
        ? 2
        : 1;

    for (let spawnIndex = 0; spawnIndex < spawnCount && idleIndices.length > 0; spawnIndex += 1) {
      const randomIndex = Math.min(
        idleIndices.length - 1,
        Math.floor(this.random() * idleIndices.length),
      );
      const [bayIndex] = idleIndices.splice(randomIndex, 1);
      const bay = bayIndex === undefined ? undefined : this.bays[bayIndex];

      if (bay && bayIndex !== undefined) {
        const exposureJitter =
          this.tuning.exposureJitterMin +
          this.random() * (this.tuning.exposureJitterMax - this.tuning.exposureJitterMin);
        const exposureMs = Math.round(difficulty.exposureMs * exposureJitter);
        bay.state = "active";
        bay.activeUntilMs = this.elapsedMs + exposureMs;
        events.push({
          type: "spawn",
          bayIndex,
          exposureMs,
          elapsedMs: this.elapsedMs,
        });
      }
    }

    if (events.some((event) => event.type === "spawn" && event.elapsedMs === this.elapsedMs)) {
      this.nextSpawnAtMs = Number.POSITIVE_INFINITY;
    }
  }

  private hasActiveBays(): boolean {
    return this.bays.some((bay) => bay.state === "active");
  }

  private scheduleNextSpawn(): void {
    const difficulty = this.getDifficulty();
    const jitter = 0.84 + this.random() * 0.32;
    this.nextSpawnAtMs = this.elapsedMs + Math.round(difficulty.spawnDelayMs * jitter);
  }

  private finish(events: RoundEvent[]): void {
    this.bays.forEach((bay, bayIndex) => {
      if (bay.state === "active") {
        events.push({ type: "retract", bayIndex, reason: "round-end" });
      }
      Object.assign(bay, this.createIdleBay());
    });
    this.phase = "finished";
    events.push({ type: "finished", score: this.score });
  }
}

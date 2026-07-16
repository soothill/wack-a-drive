export type GamePhase = "ready" | "playing" | "paused" | "finished";

export type BayState = "idle" | "active" | "hit" | "retracting";

export interface SpawnEvent {
  type: "spawn";
  bayIndex: number;
  exposureMs: number;
  elapsedMs: number;
}

export interface RetractEvent {
  type: "retract";
  bayIndex: number;
  reason: "timeout" | "round-end";
}

export interface RoundFinishedEvent {
  type: "finished";
  score: number;
}

export type RoundEvent = SpawnEvent | RetractEvent | RoundFinishedEvent;

export interface ScoreState {
  score: number;
  bestScore: number;
}

export interface DifficultySnapshot {
  progress: number;
  spawnDelayMs: number;
  exposureMs: number;
  maxActive: 1 | 2;
  dualDriveChance: number;
}

export interface RoundSnapshot {
  phase: GamePhase;
  elapsedMs: number;
  remainingMs: number;
  score: number;
  bayStates: readonly BayState[];
}

export interface HitResult {
  hit: boolean;
  bayIndex: number;
  score: number;
}

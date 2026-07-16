import type { DifficultySnapshot } from "./types";

export const STAGE = {
  width: 390,
  height: 780,
} as const;

export const BOARD = {
  columns: 3,
  rows: 3,
  bayCount: 9,
  hitSize: 116,
  centersX: [79, 195, 311],
  centersY: [285, 401, 517],
} as const;

export interface RoundTuning {
  durationMs: number;
  initialSpawnDelayMs: number;
  spawnDelayStartMs: number;
  spawnDelayEndMs: number;
  exposureStartMs: number;
  exposureEndMs: number;
  exposureJitterMin: number;
  exposureJitterMax: number;
  dualDriveProgress: number;
  dualDriveChanceStart: number;
  dualDriveChanceEnd: number;
  hitCooldownMs: number;
  retractCooldownMs: number;
  bayCount: number;
}

export const ROUND_TUNING: RoundTuning = {
  durationMs: 45_000,
  initialSpawnDelayMs: 650,
  spawnDelayStartMs: 880,
  spawnDelayEndMs: 580,
  exposureStartMs: 1_500,
  exposureEndMs: 900,
  exposureJitterMin: 0.9,
  exposureJitterMax: 1.3,
  dualDriveProgress: 0.55,
  dualDriveChanceStart: 0.18,
  dualDriveChanceEnd: 0.48,
  hitCooldownMs: 190,
  retractCooldownMs: 150,
  bayCount: BOARD.bayCount,
};

export const STORAGE_KEY = "wack-a-drive:v1:best-score";

const lerp = (from: number, to: number, amount: number): number =>
  from + (to - from) * amount;

export function getDifficulty(
  elapsedMs: number,
  tuning: RoundTuning = ROUND_TUNING,
): DifficultySnapshot {
  const progress = Math.min(1, Math.max(0, elapsedMs / tuning.durationMs));
  const eased = progress * progress * (3 - 2 * progress);
  const dualWindow = Math.max(Number.EPSILON, 1 - tuning.dualDriveProgress);
  const dualProgress = Math.max(
    0,
    Math.min(1, (progress - tuning.dualDriveProgress) / dualWindow),
  );

  return {
    progress,
    spawnDelayMs: Math.round(lerp(tuning.spawnDelayStartMs, tuning.spawnDelayEndMs, eased)),
    exposureMs: Math.round(lerp(tuning.exposureStartMs, tuning.exposureEndMs, eased)),
    maxActive: progress >= tuning.dualDriveProgress ? 2 : 1,
    dualDriveChance:
      progress >= tuning.dualDriveProgress
        ? lerp(tuning.dualDriveChanceStart, tuning.dualDriveChanceEnd, dualProgress)
        : 0,
  };
}

export const KELAS_OPTIONS = ["C123", "C223", "A23"] as const;
export type Kelas = (typeof KELAS_OPTIONS)[number];

export const MIN_DURATION_SEC = 120; // 2 menit
export const MAX_DURATION_SEC = 300; // 5 menit

export const AI_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  DONE: "done",
  FAILED: "failed",
  SKIPPED: "skipped",
} as const;

export type AiStatus = (typeof AI_STATUS)[keyof typeof AI_STATUS];

// Shared domain types and helpers.
// Keep DTOs, enums, and pure functions here to avoid cross-service drift.

export type Id = string;

export interface VideoSource {
  id: Id;
  url: string;
  durationSeconds: number;
  status: "created" | "ingested" | "transcribed" | "segmented" | "composed" | "frames_ready" | "failed";
}

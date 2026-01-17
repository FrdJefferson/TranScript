// Entry point for background workers.
// Each worker handles a queue: ingest, asr, segment, compose, frames, export.
// Keep job handlers small and delegate domain logic to shared package.

export function startWorker(): void {
  // TODO: connect to queue broker and register job processors.
  // This placeholder documents the intended responsibility split.
}

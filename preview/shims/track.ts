/**
 * The preview has no server to send runs and events to, so it records
 * nothing. The real site saves them (lib/client/track.ts).
 */
export function track(): void {}
export function saveRun(): void {}

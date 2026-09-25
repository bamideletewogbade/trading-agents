/**
 * Telling the server what happened, without ever making the learner wait.
 *
 * Events and runs are fire-and-forget: `sendBeacon` where it exists (it
 * survives the tab closing, which is exactly when "they left after the
 * month" happens), `fetch` with keepalive otherwise. A failure is dropped
 * silently. The learning never depends on the network; only our measurement
 * of it does (plan §2).
 *
 * The server saves them only when a database is configured, and ignores
 * them otherwise.
 */

function send(path: string, body: unknown): void {
  const json = JSON.stringify(body);
  try {
    if (
      navigator.sendBeacon?.(
        path,
        new Blob([json], { type: 'application/json' }),
      )
    )
      return;
  } catch {
    // Fall through to fetch.
  }
  fetch(path, {
    method: 'POST',
    body: json,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
  }).catch(() => {});
}

export function track(
  type: string,
  data: Record<string, unknown> = {},
  runId?: string,
): void {
  send('/api/events', { type, runId, data });
}

export function saveRun(run: {
  id: string;
  parentId?: string;
  experience: string;
  version: number;
  config: unknown;
  seed: string;
  actions: readonly unknown[];
}): void {
  send('/api/runs', run);
}

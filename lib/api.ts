/**
 * One place that turns a thrown error into a response.
 *
 * Unexpected errors become a sentence that says nothing specific, because a
 * thrown Postgres error carries the connection string and a provider error
 * can carry a key. The detail goes to the log. (Ported from Kanea Studio.)
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function json(
  data: unknown,
  status = 200,
  headers?: HeadersInit,
): Response {
  const response = Response.json(data, { status, headers });
  // Private by default: these responses belong to one learner.
  if (!response.headers.has('Cache-Control'))
    response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export function route(
  handler: (request: Request) => Promise<Response>,
  options: { maxBytes?: number } = {},
): (request: Request) => Promise<Response> {
  const maxBytes = options.maxBytes ?? 64 * 1024;
  return async (request) => {
    try {
      const declared = Number(request.headers.get('content-length') ?? '0');
      if (Number.isFinite(declared) && declared > maxBytes)
        return json({ detail: 'That is too large to send.' }, 413);
      return await handler(request);
    } catch (error) {
      if (error instanceof ApiError)
        return json({ detail: error.message }, error.status);
      console.error('[api] unhandled', error);
      return json(
        { detail: 'Something went wrong on our side. Please try again.' },
        500,
      );
    }
  };
}

/** A JSON body, read once and capped, or an ApiError. */
export async function readJson(
  request: Request,
  maxBytes = 64 * 1024,
): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes)
    throw new ApiError(413, 'That is too large to send.');
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, 'That was not JSON.');
  }
}

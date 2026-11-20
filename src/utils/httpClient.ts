/**
 * Resilient HTTP Client conforming to AGENTS.md Section 3 (Resilience)
 * - Rule 3.1: Explicit timeouts on every outbound request (no infinite waits)
 * - Rule 3.2: Exponential backoff with jitter for transient failures (network, 429, 502/503/504)
 * - Never retries 4xx validation/client errors
 */

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public url: string,
    message?: string
  ) {
    super(message || `HTTP ${status} ${statusText} for ${url}`);
    this.name = 'HttpError';
  }
}

export class TimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

function isTransientError(status: number): boolean {
  // 429 Rate limited, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 200; // Add up to 200ms jitter
  return Math.min(maxDelayMs, exponential + jitter);
}

export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    timeoutMs = 15000, // 15s explicit timeout budget (Rule 3.1)
    maxRetries = 3,    // Cap attempts at 3 (Rule 3.2)
    baseDelayMs = 500,
    maxDelayMs = 5000,
    ...fetchInit
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchInit,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If successful or client error that should NOT be retried (4xx except 429)
      if (response.ok) {
        return response;
      }

      if (!isTransientError(response.status) && response.status >= 400 && response.status < 500) {
        // 4xx validation or auth error: fail fast immediately (Rule 3.2: Never retry 4xx)
        throw new HttpError(response.status, response.statusText, url);
      }

      // Transient server or rate-limit error: prepare to retry
      lastError = new HttpError(response.status, response.statusText, url);

      if (attempt < maxRetries) {
        // Respect Retry-After header if returned
        const retryAfterHeader = response.headers.get('Retry-After');
        let delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);
        if (retryAfterHeader) {
          const parsed = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsed)) delay = parsed * 1000;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        lastError = new TimeoutError(url, timeoutMs);
      } else {
        lastError = err;
      }

      // If it was a non-transient HttpError (e.g. 400/401/403/404), throw immediately
      if (err instanceof HttpError && !isTransientError(err.status)) {
        throw err;
      }

      if (attempt < maxRetries) {
        const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

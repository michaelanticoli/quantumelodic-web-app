export class RequestTimeoutError extends Error {
  constructor(timeoutMs: number, message = `Request timed out after ${Math.round(timeoutMs / 1000)} seconds`) {
    super(message);
    this.name = 'RequestTimeoutError';
  }
}

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 30_000) {
  const timeoutController = new AbortController();
  const externalSignal = init.signal;

  const handleExternalAbort = () => {
    timeoutController.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      timeoutController.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener('abort', handleExternalAbort, { once: true });
    }
  }

  const timeoutId = setTimeout(() => {
    timeoutController.abort(new RequestTimeoutError(timeoutMs));
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: timeoutController.signal,
    });
  } catch (error) {
    if (timeoutController.signal.aborted && !externalSignal?.aborted) {
      throw new RequestTimeoutError(timeoutMs);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', handleExternalAbort);
  }
}
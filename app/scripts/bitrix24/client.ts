import type { BitrixResponse } from "./types";

export class Bitrix24RestError extends Error {
  constructor(
    public readonly method: string,
    public readonly status: number,
    public readonly code: string,
    public readonly description: string
  ) {
    super(`Bitrix24 ${method}: ${code} (${status}) — ${description}`);
    this.name = "Bitrix24RestError";
  }
}

export class ProvisionerBitrixClient {
  constructor(
    private readonly webhookUrl: string,
    private readonly timeoutMs: number,
    private readonly retryCount: number
  ) {}

  get portalHost(): string {
    return new URL(this.webhookUrl).host;
  }

  async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const response = await this.callRawWithRetry<T>(method, params);
    return response.result as T;
  }

  async callWithMeta<T>(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<BitrixResponse<T>> {
    return this.callRawWithRetry<T>(method, params);
  }

  async listAll<T>(
    method: string,
    params: Record<string, unknown>,
    extract: (result: unknown) => T[]
  ): Promise<T[]> {
    const all: T[] = [];
    let start = 0;

    while (true) {
      // Każda strona listy korzysta z takiego samego retry/backoff jak zwykłe wywołania.
      // Wcześniej paginowane odczyty omijały retry, przez co chwilowy limit API
      // mógł zostać błędnie zinterpretowany jako pusta lista pól lub produktów.
      const response = await this.callRawWithRetry<unknown>(method, {
        ...params,
        start,
      });
      all.push(...extract(response.result));
      if (response.next === undefined || response.next === null) break;
      start = Number(response.next);
      if (!Number.isFinite(start)) break;
    }

    return all;
  }

  async isMethodAvailable(method: string): Promise<boolean> {
    try {
      const result = await this.call<Record<string, unknown>>("method.get", {
        name: method,
      });
      const available = result.isAvailable ?? result.IS_AVAILABLE;
      const existing = result.isExisting ?? result.IS_EXISTING;
      return Boolean(available ?? existing);
    } catch (error) {
      if (
        error instanceof Bitrix24RestError &&
        /METHOD_NOT_FOUND|ERROR_METHOD_NOT_FOUND/i.test(error.code)
      ) {
        return false;
      }
      throw error;
    }
  }

  private async callRawWithRetry<T>(
    method: string,
    params: Record<string, unknown>
  ): Promise<BitrixResponse<T>> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.retryCount; attempt += 1) {
      try {
        return await this.callRaw<T>(method, params);
      } catch (error) {
        lastError = error;
        if (!shouldRetry(error) || attempt === this.retryCount) throw error;
        await sleep(Math.min(1000 * 2 ** (attempt - 1), 5000));
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private async callRaw<T>(
    method: string,
    params: Record<string, unknown>
  ): Promise<BitrixResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.webhookUrl}/${method}.json`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      const text = await response.text();
      let data: BitrixResponse<T>;
      try {
        data = text ? (JSON.parse(text) as BitrixResponse<T>) : {};
      } catch {
        throw new Bitrix24RestError(
          method,
          response.status,
          "INVALID_JSON",
          text.slice(0, 500) || "Pusta odpowiedź"
        );
      }

      if (!response.ok || data.error) {
        throw new Bitrix24RestError(
          method,
          response.status,
          data.error || "HTTP_ERROR",
          data.error_description || response.statusText || "Brak opisu błędu"
        );
      }

      return data;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Bitrix24RestError(
          method,
          408,
          "REQUEST_TIMEOUT",
          `Przekroczono limit ${this.timeoutMs} ms`
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof Bitrix24RestError) {
    return (
      error.status === 408 ||
      error.status === 429 ||
      error.status >= 500 ||
      /QUERY_LIMIT_EXCEEDED|OVERLOAD_LIMIT|REQUEST_TIMEOUT|OPERATION_TIME_LIMIT/i.test(
        error.code
      )
    );
  }
  return error instanceof TypeError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

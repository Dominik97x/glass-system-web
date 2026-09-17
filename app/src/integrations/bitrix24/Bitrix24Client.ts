import type { Bitrix24Config } from "./Bitrix24Config";
import type {
  Bitrix24ApiErrorResponse,
  Bitrix24CategoryListPayload,
  Bitrix24CategoryListResponse,
  Bitrix24ItemAddPayload,
  Bitrix24ItemAddResponse,
  Bitrix24ItemFieldsPayload,
  Bitrix24ItemFieldsResponse,
  Bitrix24ProductRowSetPayload,
  Bitrix24StatusListPayload,
  Bitrix24StatusListResponse,
} from "./Bitrix24Types";

export class Bitrix24Client {
  constructor(private readonly config: Bitrix24Config) {}

  async addCrmItem(
    payload: Bitrix24ItemAddPayload
  ): Promise<Bitrix24ItemAddResponse> {
    return this.call<Bitrix24ItemAddResponse>("crm.item.add", payload);
  }

  async setProductRows(
    payload: Bitrix24ProductRowSetPayload
  ): Promise<Bitrix24ApiErrorResponse> {
    return this.call<Bitrix24ApiErrorResponse>(
      "crm.item.productrow.set",
      payload
    );
  }

  async listCrmCategories(
    payload: Bitrix24CategoryListPayload
  ): Promise<Bitrix24CategoryListResponse> {
    return this.call<Bitrix24CategoryListResponse>(
      "crm.category.list",
      payload
    );
  }

  async getCrmItemFields(
    payload: Bitrix24ItemFieldsPayload
  ): Promise<Bitrix24ItemFieldsResponse> {
    return this.call<Bitrix24ItemFieldsResponse>("crm.item.fields", payload);
  }

  async listCrmStatuses(
    payload: Bitrix24StatusListPayload
  ): Promise<Bitrix24StatusListResponse> {
    return this.call<Bitrix24StatusListResponse>("crm.status.list", payload);
  }

  async call<TResult>(method: string, payload: unknown): Promise<TResult> {
    if (!this.config.enabled) {
      throw new Error("Bitrix24 integration is disabled.");
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.retryCount; attempt += 1) {
      try {
        return await this.callOnce<TResult>(method, payload);
      } catch (error) {
        lastError = error;

        if (attempt >= this.config.retryCount || !isRetryableError(error)) {
          throw error;
        }

        await delay(300 * 2 ** attempt);
      }
    }

    throw lastError;
  }

  private async callOnce<TResult>(
    method: string,
    payload: unknown
  ): Promise<TResult> {
    const webhookUrl = this.config.webhookUrl.replace(/\/$/, "");
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.requestTimeoutMs
    );

    try {
      const response = await fetch(`${webhookUrl}/${method}.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store",
      });

      const rawBody = await response.text();
      const data = parseJsonResponse(rawBody) as Bitrix24ApiErrorResponse &
        TResult;

      if (!response.ok || data.error) {
        throw new Bitrix24ApiError(
          method,
          response.status,
          data.error ?? "unknown_error",
          data.error_description ?? rawBody.slice(0, 500)
        );
      }

      return data as TResult;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Bitrix24TransportError(
          `Bitrix24 ${method}: request timed out after ${this.config.requestTimeoutMs} ms.`,
          true
        );
      }

      if (
        error instanceof Bitrix24ApiError ||
        error instanceof Bitrix24TransportError
      ) {
        throw error;
      }

      throw new Bitrix24TransportError(
        `Bitrix24 ${method}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        true
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class Bitrix24ApiError extends Error {
  constructor(
    public readonly method: string,
    public readonly httpStatus: number,
    public readonly apiCode: string,
    description: string
  ) {
    super(
      `Bitrix24 ${method}: ${apiCode} (${httpStatus}) — ${description || "Brak opisu błędu."}`
    );
    this.name = "Bitrix24ApiError";
  }

  get retryable(): boolean {
    return (
      this.httpStatus === 429 ||
      this.httpStatus >= 500 ||
      ["QUERY_LIMIT_EXCEEDED", "INTERNAL_SERVER_ERROR"].includes(
        this.apiCode
      )
    );
  }
}

export class Bitrix24TransportError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "Bitrix24TransportError";
  }
}

function parseJsonResponse(rawBody: string): unknown {
  if (rawBody.trim().length === 0) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new Bitrix24TransportError(
      `Bitrix24 returned a non-JSON response: ${rawBody.slice(0, 500)}`,
      false
    );
  }
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Bitrix24ApiError) {
    return error.retryable;
  }

  if (error instanceof Bitrix24TransportError) {
    return error.retryable;
  }

  return false;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

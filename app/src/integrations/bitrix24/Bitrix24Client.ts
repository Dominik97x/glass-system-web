import type { Bitrix24Config } from "./Bitrix24Config";
import type {
  Bitrix24ApiErrorResponse,
  Bitrix24ItemAddPayload,
  Bitrix24ItemAddResponse,
  Bitrix24ProductRowSetPayload,
} from "./Bitrix24Types";

export class Bitrix24Client {
  constructor(private config: Bitrix24Config) {}

  async addCrmItem(
    payload: Bitrix24ItemAddPayload
  ): Promise<Bitrix24ItemAddResponse> {
    return this.call<Bitrix24ItemAddResponse>("crm.item.add", payload);
  }

  async setProductRows(
    payload: Bitrix24ProductRowSetPayload
  ): Promise<unknown> {
    return this.call("crm.item.productrow.set", payload);
  }

  private async call<TResponse>(
    method: string,
    payload: unknown
  ): Promise<TResponse> {
    if (!this.config.enabled) {
      throw new Error("Bitrix24 integration is disabled");
    }

    const response = await fetch(this.createMethodUrl(method), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as
      | TResponse
      | Bitrix24ApiErrorResponse;

    if (!response.ok || "error" in data) {
      throw new Error(createBitrix24ErrorMessage(method, data));
    }

    return data as TResponse;
  }

  private createMethodUrl(method: string): string {
    const webhookUrl = this.config.webhookUrl.replace(/\/$/, "");

    return `${webhookUrl}/${method}.json`;
  }
}

function createBitrix24ErrorMessage(
  method: string,
  response: Bitrix24ApiErrorResponse
): string {
  const description =
    response.error_description ?? response.error ?? "Unknown error";

  return `Bitrix24 method ${method} failed: ${description}`;
}
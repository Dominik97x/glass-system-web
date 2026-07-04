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

  private async call<TResponse extends Bitrix24ApiErrorResponse>(
    method: string,
    payload: unknown
  ): Promise<TResponse> {
    if (!this.config.enabled) {
      throw new Error("Bitrix24 integration is disabled.");
    }

    const webhookUrl = this.config.webhookUrl.replace(/\/$/, "");
    const response = await fetch(`${webhookUrl}/${method}.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as TResponse;

    if (!response.ok || data.error) {
      throw new Error(createBitrix24ErrorMessage(method, response.status, data));
    }

    return data;
  }
}

function createBitrix24ErrorMessage(
  method: string,
  status: number,
  data: Bitrix24ApiErrorResponse
): string {
  const error = data.error ?? "unknown_error";
  const description = data.error_description ?? "No error description.";

  return `Bitrix24 API error for ${method}. HTTP status: ${status}. Error: ${error}. Description: ${description}`;
}
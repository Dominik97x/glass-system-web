export interface Bitrix24ItemAddPayload {
  entityTypeId: number;
  fields: Record<string, unknown>;
}

export interface Bitrix24ItemAddResponse {
  result?: {
    item?: {
      id?: number;
    };
  };
  error?: string;
  error_description?: string;
}

export interface Bitrix24ProductRow {
  productId?: number;
  productName: string;
  price: number;
  quantity: number;
  sort?: number;
  taxRate?: number;
  taxIncluded?: "Y" | "N";
  measureCode?: number;
}

export interface Bitrix24ProductRowSetPayload {
  ownerType: string;
  ownerId: number;
  productRows: Bitrix24ProductRow[];
}

export interface Bitrix24ApiErrorResponse {
  error?: string;
  error_description?: string;
}
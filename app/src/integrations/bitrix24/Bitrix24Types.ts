export interface Bitrix24ApiErrorResponse {
  error?: string;
  error_description?: string;
}

export interface Bitrix24ItemAddPayload {
  entityTypeId: number;
  fields: Record<string, unknown>;
}

export interface Bitrix24ItemAddResponse extends Bitrix24ApiErrorResponse {
  result?: {
    item?: {
      id?: number | string;
    };
  };
}

export interface Bitrix24ProductRow {
  productId?: number;
  productName?: string;
  price: number;
  quantity: number;
  sort?: number;
  taxRate?: number;
  taxIncluded?: "Y" | "N";
}

export interface Bitrix24ProductRowSetPayload {
  ownerType: string;
  ownerId: number | string;
  productRows: Bitrix24ProductRow[];
}

export interface Bitrix24CategoryListPayload {
  entityTypeId: number;
}

export interface Bitrix24Category {
  id: number;
  name: string;
  sort?: number;
  isDefault?: "Y" | "N";
}

export interface Bitrix24CategoryListResponse
  extends Bitrix24ApiErrorResponse {
  result?: {
    categories?: Bitrix24Category[];
  };
}

export interface Bitrix24ItemFieldsPayload {
  entityTypeId: number;
  useOriginalUfNames?: boolean;
}

export interface Bitrix24ItemFieldDefinition {
  title?: string;
  type?: string;
  isRequired?: boolean;
  isReadOnly?: boolean;
  isImmutable?: boolean;
  isMultiple?: boolean;
  isDynamic?: boolean;
  items?: unknown[];
}

export interface Bitrix24ItemFieldsResponse extends Bitrix24ApiErrorResponse {
  result?: {
    fields?: Record<string, Bitrix24ItemFieldDefinition>;
  };
}

export interface Bitrix24StatusListPayload {
  filter: {
    ENTITY_ID: string;
  };
}

export interface Bitrix24Status {
  ID?: string;
  ENTITY_ID?: string;
  STATUS_ID: string;
  NAME?: string;
  NAME_INIT?: string;
  SORT?: number;
  SYSTEM?: "Y" | "N";
}

export interface Bitrix24StatusListResponse extends Bitrix24ApiErrorResponse {
  result?: Bitrix24Status[];
}
export type CrmEntityKey = "deal" | "contact" | "company";
export type StageSemantics = "" | "S" | "F";
export type UserFieldType =
  | "string"
  | "integer"
  | "double"
  | "boolean"
  | "datetime"
  | "date"
  | "money"
  | "url"
  | "address"
  | "enumeration"
  | "file"
  | "employee"
  | "crm";

export interface StageBlueprint {
  code: string;
  name: string;
  semantics: StageSemantics;
  sort: number;
  color?: string;
}

export interface PipelineBlueprint {
  key: string;
  name: string;
  sort: number;
  useDefault?: boolean;
  stages: StageBlueprint[];
}

export interface SourceBlueprint {
  code: string;
  name: string;
  sort: number;
}

export interface EnumValueBlueprint {
  xmlId: string;
  value: string;
  sort: number;
  default?: boolean;
}

export interface UserFieldBlueprint {
  entity: CrmEntityKey;
  alias: string;
  label: string;
  type: UserFieldType;
  sort: number;
  multiple?: boolean;
  mandatory?: boolean;
  searchable?: boolean;
  showFilter?: boolean;
  settings?: Record<string, unknown>;
  enumValues?: EnumValueBlueprint[];
}

export interface CatalogSectionBlueprint {
  key: string;
  name: string;
  code: string;
  xmlId: string;
  sort: number;
  parentKey?: string;
}

export interface ProductBlueprint {
  sku: string;
  name: string;
  sectionKey: string;
  priceGross: number;
  currency: string;
  description?: string;
}

export interface ProvisioningBlueprint {
  version: string;
  portalLabel: string;
  dealEntityTypeId: number;
  pipelines: PipelineBlueprint[];
  sources: SourceBlueprint[];
  userFields: UserFieldBlueprint[];
  catalogSections: CatalogSectionBlueprint[];
}

export interface BitrixResponse<T> {
  result?: T;
  total?: number;
  next?: number;
  error?: string;
  error_description?: string;
}

export interface BitrixCategory {
  id: number;
  name: string;
  sort?: number;
  isDefault?: "Y" | "N" | boolean;
}

export interface BitrixStatus {
  ID?: string | number;
  ENTITY_ID?: string;
  STATUS_ID: string;
  NAME?: string;
  SORT?: string | number;
  SEMANTICS?: StageSemantics;
  COLOR?: string;
  SYSTEM?: "Y" | "N";
}

export interface BitrixUserField {
  id: string | number;
  entityId: string;
  fieldName: string;
  userTypeId: string;
  xmlId?: string | null;
  sort?: string | number;
  multiple?: "Y" | "N" | boolean;
  mandatory?: "Y" | "N" | boolean;
  editFormLabel?: string | Record<string, string>;
  enum?: Array<{
    id?: string | number;
    value?: string;
    xmlId?: string;
    sort?: string | number;
  }>;
}

export interface BitrixCatalog {
  id?: number;
  iblockId?: number;
  productIblockId?: number;
  name?: string;
  xmlId?: string;
}

export interface BitrixCatalogSection {
  id: number;
  iblockId: number;
  iblockSectionId?: number;
  name: string;
  code?: string;
  xmlId?: string;
  sort?: number;
}

export interface BitrixProduct {
  id: number;
  iblockId: number;
  iblockSectionId?: number;
  name: string;
  code?: string;
  xmlId?: string;
}

export type PlanActionKind = "create" | "update" | "reuse" | "skip" | "warning";

export interface PlanAction {
  kind: PlanActionKind;
  resource: "pipeline" | "stage" | "source" | "user_field" | "catalog_section" | "product" | "portal";
  key: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PortalAudit {
  generatedAt: string;
  portalHost: string;
  availableMethods: Record<string, boolean>;
  categories: BitrixCategory[];
  categoryDealCounts: Record<string, number>;
  stagesByEntityId: Record<string, BitrixStatus[]>;
  sources: BitrixStatus[];
  userFields: BitrixUserField[];
  catalogs: BitrixCatalog[];
  sections: BitrixCatalogSection[];
  products: BitrixProduct[];
  warnings: string[];
}

export interface ProvisioningPlan {
  generatedAt: string;
  blueprintVersion: string;
  portalHost: string;
  actions: PlanAction[];
}

export interface ProvisioningMapping {
  generatedAt: string;
  blueprintVersion: string;
  portalHost: string;
  pipelines: Record<string, { categoryId: number; name: string }>;
  stages: Record<string, { categoryId: number; entityId: string; stageId: string; name: string }>;
  sources: Record<string, { statusId: string; name: string }>;
  userFields: Record<string, { fieldId: string | number; fieldName: string; entityId: string; type: string }>;
  catalog?: {
    iblockId: number;
    sections: Record<string, { id: number; name: string; xmlId: string }>;
    products: Record<string, { id: number; name: string; priceGross?: number }>;
  };
}

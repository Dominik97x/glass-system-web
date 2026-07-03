export interface Bitrix24Config {
  enabled: boolean;
  webhookUrl: string;
  dealEntityTypeId: number;
  dealOwnerType: string;
  defaultCategoryId?: number;
  defaultStageId?: string;
  assignedById?: number;
  sourceId?: string;
}

export function getBitrix24Config(): Bitrix24Config {
  const enabled = process.env.BITRIX24_ENABLED === "true";

  if (!enabled) {
    return {
      enabled: false,
      webhookUrl: "",
      dealEntityTypeId: 2,
      dealOwnerType: "D",
    };
  }

  return {
    enabled: true,
    webhookUrl: getRequiredEnv("BITRIX24_WEBHOOK_URL"),
    dealEntityTypeId: getNumberEnv("BITRIX24_DEAL_ENTITY_TYPE_ID", 2),
    dealOwnerType: process.env.BITRIX24_DEAL_OWNER_TYPE ?? "D",
    defaultCategoryId: getOptionalNumberEnv("BITRIX24_DEFAULT_CATEGORY_ID"),
    defaultStageId: process.env.BITRIX24_DEFAULT_STAGE_ID,
    assignedById: getOptionalNumberEnv("BITRIX24_ASSIGNED_BY_ID"),
    sourceId: process.env.BITRIX24_SOURCE_ID,
  };
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsedValue;
}

function getOptionalNumberEnv(name: string): number | undefined {
  const value = process.env[name];

  if (!value) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsedValue;
}
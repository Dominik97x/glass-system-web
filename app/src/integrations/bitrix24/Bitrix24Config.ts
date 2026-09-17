export interface Bitrix24Config {
  enabled: boolean;
  webhookUrl: string;
  dealEntityTypeId: number;
  dealOwnerType: string;
  defaultCategoryId?: number;
  defaultStageId?: string;
  assignedById?: number;
  sourceId?: string;
  salesPipelineName: string;
  newInquiryStageName: string;
  calculatorSourceName: string;
  requestTimeoutMs: number;
  retryCount: number;
  retryDelayMinutes: number;
  vatRate: number;
  publicCalculatorUrl: string;
}

export function getBitrix24Config(): Bitrix24Config {
  const enabled = process.env.BITRIX24_ENABLED === "true";

  if (!enabled) {
    return {
      enabled: false,
      webhookUrl: "",
      dealEntityTypeId: 2,
      dealOwnerType: "D",
      salesPipelineName: "01 Sprzedaż z pomiarem",
      newInquiryStageName: "Nowe zapytanie",
      calculatorSourceName: "Kalkulator strony",
      requestTimeoutMs: 30_000,
      retryCount: 3,
      retryDelayMinutes: 15,
      vatRate: 8,
      publicCalculatorUrl: "",
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
    salesPipelineName:
      process.env.BITRIX24_SALES_PIPELINE_NAME ?? "01 Sprzedaż z pomiarem",
    newInquiryStageName:
      process.env.BITRIX24_NEW_INQUIRY_STAGE_NAME ?? "Nowe zapytanie",
    calculatorSourceName:
      process.env.BITRIX24_CALCULATOR_SOURCE_NAME ?? "Kalkulator strony",
    requestTimeoutMs: getNumberEnv("BITRIX24_REQUEST_TIMEOUT_MS", 30_000),
    retryCount: getNumberEnv("BITRIX24_RETRY_COUNT", 3),
    retryDelayMinutes: getNumberEnv("BITRIX24_SYNC_RETRY_DELAY_MINUTES", 15),
    vatRate: getNumberEnv("BITRIX24_VAT_RATE", 8),
    publicCalculatorUrl: getPublicCalculatorUrl(),
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

  if (!Number.isFinite(parsedValue)) {
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

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsedValue;
}

function getPublicCalculatorUrl(): string {
  const explicit = process.env.BITRIX24_PUBLIC_CALCULATOR_URL;
  if (explicit) return explicit;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  return siteUrl ? `${siteUrl.replace(/\/$/, "")}/kalkulator` : "";
}

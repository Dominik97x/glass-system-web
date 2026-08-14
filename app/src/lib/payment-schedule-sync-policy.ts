import {
  calculatePaymentSchedule305020,
  formatBitrixMoney,
  PAYMENT_SCHEDULE_305020,
} from "./payment-schedule";

export const PAYMENT_SCHEDULE_TRIGGER_STAGE_NAME =
  "Proforma / umowa wysłana";

export const PAYMENT_SCHEDULE_FIELDS = {
  contractDate: "UF_CRM_DEAL_MG_CONTRACT_DATE",
  advancePercent: "UF_CRM_DEAL_MG_ADVANCE_PERCENT",
  advanceAmount: "UF_CRM_DEAL_MG_ADVANCE_AMOUNT",
  stage2Amount: "UF_CRM_DEAL_MG_PAYMENT_STAGE2_AMOUNT",
  stage3Amount: "UF_CRM_DEAL_MG_PAYMENT_STAGE3_AMOUNT",
} as const;

export interface DealStageSnapshot {
  statusId: string;
  name: string;
  sort: number;
  semantics: string;
}

export interface PaymentScheduleSyncInput {
  dealId: number;
  totalGross: number;
  currency: string;
  stageId: string;
  contractDate?: unknown;
  advancePercent?: unknown;
  advanceAmount?: unknown;
  stage2Amount?: unknown;
  stage3Amount?: unknown;
  stages: DealStageSnapshot[];
}

export type PaymentScheduleSyncAction =
  | "before_trigger_stage"
  | "closed_stage"
  | "frozen_by_contract_date"
  | "up_to_date"
  | "needs_update";

export interface PaymentScheduleSyncDecision {
  action: PaymentScheduleSyncAction;
  dealId: number;
  stage: DealStageSnapshot;
  triggerStage: DealStageSnapshot;
  frozen: boolean;
  totalGross: number;
  currency: string;
  expected: {
    advancePercent: number;
    advanceAmount: number;
    stage2Amount: number;
    stage3Amount: number;
  };
  current: {
    advancePercent: number | null;
    advanceAmount: number | null;
    stage2Amount: number | null;
    stage3Amount: number | null;
  };
  fieldsToUpdate: Record<string, unknown>;
}

export function evaluatePaymentScheduleSync(
  input: PaymentScheduleSyncInput
): PaymentScheduleSyncDecision {
  if (!Number.isFinite(input.totalGross) || input.totalGross <= 0) {
    throw new Error(
      `Deal #${input.dealId} nie ma prawidłowej dodatniej wartości brutto.`
    );
  }

  const currency = normalizeCurrency(input.currency);
  const stage = findStage(input.stages, input.stageId);
  const triggerStage = input.stages.find(
    (item) => item.name === PAYMENT_SCHEDULE_TRIGGER_STAGE_NAME
  );

  if (!triggerStage) {
    throw new Error(
      `Nie znaleziono etapu „${PAYMENT_SCHEDULE_TRIGGER_STAGE_NAME}”.`
    );
  }

  const schedule = calculatePaymentSchedule305020(input.totalGross);
  const expected = {
    advancePercent: PAYMENT_SCHEDULE_305020.stage1Percent,
    advanceAmount: schedule.stage1Amount,
    stage2Amount: schedule.stage2Amount,
    stage3Amount: schedule.stage3Amount,
  };

  const current = {
    advancePercent: parseNumber(input.advancePercent),
    advanceAmount: parseBitrixMoneyAmount(input.advanceAmount),
    stage2Amount: parseBitrixMoneyAmount(input.stage2Amount),
    stage3Amount: parseBitrixMoneyAmount(input.stage3Amount),
  };

  const frozen = hasValue(input.contractDate);

  const base: Omit<PaymentScheduleSyncDecision, "action" | "fieldsToUpdate"> = {
    dealId: input.dealId,
    stage,
    triggerStage,
    frozen,
    totalGross: schedule.totalGross,
    currency,
    expected,
    current,
  };

  if (frozen) {
    return {
      ...base,
      action: "frozen_by_contract_date",
      fieldsToUpdate: {},
    };
  }

  if (stage.semantics === "S" || stage.semantics === "F") {
    return {
      ...base,
      action: "closed_stage",
      fieldsToUpdate: {},
    };
  }

  if (stage.sort < triggerStage.sort) {
    return {
      ...base,
      action: "before_trigger_stage",
      fieldsToUpdate: {},
    };
  }

  if (isScheduleEqual(current, expected)) {
    return {
      ...base,
      action: "up_to_date",
      fieldsToUpdate: {},
    };
  }

  return {
    ...base,
    action: "needs_update",
    fieldsToUpdate: {
      [PAYMENT_SCHEDULE_FIELDS.advancePercent]: expected.advancePercent,
      [PAYMENT_SCHEDULE_FIELDS.advanceAmount]: formatBitrixMoney(
        expected.advanceAmount,
        currency
      ),
      [PAYMENT_SCHEDULE_FIELDS.stage2Amount]: formatBitrixMoney(
        expected.stage2Amount,
        currency
      ),
      [PAYMENT_SCHEDULE_FIELDS.stage3Amount]: formatBitrixMoney(
        expected.stage3Amount,
        currency
      ),
    },
  };
}

function findStage(
  stages: DealStageSnapshot[],
  stageId: string
): DealStageSnapshot {
  const stage = stages.find((item) => item.statusId === stageId);
  if (!stage) {
    throw new Error(`Nie znaleziono etapu Bitrix24 o ID ${stageId}.`);
  }
  return stage;
}

function isScheduleEqual(
  current: PaymentScheduleSyncDecision["current"],
  expected: PaymentScheduleSyncDecision["expected"]
): boolean {
  return (
    numbersEqual(current.advancePercent, expected.advancePercent) &&
    numbersEqual(current.advanceAmount, expected.advanceAmount) &&
    numbersEqual(current.stage2Amount, expected.stage2Amount) &&
    numbersEqual(current.stage3Amount, expected.stage3Amount)
  );
}

function numbersEqual(actual: number | null, expected: number): boolean {
  if (actual === null) return false;
  return Math.abs(actual - expected) < 0.005;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBitrixMoneyAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value).split("|")[0];
  return parseNumber(raw);
}

function normalizeCurrency(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error(`Nieprawidłowy kod waluty: ${value}`);
  }
  return normalized;
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
}

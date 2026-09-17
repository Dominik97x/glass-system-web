export const PAYMENT_SCHEDULE_305020 = {
  stage1Percent: 30,
  stage2Percent: 50,
  stage3Percent: 20,
} as const;

export interface PaymentSchedule305020 {
  totalGross: number;
  stage1Amount: number;
  stage2Amount: number;
  stage3Amount: number;
  remainingAfterStage1: number;
}

export function calculatePaymentSchedule305020(
  totalGross: number
): PaymentSchedule305020 {
  if (!Number.isFinite(totalGross) || totalGross < 0) {
    throw new Error("Wartość brutto harmonogramu musi być nieujemną liczbą.");
  }

  const roundedTotal = roundCurrency(totalGross);
  const stage1Amount = roundCurrency(
    roundedTotal * (PAYMENT_SCHEDULE_305020.stage1Percent / 100)
  );
  const stage2Amount = roundCurrency(
    roundedTotal * (PAYMENT_SCHEDULE_305020.stage2Percent / 100)
  );
  // Ostatnia rata przejmuje ewentualną różnicę zaokrągleń, dzięki czemu
  // suma trzech rat zawsze jest dokładnie równa wartości brutto Deala.
  const stage3Amount = roundCurrency(
    roundedTotal - stage1Amount - stage2Amount
  );

  return {
    totalGross: roundedTotal,
    stage1Amount,
    stage2Amount,
    stage3Amount,
    remainingAfterStage1: roundCurrency(stage2Amount + stage3Amount),
  };
}

export function formatBitrixMoney(amount: number, currency: string): string {
  const normalizedCurrency = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
    throw new Error(`Nieprawidłowy kod waluty: ${currency}`);
  }
  return `${roundCurrency(amount).toFixed(2)}|${normalizedCurrency}`;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

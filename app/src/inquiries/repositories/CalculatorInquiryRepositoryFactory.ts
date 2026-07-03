import { Bitrix24CalculatorInquiryRepository } from "./Bitrix24CalculatorInquiryRepository";
import { CompositeCalculatorInquiryRepository } from "./CompositeCalculatorInquiryRepository";
import { FileCalculatorInquiryRepository } from "./FileCalculatorInquiryRepository";
import type { CalculatorInquiryRepository } from "./CalculatorInquiryRepository";

type CalculatorInquiryRepositoryMode = "local" | "bitrix24" | "hybrid";

export function createCalculatorInquiryRepository(): CalculatorInquiryRepository {
  const mode = getCalculatorInquiryRepositoryMode();

  if (mode === "local") {
    return new FileCalculatorInquiryRepository();
  }

  if (mode === "bitrix24") {
    return new Bitrix24CalculatorInquiryRepository();
  }

  return new CompositeCalculatorInquiryRepository(
    new FileCalculatorInquiryRepository(),
    [new Bitrix24CalculatorInquiryRepository()]
  );
}

function getCalculatorInquiryRepositoryMode(): CalculatorInquiryRepositoryMode {
  const value = process.env.CALCULATOR_INQUIRY_REPOSITORY ?? "local";

  if (
    value === "local" ||
    value === "bitrix24" ||
    value === "hybrid"
  ) {
    return value;
  }

  throw new Error(
    `Invalid CALCULATOR_INQUIRY_REPOSITORY value: ${value}`
  );
}
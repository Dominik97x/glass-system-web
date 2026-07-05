import type { CalculatorInquiryNotificationService } from "./CalculatorInquiryNotificationService";
import { CompositeCalculatorInquiryNotificationService } from "./CompositeCalculatorInquiryNotificationService";
import { ConsoleCalculatorInquiryNotificationService } from "./ConsoleCalculatorInquiryNotificationService";

type CalculatorInquiryNotificationMode = "disabled" | "console";

export function createCalculatorInquiryNotificationService(): CalculatorInquiryNotificationService {
  const mode = getCalculatorInquiryNotificationMode();

  if (mode === "disabled") {
    return new CompositeCalculatorInquiryNotificationService([]);
  }

  return new ConsoleCalculatorInquiryNotificationService();
}

function getCalculatorInquiryNotificationMode(): CalculatorInquiryNotificationMode {
  const value = process.env.CALCULATOR_INQUIRY_NOTIFICATIONS ?? "console";

  if (value === "disabled" || value === "console") {
    return value;
  }

  throw new Error(`Invalid CALCULATOR_INQUIRY_NOTIFICATIONS value: ${value}`);
}
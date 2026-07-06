import type { CalculatorInquiryNotificationService } from "./CalculatorInquiryNotificationService";
import { CompositeCalculatorInquiryNotificationService } from "./CompositeCalculatorInquiryNotificationService";
import { ConsoleCalculatorInquiryNotificationService } from "./ConsoleCalculatorInquiryNotificationService";
import { ResendCalculatorInquiryNotificationService } from "./ResendCalculatorInquiryNotificationService";

type CalculatorInquiryNotificationMode =
  | "disabled"
  | "console"
  | "resend"
  | "console_and_resend";

export function createCalculatorInquiryNotificationService(): CalculatorInquiryNotificationService {
  const mode = getCalculatorInquiryNotificationMode();

  if (mode === "disabled") {
    return new CompositeCalculatorInquiryNotificationService([]);
  }

  if (mode === "resend") {
    return new ResendCalculatorInquiryNotificationService();
  }

  if (mode === "console_and_resend") {
    return new CompositeCalculatorInquiryNotificationService([
      new ConsoleCalculatorInquiryNotificationService(),
      new ResendCalculatorInquiryNotificationService(),
    ]);
  }

  return new ConsoleCalculatorInquiryNotificationService();
}

function getCalculatorInquiryNotificationMode(): CalculatorInquiryNotificationMode {
  const value = process.env.CALCULATOR_INQUIRY_NOTIFICATIONS ?? "console";

  if (
    value === "disabled" ||
    value === "console" ||
    value === "resend" ||
    value === "console_and_resend"
  ) {
    return value;
  }

  throw new Error(`Invalid CALCULATOR_INQUIRY_NOTIFICATIONS value: ${value}`);
}
import type { CalculatorInquiryLead } from "@/domain/CalculatorInquiryLead";

interface ValidationSuccess {
  success: true;
  lead: CalculatorInquiryLead;
}

interface ValidationError {
  success: false;
  message: string;
}

export type CalculatorInquiryValidationResult =
  | ValidationSuccess
  | ValidationError;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.includes("@")
  );
}

export function validateCalculatorInquiryLead(
  value: unknown
): CalculatorInquiryValidationResult {
  if (!isRecord(value)) {
    return {
      success: false,
      message: "Nieprawidłowy format zapytania.",
    };
  }

  if (value.source !== "calculator") {
    return {
      success: false,
      message: "Nieprawidłowe źródło zapytania.",
    };
  }

  if (!isNonEmptyString(value.createdAt)) {
    return {
      success: false,
      message: "Brakuje daty utworzenia zapytania.",
    };
  }

  const createdAtDate = new Date(value.createdAt);

  if (Number.isNaN(createdAtDate.getTime())) {
    return {
      success: false,
      message: "Nieprawidłowa data utworzenia zapytania.",
    };
  }

  if (!isRecord(value.customer)) {
    return {
      success: false,
      message: "Brakuje danych klienta.",
    };
  }

  if (!isNonEmptyString(value.customer.name)) {
    return {
      success: false,
      message: "Podaj imię i nazwisko.",
    };
  }

  if (!isValidEmail(value.customer.email)) {
    return {
      success: false,
      message: "Podaj poprawny adres e-mail.",
    };
  }

  if (!isNonEmptyString(value.customer.phone)) {
    return {
      success: false,
      message: "Podaj numer telefonu.",
    };
  }

  if (typeof value.customer.message !== "string") {
    return {
      success: false,
      message: "Nieprawidłowa treść wiadomości.",
    };
  }

  if (!isRecord(value.quote)) {
    return {
      success: false,
      message: "Brakuje danych wyceny.",
    };
  }

  if (
    typeof value.quote.totalGross !== "number" ||
    value.quote.totalGross <= 0
  ) {
    return {
      success: false,
      message: "Nieprawidłowa suma wyceny.",
    };
  }

  if (value.quote.currency !== "PLN") {
    return {
      success: false,
      message: "Nieprawidłowa waluta wyceny.",
    };
  }

  if (!Array.isArray(value.quote.items) || value.quote.items.length === 0) {
    return {
      success: false,
      message: "Brakuje pozycji wyceny.",
    };
  }

  if (!Array.isArray(value.quote.configurationSummary)) {
    return {
      success: false,
      message: "Brakuje podsumowania konfiguracji.",
    };
  }

  return {
    success: true,
    lead: value as unknown as CalculatorInquiryLead,
  };
}
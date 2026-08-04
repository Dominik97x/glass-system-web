import type { CalculatorInquirySubmission } from "@/domain/CalculatorInquirySubmission";
import type {
  Length,
  ProductConfiguration,
  RoofOption,
  WallOption,
  Width,
} from "@/domain/ProductConfiguration";

interface ValidationSuccess {
  success: true;
  submission: CalculatorInquirySubmission;
}

interface ValidationError {
  success: false;
  message: string;
}

export type CalculatorInquiryValidationResult =
  | ValidationSuccess
  | ValidationError;

const ALLOWED_WIDTHS = [
  306, 406, 506, 606, 706, 806, 906, 1006, 1106, 1206,
] as const satisfies readonly Width[];

const ALLOWED_LENGTHS = [
  300, 350, 400, 450, 500, 550, 600,
] as const satisfies readonly Length[];

const WEBSITE_WALL_OPTIONS = [
  "none",
  "glass_clear",
  "glass_tinted",
] as const satisfies readonly WallOption[];

const WEBSITE_ROOF_OPTIONS = [
  "polycarbonate_clear",
  "polycarbonate_milky",
  "polycarbonate_grey",
  "polycarbonate_smoke",
  "glass_clear",
  "glass_tinted",
] as const satisfies readonly RoofOption[];

const BOOLEAN_CONFIGURATION_FIELDS = [
  "hasFrontZip",
  "hasLeftZip",
  "hasRightZip",
  "hasAwning",
  "hasLed",
  "hasCob",
  "hasHandles",
  "hasBrushes",
  "hasLevelingProfile",
] as const satisfies ReadonlyArray<keyof ProductConfiguration>;

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 40;
const MAX_MESSAGE_LENGTH = 2_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringWithinLimit(
  value: unknown,
  maximumLength: number,
  allowEmpty: boolean
): value is string {
  if (typeof value !== "string" || value.length > maximumLength) {
    return false;
  }

  return allowEmpty || value.trim().length > 0;
}

function isValidEmail(value: unknown): value is string {
  if (!isStringWithinLimit(value, MAX_EMAIL_LENGTH, false)) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function includesValue<T extends string | number>(
  values: readonly T[],
  value: unknown
): value is T {
  return values.some((candidate) => candidate === value);
}

function validateCustomer(
  value: Record<string, unknown>
): ValidationError | { customer: CalculatorInquirySubmission["customer"] } {
  if (!isRecord(value.customer)) {
    return {
      success: false,
      message: "Brakuje danych klienta.",
    };
  }

  const customer = value.customer;

  if (!isStringWithinLimit(customer.name, MAX_NAME_LENGTH, false)) {
    return {
      success: false,
      message: `Podaj imię i nazwisko (maksymalnie ${MAX_NAME_LENGTH} znaków).`,
    };
  }

  if (!isValidEmail(customer.email)) {
    return {
      success: false,
      message: "Podaj poprawny adres e-mail.",
    };
  }

  if (!isStringWithinLimit(customer.phone, MAX_PHONE_LENGTH, false)) {
    return {
      success: false,
      message: `Podaj numer telefonu (maksymalnie ${MAX_PHONE_LENGTH} znaków).`,
    };
  }

  if (!isStringWithinLimit(customer.message, MAX_MESSAGE_LENGTH, true)) {
    return {
      success: false,
      message: `Wiadomość może zawierać maksymalnie ${MAX_MESSAGE_LENGTH} znaków.`,
    };
  }

  return {
    customer: {
      name: customer.name.trim(),
      email: customer.email.trim(),
      phone: customer.phone.trim(),
      message: customer.message.trim(),
    },
  };
}

function validateConfiguration(
  value: Record<string, unknown>
): ValidationError | { configuration: ProductConfiguration } {
  if (!isRecord(value.configuration)) {
    return {
      success: false,
      message: "Brakuje konfiguracji produktu.",
    };
  }

  const configuration = value.configuration;

  if (!includesValue(ALLOWED_WIDTHS, configuration.width)) {
    return {
      success: false,
      message: "Wybrana szerokość nie jest obsługiwana przez kalkulator.",
    };
  }

  if (!includesValue(ALLOWED_LENGTHS, configuration.length)) {
    return {
      success: false,
      message: "Wybrana długość nie jest obsługiwana przez kalkulator.",
    };
  }

  if (!includesValue(WEBSITE_WALL_OPTIONS, configuration.walls)) {
    return {
      success: false,
      message: "Wybrany wariant ścian nie jest dostępny na stronie.",
    };
  }

  if (!includesValue(WEBSITE_ROOF_OPTIONS, configuration.roof)) {
    return {
      success: false,
      message: "Wybrany wariant dachu nie jest dostępny na stronie.",
    };
  }

  for (const field of BOOLEAN_CONFIGURATION_FIELDS) {
    if (typeof configuration[field] !== "boolean") {
      return {
        success: false,
        message: `Nieprawidłowa wartość konfiguracji: ${field}.`,
      };
    }
  }

  const validatedConfiguration: ProductConfiguration = {
    width: configuration.width,
    length: configuration.length,
    walls: configuration.walls,
    roof: configuration.roof,
    hasFrontZip: configuration.hasFrontZip as boolean,
    hasLeftZip: configuration.hasLeftZip as boolean,
    hasRightZip: configuration.hasRightZip as boolean,
    hasAwning: configuration.hasAwning as boolean,
    hasLed: configuration.hasLed as boolean,
    hasCob: configuration.hasCob as boolean,
    hasHandles: configuration.hasHandles as boolean,
    hasBrushes: configuration.hasBrushes as boolean,
    hasLevelingProfile: configuration.hasLevelingProfile as boolean,
  };

  if (
    validatedConfiguration.walls === "none" &&
    (validatedConfiguration.hasLeftZip ||
      validatedConfiguration.hasRightZip)
  ) {
    return {
      success: false,
      message: "Boczne rolety ZIP wymagają wybrania ścian.",
    };
  }

  if (validatedConfiguration.hasLed && validatedConfiguration.hasCob) {
    return {
      success: false,
      message: "LED punktowe i LED CCT nie mogą być wybrane jednocześnie.",
    };
  }

  if (
    validatedConfiguration.length >= 550 &&
    validatedConfiguration.roof.startsWith("glass_")
  ) {
    return {
      success: false,
      message:
        "Dach szklany dla długości 550 i 600 cm wymaga wyceny indywidualnej.",
    };
  }

  return {
    configuration: validatedConfiguration,
  };
}

/**
 * Validates only data that the browser is allowed to decide.
 *
 * Any legacy `quote`, `items`, `totalGross`, `currency` or timestamps included
 * in the request are deliberately ignored. The server creates them itself.
 */
export function validateCalculatorInquirySubmission(
  value: unknown
): CalculatorInquiryValidationResult {
  if (!isRecord(value)) {
    return {
      success: false,
      message: "Nieprawidłowy format zapytania.",
    };
  }

  const customerValidation = validateCustomer(value);
  if ("success" in customerValidation) {
    return customerValidation;
  }

  const configurationValidation = validateConfiguration(value);
  if ("success" in configurationValidation) {
    return configurationValidation;
  }

  return {
    success: true,
    submission: {
      customer: customerValidation.customer,
      configuration: configurationValidation.configuration,
    },
  };
}

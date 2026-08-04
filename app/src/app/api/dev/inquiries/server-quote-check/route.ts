import { NextResponse } from "next/server";

import {
  DEFAULT_CONFIGURATION,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";
import { CalculatorInquiryQuoteService } from "@/inquiries/server/CalculatorInquiryQuoteService";
import { validateCalculatorInquirySubmission } from "@/inquiries/validators/calculator-inquiry-validator";

export const runtime = "nodejs";

const serverQuoteService = new CalculatorInquiryQuoteService();

const customer = {
  name: "Jan Kowalski",
  email: "jan.kowalski@example.com",
  phone: "500600700",
  message: "Test serwerowego przeliczania wyceny.",
};

interface CheckResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

function createValidPayload(configuration: ProductConfiguration) {
  return {
    customer,
    configuration,
  };
}

function checkTrustedTotal(): CheckResult {
  const payload = createValidPayload({
    ...DEFAULT_CONFIGURATION,
    width: 506,
    length: 450,
    walls: "glass_clear",
    hasRightZip: true,
    hasAwning: true,
    hasLed: true,
  });

  const validation = validateCalculatorInquirySubmission(payload);
  if (!validation.success) {
    return {
      id: "B1",
      name: "Poprawna konfiguracja jest liczona na serwerze",
      passed: false,
      details: validation.message,
    };
  }

  const lead = serverQuoteService.createTrustedLead(validation.submission);
  const expectedTotalGross = 53_361;

  return {
    id: "B1",
    name: "Poprawna konfiguracja jest liczona na serwerze",
    passed: lead.quote.totalGross === expectedTotalGross,
    details: `Oczekiwano ${expectedTotalGross} zł, serwer wyliczył ${lead.quote.totalGross} zł.`,
  };
}

function checkTamperedQuoteIsIgnored(): CheckResult {
  const payload = {
    ...createValidPayload({
      ...DEFAULT_CONFIGURATION,
      width: 606,
      length: 300,
      walls: "glass_clear",
    }),
    source: "attacker",
    createdAt: "2000-01-01T00:00:00.000Z",
    quote: {
      totalGross: 1,
      currency: "PLN",
      items: [],
      configurationSummary: [],
    },
    totalGross: 1,
  };

  const validation = validateCalculatorInquirySubmission(payload);
  if (!validation.success) {
    return {
      id: "B2",
      name: "Cena przesłana przez klienta jest ignorowana",
      passed: false,
      details: validation.message,
    };
  }

  const lead = serverQuoteService.createTrustedLead(validation.submission);
  const expectedTotalGross = 31_298;

  return {
    id: "B2",
    name: "Cena przesłana przez klienta jest ignorowana",
    passed: lead.quote.totalGross === expectedTotalGross,
    details: `Klient przesłał 1 zł, serwer zapisał ${lead.quote.totalGross} zł.`,
  };
}

function checkAcceptedPayload(
  id: string,
  name: string,
  configuration: ProductConfiguration,
  expectedTotalGross: number
): CheckResult {
  const validation = validateCalculatorInquirySubmission(
    createValidPayload(configuration)
  );

  if (!validation.success) {
    return { id, name, passed: false, details: validation.message };
  }

  const lead = serverQuoteService.createTrustedLead(validation.submission);

  return {
    id,
    name,
    passed: lead.quote.totalGross === expectedTotalGross,
    details: `Oczekiwano ${expectedTotalGross} zł, serwer wyliczył ${lead.quote.totalGross} zł.`,
  };
}

function checkRejectedPayload(
  id: string,
  name: string,
  configuration: Record<string, unknown>,
  expectedMessagePart: string
): CheckResult {
  const validation = validateCalculatorInquirySubmission({
    customer,
    configuration,
  });

  const passed =
    !validation.success && validation.message.includes(expectedMessagePart);

  return {
    id,
    name,
    passed,
    details: validation.success
      ? "Nieprawidłowa konfiguracja została zaakceptowana."
      : validation.message,
  };
}

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        message: "Server quote check endpoint is disabled in production.",
      },
      { status: 404 }
    );
  }

  const checks: CheckResult[] = [
    checkTrustedTotal(),
    checkTamperedQuoteIsIgnored(),
    checkAcceptedPayload(
      "B3",
      "Przedni ZIP bez ścian jest akceptowany i wyceniany",
      {
        ...DEFAULT_CONFIGURATION,
        walls: "none",
        hasFrontZip: true,
      },
      10_738
    ),
    checkRejectedPayload(
      "B4",
      "Boczny ZIP bez ścian jest odrzucany",
      {
        ...DEFAULT_CONFIGURATION,
        walls: "none",
        hasLeftZip: true,
      },
      "Boczne rolety ZIP wymagają"
    ),
    checkRejectedPayload(
      "B5",
      "Dach szklany 550/600 cm jest odrzucany",
      {
        ...DEFAULT_CONFIGURATION,
        length: 600,
        roof: "glass_clear",
      },
      "wymaga wyceny indywidualnej"
    ),
    checkRejectedPayload(
      "B6",
      "LED punktowe i CCT jednocześnie są odrzucane",
      {
        ...DEFAULT_CONFIGURATION,
        hasLed: true,
        hasCob: true,
      },
      "nie mogą być wybrane jednocześnie"
    ),
    checkRejectedPayload(
      "B7",
      "Nieobsługiwany wymiar jest odrzucany",
      {
        ...DEFAULT_CONFIGURATION,
        width: 999,
      },
      "szerokość nie jest obsługiwana"
    ),
    checkRejectedPayload(
      "B8",
      "Niepublikowane szkło mleczne jest odrzucane",
      {
        ...DEFAULT_CONFIGURATION,
        roof: "glass_milky",
      },
      "wariant dachu nie jest dostępny"
    ),
    checkRejectedPayload(
      "B9",
      "Nieprawidłowy typ pola logicznego jest odrzucany",
      {
        ...DEFAULT_CONFIGURATION,
        hasAwning: "true",
      },
      "hasAwning"
    ),
  ];

  return NextResponse.json({
    success: checks.every((check) => check.passed),
    passed: checks.filter((check) => check.passed).length,
    failed: checks.filter((check) => !check.passed).length,
    checks,
  });
}

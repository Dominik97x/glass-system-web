import type { CalculatorInquiryAttribution } from "@/domain/CalculatorInquiryAttribution";
import { hasMarketingConsent } from "@/privacy/consent";

export const ATTRIBUTION_SESSION_KEY = "moonglass-attribution-v1";

export function captureMarketingAttributionFromCurrentPage(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!hasMarketingConsent()) {
    clearMarketingAttribution();
    return;
  }

  if (readStoredMarketingAttribution()) {
    return;
  }

  const attribution = readCurrentPageAttribution();

  if (!hasCampaignSignal(attribution)) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      ATTRIBUTION_SESSION_KEY,
      JSON.stringify(attribution)
    );
  } catch {
    // Brak dostepu do sessionStorage nie moze blokowac strony.
  }
}

export function clearMarketingAttribution(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(ATTRIBUTION_SESSION_KEY);
  } catch {
    // Brak dostepu do sessionStorage nie moze blokowac strony.
  }
}

export function readMarketingAttributionForInquiry():
  | CalculatorInquiryAttribution
  | undefined {
  if (typeof window === "undefined" || !hasMarketingConsent()) {
    return undefined;
  }

  const stored = readStoredMarketingAttribution();

  if (stored) {
    return stored;
  }

  const current = readCurrentPageAttribution();

  return hasCampaignSignal(current) ? current : undefined;
}

function readStoredMarketingAttribution():
  | CalculatorInquiryAttribution
  | undefined {
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_SESSION_KEY);

    if (!raw) {
      return undefined;
    }

    const value = JSON.parse(raw) as Record<string, unknown>;

    return {
      landingPage: readString(value.landingPage, 2048),
      referrer: readString(value.referrer, 2048),
      utmSource: readString(value.utmSource, 255),
      utmMedium: readString(value.utmMedium, 255),
      utmCampaign: readString(value.utmCampaign, 255),
      utmContent: readString(value.utmContent, 255),
      utmTerm: readString(value.utmTerm, 255),
      fbclid: readString(value.fbclid, 500),
    };
  } catch {
    return undefined;
  }
}

function readCurrentPageAttribution(): CalculatorInquiryAttribution {
  const url = new URL(window.location.href);

  return {
    landingPage: truncate(window.location.href, 2048),
    referrer: truncate(document.referrer, 2048),
    utmSource: truncate(url.searchParams.get("utm_source") ?? "", 255),
    utmMedium: truncate(url.searchParams.get("utm_medium") ?? "", 255),
    utmCampaign: truncate(url.searchParams.get("utm_campaign") ?? "", 255),
    utmContent: truncate(url.searchParams.get("utm_content") ?? "", 255),
    utmTerm: truncate(url.searchParams.get("utm_term") ?? "", 255),
    fbclid: truncate(url.searchParams.get("fbclid") ?? "", 500),
  };
}

function hasCampaignSignal(
  attribution: CalculatorInquiryAttribution
): boolean {
  return Boolean(
    attribution.utmSource ||
      attribution.utmMedium ||
      attribution.utmCampaign ||
      attribution.utmContent ||
      attribution.utmTerm ||
      attribution.fbclid
  );
}

function readString(value: unknown, maximumLength: number): string {
  return typeof value === "string" ? truncate(value, maximumLength) : "";
}

function truncate(value: string, maximumLength: number): string {
  return value.slice(0, maximumLength);
}

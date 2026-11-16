import { hasMarketingConsent } from "@/privacy/consent";

export type MetaLeadSource =
  | "calculator_inquiry"
  | "contact_form";

export function trackMetaLead(source: MetaLeadSource): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!hasMarketingConsent()) {
    return;
  }

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  if (!pixelId || !window.fbq) {
    return;
  }

  window.fbq("track", "Lead", {
    lead_source: source,
  });
}

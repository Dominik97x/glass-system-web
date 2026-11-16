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

  if (!window.fbq) {
    return;
  }

  window.fbq("track", "Lead", {
    lead_source: source,
  });
}

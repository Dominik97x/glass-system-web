"use client";

import { useEffect } from "react";
import { captureMarketingAttributionFromCurrentPage } from "@/marketing/attribution";
import { CONSENT_CHANGED_EVENT } from "@/privacy/consent";

export function MarketingAttributionTracker() {
  useEffect(() => {
    captureMarketingAttributionFromCurrentPage();

    const handleConsentChange = () => {
      captureMarketingAttributionFromCurrentPage();
    };

    window.addEventListener(CONSENT_CHANGED_EVENT, handleConsentChange);

    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, handleConsentChange);
    };
  }, []);

  return null;
}

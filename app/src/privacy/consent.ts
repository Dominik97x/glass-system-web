export const CONSENT_STORAGE_KEY = "moonglass-consent-v1-pre-meta";

export const CONSENT_OPEN_EVENT = "moonglass:consent-open";
export const CONSENT_CHANGED_EVENT = "moonglass:consent-changed";

export type ConsentChoice = "necessary" | "marketing";

export function readConsentChoice(): ConsentChoice | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);

    return value === "necessary" || value === "marketing" ? value : null;
  } catch {
    return null;
  }
}

export function hasMarketingConsent(): boolean {
  return readConsentChoice() === "marketing";
}

export function saveConsentChoice(choice: ConsentChoice): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Brak dostepu do storage nie moze blokowac korzystania ze strony.
  }

  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
}

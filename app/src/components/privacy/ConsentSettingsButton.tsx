"use client";

import { CONSENT_OPEN_EVENT } from "@/privacy/consent";

export function ConsentSettingsButton() {
  function openSettings() {
    window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
  }

  return (
    <button
      type="button"
      onClick={openSettings}
      className="transition hover:text-[#dfbd78]"
    >
      Ustawienia prywatności
    </button>
  );
}

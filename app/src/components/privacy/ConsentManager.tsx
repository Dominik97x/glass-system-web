"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CONSENT_OPEN_EVENT,
  readConsentChoice,
  saveConsentChoice,
  type ConsentChoice,
} from "@/privacy/consent";

export function ConsentManager() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const initialCheck = window.setTimeout(() => {
      setVisible(readConsentChoice() === null);
    }, 0);

    const handleOpen = () => {
      setVisible(true);
    };

    window.addEventListener(CONSENT_OPEN_EVENT, handleOpen);

    return () => {
      window.clearTimeout(initialCheck);
      window.removeEventListener(CONSENT_OPEN_EVENT, handleOpen);
    };
  }, []);

  function choose(choice: ConsentChoice) {
    saveConsentChoice(choice);
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-labelledby="privacy-consent-title"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-[#dfbd78]/30 bg-[#031d18] text-[#f6f1e7] shadow-[0_-20px_60px_rgba(0,0,0,0.35)]"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <div className="max-w-3xl">
          <p
            id="privacy-consent-title"
            className="font-serif text-xl font-semibold"
          >
            Prywatność i ustawienia strony
          </p>

          <p className="mt-2 text-sm leading-6 text-[#f6f1e7]/70">
            MoonGlass korzysta z mechanizmów niezbędnych do
            prawidłowego działania serwisu. Za Twoją zgodą
            możemy również uruchamiać narzędzia marketingowe,
            w tym Meta Pixel, aby mierzyć skuteczność reklam
            i lepiej dopasowywać kampanie. Bez zgody marketingowej
            narzędzia te pozostają wyłączone.
          </p>

          <Link
            href="/polityka-prywatnosci"
            className="mt-2 inline-block text-xs text-[#dfbd78] underline underline-offset-4"
          >
            Polityka prywatności
          </Link>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => choose("necessary")}
            className="border border-[#f6f1e7]/25 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.13em] transition hover:border-[#dfbd78] hover:text-[#dfbd78]"
          >
            Tylko niezbędne
          </button>

          <button
            type="button"
            onClick={() => choose("marketing")}
            className="bg-[#c79a46] px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#031d18] transition hover:bg-[#dfbd78]"
          >
            Zgadzam się na marketingowe
          </button>
        </div>
      </div>
    </div>
  );
}

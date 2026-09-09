"use client";

import { useEffect, useState } from "react";

import type { Quote } from "@/domain/Quote";
import { InquiryForm } from "./InquiryForm";

interface Props {
  quote: Quote;
  variant?: "default" | "compact";
}

export function QuoteActions({ quote, variant = "default" }: Props) {
  const [isInquiryFormOpen, setIsInquiryFormOpen] = useState(false);
  const isCompact = variant === "compact";

  useEffect(() => {
    if (!isInquiryFormOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsInquiryFormOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isInquiryFormOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsInquiryFormOpen(true)}
        className={[
          "group flex w-full items-center justify-between gap-3 bg-[#c79a46] text-left text-[#031d18] shadow-lg shadow-[#9a722e]/10 transition hover:bg-[#dfbd78]",
          isCompact ? "min-h-12 px-4 py-3" : "px-5 py-4",
        ].join(" ")}
      >
        <span>
          <span
            className={[
              "block font-black uppercase tracking-[0.14em]",
              isCompact ? "text-[10px]" : "text-[11px]",
            ].join(" ")}
          >
            {isCompact ? "Wyślij" : "Wyślij zapytanie"}
          </span>

          {!isCompact ? (
            <span className="mt-1 block text-xs font-semibold normal-case leading-5 text-[#031d18]/70">
              Otrzymasz podsumowanie i PDF na e-mail.
            </span>
          ) : null}
        </span>

        <span
          className={[
            "flex shrink-0 items-center justify-center rounded-full bg-[#031d18] text-[#f6f1e7] transition group-hover:translate-x-1",
            isCompact ? "h-8 w-8 text-base" : "h-10 w-10 text-lg",
          ].join(" ")}
        >
          →
        </span>
      </button>

      {!isCompact ? (
        <p className="mt-3 text-[11px] leading-5 text-[#d9d1c4]">
          Bez zobowiązań. Finalna oferta zostanie potwierdzona po weryfikacji
          technicznej.
        </p>
      ) : null}

      {isInquiryFormOpen ? (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-[#031d18]/72 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Formularz zapytania MoonGlass"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setIsInquiryFormOpen(false);
            }
          }}
        >
          <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center">
            <div className="w-full border border-[#d5ccbc] bg-[#f6f1e7] shadow-2xl shadow-black/30">
              <div className="flex items-start justify-between gap-5 border-b border-[#d5ccbc] bg-[#fffdf8] px-5 py-5 sm:px-7">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#9a722e]">
                    MoonGlass
                  </p>
                  <h3 className="mt-2 font-serif text-2xl font-medium text-[#062c25]">
                    Wyślij konfigurację
                  </h3>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-[#4f5854]">
                    Uzupełnij dane kontaktowe. Zapiszemy konfigurację i wyślemy
                    jej podsumowanie na podany adres e-mail.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsInquiryFormOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#d5ccbc] bg-[#f8f4ec] text-xl text-[#24312d] transition hover:border-[#9a722e] hover:text-[#9a722e]"
                  aria-label="Zamknij formularz"
                >
                  ×
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <InquiryForm
                  quote={quote}
                  onCancel={() => setIsInquiryFormOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

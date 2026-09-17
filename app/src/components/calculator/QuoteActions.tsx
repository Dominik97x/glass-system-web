"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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

      {isInquiryFormOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[1000] overflow-y-auto bg-[#f6f1e7] sm:bg-[#031d18]/72 sm:px-6 sm:py-8 sm:backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label="Formularz zapytania MoonGlass"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) {
                  setIsInquiryFormOpen(false);
                }
              }}
            >
              <div className="mx-auto min-h-[100dvh] w-full sm:flex sm:min-h-full sm:max-w-2xl sm:items-center sm:justify-center">
                <div className="min-h-[100dvh] w-full bg-[#f6f1e7] sm:min-h-0 sm:border sm:border-[#d5ccbc] sm:shadow-2xl sm:shadow-black/30">
                  <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#d5ccbc] bg-[#fffdf8]/98 px-4 py-4 backdrop-blur sm:static sm:gap-5 sm:px-7 sm:py-5">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#9a722e] sm:text-[9px] sm:tracking-[0.22em]">
                        MoonGlass
                      </p>
                      <h3 className="mt-1 font-serif text-xl font-medium text-[#062c25] sm:mt-2 sm:text-2xl">
                        Wyślij konfigurację
                      </h3>
                      <p className="mt-1 max-w-lg text-xs leading-5 text-[#4f5854] sm:mt-2 sm:text-sm sm:leading-6">
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

                  <div className="p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6">
                    <InquiryForm
                      quote={quote}
                      onCancel={() => setIsInquiryFormOpen(false)}
                    />
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

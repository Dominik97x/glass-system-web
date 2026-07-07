"use client";

import { useState } from "react";

import type { Quote } from "@/domain/Quote";
import { InquiryForm } from "./InquiryForm";

interface Props {
  quote: Quote;
}

export function QuoteActions({ quote }: Props) {
  const [isInquiryFormOpen, setIsInquiryFormOpen] = useState(false);

  if (isInquiryFormOpen) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
        <div className="mb-4 border-b border-neutral-200 pb-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            Dane kontaktowe
          </p>
          <h4 className="mt-2 text-lg font-semibold text-neutral-950">
            Wyślij zapytanie
          </h4>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Uzupełnij dane, a konfiguracja razem z wyceną orientacyjną zostanie
            zapisana jako zapytanie.
          </p>
        </div>

        <InquiryForm
          quote={quote}
          onCancel={() => setIsInquiryFormOpen(false)}
        />
      </div>
    );
  }

  return (
    <section>
      <button
        type="button"
        onClick={() => setIsInquiryFormOpen(true)}
        className="group flex w-full items-center justify-between gap-4 rounded-2xl bg-emerald-500 px-5 py-4 text-left font-black text-neutral-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/25"
      >
        <span>
          <span className="block text-sm uppercase tracking-[0.08em]">
            Wyślij zapytanie
          </span>
          <span className="mt-1 block text-xs font-semibold normal-case text-emerald-950/70">
            Doradca otrzyma konfigurację i cenę orientacyjną.
          </span>
        </span>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-lg text-white transition group-hover:translate-x-1">
          →
        </span>
      </button>

      <div className="mt-4 rounded-2xl border border-emerald-200 bg-white/70 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
          Co trafi do zapytania?
        </p>

        <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-950/80">
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span>wybrane wymiary, dach, ściany i dodatki,</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span>pełna lista pozycji oferty,</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span>orientacyjna suma brutto: {quote.totalGross.toLocaleString("pl-PL")} zł.</span>
          </li>
        </ul>
      </div>

      <p className="mt-3 text-xs leading-5 text-emerald-900/70">
        Cena ma charakter orientacyjny. Ostateczna oferta zostanie potwierdzona
        po kontakcie z doradcą.
      </p>
    </section>
  );
}
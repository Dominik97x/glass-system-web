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
      <InquiryForm
        quote={quote}
        onCancel={() => setIsInquiryFormOpen(false)}
      />
    );
  }

  return (
    <section>
      <button
        type="button"
        onClick={() => setIsInquiryFormOpen(true)}
        className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-neutral-950 transition hover:bg-neutral-200"
      >
        Wyślij zapytanie
      </button>

      <p className="mt-3 text-xs text-neutral-400">
        Cena ma charakter orientacyjny. Ostateczna oferta zostanie potwierdzona
        po kontakcie z doradcą.
      </p>
    </section>
  );
}
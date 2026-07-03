"use client";

import { useState } from "react";

import type { CalculatorInquiryLead } from "@/domain/CalculatorInquiryLead";
import type { Quote } from "@/domain/Quote";
import { CalculatorInquiryService } from "@/inquiries/services/CalculatorInquiryService";
import { createQuoteSnapshot } from "@/lib/quote-snapshot";

interface Props {
  quote: Quote;
  onCancel(): void;
}

interface InquiryFormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const inquiryService = new CalculatorInquiryService();

export function InquiryForm({ quote, onCancel }: Props) {
  const [form, setForm] = useState<InquiryFormState>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function updateField(field: keyof InquiryFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setSubmitMessage(null);
    setIsSubmitted(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const inquiryLead: CalculatorInquiryLead = {
      source: "calculator",
      createdAt: new Date().toISOString(),
      customer: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
      },
      quote: createQuoteSnapshot(quote),
    };

    const result = inquiryService.submit(inquiryLead);

    setSubmitMessage(result.message);
    setIsSubmitted(result.success);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-lg font-semibold">Dane kontaktowe</h2>

      <div className="mt-4 space-y-4">
        <label className="block text-sm">
          Imię i nazwisko
          <input
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none"
          />
        </label>

        <label className="block text-sm">
          E-mail
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none"
          />
        </label>

        <label className="block text-sm">
          Telefon
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none"
          />
        </label>

        <label className="block text-sm">
          Wiadomość
          <textarea
            value={form.message}
            onChange={(event) => updateField("message", event.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none"
            placeholder="Opcjonalna wiadomość do doradcy"
          />
        </label>
      </div>

      {submitMessage && (
        <div className="mt-4 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-3 text-sm text-emerald-200">
          {submitMessage}
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitted}
          className="flex-1 rounded-xl bg-white px-4 py-3 font-semibold text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-300"
        >
          {isSubmitted ? "Wysłano" : "Wyślij"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-neutral-700 px-4 py-3 font-semibold text-white transition hover:bg-neutral-800"
        >
          Anuluj
        </button>
      </div>

      <p className="mt-3 text-xs text-neutral-400">
        Na tym etapie formularz nie wysyła jeszcze danych do CRM ani na e-mail.
        Dane są przygotowywane jako obiekt leada w konsoli przeglądarki.
      </p>
    </form>
  );
}
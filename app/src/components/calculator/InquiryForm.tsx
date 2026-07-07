"use client";

import { useState, type FormEvent } from "react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof InquiryFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setSubmitMessage(null);
    setIsSubmitted(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setSubmitMessage(null);

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

    try {
      const result = await inquiryService.submit(inquiryLead);

      setSubmitMessage(result.message);
      setIsSubmitted(result.success);
    } catch {
      setSubmitMessage(
        "Nie udało się przygotować zapytania. Spróbuj ponownie później."
      );
      setIsSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Formularz
            </p>
            <h5 className="mt-2 text-base font-semibold text-neutral-950">
              Dane do kontaktu
            </h5>
          </div>

          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
            {quote.totalGross.toLocaleString("pl-PL")} zł
          </div>
        </div>

        <div className="space-y-4">
          <FormField label="Imię i nazwisko" required>
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
              autoComplete="name"
              placeholder="Jan Kowalski"
              className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </FormField>

          <FormField label="E-mail" required>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
              autoComplete="email"
              placeholder="jan@example.com"
              className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </FormField>

          <FormField label="Telefon" required>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              required
              autoComplete="tel"
              placeholder="500 600 700"
              className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </FormField>

          <FormField label="Wiadomość">
            <textarea
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Opcjonalna wiadomość do doradcy"
            />
          </FormField>
        </div>
      </div>

      {submitMessage ? (
        <div
          className={[
            "rounded-2xl border px-4 py-3 text-sm leading-6",
            isSubmitted
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900",
          ].join(" ")}
        >
          {submitMessage}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <button
          type="submit"
          disabled={isSubmitting || isSubmitted}
          className="rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black uppercase tracking-[0.08em] text-neutral-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none"
        >
          {isSubmitting
            ? "Wysyłanie..."
            : isSubmitted
              ? "Wysłano"
              : "Wyślij zapytanie"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.08em] text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anuluj
        </button>
      </div>

      <div className="rounded-2xl bg-white/70 p-4 text-xs leading-5 text-emerald-900/70 ring-1 ring-emerald-100">
        Zapytanie zostanie zapisane w aktywnym repozytorium leadów. W zależności
        od konfiguracji może to być lokalny plik, baza danych Postgres/Neon albo
        integracja CRM.
      </div>
    </form>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({ label, required = false, children }: FormFieldProps) {
  return (
    <label className="block text-sm">
      <span className="flex items-center gap-2 font-bold text-neutral-950">
        {label}
        {required ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
            wymagane
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
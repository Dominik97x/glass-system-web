"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import type { CalculatorInquirySubmission } from "@/domain/CalculatorInquirySubmission";
import type { Quote } from "@/domain/Quote";
import { CalculatorInquiryService } from "@/inquiries/services/CalculatorInquiryService";

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
  const [customerEmailSent, setCustomerEmailSent] = useState(false);

  function updateField(field: keyof InquiryFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setSubmitMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || isSubmitted) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    const submission: CalculatorInquirySubmission = {
      customer: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
      },
      configuration: quote.configuration,
    };

    try {
      const result = await inquiryService.submit(submission);

      if (result.success) {
        setCustomerEmailSent(result.customerEmailSent === true);
        setIsSubmitted(true);
        return;
      }

      setSubmitMessage(result.message);
    } catch {
      setSubmitMessage(
        "Nie udało się przygotować zapytania. Spróbuj ponownie później."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <InquirySuccess
        name={form.name}
        email={form.email}
        totalGross={quote.totalGross}
        customerEmailSent={customerEmailSent}
        onBack={onCancel}
      />
    );
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
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900"
        >
          <div className="font-bold">Nie udało się wysłać zapytania.</div>
          <div className="mt-1">{submitMessage}</div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black uppercase tracking-[0.08em] text-neutral-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none"
        >
          {isSubmitting ? (
            <>
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-500 border-t-transparent"
              />
              Wysyłanie...
            </>
          ) : (
            "Wyślij zapytanie"
          )}
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
        Po wysłaniu zapytania zapiszemy Twoją konfigurację. Na podany adres
        e-mail wyślemy podsumowanie wraz z dokumentem PDF, jeśli automatyczna
        wysyłka przebiegnie poprawnie.
      </div>
    </form>
  );
}

interface InquirySuccessProps {
  name: string;
  email: string;
  totalGross: number;
  customerEmailSent: boolean;
  onBack(): void;
}

function InquirySuccess({
  name,
  email,
  totalGross,
  customerEmailSent,
  onBack,
}: InquirySuccessProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl shadow-emerald-950/5">
      <div className="bg-[#173d34] px-6 py-7 text-white sm:px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d6bf86] text-2xl font-black text-[#173d34]">
          ✓
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#d6bf86]">
          MoonGlass
        </p>

        <h5 className="mt-2 text-2xl font-semibold">
          Zapytanie zostało wysłane
        </h5>

        <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80">
          Dziękujemy{name.trim() ? `, ${name.trim()}` : ""}. Otrzymaliśmy Twoją
          konfigurację o wartości szacunkowej{" "}
          <strong className="text-white">
            {totalGross.toLocaleString("pl-PL")} zł
          </strong>
          .
        </p>
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        {customerEmailSent ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
              Podsumowanie wysłane
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-950">
              Na adres <strong className="break-all">{email}</strong> wysłaliśmy
              podsumowanie konfiguracji oraz dokument PDF z wyceną.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">
              Zgłoszenie jest zapisane
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-950">
              Nie udało się potwierdzić automatycznej wysyłki podsumowania na
              adres <strong className="break-all">{email}</strong>. Twoje
              zapytanie zostało jednak przyjęte i nasz zespół nadal je otrzymał.
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-[#f4f0e7] p-5 text-sm leading-6 text-[#43524c]">
          <p className="font-bold text-[#173d34]">Co dalej?</p>
          <p className="mt-1">
            Sprawdzimy konfigurację pod kątem technicznym i skontaktujemy się z
            Tobą, aby potwierdzić szczegóły realizacji.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black uppercase tracking-[0.08em] text-neutral-950 transition hover:-translate-y-0.5 hover:bg-emerald-400"
        >
          Wróć do kalkulatora
        </button>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
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

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="border border-[#d5ccbc] bg-[#fffdf8] p-4 sm:p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#9a722e]">
              Dane kontaktowe
            </p>
            <h4 className="mt-2 font-serif text-xl font-medium text-[#062c25]">
              Uzupełnij formularz
            </h4>
          </div>

          <div className="border border-[#d7c9ab] bg-[#f4ead5] px-3 py-2 text-xs font-black text-[#062c25]">
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
              className="mt-2 h-12 w-full border border-[#d5ccbc] bg-white px-4 text-sm font-semibold text-[#24312d] outline-none transition placeholder:text-[#9aa09d] focus:border-[#c79a46] focus:ring-2 focus:ring-[#dfbd78]/25"
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
              className="mt-2 h-12 w-full border border-[#d5ccbc] bg-white px-4 text-sm font-semibold text-[#24312d] outline-none transition placeholder:text-[#9aa09d] focus:border-[#c79a46] focus:ring-2 focus:ring-[#dfbd78]/25"
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
              className="mt-2 h-12 w-full border border-[#d5ccbc] bg-white px-4 text-sm font-semibold text-[#24312d] outline-none transition placeholder:text-[#9aa09d] focus:border-[#c79a46] focus:ring-2 focus:ring-[#dfbd78]/25"
            />
          </FormField>

          <FormField label="Wiadomość">
            <textarea
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              rows={4}
              className="mt-2 w-full resize-none border border-[#d5ccbc] bg-white px-4 py-3 text-sm font-semibold text-[#24312d] outline-none transition placeholder:text-[#9aa09d] focus:border-[#c79a46] focus:ring-2 focus:ring-[#dfbd78]/25"
              placeholder="Opcjonalna wiadomość do doradcy"
            />
          </FormField>
        </div>
      </div>

      {submitMessage ? (
        <div
          role="alert"
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900"
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
          className="flex items-center justify-center gap-2 bg-[#c79a46] px-5 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#031d18] transition hover:bg-[#dfbd78] disabled:cursor-not-allowed disabled:bg-[#d7d2c8] disabled:text-[#777d79]"
        >
          {isSubmitting ? (
            <>
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-[#4c514e] border-t-transparent"
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
          className="border border-[#d5ccbc] bg-[#fffdf8] px-5 py-4 text-[11px] font-black uppercase tracking-[0.12em] text-[#4f5854] transition hover:border-[#9a722e] hover:text-[#062c25] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anuluj
        </button>
      </div>

      <p className="text-[11px] leading-5 text-[#68706c]">
        Po wysłaniu zapiszemy Twoją konfigurację. Jeśli automatyczna wysyłka
        przebiegnie poprawnie, na podany adres e-mail otrzymasz podsumowanie i PDF.
      </p>
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
    <div className="overflow-hidden border border-[#d5ccbc] bg-[#fffdf8]">
      <div className="bg-[#062c25] px-6 py-7 text-[#f6f1e7] sm:px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c79a46] text-2xl font-black text-[#031d18]">
          ✓
        </div>

        <p className="mt-6 text-[9px] font-black uppercase tracking-[0.22em] text-[#dfbd78]">
          MoonGlass
        </p>

        <h4 className="mt-2 font-serif text-2xl font-medium">
          Zapytanie zostało wysłane
        </h4>

        <p className="mt-3 max-w-xl text-sm leading-6 text-[#f6f1e7]/72">
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
          <div className="border border-[#c7b27c] bg-[#f4ead5] p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9a722e]">
              Podsumowanie wysłane
            </p>
            <p className="mt-2 text-sm leading-6 text-[#24312d]">
              Na adres <strong className="break-all">{email}</strong> wysłaliśmy
              podsumowanie konfiguracji oraz dokument PDF z wyceną.
            </p>
          </div>
        ) : (
          <div className="border border-amber-200 bg-amber-50 p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-800">
              Zgłoszenie jest zapisane
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-950">
              Nie udało się potwierdzić automatycznej wysyłki podsumowania na
              adres <strong className="break-all">{email}</strong>. Twoje
              zapytanie zostało jednak przyjęte.
            </p>
          </div>
        )}

        <div className="bg-[#f4f0e7] p-5 text-sm leading-6 text-[#43524c]">
          <p className="font-bold text-[#062c25]">Co dalej?</p>
          <p className="mt-1">
            Sprawdzimy konfigurację pod kątem technicznym i skontaktujemy się z
            Tobą, aby potwierdzić szczegóły realizacji.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full bg-[#c79a46] px-5 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#031d18] transition hover:bg-[#dfbd78]"
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
      <span className="flex items-center gap-2 font-bold text-[#24312d]">
        {label}
        {required ? (
          <span className="bg-[#f4ead5] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#9a722e]">
            wymagane
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

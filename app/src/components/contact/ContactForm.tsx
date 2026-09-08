"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type FormStatus =
  | { type: "idle"; message: "" }
  | { type: "sending"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>({
    type: "idle",
    message: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus({
      type: "sending",
      message: "",
    });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          topic: formData.get("topic"),
          message: formData.get("message"),
          website: formData.get("website"),
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        message: string;
      };

      if (!response.ok || !result.success) {
        setStatus({
          type: "error",
          message:
            result.message ??
            "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
        });

        return;
      }

      form.reset();

      setStatus({
        type: "success",
        message:
          "Dziękujemy. Wiadomość została wysłana. Skontaktujemy się z Tobą możliwie szybko.",
      });
    } catch {
      setStatus({
        type: "error",
        message:
          "Nie udało się połączyć z serwerem. Spróbuj ponownie później.",
      });
    }
  }

  return (
    <div className="bg-white/55 p-6 sm:p-10 lg:p-12">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a722e]">
        Formularz kontaktowy
      </p>

      <h2 className="mt-4 font-serif text-3xl font-medium text-[#062c25] sm:text-4xl">
        Opowiedz nam o swoim projekcie.
      </h2>

      <form onSubmit={handleSubmit} className="mt-9">
        {/* Honeypot antyspamowy */}
        <div
          className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
          aria-hidden="true"
        >
          <label>
            Strona internetowa
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#062c25]/60">
              Imię i nazwisko *
            </span>

            <input
              type="text"
              name="name"
              required
              maxLength={120}
              autoComplete="name"
              className="mt-3 w-full border-b border-[#062c25]/20 bg-transparent py-3 text-[#062c25] outline-none transition focus:border-[#c79a46]"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#062c25]/60">
              Telefon *
            </span>

            <input
              type="tel"
              name="phone"
              required
              maxLength={40}
              autoComplete="tel"
              className="mt-3 w-full border-b border-[#062c25]/20 bg-transparent py-3 text-[#062c25] outline-none transition focus:border-[#c79a46]"
            />
          </label>
        </div>

        <label className="mt-6 block">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#062c25]/60">
            E-mail *
          </span>

          <input
            type="email"
            name="email"
            required
            maxLength={254}
            autoComplete="email"
            className="mt-3 w-full border-b border-[#062c25]/20 bg-transparent py-3 text-[#062c25] outline-none transition focus:border-[#c79a46]"
          />
        </label>

        <label className="mt-6 block">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#062c25]/60">
            Temat
          </span>

          <select
            name="topic"
            defaultValue="general"
            className="mt-3 w-full border-b border-[#062c25]/20 bg-transparent py-3 text-[#062c25] outline-none transition focus:border-[#c79a46]"
          >
            <option value="general">Zapytanie ogólne</option>
            <option value="winter_garden">Ogród zimowy</option>
            <option value="terrace_roof">Zadaszenie tarasu</option>
            <option value="calculator">Konfiguracja z kalkulatora</option>
            <option value="other">Inny temat</option>
          </select>
        </label>

        <label className="mt-6 block">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#062c25]/60">
            Wiadomość *
          </span>

          <textarea
            name="message"
            required
            maxLength={2000}
            rows={6}
            className="mt-3 w-full resize-y border border-[#062c25]/20 bg-transparent p-4 text-[#062c25] outline-none transition focus:border-[#c79a46]"
            placeholder="Napisz, czego dotyczy projekt, jakie masz wymiary lub czego chciałbyś się dowiedzieć."
          />
        </label>

        <label className="mt-6 flex items-start gap-3 text-xs leading-6 text-[#202421]/55">
          <input
            type="checkbox"
            required
            className="mt-1 h-4 w-4 accent-[#9a722e]"
          />

          <span>
            Zapoznałem się z{" "}
            <Link
              href="/polityka-prywatnosci"
              className="text-[#062c25] underline underline-offset-2"
            >
              polityką prywatności
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={status.type === "sending"}
          className="mt-8 w-full bg-[#062c25] px-8 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:bg-[#0b3a31] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {status.type === "sending"
            ? "Wysyłanie..."
            : "Wyślij wiadomość"}
        </button>

        {status.type === "success" && (
          <p className="mt-5 border-l-2 border-[#9a722e] pl-4 text-sm leading-6 text-[#062c25]">
            {status.message}
          </p>
        )}

        {status.type === "error" && (
          <p className="mt-5 border-l-2 border-red-700 pl-4 text-sm leading-6 text-red-800">
            {status.message}
          </p>
        )}
      </form>
    </div>
  );
}
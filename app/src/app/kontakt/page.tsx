import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ContactForm } from "@/components/contact/ContactForm";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Skontaktuj się z MoonGlass w sprawie ogrodu zimowego, zadaszenia tarasu lub indywidualnej wyceny projektu.",
};

export default function KontaktPage() {
  return (
    <>
      <main>
        {/* HERO */}
        <section className="relative min-h-[560px] overflow-hidden bg-[#031d18] text-[#f6f1e7]">
          <Image
            src="/images/glass-system/hero-winter-garden-evening.png"
            alt="Zabudowa tarasu MoonGlass"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,29,24,0.96)_0%,rgba(3,29,24,0.82)_45%,rgba(3,29,24,0.30)_80%,rgba(3,29,24,0.15)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/70 via-transparent to-[#031d18]/25" />

          <SiteHeader activePage="kontakt" />

          <div className="relative z-10 mx-auto flex min-h-[560px] max-w-7xl items-center px-6 pb-16 pt-36 sm:px-8 lg:px-12">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="h-px w-11 bg-[#c79a46]" />

                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
                  Kontakt MoonGlass
                </p>
              </div>

              <h1 className="mt-6 max-w-4xl font-serif text-5xl font-medium leading-[0.96] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
                Porozmawiajmy o
                <span className="block text-[#dfbd78]">
                  Twojej przestrzeni.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-sm leading-7 text-[#f6f1e7]/70 sm:text-base sm:leading-8">
                Masz pytania dotyczące ogrodu zimowego, zadaszenia tarasu
                albo przygotowanej konfiguracji? Napisz lub zadzwoń.
                Pomożemy dobrać odpowiednie rozwiązanie.
              </p>

              <Link
                href="#formularz"
                className="mt-9 inline-flex bg-[#c79a46] px-8 py-4 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#031d18] transition hover:bg-[#dfbd78]"
              >
                Napisz do nas
              </Link>
            </div>
          </div>
        </section>

        {/* KONTAKT + FORMULARZ */}
        <section
          id="formularz"
          className="bg-[#f6f1e7] px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
        >
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.42fr_0.58fr] lg:gap-24">
            {/* LEWA STRONA */}
            <div>
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-[#c79a46]" />

                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9a722e]">
                  Skontaktuj się
                </p>
              </div>

              <h2 className="mt-6 font-serif text-4xl font-medium leading-[1.02] text-[#062c25] sm:text-5xl">
                Jesteśmy tutaj,
                <span className="block text-[#9a722e]">
                  żeby pomóc.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-sm leading-7 text-[#202421]/60 sm:text-base">
                Jeśli masz już wymiary lub wstępny pomysł, możesz opisać go
                w wiadomości. Jeżeli dopiero zaczynasz — również pomożemy
                określić najlepszy kierunek.
              </p>

              <div className="mt-10 border-t border-[#062c25]/15">
                <div className="border-b border-[#062c25]/15 py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a722e]">
                    Telefon
                  </p>

                  <a
                    href="tel:+48533850226"
                    className="mt-2 inline-block font-serif text-3xl text-[#062c25] transition hover:text-[#9a722e]"
                  >
                    533 850 226
                  </a>
                </div>

                <div className="border-b border-[#062c25]/15 py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a722e]">
                    E-mail
                  </p>

                  <a
                    href="mailto:biuro@moonglass.pl"
                    className="mt-2 inline-block text-base text-[#062c25] transition hover:text-[#9a722e]"
                  >
                    biuro@moonglass.pl
                  </a>
                </div>

                <div className="border-b border-[#062c25]/15 py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a722e]">
                    Obszar działania
                  </p>

                  <p className="mt-2 text-base text-[#062c25]">
                    Realizacje na terenie całej Polski
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm leading-7 text-[#202421]/55">
                  Chcesz najpierw poznać orientacyjny koszt?
                </p>

                <Link
                  href="/kalkulator"
                  className="mt-3 inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#062c25] transition hover:text-[#9a722e]"
                >
                  Przejdź do kalkulatora
                  <span className="text-[#c79a46]">→</span>
                </Link>
              </div>
            </div>

            {/* FORMULARZ */}
            <ContactForm />
          </div>
        </section>

        {/* PASEK */}
        <section className="bg-[#062c25] px-6 py-14 text-[#f6f1e7] sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#dfbd78]">
                Projekt na wymiar
              </p>
              <p className="mt-2 text-sm leading-6 text-[#f6f1e7]/55">
                Każdą konstrukcję dopasowujemy do konkretnego budynku.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#dfbd78]">
                Indywidualna wycena
              </p>
              <p className="mt-2 text-sm leading-6 text-[#f6f1e7]/55">
                Finalny zakres potwierdzamy po poznaniu szczegółów inwestycji.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#dfbd78]">
                Bezpośredni kontakt
              </p>
              <p className="mt-2 text-sm leading-6 text-[#f6f1e7]/55">
                Zapytanie trafia bezpośrednio do zespołu MoonGlass.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
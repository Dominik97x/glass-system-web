import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Calculator } from "@/components/calculator/Calculator";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Kalkulator ogrodu zimowego i zadaszenia tarasu",
  description:
    "Skonfiguruj ogród zimowy lub zadaszenie tarasu MoonGlass, dobierz wymiary, dach i wyposażenie oraz sprawdź orientacyjną cenę brutto online.",
  alternates: {
    canonical: "/kalkulator",
  },
};

const heroHighlights = [
  "Orientacyjna wycena brutto",
  "Podsumowanie wysyłane na e-mail",
  "Dokument PDF z konfiguracją",
] as const;

const steps = [
  {
    number: "01",
    title: "Wybierz konstrukcję",
    description:
      "Określ, czy konfigurujesz ogród zimowy czy zadaszenie tarasu, a następnie podaj wymiary, kolor konstrukcji i rodzaj dachu.",
  },
  {
    number: "02",
    title: "Dobierz wyposażenie",
    description:
      "Dodaj przeszklenia, rolety ZIP, markizę, oświetlenie LED i pozostałe akcesoria dostępne dla wybranej konstrukcji.",
  },
  {
    number: "03",
    title: "Sprawdź wycenę i wyślij konfigurację",
    description:
      "Zobacz orientacyjną cenę brutto, a następnie wyślij konfigurację do doradcy MoonGlass i otrzymaj podsumowanie na e-mail.",
  },
] as const;

export default function KalkulatorPage() {
  return (
    <>
      <main className="min-h-screen bg-[#f4efe6] text-[#14221e]">
        <section className="relative min-h-[760px] overflow-hidden bg-[#031d18] text-[#f6f1e7] lg:min-h-screen">
          <Image
            src="/images/glass-system/hero-moonglass-day-v2.png"
            alt="Ogród zimowy MoonGlass przy domu"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,29,24,0.76)_0%,rgba(3,29,24,0.52)_35%,rgba(3,29,24,0.16)_70%,rgba(3,29,24,0.04)_100%)]" />

          <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/45 via-transparent to-[#031d18]/10" />

          <SiteHeader activePage="kalkulator" />

          <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-center px-6 pb-20 pt-36 sm:px-8 lg:min-h-screen lg:px-12">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="h-px w-11 bg-[#c79a46]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
                  Kalkulator MoonGlass
                </p>
              </div>

              <h1 className="mt-6 max-w-4xl font-serif text-5xl font-medium leading-[0.96] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
                Kalkulator ogrodu zimowego
                <span className="block text-[#dfbd78]">
                  i zadaszenia tarasu.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-sm leading-7 text-[#f6f1e7]/72 sm:text-base sm:leading-8">
                Skonfiguruj ogród zimowy lub zadaszenie tarasu na wymiar.
                Dobierz podstawowe parametry konstrukcji, sprawdź orientacyjną
                cenę brutto i wyślij gotową konfigurację do doradcy MoonGlass.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#kalkulator"
                  className="bg-[#c79a46] px-8 py-4 text-center text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#031d18] transition hover:bg-[#dfbd78]"
                >
                  Rozpocznij konfigurację
                </Link>

                <Link
                  href="/kontakt"
                  className="border border-[#f6f1e7]/35 px-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:border-[#c79a46] hover:text-[#dfbd78]"
                >
                  Zapytaj doradcę
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#f6f1e7]/15 pt-6">
                {heroHighlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f6f1e7]/58"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f6f1e7] px-6 py-14 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="border-t border-[#062c25]/18 pt-6"
              >
                <span className="font-serif text-3xl text-[#9a722e]">
                  {step.number}
                </span>
                <h2 className="mt-4 font-serif text-2xl font-medium text-[#062c25]">
                  {step.title}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-7 text-[#202421]/60">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="kalkulator"
          className="scroll-mt-4 bg-[#e9e2d6] px-2 py-8 sm:px-4 sm:py-12 lg:px-6 lg:py-16"
        >
          <div className="mx-auto max-w-[1880px]">
            <div className="mx-auto mb-8 max-w-4xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9a722e]">
                Twoja konfiguracja
              </p>
              <h2 className="mt-4 font-serif text-3xl font-medium leading-tight text-[#062c25] sm:text-4xl lg:text-5xl">
                Dobierz parametry i sprawdź orientacyjną cenę.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#202421]/60">
                Wybierz wymiary, wariant dachu, przeszklenia i wyposażenie.
                Zdjęcia w podglądzie mają charakter poglądowy, a dokładny wygląd
                konstrukcji jest potwierdzany po weryfikacji technicznej.
              </p>
            </div>

            <Calculator />
          </div>
        </section>

        <section className="bg-[#062c25] px-6 py-16 text-[#f6f1e7] sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.58fr_0.42fr] lg:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#dfbd78]">
                Wycena orientacyjna
              </p>
              <h2 className="mt-4 max-w-3xl font-serif text-3xl font-medium leading-tight sm:text-4xl">
                Finalną ofertę potwierdzamy po sprawdzeniu warunków realizacji.
              </h2>
            </div>

            <div className="border-l border-[#f6f1e7]/15 pl-0 lg:pl-10">
              <p className="text-sm leading-7 text-[#f6f1e7]/60">
                Kalkulator pomaga określić budżet i przygotować kompletne
                zapytanie. Wymiary, sposób montażu i możliwość zastosowania
                poszczególnych rozwiązań wymagają późniejszej weryfikacji.
              </p>

              <Link
                href="/oferta"
                className="mt-5 inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#f6f1e7] transition hover:text-[#dfbd78]"
              >
                Zobacz ofertę MoonGlass
                <span className="text-[#c79a46]">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Calculator } from "@/components/calculator/Calculator";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Kalkulator",
  description:
    "Skonfiguruj ogród zimowy lub zadaszenie tarasu MoonGlass, sprawdź orientacyjną cenę brutto i wyślij gotową konfigurację do doradcy.",
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
      "Określ typ zabudowy, wymiary, kolor konstrukcji oraz rodzaj dachu.",
  },
  {
    number: "02",
    title: "Dobierz wyposażenie",
    description:
      "Dodaj przeszklenia, rolety ZIP, markizę, oświetlenie i akcesoria.",
  },
  {
    number: "03",
    title: "Wyślij konfigurację",
    description:
      "Otrzymasz podsumowanie na e-mail, a doradca MoonGlass zweryfikuje projekt.",
  },
] as const;

export default function KalkulatorPage() {
  return (
    <>
      <main className="min-h-screen bg-[#f4efe6] text-[#14221e]">
        <section className="relative min-h-[620px] overflow-hidden bg-[#031d18] text-[#f6f1e7]">
          <Image
            src="/images/glass-system/hero-winter-garden-evening.png"
            alt="Ogród zimowy MoonGlass przy domu"
            fill
            loading="eager"
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,29,24,0.96)_0%,rgba(3,29,24,0.80)_42%,rgba(3,29,24,0.34)_76%,rgba(3,29,24,0.18)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/75 via-transparent to-[#031d18]/25" />

          <header className="relative z-20 border-b border-[#f6f1e7]/10">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6 sm:px-8 lg:px-12">
              <Link href="/" className="group shrink-0">
                <p className="font-serif text-2xl tracking-[0.08em] text-[#f6f1e7]">
                  MoonGlass
                </p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#dfbd78]">
                  Konstrukcje na wymiar
                </p>
              </Link>

              <nav className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f6f1e7]/70 lg:flex">
                <Link href="/" className="transition hover:text-[#dfbd78]">
                  Start
                </Link>
                <Link href="/oferta" className="transition hover:text-[#dfbd78]">
                  Oferta
                </Link>
                <Link
                  href="/realizacje"
                  className="transition hover:text-[#dfbd78]"
                >
                  Inspiracje
                </Link>
                <Link
                  href="/kontakt"
                  className="transition hover:text-[#dfbd78]"
                >
                  Kontakt
                </Link>
              </nav>

              <div className="flex items-center gap-3">
                <Link
                  href="#kalkulator"
                  className="hidden border border-[#c79a46]/70 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:bg-[#c79a46] hover:text-[#031d18] sm:inline-flex"
                >
                  Przejdź do wyceny
                </Link>

                <details className="relative lg:hidden">
                  <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center border border-[#f6f1e7]/25 bg-[#031d18]/45 text-[#f6f1e7] backdrop-blur transition hover:border-[#c79a46] [&::-webkit-details-marker]:hidden">
                    <span className="sr-only">Otwórz menu</span>
                    <span aria-hidden="true" className="space-y-1.5">
                      <span className="block h-px w-5 bg-current" />
                      <span className="block h-px w-5 bg-current" />
                      <span className="block h-px w-5 bg-current" />
                    </span>
                  </summary>

                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 border border-[#c79a46]/35 bg-[#031d18]/96 p-2 shadow-2xl shadow-black/30 backdrop-blur">
                    <MobileNavLink href="/">Start</MobileNavLink>
                    <MobileNavLink href="/oferta">Oferta</MobileNavLink>
                    <MobileNavLink href="/realizacje">Inspiracje</MobileNavLink>
                    <MobileNavLink href="/kontakt">Kontakt</MobileNavLink>

                    <Link
                      href="#kalkulator"
                      className="mt-2 block bg-[#c79a46] px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.16em] text-[#031d18] transition hover:bg-[#dfbd78]"
                    >
                      Przejdź do wyceny
                    </Link>
                  </div>
                </details>
              </div>
            </div>
          </header>

          <div className="relative z-10 mx-auto flex min-h-[520px] max-w-7xl items-center px-6 pb-16 pt-16 sm:px-8 lg:px-12">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="h-px w-11 bg-[#c79a46]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
                  Kalkulator MoonGlass
                </p>
              </div>

              <h1 className="mt-6 max-w-4xl font-serif text-5xl font-medium leading-[0.96] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
                Skonfiguruj swoją przestrzeń
                <span className="block text-[#dfbd78]">
                  i poznaj orientacyjny koszt.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-sm leading-7 text-[#f6f1e7]/72 sm:text-base sm:leading-8">
                Dobierz podstawowe parametry ogrodu zimowego lub zadaszenia
                tarasu. Cena aktualizuje się automatycznie, a po wysłaniu
                konfiguracji otrzymasz jej podsumowanie wraz z dokumentem PDF.
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
                Dobierz parametry i sprawdź cenę.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#202421]/60">
                Zdjęcia w podglądzie mają charakter poglądowy. Dokładny wygląd
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
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function MobileNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block border-b border-[#f6f1e7]/10 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f6f1e7]/78 transition hover:bg-[#f6f1e7]/5 hover:text-[#dfbd78]"
    >
      {children}
    </Link>
  );
}

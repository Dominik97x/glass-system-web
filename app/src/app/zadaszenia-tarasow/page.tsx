import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Zadaszenia tarasów na wymiar",
  description:
    "Zadaszenia tarasów MoonGlass na wymiar. Aluminiowa konstrukcja, dach szklany lub poliwęglanowy, możliwość rozbudowy o przeszklenia, rolety ZIP, markizę i oświetlenie LED.",
  alternates: {
    canonical: "/zadaszenia-tarasow",
  },
};

const features = [
  {
    number: "01",
    title: "Konstrukcja aluminiowa",
    description:
      "Zadaszenie projektujemy pod wymiary tarasu i architekturę budynku, tak aby konstrukcja była spójna z otoczeniem domu.",
  },
  {
    number: "02",
    title: "Dach szklany lub poliwęglanowy",
    description:
      "Rodzaj pokrycia dachu dobierasz podczas konfiguracji w zależności od oczekiwanego wyglądu i charakteru przestrzeni.",
  },
  {
    number: "03",
    title: "Możliwość rozbudowy",
    description:
      "Zadaszenie może być punktem wyjścia do dalszej zabudowy tarasu, między innymi z wykorzystaniem przesuwnych ścian szklanych.",
  },
  {
    number: "04",
    title: "Dodatki zwiększające komfort",
    description:
      "Rolety ZIP, markiza, oświetlenie LED i dodatkowe akcesoria pozwalają dopasować konstrukcję do sposobu korzystania z tarasu.",
  },
] as const;

const processSteps = [
  {
    number: "01",
    title: "Podaj wymiary tarasu",
    description:
      "Określ podstawowe wymiary konstrukcji i wybierz jej wariant.",
  },
  {
    number: "02",
    title: "Wybierz dach i kolor",
    description:
      "Dobierz pokrycie dachu oraz kolor aluminiowej konstrukcji.",
  },
  {
    number: "03",
    title: "Dodaj wyposażenie",
    description:
      "Rozszerz projekt o przeszklenia, rolety ZIP, markizę, LED i dostępne akcesoria.",
  },
  {
    number: "04",
    title: "Sprawdź orientacyjną wycenę",
    description:
      "Kalkulator przygotuje wstępną cenę brutto, a konfigurację możesz przesłać do doradcy MoonGlass.",
  },
] as const;

const faqItems = [
  {
    question: "Czy zadaszenie tarasu jest wykonywane na wymiar?",
    answer:
      "Tak. Projekt dopasowujemy do wymiarów tarasu, budynku oraz wybranej konfiguracji konstrukcji.",
  },
  {
    question: "Jakie pokrycie dachu jest dostępne?",
    answer:
      "W zależności od konfiguracji możesz wybrać dach szklany lub poliwęglanowy.",
  },
  {
    question: "Czy zadaszenie można później rozbudować o ściany szklane?",
    answer:
      "Tak, możliwość rozbudowy o przeszklenia jest jednym z wariantów, które można uwzględnić przy projektowaniu konstrukcji.",
  },
  {
    question: "Czy mogę sprawdzić cenę zadaszenia tarasu online?",
    answer:
      "Tak. Kalkulator MoonGlass pozwala wybrać podstawowe parametry zadaszenia i sprawdzić orientacyjną cenę brutto przed wysłaniem zapytania.",
  },
] as const;

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Start",
      item: "https://moonglass.pl",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Oferta",
      item: "https://moonglass.pl/oferta",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Zadaszenia tarasów",
      item: "https://moonglass.pl/zadaszenia-tarasow",
    },
  ],
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Zadaszenia tarasów na wymiar",
  serviceType: "Projektowanie i wykonanie zadaszeń tarasowych na wymiar",
  provider: {
    "@id": "https://moonglass.pl/#organization",
  },
  areaServed: {
    "@type": "Country",
    name: "Polska",
  },
  url: "https://moonglass.pl/zadaszenia-tarasow",
  description:
    "Zadaszenia tarasów MoonGlass na wymiar z aluminiową konstrukcją, dachem szklanym lub poliwęglanowym oraz możliwością rozbudowy o przeszklenia i wyposażenie dodatkowe.",
};

export default function ZadaszeniaTarasowPage() {
  return (
    <>
      <main>
        <section className="relative min-h-[760px] overflow-hidden bg-[#031d18] text-[#f6f1e7] lg:min-h-screen">
          <Image
            src="/images/glass-system/start-zadaszenie-tarasu.png"
            alt="Zadaszenie tarasu MoonGlass na wymiar"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,29,24,0.82)_0%,rgba(3,29,24,0.58)_38%,rgba(3,29,24,0.18)_72%,rgba(3,29,24,0.04)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/50 via-transparent to-[#031d18]/10" />

          <SiteHeader activePage="oferta" />

          <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-center px-6 pb-20 pt-36 sm:px-8 lg:min-h-screen lg:px-12">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="h-px w-11 bg-[#c79a46]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
                  Zadaszenia tarasowe MoonGlass
                </p>
              </div>

              <h1 className="mt-6 max-w-4xl font-serif text-5xl font-medium leading-[0.96] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
                Zadaszenia tarasów
                <span className="block text-[#dfbd78]">
                  na wymiar.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-sm leading-7 text-[#f6f1e7]/72 sm:text-base sm:leading-8">
                Aluminiowe zadaszenia tarasowe projektowane pod konkretny dom
                i wymiary tarasu. Wybierz rodzaj dachu, kolor konstrukcji oraz
                dodatkowe wyposażenie i przygotuj własną konfigurację.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/kalkulator"
                  className="bg-[#c79a46] px-8 py-4 text-center text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#031d18] transition hover:bg-[#dfbd78]"
                >
                  Wyceń zadaszenie tarasu
                </Link>

                <Link
                  href="#mozliwosci"
                  className="border border-[#f6f1e7]/35 px-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:border-[#c79a46] hover:text-[#dfbd78]"
                >
                  Poznaj możliwości
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#f6f1e7]/15 pt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f6f1e7]/58">
                <span>Konstrukcja aluminiowa</span>
                <span className="text-[#c79a46]">◆</span>
                <span>Projekt na wymiar</span>
                <span className="text-[#c79a46]">◆</span>
                <span>Realizacje w całej Polsce</span>
              </div>
            </div>
          </div>
        </section>

        <section
          id="mozliwosci"
          className="bg-[#f6f1e7] px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.42fr_0.58fr] lg:gap-20">
              <div>
                <div className="flex items-center gap-4">
                  <span className="h-px w-10 bg-[#c79a46]" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9a722e]">
                    Zadaszenie tarasu na wymiar
                  </p>
                </div>

                <h2 className="mt-6 max-w-xl font-serif text-4xl font-medium leading-[1.02] text-[#062c25] sm:text-5xl lg:text-6xl">
                  Więcej komfortu
                  <span className="block text-[#9a722e]">
                    na Twoim tarasie.
                  </span>
                </h2>

                <p className="mt-7 max-w-lg text-sm leading-7 text-[#202421]/65 sm:text-base">
                  Zadaszenie pozwala stworzyć bardziej osłoniętą strefę przy
                  domu. Konstrukcję, pokrycie dachu i wyposażenie dobieramy do
                  wymiarów tarasu oraz oczekiwanego sposobu użytkowania.
                </p>

                <Link
                  href="/kalkulator"
                  className="mt-9 inline-flex items-center gap-3 border-b border-[#9a722e]/60 pb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#062c25] transition hover:text-[#9a722e]"
                >
                  Skonfiguruj zadaszenie
                  <span className="text-[#c79a46]">→</span>
                </Link>
              </div>

              <div className="grid border-t border-[#062c25]/15 sm:grid-cols-2">
                {features.map((feature, index) => (
                  <article
                    key={feature.number}
                    className={`border-b border-[#062c25]/15 py-8 sm:px-8 lg:py-10 ${
                      index % 2 === 0 ? "sm:border-r" : ""
                    }`}
                  >
                    <span className="font-serif text-3xl text-[#c79a46]">
                      {feature.number}
                    </span>

                    <h3 className="mt-5 font-serif text-2xl font-medium text-[#062c25] sm:text-3xl">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[#202421]/60">
                      {feature.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#031d18] px-6 py-20 text-[#f6f1e7] sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-[#c79a46]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
                  Dach i wyposażenie
                </p>
              </div>

              <h2 className="mt-6 max-w-xl font-serif text-4xl font-medium leading-[1.02] sm:text-5xl lg:text-6xl">
                Dopasuj zadaszenie
                <span className="block text-[#dfbd78]">
                  do swojego tarasu.
                </span>
              </h2>

              <p className="mt-7 max-w-xl text-sm leading-7 text-[#f6f1e7]/62 sm:text-base">
                Rodzaj dachu i dodatkowe wyposażenie wpływają na wygląd oraz
                funkcjonalność całej konstrukcji. Konfigurację możesz zacząć od
                podstawowych wymiarów, a następnie rozbudować o kolejne opcje.
              </p>

              <div className="mt-8 space-y-4 border-t border-[#f6f1e7]/15 pt-6 text-sm leading-7 text-[#f6f1e7]/68">
                <p>
                  <span className="font-semibold text-[#dfbd78]">Dach:</span>{" "}
                  szkło lub poliwęglan, zależnie od wybranego wariantu.
                </p>
                <p>
                  <span className="font-semibold text-[#dfbd78]">
                    Rozbudowa:
                  </span>{" "}
                  możliwość zastosowania przesuwnych ścian szklanych.
                </p>
                <p>
                  <span className="font-semibold text-[#dfbd78]">
                    Dodatki:
                  </span>{" "}
                  rolety ZIP, markiza, oświetlenie LED i akcesoria.
                </p>
              </div>
            </div>

            <div className="relative min-h-[520px] overflow-hidden">
              <Image
                src="/images/glass-system/oferta-zadaszenie-tarasu.png"
                alt="Nowoczesne aluminiowe zadaszenie tarasu"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/65 via-transparent to-transparent" />
            </div>
          </div>
        </section>

        <section className="bg-[#f6f1e7] px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 grid gap-8 lg:grid-cols-[0.58fr_0.42fr] lg:items-end">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9a722e]">
                  Jak wygląda proces
                </p>

                <h2 className="mt-5 max-w-3xl font-serif text-4xl font-medium leading-[1.02] text-[#062c25] sm:text-5xl lg:text-6xl">
                  Od wymiarów tarasu do
                  <span className="block text-[#9a722e]">
                    gotowej konfiguracji.
                  </span>
                </h2>
              </div>

              <p className="max-w-lg text-sm leading-7 text-[#202421]/65 lg:justify-self-end">
                Kalkulator prowadzi przez najważniejsze elementy zadaszenia i
                pozwala przygotować konkretne zapytanie do doradcy.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {processSteps.map((step) => (
                <article
                  key={step.number}
                  className="border-t border-[#062c25]/15 pt-6"
                >
                  <span className="font-serif text-3xl text-[#c79a46]">
                    {step.number}
                  </span>

                  <h3 className="mt-4 font-serif text-2xl font-medium text-[#062c25]">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#202421]/60">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative min-h-[560px] overflow-hidden bg-[#031d18] text-[#f6f1e7]">
          <Image
            src="/images/glass-system/inspiracje/inspiracja-zadaszenie-tarasu-jadalnia.png"
            alt="Zadaszenie tarasu z przestrzenią jadalnianą"
            fill
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-[#031d18]/64" />

          <div className="relative z-10 mx-auto flex min-h-[560px] max-w-7xl items-center px-6 py-20 sm:px-8 lg:px-12">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
                Inspiracje
              </p>

              <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.02] sm:text-5xl lg:text-6xl">
                Zobacz zadaszenia tarasów
                <span className="block text-[#dfbd78]">
                  w różnych aranżacjach.
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-[#f6f1e7]/65 sm:text-base">
                Zobacz przykładowe wizualizacje przestrzeni tarasowych i
                sprawdź, jak konstrukcja może współgrać z domem oraz ogrodem.
              </p>

              <Link
                href="/realizacje"
                className="mt-8 inline-flex items-center gap-3 border-b border-[#c79a46]/70 pb-2 text-[11px] font-bold uppercase tracking-[0.15em] transition hover:text-[#dfbd78]"
              >
                Zobacz inspiracje
                <span className="text-[#c79a46]">→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[#f6f1e7] px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9a722e]">
                Najczęstsze pytania
              </p>

              <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.02] text-[#062c25] sm:text-5xl">
                O zadaszeniach tarasowych MoonGlass.
              </h2>
            </div>

            <div className="mt-12 border-t border-[#062c25]/15">
              {faqItems.map((item) => (
                <article
                  key={item.question}
                  className="border-b border-[#062c25]/15 py-7"
                >
                  <h3 className="font-serif text-2xl font-medium text-[#062c25]">
                    {item.question}
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#202421]/62 sm:text-base">
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#062c25] px-6 py-20 text-[#f6f1e7] sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
              Zacznij swój projekt
            </p>

            <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.02] sm:text-5xl lg:text-6xl">
              Skonfiguruj swoje
              <span className="block text-[#dfbd78]">
                zadaszenie tarasu.
              </span>
            </h2>

            <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-[#f6f1e7]/62 sm:text-base">
              Wybierz podstawowe parametry, sprawdź orientacyjną cenę i prześlij
              konfigurację do doradcy MoonGlass.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/kalkulator"
                className="bg-[#c79a46] px-8 py-4 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#031d18] transition hover:bg-[#dfbd78]"
              >
                Uruchom kalkulator
              </Link>

              <Link
                href="/kontakt"
                className="border border-[#f6f1e7]/30 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:border-[#c79a46] hover:text-[#dfbd78]"
              >
                Skontaktuj się z nami
              </Link>
            </div>

            <Link
              href="/oferta"
              className="mt-8 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#f6f1e7]/55 transition hover:text-[#dfbd78]"
            >
              Wróć do całej oferty
              <span className="text-[#c79a46]">→</span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Ogrody zimowe na wymiar",
  description:
    "Ogrody zimowe MoonGlass na wymiar. Aluminiowa konstrukcja, dach szklany lub poliwęglanowy, przesuwne ściany szklane, rolety ZIP, markiza i oświetlenie LED.",
  alternates: {
    canonical: "/ogrody-zimowe",
  },
};

const features = [
  {
    number: "01",
    title: "Konstrukcja na wymiar",
    description:
      "Wymiary i układ konstrukcji dopasowujemy do konkretnego tarasu, budynku oraz sposobu korzystania z przestrzeni.",
  },
  {
    number: "02",
    title: "Przesuwne ściany szklane",
    description:
      "Zabudowa szklana pozwala osłonić taras od wiatru i deszczu, zachowując jednocześnie lekki, nowoczesny charakter konstrukcji.",
  },
  {
    number: "03",
    title: "Dach dopasowany do projektu",
    description:
      "W zależności od konfiguracji możesz wybrać dach szklany lub jeden z dostępnych wariantów poliwęglanu.",
  },
  {
    number: "04",
    title: "Wyposażenie dodatkowe",
    description:
      "Rolety ZIP, markiza i oświetlenie LED pozwalają zwiększyć komfort korzystania z ogrodu zimowego.",
  },
] as const;

const processSteps = [
  {
    number: "01",
    title: "Określ wymiary",
    description:
      "Podaj podstawowe wymiary przestrzeni i wybierz wariant konstrukcji.",
  },
  {
    number: "02",
    title: "Dobierz dach i zabudowę",
    description:
      "Wybierz pokrycie dachu, przeszklenia oraz dodatkowe elementy wyposażenia.",
  },
  {
    number: "03",
    title: "Sprawdź orientacyjną cenę",
    description:
      "Kalkulator MoonGlass przygotuje wstępną wycenę brutto na podstawie wybranej konfiguracji.",
  },
  {
    number: "04",
    title: "Prześlij projekt do weryfikacji",
    description:
      "Gotowa konfiguracja trafia do doradcy, który może pomóc dopracować rozwiązanie do warunków inwestycji.",
  },
] as const;

const faqItems = [
  {
    question: "Czy ogród zimowy MoonGlass jest wykonywany na wymiar?",
    answer:
      "Tak. Konstrukcję dopasowujemy do wymiarów tarasu, architektury budynku i wybranego sposobu zabudowy.",
  },
  {
    question: "Jakie pokrycie dachu można wybrać?",
    answer:
      "W konfiguracji dostępne są warianty dachu szklanego oraz poliwęglanowego. Ostateczny wybór zależy od projektu i oczekiwanego efektu.",
  },
  {
    question: "Czy ogród zimowy może mieć przesuwne ściany szklane?",
    answer:
      "Tak. Przesuwne tafle szklane mogą stanowić zabudowę boków konstrukcji i pozwalają osłonić przestrzeń przy zachowaniu dużej ilości światła.",
  },
  {
    question: "Czy przed kontaktem mogę sprawdzić orientacyjną cenę?",
    answer:
      "Tak. Kalkulator MoonGlass pozwala wybrać podstawowe parametry konstrukcji i zobaczyć orientacyjną wycenę brutto przed wysłaniem zapytania.",
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
      name: "Ogrody zimowe",
      item: "https://moonglass.pl/ogrody-zimowe",
    },
  ],
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Ogrody zimowe na wymiar",
  serviceType: "Projektowanie i wykonanie ogrodów zimowych na wymiar",
  provider: {
    "@id": "https://moonglass.pl/#organization",
  },
  areaServed: {
    "@type": "Country",
    name: "Polska",
  },
  url: "https://moonglass.pl/ogrody-zimowe",
  description:
    "Ogrody zimowe MoonGlass na wymiar z aluminiową konstrukcją, dachem szklanym lub poliwęglanowym, zabudową szklaną i wyposażeniem dodatkowym.",
};

export default function OgrodyZimowePage() {
  return (
    <>
      <main>
        <section className="relative min-h-[760px] overflow-hidden bg-[#031d18] text-[#f6f1e7] lg:min-h-screen">
          <Image
            src="/images/glass-system/start-ogrod-zimowy.png"
            alt="Ogród zimowy MoonGlass na wymiar"
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
                  Ogrody zimowe MoonGlass
                </p>
              </div>

              <h1 className="mt-6 max-w-4xl font-serif text-5xl font-medium leading-[0.96] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
                Ogrody zimowe
                <span className="block text-[#dfbd78]">
                  na wymiar.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-sm leading-7 text-[#f6f1e7]/72 sm:text-base sm:leading-8">
                Aluminiowe ogrody zimowe projektowane pod konkretny dom i taras.
                Dobierz dach, przeszklenia oraz wyposażenie i stwórz osłoniętą
                przestrzeń dopasowaną do Twoich potrzeb.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/kalkulator"
                  className="bg-[#c79a46] px-8 py-4 text-center text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#031d18] transition hover:bg-[#dfbd78]"
                >
                  Wyceń ogród zimowy
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
                    Ogród zimowy na wymiar
                  </p>
                </div>

                <h2 className="mt-6 max-w-xl font-serif text-4xl font-medium leading-[1.02] text-[#062c25] sm:text-5xl lg:text-6xl">
                  Więcej możliwości
                  <span className="block text-[#9a722e]">
                    przy Twoim domu.
                  </span>
                </h2>

                <p className="mt-7 max-w-lg text-sm leading-7 text-[#202421]/65 sm:text-base">
                  Ogród zimowy może rozbudować funkcjonalność tarasu i stworzyć
                  bardziej osłoniętą przestrzeń przy domu. Kluczowe elementy
                  konfiguracji dobieramy indywidualnie do inwestycji.
                </p>

                <Link
                  href="/kalkulator"
                  className="mt-9 inline-flex items-center gap-3 border-b border-[#9a722e]/60 pb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#062c25] transition hover:text-[#9a722e]"
                >
                  Skonfiguruj ogród zimowy
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
            <div className="relative min-h-[520px] overflow-hidden">
              <Image
                src="/images/glass-system/oferta/oferta-ogrod-zimowy-triangle.png"
                alt="Przeszklony ogród zimowy przy domu"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/65 via-transparent to-transparent" />
            </div>

            <div>
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-[#c79a46]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
                  Dach i przeszklenia
                </p>
              </div>

              <h2 className="mt-6 max-w-xl font-serif text-4xl font-medium leading-[1.02] sm:text-5xl lg:text-6xl">
                Dopasuj konstrukcję
                <span className="block text-[#dfbd78]">
                  do sposobu użytkowania.
                </span>
              </h2>

              <p className="mt-7 max-w-xl text-sm leading-7 text-[#f6f1e7]/62 sm:text-base">
                Rodzaj dachu, zakres zabudowy szklanej i wyposażenie wpływają
                zarówno na wygląd konstrukcji, jak i sposób korzystania z niej.
                Dlatego konfigurację warto zacząć od podstawowych wymiarów i
                oczekiwanego zakresu zabudowy.
              </p>

              <div className="mt-8 space-y-4 border-t border-[#f6f1e7]/15 pt-6 text-sm leading-7 text-[#f6f1e7]/68">
                <p>
                  <span className="font-semibold text-[#dfbd78]">Dach:</span>{" "}
                  szkło lub poliwęglan, zależnie od wybranego wariantu.
                </p>
                <p>
                  <span className="font-semibold text-[#dfbd78]">
                    Zabudowa boków:
                  </span>{" "}
                  przesuwne tafle szklane.
                </p>
                <p>
                  <span className="font-semibold text-[#dfbd78]">
                    Dodatki:
                  </span>{" "}
                  rolety ZIP, markiza, oświetlenie LED i akcesoria.
                </p>
              </div>
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
                  Od wymiarów do
                  <span className="block text-[#9a722e]">
                    gotowej konfiguracji.
                  </span>
                </h2>
              </div>

              <p className="max-w-lg text-sm leading-7 text-[#202421]/65 lg:justify-self-end">
                Kalkulator pozwala zacząć od najważniejszych parametrów i
                przygotować konkretne zapytanie przed rozmową z doradcą.
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
            src="/images/glass-system/inspiracje/inspiracja-ogrod-zimowy-zima.png"
            alt="Ogród zimowy zimą"
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
                Zobacz ogród zimowy
                <span className="block text-[#dfbd78]">
                  w różnych aranżacjach.
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-[#f6f1e7]/65 sm:text-base">
                Zobacz przykładowe wizualizacje i sprawdź, jak różne warianty
                konstrukcji mogą zmienić przestrzeń przy domu.
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
                O ogrodach zimowych MoonGlass.
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
              Skonfiguruj swój
              <span className="block text-[#dfbd78]">
                ogród zimowy.
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

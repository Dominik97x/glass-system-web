import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Oferta",
  description:
    "Ogrody zimowe i zadaszenia tarasów MoonGlass. Aluminiowe konstrukcje wykonywane na wymiar z możliwością dopasowania dachu, przeszkleń i wyposażenia.",
};

const offerItems = [
  {
    number: "01",
    eyebrow: "Całoroczna przestrzeń przy domu",
    title: "Ogrody zimowe",
    description:
      "Zabudowa tarasu pozwalająca stworzyć dodatkową, osłoniętą przestrzeń przy domu. Konstrukcję, przeszklenia i wyposażenie dopasowujemy do wymiarów oraz sposobu użytkowania.",
    image: "/images/glass-system/product-winter-garden-day.png",
    points: [
      "Aluminiowa konstrukcja na wymiar",
      "Przesuwne ściany szklane",
      "Szkło lub poliwęglan w dachu",
      "Rolety ZIP, markiza i oświetlenie",
    ],
  },
  {
    number: "02",
    eyebrow: "Ochrona i komfort na tarasie",
    title: "Zadaszenia tarasowe",
    description:
      "Nowoczesne zadaszenie chroniące taras przed deszczem i nadmiernym nasłonecznieniem. Projekt powstaje pod konkretny budynek, wymiary i wybrany wariant wykończenia.",
    image: "/images/glass-system/product-terrace-roof-sunset.png",
    points: [
      "Konstrukcja aluminiowa",
      "Pokrycie szklane lub poliwęglanowe",
      "Trzy kolory konstrukcji",
      "Możliwość późniejszej rozbudowy",
    ],
  },
] as const;

const options = [
  {
    number: "01",
    title: "Pokrycie dachu",
    description:
      "Szkło oraz warianty poliwęglanu pozwalają dobrać ilość światła, wygląd i charakter całej konstrukcji.",
  },
  {
    number: "02",
    title: "Zabudowa szklana",
    description:
      "Przesuwne tafle pozwalają osłonić przestrzeń od wiatru i deszczu, a jednocześnie zachować jej lekki charakter.",
  },
  {
    number: "03",
    title: "Komfort i dodatki",
    description:
      "Rolety ZIP, markiza oraz oświetlenie LED zwiększają komfort korzystania z tarasu o różnych porach dnia.",
  },
  {
    number: "04",
    title: "Kolor konstrukcji",
    description:
      "Antracyt, brąz lub biel pozwalają dopasować aluminiową konstrukcję do elewacji, stolarki i stylu domu.",
  },
] as const;

export default function OfertaPage() {
  return (
    <>
      <main>
        {/* HERO */}
        <section className="relative min-h-[620px] overflow-hidden bg-[#031d18] text-[#f6f1e7] sm:min-h-[680px]">
          <Image
            src="/images/glass-system/hero-winter-garden-evening.png"
            alt="Ogród zimowy MoonGlass"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,29,24,0.95)_0%,rgba(3,29,24,0.78)_42%,rgba(3,29,24,0.28)_78%,rgba(3,29,24,0.12)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/70 via-transparent to-[#031d18]/25" />

          <SiteHeader activePage="oferta" />

          <div className="relative z-10 mx-auto flex min-h-[620px] max-w-7xl items-center px-6 pb-16 pt-36 sm:min-h-[680px] sm:px-8 lg:px-12">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="h-px w-11 bg-[#c79a46]" />

                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
                  Oferta MoonGlass
                </p>
              </div>

              <h1 className="mt-6 max-w-4xl font-serif text-5xl font-medium leading-[0.96] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
                Rozwiązania stworzone
                <span className="block text-[#dfbd78]">
                  wokół Twojego domu.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-sm leading-7 text-[#f6f1e7]/70 sm:text-base sm:leading-8">
                Projektujemy aluminiowo-szklane konstrukcje na wymiar.
                Od lekkiego zadaszenia tarasu po pełną zabudowę,
                która tworzy dodatkową przestrzeń przy domu.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/kalkulator"
                  className="bg-[#c79a46] px-8 py-4 text-center text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#031d18] transition hover:bg-[#dfbd78]"
                >
                  Skonfiguruj projekt
                </Link>

                <Link
                  href="#oferta"
                  className="border border-[#f6f1e7]/35 px-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:border-[#c79a46] hover:text-[#dfbd78]"
                >
                  Zobacz rozwiązania
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUKTY */}
        <section
          id="oferta"
          className="bg-[#f6f1e7] px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 grid gap-8 lg:grid-cols-[0.62fr_0.38fr] lg:items-end">
              <div>
                <div className="flex items-center gap-4">
                  <span className="h-px w-10 bg-[#c79a46]" />

                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9a722e]">
                    Nasza oferta
                  </p>
                </div>

                <h2 className="mt-5 max-w-3xl font-serif text-4xl font-medium leading-[1.02] text-[#062c25] sm:text-5xl lg:text-6xl">
                  Wybierz punkt wyjścia
                  <span className="block text-[#9a722e]">
                    dla swojej przestrzeni.
                  </span>
                </h2>
              </div>

              <p className="max-w-lg text-sm leading-7 text-[#202421]/65 sm:text-base lg:justify-self-end">
                Każda konstrukcja powstaje na wymiar. Podstawowy typ
                rozwiązania jest dopiero początkiem — później dobieramy
                dach, przeszklenia, kolor i wyposażenie.
              </p>
            </div>

            <div className="space-y-6">
              {offerItems.map((item, index) => (
                <article
                  key={item.title}
                  className="grid overflow-hidden bg-[#031d18] lg:min-h-[620px] lg:grid-cols-2"
                >
                  <div
                    className={`relative min-h-[440px] ${
                      index % 2 === 1 ? "lg:order-2" : ""
                    }`}
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/65 via-transparent to-transparent" />

                    <span className="absolute left-6 top-6 font-serif text-4xl text-[#dfbd78] sm:left-8 sm:top-8">
                      {item.number}
                    </span>
                  </div>

                  <div
                    className={`flex items-center px-6 py-12 text-[#f6f1e7] sm:px-10 lg:px-14 ${
                      index % 2 === 1 ? "lg:order-1" : ""
                    }`}
                  >
                    <div className="max-w-xl">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#dfbd78] sm:text-[11px]">
                        {item.eyebrow}
                      </p>

                      <h3 className="mt-4 font-serif text-4xl font-medium leading-tight sm:text-5xl">
                        {item.title}
                      </h3>

                      <p className="mt-6 text-sm leading-7 text-[#f6f1e7]/65 sm:text-base">
                        {item.description}
                      </p>

                      <div className="mt-8 border-t border-[#f6f1e7]/15 pt-6">
                        {item.points.map((point) => (
                          <div
                            key={point}
                            className="flex items-center gap-4 border-b border-[#f6f1e7]/10 py-3 text-sm text-[#f6f1e7]/70"
                          >
                            <span className="text-[#c79a46]">◆</span>
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>

                      <Link
                        href="/kalkulator"
                        className="mt-8 inline-flex items-center gap-4 border-b border-[#c79a46]/70 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] transition hover:text-[#dfbd78]"
                      >
                        Skonfiguruj
                        <span className="text-[#c79a46]">→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* MOŻLIWOŚCI */}
        <section className="bg-[#062c25] px-6 py-20 text-[#f6f1e7] sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.38fr_0.62fr] lg:gap-20">
              <div>
                <div className="flex items-center gap-4">
                  <span className="h-px w-10 bg-[#c79a46]" />

                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
                    Dopasuj projekt
                  </p>
                </div>

                <h2 className="mt-6 font-serif text-4xl font-medium leading-[1.02] sm:text-5xl lg:text-6xl">
                  Jedna konstrukcja,
                  <span className="block text-[#dfbd78]">
                    wiele możliwości.
                  </span>
                </h2>

                <p className="mt-7 max-w-lg text-sm leading-7 text-[#f6f1e7]/60 sm:text-base">
                  Wygląd i funkcjonalność zabudowy możesz dopasować
                  do własnych potrzeb już na etapie konfiguracji.
                </p>
              </div>

              <div className="grid border-t border-[#f6f1e7]/15 sm:grid-cols-2">
                {options.map((option, index) => (
                  <article
                    key={option.title}
                    className={`border-b border-[#f6f1e7]/15 py-8 sm:px-8 lg:py-10 ${
                      index % 2 === 0 ? "sm:border-r" : ""
                    }`}
                  >
                    <span className="font-serif text-3xl text-[#c79a46]">
                      {option.number}
                    </span>

                    <h3 className="mt-5 font-serif text-2xl font-medium sm:text-3xl">
                      {option.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[#f6f1e7]/60">
                      {option.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#f6f1e7] px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9a722e]">
              Zacznij swój projekt
            </p>

            <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.02] text-[#062c25] sm:text-5xl lg:text-6xl">
              Masz już pomysł?
              <span className="block text-[#9a722e]">
                Sprawdź orientacyjną cenę.
              </span>
            </h2>

            <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-[#202421]/60 sm:text-base">
              Wybierz podstawowe parametry konstrukcji w kalkulatorze.
              Po zakończeniu konfiguracji możesz przesłać gotowe zapytanie
              bezpośrednio do doradcy MoonGlass.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/kalkulator"
                className="bg-[#062c25] px-8 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:bg-[#0b3a31]"
              >
                Uruchom kalkulator
              </Link>

              <Link
                href="/kontakt"
                className="border border-[#062c25]/30 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#062c25] transition hover:border-[#9a722e] hover:text-[#9a722e]"
              >
                Skontaktuj się z nami
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
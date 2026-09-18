import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Inspiracje – ogrody zimowe i zadaszenia tarasów",
  description:
    "Inspiracje MoonGlass — ogrody zimowe, zadaszenia tarasów i zabudowy szklane dopasowane do nowoczesnych domów.",
  alternates: {
    canonical: "/realizacje",
  },
};

const inspirations = [
  {
    number: "01",
    title: "Zadaszenie tarasu o zachodzie",
    subtitle: "Strefa relaksu przy domu",
    image:
      "/images/glass-system/inspiracje/inspiracja-pergola-zachod-slonca.png",
    size: "large",
  },
  {
    number: "02",
    title: "Ogród zimowy otwarty na ogród",
    subtitle: "Całoroczna przestrzeń wśród zieleni",
    image:
      "/images/glass-system/inspiracje/inspiracja-przeszklony-ogrod-zimowy.png",
    size: "small",
  },
  {
    number: "03",
    title: "Zadaszenie tarasu z jadalnią",
    subtitle: "Jadalnia na świeżym powietrzu",
    image:
      "/images/glass-system/inspiracje/inspiracja-zadaszenie-tarasu-jadalnia.png",
    size: "small",
  },
  {
    number: "04",
    title: "Ogród zimowy wieczorem",
    subtitle: "Światło i komfort po zmroku",
    image:
      "/images/glass-system/inspiracje/inspiracja-oranzeria-zmierzch.png",
    size: "large",
  },
  {
    number: "05",
    title: "Ogród zimowy zimą",
    subtitle: "Przestrzeń na każdą porę roku",
    image:
      "/images/glass-system/inspiracje/inspiracja-ogrod-zimowy-zima.png",
    size: "wide",
  },
] as const;

export default function RealizacjePage() {
  return (
    <>
      <main>
        {/* HERO */}
        <section className="relative min-h-[760px] overflow-hidden bg-[#031d18] text-[#f6f1e7] lg:min-h-screen">
          <Image
            src="/images/glass-system/hero-moonglass-day-v2.png"
            alt="Inspiracje MoonGlass"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,29,24,0.76)_0%,rgba(3,29,24,0.52)_35%,rgba(3,29,24,0.16)_70%,rgba(3,29,24,0.04)_100%)]" />

          <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/45 via-transparent to-[#031d18]/10" />

          <SiteHeader activePage="realizacje" />

          <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-center px-6 pb-20 pt-36 sm:px-8 lg:min-h-screen lg:px-12">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="h-px w-11 bg-[#c79a46]" />

                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
                  Inspiracje MoonGlass
                </p>
              </div>

              <h1 className="mt-6 max-w-4xl font-serif text-5xl font-medium leading-[0.96] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
                Zobacz przestrzeń
                <span className="block text-[#dfbd78]">
                  w różnych odsłonach.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-sm leading-7 text-[#f6f1e7]/70 sm:text-base sm:leading-8">
                Każdy dom i taras są inne. Zobacz przykładowe aranżacje
                ogrodów zimowych, zadaszeń i zabudów szklanych, które
                mogą stać się punktem wyjścia do Twojego projektu.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#inspiracje"
                  className="bg-[#c79a46] px-8 py-4 text-center text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#031d18] transition hover:bg-[#dfbd78]"
                >
                  Zobacz inspiracje
                </Link>

                <Link
                  href="/kalkulator"
                  className="border border-[#f6f1e7]/35 px-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:border-[#c79a46] hover:text-[#dfbd78]"
                >
                  Wyceń projekt
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* WPROWADZENIE */}
        <section className="bg-[#f6f1e7] px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.62fr_0.38fr] lg:items-end">
              <div>
                <div className="flex items-center gap-4">
                  <span className="h-px w-10 bg-[#c79a46]" />

                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9a722e]">
                    Architektura i światło
                  </p>
                </div>

                <h2 className="mt-5 max-w-3xl font-serif text-4xl font-medium leading-[1.02] text-[#062c25] sm:text-5xl lg:text-6xl">
                  Dopasowana do domu.
                  <span className="block text-[#9a722e]">
                    Zaprojektowana dla Ciebie.
                  </span>
                </h2>
              </div>

              <p className="max-w-lg text-sm leading-7 text-[#202421]/65 sm:text-base lg:justify-self-end">
                Kolor konstrukcji, rodzaj dachu, przeszklenia i dodatki
                wpływają nie tylko na funkcjonalność, ale również na charakter
                całej przestrzeni.
              </p>
            </div>
          </div>
        </section>

        {/* GALERIA */}
        <section
          id="inspiracje"
          className="bg-[#031d18] px-6 py-20 text-[#f6f1e7] sm:px-8 sm:py-24 lg:px-12 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 lg:grid-cols-12">
              {inspirations.map((item) => {
                const layout =
                  item.size === "large"
                    ? "lg:col-span-7"
                    : item.size === "wide"
                      ? "lg:col-span-12"
                      : "lg:col-span-5";

                const height =
                  item.size === "wide"
                    ? "min-h-[440px] sm:min-h-[560px]"
                    : "min-h-[430px] sm:min-h-[520px]";

                return (
                  <article
                    key={item.number}
                    className={`group relative overflow-hidden bg-[#062c25] ${layout} ${height}`}
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes={
                        item.size === "wide"
                          ? "100vw"
                          : item.size === "large"
                            ? "(min-width: 1024px) 58vw, 100vw"
                            : "(min-width: 1024px) 42vw, 100vw"
                      }
                      className="object-cover transition duration-1000 ease-out group-hover:scale-[1.04]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/95 via-[#031d18]/20 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-9">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="font-serif text-3xl text-[#dfbd78]">
                          {item.number}
                        </span>

                        <span className="h-px w-9 bg-[#c79a46]/70" />
                      </div>

                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dfbd78]">
                        {item.subtitle}
                      </p>

                      <h3 className="mt-3 max-w-2xl font-serif text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl">
                        {item.title}
                      </h3>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col gap-5 border-t border-[#f6f1e7]/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-7 text-[#f6f1e7]/55">
                Prezentowane obrazy pokazują przykładowe możliwości aranżacji.
                Finalny projekt przygotowujemy pod konkretny budynek, wymiary
                i wybrane wyposażenie.
              </p>

              <Link
                href="/kalkulator"
                className="inline-flex shrink-0 items-center gap-3 text-[11px] font-bold uppercase tracking-[0.15em] transition hover:text-[#dfbd78]"
              >
                Stwórz swoją konfigurację
                <span className="text-[#c79a46]">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#f6f1e7] px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9a722e]">
              Twój projekt
            </p>

            <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.02] text-[#062c25] sm:text-5xl lg:text-6xl">
              Podoba Ci się ten kierunek?
              <span className="block text-[#9a722e]">
                Zacznij od własnej konfiguracji.
              </span>
            </h2>

            <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-[#202421]/60 sm:text-base">
              Określ podstawowe parametry konstrukcji i sprawdź orientacyjną
              cenę. Na kolejnym etapie doradca pomoże dopracować rozwiązanie.
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
                Porozmawiaj z nami
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

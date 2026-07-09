import Image from "next/image";
import Link from "next/link";

import { Calculator } from "@/components/calculator/Calculator";

const images = {
  hero: "/images/glass-system/hero-winter-garden-evening.png",
  terraceRoof: "/images/glass-system/product-terrace-roof-sunset.png",
  winterGarden: "/images/glass-system/product-winter-garden-day.png",
} as const;

const highlights = [
  "wycena orientacyjna brutto",
  "konfiguracja zapisywana w zapytaniu",
  "formularz połączony z bazą leadów",
];

const steps = [
  {
    title: "Wybierz wymiary",
    description: "Określ szerokość i długość konstrukcji.",
  },
  {
    title: "Dobierz opcje",
    description: "Wybierz dach, ściany, ZIP-y, markizę, LED i akcesoria.",
  },
  {
    title: "Wyślij zapytanie",
    description: "Doradca otrzyma konfigurację, dane kontaktowe i wycenę.",
  },
];

export default function KalkulatorPage() {
  return (
    <main className="min-h-screen bg-[#f4efe6] text-neutral-950">
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <Image
          src={images.hero}
          alt="Nowoczesny ogród zimowy Glass System"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/86 via-black/58 to-black/14" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/74 via-transparent to-black/40" />

        <header className="relative z-20">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 sm:px-8 lg:px-12">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 text-sm font-black text-neutral-950 shadow-xl shadow-emerald-500/25">
                GS
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.32em] text-emerald-300">
                  GLASS SYSTEM
                </p>
                <p className="text-xs text-white/65">
                  Kalkulator wyceny online
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-semibold text-white/80 lg:flex">
              <Link href="/" className="transition hover:text-white">
                Start
              </Link>
              <Link href="/oferta" className="transition hover:text-white">
                Produkty
              </Link>
              <Link href="/realizacje" className="transition hover:text-white">
                Inspiracje
              </Link>
              <Link href="/kontakt" className="transition hover:text-white">
                Kontakt
              </Link>
            </nav>

            <Link
              href="#kalkulator"
              className="hidden border border-white/55 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white backdrop-blur transition hover:bg-emerald-400 hover:text-neutral-950 md:inline-flex"
            >
              Przejdź do wyceny
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-20 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:pb-28 lg:pt-28">
          <div className="flex flex-col justify-end">
            <p className="mb-5 inline-flex w-fit border-l-4 border-emerald-400 bg-black/28 px-4 py-2 text-xs font-bold uppercase tracking-[0.32em] text-emerald-200 backdrop-blur">
              Wycena konstrukcji online
            </p>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Skonfiguruj ogród zimowy lub zadaszenie tarasu.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/78">
              Wybierz parametry konstrukcji, zobacz poglądową wizualizację,
              sprawdź cenę orientacyjną i wyślij zapytanie z kompletną
              konfiguracją.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="#kalkulator"
                className="bg-emerald-400 px-8 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-neutral-950 shadow-2xl shadow-emerald-500/25 transition hover:bg-emerald-300"
              >
                Rozpocznij konfigurację
              </Link>
              <Link
                href="/"
                className="border border-white/55 bg-black/20 px-8 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-white backdrop-blur transition hover:bg-white hover:text-neutral-950"
              >
                Wróć na stronę główną
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -left-8 top-10 z-10 rounded-none border border-white/20 bg-black/36 p-6 text-white shadow-2xl backdrop-blur-md">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
                Demo konfiguracji
              </p>
              <p className="mt-3 text-4xl font-black">35 419 zł</p>
              <p className="mt-2 max-w-60 text-sm leading-6 text-white/68">
                Przykładowa wycena ogrodu zimowego 300 x 306 cm z dodatkami.
              </p>
            </div>

            <div className="relative ml-auto h-[520px] max-w-xl overflow-hidden rounded-[2.5rem] border border-white/20 shadow-2xl shadow-black/35">
              <Image
                src={images.terraceRoof}
                alt="Zadaszenie tarasu"
                fill
                sizes="520px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/8 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-300">
                  Podgląd projektu
                </p>
                <h2 className="mt-3 max-w-sm text-4xl font-semibold leading-tight">
                  Wycena dopasowana do wybranej konfiguracji.
                </h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800">
                {index + 1}
              </div>
              <h2 className="mt-8 text-2xl font-semibold tracking-tight">
                {step.title}
              </h2>
              <p className="mt-3 leading-7 text-neutral-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="kalkulator"
        className="bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_32%),linear-gradient(180deg,#f4efe6_0%,#f8f5ef_100%)] px-2 py-8 sm:px-4 lg:px-5"
      >
        <div className="mx-auto max-w-[1880px]">
          <Calculator />
        </div>
      </section>

      <section className="relative overflow-hidden bg-neutral-950 px-6 py-20 text-white sm:px-8 lg:px-12">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <Image
            src={images.winterGarden}
            alt="Ogród zimowy przy domu"
            fill
            sizes="50vw"
            className="object-cover opacity-72"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/62 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-300">
              Cena orientacyjna
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Finalna oferta wymaga potwierdzenia zakresu i warunków montażu.
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/70">
              Kalkulator pomaga przygotować zapytanie i określić budżet. Po
              wysłaniu formularza doradca otrzymuje pełną konfigurację, pozycje
              oferty i dane kontaktowe.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
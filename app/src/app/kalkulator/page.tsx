import Link from "next/link";
import { Calculator } from "@/components/calculator/Calculator";

const highlights = [
  "wycena orientacyjna brutto",
  "konfiguracja zapisywana w zapytaniu",
  "kontakt z doradcą po wysłaniu formularza",
];

export default function KalkulatorPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_32%),linear-gradient(135deg,_#020617_0%,_#111827_52%,_#0f172a_100%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
          <header className="flex items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-sm font-black text-neutral-950">
                GS
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.26em] text-emerald-300">
                  GLASS SYSTEM
                </p>
                <p className="text-xs text-white/50">
                  Kalkulator ogrodów zimowych
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
              <Link href="/" className="transition hover:text-white">
                Strona główna
              </Link>
              <Link href="/oferta" className="transition hover:text-white">
                Oferta
              </Link>
              <Link href="/kontakt" className="transition hover:text-white">
                Kontakt
              </Link>
            </nav>
          </header>

          <div className="grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div>
              <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-emerald-200 backdrop-blur">
                Konfigurator wyceny online
              </div>

              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl">
                Skonfiguruj ogród zimowy lub zadaszenie tarasu.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
                Wybierz wymiary, dach, ściany, rolety ZIP, markizę,
                oświetlenie i dodatki. Kalkulator przygotuje orientacyjną cenę
                oraz komplet informacji do zapytania.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/75"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
                Wycena wstępna
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                Cena wymaga potwierdzenia po kontakcie.
              </h2>
              <p className="mt-4 leading-7 text-white/65">
                Kalkulator pomaga szybko określić zakres i orientacyjny budżet.
                Finalna oferta może zależeć od pomiaru, warunków montażu,
                transportu i indywidualnych ustaleń.
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl bg-neutral-950/50 p-4">
                  <p className="text-sm text-white/50">Po wysłaniu</p>
                  <p className="mt-1 font-semibold">
                    zapytanie trafia do systemu obsługi leadów
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-950/50 p-4">
                  <p className="text-sm text-white/50">Dla doradcy</p>
                  <p className="mt-1 font-semibold">
                    zapisujemy konfigurację, pozycje oferty i dane kontaktowe
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-neutral-100 px-4 py-8 text-neutral-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <Calculator />
        </div>
      </section>
    </main>
  );
}
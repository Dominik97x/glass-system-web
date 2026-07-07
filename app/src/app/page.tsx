import Link from "next/link";

const products = [
  {
    title: "Ogrody zimowe",
    description:
      "Przestrzeń całoroczna przy domu — zadaszenie, ściany przesuwne, rolety ZIP i dodatki dopasowane do inwestycji.",
  },
  {
    title: "Zadaszenia tarasów",
    description:
      "Nowoczesne zadaszenia aluminiowe z poliwęglanem lub szkłem, projektowane pod konkretny wymiar tarasu.",
  },
  {
    title: "Systemy przesuwne",
    description:
      "Szklane ściany przesuwne, które osłaniają taras przed wiatrem i pozwalają korzystać z przestrzeni dłużej w sezonie.",
  },
];

const processSteps = [
  "Konfigurujesz produkt online",
  "Wysyłasz zapytanie z kalkulatora",
  "Doradca weryfikuje zakres i pomiar",
  "Otrzymujesz dopracowaną ofertę",
];

const benefits = [
  "Konstrukcje na wymiar",
  "Wycena orientacyjna online",
  "Możliwość rozbudowy o ZIP, LED, markizę i akcesoria",
  "Proces gotowy pod CRM i obsługę sprzedaży",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.26),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#111827_48%,_#0f172a_100%)]" />
        <div className="absolute left-1/2 top-24 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-8 sm:px-8 lg:px-12">
          <header className="flex items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-sm font-black text-neutral-950">
                GS
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.26em] text-emerald-300">
                  GLAS SYSTEM
                </p>
                <p className="text-xs text-white/50">
                  Ogrody zimowe i zadaszenia
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
              <Link href="/oferta" className="transition hover:text-white">
                Oferta
              </Link>
              <Link href="/realizacje" className="transition hover:text-white">
                Realizacje
              </Link>
              <Link href="/kontakt" className="transition hover:text-white">
                Kontakt
              </Link>
              <Link
                href="/kalkulator"
                className="rounded-full bg-white px-5 py-2.5 font-semibold text-neutral-950 transition hover:bg-emerald-200"
              >
                Kalkulator
              </Link>
            </nav>
          </header>

          <div className="grid items-center gap-12 py-12 lg:grid-cols-[1.04fr_0.96fr] lg:py-20">
            <div>
              <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-emerald-200 shadow-2xl shadow-emerald-950/30 backdrop-blur">
                Wstępna wycena ogrodu zimowego online
              </div>

              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Nowoczesne ogrody zimowe i zadaszenia tarasów na wymiar.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
                Skonfiguruj konstrukcję, wybierz ściany, dach, rolety ZIP,
                markizę i oświetlenie. Otrzymaj orientacyjną wycenę i wyślij
                zapytanie do doradcy.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/kalkulator"
                  className="rounded-full bg-emerald-400 px-7 py-4 text-center text-sm font-bold text-neutral-950 shadow-2xl shadow-emerald-500/25 transition hover:bg-emerald-300"
                >
                  Skonfiguruj i sprawdź cenę
                </Link>
                <Link
                  href="/oferta"
                  className="rounded-full border border-white/15 bg-white/5 px-7 py-4 text-center text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Zobacz ofertę
                </Link>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-8">
                <div>
                  <p className="text-2xl font-bold text-white">3</p>
                  <p className="mt-1 text-sm text-white/50">
                    główne typy produktów
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">5</p>
                  <p className="mt-1 text-sm text-white/50">
                    długości w kalkulatorze
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">online</p>
                  <p className="mt-1 text-sm text-white/50">
                    szybka wycena wstępna
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-neutral-950">
                <div className="h-72 bg-[linear-gradient(135deg,_rgba(16,185,129,0.20),_transparent_44%),linear-gradient(90deg,_rgba(255,255,255,0.14)_1px,_transparent_1px),linear-gradient(rgba(255,255,255,0.12)_1px,_transparent_1px)] bg-[size:auto,44px_44px,44px_44px] p-6">
                  <div className="flex h-full flex-col justify-end rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-6">
                    <p className="text-sm uppercase tracking-[0.22em] text-emerald-200">
                      Przykładowa konfiguracja
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold">
                      Ogród zimowy 300 x 306 cm
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
                      Ściany przesuwne, dach z poliwęglanu, roleta ZIP, markiza
                      i oświetlenie LED.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 p-6 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/[0.06] p-4">
                    <p className="text-sm text-white/50">Cena orientacyjna</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-300">
                      35 419 zł
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.06] p-4">
                    <p className="text-sm text-white/50">Status</p>
                    <p className="mt-2 text-lg font-semibold">
                      Gotowe do zapytania
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-neutral-950 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
              Oferta
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Rozwiązania dla tarasu, ogrodu i całorocznej przestrzeni przy domu.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.title}
                className="rounded-3xl border border-neutral-200 bg-neutral-50 p-7 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-8 h-40 rounded-2xl bg-gradient-to-br from-emerald-100 via-neutral-100 to-sky-100" />
                <h3 className="text-2xl font-semibold">{product.title}</h3>
                <p className="mt-4 leading-7 text-neutral-600">
                  {product.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-100 px-6 py-20 text-neutral-950 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
              Jak to działa
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Od konfiguracji online do dopracowanej oferty.
            </h2>
            <p className="mt-5 leading-8 text-neutral-600">
              Kalkulator daje szybką wycenę orientacyjną. Finalna oferta może
              zostać potwierdzona po kontakcie, analizie warunków technicznych i
              ewentualnym pomiarze.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {processSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-3xl border border-neutral-200 bg-white p-6"
              >
                <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <p className="text-xl font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-neutral-950 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-neutral-950 p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
              Dlaczego warto
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Wycena i obsługa zapytania są przygotowane pod realną pracę firmy.
            </h2>
            <p className="mt-5 leading-8 text-white/65">
              Formularz nie jest tylko prostym kontaktem. Zapytanie zawiera
              konfigurację, pozycje oferty i cenę, dzięki czemu handlowiec może
              szybciej przejść do rozmowy z klientem.
            </p>
          </div>

          <div className="grid gap-4">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-5"
              >
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <p className="font-semibold">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-950 px-6 py-20 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
              Kalkulator
            </p>
            <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">
              Sprawdź orientacyjną cenę i wyślij zapytanie do doradcy.
            </h2>
          </div>

          <Link
            href="/kalkulator"
            className="rounded-full bg-emerald-400 px-7 py-4 text-sm font-bold text-neutral-950 transition hover:bg-emerald-300"
          >
            Przejdź do kalkulatora
          </Link>
        </div>
      </section>
    </main>
  );
}
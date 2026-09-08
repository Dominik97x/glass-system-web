import Link from "next/link";

const footerNavigation = [
  { label: "Strona główna", href: "/" },
  { label: "Produkty", href: "/oferta" },
  { label: "Inspiracje", href: "/realizacje" },
  { label: "Wycena online", href: "/kalkulator" },
  { label: "Kontakt", href: "/kontakt" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#031d18] text-[#f6f1e7]">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="grid gap-14 border-b border-[#f6f1e7]/15 pb-14 lg:grid-cols-[1.15fr_0.55fr_0.65fr] lg:gap-20">
          {/* MARKA */}
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#c79a46]" />

              <p className="font-serif text-4xl font-semibold tracking-[0.01em] text-[#f6f1e7]">
                MoonGlass
              </p>
            </div>

            <p className="mt-1 pl-11 text-[9px] font-bold uppercase tracking-[0.22em] text-[#dfbd78] sm:text-[10px]">
              Ogrody zimowe · Zadaszenia · Carporty
            </p>

            <p className="mt-7 max-w-md text-sm leading-7 text-[#f6f1e7]/55">
              Projektujemy i wykonujemy nowoczesne ogrody zimowe,
              zadaszenia tarasów oraz zabudowy szklane dopasowane
              do architektury domu i potrzeb użytkowników.
            </p>

            <Link
              href="/kalkulator"
              className="mt-8 inline-flex bg-[#c79a46] px-7 py-4 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#031d18] transition hover:bg-[#dfbd78]"
            >
              Wyceń swój projekt
            </Link>
          </div>

          {/* NAWIGACJA */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#dfbd78]">
              Nawigacja
            </p>

            <nav className="mt-6 flex flex-col">
              {footerNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-[#f6f1e7]/10 py-3.5 text-sm text-[#f6f1e7]/65 transition hover:text-[#dfbd78]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* KONTAKT */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#dfbd78]">
              Kontakt
            </p>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#f6f1e7]/35">
                  Telefon
                </p>

                <a
                  href="tel:+48533850226"
                  className="mt-1 inline-block font-serif text-2xl text-[#f6f1e7] transition hover:text-[#dfbd78]"
                >
                  533 850 226
                </a>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#f6f1e7]/35">
                  E-mail
                </p>

                <a
                  href="mailto:biuro@moonglass.pl"
                  className="mt-1 inline-block text-sm text-[#f6f1e7]/75 transition hover:text-[#dfbd78]"
                >
                  biuro@moonglass.pl
                </a>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#f6f1e7]/35">
                  Obszar działania
                </p>

                <p className="mt-1 text-sm leading-6 text-[#f6f1e7]/65">
                  Realizacje na terenie całej Polski
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DOLNY PASEK */}
        <div className="flex flex-col gap-5 pt-7 text-[10px] text-[#f6f1e7]/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} MoonGlass. Wszelkie prawa zastrzeżone.
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/polityka-prywatnosci"
              className="transition hover:text-[#dfbd78]"
            >
              Polityka prywatności
            </Link>

            <span>moonglass.pl</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
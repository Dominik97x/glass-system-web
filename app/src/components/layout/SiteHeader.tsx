"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SiteHeaderProps = {
  activePage?: "start" | "oferta" | "realizacje" | "kalkulator" | "kontakt";
};

const navigation = [
  { label: "Start", href: "/", key: "start" },
  { label: "Oferta", href: "/oferta", key: "oferta" },
  { label: "Inspiracje", href: "/realizacje", key: "realizacje" },
  { label: "Wycena", href: "/kalkulator", key: "kalkulator" },
  { label: "Kontakt", href: "/kontakt", key: "kontakt" },
] as const;

export function SiteHeader({ activePage }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ctaHref = activePage === "kalkulator" ? "#kalkulator" : "/kalkulator";
  const ctaLabel =
    activePage === "kalkulator" ? "Przejdź do wyceny" : "Wyceń projekt";

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="absolute inset-x-0 top-0 z-40 border-b border-white/10 bg-[#031d18]/20 backdrop-blur-[3px]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-8 lg:px-12">
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="group flex min-w-0 items-center lg:justify-self-start"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="h-px w-7 shrink-0 bg-[#c79a46]" />

              <span className="truncate font-serif text-3xl font-semibold tracking-[0.02em] text-[#f6f1e7] sm:text-4xl">
                MoonGlass
              </span>
            </div>

            <p className="mt-0.5 pl-10 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#dfbd78] sm:text-[10px] sm:tracking-[0.22em]">
              Ogrody zimowe · Zadaszenia tarasowe
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex lg:justify-self-center">
          {navigation.map((item) => {
            const active = activePage === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={[
                  "relative py-2 text-[13px] font-semibold transition",
                  active
                    ? "text-[#dfbd78]"
                    : "text-[#f6f1e7]/80 hover:text-[#dfbd78]",
                ].join(" ")}
              >
                {item.label}

                {active ? (
                  <span className="absolute inset-x-0 -bottom-0.5 h-px bg-[#c79a46]" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3 lg:justify-self-end">
          <Link
            href={ctaHref}
            className="hidden whitespace-nowrap border border-[#c79a46]/80 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:bg-[#c79a46] hover:text-[#031d18] md:inline-flex"
          >
            {ctaLabel}
          </Link>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="moonglass-mobile-menu"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] border border-[#c79a46]/60 bg-[#031d18]/40 lg:hidden"
          >
            <span
              className={[
                "h-px w-5 bg-[#f6f1e7] transition",
                mobileMenuOpen ? "translate-y-[6px] rotate-45" : "",
              ].join(" ")}
            />

            <span
              className={[
                "h-px w-5 bg-[#f6f1e7] transition",
                mobileMenuOpen ? "opacity-0" : "",
              ].join(" ")}
            />

            <span
              className={[
                "h-px w-5 bg-[#f6f1e7] transition",
                mobileMenuOpen ? "-translate-y-[6px] -rotate-45" : "",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div
          id="moonglass-mobile-menu"
          className="border-t border-[#c79a46]/20 bg-[#031d18]/98 px-6 py-5 shadow-2xl lg:hidden"
        >
          <nav className="mx-auto flex max-w-7xl flex-col">
            {navigation.map((item) => {
              const active = activePage === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={[
                    "border-b border-white/10 py-4 text-base font-medium transition",
                    active
                      ? "text-[#dfbd78]"
                      : "text-[#f6f1e7]/85 hover:text-[#dfbd78]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}

            <Link
              href={ctaHref}
              onClick={() => setMobileMenuOpen(false)}
              className="mt-6 bg-[#c79a46] px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-[#031d18] transition hover:bg-[#dfbd78]"
            >
              {ctaLabel}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

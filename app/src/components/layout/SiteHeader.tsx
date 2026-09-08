"use client";

import Link from "next/link";
import { useState } from "react";

type SiteHeaderProps = {
  activePage?: "start" | "oferta" | "realizacje" | "kalkulator" | "kontakt";
};

const navigation = [
  { label: "Start", href: "/", key: "start" },
  { label: "Produkty", href: "/oferta", key: "oferta" },
  { label: "Inspiracje", href: "/realizacje", key: "realizacje" },
  { label: "Wycena", href: "/kalkulator", key: "kalkulator" },
  { label: "Kontakt", href: "/kontakt", key: "kontakt" },
] as const;

export function SiteHeader({ activePage }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-40 border-b border-white/10 bg-[#031d18]/20 backdrop-blur-[3px]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="group flex items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#c79a46]" />

              <span className="font-serif text-3xl font-semibold tracking-[0.02em] text-[#f6f1e7] sm:text-4xl">
                MoonGlass
              </span>
            </div>

            <p className="mt-0.5 pl-10 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#dfbd78] sm:text-[10px]">
              Ogrody zimowe · Zadaszenia · Carporty
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navigation.map((item) => {
            const active = activePage === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative py-2 text-[13px] font-semibold transition ${
                  active
                    ? "text-[#dfbd78]"
                    : "text-[#f6f1e7]/80 hover:text-[#dfbd78]"
                }`}
              >
                {item.label}

                {active && (
                  <span className="absolute inset-x-0 -bottom-0.5 h-px bg-[#c79a46]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/kalkulator"
            className="hidden border border-[#c79a46]/80 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:bg-[#c79a46] hover:text-[#031d18] md:inline-flex"
          >
            Wyceń projekt
          </Link>

          <button
            type="button"
            aria-label={
              mobileMenuOpen ? "Zamknij menu" : "Otwórz menu"
            }
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] border border-[#c79a46]/60 bg-[#031d18]/40 lg:hidden"
          >
            <span
              className={`h-[1px] w-5 bg-[#f6f1e7] transition ${
                mobileMenuOpen
                  ? "translate-y-[6px] rotate-45"
                  : ""
              }`}
            />

            <span
              className={`h-[1px] w-5 bg-[#f6f1e7] transition ${
                mobileMenuOpen ? "opacity-0" : ""
              }`}
            />

            <span
              className={`h-[1px] w-5 bg-[#f6f1e7] transition ${
                mobileMenuOpen
                  ? "-translate-y-[6px] -rotate-45"
                  : ""
              }`}
            />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#c79a46]/20 bg-[#031d18]/98 px-6 py-5 shadow-2xl lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col">
            {navigation.map((item) => {
              const active = activePage === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`border-b border-white/10 py-4 text-base font-medium ${
                    active
                      ? "text-[#dfbd78]"
                      : "text-[#f6f1e7]/85"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <Link
              href="/kalkulator"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-6 bg-[#c79a46] px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-[#031d18]"
            >
              Wyceń projekt
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
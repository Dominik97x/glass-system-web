import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function NotFound() {
  return (
    <>
      <main className="min-h-screen bg-[#031d18] text-[#f6f1e7]">
        <section className="relative flex min-h-[760px] items-center overflow-hidden">
          <SiteHeader />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(199,154,70,0.14),transparent_40%)]" />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-36 sm:px-8 lg:px-12">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4">
                <span className="h-px w-11 bg-[#c79a46]" />

                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
                  Błąd 404
                </p>
              </div>

              <p className="mt-8 font-serif text-[110px] leading-none text-[#c79a46]/20 sm:text-[150px]">
                404
              </p>

              <h1 className="-mt-5 font-serif text-5xl font-medium leading-[0.96] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
                Tej strony
                <span className="block text-[#dfbd78]">
                  tutaj nie ma.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-sm leading-7 text-[#f6f1e7]/65 sm:text-base">
                Adres mógł się zmienić albo strona została usunięta.
                Wróć na stronę główną lub przejdź do kalkulatora MoonGlass.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="bg-[#c79a46] px-8 py-4 text-center text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#031d18] transition hover:bg-[#dfbd78]"
                >
                  Strona główna
                </Link>

                <Link
                  href="/kalkulator"
                  className="border border-[#f6f1e7]/35 px-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:border-[#c79a46] hover:text-[#dfbd78]"
                >
                  Uruchom kalkulator
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
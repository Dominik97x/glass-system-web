export default function OfertaPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-300">
          MoonGlass
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
          Nasza oferta
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
          Projektujemy i wykonujemy nowoczesne konstrukcje aluminiowo-szklane
          dopasowane do budynku, tarasu oraz potrzeb użytkowników.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <article className="border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
              Całoroczna przestrzeń
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Ogrody zimowe
            </h2>

            <p className="mt-4 leading-7 text-white/65">
              Zabudowy tarasów pozwalające powiększyć przestrzeń użytkową
              domu i korzystać z niej niezależnie od pogody.
            </p>
          </article>

          <article className="border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
              Ochrona tarasu
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Zadaszenia tarasowe
            </h2>

            <p className="mt-4 leading-7 text-white/65">
              Konstrukcje aluminiowe z pokryciem poliwęglanowym lub szklanym,
              chroniące taras przed deszczem i nadmiernym nasłonecznieniem.
            </p>
          </article>
        </div>
      </div>
    </main>
  );
}

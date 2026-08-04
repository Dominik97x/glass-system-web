export default function KontaktPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-300">
          MoonGlass
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
          Kontakt
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
          Skontaktuj się z nami, aby omówić ogród zimowy, zadaszenie tarasu
          lub przygotowaną w kalkulatorze konfigurację.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <section className="border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/50">Telefon</p>
            <p className="mt-2 text-xl font-semibold">
              Numer telefonu zostanie uzupełniony
            </p>
          </section>

          <section className="border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/50">E-mail</p>
            <p className="mt-2 text-xl font-semibold">
              Adres e-mail zostanie uzupełniony
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

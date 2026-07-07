import Image from "next/image";
import Link from "next/link";

const images = {
  hero: "/images/glass-system/hero-winter-garden-evening.png",
  winterGarden: "/images/glass-system/product-winter-garden-day.png",
  terraceRoof: "/images/glass-system/product-terrace-roof-sunset.png",
  evening: "/images/glass-system/parallax-evening-led.png",
  gallery: "/images/glass-system/gallery-glass-enclosure-day.png",
} as const;

const productCards = [
  {
    title: "Ogród zimowy",
    eyebrow: "Całoroczna przestrzeń przy domu",
    description:
      "Zabudowa tarasu ze szkłem, zadaszeniem i dodatkami, która pozwala korzystać z przestrzeni niezależnie od pogody.",
    image: images.winterGarden,
    href: "/kalkulator",
  },
  {
    title: "Zadaszenie tarasu",
    eyebrow: "Nowoczesna ochrona tarasu",
    description:
      "Aluminiowa konstrukcja z dachem szklanym lub poliwęglanowym, projektowana pod wymiar i styl budynku.",
    image: images.terraceRoof,
    href: "/kalkulator",
  },
];

const advantages = [
  {
    value: "01",
    title: "Projekt na wymiar",
    description:
      "Dobieramy wymiary, dach, ściany i dodatki do konkretnego tarasu oraz sposobu użytkowania przestrzeni.",
  },
  {
    value: "02",
    title: "Wycena online",
    description:
      "Klient może szybko sprawdzić orientacyjny koszt i wysłać zapytanie z pełną konfiguracją.",
  },
  {
    value: "03",
    title: "Dopracowana oferta",
    description:
      "Po kontakcie można potwierdzić zakres, pomiar, montaż i finalną cenę realizacji.",
  },
];

const processSteps = [
  {
    title: "Wybierz typ konstrukcji",
    description:
      "Określ, czy interesuje Cię ogród zimowy, zadaszenie tarasu czy zabudowa szklana.",
  },
  {
    title: "Dobierz dach, ściany i dodatki",
    description:
      "Wybierz wariant dachu, przeszklenia, rolety ZIP, markizę, LED i akcesoria.",
  },
  {
    title: "Sprawdź cenę orientacyjną",
    description:
      "Kalkulator pokaże wstępny koszt brutto na podstawie wybranej konfiguracji.",
  },
  {
    title: "Wyślij zapytanie do doradcy",
    description:
      "Po wysłaniu formularza konfiguracja trafia do systemu obsługi zapytań.",
  },
];

const galleryItems = [
  {
    title: "Ogród zimowy z oświetleniem",
    image: images.hero,
  },
  {
    title: "Zadaszenie tarasu przy domu",
    image: images.terraceRoof,
  },
  {
    title: "Zabudowa szklana w ogrodzie",
    image: images.winterGarden,
  },
  {
    title: "Wieczorna przestrzeń tarasowa",
    image: images.evening,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4efe6] text-neutral-950">
      <section className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
        <Image
          src={images.hero}
          alt="Nowoczesny ogród zimowy Glass System przy domu"
          fill
          priority
          sizes="100vw"
          className="object-cover animate-[glassHeroZoom_22s_ease-in-out_infinite_alternate]"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/34 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/64 via-transparent to-black/34" />

        <header className="absolute left-0 right-0 top-0 z-20">
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
                  Ogrody zimowe i zadaszenia
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-semibold text-white/80 lg:flex">
              <Link href="/" className="text-emerald-300">
                Start
              </Link>
              <Link href="/oferta" className="transition hover:text-white">
                Produkty
              </Link>
              <Link href="/realizacje" className="transition hover:text-white">
                Inspiracje
              </Link>
              <Link href="/kalkulator" className="transition hover:text-white">
                Wycena
              </Link>
              <Link href="/kontakt" className="transition hover:text-white">
                Kontakt
              </Link>
            </nav>

            <Link
              href="/kalkulator"
              className="hidden border border-white/55 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white backdrop-blur transition hover:bg-emerald-400 hover:text-neutral-950 md:inline-flex"
            >
              Wycena projektu
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-end px-6 pb-24 pt-32 sm:px-8 lg:px-12">
          <div className="grid w-full gap-12 lg:grid-cols-[0.82fr_0.18fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex border-l-4 border-emerald-400 bg-black/28 px-4 py-2 text-xs font-bold uppercase tracking-[0.32em] text-emerald-200 backdrop-blur">
                Zabudowy tarasowe na wymiar
              </p>

              <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Ogród zimowy, który zmienia taras w przestrzeń do życia.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/78">
                Nowoczesne zadaszenia, zabudowy szklane i ogrody zimowe.
                Skonfiguruj projekt online, sprawdź cenę orientacyjną i wyślij
                zapytanie do doradcy.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/kalkulator"
                  className="bg-emerald-400 px-8 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-neutral-950 shadow-2xl shadow-emerald-500/25 transition hover:bg-emerald-300"
                >
                  Wyceń projekt
                </Link>
                <Link
                  href="#produkty"
                  className="border border-white/55 bg-black/20 px-8 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-white backdrop-blur transition hover:bg-white hover:text-neutral-950"
                >
                  Zobacz produkty
                </Link>
              </div>
            </div>

            <div className="hidden justify-end lg:flex">
              <div className="animate-[glassFloat_6s_ease-in-out_infinite] border border-white/20 bg-black/36 p-5 text-right backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
                  Wycena online
                </p>
                <p className="mt-2 text-3xl font-black">od kilku kliknięć</p>
                <p className="mt-2 max-w-52 text-sm leading-6 text-white/68">
                  Wymiary, dach, ściany, rolety ZIP, markiza i oświetlenie w
                  jednym zapytaniu.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-3 text-xs font-bold uppercase tracking-[0.26em] text-white/62 md:flex">
          Przewiń
          <div className="h-12 w-px origin-top bg-white/60 animate-[glassLinePulse_2.2s_ease-in-out_infinite]" />
        </div>
      </section>

      <section id="produkty" className="bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1500px] gap-6 lg:grid-cols-2">
          {productCards.map((product) => (
            <Link
              key={product.title}
              href={product.href}
              className="group relative min-h-[430px] overflow-hidden"
            >
              <Image
                src={product.image}
                alt={product.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/4 to-white/70" />
              <div className="absolute bottom-10 right-8 max-w-md bg-white/86 p-8 text-right shadow-2xl backdrop-blur-md transition duration-500 group-hover:-translate-y-2 group-hover:bg-white">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                  {product.eyebrow}
                </p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                  {product.title}
                </h2>
                <p className="mt-4 leading-7 text-neutral-600">
                  {product.description}
                </p>
                <span className="mt-6 inline-flex bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-[0.08em] text-white">
                  Wyceń produkt →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="relative min-h-[720px] bg-cover bg-center bg-fixed px-6 py-24 text-white sm:px-8 lg:px-12"
        style={{ backgroundImage: `url(${images.evening})` }}
      >
        <div className="absolute inset-0 bg-black/62" />

        <div className="relative mx-auto flex min-h-[520px] max-w-7xl flex-col justify-center">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-300">
              Jakość, komfort i wygląd
            </p>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
              Dlaczego zabudowa tarasu jest dobrym rozwiązaniem?
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-white/72">
              Dobrze zaprojektowana konstrukcja osłania taras, zwiększa komfort
              codziennego użytkowania i tworzy reprezentacyjną przestrzeń przy
              domu.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {advantages.map((advantage) => (
              <article
                key={advantage.title}
                className="border border-white/16 bg-black/28 p-7 backdrop-blur-md"
              >
                <p className="text-5xl font-black text-white">
                  {advantage.value}
                </p>
                <h3 className="mt-8 text-2xl font-semibold text-emerald-300">
                  {advantage.title}
                </h3>
                <p className="mt-4 leading-7 text-white/72">
                  {advantage.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4efe6] px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-700">
              Wycena w trzech prostych krokach
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
              Kalkulator prowadzi klienta od pomysłu do zapytania.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-600">
              Zamiast zwykłego formularza kontaktowego klient wysyła pełną
              konfigurację: wymiary, dach, ściany, dodatki i cenę orientacyjną.
            </p>

            <Link
              href="/kalkulator"
              className="mt-9 inline-flex bg-neutral-950 px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-emerald-700"
            >
              Uruchom kalkulator
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {processSteps.map((step, index) => (
              <article
                key={step.title}
                className="group bg-white p-7 shadow-xl shadow-neutral-950/5 ring-1 ring-neutral-200 transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800 transition group-hover:bg-emerald-500 group-hover:text-neutral-950">
                  {index + 1}
                </div>
                <h3 className="mt-10 text-2xl font-semibold">{step.title}</h3>
                <p className="mt-4 leading-7 text-neutral-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-950 px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-300">
                Inspiracje
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
                Zobacz, jak może wyglądać gotowa przestrzeń przy domu.
              </h2>
            </div>

            <Link
              href="/kalkulator"
              className="inline-flex border border-white/40 px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-white hover:text-neutral-950"
            >
              Wyceń podobny projekt
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {galleryItems.map((item, index) => (
              <article
                key={item.title}
                className={`group relative min-h-[380px] overflow-hidden ${
                  index === 0 ? "lg:col-span-2 lg:row-span-2 lg:min-h-[776px]" : ""
                }`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/84 via-black/18 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <p className="text-sm text-white/50">0{index + 1}</p>
                  <h3 className="mt-2 text-2xl font-semibold">{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white px-6 py-24 sm:px-8 lg:px-12">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <Image
            src={images.gallery}
            alt="Nowoczesna zabudowa szklana"
            fill
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-700">
              Wycena online
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
              Masz taras do zabudowy? Sprawdź orientacyjny koszt.
            </h2>
            <p className="mt-6 text-lg leading-8 text-neutral-600">
              Kalkulator pomoże szybko określić zakres inwestycji. Po wysłaniu
              zapytania doradca może wrócić z dopracowaną ofertą.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/kalkulator"
                className="bg-emerald-500 px-8 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-neutral-950 transition hover:bg-emerald-400"
              >
                Wyceń projekt
              </Link>
              <Link
                href="/kontakt"
                className="border border-neutral-300 px-8 py-4 text-center text-sm font-black uppercase tracking-[0.08em] transition hover:border-neutral-950"
              >
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
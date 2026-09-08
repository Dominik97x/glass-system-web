import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
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
    <>
    <main className="min-h-screen bg-[#f4efe6] text-neutral-950">
<section className="relative min-h-[760px] overflow-hidden bg-[#031d18] text-white lg:min-h-screen">
  <Image
    src={images.hero}
    alt="Ogród zimowy MoonGlass przy domu"
    fill
    priority
    sizes="100vw"
    className="object-cover animate-[glassHeroZoom_22s_ease-in-out_infinite_alternate]"
  />

  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,29,24,0.92)_0%,rgba(3,29,24,0.72)_35%,rgba(3,29,24,0.28)_70%,rgba(3,29,24,0.12)_100%)]" />

  <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/75 via-transparent to-[#031d18]/20" />

  <SiteHeader activePage="start" />

  <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-center px-6 pb-20 pt-36 sm:px-8 lg:min-h-screen lg:px-12">
    <div className="max-w-4xl">
      <div className="mb-7 flex items-center gap-4">
        <span className="h-px w-12 bg-[#c79a46]" />

        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#dfbd78] sm:text-xs">
          Zabudowy tarasowe na wymiar
        </p>
      </div>

      <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[0.94] tracking-[-0.025em] text-[#f6f1e7] sm:text-6xl lg:text-7xl xl:text-8xl">
        Przestrzeń na każdą
        <span className="block text-[#dfbd78]">
          porę roku.
        </span>
      </h1>

      <p className="mt-7 max-w-2xl text-base leading-8 text-[#f6f1e7]/75 sm:text-lg">
        Ogrody zimowe, zadaszenia tarasów i zabudowy szklane
        projektowane na wymiar. Komfortowa przestrzeń dopasowana
        do Twojego domu i stylu życia.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/kalkulator"
          className="bg-[#c79a46] px-8 py-4 text-center text-xs font-extrabold uppercase tracking-[0.14em] text-[#031d18] transition hover:bg-[#dfbd78]"
        >
          Skonfiguruj projekt
        </Link>

        <Link
          href="#produkty"
          className="border border-[#f6f1e7]/45 bg-[#031d18]/20 px-8 py-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-[#f6f1e7] backdrop-blur-sm transition hover:border-[#c79a46] hover:text-[#dfbd78]"
        >
          Poznaj ofertę
        </Link>
      </div>

      <div className="mt-14 flex flex-wrap gap-x-8 gap-y-4 border-t border-[#f6f1e7]/15 pt-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#f6f1e7]/65 sm:text-[11px]">
        <span>Aluminiowe konstrukcje</span>
        <span className="text-[#c79a46]">◆</span>
        <span>Realizacja na wymiar</span>
        <span className="text-[#c79a46]">◆</span>
        <span>Cała Polska</span>
      </div>
    </div>
  </div>

  <div className="absolute bottom-8 right-8 z-20 hidden items-center gap-4 text-[9px] font-bold uppercase tracking-[0.24em] text-[#f6f1e7]/45 md:flex">
    Przewiń
    <span className="h-10 w-px bg-[#c79a46]/70" />
  </div>
</section>

<section
  id="produkty"
  className="bg-[#f6f1e7] px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
>
  <div className="mx-auto max-w-7xl">
    <div className="mb-12 grid gap-8 lg:grid-cols-[0.65fr_0.35fr] lg:items-end">
      <div>
        <div className="flex items-center gap-4">
          <span className="h-px w-10 bg-[#c79a46]" />

          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9a722e]">
            Oferta MoonGlass
          </p>
        </div>

        <h2 className="mt-5 max-w-3xl font-serif text-4xl font-medium leading-[1.02] tracking-[-0.02em] text-[#062c25] sm:text-5xl lg:text-6xl">
          Przestrzeń zaprojektowana
          <span className="block text-[#9a722e]">
            wokół Twojego domu.
          </span>
        </h2>
      </div>

      <p className="max-w-lg text-sm leading-7 text-[#202421]/65 sm:text-base lg:justify-self-end">
        Od lekkiego zadaszenia tarasu po zamknięty ogród zimowy.
        Konstrukcję, przeszklenia i wyposażenie dopasujemy do
        budynku oraz sposobu, w jaki chcesz korzystać z przestrzeni.
      </p>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      {productCards.map((product, index) => (
        <Link
          key={product.title}
          href={product.href}
          className="group relative min-h-[520px] overflow-hidden bg-[#031d18] sm:min-h-[600px]"
        >
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition duration-1000 ease-out group-hover:scale-[1.04]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/95 via-[#031d18]/30 to-transparent" />

          <div className="absolute inset-0 bg-gradient-to-r from-[#031d18]/28 to-transparent" />

          <div className="absolute left-6 top-6 flex items-center gap-3 sm:left-8 sm:top-8">
            <span className="font-serif text-3xl text-[#dfbd78]">
              0{index + 1}
            </span>

            <span className="h-px w-10 bg-[#c79a46]/80" />
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9 lg:p-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#dfbd78] sm:text-[11px]">
              {product.eyebrow}
            </p>

            <h3 className="mt-3 font-serif text-4xl font-medium text-[#f6f1e7] sm:text-5xl">
              {product.title}
            </h3>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#f6f1e7]/70 sm:text-base">
              {product.description}
            </p>

            <div className="mt-7 inline-flex items-center gap-4 border-b border-[#c79a46]/70 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition group-hover:text-[#dfbd78]">
              Skonfiguruj
              <span className="text-[#c79a46] transition duration-300 group-hover:translate-x-2">
                →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>

    <div className="mt-10 flex flex-col gap-5 border-t border-[#062c25]/15 pt-7 text-xs text-[#062c25]/65 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Każdy projekt przygotowujemy pod konkretne wymiary i warunki zabudowy.
      </p>

      <Link
        href="/oferta"
        className="inline-flex items-center gap-3 font-bold uppercase tracking-[0.14em] text-[#062c25] transition hover:text-[#9a722e]"
      >
        Zobacz pełną ofertę
        <span className="text-[#c79a46]">→</span>
      </Link>
    </div>
  </div>
</section>

<section className="bg-[#062c25] px-6 py-20 text-[#f6f1e7] sm:px-8 sm:py-24 lg:px-12 lg:py-28">
  <div className="mx-auto max-w-7xl">
    <div className="grid gap-10 lg:grid-cols-[0.44fr_0.56fr] lg:gap-20">
      <div>
        <div className="flex items-center gap-4">
          <span className="h-px w-10 bg-[#c79a46]" />

          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
            Dlaczego MoonGlass
          </p>
        </div>

        <h2 className="mt-6 max-w-xl font-serif text-4xl font-medium leading-[1.02] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
          Tworzymy przestrzeń,
          <span className="block text-[#dfbd78]">
            która zostaje na lata.
          </span>
        </h2>

        <p className="mt-7 max-w-lg text-sm leading-7 text-[#f6f1e7]/65 sm:text-base">
          Każda realizacja powstaje pod konkretny budynek,
          potrzeby domowników i sposób korzystania z tarasu.
          Nie sprzedajemy gotowego produktu z półki —
          projekt dopasowujemy do Ciebie.
        </p>

        <div className="mt-9">
          <Link href ="/kontakt"
            className="inline-flex items-center gap-4 border-b border-[#c79a46]/70 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:text-[#dfbd78]"
          >
            Porozmawiaj z doradcą
            <span className="text-[#c79a46]">→</span>
          </Link>
        </div>
      </div>

      <div className="grid border-t border-[#f6f1e7]/15 sm:grid-cols-2">
        <div className="border-b border-[#f6f1e7]/15 py-8 sm:border-r sm:px-8 lg:py-10">
          <span className="font-serif text-3xl text-[#c79a46]">
            01
          </span>

          <h3 className="mt-5 font-serif text-2xl font-medium sm:text-3xl">
            Projekt na wymiar
          </h3>

          <p className="mt-3 text-sm leading-7 text-[#f6f1e7]/60">
            Konstrukcję dopasowujemy do wymiarów tarasu,
            architektury domu oraz wybranego sposobu zabudowy.
          </p>
        </div>

        <div className="border-b border-[#f6f1e7]/15 py-8 sm:px-8 lg:py-10">
          <span className="font-serif text-3xl text-[#c79a46]">
            02
          </span>

          <h3 className="mt-5 font-serif text-2xl font-medium sm:text-3xl">
            Aluminiowa konstrukcja
          </h3>

          <p className="mt-3 text-sm leading-7 text-[#f6f1e7]/60">
            Nowoczesne profile aluminiowe zapewniają trwałość,
            estetykę i odporność na zmienne warunki pogodowe.
          </p>
        </div>

        <div className="border-b border-[#f6f1e7]/15 py-8 sm:border-r sm:px-8 lg:border-b-0 lg:py-10">
          <span className="font-serif text-3xl text-[#c79a46]">
            03
          </span>

          <h3 className="mt-5 font-serif text-2xl font-medium sm:text-3xl">
            Wiele możliwości
          </h3>

          <p className="mt-3 text-sm leading-7 text-[#f6f1e7]/60">
            Szkło, poliwęglan, ściany przesuwne, rolety ZIP,
            markizy i oświetlenie pozwalają stworzyć dokładnie
            taką przestrzeń, jakiej potrzebujesz.
          </p>
        </div>

        <div className="py-8 sm:px-8 lg:py-10">
          <span className="font-serif text-3xl text-[#c79a46]">
            04
          </span>

          <h3 className="mt-5 font-serif text-2xl font-medium sm:text-3xl">
            Kompleksowa realizacja
          </h3>

          <p className="mt-3 text-sm leading-7 text-[#f6f1e7]/60">
            Od pierwszej konfiguracji i wyceny, przez dopasowanie
            projektu, aż po montaż gotowej konstrukcji.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="bg-[#f6f1e7] px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
  <div className="mx-auto max-w-7xl">
    <div className="grid gap-14 lg:grid-cols-[0.42fr_0.58fr] lg:gap-24">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="flex items-center gap-4">
          <span className="h-px w-10 bg-[#c79a46]" />

          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9a722e]">
            Wycena online
          </p>
        </div>

        <h2 className="mt-6 max-w-xl font-serif text-4xl font-medium leading-[1.02] tracking-[-0.02em] text-[#062c25] sm:text-5xl lg:text-6xl">
          Od pomysłu do
          <span className="block text-[#9a722e]">
            konkretnej konfiguracji.
          </span>
        </h2>

        <p className="mt-7 max-w-lg text-sm leading-7 text-[#202421]/65 sm:text-base">
          Nie musisz zaczynać od zwykłego formularza kontaktowego.
          Skonfiguruj podstawowe parametry konstrukcji, zobacz
          orientacyjną cenę i prześlij gotowe zapytanie do naszego doradcy.
        </p>

        <Link
          href="/kalkulator"
          className="mt-9 inline-flex bg-[#062c25] px-8 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:bg-[#0b3a31]"
        >
          Uruchom kalkulator
        </Link>
      </div>

      <div className="border-t border-[#062c25]/15">
        {processSteps.map((step, index) => (
          <article
            key={step.title}
            className="group grid gap-5 border-b border-[#062c25]/15 py-8 sm:grid-cols-[90px_1fr] sm:gap-8 lg:py-10"
          >
            <div>
              <span className="font-serif text-4xl text-[#c79a46]">
                0{index + 1}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-[0.48fr_0.52fr] sm:gap-8">
              <h3 className="font-serif text-2xl font-medium leading-tight text-[#062c25] sm:text-3xl">
                {step.title}
              </h3>

              <p className="text-sm leading-7 text-[#202421]/60">
                {step.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>

    <div className="mt-14 grid gap-6 border-t border-[#062c25]/15 pt-8 sm:grid-cols-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a722e]">
          Bez zobowiązań
        </p>
        <p className="mt-2 text-sm leading-6 text-[#202421]/60">
          Sprawdzenie konfiguracji i ceny orientacyjnej nie zobowiązuje do zakupu.
        </p>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a722e]">
          Cena orientacyjna
        </p>
        <p className="mt-2 text-sm leading-6 text-[#202421]/60">
          Finalna oferta powstaje po potwierdzeniu zakresu i warunków realizacji.
        </p>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a722e]">
          Kontakt z doradcą
        </p>
        <p className="mt-2 text-sm leading-6 text-[#202421]/60">
          Do zapytania trafia cała wybrana konfiguracja, dzięki czemu rozmowa zaczyna się od konkretów.
        </p>
      </div>
    </div>
  </div>
</section>

<section className="bg-[#031d18] px-6 py-20 text-[#f6f1e7] sm:px-8 sm:py-24 lg:px-12 lg:py-28">
  <div className="mx-auto max-w-7xl">
    <div className="mb-12 grid gap-8 lg:grid-cols-[0.65fr_0.35fr] lg:items-end">
      <div>
        <div className="flex items-center gap-4">
          <span className="h-px w-10 bg-[#c79a46]" />

          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#dfbd78]">
            Inspiracje
          </p>
        </div>

        <h2 className="mt-6 max-w-4xl font-serif text-4xl font-medium leading-[1.02] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
          Zobacz przestrzeń,
          <span className="block text-[#dfbd78]">
            zanim powstanie u Ciebie.
          </span>
        </h2>
      </div>

      <div className="lg:justify-self-end">
        <p className="max-w-md text-sm leading-7 text-[#f6f1e7]/60 sm:text-base">
          Ogród zimowy, lekkie zadaszenie czy pełna zabudowa tarasu.
          Zobacz przykładowe aranżacje i znajdź rozwiązanie pasujące
          do Twojego domu.
        </p>

        <Link
          href="/kalkulator"
          className="mt-6 inline-flex items-center gap-4 border-b border-[#c79a46]/70 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:text-[#dfbd78]"
        >
          Wyceń podobny projekt
          <span className="text-[#c79a46]">→</span>
        </Link>
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-12">
      {galleryItems.map((item, index) => {
        const wide = index === 0 || index === 3;

        return (
          <article
            key={item.title}
            className={`group relative min-h-[390px] overflow-hidden bg-[#062c25] sm:min-h-[460px] ${
              wide ? "lg:col-span-7" : "lg:col-span-5"
            }`}
          >
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes={
                wide
                  ? "(min-width: 1024px) 58vw, 100vw"
                  : "(min-width: 1024px) 42vw, 100vw"
              }
              className="object-cover transition duration-1000 ease-out group-hover:scale-[1.04]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/95 via-[#031d18]/20 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-9">
              <div className="mb-3 flex items-center gap-3">
                <span className="font-serif text-2xl text-[#dfbd78]">
                  0{index + 1}
                </span>

                <span className="h-px w-8 bg-[#c79a46]/70" />
              </div>

              <h3 className="max-w-lg font-serif text-3xl font-medium leading-tight text-[#f6f1e7] sm:text-4xl">
                {item.title}
              </h3>

              <div className="mt-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7]/60 transition group-hover:text-[#dfbd78]">
                Zobacz inspirację
                <span className="text-[#c79a46] transition duration-300 group-hover:translate-x-2">
                  →
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>

    <div className="mt-10 flex flex-col gap-5 border-t border-[#f6f1e7]/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-2xl text-sm leading-7 text-[#f6f1e7]/55">
        Każda wizualizacja jest punktem wyjścia. Finalne wymiary,
        kolor konstrukcji, pokrycie dachu i wyposażenie dobieramy
        indywidualnie.
      </p>

      <Link
        href="/kalkulator"
        className="inline-flex shrink-0 items-center gap-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#f6f1e7] transition hover:text-[#dfbd78]"
      >
        Skonfiguruj swoją przestrzeń
        <span className="text-[#c79a46]">→</span>
      </Link>
    </div>
  </div>
</section>

<section className="relative overflow-hidden bg-[#f6f1e7]">
  <div className="grid lg:min-h-[680px] lg:grid-cols-2">
    <div className="flex items-center px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
      <div className="ml-auto w-full max-w-xl lg:pr-16">
        <div className="flex items-center gap-4">
          <span className="h-px w-10 bg-[#c79a46]" />

          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#9a722e]">
            Twój projekt
          </p>
        </div>

        <h2 className="mt-6 font-serif text-4xl font-medium leading-[1.02] tracking-[-0.02em] text-[#062c25] sm:text-5xl lg:text-6xl">
          Zobacz, ile może kosztować
          <span className="block text-[#9a722e]">
            Twoja przestrzeń.
          </span>
        </h2>

        <p className="mt-7 max-w-lg text-sm leading-7 text-[#202421]/65 sm:text-base">
          Wybierz wymiary, rodzaj konstrukcji, pokrycie dachu
          i dodatkowe wyposażenie. Kalkulator przygotuje orientacyjną
          wycenę, którą możesz od razu przesłać do naszego doradcy.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/kalkulator"
            className="bg-[#062c25] px-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#f6f1e7] transition hover:bg-[#0b3a31]"
          >
            Wyceń swój projekt
          </Link>

          <Link
            href="/kontakt"
            className="border border-[#062c25]/30 px-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#062c25] transition hover:border-[#9a722e] hover:text-[#9a722e]"
          >
            Porozmawiaj z nami
          </Link>
        </div>

        <div className="mt-12 grid gap-6 border-t border-[#062c25]/15 pt-7 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a722e]">
              Konfiguracja online
            </p>

            <p className="mt-2 text-sm leading-6 text-[#202421]/55">
              Podstawowe parametry inwestycji wybierzesz samodzielnie
              w kilka minut.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a722e]">
              Indywidualna oferta
            </p>

            <p className="mt-2 text-sm leading-6 text-[#202421]/55">
              Doradca zweryfikuje konfigurację i pomoże przygotować
              finalne rozwiązanie.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="relative min-h-[520px] lg:min-h-full">
      <Image
        src={images.gallery}
        alt="Nowoczesna zabudowa tarasu MoonGlass"
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/55 via-transparent to-transparent" />

      <div className="absolute bottom-7 left-7 right-7 border border-[#f6f1e7]/25 bg-[#031d18]/75 p-6 text-[#f6f1e7] backdrop-blur-sm sm:bottom-10 sm:left-10 sm:right-auto sm:max-w-sm sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dfbd78]">
          MoonGlass
        </p>

        <p className="mt-3 font-serif text-2xl leading-tight sm:text-3xl">
          Tworzymy przestrzeń
          <span className="block text-[#dfbd78]">
            na każdą porę roku.
          </span>
        </p>
      </div>
    </div>
  </div>
</section>
    </main>
    <SiteFooter />
    </>
  );
}
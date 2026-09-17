import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Polityka prywatności serwisu MoonGlass – informacje dotyczące przetwarzania danych osobowych.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0b0d0f] text-white">
      <section className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-12">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-amber-400">
            MoonGlass
          </p>

          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Polityka prywatności
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-white/65">
            Poniżej znajdziesz informacje dotyczące zasad przetwarzania danych
            osobowych użytkowników serwisu MoonGlass.
          </p>

          <p className="mt-3 text-sm text-white/45">
            Ostatnia aktualizacja: 9 września 2026 r.
          </p>
        </div>

        <div className="space-y-12 text-[15px] leading-7 text-white/75">
          <Section title="1. Administrator danych osobowych">
            <p>
              Administratorem danych osobowych przetwarzanych za pośrednictwem
              serwisu jest:
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-medium text-white">Moon Glass Monika Bąk</p>
              <p>Elizy Orzeszkowej 14/54</p>
              <p>02-374 Warszawa</p>
              <p>NIP: 7971949868</p>
              <p className="mt-2">
                E-mail:{" "}
                <a
                  href="mailto:biuro@moonglass.pl"
                  className="text-amber-400 transition hover:text-amber-300"
                >
                  biuro@moonglass.pl
                </a>
              </p>
            </div>

            <p className="mt-4">
              W sprawach związanych z ochroną danych osobowych można kontaktować
              się z Administratorem za pomocą powyższego adresu e-mail.
            </p>
          </Section>

          <Section title="2. Jakie dane możemy przetwarzać">
            <p>
              Zakres przetwarzanych danych zależy od sposobu korzystania z
              serwisu. W szczególności możemy przetwarzać:
            </p>

            <List
              items={[
                "imię i nazwisko,",
                "adres e-mail,",
                "numer telefonu,",
                "dane podane w formularzu kontaktowym lub formularzu zapytania ofertowego,",
                "informacje dotyczące planowanej inwestycji, konfiguracji produktu oraz parametrów wybranych w kalkulatorze lub konfiguratorze,",
                "treść wiadomości przesłanej do MoonGlass,",
                "pliki i zdjęcia przesłane dobrowolnie przez użytkownika,",
                "dane techniczne związane z korzystaniem z serwisu, takie jak adres IP, informacje o urządzeniu, przeglądarce oraz logach technicznych serwera.",
              ]}
            />
          </Section>

          <Section title="3. Cele przetwarzania danych">
            <p>Dane osobowe mogą być przetwarzane w celu:</p>

            <List
              items={[
                "udzielenia odpowiedzi na zapytanie przesłane przez użytkownika,",
                "przygotowania wyceny lub oferty,",
                "obsługi zapytania dotyczącego produktów i usług MoonGlass,",
                "kontaktu telefonicznego lub mailowego w sprawie przesłanego zapytania,",
                "obsługi procesu sprzedażowego i dalszej komunikacji z klientem,",
                "wykonania umowy lub podjęcia działań na żądanie użytkownika przed zawarciem umowy,",
                "realizacji obowiązków prawnych ciążących na Administratorze,",
                "zapewnienia prawidłowego i bezpiecznego działania serwisu,",
                "ustalenia, dochodzenia lub obrony przed ewentualnymi roszczeniami.",
              ]}
            />
          </Section>

          <Section title="4. Podstawy prawne przetwarzania">
            <p>
              Dane osobowe mogą być przetwarzane na podstawie odpowiednich
              przepisów RODO, w szczególności:
            </p>

            <List
              items={[
                "art. 6 ust. 1 lit. b RODO – gdy przetwarzanie jest niezbędne do podjęcia działań przed zawarciem umowy lub wykonania umowy,",
                "art. 6 ust. 1 lit. c RODO – gdy przetwarzanie jest konieczne do wypełnienia obowiązku prawnego ciążącego na Administratorze,",
                "art. 6 ust. 1 lit. f RODO – gdy podstawą jest prawnie uzasadniony interes Administratora, w szczególności obsługa korespondencji, zapewnienie bezpieczeństwa serwisu oraz ustalanie i dochodzenie roszczeń,",
                "art. 6 ust. 1 lit. a RODO – jeżeli w określonym przypadku użytkownik wyrazi odrębną zgodę na przetwarzanie danych.",
              ]}
            />
          </Section>

          <Section title="5. Formularz kontaktowy i zapytania ofertowe">
            <p>
              Dane przekazane za pośrednictwem formularza kontaktowego,
              kalkulatora lub konfiguratora są wykorzystywane do obsługi
              przesłanego zapytania oraz przygotowania odpowiedniej oferty.
            </p>

            <p className="mt-4">
              Podanie danych jest dobrowolne, jednak dane oznaczone jako
              wymagane są niezbędne do przesłania i obsługi zapytania.
            </p>

            <p className="mt-4">
              Użytkownik powinien przekazywać wyłącznie dane niezbędne do
              obsługi danej sprawy.
            </p>
          </Section>

          <Section title="6. Odbiorcy danych">
            <p>
              W związku z funkcjonowaniem serwisu dane mogą być przekazywane
              podmiotom wspierającym Administratora w świadczeniu usług, w
              szczególności dostawcom:
            </p>

            <List
              items={[
                "systemów CRM, w tym Bitrix24,",
                "systemów służących do wysyłki wiadomości e-mail, w tym Resend,",
                "hostingu, infrastruktury serwerowej i usług informatycznych,",
                "poczty elektronicznej oraz usług teleinformatycznych,",
                "obsługi księgowej, prawnej lub technicznej – jeżeli jest to niezbędne w konkretnej sprawie.",
              ]}
            />

            <p className="mt-4">
              Podmioty te otrzymują dostęp do danych wyłącznie w zakresie
              niezbędnym do realizacji powierzonych im zadań.
            </p>
          </Section>

          <Section title="7. Przekazywanie danych poza Europejski Obszar Gospodarczy">
            <p>
              Niektórzy dostawcy usług wykorzystywanych przez Administratora
              mogą przetwarzać dane z wykorzystaniem infrastruktury znajdującej
              się poza Europejskim Obszarem Gospodarczym.
            </p>

            <p className="mt-4">
              W takich przypadkach przekazywanie danych odbywa się zgodnie z
              wymaganiami RODO oraz z wykorzystaniem przewidzianych prawem
              mechanizmów zapewniających odpowiedni poziom ochrony danych.
            </p>
          </Section>

          <Section title="8. Okres przechowywania danych">
            <p>
              Dane są przechowywane przez okres niezbędny do realizacji celu, w
              którym zostały zebrane.
            </p>

            <p className="mt-4">
              W przypadku zapytań ofertowych dane mogą być przechowywane przez
              czas prowadzenia korespondencji i procesu ofertowego, a jeżeli
              dojdzie do zawarcia umowy – przez okres jej realizacji oraz przez
              okres wymagany przepisami prawa.
            </p>

            <p className="mt-4">
              Dane mogą być również przechowywane do czasu upływu terminów
              przedawnienia ewentualnych roszczeń.
            </p>
          </Section>

          <Section title="9. Prawa osób, których dane dotyczą">
            <p>
              Osobie, której dane są przetwarzane, mogą przysługiwać – w
              zależności od podstawy i okoliczności przetwarzania – następujące
              prawa:
            </p>

            <List
              items={[
                "prawo dostępu do swoich danych,",
                "prawo sprostowania danych,",
                "prawo usunięcia danych,",
                "prawo ograniczenia przetwarzania,",
                "prawo do przenoszenia danych,",
                "prawo wniesienia sprzeciwu wobec przetwarzania,",
                "prawo wycofania zgody w dowolnym momencie, jeżeli przetwarzanie odbywa się na podstawie zgody.",
              ]}
            />

            <p className="mt-4">
              W celu skorzystania z przysługujących praw można skontaktować się
              pod adresem{" "}
              <a
                href="mailto:biuro@moonglass.pl"
                className="text-amber-400 transition hover:text-amber-300"
              >
                biuro@moonglass.pl
              </a>
              .
            </p>
          </Section>

          <Section title="10. Prawo wniesienia skargi">
            <p>
              Jeżeli użytkownik uzna, że jego dane osobowe są przetwarzane
              niezgodnie z obowiązującymi przepisami, ma prawo wniesienia
              skargi do Prezesa Urzędu Ochrony Danych Osobowych.
            </p>
          </Section>

          <Section title="11. Pliki cookies">
            <p>
              Serwis może wykorzystywać pliki cookies lub podobne mechanizmy
              techniczne niezbędne do prawidłowego działania strony,
              zapewnienia bezpieczeństwa oraz utrzymania funkcjonalności
              serwisu.
            </p>

            <p className="mt-4">
              W aktualnej wersji serwisu MoonGlass nie wykorzystujemy Google
              Analytics, Meta Pixel ani innych narzędzi analitycznych lub
              marketingowych służących do śledzenia zachowania użytkowników.
            </p>

            <p className="mt-4">
              W przypadku wdrożenia w przyszłości dodatkowych narzędzi
              analitycznych lub marketingowych niniejsza polityka zostanie
              odpowiednio zaktualizowana, a tam, gdzie będzie to wymagane,
              użytkownik otrzyma możliwość zarządzania swoją zgodą.
            </p>
          </Section>

          <Section title="12. Bezpieczeństwo danych">
            <p>
              Administrator stosuje odpowiednie środki organizacyjne i
              techniczne mające na celu ochronę danych osobowych przed
              nieuprawnionym dostępem, utratą, zmianą lub ujawnieniem.
            </p>
          </Section>

          <Section title="13. Zmiany polityki prywatności">
            <p>
              Polityka prywatności może być aktualizowana w przypadku zmian w
              sposobie działania serwisu, wykorzystywanych usługach lub
              obowiązujących przepisach.
            </p>

            <p className="mt-4">
              Aktualna wersja dokumentu jest zawsze dostępna na tej stronie.
            </p>
          </Section>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 transition hover:text-amber-300"
          >
            ← Powrót do strony głównej
          </Link>
        </div>
      </section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-white md:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2 pl-5">
      {items.map((item) => (
        <li key={item} className="list-disc marker:text-amber-400">
          {item}
        </li>
      ))}
    </ul>
  );
}
# Bitrix24 Integration

## Cel dokumentu

Ten dokument opisuje docelowy kierunek integracji konfiguratora EcoGardens z Bitrix24.

Bitrix24 jest docelowym CRM dla procesu sprzedaży, wycen, ofert, proform, umów, realizacji i montażu.

Lokalny panel developerski:

```text
/admin/leady
/admin/leady/[id]
```

nie jest docelowym CRM. Służy tylko do testowania przepływu danych przed podłączeniem Bitrix24.

---

## Dlaczego Bitrix24

Na podstawie obecnego procesu EcoGardens Bitrix24 pełni rolę systemu operacyjnego firmy, a nie tylko prostego CRM.

W Bitrix24 obsługiwane są:

- leady i deale,
- pipeline sprzedażowy,
- pipeline realizacyjny,
- statusy kontaktu,
- pomiary,
- oferty,
- proformy,
- umowy,
- produkty i pozycje wyceny,
- kalendarz ekip,
- montaż,
- dokumenty,
- automatyzacje.

Dlatego nasza aplikacja nie powinna próbować zastąpić Bitrix24.

Strona ma odpowiadać za:

- konfigurację produktu,
- wyliczenie ceny,
- zebranie danych klienta,
- przygotowanie uporządkowanego payloadu,
- przekazanie danych do Bitrix24.

Dalsza obsługa sprzedaży i realizacji powinna odbywać się w Bitrix24.

---

## Obecny lokalny przepływ

Aktualnie działa lokalny przepływ developerski:

```text
/kalkulator
↓
ProductConfiguration
↓
QuoteService
↓
PricingEngine
↓
Quote
↓
QuoteSnapshot
↓
InquiryForm
↓
CalculatorInquiryLead
↓
POST /api/inquiries
↓
validateCalculatorInquiryLead
↓
CalculatorInquiryHandler
↓
StoredCalculatorInquiryLead
↓
FileCalculatorInquiryRepository
↓
data/inquiries/calculator-inquiries.json
```

Ten przepływ potwierdził, że umiemy:

- zebrać dane klienta,
- zebrać konfigurację,
- policzyć wycenę,
- utworzyć QuoteSnapshot,
- utworzyć lead,
- nadać mu ID,
- nadać status,
- zapisać go lokalnie,
- wyświetlić go w panelu developerskim.

---

## Docelowy przepływ z Bitrix24

Docelowy przepływ powinien wyglądać tak:

```text
/kalkulator
↓
ProductConfiguration
↓
QuoteService
↓
PricingEngine
↓
Quote
↓
QuoteSnapshot
↓
InquiryForm
↓
CalculatorInquiryLead
↓
POST /api/inquiries
↓
validateCalculatorInquiryLead
↓
CalculatorInquiryHandler
↓
Bitrix24CalculatorInquiryRepository
↓
Bitrix24 Deal
↓
Pipeline sprzedażowy EcoGardens
```

Lokalny zapis JSON może zostać jako:

- tryb developerski,
- fallback,
- backup techniczny,
- narzędzie testowe.

Nie powinien być głównym CRM.

---

## Decyzja: Lead czy Deal?

Na podstawie aktualnego procesu EcoGardens rekomendacja brzmi:

```text
Zapytanie z kalkulatora powinno trafiać do Bitrix24 jako Deal.
```

Powód:

- na screenach proces sprzedażowy jest prowadzony w Dealach,
- deale mają pipeline i etapy,
- deale mają produkty,
- z dealami powiązane są dokumenty,
- z dealami powiązany jest proces sprzedaży i realizacji,
- później deal może przejść do etapu pomiaru, oferty, proformy i realizacji.

Nie wyklucza to tworzenia kontaktu lub firmy w Bitrix24. Natomiast głównym obiektem sprzedażowym powinien być Deal.

---

## Docelowy obiekt w Bitrix24

Docelowo jedno zapytanie z kalkulatora powinno utworzyć lub zaktualizować:

```text
Contact / Company
↓
Deal
↓
Product rows
↓
Comment / description
↓
Optional document / quote
```

Minimalny wariant MVP integracji:

```text
1. Utwórz Deal.
2. Dodaj dane klienta w polach deala albo utwórz Contact.
3. Dodaj opis konfiguracji.
4. Dodaj wartość wyceny.
5. Dodaj pozycje produktowe.
6. Ustaw pipeline i etap początkowy.
```

---

## Adapter integracyjny

Nie należy wywoływać Bitrix24 bezpośrednio z komponentów React.

Nie należy umieszczać wywołań Bitrix24 bezpośrednio w `InquiryForm`.

Nie należy rozrzucać `fetch()` do Bitrix24 po wielu plikach.

Docelowo tworzymy adapter:

```text
Bitrix24CalculatorInquiryRepository
```

który implementuje istniejący interfejs:

```ts
CalculatorInquiryRepository
```

Obecnie mamy:

```text
FileCalculatorInquiryRepository
```

Docelowo dodamy:

```text
Bitrix24CalculatorInquiryRepository
```

Dzięki temu handler nadal będzie działał tak samo:

```text
CalculatorInquiryHandler
↓
CalculatorInquiryRepository
```

a implementację repozytorium będzie można podmienić konfiguracją środowiska.

---

## Proponowana struktura plików

Docelowo:

```text
src/inquiries/repositories/
  CalculatorInquiryRepository.ts
  FileCalculatorInquiryRepository.ts
  ConsoleCalculatorInquiryRepository.ts
  Bitrix24CalculatorInquiryRepository.ts

src/integrations/bitrix24/
  Bitrix24Client.ts
  Bitrix24Config.ts
  Bitrix24DealMapper.ts
  Bitrix24ProductRowMapper.ts
  Bitrix24Types.ts
```

Znaczenie plików:

```text
Bitrix24Client.ts
```

Odpowiada za techniczne wywołania REST API Bitrix24.

```text
Bitrix24Config.ts
```

Przechowuje konfigurację integracji: webhook URL, entity type, pipeline ID, stage ID, pola customowe.

```text
Bitrix24DealMapper.ts
```

Mapuje `StoredCalculatorInquiryLead` na payload tworzenia deala.

```text
Bitrix24ProductRowMapper.ts
```

Mapuje `quote.items` na pozycje produktowe Bitrix24.

```text
Bitrix24CalculatorInquiryRepository.ts
```

Łączy wszystko i zapisuje lead do Bitrix24.

---

## Bezpieczeństwo

Dane dostępowe do Bitrix24 nie mogą trafić do frontendu.

Webhook URL lub token muszą być przechowywane wyłącznie po stronie serwera.

Docelowo konfiguracja powinna trafić do `.env.local`, np.:

```env
BITRIX24_WEBHOOK_URL=
BITRIX24_DEAL_ENTITY_TYPE_ID=
BITRIX24_DEFAULT_CATEGORY_ID=
BITRIX24_DEFAULT_STAGE_ID=
BITRIX24_ASSIGNED_BY_ID=
```

Pliku `.env.local` nie wolno commitować.

---

## Dane wejściowe z aplikacji

Głównym obiektem wejściowym jest:

```text
StoredCalculatorInquiryLead
```

Plik:

```text
src/domain/StoredCalculatorInquiryLead.ts
```

Zawiera:

```ts
{
  id: string;
  status: CalculatorInquiryStatus;
  receivedAt: string;
  source: "calculator";
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    message: string;
  };
  quote: QuoteSnapshot;
}
```

---

## Mapowanie: StoredCalculatorInquiryLead → Bitrix24 Deal

Wstępne mapowanie:

| Dane w aplikacji | Docelowe pole Bitrix24 |
|---|---|
| `customer.name` | nazwa kontaktu / tytuł deala |
| `customer.email` | e-mail kontaktu |
| `customer.phone` | telefon kontaktu |
| `customer.message` | komentarz / opis |
| `quote.totalGross` | wartość deala |
| `quote.currency` | waluta |
| `quote.configurationSummary` | opis konfiguracji |
| `quote.items` | product rows |
| `source` | źródło: kalkulator |
| `id` | zewnętrzny numer zapytania |
| `receivedAt` | data przyjęcia zapytania |
| `status` | etap w pipeline albo pole własne |

---

## Proponowany tytuł deala

Tytuł deala powinien być czytelny na tablicy Bitrix24.

Propozycja:

```text
[Typ produktu] [Wymiary] - [Imię i nazwisko]
```

Przykład:

```text
Ogród zimowy 306 × 300 cm - Jan Kowalski
```

Jeśli nie da się łatwo wyciągnąć typu produktu i wymiarów, fallback:

```text
Zapytanie z kalkulatora - Jan Kowalski
```

---

## Opis deala

Opis deala powinien zawierać czytelne podsumowanie konfiguracji.

Przykład:

```text
Źródło: Kalkulator strony internetowej
Numer zapytania: inq_...
Data zapytania: 2026-07-03T11:25:52.228Z

Klient:
Imię i nazwisko: Jan Kowalski
E-mail: jan@example.com
Telefon: 123456789
Wiadomość: Proszę o kontakt.

Konfiguracja:
Typ produktu: Ogród zimowy
Wymiary: 306 × 300 cm
Dach: Poliwęglan przezroczysty
Ściany: Szyby przezroczyste
Rolety ZIP: przód
Markiza: Tak
Oświetlenie: LED punktowe
Akcesoria: uchwyty, szczotki, profil wyrównujący

Wycena:
Konstrukcja: 8 383 zł
Ściany przesuwne: 15 029 zł
Rolety ZIP: 3 079 zł
Markiza: 5 532 zł
Oświetlenie LED: 999 zł
Akcesoria: 2 397 zł

Razem: 35 419 zł
```

---

## Mapowanie statusów

Lokalne statusy:

```text
new
contacted
quoted
won
lost
```

Docelowo powinny zostać powiązane z etapami Bitrix24.

Wstępne mapowanie:

| Status lokalny | Etap Bitrix24 |
|---|---|
| `new` | Nowy lead |
| `contacted` | Kontakt nawiązany |
| `quoted` | Oferta wysłana |
| `won` | Wygrany / zamknięty sukcesem |
| `lost` | Przegrany / zamknięty niepowodzeniem |

To mapowanie trzeba potwierdzić na konkretnym koncie Bitrix24, ponieważ nazwy i ID etapów mogą być inne.

---

## Pipeline sprzedażowy

Na podstawie screenów obecny proces może zawierać etapy podobne do:

```text
Nowy lead
Brak kontaktu
Kontakt nawiązany
Oczekiwanie na zdjęcia
Zakwalifikowany lead
Brak kontaktu po kwalifikacji
Pomiar
Oferta wysłana
Proforma wysłana
Odroczony termin
Odroczony budżet
Za kwalifikacja
```

Do integracji potrzebujemy poznać prawdziwe ID:

```text
CATEGORY_ID
STAGE_ID
```

dla pipeline sprzedażowego.

---

## Pipeline realizacyjny

Na podstawie screenów etap realizacyjny może zawierać:

```text
W realizacji
Szkło na wymiar
Wysłać na wycenę
Materiał na wycenie
Wycena zaakceptowana
Ustalone ekipa i termin
Materiał opłacony
Realizacja zawieszona
Montaż skończony
Projekt opłacony
```

Na etapie integracji kalkulatora nie tworzymy jeszcze procesu realizacyjnego.

Proces realizacji powinien zaczynać się dopiero po zakwalifikowaniu sprzedaży lub podpisaniu umowy/proformy w Bitrix24.

---

## Produkty i product rows

`quote.items` powinny zostać przekształcone na pozycje produktowe Bitrix24.

Obecne pozycje w aplikacji:

```text
construction
wall
roof
zip
awning
lighting
accessory
installation
```

Przykładowe mapowanie:

| QuoteItem category | Bitrix24 product |
|---|---|
| `construction` | Ogród zimowy / Zadaszenie tarasu - konstrukcja |
| `wall` | Ściany przesuwne / szyby boczne |
| `roof` | Pokrycie dachu |
| `zip` | Rolety ZIP |
| `awning` | Markiza dachowa |
| `lighting` | Oświetlenie |
| `accessory` | Akcesoria |
| `installation` | Montaż |

Do potwierdzenia:

- czy używamy istniejących produktów z katalogu Bitrix24,
- czy tworzymy product rows tylko z nazwami,
- czy mapujemy produkty po ID,
- jak obsługujemy VAT,
- czy ceny w aplikacji są brutto czy netto dla Bitrix24,
- czy Bitrix24 ma generować dokumenty z tych product rows.

---

## VAT i ceny

W aplikacji MVP ceny są trzymane jako brutto:

```text
totalGross
unitPriceGross
totalPriceGross
```

W Bitrix24 na screenach widać pracę z:

- ceną netto,
- VAT,
- ceną brutto,
- rabatem,
- pozycjami produktowymi.

Do decyzji:

```text
Czy do Bitrix24 wysyłamy ceny brutto jako cenę produktu?
Czy przeliczamy netto/VAT po stronie naszej aplikacji?
Czy Bitrix24 sam liczy VAT na podstawie ustawień produktu?
Czy VAT zależy od typu klienta/usługi?
```

Na razie integracja powinna zachować ostrożność i nie zakładać ostatecznej logiki VAT bez potwierdzenia z EcoGardens.

---

## Dokumenty

Na podstawie załączników w procesie EcoGardens występują dokumenty:

- wycena,
- specyfikacja i wycena szczegółowa,
- proforma,
- umowa,
- załącznik ze schematem konstrukcji.

Docelowo trzeba zdecydować:

```text
Czy dokumenty generuje Bitrix24?
Czy dokumenty generuje nasza aplikacja?
Czy nasza aplikacja tylko tworzy deal i product rows, a dokumenty powstają w Bitrix24?
```

Rekomendacja na MVP integracji:

```text
Najpierw tworzymy Deal + product rows + opis konfiguracji.
Generowanie dokumentów zostawiamy Bitrix24 albo etap późniejszy.
```

---

## Schemat konstrukcji

Na załącznikach widoczny jest dokument ze schematem konstrukcji i wymiarami.

Docelowo możliwe są dwa warianty:

### Wariant A — Bitrix24 generuje dokument

Nasza aplikacja przekazuje tylko dane:

- szerokość,
- długość,
- typ produktu,
- ściany,
- dach,
- dodatki.

Bitrix24 generuje dokument z szablonu.

### Wariant B — aplikacja generuje PDF

Nasza aplikacja generuje PDF ze schematem i wysyła go do Bitrix24 jako plik.

Na tym etapie nie wybieramy jeszcze wariantu.

---

## Kalendarz i montaże

Na screenach widać kalendarz firmowy Bitrix24 oraz planowanie ekip.

Nasza aplikacja nie powinna budować własnego kalendarza ekip.

Docelowo:

```text
Bitrix24 odpowiada za kalendarz, montaż i harmonogram.
```

Aplikacja może w przyszłości przekazać do Bitrix24 dane potrzebne do planowania, np.:

- lokalizacja klienta,
- preferowany termin,
- wymagany montaż,
- typ konstrukcji,
- gabaryty.

---

## Minimalny MVP integracji Bitrix24

Pierwszy techniczny MVP integracji powinien robić tylko:

```text
1. Przyjąć CalculatorInquiryLead z formularza.
2. Zweryfikować payload.
3. Utworzyć StoredCalculatorInquiryLead.
4. Utworzyć Deal w Bitrix24.
5. Ustawić pipeline i etap początkowy.
6. Przekazać dane klienta.
7. Przekazać opis konfiguracji.
8. Przekazać wartość wyceny.
9. Dodać pozycje produktowe, jeśli będzie potwierdzone mapowanie.
10. Zwrócić ID lokalne oraz ID Bitrix24.
```

Nie robimy w MVP:

- lokalnego CRM,
- lokalnego kalendarza,
- lokalnych zadań,
- lokalnych notatek,
- lokalnej automatyzacji pipeline,
- pełnego generowania dokumentów,
- pełnej obsługi realizacji.

---

## Dane potrzebne od EcoGardens / Bitrix24

Przed implementacją prawdziwej integracji trzeba zebrać:

```text
1. Adres portalu Bitrix24.
2. Sposób autoryzacji: webhook przychodzący lub aplikacja.
3. ID użytkownika / osoby odpowiedzialnej.
4. ID pipeline sprzedażowego.
5. ID etapu startowego.
6. Lista etapów pipeline i ich ID.
7. Decyzja: Lead czy Deal.
8. Lista wymaganych pól Bitrix24.
9. Lista pól customowych.
10. Lista produktów i ich ID.
11. Informacja, czy tworzymy kontakty.
12. Informacja, czy tworzymy firmy.
13. Informacja, czy generujemy dokumenty w Bitrix24.
14. Informacja, czy product rows mają korzystać z katalogu produktów.
15. Stawki VAT i sposób liczenia netto/brutto.
```

---

## Zmienne środowiskowe

Proponowane zmienne:

```env
BITRIX24_ENABLED=false
BITRIX24_WEBHOOK_URL=
BITRIX24_DEAL_ENTITY_TYPE_ID=
BITRIX24_DEFAULT_CATEGORY_ID=
BITRIX24_DEFAULT_STAGE_ID=
BITRIX24_ASSIGNED_BY_ID=
BITRIX24_SOURCE_ID=
```

Dla trybu lokalnego:

```env
BITRIX24_ENABLED=false
```

Dla trybu produkcyjnego:

```env
BITRIX24_ENABLED=true
```

---

## Tryby zapisu

Docelowo można obsługiwać kilka trybów:

```text
local
bitrix24
hybrid
```

### local

Lead zapisuje się tylko do pliku JSON.

```text
FileCalculatorInquiryRepository
```

### bitrix24

Lead zapisuje się tylko do Bitrix24.

```text
Bitrix24CalculatorInquiryRepository
```

### hybrid

Lead zapisuje się lokalnie i do Bitrix24.

```text
CompositeCalculatorInquiryRepository
↓
FileCalculatorInquiryRepository
↓
Bitrix24CalculatorInquiryRepository
```

Tryb `hybrid` może być przydatny na początku wdrożenia, aby mieć lokalny backup.

---

## Docelowe rozszerzenie modelu

Obecny model:

```ts
StoredCalculatorInquiryLead
```

można później rozszerzyć o:

```ts
{
  bitrix24DealId?: string;
  bitrix24ContactId?: string;
  bitrix24CompanyId?: string;
  bitrix24Url?: string;
  integrationStatus?: "pending" | "synced" | "failed";
  integrationError?: string;
}
```

To pozwoli przechowywać informację, czy lead został poprawnie przekazany do Bitrix24.

---

## Ryzyka

Najważniejsze ryzyka:

- różnice między cenami brutto w aplikacji a netto/VAT w Bitrix24,
- brak mapowania produktów do katalogu Bitrix24,
- nieznane ID pipeline i etapów,
- obowiązkowe pola customowe w Bitrix24,
- dokumenty generowane z Bitrix24 mogą wymagać konkretnych product rows,
- webhook może działać z uprawnieniami konkretnego użytkownika,
- API Bitrix24 może odrzucić request przy braku uprawnień,
- duplikaty kontaktów lub dealów,
- różnice między leadem a dealem w konfiguracji konta EcoGardens.

---

## Decyzje na teraz

- Docelowym CRM jest Bitrix24.
- Lokalny panel `/admin/leady` jest tylko panelem developerskim.
- Nie rozwijamy lokalnego CRM dalej poza potrzeby testowe.
- Głównym obiektem sprzedażowym powinien być Deal.
- Integracja powinna iść przez adapter `Bitrix24CalculatorInquiryRepository`.
- Nie wywołujemy Bitrix24 bezpośrednio z komponentów React.
- Sekrety Bitrix24 przechowujemy tylko po stronie serwera.
- W pierwszym MVP integracji skupiamy się na utworzeniu deala i przekazaniu danych konfiguracji.
- Dokumenty, kalendarz i realizacja pozostają w Bitrix24.
# Calculator Inquiry Flow

## Cel

Ten dokument opisuje przepływ danych od konfiguracji produktu w kalkulatorze do przygotowania leada sprzedażowego.

Na obecnym etapie formularz zapytania wysyła dane do lokalnego endpointu API w Next.js. Backend waliduje payload, przekazuje poprawny lead do handlera, a handler zapisuje lead przez tymczasowe repozytorium konsolowe.

Dane nie są jeszcze zapisywane w bazie danych, CRM ani wysyłane e-mailem.

Docelowo ten przepływ będzie podstawą do:

- zapisu leada w CRM,
- zapisu leada w bazie danych,
- wygenerowania oferty PDF,
- wysłania wiadomości do klienta,
- przekazania konfiguracji do konsultanta,
- dalszego procesu sprzedażowego.

---

## Główny przepływ

```text
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
CalculatorInquiryService
↓
POST /api/inquiries
↓
validateCalculatorInquiryLead
↓
CalculatorInquiryHandler
↓
CalculatorInquiryRepository
↓
ConsoleCalculatorInquiryRepository
```

---

## 1. ProductConfiguration

`ProductConfiguration` opisuje wybory użytkownika w konfiguratorze.

Plik:

```text
src/domain/ProductConfiguration.ts
```

Przykładowe dane:

```ts
{
  width: 306,
  length: 300,
  walls: "glass_clear",
  roof: "polycarbonate_clear",
  hasFrontZip: true,
  hasLeftZip: false,
  hasRightZip: false,
  hasAwning: true,
  hasLed: true,
  hasCob: false,
  hasHandles: true,
  hasBrushes: true,
  hasLevelingProfile: true
}
```

To jest techniczna konfiguracja produktu, używana przez Pricing Engine.

---

## 2. Quote

`Quote` jest wynikiem wyceny konfiguracji.

Plik:

```text
src/domain/Quote.ts
```

Quote zawiera:

- konfigurację,
- pozycje oferty,
- sumę brutto,
- walutę.

Przykład logiczny:

```ts
{
  configuration,
  items: [
    {
      id: "construction",
      name: "Konstrukcja",
      category: "construction",
      quantity: 1,
      unitPriceGross: 8383,
      totalPriceGross: 8383
    }
  ],
  totalGross: 35419,
  currency: "PLN"
}
```

Quote jest obiektem domenowym związanym z wyceną.

---

## 3. QuoteSnapshot

`QuoteSnapshot` jest uproszczoną, gotową do przekazania dalej reprezentacją oferty.

Plik:

```text
src/lib/quote-snapshot.ts
```

Snapshot zawiera:

- oryginalną konfigurację,
- czytelne podsumowanie konfiguracji,
- pozycje oferty,
- sumę brutto,
- walutę.

Przykład:

```ts
{
  configuration,
  configurationSummary: [
    { label: "Typ produktu", value: "Ogród zimowy" },
    { label: "Wymiary", value: "306 × 300 cm" },
    { label: "Dach", value: "Poliwęglan przezroczysty" },
    { label: "Ściany", value: "Szyby przezroczyste" }
  ],
  items,
  totalGross: 35419,
  currency: "PLN"
}
```

QuoteSnapshot będzie używany później przez:

- CRM,
- PDF,
- e-mail,
- panel konsultanta,
- zapis zapytania w bazie danych.

---

## 4. Configuration summary

Czytelne podsumowanie konfiguracji generuje funkcja:

```text
src/lib/configuration-summary.ts
```

Funkcja:

```ts
getConfigurationSummaryRows(configuration)
```

zwraca listę wierszy:

```ts
[
  { label: "Typ produktu", value: "Ogród zimowy" },
  { label: "Wymiary", value: "306 × 300 cm" },
  { label: "Dach", value: "Poliwęglan przezroczysty" },
  { label: "Ściany", value: "Szyby przezroczyste" },
  { label: "Rolety ZIP", value: "przód" },
  { label: "Markiza", value: "Tak" },
  { label: "Oświetlenie", value: "LED punktowe" },
  { label: "Akcesoria", value: "uchwyty, szczotki, profil wyrównujący" }
]
```

Dzięki temu ten sam opis konfiguracji może być używany w UI, CRM, PDF i mailu.

---

## 5. InquiryForm

Formularz kontaktowy znajduje się w pliku:

```text
src/components/calculator/InquiryForm.tsx
```

Formularz zbiera:

- imię i nazwisko,
- e-mail,
- telefon,
- wiadomość.

Po wysłaniu formularza tworzony jest `CalculatorInquiryLead`.

Formularz nie wysyła danych bezpośrednio do CRM ani bazy danych. Przekazuje dane do `CalculatorInquiryService`.

---

## 6. CalculatorInquiryLead

Model leada znajduje się w pliku:

```text
src/domain/CalculatorInquiryLead.ts
```

Struktura:

```ts
{
  source: "calculator",
  createdAt: string,
  customer: {
    name: string,
    email: string,
    phone: string,
    message: string
  },
  quote: QuoteSnapshot
}
```

Ten obiekt jest docelowym kandydatem do zapisania w CRM lub bazie danych.

---

## 7. CalculatorInquiryService

Serwis frontendowy znajduje się w pliku:

```text
src/inquiries/services/CalculatorInquiryService.ts
```

Serwis odpowiada za wysłanie leada z przeglądarki do lokalnego endpointu API:

```text
POST /api/inquiries
```

Obecny przepływ:

```text
InquiryForm
↓
CalculatorInquiryService.submit(lead)
↓
fetch("/api/inquiries")
↓
API route
```

Serwis zwraca do UI informację o sukcesie albo błędzie.

---

## 8. API endpoint

Endpoint zapytań znajduje się w pliku:

```text
src/app/api/inquiries/route.ts
```

Endpoint odpowiada za:

- odczytanie JSON z requestu,
- obsługę błędnego JSON,
- walidację payloadu,
- przekazanie poprawnego leada do handlera,
- zwrócenie odpowiedzi JSON do frontendu.

Endpoint nie powinien zawierać logiki zapisu do CRM, bazy danych ani e-maila.

Obecny przepływ endpointu:

```text
POST /api/inquiries
↓
request.json()
↓
validateCalculatorInquiryLead(payload)
↓
CalculatorInquiryHandler.handle(lead)
↓
Response.json(result)
```

---

## 9. Validator

Walidator znajduje się w pliku:

```text
src/inquiries/validators/calculator-inquiry-validator.ts
```

Funkcja:

```ts
validateCalculatorInquiryLead(value)
```

sprawdza podstawowy kształt danych przychodzących z frontendu.

Walidator sprawdza m.in.:

- czy payload jest obiektem,
- czy `source` ma wartość `"calculator"`,
- czy `createdAt` istnieje i jest poprawną datą,
- czy istnieją dane klienta,
- czy imię i nazwisko nie jest puste,
- czy e-mail zawiera `@`,
- czy telefon nie jest pusty,
- czy wiadomość jest stringiem,
- czy istnieje quote,
- czy suma wyceny jest większa od zera,
- czy waluta to PLN,
- czy istnieją pozycje wyceny,
- czy istnieje podsumowanie konfiguracji.

Jeśli payload jest błędny, endpoint zwraca:

```text
HTTP 400
```

oraz komunikat błędu.

---

## 10. CalculatorInquiryHandler

Handler znajduje się w pliku:

```text
src/inquiries/server/CalculatorInquiryHandler.ts
```

Handler odpowiada za obsługę poprawnie zwalidowanego leada.

Obecnie handler przekazuje lead do repozytorium:

```text
CalculatorInquiryHandler
↓
CalculatorInquiryRepository
```

Docelowo w tym miejscu może pojawić się dodatkowa logika, np.:

- przygotowanie statusu leada,
- wywołanie kilku integracji,
- zapis historii,
- wysłanie powiadomienia do konsultanta,
- uruchomienie generowania PDF.

---

## 11. CalculatorInquiryRepository

Interfejs repozytorium znajduje się w pliku:

```text
src/inquiries/repositories/CalculatorInquiryRepository.ts
```

Interfejs:

```ts
export interface CalculatorInquiryRepository {
  save(lead: CalculatorInquiryLead): Promise<void>;
}
```

Repozytorium jest warstwą odpowiedzialną za zapis leada.

Dzięki temu handler nie musi wiedzieć, czy lead jest zapisywany do:

- konsoli,
- bazy danych,
- CRM,
- systemu mailowego,
- pliku,
- innego źródła danych.

---

## 12. ConsoleCalculatorInquiryRepository

Tymczasowa implementacja repozytorium znajduje się w pliku:

```text
src/inquiries/repositories/ConsoleCalculatorInquiryRepository.ts
```

Na obecnym etapie repozytorium zapisuje lead w konsoli serwera:

```ts
console.log("Calculator inquiry lead saved:", lead);
```

W terminalu, w którym działa `npm run dev`, powinien pojawić się wpis:

```text
Calculator inquiry lead saved:
```

Docelowo ta implementacja zostanie zastąpiona lub rozszerzona przez repozytorium zapisujące lead do:

- bazy danych,
- CRM,
- systemu mailowego,
- innego trwałego źródła danych.

---

## Aktualny status

Na obecnym etapie działa:

- konfiguracja produktu,
- dynamiczna wycena,
- tworzenie Quote,
- tworzenie QuoteSnapshot,
- formularz kontaktowy,
- tworzenie CalculatorInquiryLead,
- wysyłka leada z frontendu do lokalnego API,
- endpoint `POST /api/inquiries`,
- walidacja payloadu po stronie API,
- odrzucanie błędnych requestów statusem 400,
- obsługa poprawnego leada przez CalculatorInquiryHandler,
- zapis leada przez ConsoleCalculatorInquiryRepository,
- komunikat sukcesu w UI,
- stan `Wysyłanie...`,
- stan `Wysłano`,
- blokowanie ponownego wysłania po sukcesie.

Nie działa jeszcze:

- zapis do bazy danych,
- wysyłka e-mail,
- integracja CRM,
- pełna walidacja biznesowa formularza,
- panel zarządzania leadami,
- generowanie PDF oferty,
- trwałe przechowywanie zapytań.

---

## Test poprawnego requestu

W UI:

```text
/kalkulator
```

Kroki:

```text
1. Kliknij "Wyślij zapytanie".
2. Wypełnij formularz.
3. Kliknij "Wyślij".
4. Przycisk powinien pokazać "Wysyłanie...".
5. Następnie powinien pokazać "Wysłano".
6. W UI powinien pojawić się komunikat sukcesu.
7. W terminalu powinien pojawić się log "Calculator inquiry lead saved:".
8. Request powinien zakończyć się statusem 200.
```

---

## Test błędnego requestu

W konsoli przeglądarki można wykonać:

```js
fetch("/api/inquiries", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
})
  .then((response) => response.json())
  .then(console.log);
```

Oczekiwany wynik:

```js
{
  success: false,
  message: "Nieprawidłowe źródło zapytania."
}
```

Request powinien zakończyć się statusem:

```text
400
```

---

## Następne kroki

Najbliższe techniczne kroki:

1. Zdecydować, gdzie lead ma być zapisywany jako pierwsze trwałe źródło danych.
2. Przygotować repozytorium zapisujące lead do wybranego miejsca.
3. Dodać pełniejszą walidację danych kontaktowych.
4. Przygotować strukturę statusów leada.
5. Przygotować panel lub widok administracyjny leadów.
6. Przygotować generowanie PDF oferty na bazie QuoteSnapshot.
7. Przygotować przyszłą integrację z CRM.
8. Przygotować wysyłkę e-mail do klienta lub konsultanta.

---

## Decyzje architektoniczne

- `ProductConfiguration` pozostaje technicznym opisem konfiguracji.
- `Quote` pozostaje wynikiem Pricing Engine.
- `QuoteSnapshot` jest formatem transportowym do CRM/PDF/API.
- `CalculatorInquiryLead` łączy dane klienta z wyceną.
- `InquiryForm` zbiera dane klienta i tworzy lead.
- `CalculatorInquiryService` wysyła lead do API.
- `route.ts` obsługuje request HTTP i walidację.
- `validateCalculatorInquiryLead` chroni endpoint przed błędnym payloadem.
- `CalculatorInquiryHandler` obsługuje poprawnie zwalidowany lead.
- `CalculatorInquiryRepository` abstrahuje zapis leada.
- `ConsoleCalculatorInquiryRepository` jest tymczasową implementacją developerską.
- UI nie powinien samodzielnie wysyłać danych do CRM.
- Endpoint API nie powinien zawierać logiki zapisu do bazy, CRM ani e-maila.
# Model domenowy

## Cel dokumentu

Ten dokument opisuje główne encje domenowe systemu.

Model domenowy pokazuje, jakie obiekty biznesowe istnieją w systemie oraz jak są ze sobą powiązane.

Dokument nie opisuje jeszcze bazy danych ani implementacji TypeScript.

---

# Główna idea systemu

System jest platformą typu CPQ:

Configure → Price → Quote

Oznacza to, że główny przepływ wygląda następująco:

Klient konfiguruje produkt

↓

System wylicza cenę

↓

Klient wysyła formularz

↓

Powstaje lead

↓

Konsultant kontaktuje się z klientem

↓

Powstaje oferta

↓

Powstaje zamówienie

↓

Następuje realizacja i montaż

---

# Główne encje systemu

## 1. ProductConfiguration

Najważniejsza encja systemu.

Opisuje wstępny lub docelowy zestaw wyborów dotyczących produktu.

Zawiera między innymi:

- szerokość,
- długość,
- rodzaj pokrycia dachu,
- ściany,
- rolety,
- markizę,
- LED,
- dodatki.

ProductConfiguration jest wykorzystywana przez:

- konfigurator na stronie,
- Pricing Engine,
- formularz leadowy,
- CRM,
- ofertę,
- przyszły BOM,
- przyszły moduł montażu.

---

## 2. Customer

Osoba zainteresowana ofertą.

Zawiera:

- imię,
- telefon,
- email,
- lokalizację,
- wiadomość,
- zdjęcia.

Customer może powstać z formularza na stronie albo zostać utworzony ręcznie przez konsultanta.

---

## 3. Lead

Lead to zgłoszenie sprzedażowe.

Powstaje, gdy klient wyśle formularz z konfiguratora.

Lead zawiera:

- dane klienta,
- wstępną konfigurację produktu,
- orientacyjną cenę,
- źródło leada,
- status,
- datę utworzenia.

Ważne:

Lead nie jest jeszcze ofertą.

Lead jest początkiem rozmowy handlowej.

---

## 4. Quote

Quote to oferta przygotowana dla klienta.

Może bazować na konfiguracji wysłanej ze strony, ale może zostać zmieniona przez konsultanta.

Quote zawiera:

- klienta,
- konfigurację,
- listę pozycji wyceny,
- cenę netto,
- VAT,
- cenę brutto,
- rabaty,
- datę ważności.

---

## 5. QuoteItem

QuoteItem to pojedyncza pozycja oferty.

Przykłady:

- Konstrukcja 300 × 306,
- Ściany przesuwne przezroczyste,
- Roleta ZIP przednia,
- Markiza dachowa,
- Oświetlenie LED,
- Montaż.

Pricing Engine nie powinien zwracać tylko jednej ceny.

Powinien zwracać listę QuoteItem.

---

## 6. PriceMatrix

PriceMatrix to uporządkowana tabela cen.

Jest źródłem danych dla Pricing Engine.

Zawiera ceny dla:

- wymiarów,
- konstrukcji,
- ścian,
- pokryć,
- rolet,
- markiz,
- LED,
- dodatków.

---

## 7. PricingEngine

PricingEngine to moduł odpowiedzialny za przeliczenie konfiguracji na ofertę cenową.

Wejście:

- ProductConfiguration,
- PriceMatrix.

Wyjście:

- lista QuoteItem,
- suma netto,
- VAT,
- suma brutto.

---

## 8. Order

Order powstaje po zaakceptowaniu oferty przez klienta.

Order zawiera:

- zaakceptowaną konfigurację,
- zaakceptowaną ofertę,
- dane klienta,
- status realizacji,
- informacje o płatności.

---

## 9. Installation

Installation opisuje montaż.

Zawiera:

- termin montażu,
- ekipę,
- lokalizację,
- warunki montażowe,
- dopłaty,
- status.

Nie jest potrzebna w MVP, ale powinna istnieć w modelu docelowym.

---

## 10. BOM

BOM oznacza Bill Of Materials.

Jest to lista materiałów potrzebnych do wykonania zamówienia.

Może zawierać:

- profile,
- szyby,
- prowadnice,
- uchwyty,
- szczotki,
- LED,
- zasilacze,
- elementy montażowe.

BOM nie jest potrzebny do pierwszej wersji kalkulatora.

---

# Relacje między encjami

Customer

↓

Lead

↓

ProductConfiguration

↓

PricingEngine

↓

Quote

↓

QuoteItem

↓

Order

↓

BOM

↓

Installation

---

# Ważne rozróżnienia

## Lead vs Quote

Lead to zgłoszenie.

Quote to oferta.

Lead może istnieć bez oferty.

Oferta powstaje dopiero po analizie zgłoszenia.

---

## ProductConfiguration vs Quote

ProductConfiguration opisuje wybory.

Quote opisuje wycenę tych wyborów.

Ta sama konfiguracja może mieć różne oferty, np. z różnym rabatem lub marżą.

---

## Quote vs Order

Quote jest propozycją.

Order jest zaakceptowaną ofertą.

---

## PriceMatrix vs PricingEngine

PriceMatrix to dane.

PricingEngine to logika, która korzysta z danych.

---

# Decyzje architektoniczne

## 1. Konfiguracja jest centralnym obiektem systemu

Nie traktujemy ogrodu zimowego jako osobnego produktu.

Ogród zimowy wynika z konfiguracji konstrukcji.

---

## 2. Pricing Engine zwraca listę pozycji

Nie wystarczy jedna cena końcowa.

System musi wiedzieć, z czego składa się cena.

---

## 3. CRM może zmienić konfigurację

Konfiguracja wysłana przez klienta ze strony jest tylko punktem startowym.

Konsultant może zmienić konfigurację po rozmowie z klientem.

---

## 4. MVP nie obejmuje BOM i montażu

BOM oraz Installation są częścią modelu docelowego, ale nie muszą być implementowane w pierwszej wersji.

---

# Zakres MVP

W MVP potrzebujemy:

- ProductConfiguration,
- PriceMatrix,
- PricingEngine,
- QuoteItem,
- Quote,
- Lead,
- Customer.

Poza MVP:

- Order,
- BOM,
- Installation,
- dokumenty PDF,
- pełna integracja CRM.

---

# Otwarte pytania

1. Czy ceny w aplikacji będą przechowywane jako netto, brutto czy oba?
2. Jak będzie doliczana marża sprzedawcy?
3. Czy montaż w MVP jest osobną pozycją, czy wliczony w cenę?
4. Czy klient powinien widzieć pełną listę pozycji, czy tylko cenę końcową?
5. Czy oferta PDF będzie generowana w MVP?
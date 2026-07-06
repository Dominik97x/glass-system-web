# Mapowanie portalu Bitrix24

## Cel dokumentu

Ten dokument zbiera wszystkie techniczne identyfikatory i decyzje potrzebne do integracji aplikacji `glass-system-web` z konkretnym portalem Bitrix24.

Nie zgadujemy wartości takich jak:

- `categoryId`,
- `stageId`,
- `productId`,
- `assignedById`,
- `UF_CRM`,
- stawki VAT,
- wymagane pola dokumentów.

Wartości muszą zostać pobrane z konkretnego portalu Bitrix24 przez API albo potwierdzone w panelu administracyjnym.

---

# Status dokumentu

```text
Status: draft
Źródło danych: screeny z Bitrix24 + przyszły odczyt API
Portal: do uzupełnienia
Webhook: do uzupełnienia lokalnie w .env.local
```

---

# Co wiemy ze screenów Bitrix24

Na podstawie screenów z obecnego Bitrix24 wiemy, że portal obsługuje:

- pipeline sprzedaży,
- pipeline realizacji,
- pipeline reklamacji,
- katalog produktów,
- product rows na dealach,
- proformy,
- wyceny,
- specyfikacje,
- umowy,
- załączniki techniczne,
- kalendarz firmowy,
- montaż i realizację.

Dlatego aplikacja nie powinna budować własnego CRM.

Aplikacja powinna:

```text
1. policzyć konfigurację,
2. utworzyć zapytanie/deal,
3. dodać pozycje produktowe,
4. przekazać dane do Bitrix24,
5. pozwolić Bitrix24 obsłużyć sprzedaż, dokumenty i realizację.
```

---

# Docelowy przepływ integracji

```text
Kalkulator strony
↓
Quote
↓
Formularz zapytania
↓
StoredCalculatorInquiryLead
↓
Bitrix24 Deal
↓
Bitrix24 Product Rows
↓
Dokumenty Bitrix24
↓
Pipeline realizacji
```

---

# Konfiguracja `.env.local`

Docelowo aplikacja będzie potrzebowała wartości:

```env
BITRIX24_ENABLED=true
BITRIX24_WEBHOOK_URL=
BITRIX24_DEAL_ENTITY_TYPE_ID=2
BITRIX24_DEAL_OWNER_TYPE=D
BITRIX24_DEFAULT_CATEGORY_ID=
BITRIX24_DEFAULT_STAGE_ID=
BITRIX24_ASSIGNED_BY_ID=
BITRIX24_SOURCE_ID=
CALCULATOR_INQUIRY_REPOSITORY=hybrid
```

## Znaczenie pól

| Zmienna | Znaczenie |
|---|---|
| `BITRIX24_ENABLED` | Czy integracja z Bitrix24 jest aktywna |
| `BITRIX24_WEBHOOK_URL` | Adres webhooka Bitrix24 |
| `BITRIX24_DEAL_ENTITY_TYPE_ID` | Typ encji CRM; dla Deal przyjmujemy `2` |
| `BITRIX24_DEAL_OWNER_TYPE` | Owner type dla product rows; dla Deal przyjmujemy `D` |
| `BITRIX24_DEFAULT_CATEGORY_ID` | ID pipeline'u sprzedażowego |
| `BITRIX24_DEFAULT_STAGE_ID` | ID etapu startowego |
| `BITRIX24_ASSIGNED_BY_ID` | ID użytkownika przypisanego jako opiekun |
| `BITRIX24_SOURCE_ID` | Źródło deala, jeżeli Bitrix24 ma skonfigurowane źródła |
| `CALCULATOR_INQUIRY_REPOSITORY` | Tryb zapisu zapytań: `local`, `bitrix24`, `hybrid` |

---

# Pipeline / category mapping

## Kandydat ze screenów

Na screenach widoczny jest pipeline:

```text
Etap sprzedaży z pomiarem
```

To jest najlepszy kandydat dla nowych zapytań z kalkulatora.

## Wartości do uzupełnienia

| Nazwa pipeline'u | Przeznaczenie | categoryId | Status |
|---|---|---:|---|
| Etap sprzedaży z pomiarem | Nowe zapytania ze strony | do uzupełnienia | do pobrania |
| Etap realizacji | Realizacja po sprzedaży | do uzupełnienia | później |
| Etap reklamacji | Reklamacje | do uzupełnienia | poza MVP |
| Etap sprzedaży (old) | Stary proces sprzedażowy | do uzupełnienia | nie używać bez potwierdzenia |

## Metoda pobrania przez API

Do pobrania listy pipeline'ów użyjemy:

```text
crm.category.list
```

Payload:

```json
{
  "entityTypeId": 2
}
```

Wynik wpisujemy do tabeli powyżej.

---

# Stage mapping

## Kandydat na etap startowy

Na screenach widoczny jest etap:

```text
Nowy lead
```

To jest najlepszy kandydat na etap startowy dla zapytań z kalkulatora.

## Etapy sprzedaży widoczne na screenach

| Nazwa etapu | Przeznaczenie | stageId | Użycie w aplikacji |
|---|---|---|---|
| Nowy lead | Nowe zapytanie z kalkulatora | do uzupełnienia | tak |
| Brak kontaktu | Brak kontaktu z klientem | do uzupełnienia | nie w MVP |
| Kontakt nawiązany | Pierwszy kontakt | do uzupełnienia | później |
| Oczekiwanie na zdjęcia | Klient ma dosłać zdjęcia | do uzupełnienia | później |
| Zakwalifikowany lead | Lead zakwalifikowany | do uzupełnienia | później |
| Brak kontaktu po kwalifikacji | Brak kontaktu po wstępnej kwalifikacji | do uzupełnienia | później |
| Pomiar | Etap pomiaru | do uzupełnienia | później |
| Oferta wysłana | Oferta wysłana do klienta | do uzupełnienia | później |
| Proforma wysłana | Proforma wysłana | do uzupełnienia | później |
| Odroczony: termin | Klient odracza ze względu na termin | do uzupełnienia | nie w MVP |
| Odroczony: budżet | Klient odracza ze względu na budżet | do uzupełnienia | nie w MVP |
| Zła kwalifikacja | Lead niepasujący | do uzupełnienia | nie w MVP |

## Decyzja MVP

Nowe zapytanie z kalkulatora trafia do:

```text
Pipeline: Etap sprzedaży z pomiarem
Stage: Nowy lead
```

Technicznie:

```env
BITRIX24_DEFAULT_CATEGORY_ID=do_uzupełnienia
BITRIX24_DEFAULT_STAGE_ID=do_uzupełnienia
```

---

# User / assignedById mapping

## Cel

Każdy deal może mieć przypisanego opiekuna.

Musimy ustalić, do którego użytkownika mają trafiać nowe zapytania z kalkulatora.

## Tabela do uzupełnienia

| Użytkownik | Rola | assignedById | Użycie |
|---|---|---:|---|
| do uzupełnienia | Domyślny opiekun zapytań ze strony | do uzupełnienia | MVP |
| do uzupełnienia | Handlowiec | do uzupełnienia | później |
| do uzupełnienia | Administrator | do uzupełnienia | później |

## Decyzja MVP

Na start ustawiamy jednego domyślnego opiekuna:

```env
BITRIX24_ASSIGNED_BY_ID=do_uzupełnienia
```

---

# Custom fields mapping

## Cel

Custom fields pozwalają przechowywać w Bitrix24 dane z kalkulatora w formie łatwej do filtrowania.

Nie wszystkie dane konfiguracji muszą być osobnymi polami.

## MVP

W MVP dane konfiguracji mogą trafić do:

```text
comments
```

czyli do opisu deala.

Dodatkowo warto mieć kilka pól własnych:

| Pole biznesowe | Przeznaczenie | Bitrix field code | Wymagane w MVP |
|---|---|---|---|
| ID zapytania ze strony | Powiązanie Bitrix24 z lokalnym inquiry ID | do uzupełnienia | tak |
| Źródło | Np. `calculator` | do uzupełnienia | tak |
| Typ produktu | `Zadaszenie tarasu` / `Ogród zimowy` | do uzupełnienia | tak |
| Wymiar | Np. `300 x 306 cm` | do uzupełnienia | tak |
| Łączna cena brutto | Cena z kalkulatora | do uzupełnienia | opcjonalnie |
| Konfiguracja JSON | Pełny snapshot konfiguracji | do uzupełnienia | opcjonalnie |
| Link do konfiguracji | Link do odtworzenia konfiguracji | do uzupełnienia | później |

## Metoda pobrania pól przez API

Do pobrania pól deala użyjemy:

```text
crm.item.fields
```

Payload:

```json
{
  "entityTypeId": 2
}
```

Po pobraniu pól uzupełniamy kolumnę:

```text
Bitrix field code
```

---

# Deal fields mapping

## Cel

Mapowanie pól naszego `StoredCalculatorInquiryLead` na pola deala Bitrix24.

| Nasz system | Bitrix24 field | Źródło |
|---|---|---|
| `customer.name` | `title` albo contact name | formularz |
| `customer.email` | contact email albo comments | formularz |
| `customer.phone` | contact phone albo comments | formularz |
| `customer.message` | `comments` | formularz |
| `quote.totalGross` | `opportunity` | Pricing Engine |
| `quote.currency` | `currencyId` | Pricing Engine |
| product kind | custom field albo comments | konfiguracja |
| dimensions | custom field albo comments | konfiguracja |
| quote items | product rows | Pricing Engine |
| inquiry id | custom field albo comments | handler zapytania |

## Decyzja MVP

W MVP deal powinien otrzymać:

```text
title
opportunity
currencyId
categoryId
stageId
assignedById
sourceId
comments
productRows
```

---

# Product catalog mapping

## Co wiemy ze screenów

Na screenach widać katalog produktów Bitrix24 z kategoriami podobnymi do naszego Pricing Engine:

```text
DODATKI
FUNDAMENT
MARKIZA
OGRÓD ZIMOWY
OŚWIETLENIE
POKRYCIE DACHU
ROLETY BOCZNE
SYSTEMY PRZESUWNE
SZYBY BOCZNE
TRÓJKĄTY BOCZNE
ZADASZENIE TARASU
```

To potwierdza, że docelowo powinniśmy mapować pozycje z `QuoteItem` na produkty Bitrix24.

---

## Kategorie w naszym systemie

| QuoteItem category | Znaczenie |
|---|---|
| `construction` | Konstrukcja |
| `roof` | Pokrycie dachu |
| `walls` | Ściany / system przesuwny |
| `zip` | Rolety ZIP |
| `awning` | Markiza |
| `lighting` | LED / COB |
| `accessory` | Dodatki |
| `installation` | Montaż |

---

## Docelowe mapowanie kategorii

| QuoteItem category | Sekcja Bitrix24 | Status |
|---|---|---|
| `construction` | `ZADASZENIE TARASU` albo `OGRÓD ZIMOWY` | do uzupełnienia |
| `roof` | `POKRYCIE DACHU` | do uzupełnienia |
| `walls` | `SYSTEMY PRZESUWNE` / `SZYBY BOCZNE` | do uzupełnienia |
| `zip` | `ROLETY BOCZNE` | do uzupełnienia |
| `awning` | `MARKIZA` | do uzupełnienia |
| `lighting` | `OŚWIETLENIE` | do uzupełnienia |
| `accessory` | `DODATKI` / `FUNDAMENT` | do uzupełnienia |
| `installation` | `MONTAŻ` / kategoria montażowa | do uzupełnienia |

---

# Product IDs

## Cel

Musimy pobrać pełną listę produktów z Bitrix24 i przypisać je do pozycji kalkulatora.

## Przykłady widoczne na screenach

Ze screenów widać przykładowe produkty i ID, ale nie traktujemy ich jako pełnej mapy.

| Bitrix product ID | Nazwa produktu | Cena | Uwagi |
|---:|---|---:|---|
| 14701 | Szkło dachowe przyciemnione (NA WYMIAR) 400x706 cm | 13895 | fragment katalogu |
| 14601 | Szkło dachowe mleczne (NA WYMIAR) 400x706 cm | 13895 | fragment katalogu |
| 14465 | Szkło dachowe bezbarwne (NA WYMIAR) 400x706 cm | 12445 | fragment katalogu |
| 13123 | Szkło dachowe przyciemnione 400x706 cm | 9925 | fragment katalogu |
| 13023 | Szkło dachowe mleczne 400x706 cm | 9925 | fragment katalogu |
| 12923 | Szkło dachowe bezbarwne 400x706 cm | 8889 | fragment katalogu |
| 12823 | Poliwęglan SZARY 400x706 cm | 493 | fragment katalogu |
| 12723 | Poliwęglan MLECZNY 400x706 cm | 431 | fragment katalogu |
| 12623 | Poliwęglan DYMIONY 400x706 cm | 493 | fragment katalogu |
| 14323 | Szczotka przeciwkurzowa (dodatkowa) | 53 | fragment katalogu |
| 14319 | Uchwyt do szyb ściennych (dodatkowy) | 48 | fragment katalogu |

## Decyzja

Pełną mapę produktów pobieramy z API.

Screeny służą jako potwierdzenie struktury katalogu, nie jako finalna baza danych.

---

# Product rows mapping

## Cel

`QuoteItem` z aplikacji powinien zostać zamieniony na `Bitrix24ProductRow`.

## Obecny stan

Obecnie mapper może wysyłać:

```text
productName
price
quantity
sort
```

## Docelowy stan

Docelowo product row powinien mieć:

```text
productId
productName
price netto albo brutto zgodnie z ustaleniami
quantity
taxRate
taxIncluded
sort
```

## Otwarta decyzja

Do potwierdzenia na portalu Bitrix24:

```text
Czy product row może działać poprawnie bez productId, tylko z productName?
Czy dokumenty wymagają productId z katalogu?
Czy VAT ma być pobierany z produktu, czy ustawiany w product row?
```

---

# VAT mapping

## Co wiemy ze screenów

Na screenach dokumenty Bitrix24 pokazują układ:

```text
Cena netto
VAT %
Cena brutto
```

W produktach deala widać kolumny podatku.

Najczęściej pojawia się VAT:

```text
8%
```

ale na screenach są też ślady innych wartości, więc nie zakładamy jednej stałej reguły bez testu.

---

## Decyzja robocza

Na stronie pokazujemy klientowi ceny brutto.

Do Bitrix24 prawdopodobnie trzeba wysłać:

```text
cena netto
VAT %
taxIncluded = false
```

albo ustawić product row tak, aby Bitrix24 poprawnie rozpoznał cenę brutto.

Tę decyzję trzeba potwierdzić testem na portalu Bitrix24.

---

## Docelowe pola VAT w Excelu

W arkuszu `app_vat_rules` oraz `app_bitrix_product_mapping` powinny być pola:

```text
vat_rate
tax_included
price_mode
```

---

# Excel mapping

Excel jest źródłem prawdy dla cennika i mapowania produktów.

Najważniejsza zakładka dla Bitrix24:

```text
app_bitrix_product_mapping
```

Minimalne kolumny:

```text
quote_item_category
quote_item_key
product_kind
width_cm
length_cm
option_code
bitrix_product_id
bitrix_product_name
bitrix_section_name
vat_rate
tax_included
active
```

---

# API inspection plan

Po utworzeniu webhooka Bitrix24 przygotujemy lokalny skrypt:

```text
npm run bitrix:inspect
```

Skrypt powinien pobrać:

1. listę pipeline'ów,
2. listę etapów,
3. listę pól deala,
4. listę użytkowników,
5. listę produktów,
6. listę sekcji produktów,
7. reguły VAT,
8. dostępne pola product rows.

Wynik zapisujemy do dokumentacji albo plików roboczych.

---

# Dane do pobrania przez API

## Pipeline'y

| Dane | Metoda | Status |
|---|---|---|
| Lista pipeline'ów deal | `crm.category.list` | do wykonania |

Payload:

```json
{
  "entityTypeId": 2
}
```

---

## Pola deala

| Dane | Metoda | Status |
|---|---|---|
| Lista pól deala | `crm.item.fields` | do wykonania |

Payload:

```json
{
  "entityTypeId": 2
}
```

---

## Produkty

| Dane | Metoda | Status |
|---|---|---|
| Lista produktów | do potwierdzenia metodą katalogową | do wykonania |
| Lista sekcji produktów | do potwierdzenia metodą katalogową | do wykonania |
| VAT produktów | do potwierdzenia metodą katalogową | do wykonania |

---

## Product rows

| Dane | Metoda | Status |
|---|---|---|
| Test ustawienia product rows | `crm.item.productrow.set` | do wykonania |

---

# Testy integracji Bitrix24

## Test 1 — utworzenie deala bez product rows

Cel:

```text
Sprawdzić, czy aplikacja tworzy deal w poprawnym pipeline i stage.
```

Oczekiwany wynik:

```text
Deal pojawia się w „Etap sprzedaży z pomiarem” na etapie „Nowy lead”.
```

---

## Test 2 — utworzenie deala z product rows po nazwie

Cel:

```text
Sprawdzić, czy Bitrix24 akceptuje product rows bez productId.
```

Oczekiwany wynik:

```text
Deal ma pozycje produktowe z nazwą, ceną i ilością.
```

---

## Test 3 — dokument z product rows po nazwie

Cel:

```text
Sprawdzić, czy dokument Bitrix24 generuje się poprawnie, gdy product rows nie mają productId.
```

Oczekiwany wynik:

```text
Proforma/specyfikacja pokazuje poprawne nazwy, ceny, VAT i sumę.
```

---

## Test 4 — product rows z productId

Cel:

```text
Sprawdzić docelowe mapowanie do katalogu produktów.
```

Oczekiwany wynik:

```text
Deal ma produkty powiązane z katalogiem Bitrix24.
Dokumenty generują się poprawnie.
```

---

## Test 5 — VAT

Cel:

```text
Sprawdzić, czy do Bitrix24 wysyłamy netto, brutto, taxRate i taxIncluded we właściwy sposób.
```

Przypadki testowe:

| Wariant | Oczekiwany wynik |
|---|---|
| Cena netto + VAT 8% | Dokument pokazuje poprawne brutto |
| Cena brutto + taxIncluded | Dokument nie dolicza VAT drugi raz |
| Montaż | Potwierdzona stawka VAT dla montażu |

---

# Decyzje MVP

1. Nowe zapytania trafiają do pipeline'u sprzedażowego.
2. Domyślny etap startowy to „Nowy lead”.
3. W MVP deal zawiera opis konfiguracji w `comments`.
4. Product rows są wymagane docelowo, ponieważ dokumenty Bitrix24 bazują na produktach.
5. Mapowanie produktów będzie trzymane w Excelu.
6. VAT musi być jawnie obsłużony.
7. Nie budujemy własnego CRM.
8. Lokalny `/admin/leady` zostaje panelem developerskim.
9. Realizacja i dokumenty pozostają w Bitrix24.

---

# Otwarte pytania

1. Jaki jest `categoryId` pipeline'u „Etap sprzedaży z pomiarem”?
2. Jaki jest `stageId` etapu „Nowy lead”?
3. Kto ma być domyślnym opiekunem nowych zapytań?
4. Jakie pola własne istnieją już w portalu?
5. Jakie nowe pola własne trzeba dodać?
6. Czy product rows bez `productId` wystarczą do dokumentów?
7. Czy wszystkie pozycje muszą być mapowane do katalogu produktów?
8. Czy VAT jest pobierany z katalogu produktu, czy ustawiany na product row?
9. Jaką stawkę VAT ma montaż?
10. Czy dokumenty wymagają dodatkowych pól oprócz product rows?
11. Czy katalog produktów w Bitrix24 ma być synchronizowany z Excelem?
12. Czy Excel ma przechowywać `bitrix_product_id`, czy mapowanie ma być generowane automatycznie po nazwach?

---

# Checklist przed aktywacją integracji

Przed ustawieniem:

```env
CALCULATOR_INQUIRY_REPOSITORY=bitrix24
```

albo:

```env
CALCULATOR_INQUIRY_REPOSITORY=hybrid
```

trzeba wykonać:

- [ ] utworzyć / uzyskać dostęp do portalu Bitrix24,
- [ ] utworzyć webhook,
- [ ] pobrać `categoryId`,
- [ ] pobrać `stageId`,
- [ ] pobrać `assignedById`,
- [ ] pobrać listę pól deala,
- [ ] sprawdzić pola własne,
- [ ] pobrać katalog produktów,
- [ ] sprawdzić product rows,
- [ ] sprawdzić VAT,
- [ ] wykonać testowego deala,
- [ ] wykonać testowy dokument,
- [ ] uzupełnić `.env.local`,
- [ ] uzupełnić ten dokument realnymi wartościami.

---

# Developerski endpoint metadata

W aplikacji został przygotowany developerski endpoint:

```text
GET /api/dev/bitrix24/metadata
```

Endpoint służy do pobrania podstawowych danych technicznych z portalu Bitrix24.

## Cel endpointu

Endpoint ma pomóc ustalić realne wartości potrzebne do integracji:

- `categoryId` pipeline'u sprzedażowego,
- `stageId` etapu startowego,
- pola deala,
- pola własne,
- strukturę etapów,
- sugerowane wartości `.env.local`.

Nie zgadujemy tych wartości ręcznie.

Pobieramy je z konkretnego portalu Bitrix24.

---

# Wymagana konfiguracja lokalna

Aby endpoint działał z prawdziwym Bitrix24, w lokalnym pliku:

```text
app/.env.local
```

należy ustawić:

```env
BITRIX24_ENABLED=true
BITRIX24_WEBHOOK_URL=https://twoj-portal.bitrix24.pl/rest/USER_ID/WEBHOOK_CODE
BITRIX24_DEAL_ENTITY_TYPE_ID=2
```

Pliku `.env.local` nie commitujemy.

---

# Zachowanie bez konfiguracji Bitrix24

Jeżeli Bitrix24 jest wyłączony, endpoint zwraca kontrolowany komunikat:

```json
{
  "success": false,
  "message": "Bitrix24 integration is disabled. Set BITRIX24_ENABLED=true and BITRIX24_WEBHOOK_URL in .env.local."
}
```

To jest poprawne zachowanie w trybie lokalnym.

---

# Jak użyć endpointu

Po ustawieniu webhooka należy uruchomić aplikację:

```bash
cd C:\Projects\glass-system-web\app
npm run dev
```

Następnie wejść w przeglądarce:

```text
http://localhost:3000/api/dev/bitrix24/metadata
```

Oczekiwany wynik po poprawnej konfiguracji:

```text
success: true
metadata.categories
metadata.stageGroups
metadata.fields
metadata.suggestedEnv
```

---

# Dane zwracane przez endpoint

## `metadata.categories`

Lista pipeline'ów / lejków CRM dla dealów.

Na podstawie screenów szukamy pipeline'u:

```text
Etap sprzedaży z pomiarem
```

Z tej sekcji pobierzemy:

```env
BITRIX24_DEFAULT_CATEGORY_ID=...
```

---

## `metadata.stageGroups`

Lista etapów dla każdego pipeline'u.

Na podstawie screenów szukamy etapu:

```text
Nowy lead
```

Z tej sekcji pobierzemy:

```env
BITRIX24_DEFAULT_STAGE_ID=...
```

---

## `metadata.fields`

Lista pól deala.

Tutaj szukamy między innymi:

- standardowych pól Bitrix24,
- pól własnych,
- kodów `UF_CRM_*` albo `ufCrm_*`,
- pól wymaganych przez dokumenty.

---

## `metadata.suggestedEnv`

Wstępna sugestia wartości `.env.local`.

Uwaga: wartości z `suggestedEnv` trzeba sprawdzić ręcznie, bo endpoint może wybrać pierwszy pipeline i pierwszy stage, a niekoniecznie właściwy proces sprzedażowy.

---

# Aktualny status

Endpoint został przetestowany lokalnie bez aktywnego Bitrix24.

Wynik:

```json
{
  "success": false,
  "message": "Bitrix24 integration is disabled. Set BITRIX24_ENABLED=true and BITRIX24_WEBHOOK_URL in .env.local."
}
```

Status testu:

```text
OK — endpoint działa bezpiecznie i nie wysypuje aplikacji, gdy Bitrix24 jest wyłączony.
```

---

# Kolejne kroki po otrzymaniu webhooka

1. Ustawić `BITRIX24_ENABLED=true`.
2. Ustawić `BITRIX24_WEBHOOK_URL`.
3. Uruchomić `/api/dev/bitrix24/metadata`.
4. Odszukać pipeline `Etap sprzedaży z pomiarem`.
5. Odszukać etap `Nowy lead`.
6. Uzupełnić `.env.local`.
7. Uzupełnić ten dokument realnymi wartościami.
8. Wykonać test utworzenia deala.
9. Wykonać test dodania product rows.
10. Sprawdzić VAT i dokumenty.
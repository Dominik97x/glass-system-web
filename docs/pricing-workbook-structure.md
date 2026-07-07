# Struktura pliku Excel z cennikiem

## Cel dokumentu

Ten dokument opisuje docelową strukturę pliku Excel, który ma być głównym źródłem prawdy dla cennika Glass System.

Dokument uzupełnia decyzję opisaną w `pricing-source-strategy.md`.

Najważniejsza zasada:

> Excel jest źródłem prawdy dla cennika, ale aplikacja nie powinna czytać chaotycznych, kolorowych tabel roboczych. Aplikacja powinna czytać tylko uporządkowane zakładki techniczne `app_*`.

---

# Założenia główne

1. Plik Excel jest edytowany przez osobę biznesową.
2. Aplikacja importuje dane z technicznych zakładek Excela.
3. Arkusze robocze mogą być wygodne dla człowieka.
4. Arkusze techniczne muszą być stabilne, przewidywalne i łatwe do walidacji.
5. Strona nie odpytuje Excela przy każdym kliknięciu w kalkulatorze.
6. System importuje Excel, waliduje dane i publikuje ostatni poprawny snapshot cennika.
7. Bitrix24 otrzymuje gotową wycenę oraz product rows.
8. Excel zawiera również mapowanie pozycji kalkulatora na produkty Bitrix24.

---

# Podział pliku Excel

Docelowy plik Excel powinien mieć dwie warstwy zakładek.

## 1. Zakładki robocze

Zakładki robocze są przeznaczone dla ludzi.

Mogą zawierać:

- kolory,
- komentarze,
- grupowanie sekcji,
- stare tabele z cennik źródłowy,
- pomocnicze kalkulacje,
- dane kosztowe,
- tabele produkcyjne,
- tabele montażowe.

Przykładowe nazwy:

| Zakładka | Opis |
|---|---|
| `raw_macierz_cen` | Oryginalna / robocza macierz cen |
| `raw_koszty_rentownosc` | Tabele kosztów, zakupów, marż i rentowności |
| `raw_bom` | Tabele materiałowe i produkcyjne |
| `raw_montaz` | Tabele montażowe i dopłaty |
| `raw_notatki` | Notatki i wyjaśnienia |

Aplikacja nie powinna opierać działania bezpośrednio na tych zakładkach.

---

## 2. Zakładki techniczne `app_*`

Zakładki techniczne są przeznaczone dla aplikacji.

Muszą być proste, płaskie i stabilne.

Przykładowe zakładki:

| Zakładka | Przeznaczenie |
|---|---|
| `app_metadata` | Wersja cennika, waluta, tryb cen, data publikacji |
| `app_dimensions` | Lista obsługiwanych wymiarów |
| `app_price_matrix` | Główna macierz cen sprzedażowych |
| `app_roof_prices` | Ceny / dopłaty pokryć dachowych |
| `app_wall_prices` | Ceny ścian przesuwnych |
| `app_zip_prices` | Ceny rolet ZIP |
| `app_awning_prices` | Ceny markiz |
| `app_led_prices` | Ceny oświetlenia |
| `app_accessory_prices` | Ceny dodatków |
| `app_installation_prices` | Ceny montażu |
| `app_vat_rules` | Reguły VAT |
| `app_bitrix_product_mapping` | Mapowanie pozycji kalkulatora na produkty Bitrix24 |

---

# Zasady dla zakładek technicznych

Każda zakładka `app_*` musi spełniać poniższe zasady:

1. Pierwszy wiersz zawiera nagłówki kolumn.
2. Nazwy kolumn nie powinny się zmieniać bez aktualizacji importera.
3. Nie używamy scalonych komórek.
4. Nie używamy pustych nagłówków.
5. Nie używamy kolorów jako źródła logiki.
6. Nie używamy dopisków w komórkach z ceną.
7. Ceny są liczbami, bez tekstu `zł`.
8. Wymiary są liczbami w centymetrach.
9. Opcje mają stabilne kody techniczne, np. `glass_clear`, `polycarbonate_milky`.
10. Każdy rekord powinien mieć kolumnę `active`.
11. Nie usuwamy historycznych pozycji bez potrzeby — można oznaczyć `active = false`.
12. Każda zmiana struktury powinna zwiększyć wersję w `app_metadata`.

---

# Konwencje wartości

## Boolean

Dla wartości logicznych używamy:

| Wartość | Znaczenie |
|---|---|
| `TRUE` | aktywne / tak |
| `FALSE` | nieaktywne / nie |

---

## Waluta

Domyślna waluta:

| Pole | Wartość |
|---|---|
| `currency` | `PLN` |

---

## Tryb cen

Ceny w kalkulatorze są obecnie traktowane jako brutto.

Docelowo Excel musi jasno określać, czy dana cena jest brutto czy netto.

| Pole | Przykład |
|---|---|
| `price_mode` | `gross` |
| `vat_rate` | `8` |
| `tax_included` | `TRUE` albo `FALSE` |

Na stronie klient widzi ceny brutto.

Do Bitrix24 prawdopodobnie będziemy wysyłać ceny netto + VAT, ale ta decyzja wymaga potwierdzenia testem na portalu Bitrix24.

---

# Zakładka `app_metadata`

## Cel

Zakładka przechowuje ogólne informacje o pliku cennika.

## Kolumny

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `key` | text | tak | Klucz ustawienia |
| `value` | text | tak | Wartość |
| `description` | text | nie | Opis dla człowieka |

## Wymagane rekordy

| key | Przykładowa wartość | Opis |
|---|---|---|
| `workbook_version` | `1` | Wersja struktury arkusza |
| `pricing_version` | `2026-07-03` | Wersja cennika |
| `currency` | `PLN` | Waluta cennika |
| `default_price_mode` | `gross` | Domyślny tryb cen |
| `default_vat_rate` | `8` | Domyślna stawka VAT |
| `source` | `Excel Online` | Źródło cennika |
| `published_by` | `manual` | Kto / co publikuje cennik |
| `notes` | `MVP` | Notatki |

---

# Zakładka `app_dimensions`

## Cel

Zakładka definiuje obsługiwane wymiary konstrukcji.

To pozwala walidatorowi sprawdzić, czy wszystkie tabele cenowe zawierają komplet wymiarów.

## Kolumny

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `width_cm` | number | tak | Szerokość w cm |
| `length_cm` | number | tak | Długość / wysunięcie w cm |
| `label` | text | tak | Etykieta, np. `300 x 306 cm` |
| `series` | text | nie | Seria, np. `SERIA PRO 300-400` |
| `active` | boolean | tak | Czy wymiar jest dostępny |

## Przykład

| width_cm | length_cm | label | series | active |
|---:|---:|---|---|---|
| 306 | 300 | `300 x 306 cm` | `SERIA PRO 300-400` | TRUE |
| 406 | 300 | `300 x 406 cm` | `SERIA PRO 300-400` | TRUE |
| 506 | 300 | `300 x 506 cm` | `SERIA PRO 300-400` | TRUE |

Uwaga: w naszym modelu domenowym `width` odpowiada wartości 306/406/506, a `length` odpowiada wartości 300/350/400/450/500.

---

# Zakładka `app_price_matrix`

## Cel

Główna macierz cen sprzedażowych.

To najważniejsza zakładka dla MVP kalkulatora.

Powinna odpowiadać uproszczonej różowej tabeli, którą testowaliśmy z kalkulatorem.

## Kolumny

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `width_cm` | number | tak | Szerokość w cm |
| `length_cm` | number | tak | Długość / wysunięcie w cm |
| `construction_gross` | number | tak | Cena bazowa zadaszenia tarasu |
| `wall_glass_clear_gross` | number | tak | Ściany szklane przezroczyste |
| `wall_glass_tinted_gross` | number | tak | Ściany/szyby barwione lub przyciemniane |
| `roof_polycarbonate_tinted_gross` | number | tak | Poliwęglan barwiony / dymiony |
| `roof_polycarbonate_clear_gross` | number | tak | Poliwęglan przezroczysty |
| `roof_glass_tinted_gross` | number | tak | Szkło dachowe barwione / przyciemniane |
| `zip_right_gross` | number | tak | Roleta prawa |
| `zip_left_gross` | number | tak | Roleta lewa |
| `zip_front_gross` | number | tak | Roleta przednia |
| `awning_gross` | number | tak | Markiza |
| `leveling_profile_gross` | number | tak | Wyrównanie podłoża / profile |
| `led_spot_gross` | number | tak | LED punktowe |
| `led_strip_gross` | number | tak | LED taśma |
| `handles_gross` | number | tak | Uchwyty |
| `brushes_gross` | number | tak | Szczotki |
| `active` | boolean | tak | Czy rekord jest aktywny |

## Uwagi

Ta zakładka może być początkowym źródłem wszystkich danych MVP.

W przyszłości możemy rozbić ją na bardziej szczegółowe zakładki, ale dla pierwszego importera jedna płaska macierz będzie najłatwiejsza i najbezpieczniejsza.

---

# Zakładka `app_roof_prices`

## Cel

Zakładka dla bardziej szczegółowego modelowania cen dachu.

Może zostać użyta później, jeśli `app_price_matrix` okaże się zbyt uproszczona.

## Kolumny

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `width_cm` | number | tak | Szerokość |
| `length_cm` | number | tak | Długość |
| `roof_option` | text | tak | Kod opcji dachu |
| `price_gross` | number | tak | Cena brutto |
| `price_net` | number | nie | Cena netto |
| `vat_rate` | number | nie | VAT |
| `active` | boolean | tak | Czy pozycja aktywna |

## Obsługiwane kody

| roof_option | Znaczenie |
|---|---|
| `polycarbonate_clear` | Poliwęglan przezroczysty |
| `polycarbonate_milky` | Poliwęglan mleczny |
| `polycarbonate_grey` | Poliwęglan szary |
| `polycarbonate_smoke` | Poliwęglan dymiony |
| `glass_clear` | Szkło przezroczyste |
| `glass_milky` | Szkło mleczne |
| `glass_tinted` | Szkło przyciemniane |

---

# Zakładka `app_wall_prices`

## Cel

Zakładka dla cen ścian przesuwnych.

## Kolumny

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `width_cm` | number | tak | Szerokość |
| `length_cm` | number | tak | Długość |
| `wall_option` | text | tak | Kod ścian |
| `price_gross` | number | tak | Cena brutto |
| `price_net` | number | nie | Cena netto |
| `vat_rate` | number | nie | VAT |
| `active` | boolean | tak | Czy pozycja aktywna |

## Obsługiwane kody

| wall_option | Znaczenie |
|---|---|
| `none` | Brak ścian |
| `glass_clear` | Szyby przezroczyste |
| `glass_milky` | Szyby mleczne |
| `glass_tinted` | Szyby przyciemniane / barwione |

---

# Zakładka `app_zip_prices`

## Cel

Zakładka dla rolet ZIP.

## Kolumny

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `width_cm` | number | tak | Szerokość |
| `length_cm` | number | tak | Długość |
| `position` | text | tak | Pozycja rolety |
| `price_gross` | number | tak | Cena brutto |
| `price_net` | number | nie | Cena netto |
| `vat_rate` | number | nie | VAT |
| `requires_walls` | boolean | tak | Czy wymaga ścian |
| `active` | boolean | tak | Czy pozycja aktywna |

## Obsługiwane pozycje

| position | Znaczenie |
|---|---|
| `left` | Roleta lewa |
| `right` | Roleta prawa |
| `front` | Roleta przednia |

## Reguła biznesowa

Rolety ZIP są dostępne tylko wtedy, gdy konfiguracja posiada ściany.

---

# Zakładka `app_awning_prices`

## Cel

Zakładka dla markiz.

## Kolumny

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `width_cm` | number | tak | Szerokość |
| `length_cm` | number | tak | Długość |
| `price_gross` | number | tak | Cena brutto |
| `price_net` | number | nie | Cena netto |
| `vat_rate` | number | nie | VAT |
| `active` | boolean | tak | Czy pozycja aktywna |

---

# Zakładka `app_led_prices`

## Cel

Zakładka dla oświetlenia.

## Kolumny

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `width_cm` | number | tak | Szerokość |
| `length_cm` | number | tak | Długość |
| `led_type` | text | tak | Typ oświetlenia |
| `price_gross` | number | tak | Cena brutto |
| `price_net` | number | nie | Cena netto |
| `vat_rate` | number | nie | VAT |
| `active` | boolean | tak | Czy pozycja aktywna |

## Obsługiwane typy

| led_type | Znaczenie |
|---|---|
| `spot` | LED punktowe |
| `strip` | LED taśma |
| `cob` | Taśma COB |

## Otwarte pytanie

Do potwierdzenia: czy LED punktowe i LED taśma/COB mogą być wybrane razem, czy klient powinien wybrać tylko jeden wariant.

---

# Zakładka `app_accessory_prices`

## Cel

Zakładka dla dodatków.

## Kolumny

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `width_cm` | number | nie | Szerokość, jeśli cena zależy od wymiaru |
| `length_cm` | number | nie | Długość, jeśli cena zależy od wymiaru |
| `accessory_type` | text | tak | Typ dodatku |
| `price_gross` | number | tak | Cena brutto |
| `price_net` | number | nie | Cena netto |
| `vat_rate` | number | nie | VAT |
| `active` | boolean | tak | Czy pozycja aktywna |

## Obsługiwane typy

| accessory_type | Znaczenie |
|---|---|
| `handles` | Uchwyty |
| `brushes` | Szczotki |
| `leveling_profile` | Wyrównanie podłoża / profile |
| `foundation` | Fundament |
| `extra_rafter` | Dodatkowa krokiew |
| `extra_post` | Dodatkowy słup |
| `cap` | Zaślepka |

---

# Zakładka `app_installation_prices`

## Cel

Zakładka dla montażu.

Nie jest wymagana w MVP publicznego kalkulatora, ale powinna być przewidziana, ponieważ Bitrix24 i dokumenty zawierają pozycje montażowe.

## Kolumny

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `width_cm` | number | tak | Szerokość |
| `length_cm` | number | tak | Długość |
| `installation_type` | text | tak | Typ montażu |
| `price_gross` | number | nie | Cena brutto dla klienta |
| `price_net` | number | nie | Cena netto |
| `crew_cost` | number | nie | Koszt / wynagrodzenie ekipy |
| `vat_rate` | number | nie | VAT |
| `active` | boolean | tak | Czy pozycja aktywna |

## Obsługiwane typy

| installation_type | Znaczenie |
|---|---|
| `terrace_roof_polycarbonate` | Montaż zadaszenia z poliwęglanem |
| `terrace_roof_glass` | Montaż zadaszenia ze szkłem |
| `winter_garden_polycarbonate` | Montaż ogrodu z dachem poliwęglanowym |
| `winter_garden_glass` | Montaż ogrodu z dachem szklanym |
| `awning` | Montaż markizy |
| `zip` | Montaż rolety |
| `led` | Montaż LED |
| `foundation_preparation` | Przygotowanie podłoża / fundamentu |

---

# Zakładka `app_vat_rules`

## Cel

Zakładka definiuje reguły VAT dla kategorii produktów.

Na screenach z Bitrix24 widać, że dokumenty korzystają z układu netto + VAT + brutto.

Dlatego VAT musi być jawnie opisany, a nie zaszyty przypadkowo w kodzie.

## Kolumny

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `quote_item_category` | text | tak | Kategoria pozycji |
| `vat_rate` | number | tak | Stawka VAT |
| `tax_included` | boolean | tak | Czy cena zawiera VAT |
| `price_mode` | text | tak | `gross` albo `net` |
| `active` | boolean | tak | Czy reguła aktywna |

## Przykład

| quote_item_category | vat_rate | tax_included | price_mode | active |
|---|---:|---|---|---|
| `construction` | 8 | TRUE | `gross` | TRUE |
| `roof` | 8 | TRUE | `gross` | TRUE |
| `walls` | 8 | TRUE | `gross` | TRUE |
| `zip` | 8 | TRUE | `gross` | TRUE |
| `awning` | 8 | TRUE | `gross` | TRUE |
| `lighting` | 8 | TRUE | `gross` | TRUE |
| `accessory` | 8 | TRUE | `gross` | TRUE |
| `installation` | 8 | TRUE | `gross` | TRUE |

## Otwarte pytanie

Do potwierdzenia: czy montaż w Bitrix24 zawsze ma VAT 8%, czy czasami 0% albo inny sposób rozliczania.

---

# Zakładka `app_bitrix_product_mapping`

## Cel

Zakładka mapuje pozycje z kalkulatora na produkty Bitrix24.

To bardzo ważne, ponieważ screeny z Bitrix24 pokazują, że dokumenty są generowane z product rows przypisanych do deala.

## Kolumny

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `quote_item_category` | text | tak | Kategoria pozycji w naszym systemie |
| `quote_item_key` | text | tak | Klucz pozycji |
| `product_kind` | text | nie | `terrace_roof` albo `winter_garden` |
| `width_cm` | number | nie | Szerokość, jeśli produkt zależy od wymiaru |
| `length_cm` | number | nie | Długość, jeśli produkt zależy od wymiaru |
| `option_code` | text | nie | Kod opcji |
| `bitrix_product_id` | number | nie | ID produktu w Bitrix24 |
| `bitrix_product_name` | text | tak | Nazwa produktu w Bitrix24 |
| `bitrix_section_name` | text | nie | Sekcja katalogu Bitrix24 |
| `vat_rate` | number | tak | VAT dla pozycji |
| `tax_included` | boolean | tak | Czy cena zawiera VAT |
| `active` | boolean | tak | Czy mapowanie aktywne |

## Przykład

| quote_item_category | quote_item_key | product_kind | width_cm | length_cm | option_code | bitrix_product_id | bitrix_product_name | bitrix_section_name | vat_rate | tax_included | active |
|---|---|---|---:|---:|---|---:|---|---|---:|---|---|
| `construction` | `construction` | `winter_garden` | 1006 | 300 | `default` |  | `Ogród zimowy 300x1006 cm` | `OGRÓD ZIMOWY (KONSTRUKCJA)` | 8 | TRUE | TRUE |
| `roof` | `roof_glass_tinted` | `winter_garden` | 1006 | 300 | `glass_tinted` |  | `Szkło dachowe przyciemnione 300x1006 cm` | `POKRYCIE DACHU` | 8 | TRUE | TRUE |
| `awning` | `awning` | `winter_garden` | 1006 | 300 | `default` |  | `Markiza dachowa 300x1006 cm` | `MARKIZA` | 8 | TRUE | TRUE |
| `lighting` | `led_cob` | `winter_garden` | 1006 | 300 | `cob` |  | `Oświetlenie LED (taśma COB) 300x1006 cm` | `OŚWIETLENIE / COB` | 8 | TRUE | TRUE |

## Uwagi

Na początku `bitrix_product_id` może być puste, jeśli nie znamy jeszcze pełnej mapy produktów.

Po pobraniu katalogu Bitrix24 przez API uzupełnimy ID produktów.

Docelowo importer powinien walidować, czy każda pozycja generowana przez Pricing Engine ma mapowanie do Bitrix24.

---

# Walidacja importu

Importer Excela powinien sprawdzać:

1. Czy istnieją wszystkie wymagane zakładki.
2. Czy zakładki mają wymagane kolumny.
3. Czy wszystkie ceny są liczbami.
4. Czy ceny nie są ujemne.
5. Czy wszystkie wymiary z `app_dimensions` są obecne w `app_price_matrix`.
6. Czy kody opcji są zgodne z domeną aplikacji.
7. Czy waluta jest `PLN`.
8. Czy `pricing_version` jest ustawione.
9. Czy VAT jest jawnie określony.
10. Czy aktywne pozycje mają poprawne mapowanie do Bitrix24.
11. Czy nie ma duplikatów dla tego samego wymiaru i opcji.
12. Czy każdy rekord ma `active`.

---

# Publikacja cennika

Import cennika powinien mieć dwa etapy:

## 1. Import roboczy

System czyta Excel i sprawdza poprawność danych.

Jeżeli znajdzie błędy, nie publikuje cennika.

Przykładowe błędy:

- brak kolumny,
- pusta cena,
- tekst w polu ceny,
- brak wymiaru,
- nieznany kod opcji,
- nieznana stawka VAT,
- brak mapowania produktu Bitrix24.

## 2. Publikacja snapshotu

Jeżeli walidacja przejdzie poprawnie, system publikuje nową wersję cennika.

Publiczny kalkulator korzysta tylko z ostatniego poprawnego snapshotu.

---

# Snapshot cennika

Snapshot może być zapisany jako JSON albo później w bazie danych.

Przykładowa nazwa:

| Plik | Opis |
|---|---|
| `published-pricing.json` | Ostatnia poprawna wersja cennika |
| `pricing-import-log.json` | Historia importów |

W MVP możemy nadal korzystać z plików TypeScript w `src/data/pricing/[pricing-source]`.

Docelowo te pliki zostaną zastąpione przez dane z opublikowanego snapshotu.

---

# Relacja do obecnego kodu

Obecne obszary kodu:

| Obszar | Docelowe źródło danych |
|---|---|
| `ConstructionCalculator` | `app_price_matrix` albo `app_construction_prices` |
| `RoofCalculator` | `app_price_matrix` albo `app_roof_prices` |
| `WallCalculator` | `app_price_matrix` albo `app_wall_prices` |
| `ZipCalculator` | `app_price_matrix` albo `app_zip_prices` |
| `AwningCalculator` | `app_price_matrix` albo `app_awning_prices` |
| `LedCalculator` | `app_price_matrix` albo `app_led_prices` |
| `AccessoriesCalculator` | `app_price_matrix` albo `app_accessory_prices` |
| `Bitrix24ProductRowMapper` | `app_bitrix_product_mapping` |
| VAT mapper | `app_vat_rules` |

---

# MVP struktury Excela

Na pierwszym etapie nie musimy wdrażać wszystkich zakładek.

Minimalny zestaw dla MVP:

| Zakładka | Wymagana w MVP |
|---|---|
| `app_metadata` | tak |
| `app_dimensions` | tak |
| `app_price_matrix` | tak |
| `app_vat_rules` | tak |
| `app_bitrix_product_mapping` | częściowo |

Pozostałe zakładki mogą być dodane później.

---

# Otwarte pytania

1. Czy różowa macierz cen jest finalnym źródłem cen sprzedażowych?
2. Czy wszystkie ceny w różowej macierzy są brutto?
3. Czy LED punktowe i LED taśma/COB mogą być łączone?
4. Czy montaż ma być pokazany klientowi w kalkulatorze, czy dodawany dopiero w Bitrix24?
5. Czy Bitrix24 wymaga `productId`, czy wystarczy nazwa i cena?
6. Czy VAT w Bitrix24 powinien być ustawiany na product row, czy pobierany z katalogu produktu?
7. Czy Excel będzie przechowywany w OneDrive for Business / SharePoint?
8. Czy publikacja cennika ma być ręczna, czy automatyczna?
9. Kto zatwierdza nową wersję cennika?
10. Czy historyczne wersje cennika mają być archiwizowane?

---

# Decyzje na teraz

1. Tworzymy plik Excel z warstwą techniczną `app_*`.
2. Aplikacja będzie importować wyłącznie zakładki `app_*`.
3. Arkusze robocze mogą pozostać czytelne dla ludzi.
4. MVP opiera się głównie na `app_price_matrix`.
5. Bitrix24 wymaga docelowo mapowania produktów.
6. VAT musi być jawnie zapisany w Excelu.
7. Importer nie publikuje błędnych danych.
8. Publiczny kalkulator korzysta tylko z ostatniego poprawnego snapshotu.

---

# Rozszerzalność: nowe wymiary i nowe produkty

System nie powinien być projektowany wyłącznie pod aktualne produkty i aktualną macierz cen.

Na ten moment MVP obejmuje:

- zadaszenie tarasu,
- ogród zimowy.

Przyszłościowo w ofercie mogą pojawić się:

- nowe wymiary,
- nowe serie konstrukcji,
- nowe warianty istniejących produktów,
- nowe typy pokryć dachowych,
- nowe dodatki,
- nowe produkty, np. carporty.

Dlatego struktura Excela i aplikacji musi pozwalać na rozwój bez przebudowy całej logiki.

## Produkt jako wymiar danych

Docelowo tabele techniczne powinny zawierać kolumnę:

```text
product_type
```

Przykładowe wartości:

```text
terrace_roof
winter_garden
carport
```

Dzięki temu ceny, wymiary, opcje i mapowania Bitrix24 mogą być przypisane do konkretnego produktu.

## Zakładka `app_product_types`

Przyszłościowo warto dodać zakładkę:

```text
app_product_types
```

Proponowane kolumny:

| Kolumna | Typ | Wymagane | Opis |
|---|---|---:|---|
| `product_type` | text | tak | Kod produktu |
| `product_name` | text | tak | Nazwa biznesowa |
| `product_family` | text | nie | Rodzina produktu |
| `active` | boolean | tak | Czy produkt jest aktywny |
| `notes` | text | nie | Uwagi |

Przykład:

| product_type | product_name | product_family | active | notes |
|---|---|---|---|---|
| `terrace_roof` | Zadaszenie tarasu | `glass_system` | TRUE | MVP |
| `winter_garden` | Ogród zimowy | `glass_system` | TRUE | MVP |
| `carport` | Carport | `carport` | FALSE | Produkt przyszłościowy |

## Wymiary zależne od produktu

Zakładka `app_dimensions` powinna docelowo pozwalać na przypisanie wymiarów do produktu.

Przykład:

| product_type | width_cm | length_cm | label | active |
|---|---:|---:|---|---|
| `terrace_roof` | 306 | 300 | 300 x 306 cm | TRUE |
| `winter_garden` | 306 | 300 | 300 x 306 cm | TRUE |
| `carport` | 300 | 500 | 500 x 300 cm | FALSE |

Dzięki temu dodanie nowego wymiaru nie wymaga zmiany całej logiki systemu, tylko dodania rekordu do Excela i przejścia walidacji importu.

## Opcje zależne od produktu

Nie każdy produkt musi obsługiwać te same opcje.

Przykład:

| product_type | option_group | enabled | notes |
|---|---|---|---|
| `terrace_roof` | `roof` | TRUE | Dach wymagany |
| `terrace_roof` | `walls` | TRUE | Opcjonalne ściany |
| `winter_garden` | `zip` | TRUE | ZIP dostępny przy ścianach |
| `carport` | `walls` | FALSE | Brak ścian w MVP |
| `carport` | `awning` | FALSE | Brak markizy |
| `carport` | `lighting` | TRUE | Możliwe oświetlenie |

Przyszłościowo można dodać zakładkę:

```text
app_product_option_rules
```

## Zasada projektowa

Nowy wymiar powinien oznaczać głównie:

```text
dodanie rekordu w Excelu
↓
import
↓
walidacja
↓
publikacja snapshotu
```

Nowy produkt powinien oznaczać:

```text
dodanie product_type
↓
dodanie wymiarów
↓
dodanie cen
↓
dodanie reguł opcji
↓
dodanie mapowania Bitrix24
↓
ewentualnie dodanie specyficznego kalkulatora tylko wtedy, gdy produkt ma inną logikę
```

Nie powinno to wymagać przebudowy całego Pricing Engine ani całej integracji Bitrix24.

## Decyzja na teraz

Nie wdrażamy carportów w MVP.

Projektujemy jednak Excel, Pricing Engine i mapowanie Bitrix24 tak, aby późniejsze dodanie carportów albo nowych wymiarów było rozszerzeniem systemu, a nie jego przebudową.



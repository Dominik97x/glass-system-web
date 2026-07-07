# Glass System pricing workbook fill guide

## Cel dokumentu

Ten dokument opisuje, jak uzupełniać plik:

```text
docs/templates/glass-system-pricing-workbook-template.xlsx
```

Plik jest roboczym szablonem cennika dla kalkulatora Glass System.

Docelowo ten workbook ma być źródłem danych dla procesu:

```text
Excel / workbook
→ walidacja
→ published pricing snapshot
→ Pricing Engine
→ kalkulator
→ zapytanie
→ CRM
```

## Najważniejsza zasada

Nie edytujemy cen docelowo w kodzie aplikacji.

Ceny powinny być uzupełniane w Excelu, a aplikacja powinna korzystać z opublikowanego snapshotu.

## Arkusze w pliku

Workbook zawiera arkusze:

```text
README
app_product_types
app_metadata
app_dimensions
app_price_matrix
app_vat_rules
app_bitrix_product_mapping
```

Najważniejszy arkusz do pracy z cenami:

```text
app_price_matrix
```

## app_product_types

Ten arkusz opisuje typy produktów obsługiwane przez kalkulator.

Aktualnie używane typy:

```text
terrace_roof
winter_garden
```

Znaczenie:

```text
terrace_roof  = zadaszenie tarasu bez ścian
winter_garden = ogród zimowy / zabudowa ze ścianami
```

Na tym etapie nie dodajemy nowych typów produktu bez aktualizacji aplikacji.

## app_dimensions

Ten arkusz opisuje dostępne wymiary.

Aktualne szerokości:

```text
306
406
506
606
706
806
906
1006
1106
1206
```

Aktualne długości:

```text
300
350
400
450
500
```

Dla każdego typu produktu docelowo powinny istnieć aktywne wymiary zgodne z UI kalkulatora.

## app_price_matrix

To główny arkusz cen.

Szablon zawiera:

```text
2 typy produktu x 5 długości x 10 szerokości = 100 wierszy
```

Czyli po jednym wierszu dla każdej kombinacji:

```text
product_type + length_cm + width_cm
```

Przykład:

```text
terrace_roof / 300 / 306
winter_garden / 300 / 306
```

## Kolumny identyfikujące wiersz

Tych kolumn nie należy zmieniać przypadkowo:

```text
productType
lengthCm
widthCm
dimensionLabel
active
```

Znaczenie:

```text
productType     typ produktu
lengthCm        długość konstrukcji
widthCm         szerokość konstrukcji
dimensionLabel  czytelny opis wymiaru
active          czy wiersz jest aktywny
```

Dla aktywnych wymiarów `active` powinno mieć wartość:

```text
true
```

## Kolumny cenowe

Wartości w kolumnach cenowych oznaczają ceny brutto w PLN.

Na tym etapie wpisujemy liczby bez waluty, np.:

```text
8383
15029
3079
5532
```

Nie wpisujemy:

```text
8 383 zł
8383 PLN
8.383,00
```

Najbezpieczniejszy format:

```text
8383
```

## Konstrukcja

Kolumna:

```text
constructionGross
```

To cena podstawowej konstrukcji dla danego typu produktu i wymiaru.

Ta cena jest wymagana dla każdego aktywnego wiersza.

Jeśli tej ceny zabraknie, kalkulator nie powinien uznać konfiguracji za kompletną.

## Dach

Kolumny dachu:

```text
roofPolycarbonateClearGross
roofPolycarbonateMilkyGross
roofPolycarbonateGreyGross
roofPolycarbonateSmokeGross
roofGlassClearGross
roofGlassMilkyGross
roofGlassTintedGross
```

Jeżeli dana opcja dachu jest wliczona w cenę konstrukcji, można wpisać:

```text
0
```

Jeżeli dana opcja jest dopłatą, wpisujemy cenę dopłaty brutto.

Przykład:

```text
roofPolycarbonateClearGross = 0
roofGlassClearGross = 2500
```

## Ściany

Kolumny ścian:

```text
wallGlassClearGross
wallGlassMilkyGross
wallGlassTintedGross
```

Dla `terrace_roof` ściany mogą pozostać jako `0`, ponieważ ten typ produktu oznacza zadaszenie bez ścian.

Dla `winter_garden` należy uzupełnić ceny ścian dla wariantów używanych w kalkulatorze.

## Rolety ZIP

Kolumny ZIP:

```text
zipRightGross
zipLeftGross
zipFrontGross
```

Znaczenie:

```text
zipRightGross  roleta ZIP prawa
zipLeftGross   roleta ZIP lewa
zipFrontGross  roleta ZIP przednia
```

W kalkulatorze ZIP-y są dostępne tylko wtedy, gdy wybrane są ściany.

## Markiza

Kolumna:

```text
awningGross
```

To cena markizy dachowej dla danego wymiaru.

## Profil wyrównujący

Kolumna:

```text
levelingProfileGross
```

To cena profilu wyrównującego / przygotowania pod montaż systemu.

## Oświetlenie

Kolumny oświetlenia:

```text
ledSpotGross
ledStripGross
ledCobGross
```

Na obecnym etapie kalkulator używa:

```text
ledSpotGross
ledCobGross
```

`ledStripGross` zostaje jako pole rozszerzeniowe / kompatybilnościowe.

## Akcesoria

Kolumny akcesoriów:

```text
handlesGross
brushesGross
```

Znaczenie:

```text
handlesGross  uchwyty
brushesGross  szczotki
```

## app_vat_rules

Ten arkusz opisuje VAT dla kategorii pozycji oferty.

Na obecnym etapie roboczo przyjmujemy VAT 8%, ale wartość ta powinna być potwierdzona biznesowo przed użyciem produkcyjnym.

Kategorie powinny docelowo być spójne między:

```text
Pricing Engine
published pricing snapshot
Bitrix product rows
dokumentami sprzedażowymi
```

## app_bitrix_product_mapping

Ten arkusz będzie potrzebny do integracji z Bitrix24.

Na pierwszym etapie można używać nazw produktów bez `bitrixProductId`.

Docelowo warto uzupełnić:

```text
bitrixProductId
productName
quoteItemCategory
quoteItemKey
productType
widthCm
lengthCm
vatRate
```

Dzięki temu Bitrix24 będzie mógł dostać product rows zgodne z cennikiem.

## Minimalny zakres uzupełnienia przed przepięciem kalkulatora

Zanim kalkulator zacznie korzystać ze snapshotu jako głównego źródła cen, arkusz `app_price_matrix` powinien mieć uzupełnione przynajmniej:

```text
constructionGross
wallGlassClearGross
wallGlassMilkyGross
wallGlassTintedGross
zipRightGross
zipLeftGross
zipFrontGross
awningGross
levelingProfileGross
ledSpotGross
ledCobGross
handlesGross
brushesGross
```

dla wszystkich aktywnych wymiarów, które użytkownik może wybrać w UI.

## Jak sprawdzić pokrycie snapshotu

Po przygotowaniu snapshotu uruchamiamy endpoint:

```text
/api/dev/pricing/snapshot-coverage
```

Docelowo oczekiwany wynik:

```text
expectedQuoteChecks: 200
successfulQuoteChecks: 200
failedQuoteChecks: 0
problems: 0
```

Dopóki wynik pokazuje brakujące wiersze lub brakujące ceny, snapshot nie powinien być jedynym źródłem cen dla kalkulatora.

## Status dokumentu

Ten dokument opisuje roboczy proces przygotowania cennika.

Może zostać doprecyzowany po:

- uzupełnieniu prawdziwej matrycy cen,
- rozmowie z osobą odpowiedzialną za cennik,
- potwierdzeniu VAT,
- pierwszym teście integracji z Bitrix24.
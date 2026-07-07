# Pricing coverage diagnostics

## Cel dokumentu

Ten dokument podsumowuje aktualny stan pokrycia cennika w projekcie Glass System.

Celem diagnostyki było sprawdzenie, czy obecny kalkulator może być bezpiecznie rozwijany na aktualnym źródle cen, czy powinniśmy docelowo przejść na model:

```text
Excel / published pricing snapshot → Pricing Engine → kalkulator → zapytanie → CRM
```

## Aktualne źródła cen w projekcie

W projekcie istnieją obecnie dwa równoległe podejścia do cen.

### 1. Obecny TypeScript Pricing Engine

Aktualny kalkulator używa przepływu:

```text
QuoteService
→ PricingEngine
→ FilePriceRepository
→ pliki TypeScript z cenami
```

Ten mechanizm działa dla demo i obecnego MVP, ale nie powinien być docelowym źródłem prawdy dla firmy.

Powody:

- ceny są zapisane w kodzie,
- zmiana ceny wymaga pracy programistycznej,
- pokrycie wymiarów jest niepełne,
- trudno utrzymać zgodność ze stroną, Excelem i CRM,
- trudno przekazać utrzymanie cennika pracownikowi nietechnicznemu.

### 2. Published pricing snapshot

Równolegle przygotowany został kierunek docelowy:

```text
Excel Online / workbook
→ importer / walidacja
→ published pricing snapshot
→ Pricing Engine
→ kalkulator
→ Bitrix24 product rows
```

Snapshot jest obecnie przykładowy i techniczny. Nie zawiera jeszcze pełnej matrycy cen, ale jego struktura jest zgodna z docelowym kierunkiem projektu.

## Endpointy diagnostyczne

Dodaliśmy dwa endpointy developerskie do sprawdzania pokrycia cen.

### Obecny TypeScript Pricing Engine

```text
/api/dev/pricing/coverage
```

Pełny raport:

```text
/api/dev/pricing/coverage?mode=full
```

Ten endpoint sprawdza aktualny silnik cenowy używany przez kalkulator.

Sprawdza scenariusze:

- zadaszenie tarasu bez dodatków,
- zadaszenie tarasu z dodatkami,
- ogród zimowy bez dodatków,
- ogród zimowy z dodatkami.

Dla każdego scenariusza sprawdza wszystkie kombinacje wymiarów dostępnych w UI:

```text
10 szerokości x 5 długości x 4 scenariusze = 200 sprawdzeń
```

### Published pricing snapshot

```text
/api/dev/pricing/snapshot-coverage
```

Pełny raport:

```text
/api/dev/pricing/snapshot-coverage?mode=full
```

Ten endpoint sprawdza przykładowy published pricing snapshot.

Sprawdza, czy snapshot ma aktywny wiersz price matrix dla danego typu produktu i wymiaru.

## Wyniki diagnostyki

### TypeScript Pricing Engine

Wynik obecnego silnika TypeScript:

```text
expectedQuoteChecks: 200
successfulQuoteChecks: 12
failedQuoteChecks: 188
problems: 188
```

Główny problem:

```text
Construction price not found
```

Wniosek:

Obecny TypeScript Pricing Engine ma bardzo ograniczone pokrycie wymiarów. Nadaje się do demo i bieżącego prototypu, ale nie jest dobrym kierunkiem jako docelowe źródło cen.

### Published pricing snapshot example

Wynik przykładowego snapshotu:

```text
expectedQuoteChecks: 200
successfulQuoteChecks: 4
failedQuoteChecks: 196
activeSnapshotDimensionKeys: 2
validationWarnings: 9
```

Główny problem:

```text
Snapshot active price matrix row is missing
```

Wniosek:

Snapshot działa technicznie, ale jest jeszcze przykładowy. Ma tylko kilka testowych wymiarów i wymaga uzupełnienia pełnej matrycy cen.

## Najważniejszy wniosek

Nie powinniśmy dalej rozbudowywać ręcznie plików TypeScript jako docelowego cennika.

Docelowym źródłem prawdy powinien być:

```text
Excel Online / workbook
```

a aplikacja powinna używać opublikowanego snapshotu:

```text
published-pricing.json
```

Dzięki temu:

- pracownik może edytować ceny bez dotykania kodu,
- aplikacja korzysta z zatwierdzonego snapshotu,
- można walidować cennik przed publikacją,
- Bitrix24 może dostawać te same pozycje i ceny co kalkulator,
- pricing engine nie jest zależny od ręcznych plików TypeScript.

## Co trzeba uzupełnić w Excelu / snapshot

Docelowy snapshot powinien zawierać pełne aktywne wiersze dla:

```text
terrace_roof
winter_garden
```

dla wszystkich wymiarów dostępnych w UI:

```text
szerokości:
306, 406, 506, 606, 706, 806, 906, 1006, 1106, 1206

długości:
300, 350, 400, 450, 500
```

Czyli minimalnie:

```text
10 x 5 x 2 typy produktu = 100 aktywnych wierszy price matrix
```

Do tego trzeba uzupełnić ceny dla pozycji:

- konstrukcja,
- dach,
- ściany,
- rolety ZIP,
- markiza,
- LED,
- COB / taśma LED,
- uchwyty,
- szczotki,
- profil wyrównujący.

## Uwaga o kategoriach

Aktualny `PricingEngine` używa kategorii:

```text
wall
```

Snapshot docelowo używa kategorii:

```text
walls
```

Przed pełną integracją z Bitrix24 i przed przepięciem kalkulatora na snapshot trzeba ujednolicić nazewnictwo kategorii.

Rekomendowany kierunek:

```text
walls
```

ponieważ snapshot i mapping Bitrix są projektowane pod tę nazwę.

## Kiedy przepiąć kalkulator na snapshot

Nie należy przepinać kalkulatora na snapshot dopóki snapshot nie ma wystarczającego pokrycia.

Minimalny warunek przed przepięciem:

```text
/api/dev/pricing/snapshot-coverage
```

powinien pokazać, że dla głównych scenariuszy nie brakuje aktywnych wierszy price matrix.

Docelowo oczekiwany wynik:

```text
expectedQuoteChecks: 200
successfulQuoteChecks: 200
failedQuoteChecks: 0
problems: 0
```

W praktyce można dopuścić etap przejściowy, w którym snapshot pokrywa tylko najważniejsze wymiary, ale wtedy UI powinno ograniczać wybór do wymiarów dostępnych w snapshot.

## Rekomendowane kolejne kroki

1. Nie rozwijać dalej ręcznych plików TypeScript jako docelowego cennika.
2. Uzupełnić Excel/snapshot o pełną matrycę cen.
3. Uruchomić ponownie:

```text
/api/dev/pricing/snapshot-coverage
```

4. Ujednolicić kategorie pozycji oferty, szczególnie `wall` vs `walls`.
5. Przygotować snapshot-based quote service.
6. Dopiero po tym przepiąć kalkulator z `FilePriceRepository` na snapshot pricing.
7. Następnie wykorzystać ten sam snapshot do przygotowania product rows dla Bitrix24.

## Status na dziś

Na dziś projekt ma działający flow:

```text
homepage
→ kalkulator
→ konfiguracja
→ wizualizacja
→ wycena
→ formularz
→ zapis do Postgres/Neon
→ /admin/leady
```

Największym brakującym elementem biznesowym pozostaje pełne i edytowalne źródło cen.
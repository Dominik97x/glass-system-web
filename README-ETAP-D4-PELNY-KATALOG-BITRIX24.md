# Etap D4 — pełny katalog publikacyjny MoonGlass w Bitrix24

## Cel

D4 przygotowuje bezpieczny, wznawialny i idempotentny import pełnego katalogu
produktów wykorzystywanych przez stronę i CRM.

Źródłem jest:

```text
app/src/data/pricing/glass-system/published-pricing.generated.json
```

Katalog jest generowany automatycznie. Nie należy ręcznie zmieniać kodów `MG-*`
ani tworzyć tych samych wariantów w panelu Bitrix24.

## Zakres D4.0

Generator tworzy:

- 70 wymiarów,
- 2 konstrukcje bazowe dla każdego wymiaru,
- dachy poliwęglanowe,
- dachy szklane, z wyłączeniem niedostępnego szkła dla 550/600 cm,
- ściany bezbarwne i przyciemniane,
- ZIP przód, lewy i prawy,
- markizy,
- LED punktowe i LED CCT,
- profil/fundament,
- szczotki i uchwyty.

Łącznie:

```text
1220 produktów
```

D4.0 nie dodaje pozycji wyłącznie CRM, których zatwierdzone ceny nie występują
w snapshotcie publikacyjnym, w szczególności LED RGB CCT i zabieraków.
Te pozycje wymagają osobnego eksportu cennika CRM i będą zakresem D4.1.

## Ważne ograniczenie triala

W 15-dniowym trybie próbnym Bitrix24 katalog sklepu jest ograniczony do 100
pozycji. Portal MoonGlass ma już 18 produktów pilotażowych, dlatego nie należy
uruchamiać pełnego importu podczas triala.

Podczas triala wykonujemy:

1. walidację lokalnego źródła,
2. odczytowy plan porównawczy portalu,
3. D5 — automatyzacje lejków.

Pełne 1220 produktów zaimportujemy po aktywowaniu płatnego planu.

## Polecenia

### 1. Walidacja lokalnego źródła

Nie zmienia Bitrix24 i nie wymaga połączenia z portalem:

```powershell
npm run bitrix:products:full:source
```

Oczekiwane:

```text
Źródło pełnego katalogu jest poprawne.
Wymiary: 70
Produkty docelowe: 1220
```

Raporty:

```text
app/.bitrix24/full-catalog-source.json
app/.bitrix24/full-catalog-source.md
```

### 2. Plan odczytowy podczas triala

```powershell
npm run bitrix:products:full:plan -- --catalog-cap=100
```

Polecenie niczego nie tworzy. Porównuje pełny manifest z portalem, sprawdza:

- istniejące SKU,
- brakujące produkty,
- nazwy i sekcje,
- jednostkę `szt.`,
- ceny bazowe i walutę,
- aktywność i kolejność,
- duplikaty kodów `MG-*`.

Raporty:

```text
app/.bitrix24/full-catalog-plan.json
app/.bitrix24/full-catalog-plan.md
```

### 3. Import po zakupie planu

Najpierw usuń lub wyłącz `BITRIX24_CATALOG_CAP=100` z `.env.local`.

Importer domyślnie przetwarza 100 produktów w jednej partii:

```powershell
npm run bitrix:products:full:apply -- `
  --confirm=MOONGLASS-FULL-CATALOG `
  --paid-plan=YES `
  --limit=100
```

Polecenie można uruchamiać wielokrotnie. Każda kolejna partia odczytuje stan
portalu i wykonuje tylko brakujące lub wymagające aktualizacji produkty.
Nie tworzy duplikatów przy prawidłowych kodach `MG-*`.

Większa partia:

```powershell
npm run bitrix:products:full:apply -- `
  --confirm=MOONGLASS-FULL-CATALOG `
  --paid-plan=YES `
  --limit=250
```

`--limit=0` oznacza wszystkie pozostałe produkty, ale zalecane są mniejsze,
wznawialne partie.

### 4. Weryfikacja końcowa

```powershell
npm run bitrix:products:full:verify
```

Końcowy wynik:

```text
Pełny katalog D4 jest zgodny.
Brakujące: 0, aktualizacje: 0, zgodne: 1220
```

## Zabezpieczenia

- pełny zapis wymaga `--confirm=MOONGLASS-FULL-CATALOG`,
- bez podanego limitu katalogu wymagane jest dodatkowe `--paid-plan=YES`,
- przy `--catalog-cap=100` importer nie pozwoli przekroczyć limitu,
- nie usuwa żadnych produktów,
- wykrywa zduplikowane SKU i przerywa przed zapisem,
- porównuje ceny przed aktualizacją,
- działa partiami i można go bezpiecznie wznowić,
- zapisuje raport każdej partii w `app/.bitrix24`.

## Po D4

Podczas aktywnego triala kolejnym praktycznym etapem jest D5 — automatyzacja
lejków sprzedaży, realizacji i reklamacji. Pełny import D4 zostaje gotowy do
uruchomienia natychmiast po przejściu na płatny plan.

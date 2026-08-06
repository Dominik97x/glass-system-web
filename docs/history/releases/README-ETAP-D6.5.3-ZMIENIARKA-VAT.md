# MoonGlass — etap D6.5.3 — zmieniarka VAT

## Co dodaje nakładka

1. Cztery pola Deala do obsługi i audytu zmiany VAT.
2. Bezpieczny podgląd przeliczenia bez zapisu.
3. Przeliczenie wszystkich pozycji produktowych przy zachowaniu cen netto.
4. Automatyczne wyliczenie nowej wartości brutto oraz rat 30% / 50% / 20%.
5. Backup przed zmianą i próbę automatycznego rollbacku przy błędzie.
6. Presety 0%, 5%, 8%, 23% oraz możliwość podania innej wartości procentowej.

## Kolejność wdrożenia

Po rozpakowaniu nakładki do katalogu projektu:

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
npm run bitrix:vat:audit
npm run bitrix:vat:plan
```

Oczekiwany pierwszy audyt:

```text
Pola: 0/4, brakujące: 4, konflikty: 0
Zmiany: 4, ostrzeżenia: 0
```

Po akceptacji planu:

```powershell
npm run bitrix:vat:apply -- --confirm=MOONGLASS-VAT-CHANGER-FIELDS
npm run bitrix:vat:verify
npm run bitrix:verify
```

## Pierwszy test bez zapisu

```powershell
npm run bitrix:vat:preview -- --deal-id=3 --rate=23
```

Nie uruchamiaj `set`, dopóki wynik podglądu nie zostanie sprawdzony.

## Zasada biznesowa

Zmieniarka zawsze zachowuje ceny netto. Zmiana VAT wpływa na ceny brutto, sumę Deala oraz wysokość trzech rat.

Stawki `ZW` i `NP` wymagają odrębnego modelu księgowego i nie są traktowane jako procent VAT.

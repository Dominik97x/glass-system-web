# MoonGlass D6.6.2 — ceny netto w Bitrix24

Nakładka zmienia produkcyjny przepływ `database → Bitrix24` tak, aby nowe pozycje Deala otrzymywały:

```text
price = cena sprzedaży netto z FIX22
taxRate = BITRIX24_VAT_RATE
taxIncluded = N
```

Strona nadal pokazuje dotychczasowe ceny brutto 8%.

## Instalacja

Rozpakuj nakładkę do katalogu:

```text
C:\Projects\glass-system-web
```

Potwierdź zastąpienie plików.

## Kontrola

W terminalu VS Code:

```powershell
cd C:\Projects\glass-system-web\app

npm run pricing:import
npm run pricing:verify-net
npm run bitrix:net-rows:verify
npm run lint
npm run build
```

## Pierwszy test

Utwórz nowe testowe zapytanie z kalkulatora. Nie używaj do tego istniejącego Deala ze starymi cenami brutto.

Dla pozycji bazowej 300×306 cm powinno być:

```text
Cena netto: 7 419,00 zł
VAT: 8%
Podatek wliczony w: Nie
Kwota VAT: 593,52 zł
Brutto: 8 012,52 zł
```

Po zmianie VAT na 23% cena netto ma pozostać 7 419,00 zł, a brutto wynieść 9 125,37 zł.

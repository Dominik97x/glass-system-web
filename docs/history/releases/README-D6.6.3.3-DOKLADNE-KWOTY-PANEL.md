# MoonGlass D6.6.3.3 — dokładne kwoty w panelu administracyjnym

## Powód poprawki

Snapshot finansowy i Bitrix24 przechowywały poprawne kwoty z groszami, ale wspólny formatter panelu administracyjnego zaokrąglał każdą wartość do pełnych złotych.

Przykład przed poprawką:

- netto: 17 632 zł,
- VAT: 1 411 zł,
- brutto: 19 043 zł.

Dokładne wartości księgowe wynoszą:

- netto: 17 632,00 zł,
- VAT: 1 410,56 zł,
- brutto: 19 042,56 zł.

## Zmiana

Dodano osobny formatter `formatAccountingPrice`, który zawsze pokazuje dwa miejsca po przecinku.

Panel stosuje go dla:

- ceny netto,
- kwoty VAT,
- dokładnej ceny brutto,
- finansowych pozycji snapshotu.

Cena orientacyjna strony nadal jest pokazywana w pełnych złotych, np. `19 043 zł`.

## Instalacja i kontrola

Rozpakuj nakładkę do katalogu projektu, a następnie uruchom:

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
```

Po uruchomieniu aplikacji karta leada powinna pokazać:

```text
Netto: 17 632,00 zł
VAT 8%: 1 410,56 zł
Brutto: 19 042,56 zł
Strona: 19 043 zł
```

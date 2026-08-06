# D6.6.3.2 — hotfix TypeScript panelu szczegółów leada

Poprawka zachowuje wynik type guarda `hasDetailedQuoteFinancials()` w zmiennej
`financialQuote`. Dzięki temu TypeScript wie, że pola `totalNet`,
`totalTaxAmount`, `defaultVatRate` i `websiteTotalGross` są liczbami w gałęzi
renderującej snapshot finansowy v2.

Zmiana nie wpływa na ceny, VAT, Bitrix24 ani zapis snapshotów.

Po rozpakowaniu do katalogu projektu uruchom:

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
```

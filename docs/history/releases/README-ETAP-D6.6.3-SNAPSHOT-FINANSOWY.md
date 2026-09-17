# MoonGlass D6.6.3 — snapshot finansowy netto / VAT / brutto

## Cel

Nowe zapytania z kalkulatora zapisują w `quote_snapshot` pełny, serwerowo wyliczony podział finansowy:

- cena netto,
- stawka VAT,
- kwota VAT,
- dokładna cena brutto,
- szczegółowe, nieagregowane pozycje odpowiadające produktom w Bitrix24,
- równoległa orientacyjna cena brutto pokazywana na stronie.

Nie jest potrzebna migracja bazy danych — kolumna `quote_snapshot` ma typ `jsonb`.

## Zasada cen

- `websiteTotalGross` — dotychczasowa orientacyjna kwota strony, zaokrąglona do pełnych złotych,
- `totalNet` — dokładna suma netto,
- `totalTaxAmount` — dokładna suma VAT,
- `totalGross` — dokładna suma księgowa brutto.

Dla konfiguracji testowej 300×306 cm z przednim ZIP-em, markizą, LED CCT, profilem, szczotkami i uchwytami:

- netto: `17 632,00 PLN`,
- VAT 8%: `1 410,56 PLN`,
- brutto księgowe: `19 042,56 PLN`,
- strona: około `19 043 PLN`.

## Weryfikacja po instalacji

Uruchom w katalogu `app`:

```powershell
npm run inquiries:financial-snapshot:verify
npm run bitrix:net-rows:verify
npm run lint
npm run build
```

Oczekiwany pierwszy komunikat:

```text
D6.6.3 — snapshot zapytania netto/VAT/brutto zweryfikowany poprawnie.
Netto 17632.00 PLN; VAT 8% 1410.56 PLN; brutto 19042.56 PLN.
Strona pozostaje bez zmian: około 19043.00 PLN brutto.
```

## Test funkcjonalny

Po uruchomieniu aplikacji utwórz nowe zapytanie. W panelu `/admin/leady` nowe zapytanie powinno pokazać osobno netto, VAT i brutto. W sekcji danych technicznych snapshot powinien mieć `version: 2` oraz `priceMode: "net"`.

Nowe snapshoty zapisują osobno m.in. konstrukcję, rolety, markizę, LED, profil, szczotki i uchwyty. Ponowna synchronizacja z Bitrix24 korzysta z zapisanych historycznych cen snapshotu, a nie z późniejszej wersji cennika.

Starsze zapytania pozostają zgodne wstecznie i są wyświetlane jako starsze snapshoty brutto.

# MoonGlass D6.6.4.1 — harmonogram zgodny z VAT Deala

## Problem

Nowy Deal utworzony przy `BITRIX24_VAT_RATE=23` otrzymywał poprawne wiersze
produktowe z VAT 23%, ale pola harmonogramu 30/50/20 były liczone z brutto
zapisanego w snapshotcie przy domyślnym VAT 8%.

Przykład Deala #23:

- netto: 55 927,00 PLN,
- prawidłowe brutto 23%: 68 790,21 PLN,
- błędne raty były liczone od 60 401,16 PLN, czyli od netto + 8%.

## Poprawka

Przy tworzeniu lub ponownej synchronizacji Deala aplikacja:

1. pobiera historyczne ceny netto ze snapshotu zapytania v2,
2. przelicza każdą pozycję na `BITRIX24_VAT_RATE`,
3. sumuje dokładne netto, VAT i brutto,
4. z docelowego brutto oblicza raty 30/50/20,
5. zapisuje tę samą kwotę w polu `MG_SERVER_TOTAL_GROSS`,
6. używa docelowej stawki również w opisie Deala.

Snapshot i orientacyjna cena na stronie nie są zmieniane.

## Weryfikacja lokalna

Po instalacji uruchom:

```powershell
cd C:\Projects\glass-system-web\app
npm run bitrix:deal-vat-financials:verify
npm run inquiries:financial-snapshot:verify
npm run bitrix:net-rows:verify
npm run lint
npm run build
```

Oczekiwany wynik nowej kontroli:

```text
D6.6.4.1 — kwota Deala i harmonogram 30/50/20 są zgodne z docelową stawką VAT.
VAT 23% dla 55 927,00 PLN netto: VAT 12 863,21 PLN; brutto 68 790,21 PLN; raty 20 637,06 / 34 395,11 / 13 758,04 PLN.
```

## Ważne

Ponowne wykonanie `bitrix:vat:set` naprawia istniejący Deal, ale ta poprawka
usuwa przyczynę problemu dla wszystkich nowych Deali i ponownych synchronizacji.
Snapshoty legacy bez cen netto zachowują dotychczasowe zachowanie.

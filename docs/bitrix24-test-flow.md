# Bitrix24 — test przepływu D2

Test D2 jest narzędziem developerskim, a nie częścią publicznego formularza. Jego zadaniem jest potwierdzenie kontraktu API przed wdrożeniem produkcyjnej synchronizacji.

## Gwarancje

1. Kontakt jest deduplikowany po e-mailu i telefonie.
2. Deal jest deduplikowany przez stabilne pole `MG_WEB_INQUIRY_ID`; `xmlId` pozostaje dodatkowym identyfikatorem, ale nie jest używany do filtrowania.
3. Deal trafia do lejka `01 Sprzedaż z pomiarem`, etap `Nowe zapytanie`.
4. Pola `UF_CRM_*` są wysyłane z `useOriginalUfNames=Y`.
5. Wartości pól listowych są rozwiązywane do rzeczywistych identyfikatorów elementów listy z `crm.item.fields`.
6. Pozycje są katalogowe, mają `productId`, jednostkę `szt.`, VAT 8% i `taxIncluded=Y`.
7. `crm.item.productrow.set` zastępuje komplet pozycji wyłącznie w technicznym Dealu D2.
8. Suma pozycji jest porównywana z serwerowym `SnapshotQuoteService` i kwotą Deala.

## Dane techniczne

- Kontakt: `bitrix-d2-test@moonglass.pl`, `+48500000001`.
- ID zapytania Deala: `D2-TEST-300X306-V1`.
- Dodatkowy XML_ID Deala: `MOONGLASS:D2:DEAL:300X306:V1`.
- ID zapytania: `D2-TEST-300X306-V1`.
- Raporty lokalne: `.bitrix24/test-flow.json`, `.bitrix24/test-flow.md`.

Dane są wyraźnie oznaczone jako testowe. Skrypt nie usuwa rekordów automatycznie, aby możliwa była wizualna kontrola w panelu Bitrix24.

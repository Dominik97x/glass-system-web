# ETAP D3 — produkcyjna synchronizacja formularza z Bitrix24

## Cel

Pakiet zmienia przepływ zapytania na:

```text
formularz kalkulatora
→ serwerowa, zaufana wycena
→ trwały zapis w Neon/Postgres
→ próba synchronizacji z Bitrix24
→ Kontakt
→ Deal
→ pozycje produktowe
→ zapis identyfikatorów CRM i statusu synchronizacji w Neon
```

Neon pozostaje nadrzędnym i niezależnym zapisem. Awaria Bitrix24 nie powoduje utraty zapytania ani błędu po stronie klienta po udanym zapisie do bazy.

## Co dodaje D3

- stan synchronizacji: `not_configured`, `pending`, `processing`, `synced`, `failed`,
- identyfikatory Kontaktu i Deala Bitrix24,
- licznik prób, ostatni błąd i terminy ponowienia,
- atomowe przejęcie rekordu do synchronizacji,
- odporność na równoległe próby i zawieszone procesy,
- wyszukiwanie Kontaktu po e-mailu i telefonie,
- idempotencję Deala po `MG_WEB_INQUIRY_ID`,
- automatyczne odnajdywanie lejka, etapu, źródła, pól list i jednostki `szt.`,
- szczegółowe pozycje: konstrukcja, dach, ściany, poszczególne ZIP-y, markiza, LED i akcesoria,
- kontrolę zgodności sumy pozycji z serwerową wyceną,
- powiązanie z katalogiem, kiedy produkt o kodzie `MG-...` istnieje,
- bezpieczny fallback do pozycji niestandardowej, gdy pełny katalog nie został jeszcze zaimportowany,
- ręczny przycisk ponowienia w panelu administratora,
- polecenie zbiorczego ponawiania błędnych/oczekujących rekordów,
- ponawianie zapytań HTTP do Bitrix24 po limitach, błędach 5xx i problemach sieciowych.

## Instalacja

Rozpakuj nakładkę bezpośrednio do:

```text
C:\Projects\glass-system-web
```

Zaakceptuj zastąpienie istniejących plików.

## 1. Kontrola kodu

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
npm run bitrix:verify
```

Oczekiwany wynik Bitrix24:

```text
Weryfikacja OK.
Pozostałe działania: 0
```

## 2. Zmienne środowiskowe

W `app/.env.local` zachowaj obecny tajny webhook i ustaw co najmniej:

```env
CALCULATOR_INQUIRY_REPOSITORY=database
BITRIX24_ENABLED=true
BITRIX24_WEBHOOK_URL=https://moonglass.bitrix24.pl/rest/.../TAJNY_KLUCZ/

BITRIX24_SALES_PIPELINE_NAME="01 Sprzedaż z pomiarem"
BITRIX24_NEW_INQUIRY_STAGE_NAME="Nowe zapytanie"
BITRIX24_CALCULATOR_SOURCE_NAME="Kalkulator strony"
BITRIX24_SYNC_RETRY_DELAY_MINUTES=15
BITRIX24_VAT_RATE=8
BITRIX24_PUBLIC_CALCULATOR_URL=http://localhost:3000/kalkulator
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Nie wpisuj adresu webhooka do plików śledzonych przez Git.

Identyfikatory lejka, etapu i źródła mogą pozostać puste — integracja odnajdzie elementy po nazwach. Istniejące zmienne `BITRIX24_DEFAULT_CATEGORY_ID`, `BITRIX24_DEFAULT_STAGE_ID` i `BITRIX24_SOURCE_ID` nadal mogą służyć jako jawne nadpisanie.

## 3. Migracja bazy

Migracja jest idempotentna. Uruchom ją po udanym buildzie:

```powershell
npm run db:migrate:d3 -- --confirm=MOONGLASS
```

Oczekiwany komunikat:

```text
Migracja D3 Bitrix24 została zastosowana.
```

Plik źródłowy migracji:

```text
database/002_add_bitrix24_sync_state.sql
```

## 4. Test pełnego przepływu

Uruchom aplikację:

```powershell
npm run dev
```

Wyślij nowe testowe zapytanie przez `/kalkulator`. Następnie sprawdź:

1. Formularz zwraca numer `inq_...` i poprawną cenę.
2. Rekord istnieje w `/admin/leady`.
3. Sekcja Bitrix24 pokazuje `synced`, ID Kontaktu oraz ID Deala.
4. W Bitrix24 powstał jeden Deal w `01 Sprzedaż z pomiarem → Nowe zapytanie`.
5. Deal ma poprawny Kontakt, pola `UF_CRM_*`, pozycje, VAT 8%, jednostkę `szt.` i poprawną sumę.

## 5. Test odporności na awarię

Można tymczasowo wstawić błędny adres webhooka, wysłać nowe zapytanie i przywrócić poprawny adres. Oczekiwany rezultat:

- zapytanie pozostaje zapisane w Neon,
- klient nadal otrzymuje numer zapytania,
- status Bitrix24 wynosi `failed`,
- panel pokazuje bezpieczny opis błędu,
- przycisk `Wyślij ponownie do Bitrix24` wykonuje kolejną próbę,
- ponowienie odnajduje istniejący częściowo utworzony Deal po ID zapytania i nie tworzy duplikatu.

## 6. Zbiorcze ponawianie kolejki

```powershell
npm run bitrix:retry-pending -- --limit=20
```

Polecenie bierze wyłącznie rekordy `pending` lub `failed`, dla których nadszedł czas kolejnej próby. Docelowo po wdrożeniu strony można uruchamiać je cyklicznie przez scheduler hostingu.

## Ważne ograniczenie katalogu

D3 rozbija każdą konfigurację na szczegółowe pozycje i próbuje powiązać je z produktem katalogowym po stabilnym kodzie `MG-...`.

- Dla istniejących produktów pilotażowych `300×306` używane są ich prawdziwe ID katalogowe.
- Dla pozostałych wymiarów, których jeszcze nie zaimportowano, Bitrix24 otrzymuje poprawną pozycję niestandardową z nazwą, ceną, VAT i jednostką.
- Pełny import katalogu wszystkich wymiarów jest osobnym kolejnym etapem i nie blokuje działania formularza ani CRM.

## Pliki lokalne i sekrety

Nie commituj:

```text
app/.env.local
app/.bitrix24/
```

Po zakończonym teście:

```powershell
cd C:\Projects\glass-system-web
git status
git add .
git commit -m "Add production Bitrix24 inquiry synchronization"
```

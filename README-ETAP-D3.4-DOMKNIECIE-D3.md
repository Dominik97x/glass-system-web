# Etap D3.4 — domknięcie produkcyjnej integracji Bitrix24

## Zakres

Ta nakładka porządkuje działający przepływ D3 bez zmiany jego architektury:

- poprawia kolejność wymiarów w tytule Deala na `głębokość × szerokość`,
- po synchronizacji próbuje wyczyścić domyślną datę końcową Deala,
- różnicuje nazwę przycisku synchronizacji zależnie od statusu,
- pokazuje ostatnią próbę, udaną synchronizację i termin ponowienia,
- pokazuje bezpieczne linki do Kontaktu i Deala w Bitrix24,
- dodaje tryb podglądu kolejki bez modyfikowania bazy i CRM,
- zachowuje regułę D3.3: przedni ZIP bez ścian jest dozwolony, boczne ZIP-y wymagają ścian.

## Instalacja

Rozpakuj płaską nakładkę bezpośrednio do:

```text
C:\Projects\glass-system-web
```

Zatwierdź zastąpienie plików.

## Kontrola kodu

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
npm run bitrix:verify
```

Oczekiwane dla provisionera:

```text
Weryfikacja OK.
Pozostałe działania: 0
```

## 1. Kontrola poprawionego Deala

Uruchom ponownie aplikację:

```powershell
npm run dev
```

Otwórz istniejące zapytanie D3 w panelu administratora i kliknij:

```text
Synchronizuj ponownie
```

Po synchronizacji sprawdź w Bitrix24:

- tytuł: `Ogród zimowy 300 × 306 cm — Łukaszek`,
- lejek: `01 Sprzedaż z pomiarem`,
- etap: `Nowe zapytanie`,
- kwota: `31 141 zł`,
- data końcowa: pusta,
- liczba produktów: 6.

Czyszczenie daty jest operacją pomocniczą. Ewentualny błąd tej pojedynczej operacji nie przerywa zapisu Kontaktu, Deala ani produktów; zostanie wypisany jako ostrzeżenie w terminalu.

## 2. Kontrola kolejki ponowień

Najpierw wykonaj bezpieczny podgląd:

```powershell
npm run bitrix:retry-pending -- --limit=20 --dry-run
```

Polecenie tylko odczytuje bazę. Nie zmienia rekordów i nie wysyła niczego do Bitrix24.

Jeżeli wszystkie dotychczasowe zapytania mają status `synced`, oczekiwane jest:

```text
Tryb podglądu — baza i Bitrix24 nie zostaną zmienione.
Do ponowienia: 0
```

Następnie można wykonać właściwą kolejkę:

```powershell
npm run bitrix:retry-pending -- --limit=20
```

Przy pustej kolejce oczekiwane jest:

```text
Próby: 0
Zsynchronizowano: 0
Błędy: 0
```

## 3. Prawdziwy test przedniego ZIP-u bez ścian

W kalkulatorze wybierz:

```text
Zadaszenie tarasu
300 × 306 cm
Ściany: brak
ZIP przód: tak
ZIP lewy: nie
ZIP prawy: nie
Pozostałe dodatki: nie
```

Oczekiwana cena z aktualnego snapshotu:

```text
10 738 zł
```

Wyślij formularz z nowym testowym adresem e-mail. Sprawdź:

- status w panelu: `zsynchronizowany`,
- Deal trafił do `Nowe zapytanie`,
- tytuł ma wymiary `300 × 306 cm`,
- pole ZIP przód ma wartość `Tak`,
- ZIP lewy i prawy mają wartość `Nie`,
- Deal ma dwie pozycje: konstrukcję i przedni ZIP,
- suma brutto wynosi `10 738 zł`.

Dodatkowo boczne ZIP-y powinny być zablokowane w interfejsie przy braku ścian. Kontrola serwerowa pozostaje dostępna pod:

```text
http://localhost:3000/api/dev/inquiries/server-quote-check
```

Oczekiwane: `success: true`.

## 4. Zapis stabilnej wersji

Po przejściu wszystkich kontroli:

```powershell
cd C:\Projects\glass-system-web
git status
git add .
git commit -m "Complete Bitrix24 D3 production synchronization"
```

Nie commituj:

```text
app/.env.local
app/.bitrix24/
```

Po tym Etap D3 jest zamknięty. Następne etapy:

```text
D4 — pełny katalog produktów
D5 — automatyzacje lejków Bitrix24
```

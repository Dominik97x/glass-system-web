# ETAP D1 — MoonGlass Bitrix24 Provisioner

Pakiet nakładkowy do projektu `glass-system-web`.

## Co dodaje

- wersjonowany blueprint MoonGlass,
- automatyczny audyt portalu Bitrix24,
- bezpieczny plan zmian bez zapisu,
- automatyczne tworzenie/aktualizowanie:
  - 3 lejków,
  - etapów Sprzedaży, Realizacji i Reklamacji,
  - źródeł klientów,
  - 66 pól Kontaktów, Firm i Deali,
  - 14 sekcji katalogu,
- pilotażowy import produktów z aktualnego JSON-a cenowego,
- raport weryfikacyjny i mapowanie `categoryId`, `stageId`, `UF_CRM_*`, sekcji oraz produktów.

Provisioner jest niedestrukcyjny: nie usuwa istniejących danych ani konfiguracji.

## Instalacja nakładki

1. Zamknij serwer `npm run dev`.
2. Zrób kopię projektu lub commit.
3. Rozpakuj ZIP bezpośrednio do:

```text
C:\Projects\glass-system-web
```

4. Zgódź się na zastąpienie istniejących plików.
5. Przejdź do aplikacji:

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
```

## Na razie nie uruchamiaj provisionera

Polecenia wymagają aktywnego REST API i sekretnego incoming webhooka. Najpierw potwierdź, że `lint` i `build` przechodzą. Następnie aktywujemy trial Professional i utworzymy webhook.

## Polecenia po aktywacji triala

```powershell
npm run bitrix:audit
npm run bitrix:plan
npm run bitrix:apply -- --confirm=MOONGLASS
npm run bitrix:products:pilot -- --confirm=MOONGLASS
npm run bitrix:verify
```

Pełna instrukcja znajduje się w:

```text
docs\bitrix24-provisioner.md
```

## Sekret webhooka

Adres zapisujesz wyłącznie lokalnie w:

```text
app\.env.local
```

jako:

```env
BITRIX24_WEBHOOK_URL=https://moonglass.bitrix24.pl/rest/.../.../
```

Nie przesyłaj go w rozmowie i nie commituj do GitHub.

## Weryfikacja wykonana przed wydaniem

- kompilacja TypeScript samych skryptów Provisionera: OK,
- test end-to-end na lokalnym mocku API Bitrix24: OK,
- powtórne uruchomienie i idempotencja: OK,
- wynik mocka: 3 lejki, 66 pól, 14 sekcji, 18 produktów pilotażowych, 0 pozostałych zmian.

Pełnego `npm run build` w środowisku przygotowującym pakiet nie udało się uruchomić, ponieważ wewnętrzne lustro npm nie udostępniło jednego z pakietów zależności. Dlatego właściwy build należy wykonać lokalnie po nałożeniu ZIP-a.

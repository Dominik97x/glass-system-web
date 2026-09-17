# Etap D1.3 — odporność odczytu Bitrix24 i mapowanie produktów

## Co naprawia ta poprawka

1. Paginowane odczyty `*.list` korzystają teraz z retry/backoff. Wcześniej chwilowy limit API mógł zwrócić błąd, który audyt interpretował jako pustą listę.
2. `verify` nie wykonuje ponownie kosztownej serii `method.get` i używa rygorystycznego odczytu pól oraz katalogu.
3. Gdy odczyt pól lub katalogu jest niepełny, weryfikacja kończy się czytelnym błędem zamiast generować fałszywe działania `create`.
4. Import produktów czeka, aż Bitrix24 zwróci wszystkie zapisane SKU, zanim zapisze `mapping.generated.json`.
5. Żądania JSON zawierają jawne `charset=utf-8`.

## Instalacja

Rozpakuj ZIP bezpośrednio do katalogu głównego projektu:

```text
C:\Projects\glass-system-web
```

Zastąp istniejące pliki.

## Kontrola

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
npm run bitrix:verify
```

Po tej poprawce ponowne uruchomienie pilota nie tworzy duplikatów. Istniejące produkty są rozpoznawane po `code/xmlId` i aktualizowane.

```powershell
npm run bitrix:products:pilot -- --confirm=MOONGLASS
npm run bitrix:verify
```

Oczekiwany wynik:

```text
Produkty MoonGlass w mapowaniu: 18
Weryfikacja OK.
Pozostałe działania: 0
```

## PowerShell 5.1 i polskie znaki

Pliki raportów są zapisane jako UTF-8 bez BOM. Windows PowerShell 5.1 wymaga jawnego kodowania:

```powershell
Get-Content .bitrix24\audit.json -Raw -Encoding UTF8 | ConvertFrom-Json
```

Bez `-Encoding UTF8` tekst może być pokazany jako `OĹ›wietlenie`, `uchwytĂłw` lub `300Ă—306`, mimo że plik i dane API są poprawne.

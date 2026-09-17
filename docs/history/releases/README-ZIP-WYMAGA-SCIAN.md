# Poprawka: rolety ZIP wymagają ścian

Ta paczka koryguje regułę biznesową po Etapie A.

## Zachowanie po zmianie

- przy opcji `Brak ścian` przyciski ZIP są nieaktywne,
- po zmianie ścian na `Brak` wcześniej wybrane ZIP-y są automatycznie usuwane,
- warstwa wyceny odrzuca konfigurację ZIP bez ścian,
- starszy kalkulator i generator pozycji Bitrix24 nie doliczają ZIP bez ścian,
- T4 został zmieniony na prawidłową konfigurację ze ścianami przezroczystymi.

## Nowy T4

- wymiary: 450 × 506 cm,
- ściany przezroczyste,
- ZIP prawy,
- markiza,
- LED punktowe,
- oczekiwana suma: 53 361 zł brutto.

## Instalacja

Rozpakuj paczkę do katalogu głównego:

`C:\Projects\glass-system-web`

z nadpisaniem plików.

Następnie:

```powershell
cd C:\Projects\glass-system-web\app
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run lint
npm run build
```

Test ręczny:

1. Otwórz `/kalkulator`.
2. Ustaw `Ściany: Brak` — ZIP Lewa/Prawa/Przód mają być wyszarzone.
3. Dodaj ściany — ZIP-y mają się odblokować.
4. Wybierz ZIP, a następnie ustaw `Ściany: Brak` — ZIP ma zostać automatycznie odznaczony, a cena obniżona.
5. Otwórz `/api/dev/quote-check` — wynik powinien wskazać 10/10 testów.

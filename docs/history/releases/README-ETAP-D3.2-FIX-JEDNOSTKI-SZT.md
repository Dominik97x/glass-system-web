# Etap D3.2 — poprawka wykrywania jednostki „szt.”

## Problem

Produkcja zapytania została poprawnie zapisana w Neon, ale synchronizacja Bitrix24 zatrzymała się na komunikacie:

`Nie znaleziono jednostki „szt.” w katalogu Bitrix24.`

Test D2 wcześniej potwierdził, że jednostka istnieje i ma kod 796. Błąd dotyczył odczytu metadanych w D3: zapytanie nie wybierało wszystkich pól jednostki i nie sprawdzało kodu 796.

## Poprawka

- jawnie pobiera `id`, `code`, `measureTitle`, `symbol`, `symbolIntl`, `symbolLetterIntl`,
- w pierwszej kolejności rozpoznaje jednostkę po kodzie `796`,
- zachowuje awaryjne rozpoznawanie po nazwie/symbolu,
- przy błędzie pokazuje dostępne kody zamiast mylącej instrukcji.

## Instalacja

Rozpakuj ZIP bezpośrednio do katalogu głównego projektu:

`C:\Projects\glass-system-web`

Następnie:

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
```

Uruchom ponownie serwer developerski, aby wyczyścić cache metadanych:

```powershell
npm run dev
```

Nie wysyłaj ponownie formularza. Istniejące zapytanie jest zapisane w Neon. Ponów synchronizację z panelu administratora albo poleceniem:

```powershell
npm run bitrix:retry-pending -- --limit=20
```

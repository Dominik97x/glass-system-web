MoonGlass D6.6.3.1 — lint hotfix

Usuwa nieużywaną zmienną `taxIncluded` w funkcji przygotowującej podgląd zmiany VAT.
Zmiana nie wpływa na obliczenia ani zapis danych; usuwa ostrzeżenie ESLint:
@typescript-eslint/no-unused-vars.

Instalacja:
1. Rozpakuj do C:\Projects\glass-system-web
2. Potwierdź zastąpienie pliku.
3. Uruchom w app:
   npm run lint
   npm run build

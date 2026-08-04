# Pakiet stabilizacyjny — Etap A

Pakiet został przygotowany na podstawie snapshotu `glass-system-web-review.zip` z 2026-08-04.

## Zakres

Pakiet:

- usuwa wykryte blokady TypeScript w lokalnym kodzie projektu,
- odtwarza brakujące typy Bitrix24,
- ujednolica kategorię ścian do `walls`,
- dopuszcza ZIP bez ścian zgodnie z testem T4,
- poprawia mapowanie LED CCT na `ledStripGross`,
- poprawia mapowanie dachu przyciemnianego,
- blokuje jednoczesny wybór LED punktowego i CCT na poziomie usługi,
- blokuje dach szklany 550/600 oraz niepublikowane szkło mleczne na poziomie usługi,
- rozszerza diagnostykę wymiarów o długości 550 i 600,
- zastępuje developerski `quote-check` dokładnymi testami T1–T10.

## Wynik weryfikacji

- T1–T10: 10/10 OK,
- rekordy wymiarów: 140/140,
- brak brakujących kluczy wymiarów,
- brak cen ujemnych,
- dach szklany 550/600 wyłączony.

Szczegóły: `weryfikacja-phase-a.json`.

## Instalacja

1. Zapisz bieżący stan w osobnej gałęzi lub wykonaj kopię projektu.
2. Rozpakuj ten ZIP do katalogu głównego:

   `C:\Projects\glass-system-web`

3. Zezwól na nadpisanie plików w folderze `app`.
4. W PowerShellu uruchom:

```powershell
cd C:\Projects\glass-system-web\app
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run lint
npm run build
```

5. Po udanym buildzie uruchom aplikację:

```powershell
npm run dev
```

6. Sprawdź:

- `/kalkulator`,
- `/api/dev/quote-check`,
- `/api/dev/pricing/snapshot-coverage`.

## Ważne ograniczenie

Pakiet nie realizuje jeszcze Etapu B i C:

- serwer nadal powinien zostać przebudowany tak, aby sam przeliczał cenę z konfiguracji,
- `GET /api/inquiries` i `/admin/leady` nadal wymagają autoryzacji przed publikacją,
- produkcja nadal powinna przejść z lokalnego JSON-a na Postgres.

W środowisku audytowym nie można było uruchomić rzeczywistego `next build`, ponieważ instalacja zależności npm była blokowana przez dostępny rejestr pakietów. Wykonano pełny statyczny audyt lokalnych typów z TypeScript oraz niezależną weryfikację T1–T10 i wszystkich 140 kluczy snapshotu.

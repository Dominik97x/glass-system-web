# Glass System — Etap B: serwerowe przeliczanie wyceny

Pakiet jest nakładką na projekt po Etapie A i poprawce „ZIP wymaga ścian”.
Rozpakuj go do katalogu głównego repozytorium `C:\Projects\glass-system-web`
z nadpisaniem istniejących plików.

## Co zmienia pakiet

1. Przeglądarka wysyła do `POST /api/inquiries` wyłącznie:
   - dane klienta,
   - konfigurację produktu.
2. Pola ceny przesłane ręcznie przez klienta (`quote`, `items`, `totalGross`,
   `currency`, `configurationSummary`) są ignorowane.
3. Serwer tworzy własną wycenę z `published-pricing.generated.json`.
4. Do repozytorium leadów, bazy, e-maila i Bitrix24 trafia wyłącznie wycena
   wygenerowana na serwerze.
5. `source`, `createdAt`, pozycje, suma i waluta są ustalane przez serwer.
6. Walidator po stronie API sprawdza dokładnie dozwolone wymiary, warianty i
   typy pól.
7. Reguły biznesowe są wymuszane również po stronie serwera:
   - ZIP wymaga ścian,
   - dach szklany dla 550/600 cm jest odrzucany,
   - LED punktowe i LED CCT nie mogą być zaznaczone jednocześnie,
   - warianty `glass_milky` nie są publikowane na stronie.

## Nowy kontrakt POST /api/inquiries

```json
{
  "customer": {
    "name": "Jan Kowalski",
    "email": "jan@example.com",
    "phone": "500600700",
    "message": "Proszę o kontakt."
  },
  "configuration": {
    "width": 606,
    "length": 300,
    "walls": "glass_clear",
    "roof": "polycarbonate_clear",
    "hasFrontZip": false,
    "hasLeftZip": false,
    "hasRightZip": false,
    "hasAwning": false,
    "hasLed": false,
    "hasCob": false,
    "hasHandles": false,
    "hasBrushes": false,
    "hasLevelingProfile": false
  }
}
```

## Instalacja

W katalogu głównym repozytorium warto najpierw utworzyć gałąź:

```powershell
git switch -c feat/server-side-pricing
```

Następnie rozpakuj ZIP do:

```text
C:\Projects\glass-system-web
```

z nadpisaniem plików i uruchom:

```powershell
cd C:\Projects\glass-system-web\app
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run lint
npm run build
```

## Test działania

Po poprawnym buildzie:

```powershell
npm run dev
```

Otwórz:

```text
http://localhost:3000/api/dev/quote-check
http://localhost:3000/api/dev/inquiries/server-quote-check
```

Oczekiwane wyniki:

- `/api/dev/quote-check`: `success: true`, `passed: 10`, `failed: 0`;
- `/api/dev/inquiries/server-quote-check`: `success: true`, `passed: 8`,
  `failed: 0`.

Drugi endpoint sprawdza między innymi próbę przesłania ceny `1 zł`. Serwer
powinien ją zignorować i przeliczyć prawidłową cenę z JSON-a.

## Ręczny test formularza

Wyślij testowe zapytanie z kalkulatora. Komunikat sukcesu powinien zawierać:

```text
Zweryfikowana wartość konfiguracji: ... zł
```

W zapisanym leadzie `quote.totalGross` oraz `quote.items` powinny odpowiadać
konfiguracji i nie pochodzić z danych przesłanych przez przeglądarkę.

## Zakres poza Etapem B

Pakiet nie zabezpiecza jeszcze `GET /api/inquiries` ani `/admin/leady`.
Autoryzacja panelu i API leadów jest kolejnym etapem.

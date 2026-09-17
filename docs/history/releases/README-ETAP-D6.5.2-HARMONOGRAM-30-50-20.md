# MoonGlass D6.5.2 — harmonogram płatności 30% / 50% / 20%

## Decyzja biznesowa

Domyślny schemat płatności MoonGlass jest na tym etapie stały:

1. **I rata — 30%**: zaliczka po podpisaniu umowy.
2. **II rata — 50%**: po dostarczeniu konstrukcji i materiałów na miejsce realizacji, przed rozpoczęciem montażu.
3. **III rata — 20%**: po zakończeniu montażu i podpisaniu protokołu odbioru.

Dla Deala o wartości `31 141,00 zł` kwoty wynoszą:

- I rata: `9 342,30 zł`,
- II rata: `15 570,50 zł`,
- III rata: `6 228,20 zł`.

## Zawartość pakietu

- nakładka kodu D6.5.2,
- proforma dla osoby prywatnej,
- proforma dla firmy,
- niniejsza instrukcja.

## Kolejność wdrożenia

1. Zatrzymaj `npm run dev`.
2. Rozpakuj nakładkę do `C:\Projects\glass-system-web`, łącząc folder `app`.
3. W `C:\Projects\glass-system-web\app` wykonaj:

```powershell
npm run lint
npm run build
npm run bitrix:payments:305020:audit
npm run bitrix:payments:305020:plan
```

Oczekiwane przed zastosowaniem: `0/2`, brakujące `2`, konflikty `0`.

4. Utwórz pola:

```powershell
npm run bitrix:payments:305020:apply -- --confirm=MOONGLASS-PAYMENT-SCHEDULE
npm run bitrix:payments:305020:verify
npm run bitrix:verify
```

5. Uzupełnij istniejący Deal nr 3 automatycznie:

```powershell
npm run bitrix:payments:305020:set -- --deal-id=3 --due-date=2026-08-12 --confirm=MOONGLASS-PAYMENT-SCHEDULE-DEAL
```

Dla nowych zapytań z kalkulatora kwoty 30/50/20 będą zapisywane automatycznie podczas synchronizacji z Bitrix24.

## Pola używane przez szablony

- `Zaliczka [%]` — istniejące pole, ustawiane na `30`,
- `Zaliczka / proforma` — I rata 30%,
- `Termin wpłaty zaliczki` — termin I raty,
- `II rata — 50% — kwota` — nowe pole,
- `III rata — 20% — kwota` — nowe pole,
- `Pozostało do zapłaty` — 70% po I racie.

## Wgranie szablonów

W Dealu wybierz `Dokument` → `Dodaj nowy szablon` i wgraj odpowiednio:

- `MoonGlass-D6.5.2-Proforma-Osoba-Prywatna-305020-PILOT.docx`,
- `MoonGlass-D6.5.2-Proforma-Firma-305020-PILOT.docx`.

Nazwy w Bitrix24:

- `MoonGlass — Proforma — Osoba prywatna — 30-50-20 — PILOT D6.5.2`,
- `MoonGlass — Proforma — Firma — 30-50-20 — PILOT D6.5.2`.

Powiąż oba z lejkiem `01 Sprzedaż z pomiarem`.

## Ważne

Szablony nadal są pilotażowe. Dane sprzedawcy MoonGlass, rachunek bankowy, numeracja i treść dokumentów wymagają zatwierdzenia przed wysyłaniem klientom.

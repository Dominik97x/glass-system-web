# MoonGlass — Bitrix24 payment schedule webhook v1

Dodaje handler HTTP dla istniejącej polityki 30/50/20.

## Pliki

Skopiuj do folderu `app`:

- `src/integrations/bitrix24/Bitrix24PaymentScheduleSyncService.ts`
- `src/app/api/bitrix24/payment-schedule-sync/route.ts`

Wymagany jest już istniejący:
- `src/lib/payment-schedule-sync-policy.ts`
- `src/lib/payment-schedule.ts`

## Lokalny test

Uruchom aplikację:

```powershell
npm run dev
```

W drugim terminalu, z folderu `app`:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/bitrix24/payment-schedule-sync" `
  -ContentType "application/json" `
  -Body '{"dealId":25}'
```

Lokalny test ZAWSZE działa jako dry-run i niczego nie zapisuje.

Dla aktualnego Deala #25 na etapie `Nowe zapytanie` oczekiwane:
- `success: true`
- `source: local_test`
- `result.applied: false`
- `result.decision.action: before_trigger_stage`

## Później — outgoing webhook

Po lokalnym teście:
1. wystawimy endpoint publicznie,
2. utworzymy w Bitrix24 outgoing webhook dla `ONCRMDEALUPDATE`,
3. wygenerowany Application Token wpiszemy lokalnie/na serwerze jako:

```env
BITRIX24_OUTGOING_WEBHOOK_TOKEN=
```

Nie należy publikować tego tokena w repozytorium.

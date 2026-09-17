# Bitrix24 — blueprint automatyzacji MoonGlass

Kod źródłowy blueprintu znajduje się w:

```text
app/scripts/bitrix24/automation-blueprint.ts
```

Generator planu:

```text
app/scripts/bitrix24/automation-planner.ts
```

## Założenia

1. Roboty działają na osobie odpowiedzialnej za Deal, a nie na stałym użytkowniku.
2. Profil `starter` obejmuje reguły P0 potrzebne małemu zespołowi.
3. Profil `full` dodaje przypomnienia i kontrole P1.
4. Zaplanowane roboty w danym etapie są anulowane przez Bitrix24 po opuszczeniu etapu — należy to każdorazowo potwierdzić testem.
5. Wygrany Deal jest przenoszony do lejka realizacji, nie kopiowany.
6. Komunikacja e-mail/SMS do klienta nie jest częścią pierwszego wdrożenia D5.

## Obszary

### Sprzedaż

- pierwszy kontakt,
- próby kontaktu,
- kwalifikacja,
- zdjęcia,
- pomiar,
- oferta i follow-up,
- odroczenia,
- tunel do realizacji.

### Realizacja

- kontrola kompletności,
- materiały i dostawca,
- montaż,
- płatność,
- zamknięcie dokumentacji.

### Reklamacje

- przyjęcie i analiza,
- decyzja,
- materiał reklamacyjny,
- termin naprawy,
- protokół,
- zamknięcie.

Szczegółowy plan z rzeczywistymi ID lejków i etapów generuje polecenie:

```powershell
npm run bitrix:automations:plan -- --profile=starter
```

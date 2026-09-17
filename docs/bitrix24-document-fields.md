# Bitrix24 — pola dokumentowe MoonGlass (D6.2)

D6.2 rozszerza główny blueprint CRM o 17 pól potrzebnych do ofert, umów, załącznika technicznego i proform.

## Pola Firmy

| Alias | Etykieta | Typ |
|---|---|---|
| `MG_KRS` | KRS | string |
| `MG_COMPANY_REPRESENTATIVE` | Osoba reprezentująca firmę | string |
| `MG_COMPANY_REPRESENTATIVE_ROLE` | Funkcja reprezentanta | string |

## Pola Deala

| Alias | Etykieta | Typ |
|---|---|---|
| `MG_OFFER_NUMBER` | Numer oferty | string |
| `MG_CONTRACT_NUMBER` | Numer umowy | string |
| `MG_CONTRACT_DATE` | Data zawarcia umowy | date |
| `MG_PLANNED_COMPLETION_DATE` | Planowany termin realizacji | date |
| `MG_ADVANCE_PERCENT` | Zaliczka [%] | double |
| `MG_ADVANCE_DUE_DATE` | Termin wpłaty zaliczki | date |
| `MG_PAYMENT_METHOD` | Sposób płatności | enumeration |
| `MG_CONSTRUCTION_COLOR` | Kolor konstrukcji | string |
| `MG_SITE_PREPARATION` | Przygotowanie miejsca / podłoża | multiline string |
| `MG_TECHNICAL_NOTES` | Uwagi techniczne do dokumentów | multiline string |
| `MG_DOCUMENT_ISSUER` | Osoba wystawiająca dokument | employee |
| `MG_DOCUMENT_VERSION` | Wersja dokumentacji | string |
| `MG_OFFER_NOTES` | Uwagi do oferty | multiline string |
| `MG_CONTRACT_NOTES` | Uwagi do umowy | multiline string |

## Polecenia

```powershell
npm run bitrix:documents:fields:audit
npm run bitrix:documents:fields:plan
npm run bitrix:documents:fields:apply -- --confirm=MOONGLASS-DOCUMENT-FIELDS
npm run bitrix:documents:fields:verify
```

Raporty są zapisywane w `app/.bitrix24`:

- `document-fields-audit.json`,
- `document-fields-plan.json` i `.md`,
- `document-fields-verify.json` i `.md`,
- odświeżone `mapping.generated.json`.

Skrypt nie usuwa pól i nie zmienia typu pola, które już istnieje. Przy konflikcie typu zatrzymuje operację przed zapisem pozostałych zmian.

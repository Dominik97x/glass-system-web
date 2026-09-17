# ETAP D6.6.1 — równoległe ceny netto i brutto

## Cel

Wprowadzić do technicznego snapshotu cennika dwie niezależne wartości:

- cenę sprzedaży netto dla Bitrix24,
- dotychczasową cenę brutto 8% dla kalkulatora strony.

Ten etap nie przełącza jeszcze produkcyjnej synchronizacji Deali na netto. Strona nadal czyta pola `*Gross`, więc wyceny widoczne dla klienta pozostają bez zmian.

## Źródło

`docs/templates/model_cennik_uslug_wycena_strona_moonglass_2026-08-06_FIX22_v2_NETTO_BITRIX_AUDYT.xlsx`

Importer czyta:

- `10_EXPORT_STRONA`,
- `11_EXPORT_NETTO_BITRIX`.

## Model

Przykład 300 × 306 cm:

- `constructionNet = 7419`,
- `constructionGross = 8013`.

Cena kanoniczna snapshotu to netto, ale strona zachowuje dotychczasowe, zaokrąglone ceny brutto.

## Uruchomienie

W katalogu `app`:

```powershell
npm run pricing:import
npm run pricing:verify-net
npm run lint
npm run build
```

Oczekiwany wynik audytu:

- 988 pełnych zgodności,
- 61 różnic do 1 zł wynikających z zaokrągleń,
- 1 znana różnica powyżej 1 zł: dach szklany przyciemniany 350 × 706 cm.

## Bezpieczeństwo

W D6.6.1 nie są wykonywane żadne zapisy do Bitrix24 i nie jest zmieniany katalog produktów. Produkcyjny `Bitrix24InquiryProductRowBuilder` nadal działa jak przed nakładką. Przełączenie nowych Deali na `price = netto` oraz `taxIncluded = N` będzie osobnym etapem D6.6.2 po weryfikacji importu, lint i build.

# Bitrix24 full catalog — D4

Pełny katalog publikacyjny jest generowany z
`published-pricing.generated.json` przez
`app/scripts/bitrix24/catalog-products.ts`.

## Polecenia

```text
bitrix:products:full:source
bitrix:products:full:plan
bitrix:products:full:apply
bitrix:products:full:verify
```

Importer jest idempotentny i identyfikuje produkty po `code/xmlId` w formacie
`MG-...-D{głębokość}-W{szerokość}`. Ceny są przechowywane w bazowym typie ceny
katalogu, a jednostką jest `szt.` (kod 796).

D4.0 obejmuje 1220 produktów website+crm. Pozycje CRM-only bez zatwierdzonej
ceny w snapshotcie publikacyjnym są celowo pominięte i wymagają osobnego
manifestu D4.1.

# Etap D3.5 — poprawka powiązania pozycji Deala z katalogiem Bitrix24

## Problem

Produkcjna synchronizacja D3 próbowała wyszukiwać produkt przez `catalog.product.list`
bez obowiązkowego pola `iblockId`. Bitrix24 zwracał błąd:

```text
Required select fields: iblockId
```

W rezultacie Deal był synchronizowany, ale jego pozycje były zapisywane jako
niestandardowe zamiast jako pozycje powiązane z istniejącymi produktami katalogu.

## Zmiana

`Bitrix24InquiryProductRowBuilder` teraz:

1. odczytuje identyfikatory katalogów przez `catalog.catalog.list`,
2. buforuje listę `iblockId`,
3. przekazuje `id` i `iblockId` w `select`,
4. przekazuje `iblockId` w filtrze `catalog.product.list`,
5. wyszukuje produkt po stabilnym `xmlId`/SKU `MG-*`,
6. przy kolejnej synchronizacji zastępuje pozycje niestandardowe pozycjami
   powiązanymi z katalogiem.

## Instalacja

Rozpakuj nakładkę bezpośrednio do katalogu głównego projektu:

```text
C:\Projects\glass-system-web
```

Następnie:

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
npm run bitrix:verify
npm run dev
```

Nie wykonuj ponownie migracji bazy, provisionera ani importu pilotażowego.

## Weryfikacja

Otwórz istniejące zapytanie `inq_8af94c03-fcfe-4295-8594-d258e2d6e514`
i kliknij `Synchronizuj ponownie`.

W terminalu nie powinny już pojawić się komunikaty:

```text
Nie udało się odczytać produktu katalogowego...
Required select fields: iblockId
```

Deal powinien nadal mieć 6 pozycji i sumę 31 141 zł, ale pozycje dla wymiaru
300×306 cm będą powiązane z istniejącymi produktami katalogowymi.

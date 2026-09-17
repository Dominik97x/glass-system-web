# ETAP D2 — test Contact + Deal + produkty w Bitrix24

Pakiet dodaje kontrolowany, idempotentny test prawdziwego przepływu CRM.

## Co test tworzy lub aktualizuje

- jeden techniczny Kontakt: `Jan Testowy MoonGlass [D2]`,
- jeden Deal: `[TEST D2] Ogród zimowy 300×306 cm — Jan Testowy`,
- sześć pozycji produktowych z katalogu pilotażowego,
- pola konfiguracji i zweryfikowaną kwotę brutto,
- raport `.bitrix24/test-flow.json` i `.bitrix24/test-flow.md`.

Kontakt jest wyszukiwany po testowym e-mailu i telefonie przez `crm.duplicate.findbycomm`. Deal jest wyszukiwany po stabilnym polu `MG_WEB_INQUIRY_ID`, dlatego kolejne uruchomienie aktualizuje ten sam rekord zamiast tworzyć duplikat. `XML_ID` pozostaje zapisany jako dodatkowy identyfikator, ale nie jest używany w filtrze, ponieważ Bitrix24 nie dopuszcza takiego filtrowania dla Deali.

## Konfiguracja testowa

- ogród zimowy 300×306 cm,
- dach: szkło bezbarwne,
- ściany: szkło bezbarwne,
- markiza,
- LED CCT,
- profil poziomujący / przygotowanie fundamentu,
- VAT 8% zawarty w cenach.

Montaż nie jest osobną płatną pozycją, ponieważ opublikowany cennik strony przechowuje ceny brutto komponentów wraz z przypisanymi kosztami montażu i realizacji. Nie rozbijamy ceny bez danych źródłowych.

## Uruchomienie

```powershell
cd C:\Projects\glass-system-web\app
npm run lint
npm run build
npm run bitrix:verify
npm run bitrix:test-flow -- --confirm=MOONGLASS
```

Polecenie `bitrix:test-flow` ponownie synchronizuje pilot produktów, aby ustawić ich jednostkę na `szt.`. Produkty są rozpoznawane po kodach `MG-*`, więc nie powstają duplikaty.

## Oczekiwany wynik

```text
Test D2 zakończony pomyślnie.
Kontakt: #...; kontrola duplikatu: OK
Deal: #...; lejek i etap: OK
Pozycje produktowe: 6
Suma: 31141.00 PLN
VAT: 8% (ceny zawierają VAT)
```

Po udanym teście należy otworzyć Deal w Bitrix24 i potwierdzić wizualnie klienta, pola oraz pozycje. Następny etap to D3: trwała synchronizacja formularza i bazy Neon z CRM.
